import type { RawFinancials, RawPeer } from "../types.js";

const V3 = "https://financialmodelingprep.com/api/v3";
const V4 = "https://financialmodelingprep.com/api/v4";

async function fmpGet<T = unknown>(base: string, path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;
  const qs = new URLSearchParams({ ...toStringRecord(params), apikey: apiKey });
  const url = `${base}${path}?${qs.toString()}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toStringRecord(params: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) out[k] = String(v);
  return out;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeDiv(a: number, b: number): number | null {
  return b ? a / b : null;
}

export function isFmpConfigured(): boolean {
  return Boolean(process.env.FMP_API_KEY);
}

const COMMODITY_INDUSTRY_KEYWORDS = [
  "oil & gas e&p",
  "oil & gas",
  "coal",
  "copper",
  "gold",
  "silver",
  "steel",
  "aluminum",
  "other industrial metals",
  "agricultural inputs"
];

export async function fetchRawFinancials(ticker: string): Promise<RawFinancials | null> {
  const symbol = ticker.toUpperCase().trim();

  const [profileArr, quoteArr, ratiosArr, keyMetricsArr, incomeArr, cashFlowArr, balanceArr] = await Promise.all([
    fmpGet<any[]>(V3, `/profile/${symbol}`),
    fmpGet<any[]>(V3, `/quote/${symbol}`),
    fmpGet<any[]>(V3, `/ratios/${symbol}`, { period: "annual", limit: 10 }),
    fmpGet<any[]>(V3, `/key-metrics/${symbol}`, { period: "annual", limit: 5 }),
    fmpGet<any[]>(V3, `/income-statement/${symbol}`, { period: "annual", limit: 3 }),
    fmpGet<any[]>(V3, `/cash-flow-statement/${symbol}`, { period: "annual", limit: 2 }),
    fmpGet<any[]>(V3, `/balance-sheet-statement/${symbol}`, { period: "annual", limit: 1 })
  ]);

  const profile = profileArr?.[0];
  const quote = quoteArr?.[0];
  if (!profile || !quote) return null;

  const [dcfRes, priceTargetRes, insiderRes, peersRes, floatRes] = await Promise.all([
    fmpGet<any[]>(V3, `/discounted-cash-flow/${symbol}`),
    fmpGet<any[]>(V4, `/price-target-consensus`, { symbol }),
    fmpGet<any[]>(V4, `/insider-trading`, { symbol, limit: 100 }),
    fmpGet<any[]>(V4, `/stock_peers`, { symbol }),
    fmpGet<any[]>(V4, `/shares_float`, { symbol })
  ]);

  const ratios = ratiosArr ?? [];
  const latestRatios = ratios[0] ?? {};
  const keyMetrics = keyMetricsArr ?? [];
  const latestKeyMetrics = keyMetrics[0] ?? {};
  const income = incomeArr ?? [];
  const latestIncome = income[0] ?? {};
  const priorIncome = income[1] ?? {};
  const cashFlow = cashFlowArr ?? [];
  const latestCashFlow = cashFlow[0] ?? {};
  const balance = balanceArr?.[0] ?? {};

  const revenue = num(latestIncome.revenue);
  const priorRevenue = num(priorIncome.revenue);
  const revenueGrowthYoY = safeDiv(revenue - priorRevenue, priorRevenue) ?? 0;
  const twoAgoIncome = income[2] ?? {};
  const revenueGrowthPriorYear = safeDiv(priorRevenue - num(twoAgoIncome.revenue), num(twoAgoIncome.revenue)) ?? 0;

  const grossMarginLatest = num(latestIncome.grossProfitRatio);
  const grossMarginPrior = num(priorIncome.grossProfitRatio, grossMarginLatest);
  const marginDelta = grossMarginLatest - grossMarginPrior;
  const marginTrend: RawFinancials["marginTrend"] = marginDelta > 0.01 ? "expanding" : marginDelta < -0.01 ? "compressing" : "stable";

  const freeCashFlow = num(latestCashFlow.freeCashFlow);
  const fcfMargin = safeDiv(freeCashFlow, revenue) ?? 0;

  const ebitda = num(latestIncome.ebitda);
  const totalDebt = num(balance.totalDebt, num(balance.shortTermDebt) + num(balance.longTermDebt));
  const debtToEbitda = ebitda > 0 ? totalDebt / ebitda : 0;
  const interestExpense = Math.abs(num(latestIncome.interestExpense));
  const interestCoverage = interestExpense > 0 ? num(latestIncome.operatingIncome) / interestExpense : 99;

  const marketCap = num(profile.mktCap, num(quote.marketCap));
  const cashAndSTInvestments = num(balance.cashAndShortTermInvestments);

  const trailingPE = quote.pe != null ? num(quote.pe) : null;
  const historicalPEs = ratios.map((r) => num(r.priceEarningsRatio)).filter((v) => v > 0 && v < 300);
  const ownHistoricalAvgPE = historicalPEs.length ? historicalPEs.reduce((a, b) => a + b, 0) / historicalPEs.length : null;

  const epsGrowthForward = safeDiv(num(latestIncome.eps) - num(priorIncome.eps), Math.abs(num(priorIncome.eps)) || 1) ?? 0.1;
  const forwardPE = trailingPE != null && epsGrowthForward > -0.9 ? trailingPE / (1 + Math.max(epsGrowthForward, 0.01)) : trailingPE;

  const dcf = dcfRes?.[0];
  const priceTarget = priceTargetRes?.[0];

  const insiderTrades: any[] = insiderRes ?? [];
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let insiderBuyValue3mo = 0;
  let insiderSellValue3mo = 0;
  for (const t of insiderTrades) {
    const date = new Date(t.transactionDate ?? t.filingDate ?? 0).getTime();
    if (date < threeMonthsAgo) continue;
    const value = Math.abs(num(t.securitiesTransacted) * num(t.price));
    const type = String(t.transactionType ?? "").toUpperCase();
    if (type.includes("P-") || type.includes("PURCHASE") || type.includes("BUY")) insiderBuyValue3mo += value;
    if (type.includes("S-") || type.includes("SALE") || type.includes("SELL")) insiderSellValue3mo += value;
  }

  const peerTickers: string[] = (peersRes?.[0]?.peersList ?? []).slice(0, 3);
  const peerQuotes = peerTickers.length ? await fmpGet<any[]>(V3, `/quote/${peerTickers.join(",")}`) : [];
  const peers: RawPeer[] = (peerQuotes ?? []).map((p) => ({
    ticker: p.symbol,
    name: p.name ?? p.symbol,
    trailingPE: p.pe != null ? num(p.pe) : null,
    forwardPE: p.pe != null ? num(p.pe) : null,
    evToEbitda: null,
    roe: null,
    revenueGrowthYoY: null
  }));
  const peerAvgForwardPE = peers.length
    ? peers.reduce((sum, p) => sum + (p.forwardPE ?? 0), 0) / peers.filter((p) => p.forwardPE != null).length || null
    : null;

  const evToEbitda = num(latestKeyMetrics.enterpriseValueOverEBITDA) || null;
  const evToFcf = latestKeyMetrics.evToFreeCashFlow != null ? num(latestKeyMetrics.evToFreeCashFlow) : null;

  const industryLower = String(profile.industry ?? "").toLowerCase();
  const isCommodityProducer = COMMODITY_INDUSTRY_KEYWORDS.some((k) => industryLower.includes(k));

  const avgDailyDollarVolume = num(quote.avgVolume) * num(quote.price);
  const floatData = floatRes?.[0];
  const publicFloatPercent = floatData ? safeDiv(num(floatData.floatShares), num(floatData.outstandingShares)) ?? 0.5 : 0.5;

  const currentRatio = num(latestRatios.currentRatio, 1);
  const operatingCashFlow = num(latestCashFlow.operatingCashFlow);

  const ipoDate = profile.ipoDate ? new Date(profile.ipoDate) : null;
  const isRecentIPO = ipoDate ? Date.now() - ipoDate.getTime() < 365 * 24 * 60 * 60 * 1000 : false;

  const raw: RawFinancials = {
    ticker: symbol,
    companyName: profile.companyName ?? symbol,
    sector: profile.sector ?? "Unknown",
    industry: profile.industry ?? "Unknown",
    businessSummary: profile.description ?? "",
    price: num(quote.price),
    currency: profile.currency ?? "USD",
    marketCap,
    asOf: new Date().toISOString(),
    isRecentIPO,

    interestBearingDebt: totalDebt,
    cashAndSTInvestments,
    nonCompliantIncome: 0,
    totalRevenue: revenue,

    goingConcernFlag: false,
    shareholdersEquity: num(balance.totalStockholdersEquity),
    insolvencyRiskNote: null,

    activeInvestigation: false,
    recentRestatement: false,
    auditorResigned: false,
    whistleblowerFlag: false,

    avgDailyDollarVolume,
    publicFloatPercent,

    existentialLegalRisk: false,
    materialSurvivableLegalRisk: null,

    currentRatio,
    interestCoverage,
    operatingCashFlow,
    totalDebt,

    revenueGrowthYoY,
    revenueGrowthPriorYear,
    marginTrend,
    roe: num(latestRatios.returnOnEquity),
    roic: num(latestKeyMetrics.roic),
    fcfMargin,
    debtToEbitda,
    isCyclicalPeak: false,

    trailingPE,
    ownHistoricalAvgPE,
    forwardPE,
    peerAvgForwardPE,
    epsGrowthForward,
    evToEbitda,
    peerMedianEvToEbitda: null,
    evToFcf,
    peerMedianEvToFcf: null,
    dcfIntrinsicValue: dcf ? num(dcf.dcf) : null,
    analystTargetLow: priceTarget ? num(priceTarget.targetLow) : null,
    analystTargetHigh: priceTarget ? num(priceTarget.targetHigh) : null,
    analystTargetAvg: priceTarget ? num(priceTarget.targetConsensus) : null,

    guidanceTrend: "unknown",
    tamExpansionNote: null,
    backlogGrowthYoY: null,

    moatType: null,
    grossMargin: grossMarginLatest,
    grossMarginTrend: marginTrend,
    isCommodityProducer,
    concentrationRisk: null,

    insiderOwnershipPercent: num(profile.insiderOwnership, 0.02),
    insiderBuyValue3mo,
    insiderSellValue3mo,
    dividendPayoutRatio: latestRatios.payoutRatio != null ? num(latestRatios.payoutRatio) : null,
    buybackYoY: latestCashFlow.commonStockRepurchased != null ? -num(latestCashFlow.commonStockRepurchased) : null,
    boardTransitionNote: null,

    week52High: num(quote.yearHigh),
    week52Low: num(quote.yearLow),
    rsi14: null,
    ma50: quote.priceAvg50 != null ? num(quote.priceAvg50) : null,
    ma200: quote.priceAvg200 != null ? num(quote.priceAvg200) : null,
    beta: profile.beta != null ? num(profile.beta) : null,
    technicalDisagreementNote: null,

    shortSellerFlag: null,
    recentGuidanceCutOrMiss: false,
    sectorLeverageMedianDebtToEbitda: null,
    macroOverhangNote: null,

    peers,
    priceStalenessNote: null,
    qualitativeDataVerified: false
  };

  // fill peerAvgForwardPE fallback if computed NaN
  if (raw.peerAvgForwardPE != null && !Number.isFinite(raw.peerAvgForwardPE)) raw.peerAvgForwardPE = null;

  return raw;
}
