"use client";

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // route in-page anchor links through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      e.preventDefault();
      lenis.scrollTo(id, { offset: -24, duration: 1.6 });
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}

/** True once `src` has loaded, false if it 404s — lets artwork slots fall
    back to drawn placeholders until the real images are added. */
export function useImage(src: string) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = src;
  }, [src]);
  return ok;
}

/** Tracks the pointer on `.glass` elements so the specular sheen follows it. */
export function sheen(e: RPointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/** Pulls its child toward the pointer, then springs back. */
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(pointer: coarse)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return <span ref={ref} className="inline-block will-change-transform">{children}</span>;
}

/** Fades + lifts children in as they enter the viewport. */
export function Reveal({ children, className = "", delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from(ref.current, {
      y, opacity: 0, filter: "blur(8px)", duration: 1.2, delay, ease: "expo.out",
      scrollTrigger: { trigger: ref.current, start: "top 88%" },
    });
  }, { scope: ref });
  return <div ref={ref} className={className}>{children}</div>;
}

/** Section heading whose lines rise out of a mask. */
export function Heading({ eyebrow, children, className = "" }: { eyebrow: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const h = ref.current!.querySelector("h2")!;
    const split = SplitText.create(h, { type: "lines", mask: "lines", linesClass: "split-line" });
    gsap.from(split.lines, {
      yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.09, ease: "expo.out",
      scrollTrigger: { trigger: h, start: "top 85%" },
    });
    gsap.from(ref.current!.querySelector(".eyebrow"), {
      opacity: 0, x: -20, duration: 1, ease: "expo.out",
      scrollTrigger: { trigger: h, start: "top 85%" },
    });
    return () => split.revert();
  }, { scope: ref });
  return (
    <div ref={ref} className={className}>
      <p className="eyebrow mb-5 flex items-center gap-3">
        <span className="h-px w-8 bg-glow/60" />
        {eyebrow}
      </p>
      <h2 className="font-display text-[clamp(2.6rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-balance">
        {children}
      </h2>
    </div>
  );
}
