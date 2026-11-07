import type { Ent, RGB } from "./types";

export const TAU = Math.PI * 2;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const wrap = (v: number) => ((v % 1) + 1) % 1;

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

export function hexRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** Quantised hex, so colour tweens only ever touch a handful of cached glow sprites. */
export const rgbHex = (c: RGB) =>
  "#" + c.map((v) => (Math.round(clamp(v, 0, 255) / 17) * 17).toString(16).padStart(2, "0")).join("");

/** Lane position of worm segment k; engine and renderer must agree on this. */
export const wormY = (e: Ent, k: number) => e.base + e.amp * Math.sin(e.t * 2.3 + e.offset - k * 0.62);
