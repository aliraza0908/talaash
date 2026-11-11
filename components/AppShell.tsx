"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Grid2X2, Home, Menu, MessageCircle, Search, Share2, Sparkles, Users, X } from "lucide-react";

const links = [
  { href: "/feed", label: "My feed", icon: Home },
  { href: "/dashboard", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/app", label: "Marketplace", icon: Grid2X2 },
  { href: "/network", label: "My network", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export default function AppShell({ children, active = "My feed" }: { children: ReactNode; active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-[#f7f7f2] text-[#29282d]">
    <header className="sticky top-0 z-30 bg-[#f7f7f2]">
      <div className="flex h-16 items-center justify-between border-b border-[#e6e5df] px-5 sm:px-8">
        <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-[#625f69] transition hover:bg-white"><Menu className="h-6 w-6" /></button>
        <Link href="/feed" className="font-display text-xl font-bold tracking-tight sm:hidden">talaash<span className="text-[#756548]">.</span></Link>
        <div className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-[#756548]" /><span className="text-xs font-semibold uppercase tracking-[.22em] text-[#756548]">A place for every skill</span></div>
        <div className="flex items-center gap-3"><button aria-label="Share" className="rounded-lg p-2 text-[#29282d] hover:bg-white"><Share2 className="h-5 w-5" /></button><button aria-label="More" className="text-2xl leading-none">⋮</button></div>
      </div>
      <div className="flex h-[76px] items-center gap-3 border-b border-[#e6e5df] px-5 sm:px-8">
        <Link href="/feed" className="hidden h-12 w-12 items-center justify-center rounded-xl border border-[#e2e0d8] bg-white text-2xl text-[#756548] sm:flex">←</Link>
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8d8a91]" /><input aria-label="Search" placeholder="Search people, institutes, services..." className="h-14 w-full rounded-xl border border-[#e1e0e5] bg-[#f0f0f5] pl-12 pr-4 text-sm outline-none transition focus:border-[#756548] focus:bg-white" /></div>
        <span className="text-2xl text-[#756548]">♧</span>
      </div>
    </header>
    <div className="mx-auto max-w-7xl">{children}</div>
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-[#dedee4] bg-[#fafaff] px-2 py-2 shadow-[0_-8px_24px_rgba(45,42,50,.08)] sm:hidden">{[{ href: "/feed", label: "Feed", icon: Home }, { href: "/dashboard", label: "Projects", icon: BriefcaseBusiness }, { href: "/app", label: "Gigs", icon: Grid2X2 }, { href: "/network", label: "Network", icon: Users }, { href: "/messages", label: "Messages", icon: MessageCircle }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-1 text-[10px] ${active === label || (active === "My feed" && label === "Feed") ? "text-[#403653]" : "text-[#9b9ba4]"}`}><Icon className="h-6 w-6" /><span>{label}</span></Link>)}</nav>
    {menuOpen && <div className="fixed inset-0 z-50 bg-[#29242f]/45" onClick={() => setMenuOpen(false)}><aside onClick={(event) => event.stopPropagation()} className="flex h-full w-[min(84vw,396px)] flex-col overflow-y-auto bg-[#29242f] px-7 py-8 text-[#f4f0e9] shadow-2xl">
      <div className="mb-9 flex items-start justify-between"><div><div className="flex items-center gap-3 text-3xl font-semibold">◉ <span>talaash<span className="text-[#d6cba3]">.</span></span></div><p className="mt-3 pl-10 text-[10px] uppercase tracking-[.2em] text-[#afa8bd]">Turn your skills into opportunity.</p></div><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="h-6 w-6" /></button></div>
      <p className="mb-3 text-[10px] uppercase tracking-[.22em] text-[#aaa1b5]">My workspace</p>
      <div className="space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-4 rounded-xl px-4 py-4 text-base ${active === label ? "bg-[#4b4054] text-white" : "text-[#d1ccd7] hover:bg-[#3a3342]"}`}><Icon className="h-6 w-6" />{label}{label === "Opportunities" && <span className="ml-auto rounded border border-[#b8adbf] px-1 text-[9px] uppercase">Explore</span>}</Link>)}</div>
      <p className="mb-3 mt-10 text-[10px] uppercase tracking-[.22em] text-[#aaa1b5]">Your next chapter</p>
      <div className="space-y-1 text-[#d1ccd7]"><Link href="/app" className="flex items-center gap-4 px-4 py-4"><Sparkles className="h-6 w-6" />Growth studio<span className="ml-auto rounded border border-[#b8adbf] px-1 text-[9px]">AI</span></Link><Link href="/dashboard" className="flex items-center gap-4 px-4 py-4"><BriefcaseBusiness className="h-6 w-6" />Projects and orders</Link><Link href="/profile" className="flex items-center gap-4 px-4 py-4"><Users className="h-6 w-6" />Verification</Link></div>
      <div className="mt-auto rounded-2xl border border-[#66576f] bg-gradient-to-br from-[#4d3d58] to-[#332b3d] p-6"><Sparkles className="h-7 w-7 text-[#e2d5a5]" /><h3 className="mt-6 text-xl">You have the skills.<br />Let your work speak.</h3><p className="mt-5 text-xs leading-5 text-[#bcb2c3]">Take the next step in your professional journey.</p><Link href="/profile" className="mt-6 block border-t border-[#66576f] pt-4 text-sm">My growth plan ↗</Link></div>
      <div className="mt-8 border-t border-[#4c4451] pt-5 text-sm text-[#d1ccd7]">◯ &nbsp; Your professional profile</div>
    </aside></div>}
  </div>;
}
