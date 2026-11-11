-- Feed schema compatibility migration.
-- Run this once in the Supabase SQL Editor. It is safe to run repeatedly.

alter table if exists public.profiles
  add column if not exists id uuid,
  add column if not exists name text,
  add column if not exists role public.user_role,
  add column if not exists avatar_url text;

alter table if exists public.posts
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists author_id uuid,
  add column if not exists post_type text default 'post',
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists price numeric(10,2),
  add column if not exists media jsonb default '[]'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table if exists public.likes
  add column if not exists post_id uuid,
  add column if not exists user_id uuid;

alter table if exists public.comments
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists post_id uuid,
  add column if not exists author_id uuid,
  add column if not exists body text,
  add column if not exists created_at timestamptz default now();

notify pgrst, 'reload schema';
