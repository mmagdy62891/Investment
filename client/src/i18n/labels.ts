// Fixed-vocabulary labels (gate/category/verdict names) translate cleanly since the set is
// finite. Free-text analysis (gate details, category notes) is generated server-side in
// English only — fully bilingual generation of data-dependent prose is out of scope for now.

export const GATE_NAMES_AR: Record<string, string> = {
  shariah: "التوافق مع الشريعة",
  goingConcern: "مخاطر استمرارية النشاط",
  accountingIntegrity: "نزاهة المحاسبة",
  liquidity: "الحد الأدنى للسيولة",
  legalRisk: "المخاطر القانونية والتنظيمية",
  solvency: "الحد الأدنى للملاءة المالية"
};

export const CATEGORY_NAMES_AR: Record<string, string> = {
  A: "الصحة المالية والجودة",
  B: "التقييم",
  C: "النمو والزخم",
  D: "الميزة التنافسية",
  E: "الإدارة والحوكمة",
  F: "الاقتصاد الكلي والفني",
  G: "عوامل المخاطرة"
};

export const VERDICT_LABELS_AR: Record<string, string> = {
  REJECT: "رفض",
  AVOID: "تجنب",
  WATCH_HOLD: "مراقبة / احتفاظ",
  BUY_ACCUMULATE: "شراء / تجميع",
  STRONG_BUY: "شراء قوي"
};
