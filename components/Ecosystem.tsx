"use client";

import { useRef } from "react";
import { gsap, useGSAP, Heading, sheen } from "./motion";
import { ecosystem, honors, education } from "@/lib/content";
import Grove from "./Grove";

const accents = ["#7cf5c8", "#8fd3ff", "#a49bff", "#ffc27a"];
const hues = ["160 85% 72%", "200 95% 78%", "246 100% 80%", "34 100% 74%"];

export default function Ecosystem() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = ref.current!;
    root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
      gsap.from(g, { y: 80, opacity: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: g, start: "top 88%" } });
      gsap.fromTo(g.querySelector("[data-eco-art]"), { xPercent: -3 }, {
        xPercent: 3, ease: "none",
        scrollTrigger: { trigger: g, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.from(g.querySelectorAll("[data-chip]"), {
        scale: 0.6, opacity: 0, duration: 0.9, stagger: { each: 0.04, from: "random" }, ease: "back.out(2)",
        scrollTrigger: { trigger: g, start: "top 70%" },
      });
    });
    gsap.from(root.querySelectorAll("[data-honor]"), {
      y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: "expo.out",
      scrollTrigger: { trigger: root.querySelector("[data-honors]"), start: "top 85%" },
    });
  }, { scope: ref });

  return (
    <section ref={ref} id="ecosystem" className="relative mx-auto max-w-7xl px-6 py-32 md:py-48">
      <Heading eyebrow="Ecosystem">
        Tools, used in <em className="text-glow">anger</em>
      </Heading>

      <div className="mt-20 grid gap-5 md:grid-cols-2">
        {ecosystem.map((g, gi) => (
          <div key={g.name} data-group onPointerMove={sheen} className="glass group overflow-hidden rounded-[30px]">
            <div className="relative h-36 overflow-hidden border-b border-white/[0.06] md:h-44">
              <div data-eco-art className="absolute inset-x-6 inset-y-3 text-mist">
                <Grove seed={gi * 13 + 5} hue={hues[gi]} className="h-full w-full" density={1.3} />
              </div>
              <div className="absolute inset-x-7 top-5 flex items-start justify-between md:inset-x-9">
                <h3 className="font-display text-3xl md:text-4xl">{g.name}</h3>
                <span className="font-mono text-xs text-mist/40">{String(gi + 1).padStart(2, "0")}</span>
              </div>
            </div>

            <div className="p-7 pt-5 md:p-9 md:pt-6">
              <p className="text-mist/70">{g.blurb}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {g.items.map((s, i) => (
                  <span
                    key={s}
                    data-chip
                    data-cursor
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-mist/80 transition-[color,border-color,box-shadow] duration-500 hover:text-night"
                    style={{ animation: `drift ${5 + (i % 4)}s ease-in-out ${i * 0.3}s infinite` }}
                    onPointerEnter={(e) => Object.assign(e.currentTarget.style, { background: accents[gi], borderColor: accents[gi], boxShadow: `0 0 28px ${accents[gi]}66` })}
                    onPointerLeave={(e) => Object.assign(e.currentTarget.style, { background: "", borderColor: "", boxShadow: "" })}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-7 flex gap-3 border-t border-white/10 pt-5 text-sm leading-relaxed text-mist/75">
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accents[gi] }}>Proof</span>
                {g.proof}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div data-honors className="mt-28 grid gap-4 md:grid-cols-4">
        {honors.map((h) => (
          <div key={h.title} data-honor className="glass-soft rounded-3xl p-7">
            <p className="font-display text-5xl text-glow">{h.place}</p>
            <p className="mt-4 font-medium">{h.title}</p>
            <p className="mt-1 text-sm text-mist/55">{h.note}</p>
          </div>
        ))}
        <div data-honor className="glass-soft rounded-3xl p-7">
          <p className="font-mono text-xs tracking-wider text-glow/80 uppercase">{education.period}</p>
          <p className="mt-4 font-medium">{education.degree}</p>
          <p className="mt-1 text-sm text-mist/55">{education.school} · {education.grade}</p>
        </div>
      </div>
    </section>
  );
}
