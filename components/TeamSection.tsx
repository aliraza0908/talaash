"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type TeamMember = { id: string; name: string; role: string; bio: string; photo_url: string | null; sort_order: number };

const demoTeam: TeamMember[] = [
  { id: "demo-1", name: "Ch.Aliraza", role: "CEO", bio: "Building a more open first step for Pakistan's next generation.", photo_url: "/team/ch-aliraza.png", sort_order: 1 },
  { id: "demo-2", name: "MaheenNoor", role: "Co-Founder", bio: "Making useful technology feel close, human, and possible.", photo_url: "/team/maheen-noor.png", sort_order: 2 },
  { id: "demo-3", name: "Maham Siddiqui", role: "Community Lead", bio: "Helping good people find the room where their work can grow.", photo_url: null, sort_order: 3 }
];

export default function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>(demoTeam);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    client.from("team_members").select("id,name,role,bio,photo_url,sort_order").order("sort_order").then(({ data }) => {
      if (data?.length) setMembers(data as TeamMember[]);
    });
  }, []);

  return <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
    <div className="mb-12 max-w-xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-moss">The people behind Talash</p><h2 className="font-display text-4xl font-bold sm:text-5xl">Small team.<br /><span className="text-moss">Big belief.</span></h2></div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{members.map((member) => <article key={member.id} className="group"><div className="relative aspect-square overflow-hidden rounded-2xl bg-mint">{member.photo_url ? <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" /> : <div className="flex h-full items-center justify-center bg-moss font-display text-7xl font-bold text-sun">{getInitials(member.name)}</div>}<div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">{member.role}</div></div><div className="mt-4 flex items-start gap-2"><div className="flex-1"><h3 className="font-display text-xl font-bold">{member.name}</h3><p className="mt-2 text-sm leading-6 text-ink/55">{member.bio}</p></div>{isLeadership(member.role) && <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-moss" />}</div></article>)}</div>
  </section>;
}

function getInitials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function isLeadership(role: string) { return role === "CEO" || role === "Co-Founder"; }