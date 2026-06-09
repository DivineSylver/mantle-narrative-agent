"use client";

export function Sparkline({
  points,
  width = 80,
  height = 24,
  positive = true,
  fill = true,
}: {
  points: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  fill?: boolean;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  const color = positive ? "var(--color-gain)" : "var(--color-loss)";
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {fill ? <path d={area} fill={color} opacity={0.12} /> : null}
      <path d={path} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
}
