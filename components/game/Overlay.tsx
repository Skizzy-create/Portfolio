"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { C, ENDLESS, LEVELS, ROUTE, modById } from "./levels";
import { MechIcon, RerollGlyph } from "./icons";
import type { Save } from "./storage";
import type { Phase, PhaseInfo } from "./types";
import s from "./game.module.css";

export type Action =
  | "start" | "continue" | "level" | "go" | "resume" | "pause"
  | "next" | "retry" | "top" | "quit" | "overtime";

type Props = {
  phase: Phase;
  info: PhaseInfo | null;
  save: Save;
  newBest: boolean;
  /** modifier the next fresh run will use */
  mod: string;
  /** hop this clear just unlocked for the first time */
  fresh: number | null;
  onReroll: () => void;
  /** false in full screen, where the gallery below the board is out of reach */
  canBrowse: boolean;
  onAction: (a: Action, level?: number) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (sec: number) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;
const hopLabel = (l: number) => (l === ENDLESS ? "Overtime" : `Hop ${pad(l + 1)}`);

function useCountUp(to: number, from: number) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setV(to));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now(), dur = 950;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from]);
  return v;
}

function Btn({ children, onClick, ghost = false, delay = 0 }: { children: ReactNode; onClick: () => void; ghost?: boolean; delay?: number }) {
  return (
    <button
      type="button"
      onClick={(e: MouseEvent) => { e.stopPropagation(); onClick(); }}
      style={{ animationDelay: `${delay}ms` }}
      className={`${s.press} ${s.rise} min-h-11 rounded-full px-6 py-2.5 text-sm font-medium touch-manipulation ${
        ghost ? "border border-white/15 text-mist/80 hover:border-glow/60 hover:text-glow" : `bg-mist text-night hover:bg-glow ${s.breathe}`
      }`}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children, color, delay = 0 }: { children: ReactNode; color?: string; delay?: number }) {
  return (
    <p className={`${s.rise} font-mono text-[10px] uppercase tracking-[0.28em] text-mist/50 sm:text-[11px]`} style={{ color, animationDelay: `${delay}ms` }}>
      {children}
    </p>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-3 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-mist/35 sm:block">{children}</p>;
}

export default function Overlay({ phase, info, save, newBest, mod, fresh, onReroll, canBrowse, onAction }: Props) {
  if (phase === "run") return null;
  const level = info?.level ?? 0;
  const tapAnywhere = phase === "intro" ? () => onAction("go") : phase === "paused" ? () => onAction("resume") : undefined;

  return (
    <div
      className={`${s.overlay} absolute inset-0 flex overflow-y-auto overscroll-contain ${tapAnywhere ? "cursor-pointer" : ""}`}
      onClick={tapAnywhere}
    >
      <div key={`${phase}-${level}`} className="m-auto w-full max-w-lg px-4 py-3 text-center sm:px-5 sm:py-5">
        {phase === "title" && <Title save={save} mod={mod} onReroll={onReroll} canBrowse={canBrowse} onAction={onAction} />}
        {phase === "intro" && <Intro level={level} info={info} onAction={onAction} />}
        {phase === "paused" && <Paused onAction={onAction} />}
        {phase === "clear" && info && <Clear info={info} newBest={newBest} fresh={fresh} onAction={onAction} />}
        {phase === "over" && info && <Over info={info} save={save} newBest={newBest} onAction={onAction} />}
        {phase === "won" && info && <Won info={info} save={save} newBest={newBest} onAction={onAction} />}
      </div>
    </div>
  );
}

function Title({ save, mod, onReroll, canBrowse, onAction }: { save: Save; mod: string; onReroll: () => void; canBrowse: boolean; onAction: Props["onAction"] }) {
  const cont = Math.min(save.maxLevel, LEVELS.length - 1);
  const m = modById(mod);
  return (
    <>
      <Eyebrow>{ROUTE} hops · edge → origin</Eyebrow>
      <p className={`${s.title} mt-2 font-display text-[clamp(2rem,7vw,3.4rem)] leading-[0.95]`} style={{ animationDelay: "80ms" }}>
        Route the <em style={{ color: C.glow }}>request</em>.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-5">
        <Btn onClick={() => onAction("start")} delay={160}>{cont > 0 ? "New run" : "Start"}</Btn>
        {cont > 0 && (
          <Btn ghost onClick={() => onAction("continue")} delay={220}>
            Continue · {cont === ENDLESS ? "Overtime" : `hop ${pad(cont + 1)}`}
          </Btn>
        )}
      </div>
      {m && (
        <div className={`${s.rise} mt-3 flex flex-col items-center sm:mt-4`} style={{ animationDelay: "260ms" }}>
          <div className="flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-3 pr-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist/45">modifier</span>
            <span className="truncate text-xs font-medium" style={{ color: m.color }}>{m.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReroll(); }}
              aria-label={`Run modifier: ${m.name}. Reroll`}
              title="Reroll modifier"
              className={`${s.press} grid h-8 w-8 place-items-center rounded-full text-mist/60 touch-manipulation hover:text-glow`}
            >
              <RerollGlyph />
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-mist/50">
            {m.tip}
            {m.score !== 1 && <span className="tabular-nums"> · score ×{m.score}</span>}
          </p>
        </div>
      )}
      <p className={`${s.rise} mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.2em] text-mist/45`} style={{ animationDelay: "320ms" }}>
        {save.best > 0 && <span>best <span className="text-mist/80 tabular-nums">{save.best.toLocaleString()}</span></span>}
        {canBrowse && (
          <a href="#packet-levels" className="underline decoration-white/20 underline-offset-4 hover:text-glow" onClick={(e) => e.stopPropagation()}>
            all levels ↓
          </a>
        )}
      </p>
      <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-mist/35">
        <span className="pointer-coarse:hidden">enter start · ↑ ↓ / W S move · space / J / X fire · P pause</span>
        <span className="hidden pointer-coarse:inline">tap a lane · double-tap or FIRE to shoot</span>
      </p>
    </>
  );
}

