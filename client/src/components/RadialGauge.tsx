import { VERDICT_BANDS } from "../lib/verdictBands";

interface Props {
  score: number;
  color: string;
  size?: number;
}

const START_ANGLE = -135;
const END_ANGLE = 135;
const SWEEP = END_ANGLE - START_ANGLE; // 270

function angleForScore(score: number): number {
  return START_ANGLE + (score / 100) * SWEEP;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export default function RadialGauge({ score, color, size = 220 }: Props) {
  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const r = size * 0.38;
  const clampedScore = Math.max(0, Math.min(100, score));
  const needleAngle = angleForScore(clampedScore);
  const needleLen = r * 0.86;
  const needleTip = polarToCartesian(cx, cy, needleLen, needleAngle);

  return (
    <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`}>
      <path
        d={describeArc(cx, cy, r, START_ANGLE, END_ANGLE)}
        stroke="rgba(139,147,161,0.18)"
        strokeWidth={size * 0.045}
        fill="none"
        strokeLinecap="round"
      />
      {VERDICT_BANDS.map((band) => {
        const bandStart = Math.max(START_ANGLE, angleForScore(band.min));
        const bandEnd = Math.min(END_ANGLE, angleForScore(Math.min(band.max, 100)));
        if (bandEnd <= bandStart) return null;
        return (
          <path
            key={band.verdict}
            d={describeArc(cx, cy, r, bandStart, bandEnd)}
            stroke={band.color}
            strokeWidth={size * 0.045}
            fill="none"
            strokeLinecap="butt"
            opacity={0.85}
          />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke="#EDE7DA"
        strokeWidth={size * 0.014}
        strokeLinecap="round"
      />
      <circle cx={needleTip.x} cy={needleTip.y} r={size * 0.018} fill="#EDE7DA" />
      <circle cx={cx} cy={cy} r={size * 0.03} fill="#EDE7DA" />
      <text
        x={cx}
        y={cy - size * 0.02}
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize={size * 0.17}
        fontWeight={700}
        fill={color}
      >
        {Math.round(clampedScore)}
      </text>
    </svg>
  );
}
