export type Phase = "title" | "intro" | "run" | "paused" | "clear" | "over" | "won";

/* Everything that travels down the lanes.
     req     healthy request: points, builds the streak
     spoof   looks like a request but flickers red: costs a replica (laser kills it)
     fail    failing node, static blocker (laser kills it)
     jitter  hops between lanes, telegraphs where it lands (laser kills it)
     bot     locks onto your lane, then rushes in at double speed (laser kills it once launched)
     cache   shield that absorbs the next hit
     patch   restores a replica
     gate    ACL column: every lane blocked except one moving gap (laser-immune)
     worm    segmented body that weaves across lanes; each laser hit removes a segment
     ack     dropped by the origin boss; collecting one damages it hard
     beam    boss attack: telegraphed lane-wide laser (laser-immune)
     portal  end-of-route gateway */
export type Kind =
  | "req" | "spoof" | "fail" | "jitter" | "bot" | "cache" | "patch"
  | "gate" | "worm" | "ack" | "beam" | "portal";

export type Ent = {
  kind: Kind;
  x: number;      // 0..1 across the board, packet sits at PXN
  lane: number;   // lane it is heading for
  y: number;      // smoothed lane position (fractional while moving)
  t: number;      // age in seconds
  hit: boolean;   // already resolved against the packet
  gone: boolean;  // swept at the end of the frame
  speed: number;  // multiplier on world speed
  warn: number;   // bot / beam telegraph time left
  hop: number;    // jitter: time to next hop
  next: number;   // jitter: lane it will hop to (-1 = none)
  period: number; // gate: seconds per gap step · beam: total active time
  offset: number; // gate / worm / spoof phase
  amp: number;    // worm amplitude in lanes
  base: number;   // worm centre lane
  segs: number;   // worm segments
  active: number; // beam: active time left
  hp: number;     // laser hits left (hardened nodes take 2)
  mask: number;   // worm: bitmask of segments still alive
  flash: number;  // white hit-flash, decays
};

export type Boss = {
  x: number; y: number; eye: number;
  hp: number; max: number; hurt: number;
  state: "enter" | "fight" | "dying";
  t: number; cd: number; last: string; dieT: number; boom: number;
};

export type RGB = [number, number, number];

export type LevelStats = {
  served: number; missed: number; hits: number; kills: number;
  time: number; bonus: number; clean: boolean; restored: boolean;
};

export type Timers = {
  row: number; bot: number; gate: number; worm: number;
  mirror: number; fog: number; demo: number; mile: number; pilot: number;
};

export type World = {
  level: number;
  lane: number; y: number; vy: number;
  lanes: number; lanesAnim: number;
  ents: Ent[]; boss: Boss | null;
  speed: number; scroll: number; dist: number; time: number; clock: number;
  score: number; streak: number; lives: number; shield: boolean;
  iframes: number; hurt: number;
  mirror: 0 | 1 | 2;
  fog: number; fogTarget: number;
  finishing: boolean; dying: number;
  trail: { x: number; y: number }[];
  stats: LevelStats;
  t: Timers;
  lastRow: number;
  milestone: number;
  levelStart: number;  // score when the current hop began
  energy: number;      // laser charge 0..1 (one shot costs a third)
  fireCd: number;
  regenDelay: number;
  recoil: number;
  accent: RGB; accentTo: RGB;
};

export type Hud = {
  score: number; mult: number; lives: number; shield: boolean;
  level: number; mirror: 0 | 1 | 2; boss: number; bossMax: number;
};

export type PhaseInfo = {
  level: number; score: number; levelScore: number; stats: LevelStats;
  time: number; milestones: number; mod: string; spice: string | null;
};
