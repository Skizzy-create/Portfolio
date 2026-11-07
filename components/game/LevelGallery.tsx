"use client";

import { useEffect, useRef } from "react";
import { Engine } from "./engine";
import { BOSS, C, ENDLESS, LEVELS, ROUTE, modById } from "./levels";
import { CheckGlyph, LockGlyph, MechIcon, RerollGlyph } from "./icons";
import type { Save } from "./storage";
import s from "./game.module.css";

/* Level select. Every visitor can browse every hop (each card runs a tiny
   autopiloted preview of that hop's mechanic); playing is gated: a hop
   unlocks once the one before it is cleared, Overtime once the boss falls. */

const pad = (n: number) => String(n).padStart(2, "0");

export const isUnlocked = (save: Save, i: number) =>
  i === 0 || save.maxLevel >= i || (save.cleared[i - 1] ?? 0) > 0;

/** Lazily started thumbnail engine: only while near the viewport, frozen during a real run. */
function Preview({ level, suspended }: { level: number; suspended: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const eng = useRef<Engine | null>(null);
  const susp = useRef(suspended);

  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let e: Engine | null = null;
    let failed = false;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting && !e && !failed) {
          try {
            e = new Engine(el, null, mq.matches, { preview: level });
            e.setSuspended(susp.current);
            e.setTabVisible(document.visibilityState === "visible");
            eng.current = e;
          } catch {
            failed = true;
            return;
          }
        }
        e?.setOnScreen(en.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    const onMq = () => e?.setReduced(mq.matches);
    const onVis = () => e?.setTabVisible(document.visibilityState === "visible");
    mq.addEventListener("change", onMq);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      e?.destroy();
      eng.current = null;
    };
  }, [level]);

  useEffect(() => {
    susp.current = suspended;
    eng.current?.setSuspended(suspended);
  }, [suspended]);

  return <canvas ref={cv} aria-hidden className="absolute inset-0 block h-full w-full" />;
}

type Props = {
  save: Save;
  running: boolean;
  mod: string;
  onReroll: () => void;
  onPlay: (level: number) => void;
};

export default function LevelGallery({ save, running, mod, onReroll, onPlay }: Props) {
  const done = save.cleared.slice(0, ROUTE).filter((c) => c > 0).length;
  const m = modById(mod);

  return (
    <section id="packet-levels" aria-labelledby="packet-levels-h" className="scroll-mt-24 pt-16 md:pt-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mist/45 sm:text-[11px]">Level select · {done}/{ROUTE} cleared</p>
          <h3 id="packet-levels-h" className="mt-1.5 font-display text-[clamp(1.6rem,5vw,2.4rem)] leading-none">
            Every hop, <em className="text-glow">at a glance</em>
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-mist/55">
            Watch any of them. To play one, clear the hop before it; Overtime opens once the origin falls.
          </p>
        </div>
        {m && (
          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] py-1 pl-3 pr-1 sm:self-auto">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist/45">next run</span>
            <span className="text-xs font-medium" style={{ color: m.color }}>{m.name}</span>
            <button
              type="button"
              onClick={onReroll}
              aria-label="Reroll the run modifier"
              title="Reroll modifier"
              className={`${s.press} grid h-7 w-7 place-items-center rounded-full border border-white/10 text-mist/60 touch-manipulation hover:border-glow/60 hover:text-glow`}
            >
              <RerollGlyph />
            </button>
          </div>
        )}
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
        {LEVELS.map((L, i) => {
          const open = isUnlocked(save, i);
          const prev = i === ENDLESS ? LEVELS[BOSS] : LEVELS[i - 1];
          const cleared = save.cleared[i] ?? 0;
          const best = save.levelBest[i] ?? 0;
          const label = i === ENDLESS ? "∞" : pad(i + 1);
          const status = !open
            ? `locked. Clear ${prev.name} to unlock`
            : cleared === 2 ? "cleared without a hit" : cleared ? "cleared" : "unlocked";
          return (
            <li key={L.name} className="min-w-0">
              <button
                type="button"
                disabled={!open}
                onClick={() => onPlay(i)}
                aria-label={`${i === ENDLESS ? "Overtime" : `Hop ${label}`}: ${L.name}, ${status}. ${L.blurb}`}
                className={`${s.press} group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-night/40 text-left touch-manipulation transition-colors enabled:hover:bg-white/[0.04] disabled:cursor-not-allowed sm:rounded-[20px]`}
                style={{ borderColor: open ? `${L.accent}40` : "rgb(255 255 255 / 0.08)" }}
              >
                <span className="relative block aspect-[16/10] w-full overflow-hidden border-b border-white/[0.06] bg-night">
                  <Preview level={i} suspended={running} />
                  <span
                    className="absolute left-2 top-2 rounded-full border bg-night/70 px-1.5 py-px font-mono text-[10px] tabular-nums backdrop-blur-sm"
                    style={{ borderColor: `${L.accent}66`, color: L.accent }}
                  >
                    {label}
                  </span>
                  {cleared > 0 && (
                    <span
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-night/70 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider backdrop-blur-sm"
                      style={{ color: C.glow }}
                    >
                      <CheckGlyph />
                      <span className="hidden min-[420px]:inline">{cleared === 2 ? "flawless" : "cleared"}</span>
                    </span>
                  )}
                  {!open && (
                    <span className="absolute inset-0 grid place-items-center bg-night/45">
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-night/80 text-mist/70">
                        <LockGlyph size={14} />
                      </span>
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3.5">
                  <span className="flex items-center gap-2">
                    <span className="hidden min-[420px]:block"><MechIcon icon={L.intro.icon} size={30} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium" style={{ color: open ? L.accent : undefined }}>{L.name}</span>
                      <span className="block truncate font-mono text-[9px] uppercase tracking-[0.18em] text-mist/40">{L.intro.title}</span>
                    </span>
                  </span>
                  <span className="block text-[11px] leading-snug text-mist/60 sm:text-xs">{L.blurb}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                    {open ? (
                      <>
                        <span className="text-mist/80 group-hover:text-glow">{cleared ? "Replay →" : "Play →"}</span>
                        {best > 0 && <span className="tabular-nums text-mist/40">best {best.toLocaleString()}</span>}
                      </>
                    ) : (
                      <span className="flex items-start gap-1.5 normal-case tracking-normal text-mist/45">
                        <span className="mt-px shrink-0"><LockGlyph /></span>
                        <span className="font-sans text-[11px] leading-snug">Clear {prev.name} to unlock</span>
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
