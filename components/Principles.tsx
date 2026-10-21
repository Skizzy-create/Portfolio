"use client";

import { useRef } from "react";
import { gsap, useGSAP, Heading, sheen } from "./motion";
import { principles } from "@/lib/content";

const glyphs = [
  // execute: a play triangle inside a check ring
  <path key="0" d="M14 10 L26 18 L14 26 Z M18 2 A16 16 0 1 1 17.9 2" />,
  // fail closed: a shut gate
  <path key="1" d="M4 32 V14 A14 14 0 0 1 32 14 V32 M10 32 V16 M18 32 V12 M26 32 V16 M4 22 H32" />,
  // pay once: a single node feeding three
  <path key="2" d="M18 6 V16 M18 16 L6 30 M18 16 L18 30 M18 16 L30 30 M18 6 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" />,
  // build the tool: a sprouting gear
  <path key="3" d="M18 34 V20 M18 20 C 10 20 6 14 6 8 C 12 8 18 12 18 20 C 18 12 24 8 30 8 C 30 14 26 20 18 20" />,
];

export default function Principles() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = ref.current!;
    const cards = root.querySelectorAll<HTMLElement>("[data-principle]");
    gsap.from(cards, {
      y: 90, opacity: 0, rotateX: -18, transformOrigin: "50% 100%", duration: 1.4, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: root.querySelector("[data-grid]"), start: "top 82%" },
    });
    root.querySelectorAll<SVGPathElement>("[data-glyph] path").forEach((p) => {
      const len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 2, ease: "power2.inOut",
        scrollTrigger: { trigger: p, start: "top 85%" },
      });
    });
  }, { scope: ref });

  return (
    <section ref={ref} id="principles" className="relative mx-auto max-w-7xl px-6 pt-32 md:pt-48">
      <Heading eyebrow="How I build">
        Four rules I <em className="text-glow">ship by</em>
      </Heading>

      <div data-grid className="mt-16 grid gap-4 [perspective:1400px] md:grid-cols-2 lg:grid-cols-4">
        {principles.map((p, i) => (
          <article key={p.title} data-principle onPointerMove={sheen} className="glass group flex flex-col rounded-[28px] p-7">
            <div className="flex items-center justify-between">
              <svg data-glyph viewBox="0 0 36 36" className="h-10 w-10 fill-none stroke-glow drop-shadow-[0_0_10px_rgba(124,245,200,0.5)]" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {glyphs[i]}
              </svg>
              <span className="font-mono text-xs text-mist/40">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-10 font-display text-3xl leading-[1.02]">{p.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-mist/65">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
