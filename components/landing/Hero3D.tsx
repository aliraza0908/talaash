"use client";

import dynamic from "next/dynamic";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StaticScene } from "./HeroScene";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => <StaticScene /> });

export default function Hero3D() {
  const container = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReducedMotion(media.matches); update(); media.addEventListener("change", update); const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 }); if (container.current) observer.observe(container.current); return () => { media.removeEventListener("change", update); observer.disconnect(); }; }, []);
  function move(event: React.PointerEvent<HTMLDivElement>) { const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: ((event.clientX - rect.left) / rect.width - .5) * 2, y: ((event.clientY - rect.top) / rect.height - .5) * -2 }); }
  return <div ref={container} onPointerMove={move} className="relative h-[330px] w-full sm:h-[430px] lg:h-[520px]"><div className="absolute inset-0 landing-dots opacity-40" />{reducedMotion ? <StaticScene /> : <HeroScene paused={paused || !visible} pointer={pointer} />}<div className="absolute left-2 top-1/4 rounded-xl border border-plum/10 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-plum/55 shadow-float backdrop-blur-sm sm:left-4">Your skills</div><div className="absolute bottom-1/4 right-0 rounded-xl border border-plum/10 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-plum/55 shadow-float backdrop-blur-sm sm:right-4">Your people</div><button type="button" aria-label={paused ? "Play animation" : "Pause animation"} onClick={() => setPaused(!paused)} className="absolute bottom-4 right-1/2 flex h-10 w-10 translate-x-1/2 items-center justify-center rounded-full border border-plum/15 bg-white/90 text-plum shadow-sm transition hover:scale-105 active:scale-95">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button></div>;
}
