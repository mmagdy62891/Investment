import type { CategoryResult, RawFinancials, StatChipData } from "../types.js";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// Rough sector ROE/ROIC benchmarks so a given ROE is judged against a sector-typical norm
// rather than one absolute bar (methodology 3.A: "17% ROE is excellent for an E&P but
// mediocre for software"). Deliberately coarse — meant to bias the score, not assert precision.
function sectorRoeBar(sector: string): { excellent: number; good: number } {
  const s = sector.toLowerCase();
  if (s.includes("energy") || s.includes("utilities") || s.includes("materials")) {
    return { excellent: 0.15, good: 0.08 };
  }
  if (s.includes("technology") || s.includes("software") || s.includes("communication")) {
    return { excellent: 0.30, good: 0.18 };
  }
  if (s.includes("financial")) {
    return { excellent: 0.16, good: 0.10 };
  }
  return { excellent: 0.20, good: 0.12 };
}

// ---------------------------------------------------------------------------
// A. Financial Health & Quality — 20 points
// ---------------------------------------------------------------------------
export function scoreFinancialHealth(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;

  // Revenue growth (4 pts)
  if (r.revenueGrowthYoY >= 0.20) score += 4;
  else if (r.revenueGrowthYoY >= 0.10) score += 3;
  else if (r.revenueGrowthYoY >= 0) score += 1.5;
  else score += 0;

  // Margin trend (4 pts)
  if (r.marginTrend === "expanding") score += 4;
  else if (r.marginTrend === "stable") score += 2.5;
  else score += 1;

  // ROE/ROIC vs sector norm (4 pts)
  const bar = sectorRoeBar(r.sector);
  const roeAvg = (r.roe + r.roic) / 2;
  if (roeAvg >= bar.excellent) score += 4;
  else if (roeAvg >= bar.good) score += 2.5;
  else if (roeAvg >= 0) score += 1;
  else score += 0;

  // FCF margin (4 pts)
  if (r.fcfMargin >= 0.20) score += 4;
  else if (r.fcfMargin >= 0.10) score += 3;
  else if (r.fcfMargin >= 0) score += 1.5;
  else score += 0;

  // Leverage: Debt/EBITDA + interest coverage (4 pts)
  let leverageScore = 0;
  if (r.debtToEbitda < 1) leverageScore = 4;
  else if (r.debtToEbitda < 2) leverageScore = 3;
  else if (r.debtToEbitda < 3.5) leverageScore = 2;
  else if (r.debtToEbitda < 5) leverageScore = 1;
  if (r.interestCoverage < 3) leverageScore = Math.max(0, leverageScore - 1);
  score += leverageScore;

  if (r.isCyclicalPeak) {
    notes.push("Current-period margins/returns appear to reflect a cyclical peak rather than a sustainable baseline.");
  }

  const statChips: StatChipData[] = [
    { label: "Rev. growth YoY", value: pct(r.revenueGrowthYoY) },
    { label: "Margin trend", value: r.marginTrend },
    { label: "ROE", value: pct(r.roe) },
    { label: "ROIC", value: pct(r.roic) },
    { label: "FCF margin", value: pct(r.fcfMargin) },
    { label: "Debt/EBITDA", value: `${r.debtToEbitda.toFixed(1)}x` },
    { label: "Interest coverage", value: `${r.interestCoverage.toFixed(1)}x` }
  ];

  return { id: "A", name: "Financial Health & Quality", weight: 20, score: clamp(score, 0, 20), statChips, notes, estimated: false };
}

