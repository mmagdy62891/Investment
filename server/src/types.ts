// Shared contract between the data providers, the Mizan scoring engine, and the client UI.
// This file is duplicated (not imported cross-package) at client/src/lib/types.ts — keep both in sync.

export type GateStatus = "PASS" | "CAUTION" | "FAIL";

export type GateId =
  | "shariah"
  | "goingConcern"
  | "accountingIntegrity"
  | "liquidity"
  | "legalRisk"
  | "solvency";

export interface GateResult {
  id: GateId;
  name: string;
  status: GateStatus;
  summary: string;
  detail: string;
  metrics: { label: string; value: string }[];
}

export type CategoryId = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface StatChipData {
  label: string;
  value: string;
}

export interface CategoryResult {
  id: CategoryId;
  name: string;
  weight: number;
  score: number;
  statChips: StatChipData[];
  notes: string[];
  /** true when this sub-score leans on heuristic/judgment inference rather than hard data, per the
   * framework's own practice of flagging low-confidence determinations instead of silently asserting them. */
  estimated: boolean;
}

export type Verdict =
  | "REJECT"
  | "AVOID"
  | "WATCH_HOLD"
  | "BUY_ACCUMULATE"
  | "STRONG_BUY";

export interface PeerRow {
  ticker: string;
  name: string;
  trailingPE: number | null;
  forwardPE: number | null;
  evToEbitda: number | null;
  roe: number | null;
  revenueGrowthYoY: number | null;
  isSubject?: boolean;
}

export interface CalloutData {
  type: "info" | "warning";
  title: string;
  body: string;
}

export interface SellReassessTarget {
  low: number;
  high: number;
  pctFromCurrentLow: number;
  pctFromCurrentHigh: number;
  reason: string;
}

export interface Scorecard {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  price: number;
  currency: string;
  asOf: string;
  dataSource: "live" | "demo";

  gates: GateResult[];
  gatesPassed: boolean;
  failedGateIds: GateId[];

  compositeScore: number;
  categories: CategoryResult[];

  verdict: Verdict;
  verdictColor: string;
  verdictLabel: string;

  peers: PeerRow[];
  sellReassessTarget: SellReassessTarget | null;
  callouts: CalloutData[];
  methodologyNotes: string[];
}

// ---------------------------------------------------------------------------
// Raw financial input model — what a data provider must produce for the
// scoring engine to run. Providers (FMP live, or bundled fixtures) both
// implement this shape.
// ---------------------------------------------------------------------------

export interface RawPeer {
  ticker: string;
  name: string;
  trailingPE: number | null;
  forwardPE: number | null;
  evToEbitda: number | null;
  roe: number | null;
  revenueGrowthYoY: number | null;
}

export interface RawFinancials {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  businessSummary: string;
  price: number;
  currency: string;
  marketCap: number;
  asOf: string;
  isRecentIPO: boolean;

  // --- Shariah gate ---
  interestBearingDebt: number;
  cashAndSTInvestments: number;
  nonCompliantIncome: number;
  totalRevenue: number;

  // --- Going concern ---
  goingConcernFlag: boolean;
  shareholdersEquity: number;
  insolvencyRiskNote: string | null;

  // --- Accounting integrity ---
  activeInvestigation: boolean;
  recentRestatement: boolean;
  auditorResigned: boolean;
  whistleblowerFlag: boolean;

  // --- Liquidity ---
  avgDailyDollarVolume: number;
  publicFloatPercent: number;

  // --- Legal / regulatory ---
  existentialLegalRisk: boolean;
  materialSurvivableLegalRisk: string | null;

  // --- Solvency ---
  currentRatio: number;
  interestCoverage: number;
  operatingCashFlow: number;
  totalDebt: number;

  // --- Category A: Financial Health ---
  revenueGrowthYoY: number;
  revenueGrowthPriorYear: number;
  marginTrend: "expanding" | "stable" | "compressing";
  roe: number;
  roic: number;
  fcfMargin: number;
  debtToEbitda: number;
  isCyclicalPeak: boolean;

  // --- Category B: Valuation ---
  trailingPE: number | null;
  ownHistoricalAvgPE: number | null;
  forwardPE: number | null;
  peerAvgForwardPE: number | null;
  epsGrowthForward: number;
  evToEbitda: number | null;
  peerMedianEvToEbitda: number | null;
  evToFcf: number | null;
  peerMedianEvToFcf: number | null;
  dcfIntrinsicValue: number | null;
  analystTargetLow: number | null;
  analystTargetHigh: number | null;
  analystTargetAvg: number | null;

  // --- Category C: Growth ---
  guidanceTrend: "raised" | "maintained" | "cut" | "unknown";
  tamExpansionNote: string | null;
  backlogGrowthYoY: number | null;

  // --- Category D: Moat ---
  moatType: string | null;
  grossMargin: number;
  grossMarginTrend: "expanding" | "stable" | "compressing";
  isCommodityProducer: boolean;
  concentrationRisk: string | null;

  // --- Category E: Governance ---
  insiderOwnershipPercent: number;
  insiderBuyValue3mo: number;
  insiderSellValue3mo: number;
  dividendPayoutRatio: number | null;
  buybackYoY: number | null;
  boardTransitionNote: string | null;

  // --- Category F: Macro/Technical ---
  week52High: number;
  week52Low: number;
  rsi14: number | null;
  ma50: number | null;
  ma200: number | null;
  beta: number | null;
  technicalDisagreementNote: string | null;

  // --- Category G: Risk (additional signals not already covered above) ---
  shortSellerFlag: string | null;
  recentGuidanceCutOrMiss: boolean;
  sectorLeverageMedianDebtToEbitda: number | null;
  macroOverhangNote: string | null;

  peers: RawPeer[];

  priceStalenessNote: string | null;

  /** false for the live FMP provider: several qualitative inputs (going-concern qualifications,
   * active investigations, existential legal risk, short-seller theses, moat narrative, board
   * continuity) have no reliable free structured-data source and are defaulted rather than
   * researched. Demo fixtures set this true because those facts were hand-curated from public
   * record. Consumers should surface this distinction rather than assert false confidence. */
  qualitativeDataVerified: boolean;
}
