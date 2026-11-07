import type { Fx } from "./fx";
import { C } from "./levels";
import type { Ent, Phase, RGB, World } from "./types";
import { TAU, clamp, hexRgb, rgba, rgbHex, wormY, wrap } from "./util";

/* Canvas renderer. Pure drawing: reads the world, never mutates it.
   Glows are pre-rendered radial sprites blended with "lighter" instead of
   shadowBlur, which keeps phones at 60fps. */

export type Scene = {
  pines: { x: number; h: number; w: number }[];
  racks: { x: number; h: number; w: number; leds: { y: number; ph: number; sp: number }[] }[];
  motes: { x: number; y: number; r: number; ph: number; sp: number; dx: number }[];
  lines: { x: number; y: number; l: number }[];
  noise: CanvasPattern | null;
  vig: CanvasGradient | null;
  vigKey: string;
};

export type GateState = { open: number; next: number; frac: number };

export type View = {
  ctx: CanvasRenderingContext2D;
  W: number; H: number; dpr: number; u: number; px: number;
  laneY: (l: number) => number;
  w: World; fx: Fx; phase: Phase; reduced: boolean;
  mono: string; serif: string;
  wormSp: number;
  gate: (e: Ent) => GateState;
  scene: Scene;
  /** gallery thumbnail: skip HUD-like text */
  mini: boolean;
  /** share of the charge one shot costs */
  charge: number;
};

const ROSE = hexRgb(C.rose), AUR = hexRgb(C.aurora), SUN = hexRgb(C.sun), MIST = hexRgb(C.mist);
const ORCHID = hexRgb(C.orchid), GLOW = hexRgb(C.glow), SKY = hexRgb(C.sky);

export function makeScene(): Scene {
  return {
    pines: Array.from({ length: 18 }, (_, i) => ({ x: i / 18 + Math.random() * 0.03, h: 0.45 + Math.random() * 0.55, w: 0.7 + Math.random() * 0.6 })),
    racks: Array.from({ length: 9 }, (_, i) => ({
      x: i / 9 + Math.random() * 0.04, h: 0.35 + Math.random() * 0.45, w: 0.8 + Math.random() * 0.5,
      leds: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => ({ y: 0.08 + Math.random() * 0.8, ph: Math.random() * 6, sp: 1 + Math.random() * 3 })),
    })),
    motes: Array.from({ length: 18 }, () => ({
      x: Math.random(), y: 0.12 + Math.random() * 0.78, r: 0.6 + Math.random() * 0.8,
      ph: Math.random() * 6, sp: 0.5 + Math.random(), dx: 0.3 + Math.random() * 0.7,
    })),
    lines: Array.from({ length: 16 }, () => ({ x: Math.random(), y: 0.08 + Math.random() * 0.86, l: 0.5 + Math.random() })),
    noise: null,
    vig: null,
    vigKey: "",
  };
}

/* ---------- sprites & helpers ---------- */

const glowCache = new Map<string, HTMLCanvasElement>();
function glow(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const [r, gg, b] = hexRgb(color);
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, `rgba(${r},${gg},${b},0.85)`);
    grd.addColorStop(0.22, `rgba(${r},${gg},${b},0.38)`);
    grd.addColorStop(0.55, `rgba(${r},${gg},${b},0.1)`);
    grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  }
  glowCache.set(color, c);
  return c;
}

/** Additive glow; caller sets globalCompositeOperation = "lighter". */
function halo(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, r: number, a = 1) {
  if (r <= 0 || a <= 0) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function noisePattern(v: View): CanvasPattern | null {
  if (v.scene.noise) return v.scene.noise;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const on = Math.random() < 0.45;
    const val = 170 + Math.random() * 85;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
    img.data[i + 3] = on ? 40 + Math.random() * 140 : 0;
  }
  g.putImageData(img, 0, 0);
  v.scene.noise = v.ctx.createPattern(c, "repeat");
  return v.scene.noise;
}

/* ---------- frame ---------- */

