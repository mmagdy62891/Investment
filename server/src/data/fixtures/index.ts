import type { RawFinancials } from "../../types.js";

// Hand-curated, illustrative demo data — NOT a live feed. Figures are approximate and dated
// to give the "no FMP_API_KEY configured" experience something real to render against, and to
// exercise the PASS / CAUTION / FAIL paths described in the methodology (including the two
// named precedent cases from the source document: Pfizer's ratio-based Shariah failure and
// Lockheed Martin's business-activity failure).

const NOW = new Date().toISOString();

const AAPL: RawFinancials = {
  ticker: "AAPL",
  companyName: "Apple Inc.",
  sector: "Technology",
  industry: "Consumer Electronics",
  businessSummary: "Designs, manufactures, and markets smartphones, personal computers, wearables, and services.",
  price: 195,
  currency: "USD",
  marketCap: 3_020_000_000_000,
  asOf: NOW,
  isRecentIPO: false,

  interestBearingDebt: 104_000_000_000,
  cashAndSTInvestments: 65_000_000_000,
  nonCompliantIncome: 0,
  totalRevenue: 383_000_000_000,

  goingConcernFlag: false,
  shareholdersEquity: 62_000_000_000,
  insolvencyRiskNote: null,

  activeInvestigation: false,
  recentRestatement: false,
  auditorResigned: false,
  whistleblowerFlag: false,

  avgDailyDollarVolume: 5_800_000_000,
  publicFloatPercent: 0.999,

  existentialLegalRisk: false,
  materialSurvivableLegalRisk: "Ongoing EU DMA / antitrust proceedings — material but survivable for a profitable mega-cap.",

  currentRatio: 0.98,
  interestCoverage: 29,
  operatingCashFlow: 110_000_000_000,
  totalDebt: 104_000_000_000,

  revenueGrowthYoY: 0.02,
  revenueGrowthPriorYear: -0.03,
  marginTrend: "stable",
  roe: 1.50,
  roic: 0.40,
  fcfMargin: 0.26,
  debtToEbitda: 0.8,
  isCyclicalPeak: false,

  trailingPE: 31.2,
  ownHistoricalAvgPE: 26.5,
  forwardPE: 28.4,
  peerAvgForwardPE: 30.1,
  epsGrowthForward: 0.08,
  evToEbitda: 24.0,
  peerMedianEvToEbitda: 22.5,
  evToFcf: 30.5,
  peerMedianEvToFcf: 28.0,
  dcfIntrinsicValue: 178,
  analystTargetLow: 170,
  analystTargetHigh: 250,
  analystTargetAvg: 210,

  guidanceTrend: "maintained",
  tamExpansionNote: "Services segment continues to expand TAM beyond hardware, though growth has decelerated from prior years.",
  backlogGrowthYoY: null,

  moatType: "network effects, switching costs, ecosystem lock-in",
  grossMargin: 0.46,
  grossMarginTrend: "stable",
  isCommodityProducer: false,
  concentrationRisk: "Meaningful revenue and manufacturing concentration in Greater China.",

  insiderOwnershipPercent: 0.0007,
  insiderBuyValue3mo: 0,
  insiderSellValue3mo: 150_000_000,
  dividendPayoutRatio: 0.16,
  buybackYoY: 0.05,
  boardTransitionNote: null,

  week52High: 260,
  week52Low: 164,
  rsi14: 55,
  ma50: 200,
  ma200: 190,
  beta: 1.20,
  technicalDisagreementNote: null,

  shortSellerFlag: null,
  recentGuidanceCutOrMiss: false,
  sectorLeverageMedianDebtToEbitda: 1.0,
  macroOverhangNote: null,

  peers: [
    { ticker: "MSFT", name: "Microsoft Corp.", trailingPE: 35.0, forwardPE: 30.5, evToEbitda: 23.0, roe: 0.38, revenueGrowthYoY: 0.15 },
    { ticker: "GOOGL", name: "Alphabet Inc.", trailingPE: 24.0, forwardPE: 21.5, evToEbitda: 16.0, roe: 0.30, revenueGrowthYoY: 0.13 }
  ],
  priceStalenessNote: null,
  qualitativeDataVerified: true
};

