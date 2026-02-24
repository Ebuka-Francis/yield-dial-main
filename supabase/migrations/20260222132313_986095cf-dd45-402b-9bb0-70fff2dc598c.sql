
-- Store AI predictions for yield markets
CREATE TABLE public.yield_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  current_apy NUMERIC NOT NULL,
  predicted_apy NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  prediction_direction TEXT NOT NULL CHECK (prediction_direction IN ('above', 'below')),
  probability_above_threshold NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  reasoning TEXT NOT NULL,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_used TEXT NOT NULL,
  settlement_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read predictions"
  ON public.yield_predictions FOR SELECT
  USING (true);

CREATE INDEX idx_predictions_market ON public.yield_predictions (market_id);
CREATE INDEX idx_predictions_asset ON public.yield_predictions (asset);
CREATE INDEX idx_predictions_created ON public.yield_predictions (created_at DESC);

-- Store market resolution events
CREATE TABLE public.market_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  final_apy NUMERIC,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolution_source TEXT,
  resolution_data JSONB,
  resolution_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read resolutions"
  ON public.market_resolutions FOR SELECT
  USING (true);

CREATE INDEX idx_resolutions_market ON public.market_resolutions (market_id);
