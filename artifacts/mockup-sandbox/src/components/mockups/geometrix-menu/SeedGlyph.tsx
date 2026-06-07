export function SeedGlyph({ size = 56, color = "#BE9650", strokeWidth = 1.2 }: { size?: number; color?: string; strokeWidth?: number }) {
  const cx = 50;
  const cy = 50;
  const r = 16;
  const centers: [number, number][] = [[cx, cy]];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    centers.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx={cx} cy={cy} r={r * 2} stroke={color} strokeWidth={strokeWidth} opacity={0.35} />
      {centers.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={strokeWidth} />
      ))}
    </svg>
  );
}
