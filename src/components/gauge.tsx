'use client';

interface Props {
  value: number;
  max: number;
  unit: string;
  label: string;
  invert?: boolean; // true = lower is better (latency, loss)
}

export function Gauge({ value, max, unit, label, invert }: Props) {
  const pct = Math.min(value / max, 1);
  const quality = invert ? 1 - pct : pct;
  const color = quality > 0.7 ? '#d4ff3a' : quality > 0.4 ? '#FBBF24' : '#ff5b3a';

  const r = 60;
  const cx = 70;
  const cy = 70;
  const startAngle = -220;
  const endAngle = 40;
  const range = endAngle - startAngle;
  const currentAngle = startAngle + range * pct;

  const arc = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start = arc(startAngle);
  const end = arc(currentAngle);
  const largeArc = currentAngle - startAngle > 180 ? 1 : 0;

  const bgEnd = arc(endAngle);
  const bgLargeArc = endAngle - startAngle > 180 ? 1 : 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={140} height={120} viewBox="0 0 140 120">
        {/* Background arc */}
        <path
          d={`M${start.x},${start.y} A${r},${r} 0 ${bgLargeArc} 1 ${bgEnd.x},${bgEnd.y}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} strokeLinecap="round"
        />
        {/* Value arc */}
        {value > 0 && (
          <path
            d={`M${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`}
            fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={22} fontWeight={700} fontFamily="var(--mono, monospace)">
          {value > 0 ? (value < 10 ? value.toFixed(1) : Math.round(value)) : '—'}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10} letterSpacing={1}>
          {unit}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginTop: -8 }}>
        {label}
      </div>
    </div>
  );
}