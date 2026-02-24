import { motion } from "framer-motion";
import type { YieldMarket } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, Flame } from "lucide-react";

interface MarketCardProps {
  market: YieldMarket;
  index: number;
}

export const MarketCard = ({ market, index }: MarketCardProps) => {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/market/${market.id}`}
        className="group block glass-card p-4 hover:border-primary/30 transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{market.assetIcon}</span>
            <span className="text-sm font-semibold text-foreground">{market.asset}</span>
            {market.trending && (
              <Flame className="h-3 w-3 text-warning" />
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-mono">{market.timeRemaining}</span>
          </div>
        </div>

        <p className="text-xs text-secondary-foreground mb-4 leading-relaxed">
          {market.condition}
        </p>

        <div className="flex gap-2 mb-3">
          <button className="flex-1 rounded-md bg-chart-yes/10 py-2 text-center transition-colors group-hover:bg-chart-yes/20">
            <div className="text-xs font-medium text-chart-yes">Yes</div>
            <div className="text-sm font-bold font-mono text-chart-yes">${yesPercent}</div>
          </button>
          <button className="flex-1 rounded-md bg-chart-no/10 py-2 text-center transition-colors group-hover:bg-chart-no/20">
            <div className="text-xs font-medium text-chart-no">No</div>
            <div className="text-sm font-bold font-mono text-chart-no">${noPercent}</div>
          </button>
        </div>

        <div className="probability-bar">
          <div className="probability-fill-yes" style={{ width: `${yesPercent}%` }} />
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span className="font-mono">${(market.volume24h / 1000).toFixed(0)}k vol</span>
          </div>
          <span className="font-mono">${(market.totalLiquidity / 1000).toFixed(0)}k liq</span>
        </div>
      </Link>
    </motion.div>
  );
};
