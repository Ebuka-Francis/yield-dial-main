/**
 * Destaker CRE Workflow: Yield Prediction Market Settlement
 * 
 * This is the main entry point for the Chainlink Runtime Environment (CRE) workflow.
 * It demonstrates:
 *   1. Cron trigger (scheduled execution every 30 minutes)
 *   2. Blockchain interaction (reading market state, writing settlement)
 *   3. External API integration (DeFiLlama for live yield data)
 *   4. AI agent integration (Gemini AI for settlement determination)
 *   5. Consensus aggregation (DON-level agreement on outcomes)
 * 
 * Architecture:
 *   [Cron Trigger] → [Fetch DeFiLlama Data] → [AI Settlement] → [On-chain Report]
 * 
 * CRE SDK Imports:
 *   import {
 *     CronCapability, HTTPClient, EVMClient,
 *     handler, consensusMedianAggregation, Runner,
 *     type NodeRuntime, type Runtime, type CronPayload
 *   } from "@chainlink/cre-sdk"
 * 
 * To simulate: cre workflow simulate destaker-settlement --target staging-settings
 * To deploy:   cre workflow deploy destaker-settlement --target production-settings
 */

// ============================================================
// TYPE DEFINITIONS (from types.ts)
// ============================================================

interface MarketConfig {
  id: string;
  asset: string;
  threshold: number;
  settlementDate: string;
}

interface WorkflowConfig {
  schedule: string;
  defillamaApiUrl: string;
  geminiModel: string;
  markets: MarketConfig[];
}

interface AISettlementResult {
  market_id: string;
  asset: string;
  current_apy: number;
  threshold: number;
  outcome: "YES" | "NO";
  confidence: number;
  reasoning: string;
  data_sources: string[];
  timestamp: string;
}

interface SettlementReport {
  workflow_id: string;
  execution_id: string;
  trigger_type: "cron" | "log_event";
  timestamp: string;
  chain: string;
  block_number: number | null;
  markets_settled: AISettlementResult[];
  total_markets: number;
  defillama_pools_fetched: number;
  ai_model: string;
  execution_time_ms: number;
  status: "success" | "partial" | "failed";
}

// ============================================================
// CRE WORKFLOW DEFINITION
// ============================================================

/**
 * CRE Workflow Entry Point
 * 
 * This follows the CRE SDK pattern:
 * 
 * ```typescript
 * import { Runner } from "@chainlink/cre-sdk"
 * import { z } from "zod"
 * 
 * const configSchema = z.object({
 *   schedule: z.string(),
 *   defillamaApiUrl: z.string(),
 *   geminiModel: z.string(),
 *   markets: z.array(z.object({
 *     id: z.string(),
 *     asset: z.string(),
 *     threshold: z.number(),
 *     settlementDate: z.string(),
 *   })),
 * })
 * 
 * type Config = z.infer<typeof configSchema>
 * 
 * export async function main() {
 *   const runner = await Runner.newRunner<Config>({ configSchema })
 *   runner.run(initWorkflow)
 * }
 * ```
 */

// ============================================================
// STEP 1: CRON TRIGGER
// ============================================================

/**
 * CRE Cron Trigger Configuration
 * 
 * ```typescript
 * const cron = new CronCapability()
 * const trigger = cron.trigger({ schedule: config.schedule })
 * ```
 * 
 * Schedule: "0 * /30 * * * *" (every 30 minutes)
 * This triggers the settlement check workflow periodically.
 */

// ============================================================
// STEP 2: BLOCKCHAIN READ (Chain Reader)
// ============================================================

/**
 * Read current market state from on-chain contract
 * 
 * CRE Pattern:
 * ```typescript
 * const evmClient = new EVMClient()
 * const marketState = evmClient.read({
 *   chainSelectorName: "ethereum-testnet-sepolia",
 *   contractAddress: MARKET_CONTRACT_ADDRESS,
 *   abi: SimpleMarketABI,
 *   method: "getMarket",
 *   args: [marketId],
 * })
 * ```
 * 
 * SimpleMarket.sol ABI:
 * ```solidity
 * struct Market {
 *     string asset;
 *     uint256 threshold;     // basis points (350 = 3.50%)
 *     uint256 settlementDate;
 *     bool settled;
 *     string outcome;        // "YES" or "NO"
 *     uint256 totalYesShares;
 *     uint256 totalNoShares;
 * }
 * 
 * event SettlementRequested(uint256 indexed marketId, string question);
 * event MarketSettled(uint256 indexed marketId, string outcome, uint256 finalApy);
 * 
 * function getMarket(uint256 marketId) external view returns (Market memory);
 * function settleMarket(uint256 marketId, string outcome, uint256 finalApy, bytes signature) external;
 * ```
 */

// ============================================================
// STEP 3: EXTERNAL API (DeFiLlama)
// ============================================================

/**
 * Fetch live yield data from DeFiLlama
 * 
 * CRE Pattern:
 * ```typescript
 * const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload) => {
 *   const yieldData = runtime.runInNodeMode(
 *     async (nodeRuntime: NodeRuntime<Config>) => {
 *       const response = nodeRuntime.http.sendHTTPRequest({
 *         url: nodeRuntime.config.defillamaApiUrl,
 *         method: "GET",
 *       })
 *       return response.body
 *     },
 *     consensusMedianAggregation()
 *   )
 *   return yieldData
 * }
 * ```
 */

