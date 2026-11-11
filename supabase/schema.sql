-- Talash starter schema. Add RLS policies before production use.
create type public.user_role as enum ('Student', 'Client', 'Professor', 'Admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role public.user_role not null default 'Student',
  institute text,
  degree text,
  semester text,
  city text,
  bio text,
  work_wanted text,
  company_type text,
  description text,
  skills text[] default '{}',
  avatar_url text,
  verified boolean not null default false,
  banned boolean not null default false,
  activity_score integer not null default 0,
  completed_projects integer not null default 0,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

-- Run these statements separately for an existing project.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists degree text;
alter table public.profiles add column if not exists semester text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists work_wanted text;
alter table public.profiles add column if not exists company_type text;
alter table public.profiles add column if not exists description text;
alter table public.profiles add column if not exists banned boolean not null default false;

-- Create a profile even when Supabase requires email confirmation before a session exists.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, institute, degree, semester, city, skills, bio, work_wanted, company_type, description)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'role' in ('Client', 'Professor') then (new.raw_user_meta_data->>'role')::public.user_role else 'Student'::public.user_role end,
    new.raw_user_meta_data->>'institute', new.raw_user_meta_data->>'degree', new.raw_user_meta_data->>'semester', new.raw_user_meta_data->>'city',
    coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data->'skills')), '{}'), new.raw_user_meta_data->>'bio', new.raw_user_meta_data->>'work_wanted', new.raw_user_meta_data->>'company_type', new.raw_user_meta_data->>'description'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table public.posts (id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade, post_type text not null default 'post' check (post_type in ('post', 'project', 'gig', 'request')), title text, body text not null, price numeric(10,2), media jsonb not null default '[]'::jsonb, created_at timestamptz not null default now());
create table public.likes (post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (post_id, user_id));
create table public.comments (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade, author_id uuid not null references public.profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());

-- Migrate the original starter tables when they already exist.
alter table public.posts add column if not exists post_type text not null default 'post';
alter table public.posts add column if not exists title text;
alter table public.posts add column if not exists price numeric(10,2);
alter table public.posts add column if not exists media jsonb not null default '[]'::jsonb;
create table if not exists public.likes (post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (post_id, user_id));
create table if not exists public.post_likes (post_id uuid references public.posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (post_id, user_id));
insert into public.likes select post_id, user_id from public.post_likes on conflict do nothing;

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
create policy "Anyone can read posts" on public.posts for select using (true);
create policy "Signed in users can create posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "Authors and admins can delete posts" on public.posts for delete to authenticated using (auth.uid() = author_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin'));
create policy "Anyone can read likes" on public.likes for select using (true);
create policy "Users manage their likes" on public.likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Anyone can read comments" on public.comments for select using (true);
create policy "Signed in users can comment" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "Authors can delete comments" on public.comments for delete to authenticated using (auth.uid() = author_id);

-- Enable realtime for the shared feed. Run once if the tables are not already published.
alter publication supabase_realtime add table public.posts, public.likes, public.comments;
create table public.gigs (id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade, title text not null, description text not null, price numeric(10,2) not null, media_urls text[] default '{}', created_at timestamptz not null default now());
create table public.project_requests (id uuid primary key default gen_random_uuid(), client_id uuid references public.profiles(id) on delete cascade, title text not null, description text not null, budget numeric(10,2), status text not null default 'open', created_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), sender_id uuid references public.profiles(id) on delete cascade, recipient_id uuid references public.profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());
create table public.transactions (id uuid primary key default gen_random_uuid(), buyer_id uuid references public.profiles(id), seller_id uuid references public.profiles(id), gig_id uuid references public.gigs(id), amount numeric(10,2) not null, platform_fee numeric(10,2) not null, provider text not null default 'mock', status text not null default 'pending', created_at timestamptz not null default now());
create table public.team_members (id uuid primary key default gen_random_uuid(), name text not null, role text not null, bio text not null default '', photo_url text, sort_order integer not null default 0, created_at timestamptz not null default now());

-- Storage bucket for profile photos, project media, and gig images.
insert into storage.buckets (id, name, public) values ('talash-media', 'talash-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('team-photos', 'team-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true) on conflict (id) do nothing;
create policy "Anyone can read post media" on storage.objects for select using (bucket_id = 'post-media');
create policy "Signed in users can upload post media" on storage.objects for insert to authenticated with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners can delete post media" on storage.objects for delete to authenticated using (bucket_id = 'post-media' and owner_id = auth.uid());