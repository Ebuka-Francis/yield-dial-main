/**
 * DeFiLlama API Integration for CRE Workflow
 * 
 * Fetches live yield data from DeFiLlama's pools endpoint.
 * In a CRE workflow, this uses the HTTPClient capability.
 * 
 * CRE Pattern:
 *   const response = sendRequester.sendHTTPRequest({
 *     url: config.defillamaApiUrl,
 *     method: "GET",
 *   });
 */

import type { YieldData, MarketConfig } from "./types";

// Asset matching patterns for DeFiLlama pool data
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

/**
 * Fetch and filter DeFiLlama pools for our target markets
 */
export async function fetchDefiLlamaYields(
  apiUrl: string,
  markets: MarketConfig[]
): Promise<{ yields: Map<string, YieldData[]>; totalPoolsFetched: number }> {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status}`);
  }

  const data = await response.json();
  const pools: any[] = data.data || [];
  const totalPoolsFetched = pools.length;

  const yields = new Map<string, YieldData[]>();

  for (const market of markets) {
    const patterns = ASSET_PATTERNS[market.asset];
    if (!patterns) continue;

    const matchingPools = pools.filter((pool: any) => {
      const symbolMatch = patterns.symbols.some(
        (s) => pool.symbol?.toUpperCase().includes(s)
      );
      const projectMatch = patterns.projects.some(
        (p) => pool.project?.toLowerCase().includes(p)
      );
      return symbolMatch || projectMatch;
    });

    const yieldData: YieldData[] = matchingPools.slice(0, 10).map((pool: any) => ({
      pool_id: pool.pool,
      chain: pool.chain,
      project: pool.project,
      symbol: pool.symbol,
      apy: pool.apy,
      apyBase: pool.apyBase,
      apyReward: pool.apyReward,
      apyMean30d: pool.apyMean30d,
      tvlUsd: pool.tvlUsd,
      stablecoin: pool.stablecoin || false,
    }));

    yields.set(market.id, yieldData);
  }

  return { yields, totalPoolsFetched };
}

/**
 * Get the best APY for a given market from its pool data
 */
export function getBestApy(pools: YieldData[]): number {
  if (!pools || pools.length === 0) return 0;

  // Sort by TVL to get the most representative pool
  const sorted = [...pools].sort(
    (a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0)
  );

  return sorted[0].apy || sorted[0].apyBase || 0;
}
