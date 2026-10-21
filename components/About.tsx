"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, sheen } from "./motion";
import { ecosystem, profile, stats, education } from "@/lib/content";

export function Marquee() {
  const words = ecosystem.flatMap((g) => g.items.slice(0, 4));
  const row = [...words, ...words];
  return (
    <div className="relative border-y border-white/5 py-6 [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl italic text-mist/40 md:text-4xl">
            {w}
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-glow/60"><path d="M7 0C7 4 10 7 14 7C10 7 7 10 7 14C7 10 4 7 0 7C4 7 7 4 7 0Z" fill="currentColor" /></svg>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function About() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = ref.current!;
    // words light up one by one as you read down the page
    const split = SplitText.create(root.querySelector("[data-manifesto]")!, { type: "words" });
    gsap.fromTo(split.words, { opacity: 0.12 }, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: root.querySelector("[data-manifesto]"), start: "top 80%", end: "bottom 45%", scrub: true },
    });

    root.querySelectorAll<HTMLElement>("[data-stat]").forEach((el) => {
      const target = Number(el.dataset.stat);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 2.2, ease: "power3.out",
        onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en-US")),
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });

    gsap.from(root.querySelectorAll("[data-card]"), {
      y: 70, opacity: 0, rotateX: -12, transformOrigin: "50% 100%", duration: 1.3, stagger: 0.08, ease: "expo.out",
      scrollTrigger: { trigger: root.querySelector("[data-grid]"), start: "top 85%" },
    });
    return () => split.revert();
  }, { scope: ref });

  return (
    <section ref={ref} id="about" className="relative mx-auto max-w-7xl px-6 py-32 md:py-48">
      <p className="eyebrow mb-10 flex items-center gap-3"><span className="h-px w-8 bg-glow/60" />About</p>

      <div className="max-w-5xl">
        <div>
          <p data-manifesto className="font-display text-[clamp(1.8rem,3.6vw,3.4rem)] leading-[1.1] tracking-[-0.015em]">
            {profile.manifesto}
          </p>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-3 font-mono text-xs tracking-wider text-mist/55 uppercase">
            <span>◦ {profile.location}</span>
            <span>◦ {education.degree} · {education.school}</span>
            <span>◦ Remote-first, worldwide</span>
          </div>
        </div>
      </div>

      {/* bento of impact */}
      <div data-grid className="mt-24 grid grid-cols-1 gap-4 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((s, i) => (
          <article
            key={s.label}
            data-card
            onPointerMove={sheen}
            className={`glass group overflow-hidden rounded-[28px] p-7 ${i === 0 ? "lg:col-span-3 lg:row-span-2 lg:p-10" : i === 1 ? "lg:col-span-3" : "lg:col-span-2"}`}
          >
            <div className="flex items-baseline gap-1">
              <span data-stat={s.value} className={`font-display tabular-nums leading-none ${i === 0 ? "text-[clamp(5rem,12vw,11rem)] text-glow" : "text-6xl"}`}>0</span>
              <span className={`font-display text-glow ${i === 0 ? "text-6xl" : "text-4xl"}`}>{s.suffix}</span>
            </div>
            <h3 className="mt-4 text-lg font-medium">{s.label}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-mist/60">{s.detail}</p>
            {i === 0 && (
              <svg viewBox="0 0 400 120" className="mt-10 w-full opacity-70" aria-hidden>
                <defs>
                  <linearGradient id="g37" x1="0" x2="1">
                    <stop offset="0" stopColor="#ffc27a" /><stop offset="1" stopColor="#7cf5c8" />
                  </linearGradient>
                </defs>
                <path d="M0 10 C120 14 140 100 400 110" stroke="url(#g37)" strokeWidth="2" fill="none" />
                <text x="0" y="30" fill="#e8f3ec" opacity=".5" fontSize="11" fontFamily="monospace">150h</text>
                <text x="370" y="100" fill="#7cf5c8" fontSize="11" fontFamily="monospace">4h</text>
              </svg>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