const MSFT: RawFinancials = {
  ticker: "MSFT",
  companyName: "Microsoft Corporation",
  sector: "Technology",
  industry: "Software—Infrastructure",
  businessSummary: "Develops and licenses software, services, devices, and cloud infrastructure (Azure) worldwide.",
  price: 420,
  currency: "USD",
  marketCap: 3_120_000_000_000,
  asOf: NOW,
  isRecentIPO: false,

  interestBearingDebt: 43_000_000_000,
  cashAndSTInvestments: 75_000_000_000,
  nonCompliantIncome: 0,
  totalRevenue: 245_000_000_000,

  goingConcernFlag: false,
  shareholdersEquity: 206_000_000_000,
  insolvencyRiskNote: null,

  activeInvestigation: false,
  recentRestatement: false,
  auditorResigned: false,
  whistleblowerFlag: false,

  avgDailyDollarVolume: 3_500_000_000,
  publicFloatPercent: 0.999,

  existentialLegalRisk: false,
  materialSurvivableLegalRisk: "Ongoing antitrust scrutiny of cloud/AI bundling practices in the EU and US — survivable given diversified revenue.",

  currentRatio: 1.3,
  interestCoverage: 45,
  operatingCashFlow: 105_000_000_000,
  totalDebt: 43_000_000_000,

  revenueGrowthYoY: 0.15,
  revenueGrowthPriorYear: 0.12,
  marginTrend: "expanding",
  roe: 0.38,
  roic: 0.28,
  fcfMargin: 0.30,
  debtToEbitda: 0.35,
  isCyclicalPeak: false,

  trailingPE: 35.0,
  ownHistoricalAvgPE: 32.0,
  forwardPE: 30.5,
  peerAvgForwardPE: 29.0,
  epsGrowthForward: 0.14,
  evToEbitda: 23.0,
  peerMedianEvToEbitda: 24.0,
  evToFcf: 33.0,
  peerMedianEvToFcf: 34.0,
  dcfIntrinsicValue: 455,
  analystTargetLow: 400,
  analystTargetHigh: 520,
  analystTargetAvg: 470,

  guidanceTrend: "raised",
  tamExpansionNote: "Azure and Copilot-driven AI services continue expanding addressable market with strong bookings growth.",
  backlogGrowthYoY: 0.25,

  moatType: "switching costs, network effects, scale",
  grossMargin: 0.69,
  grossMarginTrend: "stable",
  isCommodityProducer: false,
  concentrationRisk: null,

  insiderOwnershipPercent: 0.0004,
  insiderBuyValue3mo: 2_000_000,
  insiderSellValue3mo: 40_000_000,
  dividendPayoutRatio: 0.25,
  buybackYoY: 0.03,
  boardTransitionNote: null,

  week52High: 470,
  week52Low: 385,
  rsi14: 58,
  ma50: 425,
  ma200: 410,
  beta: 0.90,
  technicalDisagreementNote: null,

  shortSellerFlag: null,
  recentGuidanceCutOrMiss: false,
  sectorLeverageMedianDebtToEbitda: 1.0,
  macroOverhangNote: "Sector-wide skepticism about near-term ROI on AI capex.",

  peers: [
    { ticker: "GOOGL", name: "Alphabet Inc.", trailingPE: 24.0, forwardPE: 21.5, evToEbitda: 16.0, roe: 0.30, revenueGrowthYoY: 0.13 },
    { ticker: "AMZN", name: "Amazon.com Inc.", trailingPE: 40.0, forwardPE: 32.0, evToEbitda: 18.0, roe: 0.22, revenueGrowthYoY: 0.11 }
  ],
  priceStalenessNote: null,
  qualitativeDataVerified: true
};

