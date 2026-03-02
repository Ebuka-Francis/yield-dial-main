/**
 * Destaker CRE Workflow — Yield Prediction Market Settlement
 *
 * Production Chainlink Runtime Environment (CRE) workflow that:
 *   1. Fires on a cron schedule (every 30 min)
 *   2. Fetches live yield data from DeFiLlama (~18 000 pools)
 *   3. Calls Gemini AI to determine YES/NO outcome per market
 *   4. Encodes a batch settlement report and writes it on-chain
 *      via the Chainlink Forwarder → DestakerMarket.onReport()
 *
 * Simulate:  cre workflow simulate destaker-settlement --target staging-settings
 * Deploy:    cre workflow deploy destaker-settlement --target production-settings
 */

import {
  CronCapability,
  HTTPClient,
  EVMClient,
  handler,
  Runner,
  getNetwork,
  hexToBase64,
  consensusIdenticalAggregation,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk"
import { encodeAbiParameters } from "viem"
import { z } from "zod"

// ════════════════════════════════════════════════════════════════
//  CONFIG SCHEMA  (validated against config.staging.json)
// ════════════════════════════════════════════════════════════════

const marketSchema = z.object({
  id: z.string(),
  asset: z.string(),
  threshold: z.number(),
  settlementDate: z.string(),
})

const configSchema = z.object({
  schedule: z.string(),
  defillamaApiUrl: z.string(),
  geminiModel: z.string(),
  geminiEndpoint: z.string().optional(),
  gasLimit: z.string().optional(),
  markets: z.array(marketSchema),
  // EVM target for on-chain settlement write
  evms: z
    .array(
      z.object({
        chainSelectorName: z.string(),
        contractAddress: z.string(),
      })
    )
    .optional(),
})

type Config = z.infer<typeof configSchema>

// ════════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_GEMINI_ENDPOINT =
  "https://ai.gateway.lovable.dev/v1/chat/completions"
const DEFAULT_GAS_LIMIT = "500000"

// Outcome enum matches DestakerMarket.Outcome: 0=UNRESOLVED, 1=YES, 2=NO
const OUTCOME_YES = 1
const OUTCOME_NO = 2

/** Asset → DeFiLlama symbol/project matching patterns. */
const ASSET_PATTERNS: Record<
  string,
  { symbols: string[]; projects: string[] }
> = {
  stETH: { symbols: ["STETH", "WSTETH"], projects: ["lido"] },
  rETH: { symbols: ["RETH"], projects: ["rocket-pool"] },
  cbETH: { symbols: ["CBETH"], projects: ["coinbase-wrapped-staked-eth"] },
  mSOL: { symbols: ["MSOL"], projects: ["marinade-finance", "marinade"] },
  jitoSOL: { symbols: ["JITOSOL"], projects: ["jito"] },
  EigenLayer: {
    symbols: ["EIGEN", "RESTAKED"],
    projects: ["eigenlayer", "eigen"],
  },
  sfrxETH: { symbols: ["SFRXETH", "FRXETH"], projects: ["frax-ether"] },
  bSOL: { symbols: ["BSOL"], projects: ["blazestake", "solblaze"] },
  "Aave V3": { symbols: ["USDC", "WETH", "USDT"], projects: ["aave-v3"] },
  "Lido stETH": { symbols: ["STETH", "WSTETH"], projects: ["lido"] },
  Compound: {
    symbols: ["CETH", "CUSDC", "ETH"],
    projects: ["compound-v3", "compound"],
  },
  "Pendle PT": { symbols: ["PT-", "PENDLE"], projects: ["pendle"] },
}

// ════════════════════════════════════════════════════════════════
//  AI PROMPT & TOOL
// ════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a DeFi yield analysis AI agent integrated into a Chainlink CRE Workflow.
Your role is to determine whether a yield prediction market should settle YES or NO.
You receive REAL on-chain yield data from DeFiLlama. Base your decision ONLY on the data provided.
Respond using the settle_market tool with outcome, confidence, and reasoning.`

const SETTLE_MARKET_TOOL = {
  type: "function" as const,
  function: {
    name: "settle_market",
    description: "Settle a yield prediction market",
    parameters: {
      type: "object",
      properties: {
        outcome: { type: "string", enum: ["YES", "NO"] },
        confidence: { type: "number" },
        reasoning: { type: "string" },
      },
      required: ["outcome", "confidence", "reasoning"],
    },
  },
}

// ════════════════════════════════════════════════════════════════
//  TYPES & HELPERS
// ════════════════════════════════════════════════════════════════

interface Pool {
  pool: string
  chain: string
  project: string
  symbol: string
  apy: number | null
  apyBase: number | null
  apyMean30d: number | null
  tvlUsd: number | null
}

interface Settlement {
  marketId: number
  outcome: number // 1=YES, 2=NO
  finalApyBps: number
}

function filterPools(allPools: Pool[], asset: string): Pool[] {
  const patterns = ASSET_PATTERNS[asset]
  if (!patterns) return []
  return allPools
    .filter((p) => {
      const sym = (p.symbol ?? "").toUpperCase()
      const proj = (p.project ?? "").toLowerCase()
      return (
        patterns.symbols.some((s) => sym.includes(s)) ||
        patterns.projects.some((pr) => proj.includes(pr))
      )
    })
    .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))
    .slice(0, 10)
}

function bestApy(pools: Pool[]): number {
  if (pools.length === 0) return 0
  return pools[0].apy ?? pools[0].apyBase ?? 0
}

function buildUserPrompt(
  asset: string,
  threshold: number,
  settlementDate: string,
  pools: Pool[],
  currentApy: number
): string {
  const best = pools[0]
  const mean30d = best?.apyMean30d ?? currentApy
  const gap = currentApy - threshold

  return `Market: Will ${asset} APY exceed ${threshold}% by ${settlementDate}?

Live DeFiLlama Data (${pools.length} pools):
- Current APY: ${currentApy.toFixed(4)}%
- 30d Mean APY: ${mean30d.toFixed(4)}%
- TVL: $${((best?.tvlUsd ?? 0) / 1e9).toFixed(2)}B
- Project: ${best?.project ?? "unknown"} (${best?.chain ?? "unknown"})
${pools
  .slice(0, 5)
  .map(
    (p) =>
      \`  - \${p.project} (\${p.chain}): APY=\${(p.apy ?? 0).toFixed(2)}%, TVL=$\${(
        (p.tvlUsd ?? 0) / 1e6
      ).toFixed(1)}M\`
  )
  .join("\n")}

Threshold: ${threshold}%
Gap: ${gap.toFixed(4)}% ${gap >= 0 ? "ABOVE" : "BELOW"} threshold

Determine: Should this market settle YES or NO?`
}

// ════════════════════════════════════════════════════════════════
//  WORKFLOW DEFINITION
// ════════════════════════════════════════════════════════════════

function initWorkflow(config: Config) {
  const cron = new CronCapability()

  // Resolve EVM target for on-chain settlement write
  const evmTarget = config.evms?.[0]
  let evmClient: EVMClient | undefined
  if (evmTarget) {
    const network = getNetwork({
      chainFamily: "evm",
      chainSelectorName: evmTarget.chainSelectorName,
      isTestnet: evmTarget.chainSelectorName.includes("testnet"),
    })
    if (network) {
      evmClient = new EVMClient(network.chainSelector.selector)
    }
  }

  const geminiEndpoint = config.geminiEndpoint ?? DEFAULT_GEMINI_ENDPOINT
  const gasLimit = config.gasLimit ?? DEFAULT_GAS_LIMIT

  return [
    handler(
      cron.trigger({ schedule: config.schedule }),

      // ── Main callback: fires on every cron tick ─────────────
      (runtime: Runtime<Config>): string => {
        // Determine which markets are due for settlement
        const now = Date.now()
        const dueMarkets = config.markets.filter(
          (m) => now >= new Date(m.settlementDate).getTime()
        )

        if (dueMarkets.length === 0) {
          runtime.log("No markets due for settlement")
          return "No markets due for settlement"
        }

        runtime.log(`${dueMarkets.length} market(s) due for settlement`)

        // ────────────────────────────────────────────────
        // STEP 1 — Fetch DeFiLlama pools (node-level → consensus)
        // ────────────────────────────────────────────────
        const rawYieldData = runtime
          .runInNodeMode(
            (nodeRuntime: NodeRuntime<Config>): string => {
              const httpClient = new HTTPClient()
              const response = httpClient
                .sendRequest(nodeRuntime, {
                  url: config.defillamaApiUrl,
                  method: "GET",
                })
                .result()

              const body = new TextDecoder().decode(response.body)
              const parsed = JSON.parse(body)
              const pools: Pool[] = parsed.data ?? []

              // Pre-filter to only pools matching our due-market assets
              // to keep the consensus payload small.
              const relevantPools: Pool[] = []
              const seen = new Set<string>()
              for (const market of dueMarkets) {
                for (const p of filterPools(pools, market.asset)) {
                  if (!seen.has(p.pool)) {
                    seen.add(p.pool)
                    relevantPools.push(p)
                  }
                }
              }

              return JSON.stringify(relevantPools)
            },
            consensusIdenticalAggregation<string>()
          )()
          .result()

        const allPools: Pool[] = JSON.parse(rawYieldData)

        // ────────────────────────────────────────────────
        // STEP 2 — AI settlement per market (node-level → consensus)
        // ────────────────────────────────────────────────
        const settlementsJson = runtime
          .runInNodeMode(
            (nodeRuntime: NodeRuntime<Config>): string => {
              const httpClient = new HTTPClient()

              // Retrieve Gemini API key from CRE secrets
              const secret = nodeRuntime
                .getSecret({ id: "GEMINI_API_KEY" })
                .result()
              const apiKey = secret.value

              const settlements: Settlement[] = []

              for (const market of dueMarkets) {
                const pools = filterPools(allPools, market.asset)
                if (pools.length === 0) continue

                const currentApy = bestApy(pools)
                // Config IDs are "001"–"012"; on-chain IDs are 0–11
                const onChainId = parseInt(market.id, 10) - 1
                // APY → basis points: 3.45% → 345
                const finalApyBps = Math.round(currentApy * 100)

                // Default: deterministic comparison (fallback if AI fails)
                let outcome =
                  currentApy >= market.threshold ? OUTCOME_YES : OUTCOME_NO

                try {
                  const prompt = buildUserPrompt(
                    market.asset,
                    market.threshold,
                    market.settlementDate,
                    pools,
                    currentApy
                  )

                  const requestBody = new TextEncoder().encode(
                    JSON.stringify({
                      model: config.geminiModel,
                      messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt },
                      ],
                      tools: [SETTLE_MARKET_TOOL],
                      tool_choice: {
                        type: "function",
                        function: { name: "settle_market" },
                      },
                    })
                  )

                  const aiResponse = httpClient
                    .sendRequest(nodeRuntime, {
                      url: geminiEndpoint,
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                      },
                      body: requestBody,
                    })
                    .result()

                  const aiBody = JSON.parse(
                    new TextDecoder().decode(aiResponse.body)
                  )
                  const toolCall =
                    aiBody.choices?.[0]?.message?.tool_calls?.[0]
                  if (toolCall) {
                    const args = JSON.parse(toolCall.function.arguments)
                    outcome =
                      args.outcome === "YES" ? OUTCOME_YES : OUTCOME_NO
                  }
                } catch {
                  // Fallback: deterministic comparison already set above
                }

                settlements.push({
                  marketId: onChainId,
                  outcome,
                  finalApyBps,
                })
              }

              return JSON.stringify(settlements)
            },
            consensusIdenticalAggregation<string>()
          )()
          .result()

        const settlements: Settlement[] = JSON.parse(settlementsJson)

        if (settlements.length === 0) {
          runtime.log("No valid settlements produced")
          return "No valid settlements"
        }

        runtime.log(
          `Settling ${settlements.length} market(s): ${settlements
            .map(
              (s) =>
                `#${s.marketId}=${
                  s.outcome === OUTCOME_YES ? "YES" : "NO"
                }@${s.finalApyBps}bps`
            )
            .join(", ")}`
        )

        // ────────────────────────────────────────────────
        // STEP 3 — Encode & write batch settlement on-chain
        // ────────────────────────────────────────────────
        if (!evmClient || !evmTarget) {
          return `Dry run: ${settlements.length} market(s) settled (no EVM target configured)`
        }

        // Encode as sequential ABI-encoded (uint256, uint8, uint256) tuples.
        // Each tuple is 3 × 32 = 96 bytes, matching DestakerMarket.onReport()
        // which decodes: abi.decode(report[i*96:(i+1)*96], (uint256, uint8, uint256))
        const abiTypes = settlements.flatMap(() => [
          { name: "marketId" as const, type: "uint256" as const },
          { name: "outcome" as const, type: "uint8" as const },
          { name: "finalApyBps" as const, type: "uint256" as const },
        ])
        const abiValues = settlements.flatMap((s) => [
          BigInt(s.marketId),
          s.outcome,
          BigInt(s.finalApyBps),
        ])

        const encoded = encodeAbiParameters(abiTypes, abiValues)

        // Generate DON-signed report
        const reportResponse = runtime
          .report({
            encodedPayload: hexToBase64(encoded),
            encoderName: "evm",
            signingAlgo: "ecdsa",
            hashingAlgo: "keccak256",
          })
          .result()

        // Submit via Chainlink Forwarder → DestakerMarket.onReport()
        evmClient
          .writeReport(runtime, {
            receiver: evmTarget.contractAddress,
            report: reportResponse,
            gasConfig: { gasLimit },
          })
          .result()

        return `Settled ${settlements.length} market(s) on-chain`
      }
    ),
  ]
}

// ════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ════════════════════════════════════════════════════════════════

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}

main()

// Re-export for use by helper modules
export { ASSET_PATTERNS }
export type { Config, Pool, Settlement }