function Intro({ level, info, onAction }: { level: number; info: PhaseInfo | null; onAction: Props["onAction"] }) {
  const L = LEVELS[level];
  const m = modById(info?.mod ?? "");
  const spice = info?.spice;
  return (
    <>
      <Eyebrow color={`${L.accent}cc`}>{L.endless ? "Bonus · endless" : `Hop ${pad(level + 1)} / ${pad(ROUTE)}`}</Eyebrow>
      <h3 className={`${s.title} mt-1.5 font-display text-[clamp(1.75rem,7.5vw,3.8rem)] leading-[0.95]`} style={{ color: L.accent, animationDelay: "60ms" }}>
        {L.name}
      </h3>
      <p className={`${s.rise} mt-1 font-mono text-[11px] text-mist/45`} style={{ animationDelay: "140ms" }}>{L.host}</p>
      <div
        className={`${s.rise} mx-auto mt-3 flex max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-left sm:mt-4 sm:p-3`}
        style={{ animationDelay: "220ms" }}
      >
        <span className="hidden min-[400px]:block"><MechIcon icon={L.intro.icon} /></span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-mist">
            <span className="rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-widest" style={{ background: L.accent, color: C.night }}>
              {level === 0 ? "brief" : "new"}
            </span>
            {L.intro.title}
          </p>
          <p className="mt-1 text-xs leading-snug text-mist/65 sm:leading-relaxed">{L.intro.tip}</p>
          {(m || spice) && (
            <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.14em]">
              {m && <span style={{ color: m.color }}>◆ {m.name}</span>}
              {spice && <span className="text-mist/55">+ {spice} mixed in</span>}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Btn onClick={() => onAction("go")} delay={300}>{L.boss ? "Face it" : "Go"}</Btn>
      </div>
      <Hint>enter or click to go · space / J / X fire</Hint>
    </>
  );
}

function Paused({ onAction }: { onAction: Props["onAction"] }) {
  return (
    <>
      <Eyebrow>Paused</Eyebrow>
      <p className={`${s.title} mt-2 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none`}>Holding the connection</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Btn onClick={() => onAction("resume")} delay={100}>Resume</Btn>
        <Btn ghost onClick={() => onAction("quit")} delay={160}>Quit run</Btn>
      </div>
      <Hint>enter or P to resume</Hint>
    </>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex flex-col-reverse items-center">
      <dt className="text-[9px] tracking-[0.2em] text-mist/45">{label}</dt>
      <dd className="text-base tabular-nums text-mist" style={warn && value > 0 ? { color: C.rose } : undefined}>{value}</dd>
    </div>
  );
}

function Clear({ info, newBest, fresh, onAction }: { info: PhaseInfo; newBest: boolean; fresh: number | null; onAction: Props["onAction"] }) {
  const L = LEVELS[info.level];
  const next = LEVELS[Math.min(info.level + 1, LEVELS.length - 1)];
  const st = info.stats;
  const score = useCountUp(info.score, info.score - st.bonus);
  return (
    <>
      <Eyebrow color={`${L.accent}cc`}>{hopLabel(info.level)} cleared · {clock(st.time)}</Eyebrow>
      <p className={`${s.title} mt-1 font-display text-[clamp(2.4rem,8vw,3.6rem)] italic leading-none`} style={{ color: L.accent, animationDelay: "60ms" }}>
        200 OK
      </p>
      <dl className={`${s.rise} mt-3 flex justify-center gap-6 font-mono uppercase`} style={{ animationDelay: "140ms" }}>
        <Stat label="served" value={st.served} />
        <Stat label="blasted" value={st.kills} />
        <Stat label="hits" value={st.hits} warn />
      </dl>
      <p className={`${s.rise} mt-3 text-xs text-mist/65 sm:text-sm`} style={{ animationDelay: "200ms" }}>
        +{st.bonus} route bonus
        {st.clean && <span style={{ color: C.glow }}> · zero downtime</span>}
        {st.restored && <span style={{ color: C.glow }}> · +1 replica</span>}
      </p>
      {fresh !== null && (
        <p className={`${s.rise} mt-1 font-mono text-[10px] uppercase tracking-[0.2em]`} style={{ color: LEVELS[fresh].accent, animationDelay: "220ms" }}>
          unlocked · {LEVELS[fresh].name}
        </p>
      )}
      <p className={`${s.rise} mt-1 font-display text-4xl tabular-nums`} style={{ animationDelay: "240ms" }}>
        {score.toLocaleString()}
        {newBest && <span className="ml-2 align-middle font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.glow }}>best</span>}
      </p>
      <div className="mt-4 flex justify-center">
        <Btn onClick={() => onAction("next")} delay={320}>Next · {next.name} →</Btn>
      </div>
      <Hint>enter to continue</Hint>
    </>
  );
}

function Over({ info, save, newBest, onAction }: { info: PhaseInfo; save: Save; newBest: boolean; onAction: Props["onAction"] }) {
  const L = LEVELS[info.level];
  const score = useCountUp(info.score, 0);
  const endless = info.level === ENDLESS;
  return (
    <>
      <Eyebrow color={`${C.rose}cc`}>
        Outage · {endless ? `Overtime · ${clock(info.time)} · ${info.milestones} milestones` : `${hopLabel(info.level)} · ${L.name}`}
      </Eyebrow>
      <p className={`${s.title} mt-1 font-display text-[clamp(3rem,13vw,5rem)] leading-none tabular-nums`} style={{ animationDelay: "60ms" }}>
        {score.toLocaleString()}
      </p>
      <p className={`${s.rise} mt-1 text-sm text-mist/60`} style={{ animationDelay: "160ms" }}>
        {newBest ? <span style={{ color: C.glow }}>New best.</span> : `Best ${save.best.toLocaleString()}`}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Btn onClick={() => onAction("retry")} delay={240}>{info.level === 0 ? "Run again" : `Retry ${endless ? "Overtime" : `hop ${pad(info.level + 1)}`}`}</Btn>
        {info.level > 0 && <Btn ghost onClick={() => onAction("top")} delay={300}>From the top</Btn>}
      </div>
      <Hint>enter to retry</Hint>
    </>
  );
}

function Won({ info, save, newBest, onAction }: { info: PhaseInfo; save: Save; newBest: boolean; onAction: Props["onAction"] }) {
  const score = useCountUp(info.score, info.score - info.stats.bonus);
  return (
    <>
      <Eyebrow color={`${C.sun}cc`}>Origin restored · all {ROUTE} hops</Eyebrow>
      <p className={`${s.title} mt-1 font-display text-[clamp(2.6rem,9vw,4rem)] italic leading-none`} style={{ color: C.sun, animationDelay: "60ms" }}>
        Delivered.
      </p>
      <p className={`${s.rise} mt-2 font-display text-4xl tabular-nums`} style={{ animationDelay: "160ms" }}>{score.toLocaleString()}</p>
      <p className={`${s.rise} mt-1 text-sm text-mist/60`} style={{ animationDelay: "200ms" }}>
        {newBest ? <span style={{ color: C.glow }}>New best.</span> : `Best ${save.best.toLocaleString()}`}
        {info.stats.clean && <span style={{ color: C.glow }}> · flawless boss</span>}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Btn onClick={() => onAction("overtime")} delay={260}>Keep going · Overtime</Btn>
        <Btn ghost onClick={() => onAction("top")} delay={320}>Run again</Btn>
      </div>
      <Hint>enter for overtime</Hint>
    </>
  );
}
