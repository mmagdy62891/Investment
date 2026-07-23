import type { GateResult } from "../lib/types";

const ICONS: Record<GateResult["status"], string> = {
  PASS: "✓",
  CAUTION: "⚠",
  FAIL: "✕"
};

const ICON_COLORS: Record<GateResult["status"], string> = {
  PASS: "#C9A24B",
  CAUTION: "#C68B3E",
  FAIL: "#EDE7DA"
};

const ICON_BG: Record<GateResult["status"], string> = {
  PASS: "rgba(201,162,75,0.15)",
  CAUTION: "rgba(198,139,62,0.2)",
  FAIL: "rgba(139,58,43,0.85)"
};

export default function GateCard({ gate }: { gate: GateResult }) {
  const cls = gate.status.toLowerCase();
  return (
    <div className={`gate-card ${cls}`}>
      <div className="gate-card-title">
        <span className="gate-icon" style={{ background: ICON_BG[gate.status], color: ICON_COLORS[gate.status] }}>
          {ICONS[gate.status]}
        </span>
        {gate.name}
      </div>
      <p className="gate-card-detail">{gate.summary}</p>
      {gate.metrics.length > 0 && (
        <div className="chip-row">
          {gate.metrics.map((m) => (
            <span className="stat-chip" key={m.label}>
              <span className="stat-chip-label">{m.label}:</span>
              <span className="stat-chip-value mono">{m.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
