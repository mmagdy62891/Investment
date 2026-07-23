import type { CategoryResult } from "../lib/types";
import { VERDICT_BANDS } from "../lib/verdictBands";
import StatChip from "./StatChip";

function colorForPct(pct100: number): string {
  const band = VERDICT_BANDS.find((b) => pct100 >= b.min && pct100 < b.max) ?? VERDICT_BANDS[0];
  return band.color;
}

export default function CategoryBar({ category }: { category: CategoryResult }) {
  const pct = category.weight > 0 ? category.score / category.weight : 0;
  const color = colorForPct(pct * 100);

  return (
    <div className="category-block">
      <div className="category-label-row">
        <span className="category-label">
          {category.id} · {category.name}
          {category.estimated && <span className="estimated-tag">estimated</span>}
        </span>
        <span className="category-score mono">
          {category.score.toFixed(1)}/{category.weight}
        </span>
      </div>
      <div className="category-bar-track">
        <div className="category-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      {category.notes.length > 0 && (
        <ul className="category-notes">
          {category.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      {category.statChips.length > 0 && (
        <div className="chip-row">
          {category.statChips.map((c) => (
            <StatChip key={c.label} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}
