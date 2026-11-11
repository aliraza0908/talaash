-- Run this complete file in the Supabase SQL editor.
-- Conversation membership is kept in its own table so RLS can protect every participant.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, receiver_id),
  check (requester_id <> receiver_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('message', 'connection_request', 'like', 'comment')),
  text text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep timestamps current when connection or conversation records change.
create or replace function public.touch_messaging_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists connections_touch_updated_at on public.connections;
create trigger connections_touch_updated_at before update on public.connections for each row execute procedure public.touch_messaging_updated_at();
drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at before update on public.conversations for each row execute procedure public.touch_messaging_updated_at();

alter table public.connections enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users read own connections" on public.connections;
create policy "Users read own connections" on public.connections for select to authenticated using (auth.uid() = requester_id or auth.uid() = receiver_id);
drop policy if exists "Users send connection requests" on public.connections;
create policy "Users send connection requests" on public.connections for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "Users update own connection requests" on public.connections;
create policy "Users update own connection requests" on public.connections for update to authenticated using (auth.uid() = requester_id or auth.uid() = receiver_id) with check (auth.uid() = requester_id or auth.uid() = receiver_id);
drop policy if exists "Users remove own connections" on public.connections;
create policy "Users remove own connections" on public.connections for delete to authenticated using (auth.uid() = requester_id or auth.uid() = receiver_id);

drop policy if exists "Members read conversations" on public.conversations;
create policy "Members read conversations" on public.conversations for select to authenticated using (exists (select 1 from public.conversation_members where conversation_id = conversations.id and user_id = auth.uid()));
drop policy if exists "Users create conversations" on public.conversations;
create policy "Users create conversations" on public.conversations for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "Members update conversations" on public.conversations;
create policy "Members update conversations" on public.conversations for update to authenticated using (exists (select 1 from public.conversation_members where conversation_id = conversations.id and user_id = auth.uid()));

drop policy if exists "Users read conversation members" on public.conversation_members;
create policy "Users read conversation members" on public.conversation_members for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.conversation_members own where own.conversation_id = conversation_members.conversation_id and own.user_id = auth.uid()));
drop policy if exists "Users add conversation members" on public.conversation_members;
create policy "Users add conversation members" on public.conversation_members for insert to authenticated with check (exists (select 1 from public.conversations where id = conversation_id and created_by = auth.uid()) or user_id = auth.uid());

drop policy if exists "Members read messages" on public.messages;
create policy "Members read messages" on public.messages for select to authenticated using (exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()));
drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages" on public.messages for insert to authenticated with check (auth.uid() = sender_id and exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()));
drop policy if exists "Members mark messages read" on public.messages;
create policy "Members mark messages read" on public.messages for update to authenticated using (exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid())) with check (exists (select 1 from public.conversation_members where conversation_id = messages.conversation_id and user_id = auth.uid()));

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users mark own notifications" on public.notifications;
create policy "Users mark own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Authenticated users create notifications" on public.notifications;
create policy "Users create own notifications" on public.notifications for insert to authenticated with check (user_id = auth.uid());

-- Server-side triggers create notifications for another user without exposing that write to clients.
create or replace function public.create_social_notification() returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid; label text; target_link text;
begin
  if tg_table_name = 'connections' then
    recipient := new.receiver_id; label := 'You have a new connection request.'; target_link := '/network';
  elsif tg_table_name = 'messages' then
    select user_id into recipient from public.conversation_members where conversation_id = new.conversation_id and user_id <> new.sender_id limit 1;
    label := 'You have a new message.'; target_link := '/messages';
  elsif tg_table_name = 'likes' then
    select author_id into recipient from public.posts where id = new.post_id;
    label := 'Someone liked your post.'; target_link := '/feed';
  elsif tg_table_name = 'comments' then
    select author_id into recipient from public.posts where id = new.post_id;
    label := 'Someone commented on your post.'; target_link := '/feed';
  end if;
  if recipient is not null and recipient <> auth.uid() then
    insert into public.notifications (user_id, type, text, link) values (recipient, case when tg_table_name = 'connections' then 'connection_request' when tg_table_name = 'messages' then 'message' when tg_table_name = 'likes' then 'like' else 'comment' end, label, target_link);
  end if;
  return new;
end;
$$;
drop trigger if exists connection_notification on public.connections;
create trigger connection_notification after insert on public.connections for each row execute procedure public.create_social_notification();
drop trigger if exists message_notification on public.messages;
create trigger message_notification after insert on public.messages for each row execute procedure public.create_social_notification();
drop trigger if exists like_notification on public.likes;
create trigger like_notification after insert on public.likes for each row execute procedure public.create_social_notification();
drop trigger if exists comment_notification on public.comments;
create trigger comment_notification after insert on public.comments for each row execute procedure public.create_social_notification();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then alter publication supabase_realtime add table public.notifications; end if;
end $$;
