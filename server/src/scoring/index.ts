import type { CalloutData, PeerRow, RawFinancials, Scorecard, SellReassessTarget } from "../types.js";
import { scoreAllGates, failedGates } from "./gates.js";
import { scoreAllCategories } from "./categories.js";
import { bandForScore, REJECT_BAND } from "./verdict.js";

const METHODOLOGY_NOTES = [
  "Price recalculation: valuation multiples are recalculated against the current price using the same underlying EPS/FCF/EBITDA figures whenever the quote is newer than the source snapshot.",
  "Peer comparison: peer averages shown are formula-derived from the listed peer set, not asserted.",
  "Sell/reassess targets are always tied to a specific metric reverting (e.g. PE re-rating to its own historical average) — never a chart pattern or round number."
];

function buildPeers(r: RawFinancials): PeerRow[] {
  const subject: PeerRow = {
    ticker: r.ticker,
    name: r.companyName,
    trailingPE: r.trailingPE,
    forwardPE: r.forwardPE,
    evToEbitda: r.evToEbitda,
    roe: r.roe,
    revenueGrowthYoY: r.revenueGrowthYoY,
    isSubject: true
  };
  const peers: PeerRow[] = r.peers.map((p) => ({ ...p, isSubject: false }));
  return [subject, ...peers];
}

function buildSellReassessTarget(r: RawFinancials, compositeScore: number): SellReassessTarget | null {
  const inBuyRange = compositeScore >= 70;
  if (!inBuyRange) return null;
  if (r.trailingPE == null || !r.ownHistoricalAvgPE || r.trailingPE >= r.ownHistoricalAvgPE) return null;

  const targetLow = r.price * ((r.ownHistoricalAvgPE * 0.98) / r.trailingPE);
  const targetHigh = r.price * ((r.ownHistoricalAvgPE * 1.02) / r.trailingPE);
  return {
    low: targetLow,
    high: targetHigh,
    pctFromCurrentLow: (targetLow - r.price) / r.price,
    pctFromCurrentHigh: (targetHigh - r.price) / r.price,
    reason: `Trailing PE (${r.trailingPE.toFixed(1)}x) re-rating back to its own historical average (${r.ownHistoricalAvgPE.toFixed(1)}x) without matching earnings growth.`
  };
}

export function buildScorecard(r: RawFinancials, dataSource: "live" | "demo"): Scorecard {
  const gates = scoreAllGates(r);
  const failedIds = failedGates(gates);
  const gatesPassed = failedIds.length === 0;

  const categories = scoreAllCategories(r);
  const compositeScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) * 10) / 10;

  const band = gatesPassed ? bandForScore(compositeScore) : REJECT_BAND;

  const callouts: CalloutData[] = [];

  if (!gatesPassed) {
    const failedNames = gates.filter((g) => failedIds.includes(g.id)).map((g) => g.name);
    callouts.push({
      type: "warning",
      title: `FAILS GATE — ${failedNames.join(", ")}`,
      body: "Stage 1 is binary: any gate failure rejects the stock outright regardless of the Stage 2 composite score shown below. The category breakdown is still computed and shown for informational completeness, per the framework's own handling of gate failures."
    });
  }

  if (r.isCyclicalPeak) {
    callouts.push({
      type: "info",
      title: "Cyclical peak caveat",
      body: "Current-period financial metrics appear to reflect a cyclical high point rather than a sustainable run-rate."
    });
  }

  if (r.isRecentIPO) {
    callouts.push({
      type: "info",
      title: "Newly public — requires verification",
      body: "This company has a very short public trading history. Individual gates are marked with wider uncertainty and the overall score should carry wider error bars than an established, multi-year public company."
    });
  }

  if (!r.qualitativeDataVerified) {
    callouts.push({
      type: "warning",
      title: "Qualitative research not verified",
      body: "Going-concern qualifications, active investigations, existential legal risk, short-seller theses, moat classification, and board-continuity signals have no reliable free structured-data source and default to a neutral assumption here. Independently verify these before acting, the same way the framework itself recommends confirming Shariah status via a dedicated screening service (e.g. Zoya, Musaffa)."
    });
  }

  if (dataSource === "demo") {
    callouts.push({
      type: "info",
      title: "Demo data",
      body: "No live market data provider is configured (FMP_API_KEY missing), so this scorecard is rendered from bundled sample data for demonstration only."
    });
  }

  if (r.priceStalenessNote) {
    callouts.push({ type: "info", title: "Price recalculation", body: r.priceStalenessNote });
  }

  const estimatedCategories = categories.filter((c) => c.estimated).map((c) => c.name);
  if (estimatedCategories.length) {
    callouts.push({
      type: "info",
      title: "Some sub-scores are estimated",
      body: `${estimatedCategories.join(", ")} include one or more sub-metrics inferred from limited data (moat classification, guidance trend, etc.) rather than hard financial data. Treat as a starting point and verify before acting.`
    });
  }

  return {
    ticker: r.ticker,
    companyName: r.companyName,
    sector: r.sector,
    industry: r.industry,
    price: r.price,
    currency: r.currency,
    asOf: r.asOf,
    dataSource,
    gates,
    gatesPassed,
    failedGateIds: failedIds,
    compositeScore,
    categories,
    verdict: band.verdict,
    verdictColor: band.color,
    verdictLabel: band.label,
    peers: buildPeers(r),
    sellReassessTarget: gatesPassed ? buildSellReassessTarget(r, compositeScore) : null,
    callouts,
    methodologyNotes: METHODOLOGY_NOTES
  };
}
