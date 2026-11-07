"use client";

import type { MouseEvent, PointerEvent } from "react";
import { C } from "./levels";
import { BoltGlyph, Chevron, PauseGlyph } from "./icons";
import s from "./game.module.css";

/* On-screen pad, shown only on coarse pointers (phones/tablets): lane up,
   lane down, pause, and a big FIRE button for the right thumb. Acts on
   pointerdown so there is no tap delay; FIRE is hold-to-repeat while charge
   lasts. Keyboard activation still works through onClick (detail === 0).
   The FIRE charge pips are filled by GameBoard straight through the DOM. */
export default function Controls({
  active, mirror, accent, onMove, onPause, onTrigger,
}: {
  active: boolean;
  mirror: boolean;
  accent: string;
  onMove: (d: -1 | 1) => void;
  onPause: () => void;
  onTrigger: (on: boolean) => void;
}) {
  const tint = mirror ? C.orchid : undefined;
  const base = `${s.press} grid h-14 place-items-center rounded-2xl border bg-white/[0.04] text-mist/80 select-none transition-colors active:bg-white/10 disabled:opacity-35 ${
    active ? "touch-none" : "touch-pan-y"
  }`;
  const down = (fn: () => void) => (e: PointerEvent<HTMLButtonElement>) => {
    if (!active) return;
    e.preventDefault();
    fn();
  };
  const key = (fn: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) fn();
  };
  const release = () => onTrigger(false);

  return (
    <div
      className="hidden grid-cols-[1fr_1fr_auto_1.5fr] gap-2 border-t border-white/[0.06] px-2 pt-2 pointer-coarse:grid"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <button type="button" aria-label="Lane up" disabled={!active} onPointerDown={down(() => onMove(-1))} onClick={key(() => onMove(-1))}
        className={base} style={{ borderColor: tint ? `${tint}88` : "rgb(255 255 255 / 0.1)", color: tint }}>
        <Chevron up />
      </button>
      <button type="button" aria-label="Lane down" disabled={!active} onPointerDown={down(() => onMove(1))} onClick={key(() => onMove(1))}
        className={base} style={{ borderColor: tint ? `${tint}88` : "rgb(255 255 255 / 0.1)", color: tint }}>
        <Chevron up={false} />
      </button>
      <button type="button" aria-label="Pause" disabled={!active} onPointerDown={down(onPause)} onClick={key(onPause)}
        className={`${base} w-12`} style={{ borderColor: "rgb(255 255 255 / 0.1)" }}>
        <PauseGlyph />
      </button>
      <button
        type="button"
        aria-label="Fire laser"
        disabled={!active}
        data-meter
        onPointerDown={(e) => {
          if (!active) return;
          e.preventDefault();
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
          onTrigger(true);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onClick={key(() => { onTrigger(true); onTrigger(false); })}
        onContextMenu={(e) => e.preventDefault()}
        className={`${base} relative flex flex-col gap-1 overflow-hidden font-mono text-[11px] font-semibold uppercase tracking-[0.2em]`}
        style={{ borderColor: `${accent}88`, color: accent, background: `${accent}14` }}
      >
        <span className="flex items-center gap-1.5">
          <BoltGlyph size={15} />
          Fire
        </span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} data-pip className="relative h-1.5 w-4 overflow-hidden rounded-full bg-white/15">
              <span className="absolute inset-0 origin-left rounded-full" style={{ background: accent, transform: "scaleX(var(--f, 1))" }} />
            </span>
          ))}
        </span>
      </button>
    </div>
  );
}
