"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, Heading } from "./motion";

/* Packet Run: you are a request crossing a datacenter grove. Three lanes,
   things that want you dead, healthy requests to collect. Streaks build a
   multiplier, speed climbs, and you have three replicas before the outage.

   Cast
     request  green dot        +points, builds the streak
     failing  red box          static, costs a replica
     jitter   amber diamond    hops between lanes as it comes
     bot      violet arrow     telegraphed, then rushes in at double speed
     cache    blue hexagon     shield that absorbs the next hit
     patch    green cross      restores a replica */

type Kind = "req" | "fail" | "jitter" | "bot" | "cache" | "patch";
type Thing = { x: number; y: number; lane: number; kind: Kind; hop?: number; warn?: number; hit?: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Phase = "idle" | "run" | "over";
const LANES = 3, REPLICAS = 3;
const C = { glow: "#7cf5c8", rose: "#ff8f8f", dawn: "#ffc27a", aurora: "#a49bff", sky: "#8fd3ff", mist: "232,243,236" };
const HARMFUL: Kind[] = ["fail", "jitter", "bot"];

export default function Play() {
  const ref = useRef<HTMLElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hud, setHud] = useState({ score: 0, mult: 1, lives: REPLICAS, shield: false });
  const [best, setBest] = useState(0);
  const [full, setFull] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  const game = useRef({
    lane: 1, y: 1, vy: 0, things: [] as Thing[], sparks: [] as Spark[], trail: [] as { x: number; y: number }[],
    speed: 0, dist: 0, spawn: 0, botIn: 0, score: 0, streak: 0, lives: REPLICAS, shield: false, flash: 0, t: 0,
  });

  useEffect(() => {
    try { setBest(Number(localStorage.getItem("packet-best")) || 0); } catch {}
    const onFs = () => setFull(document.fullscreenElement === board.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const start = () => {
    Object.assign(game.current, {
      lane: 1, y: 1, vy: 0, things: [], sparks: [], trail: [], speed: 0.3, dist: 0, spawn: 0.4, botIn: 6,
      score: 0, streak: 0, lives: REPLICAS, shield: false, flash: 0,
    });
    setHud({ score: 0, mult: 1, lives: REPLICAS, shield: false });
    phaseRef.current = "run";
    setPhase("run");
    canvas.current?.focus({ preventScroll: true });
  };
  const move = (d: number) => {
    if (phaseRef.current !== "run") return;
    const g = game.current;
    g.lane = Math.max(0, Math.min(LANES - 1, g.lane + d));
  };
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await board.current?.requestFullscreen();
    } catch {}
    canvas.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0, last = 0, W = 0, H = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const layers = [0.25, 0.6].map((depth, li) =>
      Array.from({ length: li ? 26 : 40 }, (_, i) => ({ x: i / (li ? 26 : 40) + Math.random() * 0.02, h: 0.25 + Math.random() * 0.6, lit: Math.random() < 0.3, ph: Math.random() * 6, depth })),
    );

    const resize = () => {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const laneY = (l: number) => H * (0.24 + l * 0.24);
    const burst = (x: number, y: number, color: string, n = 10) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
        game.current.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
      }
    };
    const sync = () => {
      const g = game.current;
      setHud({ score: g.score, mult: Math.min(5, 1 + Math.floor(g.streak / 5)), lives: g.lives, shield: g.shield });
    };

    const spawnRow = (g: typeof game.current) => {
      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
      const hard = g.speed > 0.55;
      const blockers = hard && Math.random() < 0.4 ? 2 : 1; // one lane always stays open
      lanes.forEach((l, i) => {
        if (i < blockers) {
          const kind: Kind = g.speed > 0.42 && Math.random() < 0.35 ? "jitter" : "fail";
          g.things.push({ x: 1.08, y: l, lane: l, kind, hop: 0.5 + Math.random() * 0.5 });
        } else {
          const r = Math.random();
          const kind: Kind | null = r < 0.04 && g.lives < REPLICAS ? "patch" : r < 0.1 && !g.shield ? "cache" : r < 0.62 ? "req" : null;
          if (kind) g.things.push({ x: 1.08 + Math.random() * 0.06, y: l, lane: l, kind });
        }
      });
    };

    const frame = (ms: number) => {
      const dt = Math.min(0.05, (ms - (last || ms)) / 1000);
      last = ms;
      const g = game.current;
      const running = phaseRef.current === "run";
      g.t += dt;
      const v = running ? g.speed : 0.06;

      // critically damped spring toward the target lane: quick, no wobble
      const k = 340, damp = 2 * Math.sqrt(k);
      g.vy += ((g.lane - g.y) * k - g.vy * damp) * dt;
      g.y += g.vy * dt;

      if (running) {
        g.speed = Math.min(1.15, g.speed + dt * 0.013);
        g.dist += v * dt;
        g.spawn -= dt;
        if (g.spawn <= 0) {
          spawnRow(g);
          g.spawn = Math.max(0.4, 1.15 - g.speed * 0.7);
        }
        g.botIn -= dt;
        if (g.botIn <= 0 && g.speed > 0.45) {
          g.things.push({ x: 1.12, y: g.lane, lane: g.lane, kind: "bot", warn: 0.75 }); // aims at where you are now
          g.botIn = 3 + Math.random() * 4 - g.speed * 1.5;
        }

        for (const th of g.things) {
          if (th.kind === "bot" && th.warn! > 0) { th.warn! -= dt; continue; }
          const prev = th.x;
          th.x -= v * dt * (th.kind === "bot" ? 2.1 : 1);
          if (th.kind === "jitter" && th.x < 0.95) {
            th.hop! -= dt;
            if (th.hop! <= 0) {
              th.lane = th.lane === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1;
              th.hop = 0.55 + Math.random() * 0.4;
            }
          }
          th.y += (th.lane - th.y) * Math.min(1, dt * 7);
          if (th.hit || prev < 0.135 || th.x > 0.185 || Math.abs(th.y - g.y) > 0.45) continue;

          th.hit = true;
          const px = W * 0.16, py = laneY(g.y);
          if (th.kind === "req") {
            g.streak++;
            g.score += Math.min(5, 1 + Math.floor(g.streak / 5));
            burst(px, py, C.glow, 6);
          } else if (th.kind === "cache") {
            g.shield = true;
            burst(px, py, C.sky, 14);
          } else if (th.kind === "patch") {
            g.lives = Math.min(REPLICAS, g.lives + 1);
            burst(px, py, C.glow, 14);
          } else if (g.shield) {
            g.shield = false;
            burst(px, py, C.sky, 18);
          } else {
            g.streak = 0;
            g.lives--;
            g.flash = 1;
            burst(px, py, C.rose, 22);
            if (g.lives <= 0) {
              phaseRef.current = "over";
              setPhase("over");
              setBest((b) => {
                const nb = Math.max(b, g.score);
                try { localStorage.setItem("packet-best", String(nb)); } catch {}
                return nb;
              });
            }
          }
          sync();
        }
        g.things = g.things.filter((th) => th.x > -0.1 && !(th.hit && !HARMFUL.includes(th.kind)));
      }
      g.flash = Math.max(0, g.flash - dt * 2.5);

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      const ground = H * 0.92;
      for (const layer of layers) {
        for (const c of layer) {
          const x = ((((c.x - g.t * 0.02 * c.depth - g.dist * c.depth * 0.6) % 1) + 1) % 1) * W;
          const top = ground - c.h * H * (0.5 + c.depth * 0.5);
          ctx.strokeStyle = `rgba(${C.mist},${0.05 + c.depth * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, ground); ctx.lineTo(x, top); ctx.stroke();
          if (c.lit) {
            ctx.fillStyle = C.glow;
            ctx.globalAlpha = (0.25 + 0.5 * Math.max(0, Math.sin(g.t * 2 + c.ph))) * c.depth;
            ctx.fillRect(x - 3, top + (ground - top) * 0.3, 6, 1.5);
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.strokeStyle = `rgba(${C.mist},.12)`;
      ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
      ctx.setLineDash([2, 10]);
      ctx.strokeStyle = `rgba(${C.mist},.08)`;
      for (let l = 0; l < LANES; l++) {
        ctx.beginPath(); ctx.moveTo(0, laneY(l)); ctx.lineTo(W, laneY(l)); ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const th of g.things) {
        const x = th.x * W, y = laneY(th.y);
        ctx.lineWidth = 1.5;
        if (th.kind === "req") {
          ctx.fillStyle = C.glow; ctx.shadowColor = C.glow; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else if (th.kind === "fail") {
          ctx.strokeStyle = th.hit ? `rgba(${C.mist},.25)` : C.rose;
          ctx.strokeRect(x - 8, y - 8, 16, 16);
          ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
        } else if (th.kind === "jitter") {
          const s = 10 + Math.sin(g.t * 14) * 1.5;
          ctx.strokeStyle = th.hit ? `rgba(${C.mist},.25)` : C.dawn;
          ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 4, y + 1); ctx.lineTo(x - 1, y - 3); ctx.lineTo(x + 1, y + 3); ctx.lineTo(x + 4, y - 1); ctx.stroke();
        } else if (th.kind === "bot") {
          if (th.warn! > 0) {
            // telegraph: a blinking chevron at the right edge of its lane
            ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(g.t * 12));
            ctx.strokeStyle = C.aurora;
            ctx.beginPath(); ctx.moveTo(W - 14, y - 8); ctx.lineTo(W - 24, y); ctx.lineTo(W - 14, y + 8); ctx.stroke();
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = th.hit ? `rgba(${C.mist},.25)` : C.aurora;
            ctx.shadowColor = C.aurora; ctx.shadowBlur = th.hit ? 0 : 14;
            ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x + 3, y); ctx.lineTo(x + 8, y + 8); ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(164,155,255,.35)";
            ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 46, y); ctx.stroke();
          }
        } else if (th.kind === "cache") {
          ctx.strokeStyle = C.sky; ctx.shadowColor = C.sky; ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3 + g.t;
            ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * 9, y + Math.sin(a) * 9);
          }
          ctx.closePath(); ctx.stroke(); ctx.shadowBlur = 0;
        } else if (th.kind === "patch") {
          ctx.strokeStyle = C.glow; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke();
        }
      }

      // the packet: a smooth ribbon trail built from where it actually travelled
      const px = W * 0.16, py = laneY(g.y);
      for (const p of g.trail) p.x -= (v * 0.9 + 0.05) * W * dt;
      g.trail.push({ x: px, y: py });
      while (g.trail.length && g.trail[0].x < px - 160) g.trail.shift();
      const tr = g.trail;
      for (let i = 1; i < tr.length - 1; i++) {
        const a = i / tr.length;
        const m0x = (tr[i - 1].x + tr[i].x) / 2, m0y = (tr[i - 1].y + tr[i].y) / 2;
        const m1x = (tr[i].x + tr[i + 1].x) / 2, m1y = (tr[i].y + tr[i + 1].y) / 2;
        ctx.strokeStyle = g.flash > 0 ? `rgba(255,143,143,${a * 0.7})` : `rgba(124,245,200,${a * 0.7})`;
        ctx.lineWidth = 0.5 + a * 4.5;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(m0x, m0y); ctx.quadraticCurveTo(tr[i].x, tr[i].y, m1x, m1y); ctx.stroke();
      }
      ctx.fillStyle = g.flash > 0 ? C.rose : "#e8f3ec";
      ctx.shadowColor = g.flash > 0 ? C.rose : C.glow; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (g.shield) {
        ctx.strokeStyle = C.sky; ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(g.t * 6);
        ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const s of g.sparks) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92; s.life -= dt * 2.2;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
      g.sparks = g.sparks.filter((s) => s.life > 0);

      if (g.flash > 0) {
        ctx.fillStyle = `rgba(255,143,143,${g.flash * 0.12})`;
        ctx.fillRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(frame);
    };

    const onKey = (e: KeyboardEvent) => {
      const box = ref.current!.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const k = e.key.toLowerCase();
      if (phaseRef.current === "run" && ["arrowup", "arrowdown", "w", "s"].includes(k)) {
        e.preventDefault();
        move(k === "arrowup" || k === "w" ? -1 : 1);
      } else if (phaseRef.current !== "run" && document.activeElement === cv && (k === " " || k === "enter")) {
        e.preventDefault();
        start();
      } else if (k === "f" && document.activeElement === cv) {
        toggleFull();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dy) > 24) move(dy < 0 ? -1 : 1);
    };

    resize();
    addEventListener("keydown", onKey);
    cv.addEventListener("touchstart", onTouchStart, { passive: true });
    cv.addEventListener("touchend", onTouchEnd, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("keydown", onKey);
      cv.removeEventListener("touchstart", onTouchStart);
      cv.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useGSAP(() => {
    gsap.from(ref.current!.querySelector("[data-board]"), {
      y: 60, opacity: 0, duration: 1.3, ease: "expo.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });
  }, { scope: ref });

  const tapLane = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch") return; // touch uses swipes
    const r = e.currentTarget.getBoundingClientRect();
    move(e.clientY - r.top < r.height / 2 ? -1 : 1);
  };

  const legend = [
    { c: C.glow, label: "request", shape: "rounded-full" },
    { c: C.rose, label: "failing node", shape: "" },
    { c: C.dawn, label: "jitter, hops lanes", shape: "rotate-45" },
    { c: C.aurora, label: "bot, rushes in", shape: "rounded-sm" },
    { c: C.sky, label: "cache, shield", shape: "rounded-full" },
  ];

  return (
    <section ref={ref} id="play" className="relative mx-auto max-w-5xl px-6 pt-32 md:pt-44">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <Heading eyebrow="Interlude">
          Packet <em className="text-glow">run</em>
        </Heading>
        <p className="max-w-sm text-sm leading-relaxed text-mist/60 md:mb-3">
          You're a request crossing the grove. Dodge what's failing, collect healthy requests, keep your replicas alive.
        </p>
      </div>

      <div ref={board} data-board className={`relative mt-10 overflow-hidden border border-white/10 bg-night/40 backdrop-blur-md ${full ? "bg-night" : "rounded-[28px]"}`}>
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-3 font-mono text-[11px] tracking-wider text-mist/55 uppercase">
          <span>served <b className="ml-1 text-sm font-normal tabular-nums text-mist">{hud.score}</b>{hud.mult > 1 && <span className="ml-2 text-glow">×{hud.mult}</span>}</span>
          <span className="flex items-center gap-1.5">
            replicas
            {Array.from({ length: REPLICAS }, (_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i < hud.lives ? "bg-glow" : "bg-white/15"}`} />
            ))}
            {hud.shield && <span className="ml-1 text-[#8fd3ff]">shield</span>}
          </span>
          <span className="flex items-center gap-4">
            <span className="hidden sm:inline">best <b className="ml-1 text-sm font-normal tabular-nums text-mist">{best}</b></span>
            <button onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-mist/70 transition hover:border-glow/60 hover:text-glow">
              {full ? "×" : "⤢"}
            </button>
          </span>
        </div>

        <canvas
          ref={canvas}
          tabIndex={0}
          onPointerDown={tapLane}
          className={`block w-full cursor-pointer touch-none outline-none ${full ? "h-[calc(100svh-45px)]" : "h-[260px] md:h-[320px]"}`}
          aria-label="Packet Run game. Use arrow keys or W and S to change lanes, F for full screen."
        />

        {phase !== "run" && (
          <div className="absolute inset-x-0 bottom-0 top-[45px] grid place-items-center bg-night/60 backdrop-blur-[2px]">
            <div className="px-6 text-center">
              {phase === "over" ? (
                <>
                  <p className="font-mono text-[11px] tracking-[0.3em] text-mist/50 uppercase">Outage</p>
                  <p className="mt-2 font-display text-6xl tabular-nums">{hud.score}</p>
                  <p className="mt-1 text-sm text-mist/60">{hud.score >= best && hud.score > 0 ? "New best." : `Best ${best}`}</p>
                </>
              ) : (
                <ul className="mx-auto grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-left text-xs text-mist/65 sm:grid-cols-3">
                  {legend.map((l) => (
                    <li key={l.label} className="flex items-center gap-2">
                      <span className={`h-2 w-2 border ${l.shape}`} style={{ borderColor: l.c, background: l.shape.includes("full") ? l.c : "transparent" }} />
                      {l.label}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={start} className="mt-6 rounded-full bg-mist px-7 py-3 text-sm font-medium text-night transition hover:bg-glow">
                {phase === "over" ? "Run again" : "Start"}
              </button>
              <p className="mt-3 font-mono text-[10px] tracking-[0.25em] text-mist/40 uppercase">↑ ↓ / W S · tap or swipe · F full screen</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
