import { Fx } from "./fx";
import { C, ENDLESS, LEVELS, MAX_LIVES, buildLevel, modById, type LevelDef } from "./levels";
import { draw, makeScene, type GateState, type Scene } from "./render";
import type { Ent, Hud, Kind, LevelStats, Phase, PhaseInfo, World } from "./types";
import { clamp, hexRgb, lerp, pick, rand, rgbHex, shuffle, wormY } from "./util";

/* Packet Run engine: owns the canvas, the RAF loop, the simulation and the
   spawn director. React only renders HUD/overlays and forwards input.
   The same class drives the gallery thumbnails in "preview" mode: an
   autopilot plays the hop forever, nothing is reported back. */

const STEP = 1 / 120;          // fixed sub-step for stable springs and collisions
const PXN = 0.15;              // packet x, as a share of board width
const LANE_C = 0.53;           // vertical centre of the lane block
const COST = 1 / 3;            // laser charge per shot (three from full)
const REGEN = 0.42;            // charge per second
const FIRE_CD = 0.16;          // minimum gap between shots
const MILE = 15;               // Overtime milestone period (s)
const HARM: ReadonlySet<Kind> = new Set<Kind>(["fail", "jitter", "bot", "worm", "spoof", "gate", "beam"]);
const RAD: Record<Kind, number> = {
  req: 0.09, spoof: 0.09, fail: 0.15, jitter: 0.15, bot: 0.15, cache: 0.13, patch: 0.12, ack: 0.15,
  worm: 0.12, gate: 0, beam: 0, portal: 0,
};
const OUCH: Partial<Record<Kind, string>> = {
  fail: "502", jitter: "TIMEOUT", bot: "DDoS", gate: "DENIED", worm: "INFECTED", spoof: "SPOOFED", beam: "THROTTLED",
};
const TINT: Partial<Record<Kind, string>> = {
  fail: C.rose, jitter: C.dawn, bot: C.aurora, worm: C.dawn, spoof: C.rose, gate: C.rose, beam: C.sun,
};
const KILL: Partial<Record<Kind, number>> = { fail: 15, jitter: 20, spoof: 15, bot: 30, worm: 10 };

type Target = { t: "ent" | "wall" | "boss"; e: Ent | null; k: number; x: number };

export const multOf = (streak: number) => Math.min(5, 1 + Math.floor(streak / 5));

function ent(kind: Kind, x: number, lane: number, o: Partial<Ent> = {}): Ent {
  return {
    kind, x, lane, y: lane, t: 0, hit: false, gone: false, speed: 1, warn: 0, hop: 0, next: -1,
    period: 0, offset: 0, amp: 0, base: 0, segs: 0, active: 0, hp: 1, mask: 0, flash: 0, ...o,
  };
}

const freshStats = (): LevelStats => ({ served: 0, missed: 0, hits: 0, kills: 0, time: 0, bonus: 0, clean: true, restored: false });

function freshWorld(): World {
  return {
    level: 0, lane: 1, y: 1, vy: 0, lanes: 3, lanesAnim: 3,
    ents: [], boss: null, speed: 0.16, scroll: 0, dist: 0, time: 0, clock: 0,
    score: 0, streak: 0, lives: MAX_LIVES, shield: false, iframes: 0, hurt: 0,
    mirror: 0, fog: 1, fogTarget: 1, finishing: false, dying: 0,
    trail: [], stats: freshStats(),
    t: { row: 0, bot: 0, gate: 0, worm: 0, mirror: 0, fog: 0, demo: 0, mile: 0, pilot: 0 },
    lastRow: -9, milestone: 0, levelStart: 0,
    energy: 1, fireCd: 0, regenDelay: 0, recoil: 0,
    accent: hexRgb(C.glow), accentTo: hexRgb(C.glow),
  };
}

export type EngineEvents = {
  phase: (p: Phase, info: PhaseInfo) => void;
  hud: (h: Hud) => void;
  progress: (p: number) => void;
  energy?: (e: number) => void;
  dry?: () => void;
};

export type EngineOpts = { preview?: number };

const NOOP_EVENTS: EngineEvents = { phase: () => {}, hud: () => {}, progress: () => {} };

export class Engine {
  phase: Phase = "title";
  readonly w: World = freshWorld();
  readonly fx = new Fx();
  private L: LevelDef = LEVELS[0];
  private mod = "";
  private reduced = false;
  private readonly preview: number;
  private readonly cv: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly ev: EngineEvents;
  private readonly scene: Scene = makeScene();
  private readonly ro: ResizeObserver;
  private readonly mono: string;
  private readonly serif: string;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private u = 60;
  private raf = 0;
  private last = 0;
  private dead = false;
  private onScreen = true;
  private tabVisible = true;
  private suspended = false;
  private hitstop = 0;
  private slow = 1;
  private slowT = 0;
  private hudKey = "";
  private lastP = -1;
  private lastE = -1;
  private drewPaused = false;
  private trigger = false;
  private dryT = 0;

  constructor(cv: HTMLCanvasElement, ev: EngineEvents | null, reduced: boolean, opts: EngineOpts = {}) {
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.cv = cv;
    this.ctx = ctx;
    this.ev = ev ?? NOOP_EVENTS;
    this.preview = opts.preview ?? -1;
    const cs = getComputedStyle(document.documentElement);
    const mono = cs.getPropertyValue("--font-geist-mono").trim();
    const serif = cs.getPropertyValue("--font-serif").trim();
    this.mono = mono ? `${mono}, ui-monospace, monospace` : "ui-monospace, SFMono-Regular, Menlo, monospace";
    this.serif = serif ? `${serif}, Georgia, serif` : "Georgia, 'Times New Roman', serif";
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(cv);
    this.resize();
    this.reduced = reduced;
    if (this.preview >= 0) {
      this.fx.mute = true;
      this.fx.reduced = true; // thumbnails never shake or flash
      this.newRun(this.preview, "", false);
      this.go();
      // fast-forward so the thumbnail opens mid-action
      for (let i = 0; i < 150; i++) this.update(1 / 60, 1 / 60);
    }
    this.setReduced(reduced);
  }

  /* ---------- public API ---------- */

  get unit() { return this.u; }
  get isPreview() { return this.preview >= 0; }

  setReduced(r: boolean) {
    this.reduced = r;
    this.fx.reduced = r || this.preview >= 0; // thumbnails never shake or flash
    this.drewPaused = false;
    this.syncLoop();
    if (!this.raf) this.render();
  }

  setOnScreen(v: boolean) {
    this.onScreen = v;
    this.syncLoop();
  }

  setTabVisible(v: boolean) {
    this.tabVisible = v;
    this.syncLoop();
  }

  /** Thumbnails freeze while a real run is on, so the game gets the frame budget. */
  setSuspended(v: boolean) {
    this.suspended = v;
    this.syncLoop();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ro.disconnect();
  }

  newRun(level: number, mod: string, vary = true) {
    const w = this.w;
    this.mod = mod;
    w.score = 0;
    w.streak = 0;
    w.lives = MAX_LIVES;
    w.shield = false;
    this.enterLevel(clamp(Math.floor(level), 0, LEVELS.length - 1), vary);
  }

