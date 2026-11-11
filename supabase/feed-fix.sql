-- Run this once in the Supabase SQL editor to repair the shared feed schema.
-- It is safe to rerun because policies and realtime entries are recreated idempotently.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Talash member',
  role public.user_role not null default 'Student',
  avatar_url text,
  verified boolean not null default false
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null default 'post',
  title text,
  body text not null,
  price numeric(10,2),
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.posts add column if not exists author_id uuid;
alter table public.posts add column if not exists post_type text not null default 'post';
alter table public.posts add column if not exists title text;
alter table public.posts add column if not exists body text;
alter table public.posts add column if not exists price numeric(10,2);
alter table public.posts add column if not exists media jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists created_at timestamptz not null default now();

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Refresh PostgREST's foreign-key relationship metadata for nested profiles, likes, and comments.
alter table public.posts drop constraint if exists posts_author_id_fkey;
alter table public.posts add constraint posts_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.likes drop constraint if exists likes_post_id_fkey;
alter table public.likes add constraint likes_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;
alter table public.likes drop constraint if exists likes_user_id_fkey;
alter table public.likes add constraint likes_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.comments drop constraint if exists comments_post_id_fkey;
alter table public.comments add constraint comments_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;
alter table public.comments drop constraint if exists comments_author_id_fkey;
alter table public.comments add constraint comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
drop policy if exists "Feed can read profiles" on public.profiles;
create policy "Feed can read profiles" on public.profiles for select using (true);
drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts" on public.posts for select using (true);
drop policy if exists "Signed in users can create posts" on public.posts;
create policy "Signed in users can create posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Authors and admins can delete posts" on public.posts;
create policy "Authors and admins can delete posts" on public.posts for delete to authenticated using (auth.uid() = author_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin'));
drop policy if exists "Anyone can read likes" on public.likes;
create policy "Anyone can read likes" on public.likes for select using (true);
drop policy if exists "Users manage their likes" on public.likes;
create policy "Users manage their likes" on public.likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments" on public.comments for select using (true);
drop policy if exists "Signed in users can comment" on public.comments;
create policy "Signed in users can comment" on public.comments for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Authors can delete comments" on public.comments;
create policy "Authors can delete comments" on public.comments for delete to authenticated using (auth.uid() = author_id);

insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true) on conflict (id) do update set public = true;
drop policy if exists "Anyone can read post media" on storage.objects;
create policy "Anyone can read post media" on storage.objects for select using (bucket_id = 'post-media');
drop policy if exists "Signed in users can upload post media" on storage.objects;
create policy "Signed in users can upload post media" on storage.objects for insert to authenticated with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts') then alter publication supabase_realtime add table public.posts; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'likes') then alter publication supabase_realtime add table public.likes; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments') then alter publication supabase_realtime add table public.comments; end if;
end $$;