import type { SellReassessTarget } from "../lib/types";

export default function SellTargetBox({ target, currency }: { target: SellReassessTarget; currency: string }) {
  return (
    <div className="sell-target-box">
      <p className="sell-target-label">Reassess / consider trimming at</p>
      <span className="sell-target-value">
        {currency} {target.low.toFixed(0)}–{target.high.toFixed(0)}
      </span>
      <span className="sell-target-pct">
        +{(target.pctFromCurrentLow * 100).toFixed(0)}–{(target.pctFromCurrentHigh * 100).toFixed(0)}% from current
      </span>
      <p className="sell-target-reason">{target.reason}</p>
    </div>
  );
}
