-- Run this after the base schema to enable admin dashboard controls.
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles enable row level security;

-- Use a security-definer helper to avoid recursive profiles RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
	select exists (select 1 from public.profiles where id = auth.uid() and lower(role::text) = 'admin');
$$;

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete posts" on public.posts;
create policy "Admins delete posts" on public.posts for delete to authenticated using (public.is_admin() or auth.uid() = author_id);
drop policy if exists "Admins read messages" on public.messages;
create policy "Admins read messages" on public.messages for select to authenticated using (exists (select 1 from public.profiles admin where admin.id = auth.uid() and lower(admin.role::text) = 'admin') or exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()));