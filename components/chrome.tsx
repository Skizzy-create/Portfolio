"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./motion";
import { nav, profile } from "@/lib/content";

/* ---------- Preloader: a tree grows while the page loads, its branch tips lighting up like nodes ---------- */
const branches = [
  "M60 108 C50 102 40 96 30 82", "M60 100 C70 94 82 88 92 72",
  "M60 88 C52 80 46 70 42 54", "M60 82 C68 74 74 64 78 48",
  "M60 74 C60 62 60 50 60 30",
  "M30 82 C24 76 20 70 17 61", "M92 72 C98 66 102 60 104 51",
  "M42 54 C36 48 32 42 30 33", "M78 48 C84 42 88 36 90 27",
  "M42 54 C46 46 50 40 50 34", "M78 48 C74 42 70 36 69 30",
];
const tips: [number, number, string][] = [
  [17, 61, "#7cf5c8"], [104, 51, "#a49bff"], [30, 33, "#7cf5c8"], [90, 27, "#7cf5c8"],
  [60, 30, "#a49bff"], [50, 34, "#ffc27a"], [69, 30, "#7cf5c8"], [30, 82, "#7cf5c8"], [92, 72, "#7cf5c8"],
];
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(() => {
    const root = ref.current!;
    const count = { v: 0 };
    const num = root.querySelector<HTMLSpanElement>("[data-count]")!;
    const stem = root.querySelector<SVGPathElement>("[data-stem]")!;
    const leaves = root.querySelectorAll<SVGPathElement>("[data-branch]");
    const nodes = root.querySelectorAll<SVGCircleElement>("[data-node]");
    const len = stem.getTotalLength();
    gsap.set(stem, { strokeDasharray: len, strokeDashoffset: len });
    leaves.forEach((l) => {
      const ll = l.getTotalLength();
      gsap.set(l, { strokeDasharray: ll, strokeDashoffset: ll });
    });
    gsap.set(nodes, { scale: 0, transformOrigin: "50% 50%", transformBox: "fill-box" });

    document.documentElement.style.overflow = "hidden";
    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        document.documentElement.style.overflow = "";
        window.dispatchEvent(new Event("intro:done"));
        setDone(true);
      },
    });
    tl.to(count, { v: 100, duration: 1.7, ease: "power2.inOut", onUpdate: () => (num.textContent = String(Math.round(count.v)).padStart(3, "0")) })
      .to(stem, { strokeDashoffset: 0, duration: 0.8 }, 0.05)
      .to(leaves, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06 }, 0.5)
      .to(nodes, { scale: 1, duration: 0.5, stagger: 0.05, ease: "back.out(3)" }, 1.1)
      .to(root.querySelector("[data-inner]"), { opacity: 0, y: -30, duration: 0.5 }, "+=0.15")
      .to(root, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.2");
  }, { scope: ref });

  if (done) return null;
  return (
    <div ref={ref} className="fixed inset-0 z-[100] grid place-items-center bg-night" style={{ clipPath: "inset(0 0 0% 0)" }}>
      <div data-inner className="flex flex-col items-center gap-6">
        <svg width="120" height="140" viewBox="0 0 120 144" fill="none" strokeLinecap="round" className="drop-shadow-[0_0_14px_rgba(124,245,200,0.45)]">
          <path d="M36 138 H84" stroke="#e8f3ec" strokeOpacity=".15" />
          <path data-stem d="M60 138 C60 116 59 96 60 74" stroke="#7cf5c8" strokeWidth="2.2" />
          {branches.map((d, i) => (
            <path key={i} data-branch d={d} stroke="#7cf5c8" strokeOpacity={i < 5 ? 0.9 : 0.6} strokeWidth={i < 5 ? 1.6 : 1.1} />
          ))}
          {tips.map(([x, y, c], i) => (
            <circle key={i} data-node cx={x} cy={y} r={i < 7 ? 2.6 : 1.8} fill={c} />
          ))}
        </svg>
        <span data-count className="font-mono text-sm tracking-[0.4em] text-mist/70">000</span>
      </div>
    </div>
  );
}

