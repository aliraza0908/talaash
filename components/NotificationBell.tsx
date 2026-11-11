"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, UserPlus } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Notice = { id: string; type: string; text: string; link: string | null; read: boolean; created_at: string };

export default function NotificationBell() {
  const client = createSupabaseBrowserClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!client) return;
    const supabase = client;
    let cancelled = false;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      const { data } = await supabase.from("notifications").select("id,type,text,link,read,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20);
      if (data && !cancelled) setNotices(data as Notice[]);
      if (cancelled) return;
      const channel = supabase.channel(`notifications-${auth.user.id}-${Date.now()}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${auth.user.id}` }, (payload) => setNotices((current) => [payload.new as Notice, ...current].slice(0, 20)));
      channelRef.current = channel;
      try { channel.subscribe((status) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("Notification realtime failed", status); }); } catch (error) { console.error("Notification realtime setup failed", error); }
    }
    void load();
    return () => { cancelled = true; const channel = channelRef.current; channelRef.current = null; if (channel) void supabase.removeChannel(channel); };
  }, []);
  async function markRead(id?: string) { if (!client) return; const ids = id ? [id] : notices.filter((notice) => !notice.read).map((notice) => notice.id); if (!ids.length) return; await client.from("notifications").update({ read: true }).in("id", ids); setNotices((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read: true } : notice)); }
  const unread = notices.filter((notice) => !notice.read).length;
  return <div className="relative"><button aria-label="Notifications" onClick={() => { setOpen(!open); if (!open) void markRead(); }} className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 p-4"><strong>Notifications</strong><button onClick={() => void markRead()} className="text-xs font-bold text-emerald-700">Mark read</button></div><div className="max-h-80 overflow-auto">{notices.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">You are all caught up.</p> : notices.map((notice) => <a key={notice.id} href={notice.link || "#"} onClick={() => void markRead(notice.id)} className={`flex gap-3 border-b border-slate-100 p-4 text-sm hover:bg-slate-50 ${notice.read ? "" : "bg-emerald-50/50"}`}>{notice.type === "message" ? <MessageCircle className="h-4 w-4 shrink-0 text-emerald-700" /> : <UserPlus className="h-4 w-4 shrink-0 text-emerald-700" />}<span>{notice.text}</span></a>)}</div></div>}</div>;
}
