const WARPS = [20, 32, 44];
const WEFTS: [number, string][] = [
  [15, "#FFB547"],
  [27, "#A78BFF"],
  [39, "#4BE3AC"],
  [51, "#FF6B7A"],
];

export function WeftMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0B0A10" stroke="#2a2638" strokeWidth="1.5" />
      {WARPS.map((x) => (
        <line key={x} x1={x} y1="8" x2={x} y2="58" stroke="#F3EEE6" strokeWidth="3.5" strokeLinecap="round" />
      ))}
      {WEFTS.map(([y, c]) => (
        <line key={y} x1="9" y1={y} x2="55" y2={y} stroke={c} strokeWidth="6" strokeLinecap="round" />
      ))}
      {WEFTS.flatMap(([y], i) =>
        WARPS.map((x, j) =>
          (i + j) % 2 ? (
            <g key={`${x}-${y}`}>
              <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="#0B0A10" strokeWidth="7.5" />
              <line x1={x} y1={y - 6.5} x2={x} y2={y + 6.5} stroke="#F3EEE6" strokeWidth="3.5" />
            </g>
          ) : null,
        ),
      )}
    </svg>
  );
}

export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <WeftMark size={size} />
      <span className="font-display italic leading-none" style={{ fontSize: size * 0.95 }}>
        weft
      </span>
    </span>
  );
}