/* ---------- Cursor: a soft bioluminescent orb ---------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const d = dot.current!, r = ring.current!;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 1 });
    const dx = gsap.quickTo(d, "x", { duration: 0.12 }), dy = gsap.quickTo(d, "y", { duration: 0.12 });
    const rx = gsap.quickTo(r, "x", { duration: 0.55, ease: "power3" }), ry = gsap.quickTo(r, "y", { duration: 0.55, ease: "power3" });
    const move = (e: PointerEvent) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); };
    const over = (e: PointerEvent) => {
      const hot = (e.target as HTMLElement).closest("a,button,[data-cursor]");
      gsap.to(r, { scale: hot ? 2.2 : 1, borderColor: hot ? "rgba(124,245,200,0.9)" : "rgba(232,243,236,0.35)", duration: 0.4 });
      gsap.to(d, { scale: hot ? 0 : 1, duration: 0.3 });
    };
    addEventListener("pointermove", move);
    addEventListener("pointerover", over);
    return () => { removeEventListener("pointermove", move); removeEventListener("pointerover", over); };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-9 w-9 rounded-full border border-mist/35 opacity-0 backdrop-blur-[2px] md:block" />
      <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[91] hidden h-1.5 w-1.5 rounded-full bg-glow opacity-0 shadow-[0_0_14px_4px_rgba(124,245,200,0.7)] md:block" />
    </>
  );
}

/* ---------- Floating glass navigation ---------- */
function useLocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: profile.timezone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const time = useLocalTime();

  useGSAP(() => {
    gsap.set(ref.current, { y: -80, opacity: 0 });
    const show = () => gsap.to(ref.current, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 0.6 });
    window.addEventListener("intro:done", show, { once: true });

    // highlight whichever section actually sits under the middle of the
    // viewport; measuring live stays correct around the pinned Work rail
    const sections = nav.map(({ href }) => [href, document.querySelector<HTMLElement>(href)] as const);
    const spy = () => {
      const mid = innerHeight / 2;
      const hit = sections.find(([, el]) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      setActive(hit ? hit[0] : "");
    };
    addEventListener("scroll", spy, { passive: true });
    spy();
    const sc = ScrollTrigger.create({
      start: 120,
      onToggle: (s) => ref.current!.toggleAttribute("data-scrolled", s.isActive),
    });
    return () => { sc.kill(); removeEventListener("scroll", spy); window.removeEventListener("intro:done", show); };
  });

  return (
    <header ref={ref} className="group fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="glass flex w-full max-w-4xl items-center justify-between gap-2 rounded-full py-2 pl-5 pr-2 transition-all duration-700 group-data-[scrolled]:max-w-3xl">
        <a href="#top" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-glow shadow-[0_0_12px_rgba(124,245,200,0.9)]" />
          Kartik Aslia
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {nav.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-500 ${active === l.href ? "text-night" : "text-mist/70 hover:text-mist"}`}
              >
                {active === l.href && <span className="absolute inset-0 -z-10 rounded-full bg-glow/90 shadow-[0_0_24px_rgba(124,245,200,0.45)]" />}
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-xs text-mist/50 sm:block">GGN {time}</span>
          <a href={`mailto:${profile.email}`} className="hidden rounded-full bg-mist px-4 py-2 text-sm font-medium text-night transition hover:bg-glow sm:block">
            Say hello
          </a>
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 md:hidden">
            <span className={`block h-px w-4 bg-mist transition ${open ? "translate-y-[3px] rotate-45" : "-translate-y-[2px]"}`} />
            <span className={`absolute block h-px w-4 bg-mist transition ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass absolute inset-x-4 top-16 rounded-3xl p-3 md:hidden">
          {nav.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-display text-2xl text-mist/90 hover:bg-white/5">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
