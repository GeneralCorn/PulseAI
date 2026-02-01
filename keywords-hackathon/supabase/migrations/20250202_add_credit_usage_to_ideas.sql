-- Add credit_usage column to ideas table to track API costs
alter table public.ideas
  add column if not exists credit_usage numeric(10,6) default 0 not null;

-- Add comment to document the column
comment on column public.ideas.credit_usage is 'Total credit usage in USD for all API calls related to this idea';
