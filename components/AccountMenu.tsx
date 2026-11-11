"use client";

import Link from "next/link";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function AccountMenu({ isAdmin, name }: { isAdmin: boolean; name?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="relative"><button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{name?.slice(0, 1) || "?"}</span><span className="hidden max-w-24 truncate sm:inline">{name || "Account"}</span><ChevronDown className="h-4 w-4" /></button>{open && <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link href="/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Profile</Link>{isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><ShieldCheck className="h-4 w-4" /> Admin</Link>}<Link href="/auth" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Sign out</Link></div>}</div>;
}
