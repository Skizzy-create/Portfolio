"use client";

import { useRef } from "react";
import { gsap, useGSAP, Heading } from "./motion";
import GameBoard from "./game/GameBoard";

/* Packet Run: you are a request crossing a datacenter grove, eight hops from
   the edge to the origin, then Overtime. Engine, levels and renderer live in
   ./game; this file is just the section around the board. */

export default function Play() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(ref.current!.querySelector("[data-board]"), {
      y: 60, opacity: 0, duration: 1.3, ease: "expo.out",
      // drop the leftover transform so a pinned (fixed) full-screen board isn't trapped by it
      clearProps: "transform,opacity",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });
  }, { scope: ref });

  return (
    <section ref={ref} id="play" className="relative mx-auto max-w-5xl px-4 pt-32 sm:px-6 md:pt-44">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <Heading eyebrow="Interlude">
          Packet <em className="text-glow">run</em>
        </Heading>
        <p className="max-w-sm text-sm leading-relaxed text-mist/60 md:mb-3">
          You&apos;re a request crossing the grove: eight quick hops from the edge to the origin. Dodge or blast what&apos;s failing, collect healthy requests, keep your replicas alive.
        </p>
      </div>

      <div data-board className="mt-8 md:mt-10">
        <GameBoard />
      </div>
    </section>
  );
}
