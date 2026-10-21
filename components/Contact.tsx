"use client";

import { useRef, useState } from "react";
import { gsap, SplitText, useGSAP, Magnetic, sheen } from "./motion";
import { profile } from "@/lib/content";

/* Dawn over the ridgeline: three silhouettes that slide at different rates as
   you scroll in, a sun that rises behind them, and the heading on top. */
function rand(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
function ridge(seed: number, base: number, amp: number, steps: number) {
  const r = rand(seed);
  let d = `M0 400 L0 ${base}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * 1600;
    const y = base - amp * (0.3 + r() * 0.7) * Math.abs(Math.sin((i / steps) * Math.PI * (1.4 + r())));
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return d + " L1600 400 Z";
}
function pines(seed: number, base: number, count: number, h: number) {
  const r = rand(seed);
  let d = `M0 400 L0 ${base}`;
  for (let i = 0; i < count; i++) {
    const x = (i / count) * 1600 + r() * 18;
    const ph = h * (0.45 + r() * 0.9);
    d += ` L${(x - ph * 0.3).toFixed(0)} ${base} L${x.toFixed(0)} ${(base - ph).toFixed(0)} L${(x + ph * 0.3).toFixed(0)} ${base}`;
  }
  return d + " L1600 400 Z";
}

const ridges = [
  { d: ridge(11, 250, 150, 30), fill: "#1d2a2b", speed: 0.25 },
  { d: ridge(23, 300, 120, 24), fill: "#11201b", speed: 0.5 },
  { d: pines(37, 372, 110, 95), fill: "#06130e", speed: 0.85 },
];

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(() => {
    const root = ref.current!;
    const h2 = root.querySelector("h2")!;
    const split = SplitText.create(h2, { type: "lines,words", mask: "lines" });
    gsap.from(split.words, {
      yPercent: 110, rotate: 4, duration: 1.4, stagger: 0.06, ease: "expo.out",
      scrollTrigger: { trigger: h2, start: "top 82%" },
    });
    gsap.from(root.querySelectorAll("[data-rise]"), {
      y: 30, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out",
      scrollTrigger: { trigger: h2, start: "top 70%" },
    });

    // parallax: every layer travels its own distance across the same scroll
    const scrub = { trigger: root, start: "top bottom", end: "bottom bottom", scrub: 1.2 };
    root.querySelectorAll<SVGElement>("[data-ridge]").forEach((el) => {
      const s = Number(el.dataset.speed);
      gsap.fromTo(el, { yPercent: 40 * s, xPercent: -4 * s }, { yPercent: 0, xPercent: 0, ease: "none", scrollTrigger: scrub });
    });
    gsap.fromTo(root.querySelector("[data-sun]"), { yPercent: 70, scale: 0.7, opacity: 0.2 }, { yPercent: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: scrub });
    gsap.fromTo(root.querySelector("[data-ghost]"), { xPercent: 8 }, { xPercent: -18, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(root.querySelector("[data-copy]"), { yPercent: 12 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: true } });
    return () => split.revert();
  }, { scope: ref });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      location.href = `mailto:${profile.email}`;
    }
  };

  const socials = [
    { label: "GitHub", href: profile.links.github },
    { label: "LinkedIn", href: profile.links.linkedin },
    { label: "X / Twitter", href: profile.links.x },
    { label: "Résumé", href: profile.resume },
  ];

  return (
    <section ref={ref} id="contact" className="relative flex min-h-[110svh] flex-col overflow-hidden pt-32 md:pt-44">
      {/* oversized outline word drifting behind everything */}
      <p data-ghost aria-hidden className="pointer-events-none absolute left-0 top-[14%] whitespace-nowrap font-display text-[clamp(8rem,24vw,22rem)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(232,243,236,0.07)]">
        say hello · say hello · say hello
      </p>

      {/* dawn and ridgeline */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]">
        <div data-sun className="absolute bottom-[22%] left-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fff1d6_0%,#ffc27a_28%,rgba(255,143,143,0.25)_55%,transparent_70%)] blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_85%,rgba(255,194,122,0.18),transparent_70%)]" />
        {ridges.map((r, i) => (
          <svg key={i} data-ridge data-speed={r.speed} viewBox="0 0 1600 400" preserveAspectRatio="none" className="absolute bottom-0 left-[-5%] h-full w-[110%]">
            <path d={r.d} fill={r.fill} />
          </svg>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night to-transparent" />
      </div>

      <div data-copy className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-[34vh] text-center">
        <p data-rise className="eyebrow mb-8 inline-flex items-center gap-3" style={{ color: "var(--color-dawn)" }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-dawn/70" />
            <span className="relative h-2 w-2 rounded-full bg-dawn" />
          </span>
          Open to remote roles
        </p>
        <h2 className="mx-auto max-w-5xl font-display text-[clamp(3rem,8.5vw,8rem)] leading-[0.95] tracking-[-0.035em]">
          Let&apos;s build what <em className="text-[var(--color-dawn)]">stays&nbsp;up.</em>
        </h2>
        <p data-rise className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-mist/70">
          RL environments, applied AI, backend infrastructure. If it has to be correct under load, I&apos;d like to hear about it.
        </p>

        <div data-rise className="mt-10 flex flex-col items-center gap-3">
          <Magnetic strength={0.25}>
            <button onClick={copy} onPointerMove={sheen} className="glass group flex items-center gap-4 rounded-full py-3 pl-7 pr-3 text-left">
              <span className="font-display text-xl md:text-3xl">{profile.email}</span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-mist text-night transition group-hover:bg-dawn">
                {copied ? "✓" : "⧉"}
              </span>
            </button>
          </Magnetic>
          <span className={`text-sm text-dawn transition-opacity duration-500 ${copied ? "opacity-100" : "opacity-0"}`}>Copied to clipboard</span>
        </div>

        <div data-rise className="mt-4 flex flex-wrap justify-center gap-3">
          {socials.map((s) => (
            <Magnetic key={s.label} strength={0.3}>
              <a href={s.href} target="_blank" className="inline-block rounded-full border border-white/15 bg-night/50 px-5 py-2.5 text-sm text-mist/85 backdrop-blur-md transition hover:border-dawn/60 hover:text-dawn">
                {s.label} ↗
              </a>
            </Magnetic>
          ))}
        </div>
      </div>

      <footer className="relative z-10 mx-auto mt-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-xs text-mist/45">
        <span>© {new Date().getFullYear()} {profile.name} · {profile.location} · IST</span>
        <a href="#top" className="transition hover:text-mist">Back to top ↑</a>
      </footer>
    </section>
  );
}