  /** Same hop, same modifier, fresh replicas and score. */
  retry() { this.newRun(this.w.level, this.mod); }

  next() {
    if (this.phase === "clear") this.enterLevel(Math.min(this.w.level + 1, LEVELS.length - 1));
  }

  /** After the boss: carry the score into endless mode. */
  overtime() {
    if (this.phase !== "won") return;
    this.w.lives = MAX_LIVES;
    this.enterLevel(ENDLESS);
  }

  go() {
    if (this.phase !== "intro") return;
    const w = this.w, L = this.L, T = w.t;
    T.row = 0.7;
    T.bot = L.bots ? rand(1.0, 2.0) : 0;
    T.gate = rand(1.2, 1.8);
    T.worm = rand(1.6, 2.4);
    T.mirror = L.mirror ? rand(2.5, 4) : 0;
    T.fog = rand(8, 12);
    T.mile = 0;
    w.fogTarget = L.fog ?? 1;
    w.lastRow = -9;
    w.energy = 1;
    this.fx.warp = 1;
    this.fx.text(this.W / 2, this.H * 0.5, L.boss ? "Origin" : L.endless ? "Overtime" : "Go", L.accent, 42, 1.1, true);
    this.fx.ring(this.W * PXN, this.laneY(w.y), L.accent, this.u * 0.2, this.W, 0.8, 2);
    this.setPhase("run");
  }

  pause() {
    this.trigger = false;
    if (this.phase === "run" && this.w.dying <= 0) this.setPhase("paused");
  }

  resume() {
    if (this.phase === "paused") this.setPhase("run");
  }

  quit() {
    const w = this.w;
    w.ents.length = 0;
    w.boss = null;
    w.mirror = 0;
    w.fogTarget = 1;
    w.dying = 0;
    w.finishing = false;
    w.lanes = 3;
    w.lane = 1;
    w.accentTo = hexRgb(C.glow);
    this.trigger = false;
    this.slowT = 0;
    this.lastP = -1;
    this.ev.progress(0);
    this.setPhase("title");
  }

  /** Relative lane change (keyboard, swipe, on-screen buttons). */
  move(dir: number) {
    if (!this.isLive()) return;
    const w = this.w;
    let d = Math.sign(dir);
    if (w.mirror === 2) d = -d;
    const to = clamp(w.lane + d, 0, w.lanes - 1);
    if (to === w.lane) {
      w.vy += d * 2.5; // bump against the edge so the input still registers
      return;
    }
    w.lane = to;
  }

  /** Lane index under a client y coordinate (before any hijack inversion). */
  laneAt(clientY: number) {
    const w = this.w;
    const r = this.cv.getBoundingClientRect();
    const y = ((clientY - r.top) / Math.max(1, r.height)) * this.H;
    return clamp(Math.round((y - this.H * LANE_C) / this.u + (w.lanesAnim - 1) / 2), 0, w.lanes - 1);
  }

  /** Absolute lane pick from a tap/click at clientY. */
  tapAt(clientY: number) {
    if (!this.isLive()) return;
    const w = this.w;
    let lane = this.laneAt(clientY);
    if (w.mirror === 2) lane = w.lanes - 1 - lane;
    if (lane !== w.lane) this.fx.ring(this.W * PXN, this.laneY(lane), C.mist, this.u * 0.06, this.u * 0.9, 0.28, 1);
    w.lane = lane;
  }

  /** Hold-to-fire: the first press fires at once, holding repeats as charge allows. */
  setTrigger(on: boolean) {
    this.trigger = on && this.isLive();
    if (this.trigger) this.fire(false);
  }

  /** One shot along the packet's lane. Returns false if it couldn't fire. */
  fire(auto = false): boolean {
    if (!this.isLive()) return false;
    const w = this.w;
    if (w.fireCd > 0) return false;
    if (w.energy < COST - 1e-6) {
      if (!auto) this.dry();
      return false;
    }
    w.energy -= COST;
    w.fireCd = FIRE_CD;
    w.regenDelay = 0.35;
    w.recoil = 1;
    const u = this.u, px = this.W * PXN, py = this.laneY(w.y);
    const acc = rgbHex(w.accent);
    const hit = this.laserTarget();
    const x2 = hit ? hit.x * this.W : this.W + 20;
    this.fx.laser(px + u * 0.12, x2, py, acc, Math.max(3, u * 0.09));
    this.fx.burst(px + u * 0.16, py, C.mist, 6, 240, { dir: 0, spread: 0.9, life: 0.22, size: 1.6 });
    this.fx.ring(px + u * 0.14, py, acc, u * 0.04, u * 1.1, 0.16, 2);
    if (hit) this.laserHit(hit, x2, py);
    return true;
  }

  /* ---------- layout ---------- */

  private layout() {
    const field = Math.min(this.H * 0.76, this.W * 0.9);
    this.u = Math.max(18, field / Math.max(3, this.w.lanesAnim));
  }

  private laneY = (l: number) => this.H * LANE_C + (l - (this.w.lanesAnim - 1) / 2) * this.u;

  private get wormSp() { return (this.u * 0.34) / Math.max(1, this.W); }

  private gateAt(e: Ent, t: number) {
    const n = this.w.lanes, cyc = Math.max(1, 2 * n - 2);
    const k = Math.floor((t + e.offset) / e.period);
    const i = ((k % cyc) + cyc) % cyc;
    return i < n ? i : cyc - i;
  }

  private gate = (e: Ent): GateState => {
    const t = this.w.time;
    const s = (t + e.offset) / e.period;
    return { open: this.gateAt(e, t), next: this.gateAt(e, t + e.period), frac: s - Math.floor(s) };
  };

