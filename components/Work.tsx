"use client";

import { useRef, useState, type PointerEvent } from "react";
import { gsap, useGSAP, Heading, sheen, Magnetic } from "./motion";
import Grove from "./Grove";
import { projects, profile, type Project } from "@/lib/content";

function tilt(e: PointerEvent<HTMLElement>) {
  sheen(e);
  if (matchMedia("(pointer: coarse)").matches) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(el, { rotateY: x * 5, rotateX: -y * 5, duration: 0.6, ease: "power3.out" });
}
function untilt(e: PointerEvent<HTMLElement>) {
  gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1, 0.5)" });
}

/** The system's data path, drawn as glass nodes with a pulse travelling along it. */
function Pipeline({ steps, hue }: { steps: string[]; hue: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span
            className="pipe-node rounded-full border bg-night/55 px-3 py-1.5 font-mono text-[10.5px] tracking-wide text-mist/85 backdrop-blur-md"
            style={{ borderColor: `hsl(${hue} / .35)`, ["--h" as string]: hue, animationDelay: `${i * 0.45}s` }}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span className="text-[10px]" style={{ color: `hsl(${hue} / .7)` }}>→</span>}
        </li>
      ))}
    </ol>
  );
}

function Card({ p, i }: { p: Project; i: number }) {
  const [open, setOpen] = useState(false);
  const link = p.href ?? p.repo;
  return (
    <article
      data-panel
      onPointerMove={tilt}
      onPointerLeave={untilt}
      className="glass group relative flex w-full shrink-0 flex-col overflow-hidden rounded-[32px] [transform-style:preserve-3d] lg:h-[80vh] lg:max-h-[860px] lg:w-[min(82vw,1240px)] lg:flex-row"
    >
      {/* artwork + system diagram */}
      <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:w-[50%]">
        <div
          data-art
          className="absolute -inset-[8%] bg-cover bg-center transition-transform duration-[1.6s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
          style={{
            backgroundImage: `url(${p.image}), radial-gradient(120% 90% at 20% 20%, hsl(${p.hue} / .55), transparent 60%), linear-gradient(160deg, #0b2a20, #04100c)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
        <div className="absolute inset-x-6 top-6 flex items-center justify-between font-mono text-[11px] tracking-[0.25em] text-mist/75 uppercase">
          <span>{String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
          <span className="rounded-full border border-white/15 bg-night/40 px-3 py-1 backdrop-blur-md" style={{ color: `hsl(${p.hue})` }}>{p.category}</span>
        </div>
        <div className="absolute inset-x-6 bottom-6 hidden sm:block">
          <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-mist/50 uppercase">System</p>
          <Pipeline steps={p.architecture} hue={p.hue} />
        </div>
      </div>

      {/* the case */}
      <div className="relative flex flex-1 flex-col gap-6 p-7 md:p-10" style={{ transform: "translateZ(30px)" }}>
        <div>
          <p className="eyebrow" style={{ color: `hsl(${p.hue})` }}>{p.kicker} · {p.role}</p>
          <h3 className="mt-3 font-display text-4xl leading-[0.95] md:text-[3.4rem]">{p.name}</h3>
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed">
          <div>
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.3em] text-mist/45 uppercase">Problem</p>
            <p className="text-mist/75">{p.problem}</p>
          </div>
          <div className="border-l-2 pl-4" style={{ borderColor: `hsl(${p.hue} / .6)` }}>
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.3em] text-mist/45 uppercase">Hardest part</p>
            <p className="text-mist/85">{p.hardest}</p>
          </div>
        </div>

        <div className="mt-auto">
          <ul className="grid gap-2 sm:grid-cols-3">
            {p.outcome.map((m) => (
              <li key={m} className="rounded-2xl border bg-white/[0.03] px-3.5 py-3 text-[13px] leading-snug" style={{ borderColor: `hsl(${p.hue} / .25)`, color: `hsl(${p.hue})` }}>
                {m}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-mist transition hover:text-glow">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-xs">+</span>
              How it's built
            </button>
            {link && (
              <a href={link} target="_blank" className="inline-flex items-center gap-2 text-mist/70 transition hover:text-glow">
                {p.href ? "Visit live" : "Repository"} ↗
              </a>
            )}
          </div>
        </div>

        {/* engineering drawer */}
        <div
          aria-hidden={!open}
          inert={!open}
          className={`absolute inset-0 flex flex-col overflow-y-auto bg-[#061711]/95 p-7 backdrop-blur-xl transition-[clip-path] duration-700 ease-[cubic-bezier(.22,1,.36,1)] md:p-10 ${open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_0_100%)]"}`}
          data-lenis-prevent
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow" style={{ color: `hsl(${p.hue})` }}>How it's built</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-mist/80 transition hover:text-glow">×</button>
          </div>
          <p className="mt-4 text-mist/70">{p.blurb}</p>
          <ol className="mt-6 space-y-4">
            {p.approach.map((a, k) => (
              <li key={k} className="flex gap-4 text-[15px] leading-relaxed text-mist/85">
                <span className="mt-0.5 font-mono text-xs" style={{ color: `hsl(${p.hue})` }}>{String(k + 1).padStart(2, "0")}</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto pt-8">
            <p className="mb-3 font-mono text-[10px] tracking-[0.3em] text-mist/45 uppercase">Stack</p>
            <div className="flex flex-wrap gap-2">
              {p.stack.map((s) => <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-mist/70">{s}</span>)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Closing card of the rail: the person behind the work. */
function NextCard() {
  return (
    <article data-panel onPointerMove={sheen} className="glass relative flex w-full shrink-0 flex-col items-center justify-center gap-8 overflow-hidden rounded-[32px] p-10 text-center lg:h-[80vh] lg:max-h-[860px] lg:w-[min(60vw,720px)]">
            <div className="relative h-40 w-full max-w-sm text-mist md:h-48">
        <Grove seed={99} hue="160 85% 72%" className="h-full w-full" density={0.8} />
      </div>
      <div className="relative">
        <p className="eyebrow justify-center">Next chapter</p>
        <h3 className="mt-4 font-display text-4xl leading-[1] md:text-6xl">
          Your hardest problem<br />could be <em className="text-[var(--color-glow)]">card eight.</em>
        </h3>
        <p className="mx-auto mt-5 max-w-md text-mist/65">
          RL environments, evaluation infrastructure or production AI systems — I'm open to remote roles worldwide.
        </p>
      </div>
      <div className="relative flex flex-wrap justify-center gap-3">
        <Magnetic>
          <a href="#contact" className="inline-flex rounded-full bg-mist px-6 py-3 text-sm font-medium text-night transition hover:bg-glow">Start a conversation →</a>
        </Magnetic>
        <Magnetic>
          <a href={profile.resume} target="_blank" className="glass-soft inline-flex rounded-full px-6 py-3 text-sm text-mist">Résumé PDF</a>
        </Magnetic>
      </div>
    </article>
  );
}

export default function Work() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = ref.current!;
    const mm = gsap.matchMedia();

    // desktop: pin and travel sideways through the work
    mm.add("(min-width: 1024px)", () => {
      const rail = root.querySelector<HTMLElement>("[data-rail]")!;
      const distance = () => rail.scrollWidth - innerWidth + 48;
      const tween = gsap.to(rail, {
        x: () => -distance(), ease: "none",
        scrollTrigger: {
          trigger: root.querySelector("[data-pin]"), start: "top top", end: () => `+=${distance()}`,
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
      root.querySelectorAll("[data-art]").forEach((art) => {
        gsap.fromTo(art, { xPercent: -6 }, {
          xPercent: 6, ease: "none",
          scrollTrigger: { trigger: art, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
      gsap.to(root.querySelector("[data-progress]"), {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: root.querySelector("[data-pin]"), start: "top top", end: () => `+=${distance()}`, scrub: true },
      });
    });

    // mobile: simple reveals
    mm.add("(max-width: 1023px)", () => {
      root.querySelectorAll("[data-panel]").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
    });
  }, { scope: ref });

  const counts = projects.reduce<Record<string, number>>((a, p) => ((a[p.category] = (a[p.category] ?? 0) + 1), a), {});

  return (
    <section ref={ref} id="work" className="relative">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pt-32 md:pt-48 lg:flex-row lg:items-end lg:justify-between">
        <Heading eyebrow="Selected work">
          Systems I've <em className="text-glow">shipped</em>
        </Heading>
        <div className="flex flex-wrap gap-2 font-mono text-xs text-mist/60 lg:mb-4">
          {Object.entries(counts).map(([c, n]) => (
            <span key={c} className="glass-soft rounded-full px-4 py-2">{c} · {String(n).padStart(2, "0")}</span>
          ))}
        </div>
      </div>

      <div data-pin className="relative py-16 lg:flex lg:h-screen lg:items-center lg:py-0">
        <div data-rail className="flex flex-col gap-6 px-6 [perspective:1600px] lg:flex-row lg:gap-8 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:pr-6">
          {projects.map((p, i) => <Card key={p.name} p={p} i={i} />)}
          <NextCard />
        </div>
        <div className="absolute bottom-8 left-1/2 hidden h-px w-48 -translate-x-1/2 bg-white/10 lg:block">
          <div data-progress className="h-full origin-left scale-x-0 bg-glow" />
        </div>
      </div>
      <style>{`
        .pipe-node{animation:pipe 3.6s ease-in-out infinite}
        @keyframes pipe{0%,70%,100%{box-shadow:none}15%{box-shadow:0 0 18px hsl(var(--h) / .55);border-color:hsl(var(--h) / .9)}}
      `}</style>
    </section>
  );
}
