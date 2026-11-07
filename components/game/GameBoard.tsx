"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { Engine } from "./engine";
import { C, ENDLESS, LEVELS, MAX_LIVES, modById, rollMod } from "./levels";
import { emptySave, loadSave, writeSave, type Save } from "./storage";
import type { Hud, Phase, PhaseInfo } from "./types";
import Overlay, { type Action } from "./Overlay";
import Controls from "./Controls";
import LevelGallery, { isUnlocked } from "./LevelGallery";
import { BoltGlyph, FullGlyph, PauseGlyph, PlayGlyph } from "./icons";
import s from "./game.module.css";

type Full = "off" | "native" | "fake";
type Gesture = { id: number; x0: number; y0: number; t0: number; swiped: boolean; dbl: boolean };
type Tap = { t: number; x: number; y: number };

const HUD0: Hud = { score: 0, mult: 1, lives: MAX_LIVES, shield: false, level: 0, mirror: 0, boss: 0, bossMax: 0 };
const pad = (n: number) => String(n).padStart(2, "0");
/* Enter drives every menu; Space / J / X only ever fire, so holding the
   trigger through a level clear can't skip a screen. */
const PRIMARY: Partial<Record<Phase, Action>> = { title: "start", intro: "go", paused: "resume", clear: "next", over: "retry", won: "overtime" };
const FIRE_KEYS = new Set([" ", "j", "J", "x", "X"]);
const DOUBLE_TAP_MS = 320;

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${s.press} grid h-8 w-8 place-items-center rounded-full border border-white/15 text-mist/70 touch-manipulation hover:border-glow/60 hover:text-glow`}
    >
      {children}
    </button>
  );
}

export default function GameBoard() {
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const saveRef = useRef<Save>(emptySave());
  const runBest = useRef(0);
  const prevLives = useRef(MAX_LIVES);
  const fullRef = useRef<Full>("off");
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<Tap | null>(null);
  const modRef = useRef("");
  const pips = useRef<HTMLElement[]>([]);

  const [phase, setPhase] = useState<Phase>("title");
  const [info, setInfo] = useState<PhaseInfo | null>(null);
  const [hud, setHud] = useState<Hud>(HUD0);
  const [save, setSave] = useState<Save>(emptySave);
  const [newBest, setNewBest] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  const [mod, setModState] = useState("");
  const [full, setFull] = useState<Full>("off");
  const [kick, setKick] = useState(0);
  const [broken, setBroken] = useState(false);

  const setFullMode = useCallback((f: Full) => {
    fullRef.current = f;
    setFull(f);
  }, []);

  const setMod = useCallback((m: string) => {
    modRef.current = m;
    setModState(m);
  }, []);
  const reroll = useCallback(() => setMod(rollMod(modRef.current)), [setMod]);

  /* ---------- engine lifecycle ---------- */
  useEffect(() => {
    const cv = canvas.current, bd = board.current;
    if (!cv || !bd) return;

    const stored = loadSave();
    saveRef.current = stored;
    setSave(stored);
    setMod(rollMod()); // client-only, so server and first client render agree

    // charge pips in the HUD and on the FIRE button, filled without React renders
    pips.current = Array.from(bd.querySelectorAll<HTMLElement>("[data-pip]"));

    const onPhase = (p: Phase, inf: PhaseInfo) => {
      setPhase(p);
      setInfo(inf);
      if (p === "intro") setFresh(null);
      if (p !== "clear" && p !== "won" && p !== "over") return;
      const cur = saveRef.current;
      setNewBest(inf.score > runBest.current && inf.score > 0);
      const cleared = cur.cleared.slice(), levelBest = cur.levelBest.slice();
      let maxLevel = cur.maxLevel;
      if (p !== "over") {
        cleared[inf.level] = Math.max(cleared[inf.level] ?? 0, inf.stats.clean ? 2 : 1);
        maxLevel = Math.min(LEVELS.length - 1, Math.max(maxLevel, p === "won" ? ENDLESS : inf.level + 1));
      }
      if (p !== "over" || inf.level === ENDLESS) levelBest[inf.level] = Math.max(levelBest[inf.level] ?? 0, inf.levelScore);
      setFresh(maxLevel > cur.maxLevel ? maxLevel : null);
      const next: Save = {
        best: Math.max(cur.best, inf.score),
        maxLevel,
        wins: cur.wins + (p === "won" ? 1 : 0),
        cleared,
        levelBest,
      };
      saveRef.current = next;
      setSave(next);
      writeSave(next);
    };
    const onHud = (h: Hud) => {
      if (h.lives < prevLives.current) setKick((k) => k + 1);
      prevLives.current = h.lives;
      setHud(h);
    };
    const onProgress = (p: number) => {
      if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
    };
    const onEnergy = (e: number) => {
      pips.current.forEach((el, i) => {
        const k = i % 3;
        el.style.setProperty("--f", Math.max(0, Math.min(1, (e - k / 3) * 3)).toFixed(3));
      });
    };
    const onDry = () => {
      bd.querySelectorAll<HTMLElement>("[data-meter]").forEach((el) => {
        el.classList.remove(s.shake);
        void el.offsetWidth; // restart the animation
        el.classList.add(s.shake);
      });
    };

    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let eng: Engine;
    try {
      eng = new Engine(cv, { phase: onPhase, hud: onHud, progress: onProgress, energy: onEnergy, dry: onDry }, mq.matches);
    } catch {
      setBroken(true);
      return;
    }
    engine.current = eng;

    const onMq = () => eng.setReduced(mq.matches);
    mq.addEventListener("change", onMq);

    // park the loop off-screen, and pause a live run when the board scrolls away
    const io = new IntersectionObserver(
      ([en]) => {
        eng.setOnScreen(en.isIntersecting);
        if (en.intersectionRatio < 0.35) eng.pause();
      },
      { threshold: [0, 0.35, 0.7] },
    );
    io.observe(bd);

    const onVis = () => {
      const vis = document.visibilityState === "visible";
      eng.setTabVisible(vis);
      if (!vis) eng.pause();
    };
    const onBlur = () => eng.pause();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);

    return () => {
      io.disconnect();
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      eng.destroy();
      engine.current = null;
    };
  }, [setMod]);

  /* ---------- actions ---------- */
  const act = useCallback((a: Action, level?: number) => {
    const eng = engine.current;
    if (!eng) return;
    const begin = (lvl: number) => {
      runBest.current = saveRef.current.best;
      const m = modRef.current || rollMod();
      eng.newRun(lvl, m);
      setMod(rollMod(m)); // the next fresh run gets a different twist
    };
    switch (a) {
      case "start":
      case "top": begin(0); break;
      case "continue": begin(saveRef.current.maxLevel); break;
      case "level": begin(level ?? 0); break;
      case "retry": runBest.current = saveRef.current.best; eng.retry(); break;
      case "go": eng.go(); break;
      case "resume": eng.resume(); break;
      case "pause": eng.pause(); break;
      case "next": eng.next(); break;
      case "quit": eng.quit(); break;
      case "overtime": eng.overtime(); break;
    }
    canvas.current?.focus({ preventScroll: true });
  }, [setMod]);

  /** From the gallery: start that hop (if unlocked) and bring the board into view. */
  const playFromGallery = useCallback((lvl: number) => {
    if (!isUnlocked(saveRef.current, lvl)) return;
    if (fullRef.current !== "off") return;
    act("level", lvl);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    board.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }, [act]);

  const toggleFull = useCallback(async () => {
    const bd = board.current;
    if (!bd) return;
    if (fullRef.current === "fake") {
      setFullMode("off");
    } else if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    } else {
      let native = false;
      if (document.fullscreenEnabled && typeof bd.requestFullscreen === "function") {
        try {
          await bd.requestFullscreen();
          native = true;
        } catch { /* fall back below */ }
      }
      // iPhone Safari has no element fullscreen: pin the board over the page instead
      if (!native) setFullMode("fake");
    }
    canvas.current?.focus({ preventScroll: true });
  }, [setFullMode]);

  /* ---------- fullscreen bookkeeping ---------- */
  useEffect(() => {
    const onFs = () => {
      if (document.fullscreenElement && document.fullscreenElement === board.current) setFullMode("native");
      else if (fullRef.current === "native") {
        setFullMode("off");
        engine.current?.pause();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement && document.fullscreenElement === board.current) document.exitFullscreen().catch(() => {});
    };
  }, [setFullMode]);

  useEffect(() => {
    if (full !== "fake") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, [full]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const eng = engine.current, bd = board.current;
      if (!eng || !bd || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const r = bd.getBoundingClientRect();
      const inView = r.bottom > 0 && r.top < innerHeight;
      const focused = bd.contains(document.activeElement);

      if (k === "Escape" && fullRef.current === "fake") {
        setFullMode("off");
        eng.pause();
        return;
      }
      if (eng.phase === "run") {
        if (!inView) return;
        if (k === "ArrowUp" || k === "w" || k === "W") { e.preventDefault(); eng.move(-1); }
        else if (k === "ArrowDown" || k === "s" || k === "S") { e.preventDefault(); eng.move(1); }
        else if (FIRE_KEYS.has(k)) { e.preventDefault(); if (!e.repeat) eng.setTrigger(true); }
        else if (k === "p" || k === "P" || k === "Escape") { e.preventDefault(); eng.pause(); }
        return;
      }
      if (!focused) return;
      if (k === "f" || k === "F") { e.preventDefault(); void toggleFull(); return; }
      if ((k === "p" || k === "P") && eng.phase === "paused") { e.preventDefault(); act("resume"); return; }
      if (document.activeElement instanceof HTMLButtonElement || document.activeElement instanceof HTMLAnchorElement) return; // let controls activate themselves
      if (k === "Enter") {
        const a = PRIMARY[eng.phase];
        if (a) { e.preventDefault(); act(a); }
      } else if (k === " ") {
        e.preventDefault(); // Space is the fire key: never page-scroll from the board
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (FIRE_KEYS.has(e.key)) engine.current?.setTrigger(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("keyup", onKeyUp);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("keyup", onKeyUp);
    };
  }, [act, toggleFull, setFullMode]);

  /* ---------- pointer: tap/click a lane, swipe to step, double-tap to fire ----------
     A tap moves at once (no waiting to see if a second tap follows). A second tap
     in the same spot within ~0.3s fires instead of moving, so the two never fight:
     double-tapping a lane means "go there and shoot". */
  const isDouble = (eng: Engine, x: number, y: number) => {
    const lt = lastTap.current;
    return !!lt && performance.now() - lt.t < DOUBLE_TAP_MS && Math.abs(y - lt.y) < eng.unit * 0.5 && Math.abs(x - lt.x) < 64;
  };
  const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    const eng = engine.current;
    if (!eng || eng.phase !== "run") return;
    const dbl = isDouble(eng, e.clientX, e.clientY);
    if (dbl) {
      eng.fire();
      lastTap.current = null;
    }
    if (e.pointerType === "mouse") {
      if (e.button !== 0 || dbl) return;
      eng.tapAt(e.clientY);
      lastTap.current = { t: performance.now(), x: e.clientX, y: e.clientY };
      return;
    }
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    gesture.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), swiped: false, dbl };
  };
  const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current, eng = engine.current;
    if (!g || !eng || g.id !== e.pointerId) return;
    const dy = e.clientY - g.y0;
    if (Math.abs(dy) >= Math.max(20, eng.unit * 0.32)) {
      eng.move(dy < 0 ? -1 : 1);
      g.y0 = e.clientY; // keep dragging to step again
      g.swiped = true;
    }
  };
  const onPointerUp = (e: RPointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current, eng = engine.current;
    gesture.current = null;
    if (!g || !eng || g.id !== e.pointerId || g.swiped || g.dbl) return;
    if (performance.now() - g.t0 < 350 && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 16) {
      eng.tapAt(e.clientY);
      lastTap.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    }
  };

  /* ---------- render ---------- */
  const L = LEVELS[hud.level];
  const accent = L.accent;
  const running = phase === "run";
  const runMod = info && phase !== "title" ? modById(info.mod) : null;
  const boardCls =
    full === "fake" ? "fixed inset-0 z-[80] flex flex-col bg-night"
      : full === "native" ? "flex h-full w-full flex-col bg-night"
        : "relative overflow-hidden rounded-[22px] border border-white/10 bg-night/40 backdrop-blur-md sm:rounded-[28px]";

  const live =
    phase === "intro" ? `${L.endless ? "Overtime" : `Hop ${hud.level + 1}`}: ${L.name}. ${L.intro.tip}${runMod ? ` Modifier: ${runMod.name}.` : ""}`
      : phase === "clear" ? `Hop cleared. Score ${hud.score}.${fresh !== null ? ` ${LEVELS[fresh].name} unlocked.` : ""}`
        : phase === "over" ? `Outage. Final score ${hud.score}.`
          : phase === "won" ? `Origin restored. Score ${hud.score}. Overtime unlocked.`
            : phase === "paused" ? "Paused." : "";

  return (
    <>
      <div
        ref={board}
        className={boardCls}
        data-lenis-prevent={full === "fake" ? "" : undefined}
        style={full !== "off" ? { paddingTop: "env(safe-area-inset-top)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" } : undefined}
      >
        {/* HUD */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mist/55 sm:gap-4 sm:px-5 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2.5 overflow-x-clip sm:gap-3">
            <span
              className="shrink-0 rounded-full border px-2 py-0.5 tabular-nums transition-colors duration-700"
              style={{ borderColor: `${accent}66`, color: accent }}
              title={L.name}
            >
              {hud.level === ENDLESS ? "∞" : pad(hud.level + 1)}
            </span>
            <span className="hidden min-w-0 truncate text-mist/70 md:inline">{L.name}</span>
            {runMod && (
              <span className="hidden truncate text-[10px] lg:inline" style={{ color: runMod.color }} title={runMod.tip}>◆ {runMod.name}</span>
            )}
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="hidden min-[400px]:inline">served</span>
              <b key={hud.score} className={`${s.pop} text-sm font-normal tabular-nums text-mist`}>{hud.score.toLocaleString()}</b>
              {hud.mult > 1 && <span key={`m${hud.mult}`} className={s.pop} style={{ color: C.glow }}>×{hud.mult}</span>}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {hud.mirror > 0 && running && (
              <span className={`hidden sm:inline ${s.blink}`} style={{ color: C.orchid }}>{hud.mirror === 2 ? "inverted" : "hijack"}</span>
            )}
            {/* laser charge (desktop; phones read it off the FIRE button) */}
            <span data-meter className="hidden items-center gap-1 pointer-fine:flex" title="Laser charge" aria-hidden>
              <span style={{ color: accent }}><BoltGlyph size={11} /></span>
              {[0, 1, 2].map((i) => (
                <span key={i} data-pip className="relative h-2 w-2.5 overflow-hidden rounded-[2px] bg-white/[0.14]">
                  <span className="absolute inset-0 origin-bottom" style={{ background: accent, transform: "scaleY(var(--f, 1))" }} />
                </span>
              ))}
            </span>
            <span key={kick} className={`flex items-center gap-1 ${kick ? s.shake : ""}`} aria-label={`${hud.lives} of ${MAX_LIVES} replicas${hud.shield ? ", shielded" : ""}`}>
              <span className="mr-1 hidden sm:inline">replicas</span>
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-[3px] transition-colors duration-300 ${i < hud.lives && hud.lives === 1 && running ? s.danger : ""}`}
                  style={{ background: i < hud.lives ? C.glow : "rgb(255 255 255 / 0.14)" }}
                />
              ))}
              {hud.shield && <span className="ml-1.5 h-2 w-2 rotate-45 border" style={{ borderColor: C.sky, boxShadow: `0 0 8px ${C.sky}` }} />}
            </span>
            <span className="hidden whitespace-nowrap xl:inline">
              best <b className="ml-1 text-sm font-normal tabular-nums text-mist">{save.best.toLocaleString()}</b>
            </span>
            {(running || phase === "paused") && (
              <IconBtn label={phase === "paused" ? "Resume" : "Pause"} onClick={() => act(phase === "paused" ? "resume" : "pause")}>
                {phase === "paused" ? <PlayGlyph /> : <PauseGlyph />}
              </IconBtn>
            )}
            <IconBtn label={full !== "off" ? "Exit full screen" : "Full screen"} onClick={() => void toggleFull()}>
              <FullGlyph exit={full !== "off"} />
            </IconBtn>
          </div>
        </div>

        {/* route progress (boss health on the last hop) */}
        <div className="h-[3px] bg-white/[0.04]" aria-hidden>
          <div ref={bar} className={`${s.bar} h-full`} style={{ background: hud.bossMax ? C.sun : accent, boxShadow: `0 0 10px ${hud.bossMax ? C.sun : accent}` }} />
        </div>

        {/* stage */}
        <div className={`relative w-full overflow-hidden ${full !== "off" ? "min-h-0 flex-1" : s.stage}`}>
          <canvas
            ref={canvas}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { gesture.current = null; }}
            onContextMenu={(e) => { if (running) e.preventDefault(); }}
            className="absolute inset-0 block h-full w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-glow/40"
            style={{ touchAction: running ? "none" : "pan-y", cursor: running ? "pointer" : "default", WebkitTapHighlightColor: "transparent" }}
            aria-label="Packet Run game. Enter starts and continues. Arrow keys or W and S change lanes, or click a lane. Space, J or X fires the laser. On touch, tap a lane or swipe, and double-tap or press FIRE to shoot. P pauses, F toggles full screen."
          />
          {broken ? (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-mist/60">
              This browser couldn&apos;t start the canvas, so the packets are staying home today.
            </div>
          ) : (
            <Overlay phase={phase} info={info} save={save} newBest={newBest} mod={mod} fresh={fresh} onReroll={reroll} canBrowse={full === "off"} onAction={act} />
          )}
        </div>

        <Controls
          active={running}
          mirror={hud.mirror === 2}
          accent={accent}
          onMove={(d) => engine.current?.move(d)}
          onPause={() => act("pause")}
          onTrigger={(on) => engine.current?.setTrigger(on)}
        />
        <p className="sr-only" aria-live="polite">{live}</p>
      </div>

      {!broken && <LevelGallery save={save} running={running} mod={mod} onReroll={reroll} onPlay={playFromGallery} />}
    </>
  );
}
