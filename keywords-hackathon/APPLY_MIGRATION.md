# Apply Credit Usage Migration

## Quick Fix (Recommended - Takes 30 seconds)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fsjywkunrieilwbkucga
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add credit_usage column to ideas table to track API costs
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS credit_usage NUMERIC(10,6) DEFAULT 0 NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.ideas.credit_usage IS 'Total credit usage in USD for all API calls related to this idea';
```

5. Click **Run** (or press Cmd+Enter)
6. You should see "Success. No rows returned"

That's it! Your credit tracking will now work.

## Verify It Worked

After applying the migration, run a new simulation. You should see:
- Credit amount next to each idea in your profile dropdown
- Total credits used above the logout button
- No more "Could not find the 'credit_usage' column" errors

## Alternative: Use Supabase CLI (If you prefer command line)

```bash
# Link your project (one-time setup)
cd /Users/generalcorn/Desktop/KeywordsAI/KeywordsHackathon/keywords-hackathon
supabase link --project-ref fsjywkunrieilwbkucga

# Apply the migration
supabase db push
```

---

## What This Migration Does

- Adds a `credit_usage` column to store the total API cost (in USD) for each idea
- Uses NUMERIC(10,6) to store up to $9999.999999 with 6 decimal precision
- Defaults to 0 for existing ideas
- Tracks cumulative cost across all simulations for each idea
