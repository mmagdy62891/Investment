import type { GateResult } from "../lib/types";
import GateCard from "./GateCard";

export default function GateGrid({ gates }: { gates: GateResult[] }) {
  return (
    <div className="gate-grid">
      {gates.map((g) => (
        <GateCard gate={g} key={g.id} />
      ))}
    </div>
  );
}
