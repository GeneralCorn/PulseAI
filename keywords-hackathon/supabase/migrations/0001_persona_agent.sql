-- Migration: 0001_persona_agent.sql
-- Creates tables for the persona agent module

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS personas (
  persona_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  demographics JSONB NOT NULL,
  profile JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX idx_personas_created_at ON personas(created_at);

-- ============================================================================
-- EXPERIMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS experiments (
  experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_prompt TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE INDEX idx_experiments_created_at ON experiments(created_at);

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

CREATE INDEX idx_variants_experiment_id ON variants(experiment_id);

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

CREATE INDEX idx_responses_experiment_id ON responses(experiment_id);
CREATE INDEX idx_responses_variant_id ON responses(variant_id);
CREATE INDEX idx_responses_persona_id ON responses(persona_id);

-- ============================================================================
-- DECISION TRACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS decision_traces (
  response_id UUID PRIMARY KEY REFERENCES responses(response_id) ON DELETE CASCADE,
  persona_factors_used JSONB NOT NULL DEFAULT '[]'::JSONB,  -- factors derived ONLY from demographics
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

CREATE INDEX idx_prompt_runs_experiment_id ON prompt_runs(experiment_id);
CREATE INDEX idx_prompt_runs_persona_id ON prompt_runs(persona_id);
CREATE INDEX idx_prompt_runs_response_id ON prompt_runs(response_id);
CREATE INDEX idx_prompt_runs_created_at ON prompt_runs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (Optional for MVP - permissive policies)
-- ============================================================================
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for MVP demo purposes
CREATE POLICY "Allow public read on personas" ON personas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on personas" ON personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on personas" ON personas FOR UPDATE USING (true);

CREATE POLICY "Allow public read on experiments" ON experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on experiments" ON experiments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on variants" ON variants FOR SELECT USING (true);
CREATE POLICY "Allow public insert on variants" ON variants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on responses" ON responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on decision_traces" ON decision_traces FOR SELECT USING (true);
CREATE POLICY "Allow public insert on decision_traces" ON decision_traces FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on prompt_runs" ON prompt_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on prompt_runs" ON prompt_runs FOR INSERT WITH CHECK (true);
