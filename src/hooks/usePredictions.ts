import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YieldPrediction {
  id: string;
  market_id: string;
  asset: string;
  current_apy: number;
  predicted_apy: number;
  confidence: number;
  prediction_direction: "above" | "below";
  probability_above_threshold: number;
  threshold: number;
  reasoning: string;
  data_sources: any[];
  model_used: string;
  settlement_date: string | null;
  created_at: string;
}

export interface PredictionResponse {
  status: string;
  prediction: {
    asset: string;
    current_apy: number;
    predicted_apy: number;
    confidence: number;
    prediction_direction: "above" | "below";
    probability_above_threshold: number;
    reasoning: string;
    risk_factors: string[];
    threshold: number;
    market_id: string;
    model: string;
    data_sources_count: number;
    created_at: string;
  };
  evidence: {
    defillama_pools_analyzed: number;
    primary_pool: {
      project: string;
      chain: string;
      current_apy: number;
      mean_30d_apy: number;
      tvl_usd: number;
    };
    timestamp: string;
  };
  resolution: any | null;
}

export function usePredictions(marketId?: string) {
  return useQuery({
    queryKey: ["predictions", marketId],
    queryFn: async () => {
      let query = supabase
        .from("yield_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (marketId) {
        query = query.eq("market_id", marketId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as YieldPrediction[]) || [];
    },
  });
}

export function useRequestPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      market_id: string;
      asset: string;
      threshold: number;
      settlement_date?: string;
    }): Promise<PredictionResponse> => {
      const { data, error } = await supabase.functions.invoke("predict-yield", {
        body: params,
      });
      if (error) throw error;
      return data as PredictionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    },
  });
}
