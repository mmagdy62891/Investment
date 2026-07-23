import type { CalloutData } from "../lib/types";

export default function CalloutBox({ callout }: { callout: CalloutData }) {
  return (
    <div className={`callout ${callout.type}`}>
      <p className="callout-title">
        {callout.type === "warning" ? "⛔" : "●"} {callout.title}
      </p>
      <p className="callout-body">{callout.body}</p>
    </div>
  );
}
