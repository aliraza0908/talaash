"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Pencil, Plus, Send, ShieldAlert, Trash2, Upload, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type TeamMember = { id: string; name: string; role: string; bio: string; photo_url: string | null; sort_order: number };
type FormState = Omit<TeamMember, "id">;
const emptyForm: FormState = { name: "", role: "Team member", bio: "", photo_url: "", sort_order: 0 };

export default function TeamAdminPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const client = createSupabaseBrowserClient();

  useEffect(() => {
    async function checkAdmin() {
      if (!client) { setAllowed(false); return; }
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { setAllowed(false); return; }
      const { data: profile } = await client.from("profiles").select("role").eq("id", auth.user.id).single();
      if (profile?.role !== "Admin" && profile?.role !== "admin") { setAllowed(false); return; }
      setAllowed(true);
      await loadMembers();
    }
    void checkAdmin();
  }, []);

  async function loadMembers() {
    if (!client) return;
    const { data } = await client.from("team_members").select("id,name,role,bio,photo_url,sort_order").order("sort_order");
    if (data) setMembers(data as TeamMember[]);
  }

  async function uploadPhoto(file: File) {
    if (!client) return;
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
    const { error } = await client.storage.from("team-photos").upload(path, file, { upsert: true });
    if (error) { setMessage(error.message); return; }
    const { data } = client.storage.from("team-photos").getPublicUrl(path);
    setForm((current) => ({ ...current, photo_url: data.publicUrl }));
    setMessage("Photo uploaded.");
  }

  async function saveMember(event: FormEvent) {
    event.preventDefault();
    if (!client || !form.name.trim()) return;
    const result = editingId ? await client.from("team_members").update(form).eq("id", editingId) : await client.from("team_members").insert(form);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(editingId ? "Team member updated." : "Team member added.");
    setForm(emptyForm); setEditingId(null); await loadMembers();
  }

  async function deleteMember(id: string) {
    if (!client || !window.confirm("Delete this team member?")) return;
    const { error } = await client.from("team_members").delete().eq("id", id);
    if (error) { setMessage(error.message); return; }
    setMembers((current) => current.filter((member) => member.id !== id));
    setMessage("Team member deleted.");
  }

  async function sendTestEmail() {
    if (!client) { setTestStatus("Supabase is not configured."); return; }
    setTestStatus("Sending...");
    const { data } = await client.auth.getSession();
    if (!data.session) { setTestStatus("Your admin session has expired."); return; }
    const response = await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ type: "admin-alert", data: { email: "Admin test", role: "Admin" } }) });
    const result = await response.json() as { success?: boolean; skipped?: boolean; error?: string };
    setTestStatus(result.success ? (result.skipped ? "Email skipped: Resend is not configured." : "Test email sent.") : result.error || "Email failed.");
  }

  function editMember(member: TeamMember) { setEditingId(member.id); setForm({ name: member.name, role: member.role, bio: member.bio, photo_url: member.photo_url || "", sort_order: member.sort_order }); }
  function handleFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); }

  if (allowed === null) return <CenteredState text="Checking admin access..." />;
  if (!allowed) return <CenteredState text="This page is only available to Talash admins." blocked />;

  return <main className="min-h-screen bg-paper"><header className="border-b border-ink/10 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55"><ArrowLeft className="h-4 w-4" /> Back to workspace</Link><span className="font-display text-xl font-bold">Team admin<span className="text-sun">.</span></span></div></header><div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]"><section><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Content management</p><h1 className="mt-2 font-display text-4xl font-bold">Meet our team</h1><p className="mt-2 text-sm text-ink/55">Manage homepage members and email delivery.</p></div><div className="mb-6 rounded-2xl border border-sun/50 bg-sun/10 p-5"><div className="flex items-start gap-3"><Send className="mt-1 h-5 w-5 text-moss" /><div className="flex-1"><h2 className="font-display text-lg font-bold">Email delivery</h2><p className="mt-1 text-xs leading-5 text-ink/55">Send a server-side test message to the configured admin address.</p></div><button onClick={() => void sendTestEmail()} className="rounded-full bg-moss px-3 py-2 text-xs font-semibold text-white hover:bg-ink">Send test email</button></div>{testStatus && <p className="mt-3 text-xs font-semibold text-moss">{testStatus}</p>}</div><div className="space-y-3">{members.map((member) => <article key={member.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss text-lg font-bold text-sun">{member.photo_url ? <img src={member.photo_url} alt="" className="h-full w-full object-cover" /> : getInitials(member.name)}</div><div className="min-w-0 flex-1"><h2 className="font-display text-lg font-bold">{member.name}</h2><p className="text-xs font-semibold text-moss">{member.role}</p><p className="mt-1 truncate text-sm text-ink/50">{member.bio}</p></div><button onClick={() => editMember(member)} aria-label={`Edit ${member.name}`} className="rounded-lg p-2 text-ink/45 hover:bg-ink/5"><Pencil className="h-4 w-4" /></button><button onClick={() => void deleteMember(member.id)} aria-label={`Delete ${member.name}`} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></article>)}{members.length === 0 && <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center text-sm text-ink/50">No team members yet. Add the first one.</div>}</div></section><form onSubmit={saveMember} className="h-fit rounded-2xl border border-ink/10 bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{editingId ? "Edit member" : "Add member"}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X className="h-4 w-4 text-ink/45" /></button>}</div><label className="mt-6 block text-xs font-bold uppercase tracking-wider text-ink/45">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-moss" /></label><label className="mt-4 block text-xs font-bold uppercase tracking-wider text-ink/45">Role<input required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="CEO or Co-Founder" className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-moss" /></label><label className="mt-4 block text-xs font-bold uppercase tracking-wider text-ink/45">Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-moss" /></label><label className="mt-4 block text-xs font-bold uppercase tracking-wider text-ink/45">Sort order<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-3 text-sm outline-none focus:border-moss" /></label><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-moss bg-mint/30 px-4 py-4 text-sm font-semibold text-moss"><ImagePlus className="h-4 w-4" /> Upload photo<input type="file" accept="image/*" onChange={handleFile} className="hidden" /></label>{form.photo_url && <p className="mt-2 truncate text-xs text-ink/45">Photo ready: {form.photo_url}</p>}<button className="mt-6 w-full rounded-xl bg-moss py-3.5 text-sm font-semibold text-white hover:bg-ink">{editingId ? <><Upload className="mr-2 inline h-4 w-4" /> Save changes</> : <><Plus className="mr-2 inline h-4 w-4" /> Add team member</>}</button>{message && <p className="mt-4 text-center text-xs font-semibold text-moss">{message}</p>}</form></div></main>;
}

function CenteredState({ text, blocked = false }: { text: string; blocked?: boolean }) { return <main className="flex min-h-screen items-center justify-center bg-paper p-6"><div className="max-w-sm text-center">{blocked ? <ShieldAlert className="mx-auto h-10 w-10 text-sun" /> : <Upload className="mx-auto h-10 w-10 animate-pulse text-moss" />}<h1 className="mt-5 font-display text-2xl font-bold">{text}</h1>{blocked && <Link href="/app" className="mt-5 inline-block text-sm font-bold text-moss">Return to workspace</Link>}</div></main>; }
function getInitials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
