import { useState } from "react";
import { motion } from "framer-motion";
import { MarketCard } from "@/components/MarketCard";
import { HeroMarket } from "@/components/HeroMarket";
import { categoryLabels } from "@/lib/mockData";
import { Search, Zap } from "lucide-react";
import { useRealMarkets } from "@/hooks/useRealMarkets";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = ['all', 'eth-lsd', 'sol-lsd', 'restaking', 'defi-yield'] as const;

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { markets, isLoading, poolCount } = useRealMarkets();
  const [batchRunning, setBatchRunning] = useState(false);

  const filtered = markets.filter((m) => {
    if (activeCategory !== 'all' && m.category !== activeCategory) return false;
    if (search && !m.asset.toLowerCase().includes(search.toLowerCase()) && !m.condition.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featuredMarket = markets.find((m) => m.trending) || markets[0];

  const runBatchPrediction = async () => {
    setBatchRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-predict");
      if (error) throw error;
      toast.success(`AI predicted ${data.predicted} markets from live DeFiLlama data`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} markets had issues`);
      }
      // Reload to show updated predictions
      window.location.reload();
    } catch (err: any) {
      toast.error("Batch prediction failed: " + (err?.message || "Unknown error"));
    } finally {
      setBatchRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {featuredMarket && <HeroMarket market={featuredMarket} />}

      {/* Data source indicator */}
      <div className="mb-3 flex items-center justify-between">
        {poolCount > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-yes animate-pulse" />
            Live yields from DeFiLlama · {poolCount} pools tracked
          </div>
        )}
        <Button
          onClick={runBatchPrediction}
          disabled={batchRunning}
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-[10px]"
        >
          <Zap className="h-3 w-3" />
          {batchRunning ? "Running AI..." : "Run All Predictions"}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-3 py-1 text-[11px] font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat === 'all' ? 'All Markets' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-secondary pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 sm:w-56"
          />
        </div>
      </div>

      {/* Markets Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((market, i) => (
          <MarketCard key={market.id} market={market} index={i} />
        ))}
      </div>

      {isLoading && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading live market data...
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No markets found.
        </div>
      )}
    </div>
  );
};

export default Index;
