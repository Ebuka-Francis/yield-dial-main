import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// DeFiLlama free API - no API key needed
const DEFILLAMA_POOLS_URL = "https://yields.llama.fi/pools";

// Pools we care about for yield prediction markets
const TARGET_SYMBOLS = [
  "STETH",
  "WSTETH",
  "RETH",
  "CBETH",
  "SFRXETH",
  "MSOL",
  "JITOSOL",
  "BSOL",
  "WEETH",
  "USDC",
  "USDT",
  "ETH",
];

const TARGET_PROJECTS = [
  "lido",
  "rocket-pool",
  "coinbase-wrapped-staked-eth",
  "frax-ether",
  "marinade",
  "jito",
  "blaze-stake",
  "aave-v3",
  "compound-v3",
  "pendle",
  "eigenlayer",
  "ether-fi",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all pools from DeFiLlama
    console.log("Fetching pools from DeFiLlama...");
    const response = await fetch(DEFILLAMA_POOLS_URL);
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const pools = json.data;
    console.log(`Received ${pools.length} total pools from DeFiLlama`);

    // Filter to relevant pools
    const relevantPools = pools.filter((pool: any) => {
      const symbolMatch = TARGET_SYMBOLS.some((s) =>
        pool.symbol?.toUpperCase().includes(s)
      );
      const projectMatch = TARGET_PROJECTS.some((p) =>
        pool.project?.toLowerCase().includes(p)
      );
      return (symbolMatch || projectMatch) && pool.tvlUsd > 1_000_000;
    });

    console.log(`Filtered to ${relevantPools.length} relevant pools`);

    // Upsert into database
    const rows = relevantPools.map((pool: any) => ({
      pool_id: pool.pool,
      chain: pool.chain || "Unknown",
      project: pool.project || "Unknown",
      symbol: pool.symbol || "Unknown",
      tvl_usd: pool.tvlUsd || 0,
      apy: pool.apy || 0,
      apy_base: pool.apyBase || 0,
      apy_reward: pool.apyReward || 0,
      apy_mean_30d: pool.apyMean30d || 0,
      il_risk: pool.ilRisk || "no",
      stablecoin: pool.stablecoin || false,
      exposure: pool.exposure || "single",
      pool_meta: pool.poolMeta || null,
      updated_at: new Date().toISOString(),
    }));

    // Batch upsert
    const { error: upsertError, count } = await supabase
      .from("yield_pools")
      .upsert(rows, { onConflict: "pool_id", ignoreDuplicates: false })
      .select();

    if (upsertError) {
      throw new Error(`DB upsert error: ${upsertError.message}`);
    }

    console.log(`Upserted ${rows.length} pools`);

    // Return the data
    const { data: cachedData, error: readError } = await supabase
      .from("yield_pools")
      .select("*")
      .order("tvl_usd", { ascending: false })
      .limit(50);

    if (readError) {
      throw new Error(`DB read error: ${readError.message}`);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        pools_fetched: pools.length,
        pools_cached: rows.length,
        data: cachedData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
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
