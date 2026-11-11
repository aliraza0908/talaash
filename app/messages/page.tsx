"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircle, Send, UserRound } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type Person = { id: string; name: string; avatar_url: string | null };
type Conversation = { id: string; updated_at: string; person: Person | null; unread: number };
type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

export default function MessagesPage() {
  const client = createSupabaseBrowserClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [target, setTarget] = useState<Person | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const searchTarget = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("user") : null;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    const supabase = client;
    let cancelled = false;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setLoading(false); return; }
      setUserId(auth.user.id);
      if (searchTarget) { const { data } = await supabase.from("profiles").select("id,name,avatar_url").eq("id", searchTarget).maybeSingle(); if (data && !cancelled) setTarget(data as Person); }
      await refreshConversations(auth.user.id);
      if (cancelled) return;
      try {
        const channel = supabase.channel(`messages-${auth.user.id}-${Date.now()}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => { const message = payload.new as Message; setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]); void refreshConversations(auth.user.id); });
        channelRef.current = channel;
        channel.subscribe((status) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("Message realtime failed", status); });
      } catch (realtimeError) { console.error("Message realtime setup failed", realtimeError); }
    }
    void load();
    return () => { cancelled = true; const channel = channelRef.current; channelRef.current = null; if (channel) void supabase.removeChannel(channel); };
  // The message channel is created once for the signed-in user and cleaned up on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshConversations(currentUserId: string) {
    if (!client) return;
    const { data: memberships } = await client.from("conversation_members").select("conversation_id").eq("user_id", currentUserId);
    const ids = (memberships || []).map((item) => item.conversation_id as string);
    if (!ids.length) { setConversations([]); setLoading(false); return; }
    const [{ data: members }, { data: recentMessages }] = await Promise.all([
      client.from("conversation_members").select("conversation_id,user_id,profiles(id,name,avatar_url)").in("conversation_id", ids).neq("user_id", currentUserId),
      client.from("messages").select("id,conversation_id,sender_id,body,created_at,read_at").in("conversation_id", ids).order("created_at", { ascending: false })
    ]);
    const next = ids.map((id) => { const member = (members || []).find((item) => item.conversation_id === id) as { profiles?: Person | Person[] | null } | undefined; const person = Array.isArray(member?.profiles) ? member?.profiles[0] : member?.profiles; const latest = (recentMessages || []).find((item) => item.conversation_id === id) as Message | undefined; return { id, updated_at: latest?.created_at || "", person: person || null, unread: (recentMessages || []).filter((item) => item.conversation_id === id && item.sender_id !== currentUserId && !item.read_at).length }; }).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    setConversations(next); if (!selectedId && next[0]) setSelectedId(next[0].id); setLoading(false);
  }
  useEffect(() => { if (!client || !selectedId) { setMessages([]); return; } void client.from("messages").select("id,conversation_id,sender_id,body,created_at,read_at").eq("conversation_id", selectedId).order("created_at").then(({ data }) => setMessages((data || []) as Message[])); }, [client, selectedId]);
  async function sendMessage(event?: FormEvent | KeyboardEvent) { event?.preventDefault(); if (!client || !userId || !draft.trim() || sending) return; setSending(true); let conversationId = selectedId; if (!conversationId && target) { const created = await client.from("conversations").insert({ created_by: userId }).select("id").single(); if (created.error || !created.data) { setError(created.error?.message || "Could not start conversation."); setSending(false); return; } conversationId = created.data.id; await client.from("conversation_members").insert([{ conversation_id: conversationId, user_id: userId }, { conversation_id: conversationId, user_id: target.id }]); setSelectedId(conversationId); } if (!conversationId) { setError("Choose a person before sending a message."); setSending(false); return; } const result = await client.from("messages").insert({ conversation_id: conversationId, sender_id: userId, body: draft.trim() }); if (result.error) setError(result.error.message); else { setDraft(""); await refreshConversations(userId); } setSending(false); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(event); } }
  const selected = conversations.find((item) => item.id === selectedId)?.person || target;
  if (!client) return <State text="Connect Supabase to use messages." />;
  if (!userId && !loading) return <State text="Sign in to use messages." />;
  return <main className="min-h-screen bg-slate-100 text-slate-900"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5"><a href="/feed" className="font-display text-2xl font-bold">talaash<span className="text-emerald-600">.</span></a><NotificationBell /></header><div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 lg:grid-cols-[280px_1fr]"><aside className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${selectedId ? "hidden lg:block" : "block"}`}><div className="border-b border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Inbox</p><h1 className="mt-1 font-display text-2xl font-bold">Messages</h1></div>{loading ? <LoaderCircle className="m-6 h-5 w-5 animate-spin text-emerald-700" /> : conversations.length === 0 ? <p className="p-6 text-sm text-slate-500">No conversations yet.</p> : conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left ${selectedId === conversation.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}><Avatar person={conversation.person} /><span className="min-w-0 flex-1 truncate text-sm font-bold">{conversation.person?.name || "Member"}</span>{conversation.unread > 0 && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">{conversation.unread}</span>}</button>)}</aside><section className={`flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${selectedId || target ? "block" : "hidden lg:flex"}`}><div className="flex items-center gap-3 border-b border-slate-100 p-5"><a href="/messages" className="lg:hidden"><ArrowLeft className="h-5 w-5 text-slate-500" /></a><Avatar person={selected} /><div><h2 className="font-bold">{selected?.name || "Select a conversation"}</h2><p className="text-xs text-slate-500">Private conversation</p></div></div>{error && <p className="m-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<div className="flex-1 space-y-3 overflow-auto p-5">{messages.map((message) => <div key={message.id} className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}><p className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_id === userId ? "rounded-br-sm bg-emerald-700 text-white" : "rounded-bl-sm bg-slate-100 text-slate-700"}`}>{message.body}</p></div>)}</div>{(selected || target) && <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-4"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={keyDown} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" /><button disabled={sending} className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form>}</section></div></main>;
}
function Avatar({ person }: { person: Person | null | undefined }) { return <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">{person?.avatar_url ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : person?.name?.slice(0, 1) || <UserRound className="h-4 w-4" />}</div>; }
function State({ text }: { text: string }) { return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center font-semibold text-slate-500">{text}</main>; }
