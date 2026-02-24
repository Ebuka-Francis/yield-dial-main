import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFILLAMA_POOLS = "https://yields.llama.fi/pools";

// All markets to predict
const MARKETS = [
  { id: "001", asset: "stETH", threshold: 3.5, settlement_date: "2026-02-28" },
  { id: "002", asset: "rETH", threshold: 3.2, settlement_date: "2026-03-01" },
  { id: "003", asset: "cbETH", threshold: 3.0, settlement_date: "2026-03-07" },
  { id: "004", asset: "mSOL", threshold: 7.0, settlement_date: "2026-02-25" },
  { id: "005", asset: "jitoSOL", threshold: 7.5, settlement_date: "2026-02-27" },
  { id: "006", asset: "EigenLayer", threshold: 5.0, settlement_date: "2026-03-15" },
  { id: "007", asset: "sfrxETH", threshold: 4.0, settlement_date: "2026-02-28" },
  { id: "008", asset: "bSOL", threshold: 6.5, settlement_date: "2026-03-03" },
  { id: "009", asset: "Aave V3", threshold: 5.0, settlement_date: "2026-03-10" },
  { id: "010", asset: "Lido stETH", threshold: 4.0, settlement_date: "2026-03-31" },
  { id: "011", asset: "Compound", threshold: 3.0, settlement_date: "2026-03-15" },
  { id: "012", asset: "Pendle PT", threshold: 6.0, settlement_date: "2026-03-20" },
];

const SYSTEM_PROMPT = `You are a DeFi yield analyst. Analyze real on-chain yield data and predict whether yield will be ABOVE or BELOW a threshold at settlement. Base predictions ONLY on provided data. Respond using the predict_yield tool.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all pools once
    console.log("Fetching DeFiLlama pools for batch prediction...");
    const llamaRes = await fetch(DEFILLAMA_POOLS);
    if (!llamaRes.ok) throw new Error(`DeFiLlama error: ${llamaRes.status}`);
    const llamaData = await llamaRes.json();
    const allPools = llamaData.data;

    const results: any[] = [];
    const errors: string[] = [];

    // Process markets sequentially to avoid rate limits
    for (const market of MARKETS) {
      try {
        const assetUpper = market.asset.toUpperCase().replace(/\s+/g, "");
        const matchingPools = allPools
          .filter((pool: any) => {
            const sym = pool.symbol?.toUpperCase() || "";
            return (
              (sym.includes(assetUpper) ||
                sym.includes(assetUpper.replace("ETH", "")) ||
                pool.project?.toLowerCase().includes(market.asset.toLowerCase())) &&
              pool.tvlUsd > 1_000_000
            );
          })
          .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
          .slice(0, 5);

        if (matchingPools.length === 0) {
          errors.push(`No pools for ${market.asset}`);
          continue;
        }

        const primary = matchingPools[0];
        const currentApy = primary.apy || 0;

        const yieldContext = matchingPools.map((p: any) => ({
          project: p.project,
          chain: p.chain,
          symbol: p.symbol,
          current_apy: p.apy,
          apy_mean_30d: p.apyMean30d,
          tvl_usd: p.tvlUsd,
        }));

        const userPrompt = `Predict: ${market.asset} APR > ${market.threshold}% at ${market.settlement_date}?
Current APY: ${currentApy.toFixed(4)}%, 30d mean: ${(primary.apyMean30d || 0).toFixed(4)}%, TVL: $${(primary.tvlUsd / 1e9).toFixed(2)}B
Gap: ${(currentApy - market.threshold).toFixed(4)}% ${currentApy >= market.threshold ? "ABOVE" : "BELOW"}
Data: ${JSON.stringify(yieldContext)}`;

        const aiRes = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
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
                  name: "predict_yield",
                  description: "Submit yield prediction",
                  parameters: {
                    type: "object",
                    properties: {
                      predicted_apy: { type: "number" },
                      confidence: { type: "number" },
                      prediction_direction: { type: "string", enum: ["above", "below"] },
                      probability_above_threshold: { type: "number" },
                      reasoning: { type: "string" },
                      risk_factors: { type: "array", items: { type: "string" } },
                    },
                    required: ["predicted_apy", "confidence", "prediction_direction", "probability_above_threshold", "reasoning", "risk_factors"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "predict_yield" } },
          }),
        });

        if (!aiRes.ok) {
          const errText = await aiRes.text();
          if (aiRes.status === 429) {
            console.log("Rate limited, waiting 5s...");
            await new Promise((r) => setTimeout(r, 5000));
            errors.push(`Rate limited for ${market.asset}`);
            continue;
          }
          errors.push(`AI error for ${market.asset}: ${aiRes.status}`);
          continue;
        }

        const aiData = await aiRes.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          errors.push(`No prediction for ${market.asset}`);
          continue;
        }

        const prediction = JSON.parse(toolCall.function.arguments);
        console.log(`${market.asset}: ${prediction.prediction_direction}, confidence: ${prediction.confidence}`);

        // Store in DB
        await supabase.from("yield_predictions").insert({
          market_id: market.id,
          asset: market.asset,
          current_apy: currentApy,
          predicted_apy: prediction.predicted_apy,
          confidence: prediction.confidence,
          prediction_direction: prediction.prediction_direction,
          probability_above_threshold: prediction.probability_above_threshold,
          threshold: market.threshold,
          reasoning: prediction.reasoning,
          data_sources: yieldContext,
          model_used: "google/gemini-2.5-flash-lite",
          settlement_date: market.settlement_date,
        });

        results.push({
          market_id: market.id,
          asset: market.asset,
          current_apy: currentApy,
          ...prediction,
        });

        // Small delay between requests
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        errors.push(`${market.asset}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({ status: "success", predicted: results.length, errors, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch prediction error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
