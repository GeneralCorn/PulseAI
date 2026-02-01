-- ============================================================================
-- ALL MIGRATIONS COMBINED
-- Run this in your Supabase SQL Editor to create all required tables
-- ============================================================================

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS personas (
  persona_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  demographics JSONB NOT NULL,
  profile JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);

-- ============================================================================
-- EXPERIMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS experiments (
  experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_prompt TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at);

-- ============================================================================
-- VARIANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS variants (
  variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
  variant_key TEXT NOT NULL,  -- 'A', 'B', ...
  stimulus JSONB NOT NULL,
  UNIQUE(experiment_id, variant_key)
);

CREATE INDEX IF NOT EXISTS idx_variants_experiment_id ON variants(experiment_id);

-- ============================================================================
-- RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES variants(variant_id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(persona_id) ON DELETE CASCADE,
  purchase_intent SMALLINT CHECK (purchase_intent BETWEEN 1 AND 5),
  trust SMALLINT CHECK (trust BETWEEN 1 AND 5),
  clarity SMALLINT CHECK (clarity BETWEEN 1 AND 5),
  differentiation SMALLINT CHECK (differentiation BETWEEN 1 AND 5),
  would_try BOOLEAN,
  would_pay BOOLEAN,
  free_text TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE(experiment_id, variant_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_experiment_id ON responses(experiment_id);
CREATE INDEX IF NOT EXISTS idx_responses_variant_id ON responses(variant_id);
CREATE INDEX IF NOT EXISTS idx_responses_persona_id ON responses(persona_id);

-- ============================================================================
-- DECISION TRACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_traces (
  response_id UUID PRIMARY KEY REFERENCES responses(response_id) ON DELETE CASCADE,
  persona_factors_used JSONB NOT NULL DEFAULT '[]'::JSONB,
  stimulus_cues JSONB NOT NULL DEFAULT '[]'::JSONB,
  top_objections JSONB NOT NULL DEFAULT '[]'::JSONB,
  what_would_change_my_mind JSONB NOT NULL DEFAULT '[]'::JSONB,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  uncertainty_notes JSONB NOT NULL DEFAULT '[]'::JSONB,
  audit JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- ============================================================================
-- PROMPT RUNS TABLE (Audit log for LLM calls)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_runs (
  prompt_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  experiment_id UUID,
  persona_id UUID,
  response_id UUID,
  prompt_id TEXT,
  model TEXT,
  input_hash TEXT,
  output_hash TEXT,
  latency_ms INT,
  input_tokens INT,
  output_tokens INT,
  cost_usd NUMERIC,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_prompt_runs_experiment_id ON prompt_runs(experiment_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_persona_id ON prompt_runs(persona_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_response_id ON prompt_runs(response_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_created_at ON prompt_runs(created_at);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SIMULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mode TEXT NOT NULL,
  input_json JSONB,
  result_json JSONB,
  user_id uuid REFERENCES auth.users,
  idea_id uuid
);

-- ============================================================================
-- IDEAS TABLE (THE ONE YOU NEED!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns to simulations if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'simulations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.simulations ADD COLUMN user_id uuid REFERENCES auth.users;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'simulations' AND column_name = 'idea_id'
  ) THEN
    ALTER TABLE public.simulations ADD COLUMN idea_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'simulations_idea_id_fkey' AND table_name = 'simulations'
  ) THEN
    ALTER TABLE public.simulations
      ADD CONSTRAINT simulations_idea_id_fkey
      FOREIGN KEY (idea_id) REFERENCES public.ideas(id);
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Personas policies
DROP POLICY IF EXISTS "Allow public read on personas" ON personas;
DROP POLICY IF EXISTS "Allow public insert on personas" ON personas;
DROP POLICY IF EXISTS "Allow public update on personas" ON personas;
CREATE POLICY "Allow public read on personas" ON personas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on personas" ON personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on personas" ON personas FOR UPDATE USING (true);

-- Experiments policies
DROP POLICY IF EXISTS "Allow public read on experiments" ON experiments;
DROP POLICY IF EXISTS "Allow public insert on experiments" ON experiments;
CREATE POLICY "Allow public read on experiments" ON experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on experiments" ON experiments FOR INSERT WITH CHECK (true);

-- Variants policies
DROP POLICY IF EXISTS "Allow public read on variants" ON variants;
DROP POLICY IF EXISTS "Allow public insert on variants" ON variants;
CREATE POLICY "Allow public read on variants" ON variants FOR SELECT USING (true);
CREATE POLICY "Allow public insert on variants" ON variants FOR INSERT WITH CHECK (true);

-- Responses policies
DROP POLICY IF EXISTS "Allow public read on responses" ON responses;
DROP POLICY IF EXISTS "Allow public insert on responses" ON responses;
CREATE POLICY "Allow public read on responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on responses" ON responses FOR INSERT WITH CHECK (true);

-- Decision traces policies
DROP POLICY IF EXISTS "Allow public read on decision_traces" ON decision_traces;
DROP POLICY IF EXISTS "Allow public insert on decision_traces" ON decision_traces;
CREATE POLICY "Allow public read on decision_traces" ON decision_traces FOR SELECT USING (true);
CREATE POLICY "Allow public insert on decision_traces" ON decision_traces FOR INSERT WITH CHECK (true);

-- Prompt runs policies
DROP POLICY IF EXISTS "Allow public read on prompt_runs" ON prompt_runs;
DROP POLICY IF EXISTS "Allow public insert on prompt_runs" ON prompt_runs;
CREATE POLICY "Allow public read on prompt_runs" ON prompt_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on prompt_runs" ON prompt_runs FOR INSERT WITH CHECK (true);

-- Users policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Simulations policies
DROP POLICY IF EXISTS "Allow public read access" ON simulations;
DROP POLICY IF EXISTS "Allow anon insert access" ON simulations;
DROP POLICY IF EXISTS "Users can view their own simulations." ON simulations;
DROP POLICY IF EXISTS "Users can insert their own simulations." ON simulations;
CREATE POLICY "Allow public read access" ON simulations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own simulations." ON simulations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own simulations." ON simulations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Ideas policies (IMPORTANT!)
DROP POLICY IF EXISTS "Users can view their own ideas." ON public.ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas." ON public.ideas;
CREATE POLICY "Users can view their own ideas." ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ideas." ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
