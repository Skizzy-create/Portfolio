"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, SplitText, useGSAP, Magnetic, useImage } from "./motion";
import { profile } from "@/lib/content";

/* Deterministic silhouettes so the hero looks finished before any artwork is
   dropped into /public/images. Generated art replaces them automatically. */
function rand(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
function ridge(seed: number, base: number, amp: number, steps = 28) {
  const r = rand(seed);
  let d = `M0 400 L0 ${base}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * 1600;
    const y = base - amp * (0.35 + r() * 0.65) * Math.sin((i / steps) * Math.PI * (1.2 + r()));
    d += ` L${x.toFixed(0)} ${Math.min(y, base + 20).toFixed(0)}`;
  }
  return d + " L1600 400 Z";
}
function pines(seed: number, base: number, count: number, h: number) {
  const r = rand(seed);
  let d = `M0 400 L0 ${base}`;
  for (let i = 0; i < count; i++) {
    const x = (i / count) * 1600 + r() * 20;
    const ph = h * (0.5 + r() * 0.8);
    const w = ph * 0.32;
    d += ` L${x - w} ${base} L${x} ${base - ph} L${x + w} ${base}`;
  }
  return d + " L1600 400 Z";
}

const layers = [
  { src: "/images/hero-mountains-far.png", speed: 0.15, fallback: ridge(7, 250, 170), fill: "url(#far)" },
  { src: "/images/hero-mountains-near.png", speed: 0.3, fallback: ridge(19, 300, 140, 22), fill: "url(#near)" },
  { src: "/images/hero-forest.png", speed: 0.5, fallback: pines(41, 360, 90, 120), fill: "#03100b" },
];

function Layer({ src, fallback, fill }: { src: string; fallback: string; fill: string }) {
  const ok = useImage(src);
  if (ok) return <img src={src} alt="" className="absolute bottom-0 left-0 w-full select-none object-cover object-bottom" draggable={false} />;
  return (
    <svg viewBox="0 0 1600 400" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[55vh] w-full">
      <defs>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#123a2d" stopOpacity="0.85" />
          <stop offset="1" stopColor="#061a13" />
        </linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b2a20" />
          <stop offset="1" stopColor="#04120d" />
        </linearGradient>
      </defs>
      <path d={fallback} fill={fill} />
    </svg>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [role, setRole] = useState(0);
  // "Environments that can't be gamed. Systems that stay up." — second sentence glows
  const cut = profile.headline.indexOf(". ") + 2;
  const headA = profile.headline.slice(0, cut), headB = profile.headline.slice(cut);

  useEffect(() => {
    const id = setInterval(() => setRole((r) => (r + 1) % profile.roles.length), 2800);
    return () => clearInterval(id);
  }, []);

  useGSAP(() => {
    const root = ref.current!;
    const split = SplitText.create(root.querySelector("h1")!, { type: "chars,words", mask: "chars" });
    gsap.set(split.chars, { yPercent: 120 });
    gsap.set(root.querySelectorAll("[data-fade]"), { opacity: 0, y: 24 });

    const intro = () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(root.querySelectorAll("[data-layer] > *"), { yPercent: 25, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 2.2, stagger: 0.12 })
        .to(split.chars, { yPercent: 0, duration: 1.5, stagger: 0.035 }, 0.2)
        .to(root.querySelectorAll("[data-fade]"), { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.8);
    };
    gsap.set(root.querySelectorAll("[data-layer] > *"), { opacity: 0 });
    window.addEventListener("intro:done", intro, { once: true });

    // parallax: each layer sinks at its own pace, the title drifts and dissolves
    root.querySelectorAll<HTMLElement>("[data-layer]").forEach((el) => {
      gsap.to(el, {
        yPercent: Number(el.dataset.speed) * 60, ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
    });
    gsap.to(root.querySelector("[data-title]"), {
      yPercent: -40, scale: 0.92, opacity: 0, filter: "blur(10px)", ease: "none",
      scrollTrigger: { trigger: root, start: "top top", end: "70% top", scrub: true },
    });
    return () => { split.revert(); window.removeEventListener("intro:done", intro); };
  }, { scope: ref });

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[680px] overflow-hidden">
      {/* landscape */}
      <div className="absolute inset-0">
        {layers.map((l, i) => (
          <div key={l.src} data-layer data-speed={l.speed} className="absolute inset-0" style={{ zIndex: i }}>
            <Layer {...l} />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-night to-transparent" />
      </div>

      {/* title */}
      <div data-title className="relative z-20 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6 pb-[14vh] pt-24 text-center">
        <div data-fade className="glass-soft mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs text-mist/80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-glow/70" />
            <span className="relative h-2 w-2 rounded-full bg-glow" />
          </span>
          {profile.status}
        </div>

        <div data-fade className="mb-5 h-6 overflow-hidden font-mono text-xs tracking-[0.28em] text-mist/60 uppercase sm:text-sm">
          <div className="transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: `translateY(-${role * 1.5}rem)` }}>
            {profile.roles.map((r) => (
              <p key={r} className="h-6 leading-6">{r}</p>
            ))}
          </div>
        </div>
        <h1 className="[filter:drop-shadow(0_0_36px_rgba(124,245,200,0.16))] font-display text-[clamp(3.6rem,13vw,12.5rem)] leading-[0.86] tracking-[-0.035em]">
          Kartik <em className="pr-[0.06em] text-[var(--color-glow)]">Aslia</em>
        </h1>

        <p data-fade className="mt-8 font-display text-[clamp(1.5rem,3.2vw,2.6rem)] leading-[1.12] tracking-[-0.01em]">
          <span className="block">{headA.trim()}</span>
          <span className="block italic text-glow">{headB}</span>
        </p>
        <p data-fade className="mt-5 max-w-2xl text-sm leading-relaxed text-mist/60 md:text-base">{profile.subline}</p>

        <div data-fade className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <a href="#work" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-mist px-7 py-3.5 text-sm font-medium text-night">
              <span className="absolute inset-0 translate-y-full rounded-full bg-glow transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
              <span className="relative">Explore the work</span>
              <span className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
          </Magnetic>
          <Magnetic>
            <a href={profile.resume} target="_blank" className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm text-mist">
              Résumé <span className="text-mist/50">PDF</span>
            </a>
          </Magnetic>
        </div>
      </div>

      {/* scroll cue */}
      <div data-fade className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-[10px] tracking-[0.35em] text-mist/50 uppercase">
        Scroll
        <span className="relative h-12 w-px overflow-hidden bg-mist/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-glow" />
        </span>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
