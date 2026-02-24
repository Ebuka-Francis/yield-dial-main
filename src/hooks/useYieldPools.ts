import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YieldPool {
  id: string;
  pool_id: string;
  chain: string;
  project: string;
  symbol: string;
  tvl_usd: number;
  apy: number;
  apy_base: number;
  apy_reward: number;
  apy_mean_30d: number;
  il_risk: string;
  stablecoin: boolean;
  exposure: string;
  pool_meta: string | null;
  updated_at: string;
}

// Map our market assets to DeFiLlama pool identifiers
const ASSET_TO_POOL: Record<string, { project: string; symbol: string }> = {
  stETH: { project: "lido", symbol: "STETH" },
  rETH: { project: "rocket-pool", symbol: "RETH" },
  cbETH: { project: "coinbase-wrapped-staked-eth", symbol: "CBETH" },
  sfrxETH: { project: "frax-ether", symbol: "SFRXETH" },
  mSOL: { project: "marinade", symbol: "MSOL" },
  jitoSOL: { project: "jito", symbol: "JITOSOL" },
  bSOL: { project: "blaze-stake", symbol: "BSOL" },
  EigenLayer: { project: "eigenlayer", symbol: "ETH" },
  "Aave V3": { project: "aave-v3", symbol: "USDC" },
  "Lido stETH": { project: "lido", symbol: "STETH" },
  Compound: { project: "compound-v3", symbol: "ETH" },
  "Pendle PT": { project: "pendle", symbol: "STETH" },
};

async function refreshYields() {
  const { data, error } = await supabase.functions.invoke("fetch-yields");
  if (error) throw error;
  return data;
}

async function getCachedYields(): Promise<YieldPool[]> {
  const { data, error } = await supabase
    .from("yield_pools")
    .select("*")
    .order("tvl_usd", { ascending: false });

  if (error) throw error;
  return (data as YieldPool[]) || [];
}

export function useYieldPools() {
  // Refresh from DeFiLlama on first load (stale after 5 min)
  const refreshQuery = useQuery({
    queryKey: ["yield-refresh"],
    queryFn: refreshYields,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // Read cached data from DB
  const poolsQuery = useQuery({
    queryKey: ["yield-pools"],
    queryFn: getCachedYields,
    enabled: refreshQuery.isSuccess || refreshQuery.isError,
    staleTime: 60 * 1000,
  });

  return {
    pools: poolsQuery.data || [],
    isLoading: refreshQuery.isLoading || poolsQuery.isLoading,
    error: refreshQuery.error || poolsQuery.error,
  };
}

export function getYieldForAsset(pools: YieldPool[], asset: string): number | null {
  const mapping = ASSET_TO_POOL[asset];
  if (!mapping) return null;

  // Find the best matching pool (highest TVL for the project+symbol combo)
  const match = pools.find(
    (p) =>
      p.project.toLowerCase().includes(mapping.project.toLowerCase()) &&
      p.symbol.toUpperCase().includes(mapping.symbol)
  );

  return match ? match.apy : null;
}
