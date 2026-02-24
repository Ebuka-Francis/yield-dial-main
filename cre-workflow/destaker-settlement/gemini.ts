/**
 * Gemini AI Integration for CRE Workflow Settlement
 * 
 * Uses Gemini AI to determine market settlement outcomes
 * based on live yield data from DeFiLlama.
 * 
 * In a CRE workflow, this uses the HTTPClient capability
 * to call the Gemini API endpoint.
 * 
 * CRE Pattern:
 *   const response = sendRequester.sendHTTPRequest({
 *     url: geminiEndpoint,
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ ... }),
 *   });
 */

import type { YieldData, AISettlementResult, MarketConfig } from "./types";

const SYSTEM_PROMPT = `You are a DeFi yield analysis AI agent integrated into a Chainlink CRE Workflow.
Your role is to determine whether a yield prediction market should settle YES or NO based on factual data.

You are given:
1. The market question (will APY exceed a threshold?)
2. Live yield data from DeFiLlama (real-time APY, 30-day average, TVL)
3. The settlement threshold

You must respond with a JSON object containing:
- outcome: "YES" or "NO"
- confidence: 0.0-1.0 (how confident you are)
- reasoning: Brief explanation based on the data

Be factual. Use the data provided. Do not speculate beyond what the data shows.`;

/**
 * Call Gemini AI to determine settlement outcome
 */
export async function determineSettlement(
  market: MarketConfig,
  yieldData: YieldData[],
  geminiEndpoint: string,
  apiKey: string
): Promise<AISettlementResult> {
  const bestPool = yieldData.sort(
    (a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0)
  )[0];

  const currentApy = bestPool?.apy || bestPool?.apyBase || 0;
  const mean30d = bestPool?.apyMean30d || currentApy;

  const userPrompt = `Market: Will ${market.asset} APY exceed ${market.threshold}% by ${market.settlementDate}?

Live DeFiLlama Data:
- Current APY: ${currentApy.toFixed(4)}%
- 30-day Mean APY: ${mean30d.toFixed(4)}%
- TVL: $${((bestPool?.tvlUsd || 0) / 1e9).toFixed(2)}B
- Chain: ${bestPool?.chain || "Unknown"}
- Project: ${bestPool?.project || "Unknown"}
- Pool: ${bestPool?.symbol || "Unknown"}
- Number of matching pools: ${yieldData.length}

Additional pool data:
${yieldData
  .slice(0, 5)
  .map(
    (p) =>
      `  - ${p.project} (${p.chain}): APY=${p.apy?.toFixed(2)}%, TVL=$${((p.tvlUsd || 0) / 1e6).toFixed(1)}M`
  )
  .join("\n")}

Threshold: ${market.threshold}%
Settlement Date: ${market.settlementDate}

Determine: Should this market settle YES or NO?`;

  const response = await fetch(geminiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "settle_market",
            description: "Settle a yield prediction market",
            parameters: {
              type: "object",
              properties: {
                outcome: {
                  type: "string",
                  enum: ["YES", "NO"],
                  description: "Market settlement outcome",
                },
                confidence: {
                  type: "number",
                  description: "Confidence score 0.0-1.0",
                },
                reasoning: {
                  type: "string",
                  description: "Brief reasoning based on data",
                },
              },
              required: ["outcome", "confidence", "reasoning"],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "settle_market" },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  const args = toolCall
    ? JSON.parse(toolCall.function.arguments)
    : { outcome: currentApy > market.threshold ? "YES" : "NO", confidence: 0.8, reasoning: "Fallback determination based on current APY vs threshold" };

  return {
    market_id: market.id,
    asset: market.asset,
    current_apy: currentApy,
    threshold: market.threshold,
    outcome: args.outcome,
    confidence: args.confidence,
    reasoning: args.reasoning,
    data_sources: ["DeFiLlama", "Gemini AI", `${yieldData.length} pools analyzed`],
    timestamp: new Date().toISOString(),
  };
}
