"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [{ label: "Home", href: "#home" }, { label: "How it works", href: "#how" }, { label: "Gigs", href: "/feed" }, { label: "Our Team", href: "#team" }, { label: "About", href: "#about" }];

export default function Header() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-plum/10 bg-cream/90 backdrop-blur-md"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" className="font-display text-[27px] font-bold tracking-[-.04em] text-plum">talaash<span className="text-sage">.</span></Link><nav className="hidden items-center gap-8 text-sm font-medium text-plum/65 lg:flex">{links.map((link) => <a key={link.label} href={link.href} className="transition hover:text-plum">{link.label}</a>)}</nav><div className="hidden items-center gap-3 lg:flex"><Link href="/auth" className="rounded-full border border-plum/20 px-5 py-2.5 text-sm font-semibold text-plum transition hover:border-plum hover:bg-white">Sign in <span aria-hidden="true">→</span></Link><Link href="/auth" className="rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sage active:scale-95">Join free</Link></div><button type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full border border-plum/15 text-plum lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div><AnimatePresence>{open && <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-plum/10 bg-cream lg:hidden"><div className="space-y-1 px-5 py-4 sm:px-8">{links.map((link) => <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-semibold text-plum/75 hover:bg-white">{link.label}</a>)}<Link href="/auth" onClick={() => setOpen(false)} className="mt-3 block rounded-xl bg-plum px-4 py-3 text-center font-semibold text-white">Join free</Link></div></motion.nav>}</AnimatePresence></header>;
}
