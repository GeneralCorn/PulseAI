-- Add versioning support to simulations table
-- This allows storing multiple versions of a mission report when it gets updated

-- Add version column
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Add parent_simulation_id to link versions together
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS parent_simulation_id UUID REFERENCES public.simulations(id);

-- Add created_at if it doesn't exist (for version timestamps)
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create index for faster version queries
CREATE INDEX IF NOT EXISTS idx_simulations_parent_version
  ON public.simulations(parent_simulation_id, version DESC);

-- Create index for user + idea queries
CREATE INDEX IF NOT EXISTS idx_simulations_user_idea
  ON public.simulations(user_id, idea_id, created_at DESC);

-- Add comments
COMMENT ON COLUMN public.simulations.version IS 'Version number, increments with each update to mission report';
COMMENT ON COLUMN public.simulations.parent_simulation_id IS 'Links to the original simulation when this is an updated version';
COMMENT ON COLUMN public.simulations.created_at IS 'Timestamp when this version was created';
