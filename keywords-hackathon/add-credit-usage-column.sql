-- Add credit_usage column to ideas table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS credit_usage NUMERIC(10,6) DEFAULT 0 NOT NULL;

-- Add comment
COMMENT ON COLUMN public.ideas.credit_usage IS 'Total credit usage in USD for all API calls related to this idea';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ideas'
  AND column_name = 'credit_usage';