  private resize() {
    const W = this.cv.clientWidth, H = this.cv.clientHeight;
    if (!W || !H) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.preview >= 0 ? 1.5 : 2);
    this.W = W;
    this.H = H;
    this.cv.width = Math.round(W * this.dpr);
    this.cv.height = Math.round(H * this.dpr);
    this.w.trail.length = 0;
    this.scene.vig = null;
    this.layout();
    this.drewPaused = false;
    if (!this.raf) this.render(); // resizing clears the canvas; repaint even while parked
  }

  /* ---------- loop ---------- */

  private syncLoop() {
    const still = this.preview >= 0 && this.reduced; // reduced motion: thumbnails are a single frame
    const want = !this.dead && this.onScreen && this.tabVisible && !this.suspended && !still;
    if (want && !this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.frame);
    } else if (!want && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private frame = (ms: number) => {
    if (this.dead) return;
    this.raf = requestAnimationFrame(this.frame);
    if (this.preview >= 0 && this.last && ms - this.last < 30) return; // thumbnails tick at ~30fps
    const real = this.last ? Math.min(0.05, Math.max(0, (ms - this.last) / 1000)) : 1 / 60;
    this.last = ms;
    if (this.phase === "paused") {
      if (!this.drewPaused) {
        this.render();
        this.drewPaused = true;
      }
      return;
    }
    let dt = real;
    if (this.hitstop > 0) {
      this.hitstop -= real;
      dt = 0;
    }
    if (this.slowT > 0) {
      this.slowT -= real;
      dt *= this.slow;
    }
    this.update(dt, real);
    this.render();
  };

  private render() {
    if (!this.W || !this.H) return;
    draw({
      ctx: this.ctx, W: this.W, H: this.H, dpr: this.dpr, u: this.u, px: this.W * PXN,
      laneY: this.laneY, w: this.w, fx: this.fx, phase: this.phase, reduced: this.reduced,
      mono: this.mono, serif: this.serif, wormSp: this.wormSp, gate: this.gate, scene: this.scene,
      mini: this.preview >= 0, charge: COST,
    });
  }

  private isLive() {
    return this.phase === "run" && this.w.dying <= 0;
  }

  private addScore(pts: number) {
    const m = modById(this.mod);
    const v = Math.round(pts * (m ? m.score : 1));
    this.w.score += v;
    return v;
  }

  /* ---------- simulation ---------- */

  private update(dt: number, real: number) {
    const w = this.w, L = this.L;
    w.clock += dt;
    const ea = Math.min(1, real * 2.5);
    for (let i = 0; i < 3; i++) w.accent[i] += (w.accentTo[i] - w.accent[i]) * ea;
    w.lanesAnim += (w.lanes - w.lanesAnim) * Math.min(1, dt * 4);
    if (Math.abs(w.lanes - w.lanesAnim) < 0.002) w.lanesAnim = w.lanes;
    this.layout();

    const live = this.isLive();
    const target = live ? this.routeSpeed(L) : this.phase === "title" ? 0.16 : 0.12;
    w.speed += (target - w.speed) * Math.min(1, dt * (live ? 1.6 : 1.1));
    w.fog += (w.fogTarget - w.fog) * Math.min(1, dt * 1.4);
    w.iframes = Math.max(0, w.iframes - dt);
    w.hurt = Math.max(0, w.hurt - dt * 2.2);
    w.recoil = Math.max(0, w.recoil - dt * 7);
    w.fireCd = Math.max(0, w.fireCd - dt);
    this.dryT = Math.max(0, this.dryT - real);
    w.regenDelay -= dt;
    if (w.regenDelay <= 0) w.energy = Math.min(1, w.energy + REGEN * (L.regenMul ?? 1) * dt);

    if (this.phase === "title") this.demo(dt);
    if (live && this.trigger) this.fire(true);

    let rem = dt;
    while (rem > 1e-6) {
      const h = Math.min(STEP, rem);
      rem -= h;
      this.step(h);
    }
    if (w.ents.some((e) => e.gone)) w.ents = w.ents.filter((e) => !e.gone);

    // ribbon trail: points drift left with the world
    const px = this.W * PXN, py = this.laneY(w.y);
    const drift = (w.speed * this.W * 0.9 + 30) * dt;
    for (const p of w.trail) p.x -= drift;
    if (dt > 0) w.trail.push({ x: px, y: py });
    while (w.trail.length && (w.trail[0].x < px - this.u * 2.2 || w.trail.length > 64)) w.trail.shift();

    if (w.dying > 0) {
      w.dying -= real;
      if (w.dying <= 0) {
        w.dying = 0;
        this.setPhase("over");
      }
    }
    if (this.preview >= 0 && L.endless && w.time > 70) w.time = 25; // keep the thumbnail at a watchable pace
    this.fx.update(dt);
    this.emitHud(false);
    if (this.phase === "run") {
      const p = this.barProgress(L);
      if (Math.abs(p - this.lastP) > 0.002) {
        this.lastP = p;
        this.ev.progress(p);
      }
    }
    if (Math.abs(w.energy - this.lastE) > 0.01 || (w.energy === 1 && this.lastE !== 1)) {
      this.lastE = w.energy;
      this.ev.energy?.(w.energy);
    }
  }

  private step(h: number) {
    const w = this.w;
    // slightly under-damped spring toward the target lane: snappy with a hint of overshoot
    const k = 380, c = 2 * Math.sqrt(k) * 0.72;
    w.vy += ((w.lane - w.y) * k - w.vy * c) * h;
    w.y += w.vy * h;
    w.scroll += w.speed * h;
    const live = this.isLive();
    if (live) {
      w.time += h;
      w.dist += w.speed * h;
      if (this.preview >= 0) this.pilot(h);
      this.direct(h);
    }
    this.moveEnts(h, live);
  }

  private routeP(L: LevelDef) {
    const w = this.w;
    if (L.endless) return clamp(w.time / 180, 0, 1);
    if (L.boss) return 0;
    return clamp(w.dist / Math.max(0.01, L.length), 0, 1);
  }

  private routeSpeed(L: LevelDef) {
    return lerp(L.speed[0], L.speed[1], this.routeP(L));
  }

  private barProgress(L: LevelDef) {
    const w = this.w;
    if (L.endless) return w.t.mile / MILE;
    if (L.boss) return w.boss ? 1 - w.boss.hp / w.boss.max : w.finishing ? 1 : 0;
    return this.routeP(L);
  }

  private moveEnts(h: number, live: boolean) {
    const w = this.w;
    const uw = this.u / Math.max(1, this.W);
    const rP = 0.1 * uw;
    for (const e of w.ents) {
      if (e.gone) continue;
      e.t += h;
      if (e.flash > 0) e.flash = Math.max(0, e.flash - h * 6);

      if (e.kind === "bot" || e.kind === "beam") {
        if (e.warn > 0) {
          e.warn -= h;
          // bots track your lane, then lock on for the last 0.4s
          if (e.kind === "bot" && e.warn > 0.4 && live) e.lane = clamp(w.lane, 0, w.lanes - 1);
          e.y += (e.lane - e.y) * Math.min(1, h * 16);
          if (e.kind === "beam" && e.warn <= 0) {
            e.active = e.period;
            this.fx.shake(0.12);
          }
          continue;
        }
        if (e.kind === "beam") {
          e.active -= h;
          if (e.active <= 0) e.gone = true;
          else if (live && !e.hit && Math.abs(w.y - e.lane) < 0.38) {
            this.hit(e);
            live = this.isLive();
          }
          continue;
        }
      }

      const prev = e.x;
      e.x -= w.speed * e.speed * h;
      if (e.kind === "jitter") this.jitterStep(e, h);
      e.y += (e.lane - e.y) * Math.min(1, h * 10);

      const tail = e.kind === "worm" ? e.segs * this.wormSp : 0;
      if (e.x < -0.2 - tail) {
        if (e.kind === "req" && !e.hit) w.stats.missed++;
        e.gone = true;
        continue;
      }
      if (!live || e.hit) continue;

      if (e.kind === "portal") {
        if (prev >= PXN && e.x < PXN) {
          e.gone = true;
          this.levelClear();
          live = false;
        }
        continue;
      }
      if (e.kind === "gate") {
        if (prev >= PXN && e.x < PXN) {
          this.passGate(e);
          live = this.isLive();
        }
        continue;
      }
      if (e.kind === "worm") {
        const sp = this.wormSp, r = RAD.worm * uw + rP;
        for (let k = 0; k < e.segs; k++) {
          if (!(e.mask & (1 << k))) continue;
          const sx = e.x + k * sp, sxp = prev + k * sp;
          if (sx - r < PXN && sxp + r * 0.45 > PXN && Math.abs(wormY(e, k) - w.y) < 0.38) {
            this.hit(e);
            live = this.isLive();
            break;
          }
        }
        continue;
      }

      // swept test along x (no tunnelling at speed), then lane overlap. Hazards are
      // forgiving: clipping the tail of something already behind the packet, or
      // grazing a lane edge mid-switch, doesn't count. Pickups are generous.
      const harm = HARM.has(e.kind);
      const r = RAD[e.kind] * uw + rP;
      if (e.x - r >= PXN || prev + (harm ? r * 0.45 : r) <= PXN) continue;
      if (Math.abs(e.y - w.y) > (harm ? 0.38 : 0.6)) continue;
      this.touch(e);
      live = this.isLive();
    }
  }

  private jitterStep(e: Ent, h: number) {
    if (e.hit) return;
    if (e.x > 0.98 || e.x < 0.4) {
      e.next = -1; // never hop right in front of the packet
      return;
    }
    e.hop -= h * (this.L.hopMul ?? 1);
    if (e.next < 0 && e.hop < 0.32) e.next = this.hopTarget(e);
    if (e.hop <= 0) {
      if (e.next >= 0) e.lane = e.next;
      e.next = -1;
      e.hop = rand(0.6, 1.0);
    }
  }

  /** An adjacent lane that no other blocker in the same column holds or is heading to,
      so a hop can never seal the last open lane. */
  private hopTarget(e: Ent) {
    const w = this.w;
    const opts = [e.lane - 1, e.lane + 1].filter(
      (l) =>
        l >= 0 && l < w.lanes &&
        !w.ents.some((o) => o !== e && !o.gone && (o.kind === "fail" || o.kind === "jitter") && Math.abs(o.x - e.x) < 0.09 && (o.lane === l || o.next === l)),
    );
    return opts.length ? pick(opts) : -1;
  }

  /* ---------- laser ---------- */

  /** First thing along the packet's lane: something to kill, a gate that blocks, or the boss. */
  private laserTarget(): Target | null {
    const w = this.w, sp = this.wormSp;
    let best: Target | null = null;
    const near = (y: number) => Math.abs(y - w.y) < 0.45;
    const inRange = (x: number) => x > PXN - 0.005 && x < 0.98; // only what is on screen
    for (const e of w.ents) {
      if (e.gone || e.hit) continue;
      let cand: Target | null = null;
      switch (e.kind) {
        case "fail": case "jitter": case "spoof":
          if (near(e.y) && inRange(e.x)) cand = { t: "ent", e, k: -1, x: e.x };
          break;
        case "bot":
          if (e.warn <= 0 && near(e.y) && inRange(e.x)) cand = { t: "ent", e, k: -1, x: e.x };
          break;
        case "worm":
          for (let k = 0; k < e.segs; k++) {
            if (!(e.mask & (1 << k))) continue;
            const sx = e.x + k * sp;
            if (near(wormY(e, k)) && inRange(sx) && (!cand || sx < cand.x)) cand = { t: "ent", e, k, x: sx };
          }
          break;
        case "gate":
          if (inRange(e.x) && Math.abs(w.y - this.gateAt(e, w.time)) > 0.4) cand = { t: "wall", e, k: -1, x: e.x };
          break;
      }
      if (cand && (!best || cand.x < best.x)) best = cand;
    }
    const b = w.boss;
    if (b && b.state === "fight" && Math.abs(b.y - w.y) < 0.85) {
      const bx = b.x - (this.u * 0.5) / Math.max(1, this.W);
      if (!best || bx < best.x) best = { t: "boss", e: null, k: -1, x: bx };
    }
    return best;
  }

  private explode(x: number, y: number, color: string, big = false) {
    const u = this.u;
    this.fx.burst(x, y, color, big ? 26 : 16, big ? 320 : 260, { sq: true, size: 3.2, life: 0.75, grav: 260, drag: 1.6 });
    this.fx.burst(x, y, C.mist, big ? 14 : 8, 300, { life: 0.35, size: 1.8 });
    this.fx.ring(x, y, color, u * 0.08, u * (big ? 2.6 : 1.7), big ? 0.45 : 0.32, 2.5);
    this.fx.shake(big ? 0.3 : 0.12);
    this.hitstop = Math.max(this.hitstop, big ? 0.05 : 0.025);
  }

  private laserHit(tg: Target, x: number, y: number) {
    const w = this.w, u = this.u;
    if (tg.t === "wall") {
      this.fx.burst(x, y, C.rose, 10, 220, { dir: Math.PI, spread: 1.8, life: 0.3, size: 1.6 });
      this.fx.ring(x, y, C.mist, u * 0.04, u * 0.7, 0.2, 1.5);
      this.fx.text(x, y - u * 0.36, "IMMUNE", C.mist, 10, 0.6);
      return;
    }
    if (tg.t === "boss") {
      this.fx.burst(x, y, C.sun, 12, 260, { dir: Math.PI, spread: 1.6, life: 0.4 });
      const pts = this.addScore(20);
      this.fx.text(x - u * 0.2, y - u * 0.45, `+${pts}`, C.sun, 11, 0.6);
      this.damageBoss(1);
      return;
    }
    const e = tg.e;
    if (!e) return;
    if (e.kind === "worm") {
      e.mask &= ~(1 << tg.k);
      e.flash = 1;
      this.explode(x, y, C.rose);
      if (!e.mask) {
        e.gone = true;
        w.stats.kills++;
        const pts = this.addScore((KILL.worm ?? 10) + 50);
        this.explode(x, y, C.dawn, true);
        this.fx.text(x, y - u * 0.5, `+${pts} PURGED`, C.dawn, 12, 1);
      } else {
        const pts = this.addScore(KILL.worm ?? 10);
        this.fx.text(x, y - u * 0.4, `+${pts}`, C.dawn, 10, 0.6);
      }
      return;
    }
    if (e.hp > 1) {
      e.hp--;
      e.flash = 1;
      this.fx.burst(x, y, C.sun, 10, 220, { dir: Math.PI, spread: 1.4, life: 0.3 });
      this.fx.text(x, y - u * 0.4, "ARMOR", C.sun, 10, 0.6);
      return;
    }
    e.gone = true;
    w.stats.kills++;
    this.explode(x, y, TINT[e.kind] ?? C.rose, e.kind === "bot");
    const pts = this.addScore(KILL[e.kind] ?? 15);
    this.fx.text(x, y - u * 0.42, `+${pts}`, TINT[e.kind] ?? C.rose, 11, 0.7);
  }

  private dry() {
    if (this.dryT > 0) return;
    this.dryT = 0.3;
    const u = this.u, px = this.W * PXN, py = this.laneY(this.w.y);
    this.fx.burst(px + u * 0.16, py, "#6f8a80", 5, 90, { dir: 0, spread: 1.2, life: 0.3, size: 1.4 });
    this.ev.dry?.();
  }

  private damageBoss(n: number) {
    const w = this.w, b = w.boss;
    if (!b || b.state !== "fight") return;
    if (this.preview >= 0 && b.hp - n <= 0) {
      b.hp = b.max; // thumbnails loop the fight forever
      return;
    }
    b.hp = Math.max(0, b.hp - n);
    b.hurt = Math.max(b.hurt, n >= 3 ? 1 : 0.5);
    if (b.hp <= 0) {
      b.state = "dying";
      b.dieT = 0;
      b.boom = 0;
      this.purge(true);
      this.slow = 0.4;
      this.slowT = 1;
      this.fx.flashOn(C.sun, 0.4);
      this.fx.text(this.W / 2, this.H * 0.42, "Origin restored", C.sun, 36, 1.8, true);
    }
  }

  /* ---------- director ---------- */

  private direct(h: number) {
    const w = this.w, L = this.L, T = w.t;
    if (L.boss) {
      this.bossStep(h);
      return;
    }
    if (w.finishing) return;
    if (!L.endless && w.dist >= L.length) {
      if (this.preview >= 0) {
        w.dist = 0; // thumbnails never reach the portal
      } else {
        w.finishing = true;
        w.mirror = 0;
        w.ents.push(ent("portal", 1.06, 0));
        return;
      }
    }
    const p = this.routeP(L);
    const spd = Math.max(0.2, w.speed);
    const clearGap = 0.32 / spd;

    T.row -= h;
    if (T.row <= 0) {
      const len = this.spawnPattern(L, p);
      T.row = lerp(L.gap[0], L.gap[1], p) * rand(0.85, 1.15) + len / spd;
    }

    if (L.bots) {
      T.bot -= h;
      if (T.bot <= 0) {
        // keep bots out of gate/worm moments so threats don't stack unfairly
        const busy = w.ents.some((e) => (e.kind === "gate" || e.kind === "worm") && e.x > PXN - 0.05 && e.x < 1.05);
        if (busy) T.bot = 0.5;
        else {
          w.ents.push(ent("bot", 1.06, w.lane, { warn: L.endless ? lerp(0.85, 0.7, p) : rand(0.82, 0.95), speed: 2.1 }));
          T.bot = rand(L.bots[0], L.bots[1]) * (L.endless ? lerp(1, 0.65, p) : 1);
        }
      }
    }

    if (L.gates) {
      T.gate -= h;
      if (T.gate <= 0 && w.time - w.lastRow > clearGap) {
        const period = L.gates[2] * (L.endless ? lerp(1, 0.82, p) : 1);
        w.ents.push(ent("gate", 1.08, 0, { period, offset: Math.random() * 20 }));
        T.gate = rand(L.gates[0], L.gates[1]);
        T.row = Math.max(T.row, clearGap * 1.15);
      }
    }

    if (L.worms) {
      T.worm -= h;
      if (T.worm <= 0 && w.time - w.lastRow > clearGap) {
        const n = w.lanes;
        const amp = n >= 4 && Math.random() < 0.5 ? 1 : 0.5;
        const base = rand(amp, n - 1 - amp);
        const segs = 5 + Math.floor(Math.random() * 4);
        w.ents.push(ent("worm", 1.1, base, { amp, base, segs, mask: (1 << segs) - 1, speed: rand(1.05, 1.2), offset: Math.random() * 6 }));
        T.worm = rand(L.worms[0], L.worms[1]);
        T.row = Math.max(T.row, (segs * this.wormSp + 0.32) / spd);
      }
    }

    if (L.mirror) {
      T.mirror -= h;
      if (T.mirror <= 0) {
        if (w.mirror === 0) {
          w.mirror = 1;
          T.mirror = 1.3;
        } else if (w.mirror === 1) {
          w.mirror = 2;
          T.mirror = L.mirror[2];
          this.fx.glitchOn(0.7);
          this.fx.shake(0.2);
        } else {
          w.mirror = 0;
          T.mirror = rand(L.mirror[0], L.mirror[1]);
          this.fx.text(this.W / 2, this.H * 0.1, "LINK SECURED", C.glow, 12, 1.2);
        }
      }
    }

    if (L.endless) {
      T.mile += h;
      if (T.mile >= MILE) {
        T.mile -= MILE;
        w.milestone++;
        const bonus = this.addScore(150 * w.milestone);
        this.fx.text(this.W / 2, this.H * 0.16, `Milestone ${w.milestone} · +${bonus}`, L.accent, 13, 1.6);
        this.fx.ring(this.W * PXN, this.laneY(w.y), L.accent, this.u * 0.2, this.W * 0.9, 0.7, 2);
        this.fx.warp = Math.max(this.fx.warp, 0.6);
      }
      T.fog -= h;
      if (T.fog <= 0) {
        const base = L.fog ?? 1;
        const on = w.fogTarget >= base - 0.01;
        w.fogTarget = on ? Math.min(base, 0.6) : base;
        T.fog = on ? 7 : rand(12, 18);
        if (on && base > 0.6) this.fx.text(this.W / 2, this.H * 0.1, "PACKET LOSS", C.fog, 12, 1.4);
      }
    }
  }

  /** Picks a spawn pattern for variety. Every pattern leaves at least one lane open
      in any column, and only plain rows use jitter (so hops stay safe).
      Returns the extra board-width the pattern occupies. */
  private spawnPattern(L: LevelDef, p: number): number {
    const w = this.w, n = w.lanes, lvl = w.level;
    const spd = Math.max(0.2, w.speed);
    const x0 = 1.08;
    const weights: [string, number][] = [
      ["row", 5],
      ["wall", lvl >= 1 ? 1.1 : 0.4],
      ["stagger", lvl >= 1 && n === 3 ? 1.1 : 0],
      ["slalom", lvl >= 2 ? 0.9 : 0],
      ["pillar", lvl >= 1 ? 0.8 : 0.3],
      ["snake", p < 0.25 ? 1.2 : 0.5],
    ];
    let total = 0;
    for (const [, v] of weights) total += v;
    let roll = Math.random() * total, pat = "row";
    for (const [k, v] of weights) {
      roll -= v;
      if (roll <= 0) { pat = k; break; }
    }
    const armor = L.armor ?? 1;
    const node = (x: number, lane: number) => w.ents.push(ent("fail", x, lane, { hp: armor }));
    const req = (x: number, lane: number) => {
      const spoof = !!L.spoof && Math.random() < L.spoof;
      w.ents.push(ent(spoof ? "spoof" : "req", x, lane, { offset: Math.random() }));
    };
    w.lastRow = w.time;
    switch (pat) {
      case "wall": {
        // n-1 nodes in one column, a chain of requests through the gap
        const gap = Math.floor(Math.random() * n);
        for (let l = 0; l < n; l++) if (l !== gap) node(x0, l);
        for (let k = 0; k < 3; k++) req(x0 + k * 0.045, gap);
        return 0.09;
      }
      case "stagger": {
        // a staircase across the lanes; spacing leaves time to step around each node
        const d = Math.max(0.15, 0.34 * spd);
        const down = Math.random() < 0.5;
        for (let i = 0; i < n; i++) node(x0 + i * d, down ? i : n - 1 - i);
        req(x0 + d * 0.5, down ? n - 1 : 0);
        return (n - 1) * d;
      }
      case "slalom": {
        // alternate edge lanes; the middle stays open and pays out
        const d = Math.max(0.17, 0.38 * spd);
        const first = Math.random() < 0.5 ? 0 : n - 1;
        for (let i = 0; i < 4; i++) {
          node(x0 + i * d, i % 2 ? n - 1 - first : first);
          if (Math.random() < 0.7) req(x0 + i * d, 1 + Math.floor(Math.random() * (n - 2)));
        }
        return 3 * d;
      }
      case "pillar": {
        // a long barrier in one lane (three shots to clear), requests elsewhere
        const lane = Math.floor(Math.random() * n);
        for (let k = 0; k < 3; k++) node(x0 + k * 0.06, lane);
        const other = (lane + 1 + Math.floor(Math.random() * (n - 1))) % n;
        for (let k = 0; k < 2; k++) req(x0 + 0.03 + k * 0.05, other);
        return 0.12;
      }
      case "snake": {
        // a breather: requests weaving across lanes
        let lane = Math.floor(Math.random() * n);
        for (let k = 0; k < 6; k++) {
          req(x0 + k * 0.07, lane);
          if (k % 2) lane = clamp(lane + (Math.random() < 0.5 ? -1 : 1), 0, n - 1);
        }
        return 0.35;
      }
      default:
        this.spawnRow(x0, L, p);
        return 0;
    }
  }

  /** Spawns one column; at least one lane always stays open. Returns the open lanes. */
  private spawnRow(x0: number, L: LevelDef, p: number, blockers?: number): number[] {
    const w = this.w, n = w.lanes;
    const order = shuffle(Array.from({ length: n }, (_, i) => i));
    let b = blockers ??
      1 + (Math.random() < lerp(L.double[0], L.double[1], p) ? 1 : 0) + (n >= 4 && Math.random() < (L.triple ?? 0) ? 1 : 0);
    b = clamp(b, 1, n - 1);
    const open: number[] = [];
    const chainP = L.chain ?? 0.28;
    order.forEach((lane, i) => {
      if (i < b) {
        const kind: Kind = Math.random() < L.jitter ? "jitter" : "fail";
        w.ents.push(ent(kind, x0 + rand(0, 0.015), lane, { hop: rand(0.25, 0.7), offset: Math.random(), hp: L.armor ?? 1 }));
        return;
      }
      open.push(lane);
      const r = Math.random();
      if (r < L.patch && w.lives < MAX_LIVES) w.ents.push(ent("patch", x0, lane));
      else if (r < L.patch + L.cache && !w.shield) w.ents.push(ent("cache", x0, lane));
      else if (Math.random() < L.req) {
        const chain = Math.random() < chainP ? 3 : 1;
        for (let k = 0; k < chain; k++) {
          const spoof = !!L.spoof && Math.random() < L.spoof;
          w.ents.push(ent(spoof ? "spoof" : "req", x0 + k * 0.045, lane, { offset: Math.random() }));
        }
      }
    });
    w.lastRow = w.time;
    return open;
  }

  private bossStep(h: number) {
    const w = this.w, L = this.L;
    if (w.finishing) return;
    let b = w.boss;
    if (!b) {
      const hp = L.boss ?? 21;
      b = w.boss = { x: 1.4, y: (w.lanes - 1) / 2, eye: w.y, hp, max: hp, hurt: 0, state: "enter", t: 0, cd: 0.8, last: "", dieT: 0, boom: 0 };
    }
    b.t += h;
    b.hurt = Math.max(0, b.hurt - h * 2.5);
    b.eye += (w.y - b.eye) * Math.min(1, h * 6);
    b.y = (w.lanes - 1) / 2 + Math.sin(b.t * 0.8) * 0.3;

    // sit far right, but keep the whole core and its rings on narrow (phone) boards
    const home = clamp(1 - (this.u * 0.92) / Math.max(1, this.W), 0.68, 0.86);
    if (b.state === "enter") {
      b.x += (home - b.x) * Math.min(1, h * 2.6);
      if (b.x < home + 0.015) {
        b.state = "fight";
        this.fx.shake(0.4);
        this.fx.ring(b.x * this.W, this.laneY(b.y), C.sun, this.u * 0.6, this.u * 4, 0.6, 3);
      }
      return;
    }

    if (b.state === "dying") {
      b.dieT += h;
      b.boom -= h;
      const bx = b.x * this.W, by = this.laneY(b.y);
      if (b.boom <= 0) {
        b.boom = 0.1;
        const ox = (Math.random() - 0.5) * this.u * 1.4, oy = (Math.random() - 0.5) * this.u * 1.4;
        this.fx.burst(bx + ox, by + oy, Math.random() < 0.5 ? C.sun : C.rose, 10, 220, { life: 0.6 });
        this.fx.ring(bx + ox, by + oy, C.sun, this.u * 0.1, this.u * 1.5, 0.35, 2);
        this.fx.shake(0.18);
      }
      if (b.dieT > 1.4) {
        this.fx.burst(bx, by, C.sun, 60, 480, { life: 1.2, size: 3 });
        this.fx.burst(bx, by, C.mist, 30, 360, { sq: true, size: 4, grav: 200, life: 1.3 });
        this.fx.ring(bx, by, C.sun, this.u * 0.5, this.W, 1, 4);
        this.fx.flashOn(C.sun, 0.5);
        this.fx.shake(0.9);
        w.boss = null;
        w.finishing = true;
        w.ents.push(ent("portal", 1.04, 0));
      }
      return;
    }

    b.x += (home - b.x) * Math.min(1, h * 2); // follows resizes
    b.cd -= h;
    if (b.cd > 0) return;
    const rage = b.hp <= b.max / 2;
    const pats = rage ? ["beam2", "volley2", "bots3", "sweep", "bots2"] : ["volley", "beam1", "bots2", "volley2"];
    const name = pick(pats.filter((x) => x !== b.last)); // random order, never the same attack twice running
    b.last = name;
    const n = w.lanes, bx = b.x - 0.06;
    let safe = Array.from({ length: n }, (_, i) => i);
    switch (name) {
      case "volley":
      case "volley2":
        safe = this.spawnRow(bx, L, 0, name === "volley2" ? 2 : 1);
        break;
      case "beam1":
      case "beam2": {
        const lanes = shuffle(safe.slice()).slice(0, name === "beam2" ? 2 : 1);
        for (const l of lanes) w.ents.push(ent("beam", b.x, l, { warn: 0.95, period: 0.45 }));
        safe = safe.filter((l) => !lanes.includes(l));
        break;
      }
      case "bots2":
      case "bots3": {
        const k = name === "bots3" ? 3 : 2;
        for (let i = 0; i < k; i++) w.ents.push(ent("bot", bx, w.lane, { warn: 0.8 + i * 0.45, speed: 2.1 }));
        break;
      }
      case "sweep": {
        const down = Math.random() < 0.5;
        for (let i = 0; i < n; i++) {
          const l = down ? i : n - 1 - i;
          w.ents.push(ent("beam", b.x, l, { warn: 0.75 + i * 0.45, period: 0.34 }));
        }
        safe = [down ? 0 : n - 1]; // the first lane swept is clear by the time an ACK arrives
        break;
      }
    }
    // every attack drops an ACK into a lane it leaves open
    w.ents.push(ent("ack", bx - 0.03, pick(safe.length ? safe : [w.lane]), { speed: 0.95 }));
    this.fx.ring(b.x * this.W, this.laneY(b.y), C.sun, this.u * 0.5, this.u * 2.2, 0.4, 2);
    b.cd = rage ? rand(1.8, 2.2) : rand(2.2, 2.7);
  }

  /** Gallery autopilot: steer away from danger, toward pickups, shoot what's ahead. */
  private pilot(h: number) {
    const w = this.w, T = w.t;
    T.pilot -= h;
    if (T.pilot > 0) return;
    T.pilot = 0.1;
    const n = w.lanes;
    const danger = new Array<number>(n).fill(0);
    const add = (lane: number, d: number) => {
      const l = Math.round(lane);
      if (l >= 0 && l < n) danger[l] += d;
    };
    for (const e of w.ents) {
      if (e.gone || e.hit) continue;
      const tti = (e.x - PXN) / Math.max(0.05, w.speed * e.speed);
      switch (e.kind) {
        case "fail": case "jitter": case "spoof":
          if (tti > -0.35 && tti < 0.9) {
            add(e.lane, 2 / (Math.max(0, tti) + 0.15));
            if (e.next >= 0) add(e.next, 1.5 / (Math.max(0, tti) + 0.15));
          }
          break;
        case "bot":
          if (e.warn > 0 ? e.warn < 0.55 : tti > -0.3 && tti < 0.6) add(e.lane, 10);
          break;
        case "beam":
          if (e.warn < 0.45 || e.active > 0) add(e.lane, 12);
          break;
        case "gate":
          if (tti > -0.05 && tti < 0.9) {
            const open = this.gateAt(e, w.time + Math.max(0, tti));
            for (let l = 0; l < n; l++) if (l !== open) add(l, 6 / (Math.max(0, tti) + 0.3));
          }
          break;
        case "worm":
          for (let k = 0; k < e.segs; k++) {
            if (!(e.mask & (1 << k))) continue;
            const tk = (e.x + k * this.wormSp - PXN) / Math.max(0.05, w.speed * e.speed);
            if (tk > -0.1 && tk < 0.7) {
              const y = wormY({ ...e, t: e.t + Math.max(0, tk) }, k);
              add(Math.floor(y), 3);
              add(Math.ceil(y), 3);
            }
          }
          break;
        case "req": case "ack": case "cache": case "patch":
          if (tti > 0 && tti < 1.2) add(e.lane, -(e.kind === "ack" ? 1.5 : 0.4) / (tti + 0.3));
          break;
      }
    }
    let best = w.lane, score = Infinity;
    for (let l = 0; l < n; l++) {
      const s = danger[l] + 0.25 * Math.abs(l - w.lane);
      if (s < score) { score = s; best = l; }
    }
    w.lane = best;
    const tg = this.laserTarget();
    if (tg && tg.t !== "wall" && tg.x < 0.65 && Math.random() < 0.5) this.fire(true);
  }

  /* ---------- outcomes ---------- */

  private touch(e: Ent) {
    const w = this.w;
    if (HARM.has(e.kind)) {
      this.hit(e);
      return;
    }
    e.hit = true;
    e.gone = true;
    const px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    switch (e.kind) {
      case "req": {
        w.streak++;
        const m = multOf(w.streak);
        const pts = this.addScore(10 * m);
        w.stats.served++;
        this.fx.burst(px, py, C.glow, 7, 150, { life: 0.4 });
        this.fx.ring(px, py, C.glow, u * 0.1, u * 1.8, 0.32, 1.5);
        this.fx.text(px + u * 0.2, py - u * 0.34, `+${pts}`, C.glow, 11, 0.7, false, -20);
        if (w.streak % 5 === 0 && w.streak <= 20) {
          const acc = this.L.accent;
          this.fx.text(px + u * 0.7, py - u * 0.66, `×${m} streak`, acc, 13, 1.1);
          this.fx.ring(px, py, acc, u * 0.2, u * 3.2, 0.5, 2.5);
          this.fx.burst(px, py, acc, 14, 240, { life: 0.6 });
        }
        break;
      }
      case "cache":
        if (w.shield) {
          const pts = this.addScore(50);
          this.fx.text(px + u * 0.3, py - u * 0.4, `+${pts}`, C.sky, 11, 0.8);
        } else {
          w.shield = true;
          this.fx.text(px + u * 0.3, py - u * 0.4, "SHIELD UP", C.sky, 12, 0.9);
        }
        this.fx.burst(px, py, C.sky, 14, 200);
        this.fx.ring(px, py, C.sky, u * 0.15, u * 2.4, 0.4, 2);
        break;
      case "patch":
        if (w.lives < MAX_LIVES) {
          w.lives++;
          this.fx.text(px + u * 0.3, py - u * 0.4, "+1 REPLICA", C.glow, 12, 1);
        } else {
          const pts = this.addScore(50);
          this.fx.text(px + u * 0.3, py - u * 0.4, `+${pts}`, C.glow, 11, 0.8);
        }
        this.fx.burst(px, py, C.glow, 16, 220);
        this.fx.ring(px, py, C.glow, u * 0.15, u * 2.4, 0.45, 2);
        break;
      case "ack":
        this.ack();
        break;
    }
  }

  private hit(e: Ent) {
    const w = this.w;
    e.hit = true;
    if (e.kind === "spoof") e.gone = true;
    if (w.iframes > 0) return;
    const px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    if (this.preview >= 0) {
      // thumbnails: show the knock, never lose
      w.iframes = 0.6;
      w.hurt = 1;
      this.fx.burst(px, py, C.rose, 10, 200, { life: 0.4 });
      return;
    }
    if (w.shield) {
      w.shield = false;
      w.iframes = 0.6;
      this.fx.burst(px, py, C.sky, 18, 230, { life: 0.5 });
      this.fx.ring(px, py, C.sky, u * 0.25, u * 2.6, 0.45, 2.5);
      this.fx.text(px + u * 0.3, py - u * 0.42, "BLOCKED", C.sky, 12, 0.9);
      this.fx.shake(0.25);
      this.hitstop = 0.04;
      return;
    }
    w.lives--;
    w.streak = 0;
    w.stats.hits++;
    w.iframes = 1.3;
    w.hurt = 1;
    this.fx.burst(px, py, C.rose, 22, 280, { life: 0.6, size: 2.4 });
    this.fx.burst(px, py, TINT[e.kind] ?? C.rose, 10, 220, { sq: true, size: 3.5, life: 0.9, grav: 320, drag: 1.5 });
    this.fx.ring(px, py, C.rose, u * 0.15, u * 3, 0.5, 3);
    this.fx.text(px + u * 0.35, py - u * 0.44, OUCH[e.kind] ?? "HIT", C.rose, 13, 1);
    this.fx.shake(0.55);
    this.fx.flashOn(C.rose, 0.22);
    this.fx.glitchOn(0.45);
    this.hitstop = 0.08;
    if (w.lives <= 0) this.outage();
  }

  private passGate(e: Ent) {
    const w = this.w;
    // small grace window: the gap may have stepped on the very frame you arrive
    const ok = [this.gateAt(e, w.time), this.gateAt(e, w.time - 0.15)].some((l) => Math.abs(w.y - l) < 0.42);
    if (!ok) {
      this.hit(e);
      return;
    }
    e.hit = true;
    const pts = this.addScore(25);
    const px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    this.fx.text(px + u * 0.35, py - u * 0.42, `+${pts} ALLOWED`, C.glow, 11, 0.8);
    this.fx.ring(px, py, C.glow, u * 0.15, u * 2, 0.35, 1.5);
  }

  private ack() {
    const w = this.w, b = w.boss;
    const px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    const pts = this.addScore(100);
    this.fx.text(px + u * 0.35, py - u * 0.42, `ACK +${pts}`, C.sky, 12, 0.9);
    this.fx.burst(px, py, C.sky, 12, 200);
    if (!b || b.state !== "fight") return;
    const bx = b.x * this.W, by = this.laneY(b.y);
    this.fx.zap(px, py, bx, by, C.sky);
    this.fx.burst(bx, by, C.sun, 22, 300, { life: 0.7 });
    this.fx.ring(bx, by, C.sky, u * 0.5, u * 3, 0.5, 3);
    this.fx.shake(0.35);
    this.hitstop = 0.05;
    this.damageBoss(3);
  }

  private outage() {
    const w = this.w, px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    w.dying = 1.3;
    w.mirror = 0;
    this.trigger = false;
    this.slow = 0.25;
    this.slowT = 1.1;
    this.hitstop = 0.12;
    this.fx.burst(px, py, C.mist, 36, 380, { life: 1.1 });
    this.fx.burst(px, py, C.rose, 34, 300, { sq: true, size: 4, life: 1.4, grav: 260, drag: 1.2 });
    this.fx.ring(px, py, C.rose, u * 0.2, u * 5, 0.9, 4);
    this.fx.ring(px, py, C.mist, u * 0.1, u * 3, 0.7, 2);
    this.fx.shake(1);
    this.fx.flashOn(C.rose, 0.45);
    this.fx.glitchOn(0.9);
    this.fx.text(this.W / 2, this.H * 0.42, "Outage", C.rose, 44, 1.6, true);
  }

  private levelClear() {
    const w = this.w, L = this.L;
    const px = this.W * PXN, py = this.laneY(w.y), u = this.u;
    this.trigger = false;
    this.purge(true);
    this.fx.ring(px, py, L.accent, u * 0.2, this.W * 1.4, 0.9, 3);
    this.fx.ring(px, py, C.mist, u * 0.1, this.W * 0.8, 0.7, 1.5);
    this.fx.burst(px, py, L.accent, 40, 420, { life: 1 });
    this.fx.flashOn(L.accent, 0.28);
    this.fx.shake(0.3);
    this.slow = 0.35;
    this.slowT = 0.45;
    const s = w.stats;
    s.time = w.time;
    s.clean = s.hits === 0;
    s.bonus = this.addScore(100 * (w.level + 1) + (s.clean ? 300 : 0));
    s.restored = w.lives < MAX_LIVES;
    w.lives = Math.min(MAX_LIVES, w.lives + 1);
    w.mirror = 0;
    w.fogTarget = 1;
    this.lastP = 1;
    this.ev.progress(1);
    this.setPhase(L.boss ? "won" : "clear");
  }

  private purge(withFx: boolean) {
    for (const e of this.w.ents) {
      if (e.gone || !HARM.has(e.kind)) continue;
      e.gone = true;
      if (withFx && e.x > -0.05 && e.x < 1.05) {
        const y = this.laneY(e.kind === "worm" ? wormY(e, 0) : e.y);
        this.fx.burst(e.x * this.W, y, C.mist, 6, 120, { life: 0.5 });
      }
    }
  }

  private enterLevel(level: number, vary = true) {
    const w = this.w;
    const L = (this.L = buildLevel(level, this.mod, vary));
    w.ents.length = 0;
    w.level = level;
    w.lanes = L.lanes;
    w.lane = Math.floor((L.lanes - 1) / 2);
    w.accentTo = hexRgb(L.accent);
    w.fogTarget = 1;
    w.mirror = 0;
    w.boss = null;
    w.finishing = false;
    w.dying = 0;
    w.dist = 0;
    w.time = 0;
    w.iframes = 0;
    w.milestone = 0;
    w.t.mile = 0;
    w.levelStart = w.score;
    w.energy = 1;
    if (L.startShield) w.shield = true;
    w.stats = freshStats();
    this.trigger = false;
    this.slowT = 0;
    this.hitstop = 0;
    this.lastP = 0;
    this.ev.progress(0);
    this.setPhase("intro");
  }

  /** Attract mode behind the title card: the packet steers itself onto requests. */
  private demo(dt: number) {
    const w = this.w, T = w.t;
    T.demo -= dt;
    if (T.demo <= 0) {
      T.demo = rand(0.45, 1.0);
      w.ents.push(ent("req", 1.06, Math.floor(Math.random() * w.lanes)));
    }
    let target: Ent | null = null;
    for (const e of w.ents) if (e.kind === "req" && !e.gone && e.x > PXN && (!target || e.x < target.x)) target = e;
    if (target && target.x < 0.55) w.lane = target.lane;
    const px = this.W * PXN;
    for (const e of w.ents) {
      if (e.kind !== "req" || e.gone || Math.abs(e.x - PXN) > 0.02 || Math.abs(e.y - w.y) > 0.35) continue;
      e.gone = true;
      const py = this.laneY(w.y);
      this.fx.burst(px, py, C.glow, 6, 130, { life: 0.4 });
      this.fx.ring(px, py, C.glow, this.u * 0.1, this.u * 1.6, 0.3, 1.2);
    }
  }

  /* ---------- React bridge ---------- */

  private setPhase(p: Phase) {
    this.phase = p;
    this.drewPaused = false;
    if (p !== "run") this.trigger = false;
    const w = this.w;
    this.ev.phase(p, {
      level: w.level, score: w.score, levelScore: w.score - w.levelStart, stats: { ...w.stats },
      time: w.time, milestones: w.milestone, mod: this.mod, spice: this.L.spice ?? null,
    });
    this.emitHud(true);
  }

  private emitHud(force: boolean) {
    const w = this.w, b = w.boss;
    const hud: Hud = {
      score: w.score, mult: multOf(w.streak), lives: w.lives, shield: w.shield,
      level: w.level, mirror: w.mirror, boss: b ? b.hp : 0, bossMax: b ? b.max : 0,
    };
    const key = `${hud.score}|${hud.mult}|${hud.lives}|${hud.shield}|${hud.level}|${hud.mirror}|${hud.boss}|${hud.bossMax}`;
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.ev.hud(hud);
  }
}