const ASSET_PATTERNS: Record<string, { symbols: string[]; projects: string[] }> = {
  stETH: { symbols: ["STETH", "WSTETH"], projects: ["lido"] },
  rETH: { symbols: ["RETH"], projects: ["rocket-pool"] },
  cbETH: { symbols: ["CBETH"], projects: ["coinbase-wrapped-staked-eth"] },
  mSOL: { symbols: ["MSOL"], projects: ["marinade-finance", "marinade"] },
  jitoSOL: { symbols: ["JITOSOL"], projects: ["jito"] },
  EigenLayer: { symbols: ["EIGEN", "RESTAKED"], projects: ["eigenlayer", "eigen"] },
  sfrxETH: { symbols: ["SFRXETH", "FRXETH"], projects: ["frax-ether"] },
  bSOL: { symbols: ["BSOL"], projects: ["blazestake", "solblaze"] },
  "Aave V3": { symbols: ["USDC", "WETH", "USDT"], projects: ["aave-v3"] },
  "Lido stETH": { symbols: ["STETH", "WSTETH"], projects: ["lido"] },
  Compound: { symbols: ["CETH", "CUSDC", "ETH"], projects: ["compound-v3", "compound"] },
  "Pendle PT": { symbols: ["PT-", "PENDLE"], projects: ["pendle"] },
};

// ============================================================
// STEP 4: AI AGENT (Gemini)
// ============================================================

/**
 * AI Settlement Determination
 * 
 * CRE Pattern (HTTP capability to external AI):
 * ```typescript
 * const aiResult = runtime.runInNodeMode(
 *   async (nodeRuntime: NodeRuntime<Config>) => {
 *     const response = nodeRuntime.http.sendHTTPRequest({
 *       url: geminiEndpoint,
 *       method: "POST",
 *       headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
 *       body: JSON.stringify({
 *         model: config.geminiModel,
 *         messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: marketData }],
 *       }),
 *     })
 *     return JSON.parse(response.body)
 *   },
 *   consensusMedianAggregation()
 * )
 * ```
 */

// ============================================================
// STEP 5: ON-CHAIN WRITE (Settlement Report)
// ============================================================

/**
 * Submit settlement report on-chain
 * 
 * CRE Pattern:
 * ```typescript
 * const evmClient = new EVMClient()
 * evmClient.write({
 *   chainSelectorName: "ethereum-testnet-sepolia",
 *   contractAddress: MARKET_CONTRACT_ADDRESS,
 *   abi: SimpleMarketABI,
 *   method: "settleMarket",
 *   args: [marketId, outcome, finalApyBps, signature],
 *   // CRE generates cryptographic signature from the DON
 * })
 * ```
 */

// ============================================================
// COMPLETE WORKFLOW HANDLER
// ============================================================

/**
 * Full CRE workflow handler combining all steps:
 * 
 * ```typescript
 * const initWorkflow = (config: Config) => {
 *   const cron = new CronCapability()
 *   const evmClient = new EVMClient()
 *   
 *   return [
 *     handler(
 *       cron.trigger({ schedule: config.schedule }),
 *       async (runtime: Runtime<Config>, payload: CronPayload) => {
 *         // Step 1: Fetch DeFiLlama data (node-level, then consensus)
 *         const yieldData = await runtime.runInNodeMode(
 *           async (nodeRuntime) => {
 *             const res = await nodeRuntime.http.sendHTTPRequest({
 *               url: config.defillamaApiUrl,
 *               method: "GET",
 *             })
 *             return JSON.parse(res.body)
 *           },
 *           consensusMedianAggregation()
 *         )
 *         
 *         // Step 2: For each market, call Gemini AI for settlement
 *         const settlements = []
 *         for (const market of config.markets) {
 *           const pools = filterPoolsForMarket(yieldData, market)
 *           const aiResult = await runtime.runInNodeMode(
 *             async (nodeRuntime) => {
 *               const res = await nodeRuntime.http.sendHTTPRequest({
 *                 url: GEMINI_ENDPOINT,
 *                 method: "POST",
 *                 body: JSON.stringify({ market, pools }),
 *               })
 *               return JSON.parse(res.body)
 *             },
 *             consensusMedianAggregation()
 *           )
 *           settlements.push(aiResult)
 *         }
 *         
 *         // Step 3: Write settlement report on-chain
 *         for (const settlement of settlements) {
 *           await evmClient.write({
 *             chainSelectorName: "ethereum-testnet-sepolia",
 *             contractAddress: MARKET_CONTRACT,
 *             method: "settleMarket",
 *             args: [settlement.market_id, settlement.outcome, settlement.current_apy * 100],
 *           })
 *         }
 *         
 *         return { settled: settlements.length }
 *       }
 *     )
 *   ]
 * }
 * ```
 */

// Export for reference
export type { WorkflowConfig, MarketConfig, AISettlementResult, SettlementReport };
export { ASSET_PATTERNS };
