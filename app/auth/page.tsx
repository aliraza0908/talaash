"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Mail } from "lucide-react";
import { Role } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const roles: { name: Role; description: string }[] = [
  { name: "Student", description: "Showcase work and find opportunities" },
  { name: "Client", description: "Find talented people for your next project" },
  { name: "Professor", description: "Mentor and grow the community" }
];

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<Role>("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const validStudent = role !== "Student" || /\.(edu\.pk|ac\.pk)$/.test(email.split("@")[1] || "");

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!validStudent) return;
    const client = createSupabaseBrowserClient();
    if (!client) { setSent(true); return; }
    const result = mode === "signup"
      ? await client.auth.signUp({ email, password, options: { data: { role } } })
      : await client.auth.signInWithOtp({ email });
    if (result.error) { setError(result.error.message); return; }
    if (mode === "signup" && result.data.session && result.data.user?.email) {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${result.data.session.access_token}` };
      await fetch("/api/email", { method: "POST", headers, body: JSON.stringify({ type: "welcome", to: result.data.user.email, data: { name: result.data.user.email.split("@")[0], role } }) });
      if (role === "Student") await fetch("/api/email", { method: "POST", headers, body: JSON.stringify({ type: "admin-alert", data: { email: result.data.user.email, role } }) });
    }
    setSent(true);
  }

  return <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
    <div className="hidden bg-moss p-12 text-white lg:flex lg:flex-col lg:justify-between"><div><Link href="/" className="font-display text-2xl font-bold">talash<span className="text-sun">.</span></Link><div className="mt-32 max-w-md"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-mint">A better first step</p><h1 className="font-display text-6xl font-bold leading-[.95]">Your next opportunity starts here.</h1><p className="mt-8 text-lg leading-8 text-white/60">One profile, a whole community of people invested in what you can become.</p></div></div><p className="text-sm text-white/50">Built for Pakistan’s students and fresh graduates.</p></div>
    <div className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-14 inline-flex items-center gap-2 text-sm font-semibold text-ink/50 lg:hidden"><ArrowLeft className="h-4 w-4" /> Back to Talash</Link>
      <div className="mb-10"><div className="mb-6 flex gap-1 rounded-full bg-ink/5 p-1 text-sm font-semibold"><button onClick={() => setMode("signup")} className={`flex-1 rounded-full py-2.5 ${mode === "signup" ? "bg-white shadow-sm" : "text-ink/40"}`}>Create account</button><button onClick={() => setMode("login")} className={`flex-1 rounded-full py-2.5 ${mode === "login" ? "bg-white shadow-sm" : "text-ink/40"}`}>Log in</button></div><h2 className="font-display text-4xl font-bold">{mode === "signup" ? "Let’s get you in." : "Welcome back."}</h2><p className="mt-3 text-ink/50">{mode === "signup" ? "Choose how you’ll use Talash." : "Enter your email and we’ll send a secure OTP."}</p></div>
      {mode === "signup" && <div className="mb-8 grid gap-3">{roles.map((item) => <button key={item.name} onClick={() => setRole(item.name)} className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${role === item.name ? "border-moss bg-mint/50" : "border-ink/10 hover:border-ink/30"}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${role === item.name ? "border-moss bg-moss text-white" : "border-ink/20"}`}>{role === item.name && <Check className="h-3 w-3" />}</span><span><strong className="block text-sm">{item.name}</strong><small className="text-xs text-ink/50">{item.description}</small></span></button>)}</div>}
      {sent ? <div className="rounded-2xl bg-mint p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-moss text-white"><Mail className="h-5 w-5" /></div><h3 className="font-display text-2xl font-bold">Check your inbox.</h3><p className="mt-2 text-sm leading-6 text-ink/60">We sent a one-time verification code to {email}. Supabase Auth is handling this email OTP.</p><button onClick={() => setSent(false)} className="mt-5 text-sm font-bold text-moss">Use a different email</button></div> : <form onSubmit={submitAuth}><label className="mb-2 block text-sm font-semibold">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={role === "Student" ? "you@university.edu.pk" : "you@company.com"} className="w-full rounded-xl border border-ink/15 bg-white px-11 py-3.5 outline-none ring-moss/20 transition focus:ring-4" /></div>{mode === "signup" && <><label className="mb-2 mt-4 block text-sm font-semibold">Password</label><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3.5 outline-none ring-moss/20 transition focus:ring-4" /></>}{!validStudent && <p className="mt-2 text-xs font-semibold text-red-600">Students need a valid university email ending in .edu.pk or .ac.pk.</p>}{error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}<button disabled={!validStudent} className="mt-5 w-full rounded-xl bg-ink py-4 font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40">Continue with email <ArrowRight className="ml-1 inline h-4 w-4" /></button><div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink/40"><LockKeyhole className="h-3.5 w-3.5" /> Email OTP verification via Supabase Auth</div></form>}
      <div className="mt-8 rounded-xl border border-dashed border-sun bg-sun/10 p-4 text-xs leading-5 text-ink/60"><strong className="text-ink">Coming next:</strong> WhatsApp OTP and student card upload are intentionally reserved here as verification placeholders.</div>
    </div></div>
  </main>;
}
