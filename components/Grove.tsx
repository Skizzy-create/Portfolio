/* Abstract "grove": thin vertical lines that read as both tree trunks and rack
   columns, a few lit status ticks, and model nodes on the tallest stems joined
   by a slow signal arc. Seeded, so every project gets its own composition while
   the whole site keeps one visual language. Pure SVG, renders identically on
   server and client. */

function rand(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function Grove({ seed, hue, className = "", density = 1 }: { seed: number; hue: string; className?: string; density?: number }) {
  const r = rand(seed + 1);
  const W = 400, H = 300, base = 252;
  const count = Math.round((20 + r() * 10) * density);
  const cols = Array.from({ length: count }, (_, i) => {
    const x = 24 + (i / (count - 1)) * (W - 48) + (r() - 0.5) * 6;
    const h = 40 + Math.pow(r(), 1.6) * 170;
    const ticks = Array.from({ length: 1 + Math.floor(r() * 4) }, () => ({ y: base - 8 - r() * (h - 16), lit: r() < 0.28, d: r() * 4 }));
    return { x: +x.toFixed(1), h: +h.toFixed(1), ticks };
  });
  const nodes = [...cols].sort((a, b) => b.h - a.h).slice(0, 4).sort((a, b) => a.x - b.x);
  const arc = nodes.map((n, i) => {
    const y = base - n.h;
    if (i === 0) return `M${n.x} ${y}`;
    const p = nodes[i - 1], py = base - p.h;
    return `Q${((p.x + n.x) / 2).toFixed(1)} ${(Math.min(py, y) - 34).toFixed(1)} ${n.x} ${y}`;
  }).join(" ");
  const c = `hsl(${hue})`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className={className} aria-hidden>
      <line x1="0" y1={base} x2={W} y2={base} stroke="currentColor" strokeOpacity=".14" />
      {cols.map((col, i) => (
        <g key={i}>
          <line x1={col.x} y1={base} x2={col.x} y2={base - col.h} stroke="currentColor" strokeOpacity={0.1 + (col.h / 210) * 0.16} strokeWidth="1" />
          {col.ticks.map((t, k) => (
            <line
              key={k}
              x1={col.x - 3} x2={col.x + 3} y1={t.y.toFixed(1)} y2={t.y.toFixed(1)}
              stroke={t.lit ? c : "currentColor"}
              strokeOpacity={t.lit ? 0.9 : 0.22}
              strokeWidth="1.4"
              className={t.lit ? "grove-tick" : undefined}
              style={t.lit ? { animationDelay: `${t.d.toFixed(2)}s` } : undefined}
            />
          ))}
          {/* reflection below the ground line */}
          <line x1={col.x} y1={base + 4} x2={col.x} y2={base + 4 + col.h * 0.14} stroke="currentColor" strokeOpacity=".05" />
        </g>
      ))}
      <path d={arc} fill="none" stroke={c} strokeOpacity=".28" strokeWidth="1" />
      <path d={arc} fill="none" stroke={c} strokeWidth="1.4" strokeDasharray="10 400" className="grove-signal" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={base - n.h} r="7" fill={c} opacity=".12" />
          <circle cx={n.x} cy={base - n.h} r="2.6" fill={c} />
        </g>
      ))}
      <style>{`.grove-tick{animation:grovetick 4s ease-in-out infinite}@keyframes grovetick{0%,100%{stroke-opacity:.25}50%{stroke-opacity:1}}.grove-signal{animation:grovesig 6s linear infinite}@keyframes grovesig{from{stroke-dashoffset:410}to{stroke-dashoffset:0}}@media (prefers-reduced-motion:reduce){.grove-tick,.grove-signal{animation:none}}`}</style>
    </svg>
  );
}
