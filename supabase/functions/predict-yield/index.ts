import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFILLAMA_POOLS = "https://yields.llama.fi/pools";

// System prompt for the AI yield predictor
const SYSTEM_PROMPT = `You are an expert DeFi yield analyst and prediction engine for a prediction market platform called Destaker. Your job is to analyze REAL on-chain yield data and produce accurate market predictions.

You receive:
1. Current live APY data from DeFiLlama for specific yield pools
2. 30-day mean APY trends
3. TVL data showing capital flows
4. Market threshold conditions

Your task: Analyze the data and predict whether the yield will be ABOVE or BELOW the threshold at settlement date.

CRITICAL RULES:
- Base predictions ONLY on the real data provided - never fabricate numbers
- Consider TVL trends (capital inflows/outflows affect yield)
- Consider 30d mean vs current APY (trending up or down?)
- Consider protocol-specific factors (Lido, Rocket Pool, Aave mechanics)
- Provide confidence as a decimal between 0 and 1
- Provide probability_above_threshold as a decimal between 0 and 1
- Your reasoning must cite specific data points

You must respond using the predict_yield tool.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { market_id, asset, threshold, settlement_date } = await req.json();

    if (!asset || threshold === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: asset, threshold" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Fetch real yield data from DeFiLlama
    console.log(`Fetching live yield data for ${asset}...`);
    const llamaRes = await fetch(DEFILLAMA_POOLS);
    if (!llamaRes.ok) throw new Error(`DeFiLlama API error: ${llamaRes.status}`);
    const llamaData = await llamaRes.json();

    // Find matching pools for this asset
    const assetUpper = asset.toUpperCase().replace(/\s+/g, "");
    const matchingPools = llamaData.data.filter((pool: any) => {
      const sym = pool.symbol?.toUpperCase() || "";
      return (
        sym.includes(assetUpper) ||
        sym.includes(assetUpper.replace("ETH", "")) ||
        pool.project?.toLowerCase().includes(asset.toLowerCase())
      );
    }).filter((p: any) => p.tvlUsd > 1_000_000)
      .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
      .slice(0, 10);

    if (matchingPools.length === 0) {
      return new Response(
        JSON.stringify({ error: `No yield data found for asset: ${asset}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build data context for AI
    const yieldContext = matchingPools.map((p: any) => ({
      pool_id: p.pool,
      project: p.project,
      chain: p.chain,
      symbol: p.symbol,
      current_apy: p.apy,
      apy_base: p.apyBase,
      apy_reward: p.apyReward,
      apy_mean_30d: p.apyMean30d,
      tvl_usd: p.tvlUsd,
      il_risk: p.ilRisk,
      stablecoin: p.stablecoin,
    }));

    const primaryPool = matchingPools[0];
    const currentApy = primaryPool.apy || 0;

    console.log(`Found ${matchingPools.length} pools for ${asset}. Primary APY: ${currentApy}%`);

    // Step 2: Call AI with real data for structured prediction
    const userPrompt = `Analyze the following REAL on-chain yield data and predict the market outcome:

MARKET: ${asset} Yield Prediction
CONDITION: APR > ${threshold}% at settlement
SETTLEMENT DATE: ${settlement_date || "7 days from now"}
CURRENT DATE: ${new Date().toISOString().split("T")[0]}

LIVE YIELD DATA FROM DEFILLAMA (${matchingPools.length} matching pools):
${JSON.stringify(yieldContext, null, 2)}

KEY METRICS FOR PRIMARY POOL (${primaryPool.project}):
- Current APY: ${currentApy.toFixed(4)}%
- 30-Day Mean APY: ${(primaryPool.apyMean30d || 0).toFixed(4)}%
- APY Trend: ${currentApy > (primaryPool.apyMean30d || 0) ? "RISING (current > 30d mean)" : "FALLING (current < 30d mean)"}
- TVL: $${(primaryPool.tvlUsd / 1e9).toFixed(2)}B
- Base APY: ${(primaryPool.apyBase || 0).toFixed(4)}%
- Reward APY: ${(primaryPool.apyReward || 0).toFixed(4)}%

THRESHOLD: ${threshold}%
GAP: Current APY is ${(currentApy - threshold).toFixed(4)}% ${currentApy >= threshold ? "ABOVE" : "BELOW"} threshold

Analyze this data and predict the outcome using the predict_yield tool.`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "predict_yield",
              description:
                "Submit a structured yield prediction based on real DeFiLlama data analysis",
              parameters: {
                type: "object",
                properties: {
                  predicted_apy: {
                    type: "number",
                    description: "Predicted APY at settlement (percentage, e.g. 3.45)",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence in prediction (0 to 1)",
                  },
                  prediction_direction: {
                    type: "string",
                    enum: ["above", "below"],
                    description: "Whether yield will be above or below the threshold",
                  },
                  probability_above_threshold: {
                    type: "number",
                    description: "Probability yield will be above threshold (0 to 1)",
                  },
                  reasoning: {
                    type: "string",
                    description:
                      "Detailed reasoning citing specific data points from the real yield data",
                  },
                  risk_factors: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key risk factors that could change the prediction",
                  },
                },
                required: [
                  "predicted_apy",
                  "confidence",
                  "prediction_direction",
                  "probability_above_threshold",
                  "reasoning",
                  "risk_factors",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "predict_yield" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required for AI predictions." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "predict_yield") {
      throw new Error("AI did not return a structured prediction");
    }

    const prediction = JSON.parse(toolCall.function.arguments);

    console.log(`AI Prediction: ${prediction.prediction_direction} threshold, confidence: ${prediction.confidence}`);

    // Step 3: Store prediction in database
    const predictionRow = {
      market_id: market_id || `${asset.toLowerCase().replace(/\s+/g, "-")}-yield`,
      asset,
      current_apy: currentApy,
      predicted_apy: prediction.predicted_apy,
      confidence: prediction.confidence,
      prediction_direction: prediction.prediction_direction,
      probability_above_threshold: prediction.probability_above_threshold,
      threshold,
      reasoning: prediction.reasoning,
      data_sources: yieldContext,
      model_used: "google/gemini-3-flash-preview",
      settlement_date: settlement_date || null,
    };

    const { data: savedPrediction, error: saveError } = await supabase
      .from("yield_predictions")
      .insert(predictionRow)
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save prediction:", saveError);
    }

    // Step 4: Check if market should resolve (if settlement date has passed)
    let resolution = null;
    if (settlement_date && new Date(settlement_date) <= new Date()) {
      resolution = {
        market_id: market_id,
        asset,
        threshold,
        final_apy: currentApy,
        resolved: true,
        resolution_source: "defillama",
        resolution_data: { primary_pool: yieldContext[0], snapshot_time: new Date().toISOString() },
        resolution_timestamp: new Date().toISOString(),
      };

      await supabase.from("market_resolutions").upsert(resolution, {
        onConflict: "market_id",
      });
    }

    return new Response(
      JSON.stringify({
        status: "success",
        prediction: {
          ...prediction,
          current_apy: currentApy,
          threshold,
          asset,
          market_id: predictionRow.market_id,
          data_sources_count: yieldContext.length,
          model: "google/gemini-3-flash-preview",
          created_at: savedPrediction?.created_at || new Date().toISOString(),
        },
        resolution,
        evidence: {
          defillama_pools_analyzed: yieldContext.length,
          primary_pool: {
            project: primaryPool.project,
            chain: primaryPool.chain,
            current_apy: currentApy,
            mean_30d_apy: primaryPool.apyMean30d,
            tvl_usd: primaryPool.tvlUsd,
          },
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