// ---------------------------------------------------------------------------
// B. Valuation — 20 points
// ---------------------------------------------------------------------------
export function scoreValuation(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;
  let estimated = false;

  // Trailing PE vs own history (3 pts)
  if (r.trailingPE != null && r.ownHistoricalAvgPE) {
    const ratio = r.trailingPE / r.ownHistoricalAvgPE;
    if (ratio < 0.85) score += 3;
    else if (ratio < 1.0) score += 2;
    else if (ratio < 1.15) score += 1;
  } else {
    score += 1.5;
    estimated = true;
  }

  // Forward PE vs peers (3 pts)
  if (r.forwardPE != null && r.peerAvgForwardPE) {
    const ratio = r.forwardPE / r.peerAvgForwardPE;
    if (ratio < 0.85) score += 3;
    else if (ratio < 1.0) score += 2;
    else if (ratio < 1.15) score += 1;
  } else {
    score += 1.5;
    estimated = true;
  }

  // PEG ratio (4 pts) — explicit thresholds from methodology, incl. correction precedent
  let peg: number | null = null;
  if (r.forwardPE != null && r.epsGrowthForward > 0) {
    peg = r.forwardPE / (r.epsGrowthForward * 100);
  }
  if (peg != null) {
    if (peg < 1.0) score += 4;
    else if (peg <= 1.5) score += 2;
    else score += 0;
    if (peg > 1.0) {
      notes.push(`PEG of ${peg.toFixed(2)} is above 1.0 — treated as evidence the stock is not undervalued relative to its own growth rate, even if the headline PE looks reasonable.`);
    }
  } else {
    score += 2;
    estimated = true;
  }

  // EV/EBITDA & EV/FCF vs peers (4 pts)
  const evRatios: number[] = [];
  if (r.evToEbitda != null && r.peerMedianEvToEbitda) evRatios.push(r.evToEbitda / r.peerMedianEvToEbitda);
  if (r.evToFcf != null && r.peerMedianEvToFcf) evRatios.push(r.evToFcf / r.peerMedianEvToFcf);
  if (evRatios.length) {
    const avgRatio = evRatios.reduce((a, b) => a + b, 0) / evRatios.length;
    if (avgRatio < 0.85) score += 4;
    else if (avgRatio < 1.0) score += 3;
    else if (avgRatio < 1.15) score += 1.5;
  } else {
    score += 2;
    estimated = true;
  }

  // DCF margin of safety (3 pts)
  if (r.dcfIntrinsicValue != null && r.price > 0) {
    const margin = (r.dcfIntrinsicValue - r.price) / r.price;
    if (margin >= 0.20) score += 3;
    else if (margin >= 0.05) score += 2;
    else if (margin >= 0) score += 1;
  } else {
    score += 1.5;
    estimated = true;
  }

  // Analyst target dispersion (3 pts)
  if (r.analystTargetAvg != null && r.analystTargetLow != null && r.analystTargetHigh != null && r.price > 0) {
    const upside = (r.analystTargetAvg - r.price) / r.price;
    const dispersion = r.analystTargetAvg > 0 ? (r.analystTargetHigh - r.analystTargetLow) / r.analystTargetAvg : 1;
    if (upside >= 0.15 && dispersion < 0.3) score += 3;
    else if (upside >= 0.05) score += 2;
    else if (upside >= 0) score += 1;
  } else {
    score += 1.5;
    estimated = true;
  }

  const statChips: StatChipData[] = [
    { label: "Trailing PE", value: r.trailingPE != null ? `${r.trailingPE.toFixed(1)}x` : "n/a" },
    { label: "Own 5-10yr avg PE", value: r.ownHistoricalAvgPE != null ? `${r.ownHistoricalAvgPE.toFixed(1)}x` : "n/a" },
    { label: "Forward PE", value: r.forwardPE != null ? `${r.forwardPE.toFixed(1)}x` : "n/a" },
    { label: "PEG", value: peg != null ? peg.toFixed(2) : "n/a" },
    { label: "EV/EBITDA", value: r.evToEbitda != null ? `${r.evToEbitda.toFixed(1)}x` : "n/a" },
    { label: "DCF margin of safety", value: r.dcfIntrinsicValue != null ? pct((r.dcfIntrinsicValue - r.price) / r.price) : "n/a" }
  ];

  return { id: "B", name: "Valuation", weight: 20, score: clamp(score, 0, 20), statChips, notes, estimated };
}

