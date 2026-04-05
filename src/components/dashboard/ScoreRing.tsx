'use client';

interface Props {
  score: number; // 0-100
  size?: number;
}

export function ScoreRing({ score, size = 48 }: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  // Use orange for the ring — consistent with brand
  const color = '#ff6029';
  const trackColor = 'var(--bg3)';

  const label =
    score >= 75 ? 'High' :
    score >= 45 ? 'Med' :
    'Low';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }} title={`Quality score: ${score}/100 (${label})`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}
