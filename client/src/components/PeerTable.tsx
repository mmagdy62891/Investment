import type { PeerRow } from "../lib/types";

function fmt(n: number | null, suffix = "x"): string {
  return n != null ? `${n.toFixed(1)}${suffix}` : "—";
}
function fmtPct(n: number | null): string {
  return n != null ? `${(n * 100).toFixed(1)}%` : "—";
}

export default function PeerTable({ peers }: { peers: PeerRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="peer-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Company</th>
            <th>Trailing PE</th>
            <th>Forward PE</th>
            <th>EV/EBITDA</th>
            <th>ROE</th>
            <th>Rev. growth</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((p) => (
            <tr key={p.ticker} className={p.isSubject ? "subject" : ""}>
              <td>{p.ticker}</td>
              <td>{p.name}</td>
              <td className="mono">{fmt(p.trailingPE)}</td>
              <td className="mono">{fmt(p.forwardPE)}</td>
              <td className="mono">{fmt(p.evToEbitda)}</td>
              <td className="mono">{fmtPct(p.roe)}</td>
              <td className="mono">{fmtPct(p.revenueGrowthYoY)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
