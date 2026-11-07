export const C = {
  glow: "#7cf5c8",
  rose: "#ff8f8f",
  dawn: "#ffc27a",
  aurora: "#a49bff",
  sky: "#8fd3ff",
  mist: "#e8f3ec",
  fog: "#b9d3c9",
  orchid: "#e59bff",
  sun: "#ffe08a",
  night: "#04100c",
  forest: "#0a1f17",
} as const;

export const MAX_LIVES = 3;

export type Icon = "fail" | "jitter" | "gate" | "bot" | "fog" | "worm" | "spoof" | "boss" | "mix";

export type LevelDef = {
  name: string;
  host: string;
  accent: string;
  /** one-liner for the level gallery */
  blurb: string;
  lanes: number;
  /** route length in board-widths travelled (ignored for boss / endless) */
  length: number;
  speed: [number, number];       // board-widths per second, start → end of route
  gap: [number, number];         // seconds between rows, start → end of route
  double: [number, number];      // chance a row blocks two lanes
  triple?: number;               // chance of a third blocker (4 lanes only)
  jitter: number;                // share of blockers that hop lanes
  req: number; cache: number; patch: number;
  spoof?: number;                // share of requests that are spoofed
  bots?: [number, number];       // seconds between bots
  gates?: [number, number, number]; // min gap, max gap, seconds per gap step
  worms?: [number, number];
  mirror?: [number, number, number]; // min gap, max gap, hijack duration
  fog?: number;                  // visible share of the board
  boss?: number;                 // boss HP (an ACK deals 3, a laser hit 1)
  endless?: boolean;
  intro: { icon: Icon; title: string; tip: string };
  /* filled in per run by buildLevel() */
  chain?: number;                // chance a request comes as a chain of three
  hopMul?: number;               // jitter hop speed
  startShield?: boolean;
  regenMul?: number;             // laser recharge speed
  armor?: number;                // laser hits a node takes
  spice?: string | null;         // earlier mechanic mixed in this run
};

/* Hops run ~15–20s each; the boss ~20s. Mechanics arrive within the first
   couple of seconds so every hop teaches its idea immediately. */
