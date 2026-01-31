-- Simulations Table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mode TEXT NOT NULL, -- "single" | "compare"
  input_json JSONB,   -- Stored input params
  result_json JSONB   -- Stored full JSON result
);

-- Enable Row Level Security (RLS)
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for MVP demo purposes)
CREATE POLICY "Allow public read access" ON simulations FOR SELECT USING (true);

-- Allow public insert access (for MVP demo purposes)
CREATE POLICY "Allow anon insert access" ON simulations FOR INSERT WITH CHECK (true);
