import { C, type Icon } from "./levels";

/** Small glyphs for the level-intro card, drawn to match the canvas sprites. */
export function MechIcon({ icon, size = 40 }: { icon: Icon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill="rgb(255 255 255 / 0.04)" stroke="rgb(255 255 255 / 0.1)" />
      {glyph(icon)}
    </svg>
  );
}

function glyph(icon: Icon) {
  switch (icon) {
    case "fail":
      return (
        <g stroke={C.rose} strokeWidth="1.6">
          <rect x="13" y="13" width="14" height="14" rx="3.5" fill="rgb(255 143 143 / 0.12)" />
          <path d="M17 17l6 6M23 17l-6 6" />
        </g>
      );
    case "jitter":
      return (
        <g strokeWidth="1.5">
          <path d="M26 9l5 5-5 5-5-5z" stroke={C.dawn} strokeDasharray="2 2" opacity=".7" />
          <path d="M16 18l7 7-7 7-7-7z" stroke={C.dawn} fill="rgb(255 194 122 / 0.12)" />
          <path d="M12.5 25.5l2-2.5 3 4 2-2.5" stroke={C.dawn} />
          <path d="M20 19l3-3" stroke={C.dawn} strokeDasharray="1.5 2" />
        </g>
      );
    case "gate":
      return (
        <g strokeWidth="2.2">
          <path d="M20 7v8M20 25v8" stroke={C.rose} />
          <path d="M17 16.5h-1.5v7H17M23 16.5h1.5v7H23" stroke={C.glow} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="6.5" stroke={C.glow} strokeWidth="1" strokeDasharray="28 14" opacity=".6" />
        </g>
      );
    case "bot":
      return (
        <g>
          <rect x="4" y="15" width="32" height="10" rx="2" fill="rgb(164 155 255 / 0.12)" />
          <path d="M11 20l9-6-3 6 3 6z" fill={C.aurora} />
          <path d="M22 18h10M22 22h7" stroke={C.aurora} strokeWidth="1.2" opacity=".55" />
        </g>
      );
    case "fog":
      return (
        <g strokeWidth="1.4">
          <circle cx="11" cy="20" r="2.6" fill={C.glow} />
          <path d="M20 12c3 1.5 6-1.5 9 0s6-1 6-1M20 20c3 1.5 6-1.5 9 0s6-1 6-1M20 28c3 1.5 6-1.5 9 0s6-1 6-1" stroke={C.fog} opacity=".75" />
          <path d="M18 8v24" stroke={C.fog} strokeDasharray="1.5 3" opacity=".6" />
        </g>
      );
    case "worm":
      return (
        <g>
          <path d="M9 24c4-8 8-8 12 0s8 8 11-2" stroke="rgb(255 143 143 / 0.35)" strokeWidth="4" />
          <circle cx="32" cy="22" r="2.6" fill={C.rose} opacity=".7" />
          <circle cx="25" cy="27" r="3" fill={C.rose} opacity=".8" />
          <circle cx="17" cy="21" r="3.2" fill={C.rose} opacity=".9" />
          <circle cx="10" cy="22" r="4" fill={C.dawn} />
          <circle cx="8.6" cy="20.6" r=".8" fill={C.night} />
          <circle cx="8.6" cy="23.4" r=".8" fill={C.night} />
        </g>
      );
    case "spoof":
      return (
        <g>
          <circle cx="20" cy="20" r="3.4" fill="#a9f0cf" />
          <path d="M20 12.5l1.8 3.6 4-1.3-1.3 4 3.6 1.2-3.6 1.2 1.3 4-4-1.3L20 27.5l-1.8-3.6-4 1.3 1.3-4-3.6-1.2 3.6-1.2-1.3-4 4 1.3z" stroke={C.rose} strokeWidth="1.2" />
        </g>
      );
    case "boss":
      return (
        <g>
          <circle cx="20" cy="20" r="12.5" stroke={C.rose} strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          <circle cx="20" cy="20" r="9.5" stroke={C.sun} strokeWidth="1.4" strokeDasharray="5 3" />
          <circle cx="20" cy="20" r="6.5" fill={C.forest} stroke={C.sun} strokeWidth="1.4" />
          <circle cx="18" cy="20" r="2.6" fill={C.sun} />
          <circle cx="17.4" cy="20" r="1.1" fill={C.night} />
        </g>
      );
    case "mix":
      return (
        <g strokeWidth="1.4">
          <rect x="9" y="9" width="8" height="8" rx="2" stroke={C.rose} />
          <path d="M28 8l4 4-4 4-4-4z" stroke={C.dawn} />
          <path d="M9 28l6-4-2 4 2 4z" fill={C.aurora} />
          <circle cx="28" cy="28" r="3.2" fill={C.glow} />
        </g>
      );
  }
}

export function PauseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
      <rect x="2" y="1.5" width="2.6" height="9" rx="1" />
      <rect x="7.4" y="1.5" width="2.6" height="9" rx="1" />
    </svg>
  );
}

export function PlayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
    </svg>
  );
}

export function FullGlyph({ exit }: { exit: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {exit ? <path d="M3 3l6 6M9 3l-6 6" /> : <path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />}
    </svg>
  );
}

export function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={up ? "M5 13.5l6-6 6 6" : "M5 8.5l6 6 6-6"} />
    </svg>
  );
}

export function LockGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="2.2" y="5.2" width="7.6" height="5.4" rx="1.3" fill="currentColor" fillOpacity=".15" />
      <path d="M3.9 5.2V3.8a2.1 2.1 0 0 1 4.2 0v1.4" />
    </svg>
  );
}

/** Laser bolt for the FIRE control and the charge meter. */
export function BoltGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M9.2 1.2 3.4 9h3.9l-.9 5.8L12.6 7H8.5z" />
    </svg>
  );
}

export function RerollGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6a4 4 0 1 1-1.2-2.85" />
      <path d="M9.4 1.4v2.2H7.2" />
    </svg>
  );
}

export function CheckGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.3 5 8.6l4.5-5" />
    </svg>
  );
}
