import { mulberry32, fnv1a } from "@/lib/prng";

// Slow, drifting sine threads behind story cards. Pure SVG + CSS animation.
export function ThreadBackdrop({ colors, seed, density = 9 }: { colors: string[]; seed: string; density?: number }) {
  const rand = mulberry32(fnv1a(seed));
  const threads = Array.from({ length: density }, (_, i) => {
    const y = 8 + rand() * 84;
    const amp = 2 + rand() * 9;
    const waves = 2 + Math.floor(rand() * 3);
    const color = colors[i % colors.length];
    const width = 0.8 + rand() * 2.4;
    const dur = 18 + rand() * 22;
    const dir = rand() > 0.5 ? 1 : -1;
    const opacity = 0.22 + rand() * 0.4;
    // One wave period repeated across 200% width so translating by -50% loops seamlessly.
    let d = `M 0 ${y}`;
    const steps = waves * 2 * 16;
    for (let s = 1; s <= steps; s++) {
      const x = (s / steps) * 200;
      d += ` L ${x.toFixed(2)} ${(y + Math.sin((s / steps) * waves * 2 * Math.PI * 2) * amp).toFixed(2)}`;
    }
    return { d, color, width, dur, dir, opacity };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute inset-y-0 left-0 h-full w-[200%]" viewBox="0 0 200 100" preserveAspectRatio="none">
        {threads.map((t, i) => (
          <path
            key={i}
            d={t.d}
            fill="none"
            stroke={t.color}
            strokeWidth={t.width}
            vectorEffect="non-scaling-stroke"
            opacity={t.opacity}
            style={{
              animation: `weft-drift ${t.dur}s linear infinite`,
              animationDirection: t.dir > 0 ? "normal" : "reverse",
              color: t.color,
            }}
          />
        ))}
      </svg>
      <style>{`@keyframes weft-drift { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}
