import type { StatChipData } from "../lib/types";

export default function StatChip({ label, value }: StatChipData) {
  return (
    <span className="stat-chip">
      <span className="stat-chip-label">{label}:</span>
      <span className="stat-chip-value mono">{value}</span>
    </span>
  );
}
