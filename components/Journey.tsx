"use client";

import { useRef } from "react";
import { gsap, useGSAP, Heading, sheen } from "./motion";
import { journey } from "@/lib/content";

export default function Journey() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = ref.current!;
    const track = root.querySelector("[data-track]")!;

    // the root grows down the page as you scroll
    gsap.fromTo(root.querySelector("[data-vine]"), { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: track, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
    });
    gsap.fromTo(root.querySelector("[data-tip]"), { top: "0%" }, {
      top: "100%", ease: "none",
      scrollTrigger: { trigger: track, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
    });

    root.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
      const node = el.querySelector("[data-node]");
      const st = { trigger: el, start: "top 62%", toggleActions: "play none none reverse" };
      gsap.from(node, { scale: 0, duration: 0.9, ease: "back.out(3)", scrollTrigger: st });
      gsap.from(el.querySelector("[data-card]"), { x: 60, opacity: 0, filter: "blur(10px)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%" } });
      gsap.from(el.querySelectorAll("li"), { y: 16, opacity: 0, duration: 0.9, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 70%" } });
    });

    gsap.to(root.querySelector("[data-bg]"), {
      yPercent: -15, ease: "none",
      scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
    });
  }, { scope: ref });

  return (
    <section ref={ref} id="journey" className="relative overflow-hidden py-32 md:py-48">
      {/* optional mycelium artwork (see /public/images/README) */}
      <div
        data-bg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-[10%] h-[120%] bg-cover bg-center opacity-25 mix-blend-screen"
        style={{ backgroundImage: "url(/images/mycelium.webp)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <Heading eyebrow="Journey">
          Roots run <em className="text-glow">deep</em>
        </Heading>
        <p className="mt-6 max-w-xl text-mist/60">
          Like mycelium under a forest floor: quiet, connected, load-bearing. Here's the network I've grown so far.
        </p>

        <div data-track className="relative mt-24 pl-10 md:pl-24">
          {/* vine */}
          <div className="absolute left-3 top-0 h-full w-px bg-white/8 md:left-10">
            <div data-vine className="h-full w-full origin-top bg-gradient-to-b from-glow via-aurora to-dawn" />
            <div data-tip className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_24px_6px_rgba(124,245,200,0.6)]" />
          </div>

          <div className="space-y-20 md:space-y-28">
            {journey.map((c) => (
              <article key={c.org + c.period} data-chapter className="relative">
                <span data-node className="absolute -left-[33px] top-3 grid h-5 w-5 place-items-center rounded-full border border-glow/60 bg-night md:-left-[63px]">
                  <span className="h-2 w-2 rounded-full bg-glow" />
                </span>

                <div className="grid gap-6 md:grid-cols-[220px_1fr] md:gap-12">
                  <div className="font-mono text-xs leading-6 tracking-wider text-mist/50 uppercase">
                    <p className="text-glow/90">{c.period}</p>
                    <p>{c.mode}</p>
                  </div>

                  <div data-card onPointerMove={sheen} className="glass rounded-[28px] p-7 md:p-10">
                    <p className="text-sm text-mist/55">{c.org}</p>
                    <h3 className="mt-1 font-display text-3xl leading-tight md:text-5xl">{c.title}</h3>
                    <p className="mt-4 max-w-2xl text-mist/70">{c.summary}</p>

                    {c.points && (
                      <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-mist/75">
                        {c.points.map((p) => (
                          <li key={p} className="flex gap-3"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-glow" />{p}</li>
                        ))}
                      </ul>
                    )}

                    {c.roles && (
                      <div className="mt-8 grid gap-4 lg:grid-cols-3">
                        {c.roles.map((r) => (
                          <div key={r.org} className="glass-soft rounded-2xl p-5">
                            <p className="font-mono text-[11px] tracking-wider text-glow/80 uppercase">{r.period}</p>
                            <p className="mt-2 font-medium">{r.title}</p>
                            <p className="text-sm text-mist/50">{r.org}</p>
                            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-mist/70">
                              {r.points.map((p) => (
                                <li key={p} className="flex gap-2.5"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aurora" />{p}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {c.links && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {c.links.map((l) => (
                          <a key={l.href} href={l.href} target="_blank" className="glass-soft rounded-full px-4 py-2 text-sm text-mist/80 transition hover:text-glow">
                            {l.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
