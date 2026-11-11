"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type TeamMember = { id: string; name: string; role: string; bio: string; photo_url: string | null; sort_order: number };

const localTeamPhotos = [
  "/team/maheen-noor.png",
  "/team/ch-aliraza.png",
  "/team/amta-hafeez.png",
];

export default function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    client.from("team_members").select("id,name,role,bio,photo_url,sort_order").order("sort_order").then(({ data, error }) => {
      if (error) {
        console.error("Team members query failed", { message: error.message, details: error.details });
        return;
      }
      setMembers((data || []) as TeamMember[]);
    });
  }, []);

  if (!members.length) return null;

  return <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
    <div className="mb-12 max-w-xl">
      <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-moss">The people behind Talash</p>
      <h2 className="font-display text-4xl font-bold sm:text-5xl">Small team.<br /><span className="text-moss">Big belief.</span></h2>
    </div>
    <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-nowrap lg:justify-center lg:overflow-visible">
      {members.map((member, index) => {
        const fallbackPhoto = getFallbackPhoto(member.name, index);
        return <article key={member.id} className="group min-w-[220px] flex-none snap-start lg:min-w-0 lg:flex-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <img
            src={member.photo_url || fallbackPhoto}
            alt={member.name}
            onError={(event) => {
              if (event.currentTarget.src.endsWith(fallbackPhoto)) return;
              event.currentTarget.src = fallbackPhoto;
            }}
            className="h-full w-full object-cover grayscale transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_30px_rgba(61,47,69,.14)]"
          />
          <div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">{member.role}</div>
        </div>
        <div className="mt-4 flex items-start gap-2">
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold">{member.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/55">{member.bio}</p>
          </div>
          {isLeadership(member.role) && <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-moss" />}
        </div>
      </article>;
      })}
    </div>
  </section>;
}

function getFallbackPhoto(name: string, index: number) {
  const normalizedName = name.toLowerCase().replace(/[^a-z]+/g, "-");
  const matchingPhoto = localTeamPhotos.find((photo) => photo.includes(normalizedName));
  return matchingPhoto || localTeamPhotos[index % localTeamPhotos.length];
}

function isLeadership(role: string) { return role === "CEO" || role === "Co-Founder"; }
