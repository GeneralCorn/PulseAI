-- Create director_history table for storing chat history
CREATE TABLE IF NOT EXISTS public.director_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_director_history_simulation_id ON public.director_history(simulation_id);
CREATE INDEX IF NOT EXISTS idx_director_history_user_id ON public.director_history(user_id);
CREATE INDEX IF NOT EXISTS idx_director_history_created_at ON public.director_history(created_at);

-- Enable Row Level Security
ALTER TABLE public.director_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own chat history
CREATE POLICY "Users can read their own chat history"
  ON public.director_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat history
CREATE POLICY "Users can insert their own chat history"
  ON public.director_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.director_history IS 'Stores chat history between users and the Director AI for each simulation session';
