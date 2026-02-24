import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Zap, Shield, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequestPrediction, usePredictions, type PredictionResponse } from "@/hooks/usePredictions";
import { toast } from "sonner";

interface AIPredictionPanelProps {
  marketId: string;
  asset: string;
  threshold: number;
  settlementDate?: string;
}

export const AIPredictionPanel = ({ marketId, asset, threshold, settlementDate }: AIPredictionPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [latestResult, setLatestResult] = useState<PredictionResponse | null>(null);
  const { data: predictions } = usePredictions(marketId);
  const { mutateAsync: predict, isPending } = useRequestPrediction();

  const handlePredict = async () => {
    try {
      const result = await predict({
        market_id: marketId,
        asset,
        threshold,
        settlement_date: settlementDate,
      });
      setLatestResult(result);
      setExpanded(true);
      toast.success("AI prediction generated from live DeFiLlama data");
    } catch (err: any) {
      if (err?.message?.includes("429")) {
        toast.error("Rate limited — try again in a moment");
      } else if (err?.message?.includes("402")) {
        toast.error("AI credits needed — please top up");
      } else {
        toast.error("Prediction failed: " + (err?.message || "Unknown error"));
      }
    }
  };

  const prediction = latestResult?.prediction || (predictions?.[0] ? {
    ...predictions[0],
    risk_factors: [],
    data_sources_count: (predictions[0].data_sources as any[])?.length || 0,
    model: predictions[0].model_used,
  } : null);

  const evidence = latestResult?.evidence;

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI Yield Prediction</span>
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">LIVE DATA</span>
        </div>
        <Button
          onClick={handlePredict}
          disabled={isPending}
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
        >
          <Zap className="h-3 w-3" />
          {isPending ? "Analyzing..." : "Run Prediction"}
        </Button>
      </div>

      {/* Prediction Result */}
      {prediction && (
        <div className="p-4">
          {/* Main prediction */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              prediction.prediction_direction === "above"
                ? "bg-chart-yes/15"
                : "bg-chart-no/15"
            }`}>
              {prediction.prediction_direction === "above" ? (
                <TrendingUp className="h-5 w-5 text-chart-yes" />
              ) : (
                <TrendingDown className="h-5 w-5 text-chart-no" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-black font-mono ${
                  prediction.prediction_direction === "above" ? "text-chart-yes" : "text-chart-no"
                }`}>
                  {prediction.prediction_direction === "above" ? "ABOVE" : "BELOW"} {threshold}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(prediction.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Predicted APY: <span className="font-mono font-bold text-foreground">{prediction.predicted_apy?.toFixed(2) ?? prediction.predicted_apy}%</span>
                {" · "}Current: <span className="font-mono font-bold text-foreground">{prediction.current_apy?.toFixed(2) ?? prediction.current_apy}%</span>
              </div>
            </div>
          </div>

          {/* Probability bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Below {threshold}%</span>
              <span>Above {threshold}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(prediction.probability_above_threshold * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-chart-yes"
                style={{ marginLeft: "auto" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono font-bold mt-1">
              <span className="text-chart-no">{Math.round((1 - prediction.probability_above_threshold) * 100)}%</span>
              <span className="text-chart-yes">{Math.round(prediction.probability_above_threshold * 100)}%</span>
            </div>
          </div>

          {/* Evidence badge */}
          {evidence && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 mb-3">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">
                Analyzed <span className="font-bold text-foreground">{evidence.defillama_pools_analyzed} pools</span> from DeFiLlama
                {" · "}{evidence.primary_pool.project} on {evidence.primary_pool.chain}
                {" · "}TVL ${(evidence.primary_pool.tvl_usd / 1e9).toFixed(1)}B
                {" · "}30d mean: {evidence.primary_pool.mean_30d_apy?.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Expandable reasoning */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} AI reasoning & risk factors
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <div className="text-[10px] font-semibold text-primary mb-1">AI Reasoning</div>
                    <p className="text-[11px] leading-relaxed text-secondary-foreground">
                      {prediction.reasoning}
                    </p>
                  </div>

                  {(prediction as any).risk_factors?.length > 0 && (
                    <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-warning" />
                        <span className="text-[10px] font-semibold text-warning">Risk Factors</span>
                      </div>
                      <ul className="space-y-1">
                        {(prediction as any).risk_factors.map((rf: string, i: number) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex gap-1.5">
                            <span className="text-warning mt-0.5">•</span>
                            {rf}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-[9px] text-muted-foreground/60 text-right">
                    Model: {(prediction as any).model || (prediction as any).model_used} · {new Date(prediction.created_at).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!prediction && !isPending && (
        <div className="p-6 text-center">
          <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Click "Run Prediction" to analyze live DeFiLlama yield data with AI
          </p>
        </div>
      )}

      {isPending && (
        <div className="p-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
          </motion.div>
          <p className="text-xs text-muted-foreground">
            Fetching live data from DeFiLlama & analyzing with AI...
          </p>
        </div>
      )}
    </div>
  );
};
