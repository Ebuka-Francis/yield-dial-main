-- Add unique constraint on market_id for upsert in CRE workflow
ALTER TABLE public.market_resolutions ADD CONSTRAINT market_resolutions_market_id_key UNIQUE (market_id);