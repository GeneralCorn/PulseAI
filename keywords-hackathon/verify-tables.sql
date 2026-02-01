-- Run this query to verify all tables exist
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'ideas', 'simulations', 'personas', 'experiments', 'variants', 'responses', 'decision_traces', 'prompt_runs')
ORDER BY tablename;

-- Verify the ideas table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ideas'
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'ideas';