const TSLA: RawFinancials = {
  ticker: "TSLA",
  companyName: "Tesla, Inc.",
  sector: "Consumer Cyclical",
  industry: "Auto Manufacturers",
  businessSummary: "Designs, manufactures, and sells electric vehicles, energy generation, and storage systems.",
  price: 250,
  currency: "USD",
  marketCap: 800_000_000_000,
  asOf: NOW,
  isRecentIPO: false,

  interestBearingDebt: 5_000_000_000,
  cashAndSTInvestments: 29_000_000_000,
  nonCompliantIncome: 0,
  totalRevenue: 96_000_000_000,

  goingConcernFlag: false,
  shareholdersEquity: 73_000_000_000,
  insolvencyRiskNote: null,

  activeInvestigation: false,
  recentRestatement: false,
  auditorResigned: false,
  whistleblowerFlag: false,

  avgDailyDollarVolume: 8_000_000_000,
  publicFloatPercent: 0.85,

  existentialLegalRisk: false,
  materialSurvivableLegalRisk: "NHTSA Autopilot/FSD investigations ongoing — regulatory overhang, not existential.",

  currentRatio: 2.0,
  interestCoverage: 15,
  operatingCashFlow: 13_000_000_000,
  totalDebt: 5_000_000_000,

  revenueGrowthYoY: 0.01,
  revenueGrowthPriorYear: 0.19,
  marginTrend: "compressing",
  roe: 0.10,
  roic: 0.07,
  fcfMargin: 0.03,
  debtToEbitda: 0.4,
  isCyclicalPeak: false,

  trailingPE: 68.0,
  ownHistoricalAvgPE: 90.0,
  forwardPE: 60.0,
  peerAvgForwardPE: 12.0,
  epsGrowthForward: 0.15,
  evToEbitda: 40.0,
  peerMedianEvToEbitda: 9.0,
  evToFcf: 65.0,
  peerMedianEvToFcf: 15.0,
  dcfIntrinsicValue: 140,
  analystTargetLow: 90,
  analystTargetHigh: 310,
  analystTargetAvg: 190,

  guidanceTrend: "cut",
  tamExpansionNote: "Energy storage (Megapack) TAM expanding, but core EV delivery growth has stalled against rising competition.",
  backlogGrowthYoY: -0.05,

  moatType: "brand, scale in EV manufacturing",
  grossMargin: 0.18,
  grossMarginTrend: "compressing",
  isCommodityProducer: false,
  concentrationRisk: "Revenue concentrated in EV segment amid intensifying Chinese EV-maker price competition.",

  insiderOwnershipPercent: 0.13,
  insiderBuyValue3mo: 0,
  insiderSellValue3mo: 500_000_000,
  dividendPayoutRatio: null,
  buybackYoY: null,
  boardTransitionNote: "CEO attention split across multiple ventures; governance independence has drawn shareholder criticism.",

  week52High: 300,
  week52Low: 140,
  rsi14: 62,
  ma50: 240,
  ma200: 220,
  beta: 2.30,
  technicalDisagreementNote: "RSI and moving averages disagree on trend strength across common data sources for this fast-moving name.",

  shortSellerFlag: "Multiple public short theses citing demand plateau and margin compression from price cuts.",
  recentGuidanceCutOrMiss: true,
  sectorLeverageMedianDebtToEbitda: 1.2,
  macroOverhangNote: "EV demand growth deceleration across the sector, plus EV tax-credit policy uncertainty.",

  peers: [
    { ticker: "TM", name: "Toyota Motor Corp.", trailingPE: 9.5, forwardPE: 9.0, evToEbitda: 8.0, roe: 0.11, revenueGrowthYoY: 0.06 },
    { ticker: "GM", name: "General Motors Co.", trailingPE: 5.5, forwardPE: 5.2, evToEbitda: 6.5, roe: 0.20, revenueGrowthYoY: 0.03 }
  ],
  priceStalenessNote: null,
  qualitativeDataVerified: true
};

