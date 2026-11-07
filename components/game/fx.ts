import { C } from "./levels";

export type Part = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  drag: number; grav: number; sq: boolean;
};
export type Txt = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; text: string; color: string; size: number; big: boolean;
};
export type Ring = { x: number; y: number; r: number; vr: number; life: number; max: number; color: string; width: number };
export type Zap = { x1: number; y1: number; x2: number; y2: number; life: number; max: number; color: string };
export type Laser = { x1: number; x2: number; y: number; life: number; max: number; color: string; width: number };

type BurstOpts = { size?: number; life?: number; drag?: number; grav?: number; sq?: boolean; dir?: number; spread?: number };

const MAX_PARTS = 420;

/** Particles, rings, floating text and screen-level juice (shake, flash, glitch, warp). */
export class Fx {
  parts: Part[] = [];
  texts: Txt[] = [];
  rings: Ring[] = [];
  zaps: Zap[] = [];
  lasers: Laser[] = [];
  trauma = 0;
  flash = 0;
  flashColor: string = C.mist;
  glitch = 0;
  warp = 0;
  reduced = false;
  /** previews: no floating text (unreadable at thumbnail size) */
  mute = false;
  private t = 0;

  burst(x: number, y: number, color: string, n = 10, speed = 160, o: BurstOpts = {}) {
    const count = Math.max(1, Math.round(this.reduced ? n * 0.35 : n));
    for (let i = 0; i < count; i++) {
      const a = o.dir !== undefined ? o.dir + (Math.random() - 0.5) * (o.spread ?? Math.PI) : Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      const life = (o.life ?? 0.55) * (0.6 + Math.random() * 0.6);
      this.parts.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life,
        size: (o.size ?? 2) * (0.6 + Math.random() * 0.8), color,
        drag: o.drag ?? 3.5, grav: o.grav ?? 0, sq: o.sq ?? false,
      });
    }
    if (this.parts.length > MAX_PARTS) this.parts.splice(0, this.parts.length - MAX_PARTS);
  }

  ring(x: number, y: number, color: string, r = 6, vr = 160, life = 0.45, width = 2) {
    if (this.reduced && this.rings.length > 6) return;
    this.rings.push({ x, y, r, vr, life, max: life, color, width });
  }

  text(x: number, y: number, text: string, color: string, size = 12, life = 0.9, big = false, vx = 0) {
    if (this.mute) return;
    this.texts.push({ x, y, vx, vy: big ? -14 : -46, life, max: life, text, color, size, big });
    if (this.texts.length > 24) this.texts.shift();
  }

  zap(x1: number, y1: number, x2: number, y2: number, color: string, life = 0.28) {
    this.zaps.push({ x1, y1, x2, y2, life, max: life, color });
  }

  laser(x1: number, x2: number, y: number, color: string, width: number, life = 0.16) {
    this.lasers.push({ x1, x2, y, life, max: life, color, width });
    if (this.lasers.length > 8) this.lasers.shift();
  }

  shake(a: number) {
    if (!this.reduced) this.trauma = Math.min(1, this.trauma + a);
  }

  flashOn(color: string, a: number) {
    this.flashColor = color;
    this.flash = Math.max(this.flash, this.reduced ? a * 0.3 : a);
  }

  glitchOn(a: number) {
    if (!this.reduced) this.glitch = Math.max(this.glitch, a);
  }

  /** Screen offset from accumulated trauma (squared, so small knocks stay subtle). */
  offset(): [number, number] {
    const s = this.trauma * this.trauma * 13;
    if (s < 0.05) return [0, 0];
    const t = this.t;
    return [
      s * (Math.sin(t * 71) * 0.6 + Math.sin(t * 37.3) * 0.4),
      s * (Math.sin(t * 63.1 + 1.3) * 0.6 + Math.sin(t * 29.7) * 0.4),
    ];
  }

  update(dt: number) {
    if (dt <= 0) return;
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.glitch = Math.max(0, this.glitch - dt * 1.8);
    this.warp = Math.max(0, this.warp - dt * 1.1);

    let n = 0;
    for (const p of this.parts) {
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life > 0) this.parts[n++] = p;
    }
    this.parts.length = n;

    n = 0;
    for (const r of this.rings) {
      r.r += r.vr * dt * (0.25 + r.life / r.max);
      r.life -= dt;
      if (r.life > 0) this.rings[n++] = r;
    }
    this.rings.length = n;

    n = 0;
    for (const t of this.texts) {
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy *= Math.exp(-3 * dt);
      t.life -= dt;
      if (t.life > 0) this.texts[n++] = t;
    }
    this.texts.length = n;

    n = 0;
    for (const z of this.zaps) {
      z.life -= dt;
      if (z.life > 0) this.zaps[n++] = z;
    }
    this.zaps.length = n;

    n = 0;
    for (const l of this.lasers) {
      l.life -= dt;
      if (l.life > 0) this.lasers[n++] = l;
    }
    this.lasers.length = n;
  }

  clear() {
    this.parts.length = 0;
    this.texts.length = 0;
    this.rings.length = 0;
    this.zaps.length = 0;
    this.lasers.length = 0;
    this.trauma = this.flash = this.glitch = this.warp = 0;
  }
}