// ---------------------------------------------------------------------------
// C. Growth & Momentum — 15 points
// ---------------------------------------------------------------------------
export function scoreGrowth(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;
  let estimated = false;

  // Revenue trajectory acceleration (6 pts)
  const delta = r.revenueGrowthYoY - r.revenueGrowthPriorYear;
  if (delta > 0 && r.revenueGrowthYoY > 0.15) score += 6;
  else if (delta > 0) score += 4;
  else if (Math.abs(delta) < 0.02) score += 2.5;
  else score += 1;

  // Guidance trend (5 pts)
  if (r.guidanceTrend === "raised") score += 5;
  else if (r.guidanceTrend === "maintained") score += 3;
  else if (r.guidanceTrend === "cut") score += 0;
  else {
    score += 2.5;
    estimated = true;
    notes.push("Guidance trend could not be confirmed from available data — treated as neutral pending verification.");
  }

  // TAM expansion / backlog / market share (4 pts)
  if (r.backlogGrowthYoY != null) {
    if (r.backlogGrowthYoY >= 0.20) score += 4;
    else if (r.backlogGrowthYoY >= 0) score += 2.5;
    else score += 1;
  } else {
    score += 2;
    estimated = true;
  }
  if (r.tamExpansionNote) notes.push(r.tamExpansionNote);

  const statChips: StatChipData[] = [
    { label: "Rev. growth YoY", value: pct(r.revenueGrowthYoY) },
    { label: "Prior-year growth", value: pct(r.revenueGrowthPriorYear) },
    { label: "Guidance", value: r.guidanceTrend },
    { label: "Backlog growth", value: r.backlogGrowthYoY != null ? pct(r.backlogGrowthYoY) : "n/a" }
  ];

  return { id: "C", name: "Growth & Momentum", weight: 15, score: clamp(score, 0, 15), statChips, notes, estimated };
}

// ---------------------------------------------------------------------------
// D. Competitive Moat — 15 points
// ---------------------------------------------------------------------------
const STRONG_MOAT_KEYWORDS = ["network effect", "switching cost", "intellectual property", "patent", "ecosystem"];
const MODERATE_MOAT_KEYWORDS = ["scale", "cost advantage", "brand"];

export function scoreMoat(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;
  let estimated = false;

  // Gross margin as a pricing-power proxy (6 pts)
  if (r.grossMargin >= 0.50) score += 6;
  else if (r.grossMargin >= 0.35) score += 4;
  else if (r.grossMargin >= 0.20) score += 2;
  else score += 1;
  if (r.grossMarginTrend === "compressing") score = Math.max(0, score - 1);

  // Moat type identified (5 pts)
  const moatLower = (r.moatType ?? "").toLowerCase();
  if (STRONG_MOAT_KEYWORDS.some((k) => moatLower.includes(k))) score += 5;
  else if (MODERATE_MOAT_KEYWORDS.some((k) => moatLower.includes(k))) score += 3.5;
  else if (r.moatType) score += 2.5;
  else {
    score += 1.5;
    estimated = true;
    notes.push("No explicit moat type could be identified from available data — manual review recommended.");
  }

  // Concentration risk deduction (up to -4)
  if (r.concentrationRisk) {
    const severe = /single (customer|supplier)|majority of revenue|>\s?30%/i.test(r.concentrationRisk);
    score -= severe ? 4 : 2;
    notes.push(`Concentration risk deducted as a moat-durability factor: ${r.concentrationRisk}`);
  }

  score = clamp(score, 0, 15);

  // Commodity producers are capped, not merely penalized (methodology 3.D).
  if (r.isCommodityProducer) {
    score = Math.min(score, 6);
    notes.push("Commodity producer: pricing power is structurally capped regardless of operational execution.");
  }

  const statChips: StatChipData[] = [
    { label: "Gross margin", value: pct(r.grossMargin) },
    { label: "Margin trend", value: r.grossMarginTrend },
    { label: "Moat type", value: r.moatType ?? "unidentified" },
    { label: "Commodity producer", value: r.isCommodityProducer ? "yes" : "no" }
  ];

  return { id: "D", name: "Competitive Moat", weight: 15, score, statChips, notes, estimated };
}

