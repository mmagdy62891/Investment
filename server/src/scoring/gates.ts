import type { GateResult, GateId, RawFinancials } from "../types.js";
import { scoreShariahGate } from "./shariah.js";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function unverifiedSuffix(r: RawFinancials): string {
  return r.qualitativeDataVerified
    ? ""
    : " (Not independently researched from structured data — defaulted to no-flag pending manual verification.)";
}

function scoreGoingConcernGate(r: RawFinancials): GateResult {
  if (r.goingConcernFlag || r.shareholdersEquity < 0) {
    return {
      id: "goingConcern",
      name: "Going-Concern Risk",
      status: "FAIL",
      summary: "Auditor going-concern qualification or negative equity.",
      detail: r.insolvencyRiskNote ?? "Negative shareholder equity or an active going-concern qualification indicates survival risk.",
      metrics: [{ label: "Shareholders' equity", value: r.shareholdersEquity.toLocaleString() }]
    };
  }
  if (r.insolvencyRiskNote) {
    return {
      id: "goingConcern",
      name: "Going-Concern Risk",
      status: "CAUTION",
      summary: "Covenant or liquidity risk flagged, short of a formal qualification.",
      detail: r.insolvencyRiskNote,
      metrics: [{ label: "Shareholders' equity", value: r.shareholdersEquity.toLocaleString() }]
    };
  }
  return {
    id: "goingConcern",
    name: "Going-Concern Risk",
    status: "PASS",
    summary: "No going-concern qualification, negative equity, or imminent insolvency risk.",
    detail: `The gate concerns survival risk, not profitability — an unprofitable but well-capitalized company can still pass.${unverifiedSuffix(r)}`,
    metrics: [{ label: "Shareholders' equity", value: r.shareholdersEquity.toLocaleString() }]
  };
}

function scoreAccountingIntegrityGate(r: RawFinancials): GateResult {
  if (r.activeInvestigation || r.recentRestatement || r.auditorResigned || r.whistleblowerFlag) {
    const reasons = [
      r.activeInvestigation && "active regulatory investigation",
      r.recentRestatement && "recent restatement",
      r.auditorResigned && "auditor resignation",
      r.whistleblowerFlag && "credible whistleblower allegation"
    ].filter(Boolean);
    return {
      id: "accountingIntegrity",
      name: "Accounting Integrity",
      status: "FAIL",
      summary: `Flagged: ${reasons.join(", ")}.`,
      detail: "One or more integrity red flags were found in the underlying filings/news record.",
      metrics: []
    };
  }
  if (r.isRecentIPO) {
    return {
      id: "accountingIntegrity",
      name: "Accounting Integrity",
      status: "CAUTION",
      summary: "No post-IPO earnings history to verify against.",
      detail: "Newly-public companies are marked CAUTION rather than a clean PASS since there is no track record to verify integrity against.",
      metrics: []
    };
  }
  return {
    id: "accountingIntegrity",
    name: "Accounting Integrity",
    status: "PASS",
    summary: "No active investigations, restatements, or credible fraud allegations.",
    detail: `Filings and audit history show no integrity red flags.${unverifiedSuffix(r)}`,
    metrics: []
  };
}

function scoreLiquidityGate(r: RawFinancials): GateResult {
  const metrics = [
    { label: "Avg. $ volume/day", value: `$${(r.avgDailyDollarVolume / 1_000_000).toFixed(1)}M` },
    { label: "Public float", value: pct(r.publicFloatPercent) }
  ];
  if (r.avgDailyDollarVolume < 200_000) {
    return {
      id: "liquidity",
      name: "Liquidity Floor",
      status: "FAIL",
      summary: "Average daily dollar volume too thin for practical entry/exit.",
      detail: "Trading volume is insufficient to enter or exit a meaningful position without significant slippage.",
      metrics
    };
  }
  if (r.publicFloatPercent < 0.10 || r.avgDailyDollarVolume < 1_000_000) {
    return {
      id: "liquidity",
      name: "Liquidity Floor",
      status: "CAUTION",
      summary: `Only ~${(r.publicFloatPercent * 100).toFixed(0)}% public float — elevated gap risk.`,
      detail: "Float concentration creates gap risk beyond normal liquidity concerns, even when raw dollar volume looks adequate.",
      metrics
    };
  }
  return {
    id: "liquidity",
    name: "Liquidity Floor",
    status: "PASS",
    summary: "Sufficient average daily volume and float for practical entry/exit.",
    detail: "No material slippage or float-concentration risk detected.",
    metrics
  };
}

function scoreLegalRiskGate(r: RawFinancials): GateResult {
  if (r.existentialLegalRisk) {
    return {
      id: "legalRisk",
      name: "Legal / Regulatory Risk",
      status: "FAIL",
      summary: "Litigation or regulatory action could plausibly bankrupt the company or force delisting.",
      detail: r.materialSurvivableLegalRisk ?? "Existential legal/regulatory risk identified.",
      metrics: []
    };
  }
  if (r.materialSurvivableLegalRisk) {
    return {
      id: "legalRisk",
      name: "Legal / Regulatory Risk",
      status: "CAUTION",
      summary: "Material but survivable legal exposure noted; also weighted in Risk Factors.",
      detail: r.materialSurvivableLegalRisk,
      metrics: []
    };
  }
  return {
    id: "legalRisk",
    name: "Legal / Regulatory Risk",
    status: "PASS",
    summary: "No existential litigation, sanctions, or regulatory action identified.",
    detail: `This gate only checks for existential risk; material-but-survivable litigation passes here and is weighted in Category G instead.${unverifiedSuffix(r)}`,
    metrics: []
  };
}

function scoreSolvencyGate(r: RawFinancials): GateResult {
  const ocfToDebt = r.totalDebt > 0 ? r.operatingCashFlow / r.totalDebt : Infinity;
  const metrics = [
    { label: "Current ratio", value: r.currentRatio.toFixed(2) },
    { label: "Interest coverage", value: `${r.interestCoverage.toFixed(1)}x` },
    { label: "OCF / total debt", value: pct(Math.max(0, ocfToDebt)) }
  ];
  if (r.currentRatio < 0.75 || r.interestCoverage < 1) {
    return {
      id: "solvency",
      name: "Solvency Minimum",
      status: "FAIL",
      summary: "Current ratio or interest coverage indicates inability to service near-term obligations.",
      detail: "The company does not appear able to meet near-term obligations from current resources.",
      metrics
    };
  }
  if (ocfToDebt < 0.20 || r.currentRatio < 1) {
    return {
      id: "solvency",
      name: "Solvency Minimum",
      status: "CAUTION",
      summary: "Weak debt coverage even though the current ratio looks acceptable.",
      detail: `Operating cash flow covers ${(ocfToDebt * 100).toFixed(0)}% of total debt — flagged even though headline solvency ratios look adequate.`,
      metrics
    };
  }
  return {
    id: "solvency",
    name: "Solvency Minimum",
    status: "PASS",
    summary: "Adequate current ratio, interest coverage, and debt service capacity.",
    detail: "No near-term solvency concerns identified.",
    metrics
  };
}

export function scoreAllGates(r: RawFinancials): GateResult[] {
  return [
    scoreShariahGate(r),
    scoreGoingConcernGate(r),
    scoreAccountingIntegrityGate(r),
    scoreLiquidityGate(r),
    scoreLegalRiskGate(r),
    scoreSolvencyGate(r)
  ];
}

export function failedGates(gates: GateResult[]): GateId[] {
  return gates.filter((g) => g.status === "FAIL").map((g) => g.id);
}
