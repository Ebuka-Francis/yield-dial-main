import { useMemo } from "react";
import { useYieldPools, getYieldForAsset } from "./useYieldPools";
import { usePredictions, type YieldPrediction } from "./usePredictions";
import type { YieldMarket } from "@/lib/mockData";

// Market definitions — static config, real data is overlaid
const MARKET_DEFINITIONS: Omit<YieldMarket, "currentYield" | "yesPrice" | "noPrice">[] = [
  { id: "001", asset: "stETH", assetIcon: "◆", condition: "APR > 3.5% at epoch end?", threshold: 3.5, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-02-28", timeRemaining: "", category: "eth-lsd", trending: true, resolved: false },
  { id: "002", asset: "rETH", assetIcon: "⟐", condition: "APR > 3.2% next epoch?", threshold: 3.2, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-01", timeRemaining: "", category: "eth-lsd", trending: false, resolved: false },
  { id: "003", asset: "cbETH", assetIcon: "●", condition: "APR > 3.0% by March?", threshold: 3.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-07", timeRemaining: "", category: "eth-lsd", trending: false, resolved: false },
  { id: "004", asset: "mSOL", assetIcon: "◎", condition: "APR > 7.0% at epoch end?", threshold: 7.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-02-25", timeRemaining: "", category: "sol-lsd", trending: true, resolved: false },
  { id: "005", asset: "jitoSOL", assetIcon: "◈", condition: "APR > 7.5% next epoch?", threshold: 7.5, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-02-27", timeRemaining: "", category: "sol-lsd", trending: true, resolved: false },
  { id: "006", asset: "EigenLayer", assetIcon: "▲", condition: "Restaking APR > 5% by March?", threshold: 5.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-15", timeRemaining: "", category: "restaking", trending: true, resolved: false },
  { id: "007", asset: "sfrxETH", assetIcon: "◇", condition: "APR > 4.0% at epoch end?", threshold: 4.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-02-28", timeRemaining: "", category: "eth-lsd", trending: false, resolved: false },
  { id: "008", asset: "bSOL", assetIcon: "◉", condition: "APR > 6.5% next epoch?", threshold: 6.5, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-03", timeRemaining: "", category: "sol-lsd", trending: false, resolved: false },
  { id: "009", asset: "Aave V3", assetIcon: "👻", condition: "USDC Supply APY > 5% by March?", threshold: 5.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-10", timeRemaining: "", category: "defi-yield", trending: true, resolved: false },
  { id: "010", asset: "Lido stETH", assetIcon: "🔷", condition: "Staking APR > 4.0% Q1 end?", threshold: 4.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-31", timeRemaining: "", category: "defi-yield", trending: false, resolved: false },
  { id: "011", asset: "Compound", assetIcon: "🟢", condition: "ETH Supply rate > 3% by March?", threshold: 3.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-15", timeRemaining: "", category: "defi-yield", trending: false, resolved: false },
  { id: "012", asset: "Pendle PT", assetIcon: "⚡", condition: "Fixed yield > 6% on stETH pool?", threshold: 6.0, volume24h: 0, totalLiquidity: 0, settlementDate: "2026-03-20", timeRemaining: "", category: "defi-yield", trending: true, resolved: false },
];

function computeTimeRemaining(settlementDate: string): string {
  const now = new Date();
  const settle = new Date(settlementDate);
  const diff = settle.getTime() - now.getTime();
  if (diff <= 0) return "Settled";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h`;
}

/**
 * Compute YES price from real data:
 * - If we have an AI prediction, use probability_above_threshold
 * - Otherwise, use a heuristic based on current yield vs threshold
 */
function computeYesPrice(currentYield: number, threshold: number, prediction?: YieldPrediction): number {
  if (prediction) {
    return Math.round(prediction.probability_above_threshold * 100) / 100;
  }
  // Heuristic: logistic-like based on distance from threshold
  const distance = currentYield - threshold;
  const pctDist = distance / threshold; // normalize
  const raw = 0.5 + pctDist * 2; // scale
  return Math.round(Math.max(0.05, Math.min(0.95, raw)) * 100) / 100;
}

/**
 * Estimate volume and liquidity from TVL data
 */
function estimateVolumeFromTvl(tvlUsd: number | null): { volume24h: number; totalLiquidity: number } {
  const tvl = tvlUsd || 0;
  return {
    volume24h: Math.round(tvl * 0.002 + Math.random() * 50000), // ~0.2% of TVL as daily volume proxy
    totalLiquidity: Math.round(tvl * 0.001 + 100000), // market liquidity proxy
  };
}

export function useRealMarkets() {
  const { pools, isLoading: poolsLoading } = useYieldPools();
  const { data: allPredictions, isLoading: predictionsLoading } = usePredictions();

  const markets = useMemo(() => {
    return MARKET_DEFINITIONS.map((def) => {
      const realYield = getYieldForAsset(pools, def.asset);
      const currentYield = realYield !== null ? Math.round(realYield * 100) / 100 : 0;

      // Find latest prediction for this market
      const prediction = allPredictions?.find(
        (p) => p.market_id === def.id || p.asset.toLowerCase() === def.asset.toLowerCase()
      );

      const yesPrice = computeYesPrice(currentYield, def.threshold, prediction);
      const noPrice = Math.round((1 - yesPrice) * 100) / 100;

      // Get TVL-based volume estimates from matching pool
      const matchingPool = pools.find(
        (p) =>
          p.project.toLowerCase().includes(def.asset.toLowerCase()) ||
          p.symbol.toUpperCase().includes(def.asset.toUpperCase().replace(/\s+/g, ""))
      );
      const { volume24h, totalLiquidity } = estimateVolumeFromTvl(matchingPool?.tvl_usd ?? null);

      return {
        ...def,
        currentYield,
        yesPrice,
        noPrice,
        volume24h: volume24h || def.volume24h,
        totalLiquidity: totalLiquidity || def.totalLiquidity,
        timeRemaining: computeTimeRemaining(def.settlementDate),
        hasPrediction: !!prediction,
        predictionConfidence: prediction?.confidence,
        predictionDirection: prediction?.prediction_direction,
      };
    });
  }, [pools, allPredictions]);

  return {
    markets,
    isLoading: poolsLoading || predictionsLoading,
    poolCount: pools.length,
  };
}
