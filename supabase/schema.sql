-- Talash starter schema. Add RLS policies before production use.
create type public.user_role as enum ('Student', 'Client', 'Professor', 'Admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role public.user_role not null default 'Student',
  institute text,
  bio text,
  skills text[] default '{}',
  avatar_url text,
  verified boolean not null default false,
  activity_score integer not null default 0,
  completed_projects integer not null default 0,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.posts (id uuid primary key default gen_random_uuid(), author_id uuid references public.profiles(id) on delete cascade, body text not null, media_url text, created_at timestamptz not null default now());
create table public.post_likes (post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (post_id, user_id));
create table public.comments (id uuid primary key default gen_random_uuid(), post_id uuid references public.posts(id) on delete cascade, author_id uuid references public.profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());
create table public.gigs (id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade, title text not null, description text not null, price numeric(10,2) not null, media_urls text[] default '{}', created_at timestamptz not null default now());
create table public.project_requests (id uuid primary key default gen_random_uuid(), client_id uuid references public.profiles(id) on delete cascade, title text not null, description text not null, budget numeric(10,2), status text not null default 'open', created_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), sender_id uuid references public.profiles(id) on delete cascade, recipient_id uuid references public.profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());
create table public.transactions (id uuid primary key default gen_random_uuid(), buyer_id uuid references public.profiles(id), seller_id uuid references public.profiles(id), gig_id uuid references public.gigs(id), amount numeric(10,2) not null, platform_fee numeric(10,2) not null, provider text not null default 'mock', status text not null default 'pending', created_at timestamptz not null default now());
create table public.team_members (id uuid primary key default gen_random_uuid(), name text not null, role text not null, bio text not null default '', photo_url text, sort_order integer not null default 0, created_at timestamptz not null default now());

-- Storage bucket for profile photos, project media, and gig images.
insert into storage.buckets (id, name, public) values ('talash-media', 'talash-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('team-photos', 'team-photos', true) on conflict (id) do nothing;