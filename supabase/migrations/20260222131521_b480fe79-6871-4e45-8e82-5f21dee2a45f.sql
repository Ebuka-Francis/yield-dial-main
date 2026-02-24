
-- Table to cache yield data from DeFiLlama
CREATE TABLE public.yield_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL,
  project TEXT NOT NULL,
  symbol TEXT NOT NULL,
  tvl_usd NUMERIC,
  apy NUMERIC,
  apy_base NUMERIC,
  apy_reward NUMERIC,
  apy_mean_30d NUMERIC,
  il_risk TEXT,
  stablecoin BOOLEAN DEFAULT false,
  exposure TEXT,
  pool_meta TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read, no direct writes)
ALTER TABLE public.yield_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read yield pools"
  ON public.yield_pools FOR SELECT
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_yield_pools_symbol ON public.yield_pools (symbol);
CREATE INDEX idx_yield_pools_project ON public.yield_pools (project);
CREATE INDEX idx_yield_pools_chain ON public.yield_pools (chain);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_yield_pools_updated_at
  BEFORE UPDATE ON public.yield_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
