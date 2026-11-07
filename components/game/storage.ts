import { LEVELS } from "./levels";

/** maxLevel: highest unlocked hop index. cleared[i]: 0 not yet, 1 cleared, 2 cleared without a hit.
    levelBest[i]: best points earned within hop i (Overtime: best overtime haul). */
export type Save = { best: number; maxLevel: number; wins: number; cleared: number[]; levelBest: number[] };

const KEY = "packet-run:v3";
const V2 = "packet-run:v2";
const LEGACY_BEST = "packet-best";

export const emptySave = (): Save => ({
  best: 0, maxLevel: 0, wins: 0,
  cleared: LEVELS.map(() => 0), levelBest: LEVELS.map(() => 0),
});

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const arr = (v: unknown, max: number) =>
  LEVELS.map((_, i) => (Array.isArray(v) ? Math.max(0, Math.min(max, Math.floor(num(v[i])))) : 0));

export function loadSave(): Save {
  const s = emptySave();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw) as Partial<Record<keyof Save, unknown>>;
      s.best = Math.max(0, Math.floor(num(j.best)));
      s.maxLevel = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(num(j.maxLevel))));
      s.wins = Math.max(0, Math.floor(num(j.wins)));
      s.cleared = arr(j.cleared, 2);
      s.levelBest = arr(j.levelBest, Number.MAX_SAFE_INTEGER);
    } else {
      // migrate round-one saves: keep best, unlocks and wins; hops before the unlock count as cleared
      const old = localStorage.getItem(V2);
      if (old) {
        const j = JSON.parse(old) as Partial<Record<"best" | "maxLevel" | "wins", unknown>>;
        s.best = Math.max(0, Math.floor(num(j.best)));
        s.maxLevel = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(num(j.maxLevel))));
        s.wins = Math.max(0, Math.floor(num(j.wins)));
        s.cleared = LEVELS.map((_, i) => (i < s.maxLevel ? 1 : 0));
      }
    }
    const legacy = Number(localStorage.getItem(LEGACY_BEST));
    if (Number.isFinite(legacy) && legacy > s.best) s.best = Math.floor(legacy);
  } catch {
    /* storage blocked (private mode, sandbox): play without persistence */
  }
  return s;
}

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem(LEGACY_BEST, String(s.best));
  } catch {
    /* ignore */
  }
}
