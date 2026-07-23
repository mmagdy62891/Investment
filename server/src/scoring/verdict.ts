import type { Verdict } from "../types.js";

export interface VerdictBand {
  min: number;
  max: number;
  verdict: Verdict;
  color: string;
  label: string;
  meaning: string;
}

// Verdict thresholds & colors, verbatim from Mizan methodology section 4.
export const VERDICT_BANDS: VerdictBand[] = [
  { min: 0, max: 40, verdict: "REJECT", color: "#8B3A2B", label: "Reject", meaning: "Do not invest under any circumstance" },
  { min: 40, max: 55, verdict: "AVOID", color: "#B5533C", label: "Avoid", meaning: "High risk, thesis unclear" },
  { min: 55, max: 70, verdict: "WATCH_HOLD", color: "#C68B3E", label: "Watch / Hold", meaning: "Hold existing positions only; do not add new capital" },
  { min: 70, max: 85, verdict: "BUY_ACCUMULATE", color: "#7FAE8C", label: "Buy / Accumulate", meaning: "Standard position sizing appropriate" },
  { min: 85, max: 101, verdict: "STRONG_BUY", color: "#C9A24B", label: "Strong Buy", meaning: "Can be overweight; genuinely rare in practice" }
];

export function bandForScore(score: number): VerdictBand {
  return VERDICT_BANDS.find((b) => score >= b.min && score < b.max) ?? VERDICT_BANDS[0];
}

export const REJECT_BAND = VERDICT_BANDS[0];