// Precedent case from the methodology document: fails the Shariah gate purely on the
// AAOIFI debt-to-market-cap ratio (46.7%), despite pharmaceuticals being a permissible activity.
const PFE: RawFinancials = {
  ticker: "PFE",
  companyName: "Pfizer Inc.",
  sector: "Healthcare",
  industry: "Drug Manufacturers—General",
  businessSummary: "Discovers, develops, manufactures, and sells biopharmaceutical products worldwide.",
  price: 25,
  currency: "USD",
  marketCap: 141_000_000_000,
  asOf: NOW,
  isRecentIPO: false,

  interestBearingDebt: 65_900_000_000,
  cashAndSTInvestments: 15_000_000_000,
  nonCompliantIncome: 0,
  totalRevenue: 58_500_000_000,

  goingConcernFlag: false,
  shareholdersEquity: 66_000_000_000,
  insolvencyRiskNote: null,

  activeInvestigation: false,
  recentRestatement: false,
  auditorResigned: false,
  whistleblowerFlag: false,

  avgDailyDollarVolume: 700_000_000,
  publicFloatPercent: 0.998,

  existentialLegalRisk: false,
  materialSurvivableLegalRisk: "Various product-liability litigation, provisioned for and survivable.",

  currentRatio: 1.1,
  interestCoverage: 4.5,
  operatingCashFlow: 12_000_000_000,
  totalDebt: 65_900_000_000,

  revenueGrowthYoY: -0.42,
  revenueGrowthPriorYear: -0.02,
  marginTrend: "compressing",
  roe: 0.09,
  roic: 0.05,
  fcfMargin: 0.15,
  debtToEbitda: 3.8,
  isCyclicalPeak: false,

  trailingPE: 14.5,
  ownHistoricalAvgPE: 13.0,
  forwardPE: 11.0,
  peerAvgForwardPE: 15.0,
  epsGrowthForward: 0.06,
  evToEbitda: 10.5,
  peerMedianEvToEbitda: 12.0,
  evToFcf: 14.0,
  peerMedianEvToFcf: 16.0,
  dcfIntrinsicValue: 27,
  analystTargetLow: 22,
  analystTargetHigh: 34,
  analystTargetAvg: 28,

  guidanceTrend: "maintained",
  tamExpansionNote: "Post-COVID revenue normalization; oncology pipeline (Seagen) is the primary growth lever.",
  backlogGrowthYoY: null,

  moatType: "intellectual property (patents), regulatory scale",
  grossMargin: 0.62,
  grossMarginTrend: "compressing",
  isCommodityProducer: false,
  concentrationRisk: "Revenue reliance on a shrinking COVID-19 vaccine/treatment franchise.",

  insiderOwnershipPercent: 0.003,
  insiderBuyValue3mo: 0,
  insiderSellValue3mo: 8_000_000,
  dividendPayoutRatio: 1.35,
  buybackYoY: -0.02,
  boardTransitionNote: null,

  week52High: 31,
  week52Low: 24,
  rsi14: 45,
  ma50: 26,
  ma200: 27,
  beta: 0.55,
  technicalDisagreementNote: null,

  shortSellerFlag: null,
  recentGuidanceCutOrMiss: false,
  sectorLeverageMedianDebtToEbitda: 2.2,
  macroOverhangNote: null,

  peers: [
    { ticker: "MRK", name: "Merck & Co.", trailingPE: 15.5, forwardPE: 13.0, evToEbitda: 11.0, roe: 0.28, revenueGrowthYoY: 0.04 },
    { ticker: "BMY", name: "Bristol-Myers Squibb", trailingPE: 12.0, forwardPE: 8.5, evToEbitda: 9.0, roe: 0.10, revenueGrowthYoY: -0.03 }
  ],
  priceStalenessNote: null,
  qualitativeDataVerified: true
};

