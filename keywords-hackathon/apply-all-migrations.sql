-- Apply all pending migrations for Pulse
-- Run this in Supabase SQL Editor

-- ====================================
-- 1. Add credit_usage to ideas table
-- ====================================
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS credit_usage NUMERIC(10,6) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.ideas.credit_usage IS 'Total credit usage in USD for all API calls related to this idea';

-- ====================================
-- 2. Add versioning to simulations
-- ====================================
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS parent_simulation_id UUID REFERENCES public.simulations(id);

ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulations_parent_version
  ON public.simulations(parent_simulation_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_simulations_user_idea
  ON public.simulations(user_id, idea_id, created_at DESC);

-- Add comments
COMMENT ON COLUMN public.simulations.version IS 'Version number, increments with each update to mission report';
COMMENT ON COLUMN public.simulations.parent_simulation_id IS 'Links to the original simulation when this is an updated version';
COMMENT ON COLUMN public.simulations.created_at IS 'Timestamp when this version was created';

-- ====================================
-- Verification queries
-- ====================================
-- Verify ideas table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ideas'
  AND column_name IN ('credit_usage');

-- Verify simulations table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'simulations'
  AND column_name IN ('version', 'parent_simulation_id', 'created_at');
