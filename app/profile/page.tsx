"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, FileText, LoaderCircle, MessageCircle, UserPlus, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Item = { id: string; post_type: string; title: string | null; body: string; price: number | null; created_at: string };

export default function ProfilePage() {
  const client = createSupabaseBrowserClient();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("Your profile");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState("Member");
  const [ownUserId, setOwnUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!client) { setLoading(false); return; }
    const supabase = client;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setLoading(false); return; }
      const viewedId = new URLSearchParams(window.location.search).get("user") || auth.user.id;
      setOwnUserId(auth.user.id); setProfileId(viewedId);
      const [{ data: profile }, { data: posts }, { data: connection }] = await Promise.all([
        supabase.from("profiles").select("name,role").eq("id", viewedId).maybeSingle(),
        supabase.from("posts").select("id,post_type,title,body,price,created_at").eq("author_id", viewedId).order("created_at", { ascending: false }),
        viewedId === auth.user.id ? Promise.resolve({ data: null }) : supabase.from("connections").select("status").or(`and(requester_id.eq.${auth.user.id},receiver_id.eq.${viewedId}),and(requester_id.eq.${viewedId},receiver_id.eq.${auth.user.id})`).maybeSingle()
      ]);
      if (profile?.name) setName(profile.name);
      if (profile?.role) setProfileRole(profile.role);
      if (connection?.status) setConnectionStatus(connection.status);
      setItems((posts || []) as Item[]); setLoading(false);
    }
    void load();
  }, []);
  if (!client) return <State text="Connect Supabase to load your profile." />;
  if (loading) return <State text="Loading your profile..." />;
  async function connect() { if (!client || !ownUserId || !profileId || ownUserId === profileId) return; const result = await client.from("connections").insert({ requester_id: ownUserId, receiver_id: profileId }); if (!result.error) setConnectionStatus("pending"); }
  return <AppShell active="Profile"><main className="min-h-screen px-5 py-10 pb-28 text-[#29282d] sm:px-8"><div className="mx-auto max-w-3xl"><section className="rounded-2xl bg-[#302b36] p-7 text-white shadow-sm"><div className="flex items-start justify-between gap-4"><div><UserRound className="h-8 w-8 text-[#d6cba3]" /><h1 className="mt-5 text-4xl font-normal">{name}</h1><p className="mt-2 text-sm text-[#c5bfca]">{profileRole} · Shared work, projects, gigs, and requests.</p></div>{ownUserId !== profileId && <div className="flex shrink-0 gap-2"><button onClick={() => void connect()} disabled={connectionStatus !== null} className="rounded-lg bg-[#d6cba3] px-3 py-2 text-xs font-bold text-[#302b36] disabled:opacity-60"><UserPlus className="mr-1 inline h-3.5 w-3.5" />{connectionStatus || "Connect"}</button><a href={`/messages?user=${profileId}`} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="mr-1 inline h-3.5 w-3.5" />Message</a></div>}</div></section><div className="mt-6 space-y-3">{items.length === 0 ? <div className="rounded-2xl border border-[#deddd8] bg-white p-10 text-center"><p className="text-xl">{ownUserId === profileId ? "Your work will appear here." : "This profile has no shared work yet."}</p><a href="/feed" className="mt-4 inline-block rounded-lg bg-[#756548] px-4 py-2 text-sm font-bold text-white">Back to feed</a></div> : items.map((item) => <article key={item.id} className="rounded-2xl border border-[#deddd8] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#756548]">{item.post_type === "gig" ? <BriefcaseBusiness className="h-4 w-4" /> : <FileText className="h-4 w-4" />}{item.post_type}</div>{item.title && <h2 className="mt-3 text-xl font-bold">{item.title}</h2>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#77747b]">{item.body}</p>{item.price !== null && <strong className="mt-4 block text-[#756548]">${item.price}</strong>}<p className="mt-4 text-xs text-[#9b989e]">{new Date(item.created_at).toLocaleDateString()}</p></article>)}</div></div></main></AppShell>;
}
function State({ text }: { text: string }) { return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="text-center text-sm font-semibold text-slate-500"><LoaderCircle className="mx-auto mb-4 h-6 w-6 animate-spin text-emerald-700" />{text}</div></main>; }
