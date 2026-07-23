import type { GateResult, RawFinancials } from "../types.js";

interface ExclusionCategory {
  key: string;
  label: string;
  industryKeywords: string[];
  summaryKeywords: string[];
}

// Business-activity exclusion list per Mizan methodology 2.1: conventional banking/insurance,
// alcohol, gambling, pork, adult content, interest-based lending, weapons manufacturing.
const EXCLUSIONS: ExclusionCategory[] = [
  {
    key: "banking",
    label: "conventional banking",
    industryKeywords: ["bank", "banks", "diversified banks", "regional banks", "mortgage finance"],
    summaryKeywords: ["commercial bank", "retail banking", "conventional bank", "interest income from loans"]
  },
  {
    key: "insurance",
    label: "conventional insurance",
    industryKeywords: ["insurance"],
    summaryKeywords: ["insurance premiums", "underwrites insurance"]
  },
  {
    key: "alcohol",
    label: "alcohol production/sale",
    industryKeywords: ["brewers", "distillers", "wineries", "beverages—wineries", "beverages - wineries"],
    summaryKeywords: ["beer", "wine", "spirits", "distillery", "brewery"]
  },
  {
    key: "gambling",
    label: "gambling",
    industryKeywords: ["gambling", "resorts & casinos", "casino"],
    summaryKeywords: ["casino", "sports betting", "wagering", "lottery"]
  },
  {
    key: "pork",
    label: "pork production",
    industryKeywords: ["pork"],
    summaryKeywords: ["pork products", "swine", "hog processing"]
  },
  {
    key: "adult",
    label: "adult content",
    industryKeywords: ["adult entertainment"],
    summaryKeywords: ["adult content", "adult entertainment"]
  },
  {
    key: "lending",
    label: "interest-based consumer lending",
    industryKeywords: ["consumer finance", "credit services"],
    summaryKeywords: ["payday loans", "interest-bearing consumer loans"]
  },
  {
    key: "weapons",
    label: "weapons manufacturing",
    industryKeywords: ["aerospace & defense", "aerospace and defense"],
    summaryKeywords: ["missile systems", "fighter jet", "munitions", "combat aircraft", "defense contractor"]
  }
];

function matchesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

export interface BusinessActivityResult {
  excluded: boolean;
  category: ExclusionCategory | null;
}

export function screenBusinessActivity(r: RawFinancials): BusinessActivityResult {
  for (const cat of EXCLUSIONS) {
    if (matchesAny(r.industry, cat.industryKeywords) || matchesAny(r.sector, cat.industryKeywords)) {
      return { excluded: true, category: cat };
    }
    if (matchesAny(r.businessSummary, cat.summaryKeywords)) {
      return { excluded: true, category: cat };
    }
  }
  return { excluded: false, category: null };
}

const RATIO_THRESHOLD = 0.30;
const RATIO_CAUTION_BAND = 0.03; // within 3pp of threshold => caution
const INCOME_THRESHOLD = 0.05;
const INCOME_CAUTION_BAND = 0.01;

export function scoreShariahGate(r: RawFinancials): GateResult {
  const activity = screenBusinessActivity(r);

  const debtRatio = r.marketCap > 0 ? r.interestBearingDebt / r.marketCap : 0;
  const cashRatio = r.marketCap > 0 ? r.cashAndSTInvestments / r.marketCap : 0;
  const incomeRatio = r.totalRevenue > 0 ? r.nonCompliantIncome / r.totalRevenue : 0;

  const metrics = [
    { label: "Debt / Market Cap", value: `${(debtRatio * 100).toFixed(1)}%` },
    { label: "Cash+Sec. / Market Cap", value: `${(cashRatio * 100).toFixed(1)}%` },
    { label: "Non-compliant income", value: `${(incomeRatio * 100).toFixed(1)}%` }
  ];

  if (activity.excluded) {
    return {
      id: "shariah",
      name: "Shariah Compliance",
      status: "FAIL",
      summary: `Core business activity (${activity.category!.label}) is categorically excluded.`,
      detail:
        `${r.companyName} operates in ${r.industry}, matched against the ${activity.category!.label} exclusion. ` +
        `This is a categorical business-activity exclusion — no financial ratio can compensate for an impermissible core business.`,
      metrics
    };
  }

  const debtFail = debtRatio >= RATIO_THRESHOLD;
  const cashFail = cashRatio >= RATIO_THRESHOLD;
  const incomeFail = incomeRatio >= INCOME_THRESHOLD;

  if (debtFail || cashFail || incomeFail) {
    const failedRatio = debtFail
      ? `Interest-bearing debt is ${(debtRatio * 100).toFixed(1)}% of market cap (limit 30%)`
      : cashFail
      ? `Cash + interest-bearing securities are ${(cashRatio * 100).toFixed(1)}% of market cap (limit 30%)`
      : `Non-compliant income is ${(incomeRatio * 100).toFixed(1)}% of revenue (limit 5%)`;
    return {
      id: "shariah",
      name: "Shariah Compliance",
      status: "FAIL",
      summary: "Fails AAOIFI-style financial ratio screen.",
      detail: `Business activity passes, but the financial ratio screen fails: ${failedRatio}. Treated identically to a business-activity failure.`,
      metrics
    };
  }

  const debtCaution = debtRatio >= RATIO_THRESHOLD - RATIO_CAUTION_BAND;
  const cashCaution = cashRatio >= RATIO_THRESHOLD - RATIO_CAUTION_BAND;
  const incomeCaution = incomeRatio >= INCOME_THRESHOLD - INCOME_CAUTION_BAND;

  if (debtCaution || cashCaution || incomeCaution) {
    return {
      id: "shariah",
      name: "Shariah Compliance",
      status: "CAUTION",
      summary: "Passes but approaching a ratio threshold.",
      detail: "Business activity and ratios currently pass, but at least one ratio is within a narrow margin of its 30%/5% limit and should be rechecked next quarter.",
      metrics
    };
  }

  return {
    id: "shariah",
    name: "Shariah Compliance",
    status: "PASS",
    summary: "Permissible business activity and compliant financial ratios.",
    detail: `Core revenue is not derived from an excluded activity. Debt/mkt cap ${(debtRatio * 100).toFixed(1)}% — well under 30% threshold.`,
    metrics
  };
}
