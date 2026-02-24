/**
 * Shared types for the Destaker CRE Workflow
 */

export interface MarketConfig {
  id: string;
  asset: string;
  threshold: number;
  settlementDate: string;
}

export interface WorkflowConfig {
  schedule: string;
  defillamaApiUrl: string;
  geminiModel: string;
  markets: MarketConfig[];
}

export interface YieldData {
  pool_id: string;
  chain: string;
  project: string;
  symbol: string;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  apyMean30d: number | null;
  tvlUsd: number | null;
  stablecoin: boolean;
}

export interface AISettlementResult {
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

export interface SettlementReport {
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