export const LEVELS: LevelDef[] = [
  {
    name: "Ingress", host: "edge-01 · 10.0.0.1", accent: C.glow, blurb: "Dodge or blast failing nodes.", lanes: 3, length: 5,
    speed: [0.32, 0.38], gap: [1.05, 0.9], double: [0, 0.15], jitter: 0, req: 0.72, cache: 0, patch: 0,
    intro: { icon: "fail", title: "Failing nodes", tip: "Dodge the red nodes or blast them with your laser. Grab green requests back to back to build a streak." },
  },
  {
    name: "Load Balancer", host: "lb-02 · round-robin", accent: C.sky, blurb: "Jitter hops lanes. Caches shield you.", lanes: 3, length: 6,
    speed: [0.38, 0.46], gap: [0.95, 0.8], double: [0.15, 0.32], jitter: 0.45, req: 0.64, cache: 0.08, patch: 0.03,
    intro: { icon: "jitter", title: "Jitter", tip: "Amber nodes hop lanes, and they flash where they're about to land. Blue caches absorb one hit." },
  },
  {
    name: "Firewall", host: "fw-03 · default deny", accent: C.rose, blurb: "Slip through the moving gap.", lanes: 3, length: 7,
    speed: [0.42, 0.5], gap: [0.92, 0.8], double: [0.2, 0.32], jitter: 0.3, req: 0.6, cache: 0.06, patch: 0.03,
    gates: [2.6, 3.6, 0.9],
    intro: { icon: "gate", title: "ACL gates", tip: "A gate blocks every lane but one, and the gap keeps moving. Lasers bounce off, so be in the gap." },
  },
  {
    name: "Botnet", host: "as-6667 · hostile", accent: C.aurora, blurb: "Bots lock on, then rush. Shoot first.", lanes: 3, length: 8,
    speed: [0.46, 0.56], gap: [0.88, 0.75], double: [0.28, 0.4], jitter: 0.35, req: 0.6, cache: 0.07, patch: 0.04,
    bots: [1.7, 2.8],
    intro: { icon: "bot", title: "Bots", tip: "A violet marker tracks your lane, locks on, then a bot rushes in. Sidestep it or shoot it down." },
  },
  {
    name: "Lossy Link", host: "wan-05 · 38% loss", accent: C.fog, blurb: "Static hides what's coming.", lanes: 3, length: 8.5,
    speed: [0.5, 0.58], gap: [0.86, 0.74], double: [0.28, 0.4], jitter: 0.4, req: 0.62, cache: 0.08, patch: 0.04,
    bots: [3, 4.6], fog: 0.56,
    intro: { icon: "fog", title: "Packet loss", tip: "Static swallows the far half of the link, so things show up late. Stay central and react fast." },
  },
  {
    name: "Backbone", host: "core-06 · 400G", accent: C.dawn, blurb: "Four lanes. Worms take a volley.", lanes: 4, length: 10,
    speed: [0.54, 0.64], gap: [0.82, 0.7], double: [0.38, 0.52], triple: 0.14, jitter: 0.35, req: 0.6, cache: 0.07, patch: 0.04,
    bots: [3, 4.4], worms: [3, 4.4],
    intro: { icon: "worm", title: "Worms", tip: "The link widens to four lanes, and worms weave through it. Each shot burns off a segment." },
  },
  {
    name: "Man in the Middle", host: "??? · cert mismatch", accent: C.orchid, blurb: "Spoofs, and controls that flip.", lanes: 3, length: 11,
    speed: [0.56, 0.66], gap: [0.82, 0.72], double: [0.3, 0.42], jitter: 0.35, req: 0.66, cache: 0.07, patch: 0.04,
    spoof: 0.3, gates: [4, 5.5, 0.82], mirror: [4, 5.5, 3.5],
    intro: { icon: "spoof", title: "Spoofs & hijacks", tip: "Spoofed requests flicker red: shoot them or leave them. When the link is hijacked, up and down swap." },
  },
  {
    name: "Origin", host: "origin · thundering herd", accent: C.sun, blurb: "Boss: dodge, shoot, catch ACKs.", lanes: 3, length: 0,
    speed: [0.42, 0.42], gap: [1, 1], double: [0.3, 0.3], jitter: 0.3, req: 0.6, cache: 0.06, patch: 0.05,
    boss: 21,
    intro: { icon: "boss", title: "The Thundering Herd", tip: "Dodge its beams and volleys. Laser it whenever you're level with it, and catch the blue ACKs it drops." },
  },
  {
    name: "Overtime", host: "∞ · on-call forever", accent: C.glow, blurb: "Everything, faster, forever.", lanes: 4, length: 0,
    speed: [0.55, 1.1], gap: [0.82, 0.55], double: [0.35, 0.55], triple: 0.15, jitter: 0.4, req: 0.6, cache: 0.06, patch: 0.035,
    spoof: 0.15, bots: [2.6, 4.4], gates: [6, 9, 0.8], worms: [6, 9], mirror: [14, 20, 3.5], endless: true,
    intro: { icon: "mix", title: "Everything, faster", tip: "Every hazard, rising speed, no exit. A milestone pays out every 15 seconds. How long can you stay up?" },
  },
];

export const BOSS = 7;
export const ENDLESS = 8;
export const ROUTE = 8; // hops on the main route (excludes Overtime)

/* ---------- run modifiers ---------- */

export type ModId = "rain" | "jitter" | "fog" | "overclock" | "cache" | "super" | "armor" | "botnet";
export type Mod = { id: ModId; name: string; tip: string; color: string; score: number };