// ---------------------------------------------------------------------------
// E. Management & Governance — 10 points
// ---------------------------------------------------------------------------
export function scoreGovernance(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;

  // Insider ownership + transaction direction (4 pts)
  score += r.insiderOwnershipPercent >= 0.05 ? 1.5 : r.insiderOwnershipPercent >= 0.01 ? 1 : 0.5;
  const netInsider = r.insiderBuyValue3mo - r.insiderSellValue3mo;
  const netInsiderPctOfCap = r.marketCap > 0 ? netInsider / r.marketCap : 0;
  if (r.insiderBuyValue3mo === 0 && r.insiderSellValue3mo > 0) {
    const sellPctOfCap = r.marketCap > 0 ? r.insiderSellValue3mo / r.marketCap : 0;
    const penalty = sellPctOfCap > 0.005 ? 2.5 : 1.5;
    notes.push("Insider selling with zero offsetting buying over the trailing 3 months.");
    score += Math.max(0, 2.5 - penalty);
  } else if (netInsiderPctOfCap > 0) {
    score += 2.5;
  } else {
    score += 1.25;
  }

  // Capital allocation discipline: buybacks + dividend sustainability (4 pts)
  if (r.buybackYoY != null && r.buybackYoY > 0) score += 2;
  else if (r.buybackYoY != null) score += 1;
  else score += 1;

  if (r.dividendPayoutRatio == null) {
    score += 2;
  } else if (r.dividendPayoutRatio > 1.0) {
    notes.push(`Dividend payout ratio of ${(r.dividendPayoutRatio * 100).toFixed(0)}% of earnings/FCF is a governance red flag, not an income opportunity.`);
    score += 0;
  } else if (r.dividendPayoutRatio <= 0.75) {
    score += 2;
  } else {
    score += 1;
  }

  // Board continuity (2 pts)
  if (r.boardTransitionNote) {
    notes.push(r.boardTransitionNote);
    score += 1;
  } else {
    score += 2;
  }

  const statChips: StatChipData[] = [
    { label: "Insider ownership", value: pct(r.insiderOwnershipPercent) },
    { label: "Insider buys (3mo)", value: `$${(r.insiderBuyValue3mo / 1_000_000).toFixed(1)}M` },
    { label: "Insider sells (3mo)", value: `$${(r.insiderSellValue3mo / 1_000_000).toFixed(1)}M` },
    { label: "Payout ratio", value: r.dividendPayoutRatio != null ? pct(r.dividendPayoutRatio) : "n/a" }
  ];

  return { id: "E", name: "Management & Governance", weight: 10, score: clamp(score, 0, 10), statChips, notes, estimated: false };
}

