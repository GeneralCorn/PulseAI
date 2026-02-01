
-- Create ideas table
create table if not exists public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on ideas
alter table public.ideas enable row level security;

create policy "Users can view their own ideas." on public.ideas
  for select using (auth.uid() = user_id);

create policy "Users can insert their own ideas." on public.ideas
  for insert with check (auth.uid() = user_id);

-- Update simulations table to link to ideas and users
alter table public.simulations 
  add column if not exists user_id uuid references auth.users,
  add column if not exists idea_id uuid references public.ideas;

-- Update RLS for simulations to allow user access
create policy "Users can view their own simulations." on public.simulations
  for select using (auth.uid() = user_id);

create policy "Users can insert their own simulations." on public.simulations
  for insert with check (auth.uid() = user_id);