export const MODS: Mod[] = [
  { id: "rain", name: "Bonus rain", tip: "Requests pour in, often in chains.", color: C.glow, score: 1 },
  { id: "jitter", name: "Jitter storm", tip: "More nodes hop, and twice as fast.", color: C.dawn, score: 1.2 },
  { id: "fog", name: "Pea-soup fog", tip: "Packet loss on every hop.", color: C.fog, score: 1.25 },
  { id: "overclock", name: "Overclock", tip: "Everything moves 15% faster.", color: C.rose, score: 1.3 },
  { id: "cache", name: "Warm cache", tip: "Start each hop shielded; more caches.", color: C.sky, score: 0.9 },
  { id: "super", name: "Supercharged", tip: "Your laser recharges twice as fast.", color: C.aurora, score: 1 },
  { id: "armor", name: "Hardened nodes", tip: "Nodes shrug off the first shot.", color: C.sun, score: 1.15 },
  { id: "botnet", name: "Botnet surge", tip: "Bots join from hop 2 onward.", color: C.aurora, score: 1.2 },
];

export const modById = (id: string): Mod | null => MODS.find((m) => m.id === id) ?? null;

export function rollMod(not?: string): ModId {
  const pool = MODS.filter((m) => m.id !== not);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

const r = (a: number, b: number) => a + Math.random() * (b - a);
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** This run's version of hop `i`: the hazard mix wobbles, later hops may pull
    in one earlier mechanic, then the run modifier is applied. Pass "" for the
    plain definition (gallery previews). */
export function buildLevel(i: number, modId: string, vary = true): LevelDef {
  const b = LEVELS[i];
  const L: LevelDef = {
    ...b,
    speed: [...b.speed], gap: [...b.gap], double: [...b.double],
    bots: b.bots && [...b.bots], gates: b.gates && [...b.gates], worms: b.worms && [...b.worms],
    mirror: b.mirror && [...b.mirror], spice: null,
  };

  if (vary && !L.boss) {
    if (L.jitter > 0) L.jitter = cl(L.jitter + r(-0.12, 0.12), 0.1, 0.7);
    L.double = [cl(L.double[0] + r(-0.06, 0.06), 0, 0.6), cl(L.double[1] + r(-0.06, 0.08), 0, 0.65)];
    L.req = cl(L.req + r(-0.08, 0.08), 0.4, 0.9);
    if (L.gates) L.gates = [L.gates[0], L.gates[1], L.gates[2] * r(0.9, 1.1)];
    if (L.bots) L.bots = [L.bots[0] * r(0.9, 1.1), L.bots[1] * r(0.9, 1.1)];

    // later hops sometimes borrow one earlier mechanic at a low rate
    if (!L.endless && i >= 3 && Math.random() < 0.55) {
      const opts: { label: string; add: () => void }[] = [];
      if (!L.gates) opts.push({ label: "ACL gates", add: () => { L.gates = [5, 7, 0.9]; } });
      if (!L.bots && i > 3) opts.push({ label: "Bots", add: () => { L.bots = [4, 6]; } });
      if (!L.fog && i > 4) opts.push({ label: "Packet loss", add: () => { L.fog = 0.72; } });
      if (!L.worms && i > 5) opts.push({ label: "Worms", add: () => { L.worms = [5, 7]; } });
      if (opts.length) {
        const o = opts[Math.floor(Math.random() * opts.length)];
        o.add();
        L.spice = o.label;
      }
    }
  }

  switch (modId as ModId) {
    case "rain":
      L.req = Math.min(0.95, L.req + 0.2);
      L.chain = 0.55;
      break;
    case "jitter":
      if (!L.boss) L.jitter = Math.min(0.75, Math.max(L.jitter, 0.2) + 0.25);
      L.hopMul = 2;
      break;
    case "fog":
      L.fog = Math.min(L.fog ?? 1, L.fog ? 0.46 : L.boss ? 0.72 : 0.64);
      break;
    case "overclock":
      L.speed = [L.speed[0] * 1.15, L.speed[1] * 1.15];
      L.gap = [L.gap[0] / 1.08, L.gap[1] / 1.08];
      break;
    case "cache":
      L.cache += 0.06;
      L.startShield = true;
      break;
    case "super":
      L.regenMul = 2;
      break;
    case "armor":
      L.armor = 2;
      break;
    case "botnet":
      if (i >= 1) L.bots = L.bots ? [L.bots[0] * 0.8, L.bots[1] * 0.8] : [3.4, 5.2];
      break;
  }
  return L;
}