// ---------------------------------------------------------------------------
// F. Macro, Sector & Technical — 10 points
// ---------------------------------------------------------------------------
export function scoreTechnical(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 0;
  let estimated = false;

  const range = r.week52High - r.week52Low;
  const position = range > 0 ? (r.price - r.week52Low) / range : 0.5;
  if (position <= 0.6) score += 4;
  else if (position <= 0.85) score += 2.5;
  else score += 1;

  if (r.rsi14 != null && r.ma50 != null && r.ma200 != null) {
    const uptrend = r.price > r.ma50 && r.ma50 > r.ma200;
    const healthyRsi = r.rsi14 >= 40 && r.rsi14 <= 70;
    if (uptrend && healthyRsi) score += 3;
    else if (r.rsi14 > 70 || r.rsi14 < 30) score += 1;
    else score += 2;
  } else {
    score += 1.5;
    estimated = true;
  }

  if (r.beta != null) {
    if (r.beta < 1) score += 3;
    else if (r.beta < 1.3) score += 2;
    else if (r.beta < 1.8) score += 1;
  } else {
    score += 1.5;
    estimated = true;
  }

  if (r.technicalDisagreementNote) {
    notes.push(r.technicalDisagreementNote);
  }

  const statChips: StatChipData[] = [
    { label: "52w range position", value: `${(position * 100).toFixed(0)}%` },
    { label: "RSI(14)", value: r.rsi14 != null ? r.rsi14.toFixed(0) : "n/a" },
    { label: "Beta", value: r.beta != null ? r.beta.toFixed(2) : "n/a" }
  ];

  return { id: "F", name: "Macro, Sector & Technical", weight: 10, score: clamp(score, 0, 10), statChips, notes, estimated };
}

// ---------------------------------------------------------------------------
// G. Risk Factors — 10 points, deductive
// ---------------------------------------------------------------------------
export function scoreRisk(r: RawFinancials): CategoryResult {
  const notes: string[] = [];
  let score = 10;

  if (r.concentrationRisk) {
    const severe = /single (customer|supplier)|majority of revenue|>\s?30%/i.test(r.concentrationRisk);
    const d = severe ? 2 : 1;
    score -= d;
    notes.push(`Customer/geographic concentration (-${d}): ${r.concentrationRisk}`);
  }

  if (r.shortSellerFlag) {
    score -= 2;
    notes.push(`High-profile short-seller thesis (-2): ${r.shortSellerFlag}`);
  }

  if (r.insiderBuyValue3mo === 0 && r.insiderSellValue3mo > 0) {
    const sellPctOfCap = r.marketCap > 0 ? r.insiderSellValue3mo / r.marketCap : 0;
    const d = sellPctOfCap > 0.005 ? 2 : 1;
    score -= d;
    notes.push(`Fresh, unexplained insider selling with no offsetting buys (-${d})`);
  }

  if (r.sectorLeverageMedianDebtToEbitda != null && r.sectorLeverageMedianDebtToEbitda > 0) {
    const ratio = r.debtToEbitda / r.sectorLeverageMedianDebtToEbitda;
    if (ratio > 1.5) {
      score -= 2;
      notes.push("Leverage meaningfully above sector peers (-2)");
    } else if (ratio > 1.2) {
      score -= 1;
      notes.push("Leverage somewhat above sector peers (-1)");
    }
  }

  if (r.recentGuidanceCutOrMiss) {
    const d = r.guidanceTrend === "cut" ? 2 : 1;
    score -= d;
    notes.push(`Recent guidance cut or earnings miss (-${d})`);
  }

  if (r.macroOverhangNote) {
    score -= 1;
    notes.push(`Sector-wide macro overhang (-1): ${r.macroOverhangNote}`);
  }

  const statChips: StatChipData[] = [
    { label: "Concentration risk", value: r.concentrationRisk ? "flagged" : "none" },
    { label: "Short-seller thesis", value: r.shortSellerFlag ? "flagged" : "none" },
    { label: "Leverage vs sector", value: r.sectorLeverageMedianDebtToEbitda != null ? `${r.debtToEbitda.toFixed(1)}x vs ${r.sectorLeverageMedianDebtToEbitda.toFixed(1)}x` : "n/a" }
  ];

  return { id: "G", name: "Risk Factors", weight: 10, score: clamp(score, 0, 10), statChips, notes, estimated: false };
}

export function scoreAllCategories(r: RawFinancials): CategoryResult[] {
  return [
    scoreFinancialHealth(r),
    scoreValuation(r),
    scoreGrowth(r),
    scoreMoat(r),
    scoreGovernance(r),
    scoreTechnical(r),
    scoreRisk(r)
  ];
}