// Precedent case from the methodology document: fails the Shariah gate purely on business
// activity (weapons manufacturing), independent of financial ratios — financial profile is
// otherwise strong, shown here for informational completeness per methodology section 6.6.
const LMT: RawFinancials = {
  ticker: "LMT",
  companyName: "Lockheed Martin Corporation",
  sector: "Industrials",
  industry: "Aerospace & Defense",
  businessSummary: "Researches, designs, develops, manufactures, and integrates advanced technology systems, products, and services including combat aircraft and missile systems.",
  price: 470,
  currency: "USD",
  marketCap: 112_000_000_000,
  asOf: NOW,
  isRecentIPO: false,

  interestBearingDebt: 19_000_000_000,
  cashAndSTInvestments: 2_500_000_000,
  nonCompliantIncome: 0,
  totalRevenue: 71_000_000_000,

  goingConcernFlag: false,
  shareholdersEquity: 5_000_000_000,
  insolvencyRiskNote: null,

  activeInvestigation: false,
  recentRestatement: false,
  auditorResigned: false,
  whistleblowerFlag: false,

  avgDailyDollarVolume: 300_000_000,
  publicFloatPercent: 0.997,

  existentialLegalRisk: false,
  materialSurvivableLegalRisk: null,

  currentRatio: 1.15,
  interestCoverage: 12,
  operatingCashFlow: 7_500_000_000,
  totalDebt: 19_000_000_000,

  revenueGrowthYoY: 0.08,
  revenueGrowthPriorYear: 0.02,
  marginTrend: "stable",
  roe: 0.85,
  roic: 0.22,
  fcfMargin: 0.09,
  debtToEbitda: 2.0,
  isCyclicalPeak: false,

  trailingPE: 20.0,
  ownHistoricalAvgPE: 17.0,
  forwardPE: 18.5,
  peerAvgForwardPE: 19.0,
  epsGrowthForward: 0.09,
  evToEbitda: 13.5,
  peerMedianEvToEbitda: 13.0,
  evToFcf: 22.0,
  peerMedianEvToFcf: 23.0,
  dcfIntrinsicValue: 500,
  analystTargetLow: 430,
  analystTargetHigh: 560,
  analystTargetAvg: 500,

  guidanceTrend: "raised",
  tamExpansionNote: "Elevated global defense spending amid geopolitical tensions is expanding order backlog.",
  backlogGrowthYoY: 0.06,

  moatType: "regulatory scale, IP, government relationships",
  grossMargin: 0.12,
  grossMarginTrend: "stable",
  isCommodityProducer: false,
  concentrationRisk: "Revenue heavily concentrated in U.S. government / DoD contracts.",

  insiderOwnershipPercent: 0.002,
  insiderBuyValue3mo: 0,
  insiderSellValue3mo: 5_000_000,
  dividendPayoutRatio: 0.45,
  buybackYoY: 0.04,
  boardTransitionNote: null,

  week52High: 520,
  week52Low: 380,
  rsi14: 50,
  ma50: 480,
  ma200: 460,
  beta: 0.65,
  technicalDisagreementNote: null,

  shortSellerFlag: null,
  recentGuidanceCutOrMiss: false,
  sectorLeverageMedianDebtToEbitda: 1.8,
  macroOverhangNote: null,

  peers: [
    { ticker: "RTX", name: "RTX Corporation", trailingPE: 22.0, forwardPE: 19.5, evToEbitda: 14.0, roe: 0.12, revenueGrowthYoY: 0.09 },
    { ticker: "NOC", name: "Northrop Grumman", trailingPE: 18.0, forwardPE: 17.0, evToEbitda: 12.5, roe: 0.30, revenueGrowthYoY: 0.05 }
  ],
  priceStalenessNote: null,
  qualitativeDataVerified: true
};

const FIXTURES: Record<string, RawFinancials> = {
  AAPL,
  MSFT,
  TSLA,
  PFE,
  LMT
};

export const DEMO_TICKERS = Object.keys(FIXTURES);

export function getFixture(ticker: string): RawFinancials | null {
  return FIXTURES[ticker.toUpperCase().trim()] ?? null;
}