export function draw(v: View) {
  const { ctx, W, H, dpr, fx } = v;
  if (!W || !H) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);

  const [sx, sy] = fx.offset();
  ctx.translate(sx, sy);
  drawBackground(v);
  drawLanes(v);
  drawBeams(v);
  for (const e of v.w.ents) drawEnt(v, e);
  drawBoss(v);
  drawPlayer(v);
  drawLasers(v);
  drawFx(v);
  drawFog(v);
  drawTelegraphs(v);
  drawTexts(v);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScreen(v);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawBackground(v: View) {
  const { ctx, W, H, u, w, scene } = v;
  const acc = w.accent;
  const ground = H * 0.95;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(acc, 0));
  g.addColorStop(0.6, rgba(acc, 0.025));
  g.addColorStop(1, rgba(acc, 0.1));
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, W + 40, H + 40);

  // far grove: two-tier pines in one path
  ctx.fillStyle = "rgba(29,59,42,0.42)";
  ctx.beginPath();
  const span = W + 160;
  for (const p of scene.pines) {
    const x = wrap(p.x - w.scroll * 0.05) * span - 80;
    const h = p.h * H * 0.5, wd = p.w * Math.max(14, u * 0.28);
    ctx.moveTo(x, ground - h); ctx.lineTo(x + wd * 0.8, ground - h * 0.42); ctx.lineTo(x - wd * 0.8, ground - h * 0.42); ctx.closePath();
    ctx.moveTo(x, ground - h * 0.7); ctx.lineTo(x + wd * 1.3, ground); ctx.lineTo(x - wd * 1.3, ground); ctx.closePath();
  }
  ctx.fill();

  // server racks standing among the trees, LEDs blinking in the level colour
  const rspan = W + 200;
  const led = rgba(acc, 1);
  ctx.lineWidth = 1;
  for (const r of scene.racks) {
    const x = wrap(r.x - w.scroll * 0.2) * rspan - 100;
    const h = r.h * H * 0.6, wd = r.w * Math.max(12, u * 0.26);
    const top = ground - h, left = x - wd / 2;
    ctx.fillStyle = "rgba(4,16,12,0.55)";
    ctx.fillRect(left, top, wd, h);
    ctx.strokeStyle = "rgba(232,243,236,0.08)";
    ctx.strokeRect(left + 0.5, top + 0.5, wd - 1, h);
    ctx.fillStyle = led;
    for (const l of r.leds) {
      ctx.globalAlpha = 0.12 + 0.7 * Math.max(0, Math.sin(w.clock * l.sp + l.ph));
      ctx.fillRect(left + 3, top + l.y * h, Math.max(3, wd * 0.28), 1.5);
    }
    ctx.globalAlpha = 1;
  }

  // ground and a receding floor grid
  ctx.strokeStyle = "rgba(232,243,236,0.12)";
  ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
  ctx.strokeStyle = rgba(acc, 0.07);
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const x = wrap(i / 14 - w.scroll * 0.9) * (W + 100) - 50;
    ctx.moveTo(x, ground);
    ctx.lineTo(x + (x - W / 2) * 0.5, H + 4);
  }
  ctx.stroke();

  // fireflies
  ctx.globalCompositeOperation = "lighter";
  const mc = rgbHex(acc);
  for (const m of scene.motes) {
    const x = wrap(m.x - w.scroll * 0.1 * m.dx + w.clock * 0.003) * W;
    const y = (m.y + Math.sin(w.clock * m.sp + m.ph) * 0.03) * H;
    const a = 0.18 + 0.42 * (0.5 + 0.5 * Math.sin(w.clock * 2.2 * m.sp + m.ph));
    halo(ctx, mc, x, y, m.r * Math.max(8, u * 0.14), a);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawLanes(v: View) {
  const { ctx, W, u, w } = v;
  const n = Math.ceil(w.lanesAnim - 0.001);
  const col: RGB = w.mirror === 2 ? ORCHID : w.accent;
  const dash = Math.max(3, u * 0.06), gap = Math.max(14, u * 0.32);
  const off = (w.scroll * W) % (dash + gap);
  for (let l = 0; l < n; l++) {
    const a = clamp(w.lanesAnim - l, 0, 1);
    const y = v.laneY(l);
    const near = clamp(1 - Math.abs(w.y - l), 0, 1) * (v.phase === "run" ? 1 : 0.4);
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(MIST, (0.05 + near * 0.06) * a);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.setLineDash([dash, gap]);
    ctx.lineDashOffset = off;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(col, (0.14 + near * 0.24) * a);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.lineDashOffset = 0;
}

function drawBeams(v: View) {
  const { ctx, u, w } = v;
  for (const e of w.ents) {
    if (e.kind !== "beam") continue;
    const y = v.laneY(e.y), x0 = e.x * v.W;
    if (e.warn > 0) {
      const blink = 0.35 + 0.65 * Math.abs(Math.sin(w.clock * (9 + (1 - Math.min(1, e.warn)) * 16)));
      ctx.fillStyle = rgba(SUN, 0.06 * blink);
      ctx.fillRect(0, y - u * 0.4, x0, u * 0.8);
      ctx.strokeStyle = rgba(SUN, 0.55 * blink);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -w.clock * 60;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(x0, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    } else {
      const life = e.period > 0 ? e.active / e.period : 0;
      const k = Math.min(1, (1 - life) * 7) * Math.min(1, life * 5);
      const t = u * 0.42 * k;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgba(SUN, 0.22);
      ctx.fillRect(0, y - t, x0, t * 2);
      ctx.fillStyle = rgba(SUN, 0.5);
      ctx.fillRect(0, y - t * 0.45, x0, t * 0.9);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(0, y - t * 0.14, x0, t * 0.28);
      halo(ctx, C.sun, x0, y, u * 0.7 * k, 0.8);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

function drawEnt(v: View, e: Ent) {
  const { ctx, W, u, w } = v;
  if (e.kind === "beam") return;
  const x = e.x * W;
  if (e.kind === "worm") { if (x < W + e.segs * v.wormSp * W + u) drawWorm(v, e); return; }
  if (x < -u * 1.5 || x > W + u * 1.5) return;
  if (e.kind === "gate") { drawGate(v, e, x); return; }
  if (e.kind === "portal") { drawPortal(v, e, x); return; }
  const y = v.laneY(e.y);
  const spent = e.hit;

  switch (e.kind) {
    case "req": {
      const p = 1 + 0.12 * Math.sin(w.clock * 6 + e.x * 30);
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.glow, x, y, u * 0.3 * p, 0.55);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = C.glow; circle(ctx, x, y, u * 0.07 * p); ctx.fill();
      ctx.fillStyle = "#ffffff"; circle(ctx, x, y, u * 0.028); ctx.fill();
      break;
    }
    case "spoof": {
      // looks like a request, but its outline is always a little wrong and it flickers red
      const flick = (w.clock * 2.4 + e.offset) % 1 < 0.26;
      const p = 1 + 0.12 * Math.sin(w.clock * 6 + e.x * 30);
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, flick ? C.rose : C.glow, x, y, u * 0.3 * p, flick ? 0.75 : 0.45);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = flick ? C.rose : "#a9f0cf"; circle(ctx, x, y, u * 0.07 * p); ctx.fill();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(w.clock * 3);
      ctx.strokeStyle = rgba(ROSE, flick ? 0.95 : 0.45);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * TAU, r = u * (i % 2 ? 0.1 : 0.14);
        if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "fail": {
      const s = u * 0.14;
      if (!spent) {
        ctx.globalCompositeOperation = "lighter";
        halo(ctx, C.rose, x, y, u * 0.38, 0.28);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      rrect(ctx, x - s, y - s, s * 2, s * 2, s * 0.28);
      ctx.fillStyle = spent ? "rgba(232,243,236,0.03)" : rgba(ROSE, 0.1);
      ctx.fill();
      ctx.strokeStyle = spent ? "rgba(232,243,236,0.22)" : C.rose;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.42, y - s * 0.42); ctx.lineTo(x + s * 0.42, y + s * 0.42);
      ctx.moveTo(x + s * 0.42, y - s * 0.42); ctx.lineTo(x - s * 0.42, y + s * 0.42);
      ctx.stroke();
      if (e.hp > 1 && !spent) {
        // hardened: an outer plate that the first shot knocks off
        rrect(ctx, x - s * 1.3, y - s * 1.3, s * 2.6, s * 2.6, s * 0.4);
        ctx.strokeStyle = rgba(SUN, 0.85);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      flashOver(v, e, x, y, s * 1.3);
      break;
    }
    case "jitter": {
      const s = u * (0.16 + Math.sin(w.clock * 14 + e.offset * 6) * 0.012);
      if (e.next >= 0 && !spent) {
        // telegraph: ghost outline where it will land
        const ny = v.laneY(e.next);
        const b = 0.35 + 0.65 * Math.abs(Math.sin(w.clock * 18));
        ctx.strokeStyle = `rgba(255,194,122,${0.7 * b})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, ny - s); ctx.lineTo(x + s, ny); ctx.lineTo(x, ny + s); ctx.lineTo(x - s, ny); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + Math.sign(ny - y) * s); ctx.lineTo(x, ny - Math.sign(ny - y) * s); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (!spent) {
        ctx.globalCompositeOperation = "lighter";
        halo(ctx, C.dawn, x, y, u * 0.4, 0.3);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.strokeStyle = spent ? "rgba(232,243,236,0.22)" : C.dawn;
      ctx.fillStyle = spent ? "rgba(232,243,236,0.03)" : "rgba(255,194,122,0.1)";
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y + s * 0.1); ctx.lineTo(x - s * 0.12, y - s * 0.3); ctx.lineTo(x + s * 0.12, y + s * 0.3); ctx.lineTo(x + s * 0.45, y - s * 0.1);
      ctx.stroke();
      if (e.hp > 1 && !spent) {
        ctx.strokeStyle = rgba(SUN, 0.85);
        ctx.lineWidth = 2;
        const o = s * 1.35;
        ctx.beginPath(); ctx.moveTo(x, y - o); ctx.lineTo(x + o, y); ctx.lineTo(x, y + o); ctx.lineTo(x - o, y); ctx.closePath(); ctx.stroke();
      }
      flashOver(v, e, x, y, s * 1.2);
      break;
    }
    case "bot": {
      if (e.warn > 0) break; // drawn as a telegraph above the fog
      const s = u * 0.17;
      if (!spent) {
        ctx.globalCompositeOperation = "lighter";
        halo(ctx, C.aurora, x, y, u * 0.5, 0.5);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 1.2;
        for (let k = -1; k <= 1; k++) {
          ctx.strokeStyle = rgba(AUR, 0.4 - Math.abs(k) * 0.15);
          ctx.beginPath();
          ctx.moveTo(x + s * 0.6, y + k * s * 0.35);
          ctx.lineTo(x + s * (3.2 - Math.abs(k)), y + k * s * 0.35);
          ctx.stroke();
        }
      }
      ctx.fillStyle = spent ? "rgba(232,243,236,0.22)" : C.aurora;
      ctx.beginPath();
      ctx.moveTo(x - s, y); ctx.lineTo(x + s * 0.7, y - s * 0.75); ctx.lineTo(x + s * 0.25, y); ctx.lineTo(x + s * 0.7, y + s * 0.75);
      ctx.closePath(); ctx.fill();
      break;
    }
    case "cache": {
      const r = u * 0.13;
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.sky, x, y, u * 0.42, 0.5);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = C.sky; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3 + w.clock * 1.4;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = rgba(SKY, 0.8); circle(ctx, x, y, r * 0.3); ctx.fill();
      break;
    }
    case "patch": {
      const p = 1 + 0.15 * Math.sin(w.clock * 5);
      const s = u * 0.11 * p;
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.glow, x, y, u * 0.45 * p, 0.55);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = C.glow; ctx.lineWidth = Math.max(2.5, u * 0.045); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
      ctx.lineCap = "butt";
      break;
    }
    case "ack": {
      const s = u * 0.15;
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.sky, x, y, u * 0.6, 0.75);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(w.clock * 2);
      ctx.strokeStyle = rgba(SKY, 0.6); ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      circle(ctx, 0, 0, s * 1.6); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = C.sky;
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.night; ctx.lineWidth = Math.max(1.5, u * 0.03);
      ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x - s * 0.1, y + s * 0.3); ctx.lineTo(x + s * 0.42, y - s * 0.3); ctx.stroke();
      break;
    }
  }
}

/** White hit-flash when a laser lands on something that survives it. */
function flashOver(v: View, e: Ent, x: number, y: number, r: number) {
  if (e.flash <= 0) return;
  const { ctx } = v;
  ctx.globalCompositeOperation = "lighter";
  halo(ctx, C.mist, x, y, r * 2.4, e.flash * 0.9);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawGate(v: View, e: Ent, x: number) {
  const { ctx, u, w } = v;
  const n = w.lanes;
  const { open, next, frac } = v.gate(e);
  const top = v.laneY(0) - u * 0.5, bot = v.laneY(n - 1) + u * 0.5;
  const spent = e.hit;

  ctx.strokeStyle = "rgba(232,243,236,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top - u * 0.16); ctx.lineTo(x, top);
  ctx.moveTo(x, bot); ctx.lineTo(x, bot + u * 0.16);
  ctx.stroke();
  ctx.fillStyle = "rgba(232,243,236,0.3)";
  ctx.fillRect(x - u * 0.08, top - u * 0.18, u * 0.16, 2);
  ctx.fillRect(x - u * 0.08, bot + u * 0.16, u * 0.16, 2);

  for (let l = 0; l < n; l++) {
    const y = v.laneY(l);
    if (l === open) {
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.glow, x, y, u * 0.42, spent ? 0.15 : 0.45);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      const h = u * 0.26, bw = u * 0.06;
      ctx.strokeStyle = C.glow; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - bw * 0.2, y - h); ctx.lineTo(x - bw * 1.6, y - h); ctx.lineTo(x - bw * 1.6, y + h); ctx.lineTo(x - bw * 0.2, y + h);
      ctx.moveTo(x + bw * 0.2, y - h); ctx.lineTo(x + bw * 1.6, y - h); ctx.lineTo(x + bw * 1.6, y + h); ctx.lineTo(x + bw * 0.2, y + h);
      ctx.stroke();
      // countdown until the gap moves
      ctx.strokeStyle = rgba(GLOW, 0.55);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, u * 0.36, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - frac));
      ctx.stroke();
    } else {
      const soon = l === next ? 0.5 + 0.5 * Math.abs(Math.sin(w.clock * 14)) : 0;
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.rose, x, y, u * 0.34, spent ? 0.1 : 0.32);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = spent ? "rgba(232,243,236,0.2)" : C.rose;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y - u * 0.46); ctx.lineTo(x, y + u * 0.46); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - u * 0.4); ctx.lineTo(x, y + u * 0.4); ctx.stroke();
      if (soon > 0 && !spent) {
        ctx.fillStyle = rgba(GLOW, soon);
        circle(ctx, x + u * 0.16, y, u * 0.035); ctx.fill();
      }
    }
  }
}

function drawWorm(v: View, e: Ent) {
  const { ctx, W, u } = v;
  const sp = v.wormSp * W;
  const pts: [number, number][] = [];
  for (let k = 0; k < e.segs; k++) pts.push([e.x * W + k * sp, v.laneY(wormY(e, k))]);
  const spent = e.hit;
  const alive = (k: number) => (e.mask & (1 << k)) !== 0;

  // body: only joins neighbouring segments that are both still alive
  ctx.strokeStyle = spent ? "rgba(232,243,236,0.12)" : rgba(ROSE, 0.3);
  ctx.lineWidth = u * 0.12;
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  for (let k = 1; k < e.segs; k++) {
    if (!alive(k) || !alive(k - 1)) continue;
    ctx.moveTo(pts[k - 1][0], pts[k - 1][1]);
    ctx.lineTo(pts[k][0], pts[k][1]);
  }
  ctx.stroke();
  ctx.lineJoin = "miter"; ctx.lineCap = "butt";

  for (let k = e.segs - 1; k >= 1; k--) {
    const [sx, sy] = pts[k];
    if (!alive(k)) {
      // burnt-out socket
      ctx.strokeStyle = "rgba(232,243,236,0.14)"; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      circle(ctx, sx, sy, u * 0.07); ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    const r = u * (0.12 - k * 0.005);
    ctx.fillStyle = spent ? "rgba(232,243,236,0.18)" : `rgba(255,143,143,${0.92 - k * 0.06})`;
    circle(ctx, sx, sy, r); ctx.fill();
    ctx.strokeStyle = "rgba(4,16,12,0.6)"; ctx.lineWidth = 1.2; ctx.stroke();
  }
  if (e.flash > 0) {
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < e.segs; k++) if (alive(k)) halo(ctx, C.mist, pts[k][0], pts[k][1], u * 0.26, e.flash * 0.6);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  if (!alive(0)) return;
  const [hx, hy] = pts[0];
  const r = u * 0.15;
  if (!spent) {
    ctx.globalCompositeOperation = "lighter";
    halo(ctx, C.dawn, hx, hy, u * 0.5, 0.45);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.fillStyle = spent ? "rgba(232,243,236,0.25)" : C.dawn;
  circle(ctx, hx, hy, r); ctx.fill();
  ctx.fillStyle = C.night;
  circle(ctx, hx - r * 0.38, hy - r * 0.35, r * 0.17); ctx.fill();
  circle(ctx, hx - r * 0.38, hy + r * 0.35, r * 0.17); ctx.fill();
}

function drawPortal(v: View, e: Ent, x: number) {
  const { ctx, u, w } = v;
  const n = w.lanes;
  const top = v.laneY(0) - u * 0.7, bot = v.laneY(n - 1) + u * 0.7;
  const mid = (top + bot) / 2, ry = (bot - top) / 2;
  const acc = w.accent, hex = rgbHex(acc);

  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(x - u * 0.3, 0, x + u * 0.3, 0);
  g.addColorStop(0, rgba(acc, 0));
  g.addColorStop(0.5, rgba(acc, 0.28));
  g.addColorStop(1, rgba(acc, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - u * 0.3, top, u * 0.6, bot - top);
  for (let k = 0; k < 3; k++) {
    const pulse = 0.5 + 0.5 * Math.sin(w.clock * 4 - k * 1.2);
    ctx.strokeStyle = rgba(acc, (0.65 - k * 0.18) * (0.6 + pulse * 0.4));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, mid, u * (0.1 + k * 0.08 + pulse * 0.03), ry, 0, 0, TAU);
    ctx.stroke();
  }
  halo(ctx, hex, x, top, u * 0.5, 0.8);
  halo(ctx, hex, x, bot, u * 0.5, 0.8);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `600 ${Math.round(clamp(u * 0.13, 10, 14))}px ${v.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = rgba(acc, 0.95);
  ctx.fillText("200 OK", x, top - 6);
}

function drawBoss(v: View) {
  const b = v.w.boss;
  if (!b) return;
  const { ctx, W, u, w } = v;
  let x = b.x * W, y = v.laneY(b.y);
  const R = u * 0.5;
  if (b.hurt > 0) {
    x += (Math.random() - 0.5) * b.hurt * u * 0.14;
    y += (Math.random() - 0.5) * b.hurt * u * 0.14;
  }
  const dying = b.state === "dying";
  const flick = dying ? (Math.random() < 0.5 ? 0.35 : 1) : 1;
  const grow = dying ? 1 + b.dieT * 0.12 : 1;

  ctx.globalCompositeOperation = "lighter";
  halo(ctx, C.sun, x, y, R * 3.4 * grow, 0.38 * flick);
  halo(ctx, C.rose, x, y, R * 2 * grow, 0.25 * flick);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.5;
  ctx.rotate(w.clock * 0.7);
  ctx.setLineDash([R * 0.3, R * 0.18]);
  ctx.strokeStyle = rgba(SUN, 0.55 * flick);
  circle(ctx, 0, 0, R * 1.38 * grow); ctx.stroke();
  ctx.rotate(-w.clock * 1.7);
  ctx.setLineDash([R * 0.08, R * 0.22]);
  ctx.strokeStyle = rgba(ROSE, 0.45 * flick);
  circle(ctx, 0, 0, R * 1.66 * grow); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // health arcs: one segment per ACK's worth (3 HP); laser hits nibble a third
  const groups = Math.max(1, Math.ceil(b.max / 3));
  const seg = TAU / groups, gapA = 0.09;
  ctx.lineWidth = Math.max(2.5, u * 0.05);
  for (let i = 0; i < groups; i++) {
    const a0 = -Math.PI / 2 + i * seg + gapA, a1 = -Math.PI / 2 + (i + 1) * seg - gapA;
    ctx.strokeStyle = "rgba(232,243,236,0.12)";
    ctx.beginPath(); ctx.arc(x, y, R * 1.14, a0, a1); ctx.stroke();
    const fill = clamp((b.hp - i * 3) / 3, 0, 1);
    if (fill > 0) {
      ctx.strokeStyle = C.sun;
      ctx.beginPath(); ctx.arc(x, y, R * 1.14, a0, a0 + (a1 - a0) * fill); ctx.stroke();
    }
  }

  ctx.fillStyle = C.forest;
  circle(ctx, x, y, R); ctx.fill();
  ctx.strokeStyle = C.sun; ctx.lineWidth = 2; ctx.stroke();

  // the eye follows the packet
  const ey = clamp((v.laneY(b.eye) - y) / (u * 2), -1, 1) * R * 0.32;
  const ex = -R * 0.26;
  ctx.fillStyle = C.sun;
  circle(ctx, x + ex, y + ey, R * 0.36); ctx.fill();
  ctx.fillStyle = C.night;
  circle(ctx, x + ex * 1.3, y + ey * 1.12, R * 0.15); ctx.fill();
  if (b.hurt > 0) {
    ctx.fillStyle = `rgba(255,255,255,${b.hurt * 0.75})`;
    circle(ctx, x, y, R); ctx.fill();
  }
  if (dying) {
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * TAU;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * R * 1.1, y + Math.sin(a) * R * 1.1);
    }
    ctx.stroke();
  }
}

function drawPlayer(v: View) {
  const { ctx, u, w } = v;
  if (w.dying > 0 || (v.phase === "over" && w.lives <= 0)) return;
  const py = v.laneY(w.y);
  const px = v.px - w.recoil * u * 0.06; // kicks back a touch on every shot
  const hurt = w.hurt > 0;
  const acc = w.accent;
  const r = u * 0.1;

  // ribbon trail built from where the packet actually travelled
  const tr = w.trail;
  ctx.lineCap = "round";
  for (let i = 1; i < tr.length - 1; i++) {
    const a = i / tr.length;
    const m0x = (tr[i - 1].x + tr[i].x) / 2, m0y = (tr[i - 1].y + tr[i].y) / 2;
    const m1x = (tr[i].x + tr[i + 1].x) / 2, m1y = (tr[i].y + tr[i + 1].y) / 2;
    ctx.strokeStyle = hurt ? rgba(ROSE, a * 0.75) : rgba(acc, a * 0.75);
    ctx.lineWidth = 0.5 + a * r * 0.95;
    ctx.beginPath(); ctx.moveTo(m0x, m0y); ctx.quadraticCurveTo(tr[i].x, tr[i].y, m1x, m1y); ctx.stroke();
  }
  ctx.lineCap = "butt";

  if (w.iframes > 0 && Math.floor(w.clock * 16) % 2 === 0) return;

  // squash and stretch along the direction of travel
  const st = clamp(Math.abs(w.vy) * 0.03, 0, 0.5);
  ctx.globalCompositeOperation = "lighter";
  halo(ctx, hurt ? C.rose : rgbHex(acc), px, py, r * 4.4, 0.75);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(1 - st * 0.4, 1 + st);
  ctx.fillStyle = hurt ? C.rose : C.mist;
  circle(ctx, 0, 0, r); ctx.fill();
  ctx.fillStyle = hurt ? "#ffffff" : rgba(acc, 1);
  circle(ctx, 0, 0, r * 0.45); ctx.fill();
  ctx.restore();

  // two orbiting bits
  ctx.fillStyle = rgba(acc, 0.8);
  for (let i = 0; i < 2; i++) {
    const a = w.clock * 4.5 + i * Math.PI;
    circle(ctx, px + Math.cos(a) * r * 2.1, py + Math.sin(a) * r * 1.1, Math.max(1, r * 0.18)); ctx.fill();
  }

  // charge pips (one per shot) in an arc in front of the packet
  if (v.phase === "run" || v.phase === "paused" || v.phase === "intro") {
    const shots = Math.max(1, Math.round(1 / v.charge));
    const per = 1 / shots;
    const R = r * 2.9;
    for (let i = 0; i < shots; i++) {
      const a = (i - (shots - 1) / 2) * 0.42;
      const fill = clamp((w.energy - i * per) / per, 0, 1);
      const cx = px + Math.cos(a) * R, cy = py + Math.sin(a) * R;
      const pr = Math.max(1.6, r * 0.26);
      if (fill >= 0.999) {
        ctx.globalCompositeOperation = "lighter";
        halo(ctx, rgbHex(acc), cx, cy, pr * 4, 0.45);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = C.mist;
        circle(ctx, cx, cy, pr); ctx.fill();
      } else {
        ctx.strokeStyle = rgba(MIST, 0.28);
        ctx.lineWidth = 1;
        circle(ctx, cx, cy, pr); ctx.stroke();
        if (fill > 0) {
          ctx.fillStyle = rgba(acc, 0.35 + fill * 0.4);
          circle(ctx, cx, cy, pr * fill); ctx.fill();
        }
      }
    }
  }

  if (w.shield) {
    const R = r * 2.5;
    ctx.globalCompositeOperation = "lighter";
    halo(ctx, C.sky, px, py, R * 1.6, 0.35 + 0.15 * Math.sin(w.clock * 6));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = rgba(SKY, 0.75 + 0.2 * Math.sin(w.clock * 6));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + w.clock * 1.2;
      if (i) ctx.lineTo(px + Math.cos(a) * R, py + Math.sin(a) * R); else ctx.moveTo(px + Math.cos(a) * R, py + Math.sin(a) * R);
    }
    ctx.closePath(); ctx.stroke();
  }
}

/** Laser shots: a hot white core inside a coloured beam, a muzzle flash and an impact bloom. */
function drawLasers(v: View) {
  const { ctx, u, fx } = v;
  if (!fx.lasers.length) return;
  ctx.globalCompositeOperation = "lighter";
  for (const l of fx.lasers) {
    const k = l.life / l.max;            // 1 → 0
    const t = l.width * (0.35 + 0.65 * k);
    const len = l.x2 - l.x1;
    if (len <= 0) continue;
    ctx.globalAlpha = 0.28 * k;
    ctx.fillStyle = l.color;
    ctx.fillRect(l.x1, l.y - t * 1.8, len, t * 3.6);
    ctx.globalAlpha = 0.85 * k;
    ctx.fillRect(l.x1, l.y - t * 0.6, len, t * 1.2);
    ctx.globalAlpha = k;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(l.x1, l.y - t * 0.22, len, t * 0.44);
    halo(ctx, l.color, l.x1, l.y, u * 0.45 * (0.5 + k), k);          // muzzle
    halo(ctx, "#ffffff", l.x1, l.y, u * 0.16 * (0.5 + k), k);
    halo(ctx, l.color, l.x2, l.y, u * 0.6 * (0.6 + k * 0.6), 0.9 * k); // impact
    if (k > 0.55) {
      // four-point muzzle star, only on the first frames
      const s = u * 0.22 * k;
      ctx.globalAlpha = k;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(l.x1 + s * 1.6, l.y); ctx.lineTo(l.x1, l.y - s * 0.18); ctx.lineTo(l.x1 - s * 0.5, l.y);
      ctx.lineTo(l.x1, l.y + s * 0.18); ctx.closePath();
      ctx.moveTo(l.x1, l.y - s * 0.7); ctx.lineTo(l.x1 + s * 0.12, l.y); ctx.lineTo(l.x1, l.y + s * 0.7);
      ctx.lineTo(l.x1 - s * 0.12, l.y); ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawFx(v: View) {
  const { ctx, fx, u } = v;
  ctx.globalCompositeOperation = "lighter";
  for (const p of fx.parts) {
    const a = p.life / p.max;
    ctx.globalAlpha = a;
    if (p.sq) {
      const s = p.size;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    } else {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * (0.5 + a * 0.5);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
      ctx.stroke();
    }
  }
  for (const r of fx.rings) {
    const a = r.life / r.max;
    ctx.globalAlpha = a;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = Math.max(0.5, r.width * a);
    circle(ctx, r.x, r.y, r.r); ctx.stroke();
  }
  for (const z of fx.zaps) {
    const a = z.life / z.max;
    const dx = z.x2 - z.x1, dy = z.y2 - z.y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(z.x1, z.y1);
    for (let i = 1; i < 8; i++) {
      const t = i / 8, j = (Math.random() - 0.5) * u * 0.3;
      ctx.lineTo(z.x1 + dx * t + nx * j, z.y1 + dy * t + ny * j);
    }
    ctx.lineTo(z.x2, z.y2);
    ctx.globalAlpha = a;
    ctx.strokeStyle = z.color; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawFog(v: View) {
  const { ctx, W, H, u, w } = v;
  if (w.fog > 0.995) return;
  const amt = clamp((1 - w.fog) / 0.4, 0, 1);
  const edge = w.fog * W;
  const soft = u * 0.9;
  const g = ctx.createLinearGradient(edge - soft, 0, edge + soft * 0.5, 0);
  g.addColorStop(0, "rgba(4,16,12,0)");
  g.addColorStop(1, `rgba(4,16,12,${0.95 * amt})`);
  ctx.fillStyle = g;
  ctx.fillRect(edge - soft, -20, W - edge + soft + 40, H + 40);

  const pat = noisePattern(v);
  if (pat) {
    const ox = Math.floor(Math.random() * 96), oy = Math.floor(Math.random() * 96);
    ctx.save();
    ctx.globalAlpha = (v.reduced ? 0.12 : 0.28) * amt;
    ctx.translate(ox, oy);
    ctx.fillStyle = pat;
    ctx.fillRect(edge - ox, -oy - 20, W - edge + 40, H + 40);
    ctx.restore();
  }
  // a few torn scanlines
  ctx.fillStyle = rgba(MIST, 0.06 * amt);
  for (let i = 0; i < 4; i++) {
    const y = ((w.clock * 0.37 + i * 0.27) % 1) * H;
    ctx.fillRect(edge, y, W - edge, 1 + (i % 2));
  }
  ctx.strokeStyle = rgba(w.accent, 0.25 * amt);
  ctx.setLineDash([2, 6]);
  ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(edge, H); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawTelegraphs(v: View) {
  const { ctx, W, u, w } = v;
  for (const e of w.ents) {
    if (e.kind !== "bot" || e.warn <= 0) continue;
    const y = v.laneY(e.y);
    const locked = e.warn < 0.4;
    const blink = locked ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(w.clock * 10));
    ctx.fillStyle = rgba(AUR, (locked ? 0.1 : 0.045) * blink);
    ctx.fillRect(0, y - u * 0.4, W, u * 0.8);
    const tx = Math.min(e.x * W, W - u * 0.22);
    if (locked) {
      ctx.globalCompositeOperation = "lighter";
      halo(ctx, C.aurora, tx, y, u * 0.45, 0.6);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.strokeStyle = rgba(AUR, blink);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < (locked ? 2 : 1); k++) {
      const cx = tx - k * u * 0.15;
      ctx.moveTo(cx + u * 0.06, y - u * 0.13);
      ctx.lineTo(cx - u * 0.07, y);
      ctx.lineTo(cx + u * 0.06, y + u * 0.13);
    }
    ctx.stroke();
  }
}

function drawTexts(v: View) {
  const { ctx, fx, u } = v;
  const scale = clamp(u / 90, 0.85, 1.35);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of fx.texts) {
    const a = Math.min(1, t.life / (t.max * 0.45));
    const age = t.max - t.life;
    const pop = 1 + 0.55 * Math.max(0, 1 - age / 0.14);
    const size = Math.round(t.size * scale * pop);
    ctx.globalAlpha = a;
    ctx.font = t.big ? `italic 400 ${size}px ${v.serif}` : `600 ${size}px ${v.mono}`;
    ctx.fillStyle = "rgba(4,16,12,0.65)";
    ctx.fillText(t.text, t.x + 1, t.y + 1.5);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

/** Screen-space layer: not shaken. */
function drawScreen(v: View) {
  const { ctx, W, H, u, w, fx, dpr, scene } = v;

  // speed lines at pace, and the warp between hops
  if (!v.reduced) {
    const pace = v.phase === "run" ? clamp((w.speed - 0.5) * 1.6, 0, 1) : 0;
    const k = Math.max(fx.warp, pace * 0.7);
    if (k > 0.02) {
      ctx.lineWidth = 1;
      for (const l of scene.lines) {
        const x = wrap(l.x - w.scroll * 2.6 * (0.6 + l.l * 0.4)) * (W + 240) - 120;
        const len = u * (0.3 + k * 2.4) * l.l;
        ctx.strokeStyle = rgba(MIST, 0.16 * k * l.l);
        ctx.beginPath(); ctx.moveTo(x, l.y * H); ctx.lineTo(x + len, l.y * H); ctx.stroke();
      }
    }
  }

  // hijack: tint and banner
  if (w.mirror) {
    const a = w.mirror === 1 ? 0.5 + 0.5 * Math.abs(Math.sin(w.clock * 9)) : 0.75;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(ORCHID, 0.16 * a));
    g.addColorStop(0.25, rgba(ORCHID, 0));
    g.addColorStop(0.75, rgba(ORCHID, 0));
    g.addColorStop(1, rgba(ORCHID, 0.16 * a));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (w.mirror && !v.mini) {
    const a = w.mirror === 1 ? 0.5 + 0.5 * Math.abs(Math.sin(w.clock * 9)) : 0.75;
    ctx.font = `600 ${Math.round(clamp(u * 0.13, 10, 13))}px ${v.mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = w.mirror === 1 ? "HIJACK INCOMING" : "CONTROLS INVERTED";
    const ty = H * 0.08;
    if (w.mirror === 2 && !v.reduced && Math.random() < 0.25) {
      // occasional chromatic flicker rather than a constant (muddy) split
      ctx.fillStyle = rgba(ROSE, 0.4); ctx.fillText(label, W / 2 - 1, ty);
      ctx.fillStyle = rgba(SKY, 0.4); ctx.fillText(label, W / 2 + 1, ty);
    }
    ctx.fillStyle = rgba(ORCHID, a);
    ctx.fillText(label, W / 2, ty);
  }

  // one replica left: the edges breathe red
  if (v.phase === "run" && w.lives === 1 && w.dying <= 0 && !v.mini) {
    const a = 0.1 + 0.08 * Math.sin(w.clock * 5.5);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(255,143,143,0)");
    g.addColorStop(1, `rgba(255,143,143,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  if (fx.flash > 0) {
    ctx.globalAlpha = Math.min(1, fx.flash);
    ctx.fillStyle = fx.flashColor;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  // RGB-split slices on hits and hijacks
  const glitch = v.reduced ? 0 : Math.max(fx.glitch, w.mirror === 2 && Math.random() < 0.06 ? 0.4 : 0);
  if (glitch > 0.02) {
    const n = 2 + Math.floor(glitch * 4);
    for (let i = 0; i < n; i++) {
      const y = Math.random() * H, h = 3 + Math.random() * 16, dx = (Math.random() - 0.5) * 34 * glitch;
      ctx.drawImage(ctx.canvas, 0, Math.floor(y * dpr), Math.floor(W * dpr), Math.max(1, Math.floor(h * dpr)), dx, y, W, h);
    }
  }

  // vignette
  const key = `${W}x${H}`;
  if (scene.vigKey !== key || !scene.vig) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    g.addColorStop(0, "rgba(4,16,12,0)");
    g.addColorStop(1, "rgba(4,16,12,0.55)");
    scene.vig = g;
    scene.vigKey = key;
  }
  ctx.fillStyle = scene.vig;
  ctx.fillRect(0, 0, W, H);
}
