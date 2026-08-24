export const ARPU_LAUNCH = 2_506;
export const ARPU_NORMAL = 3_238;
export const NET_COURSE_REVENUE = 15_294;

export const FIXED_MONTHLY_COST_M = 2.58;
export const CONTENT_COSTS_M = [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45] as const;
export const OPERATING_MARKETING_M = [0, 0, 0, 0, 0, 0, 1, 1, 1.8, 1.8, 2, 2] as const;
export const ROUND_FUNDED_MARKETING_M = [1, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const;

const SUBSCRIBERS = [300, 600, 900, 1_200, 1_500, 1_800, 2_100, 2_400, 2_700, 3_000, 3_300, 3_600] as const;
const COURSE_UNITS = [0, 0, 0, 0, 0, 0, 60, 80, 100, 110, 120, 130] as const;

let cumulativeResult = 0;

export const FINANCIAL_MONTHS = SUBSCRIBERS.map((subscribers, index) => {
  const recurringRevenueM = subscribers * (index === 0 ? ARPU_LAUNCH : ARPU_NORMAL) / 1_000_000;
  const courseRevenueM = COURSE_UNITS[index] * NET_COURSE_REVENUE / 1_000_000;
  const nonMarketingCostM = FIXED_MONTHLY_COST_M + CONTENT_COSTS_M[index];
  const operatingMarketingM = OPERATING_MARKETING_M[index];
  const totalOperatingCostM = nonMarketingCostM + operatingMarketingM;
  const netResultM = recurringRevenueM + courseRevenueM - totalOperatingCostM;
  cumulativeResult += netResultM;

  return {
    month: index + 1,
    label: index === 0 ? "M1 Lanzamiento" : `Mes ${index + 1}`,
    shortLabel: `M${index + 1}`,
    phase: index === 0 ? "lanzamiento" : "normal",
    subscribers,
    courseUnits: COURSE_UNITS[index],
    recurringRevenueM,
    courseRevenueM,
    nonMarketingCostM,
    operatingMarketingM,
    roundFundedMarketingM: ROUND_FUNDED_MARKETING_M[index],
    totalOperatingCostM,
    netResultM,
    cumulativeResultM: cumulativeResult,
  };
});

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

export const FINANCIAL_TOTALS = {
  recurringRevenueM: sum(FINANCIAL_MONTHS.map((month) => month.recurringRevenueM)),
  courseRevenueM: sum(FINANCIAL_MONTHS.map((month) => month.courseRevenueM)),
  nonMarketingCostM: sum(FINANCIAL_MONTHS.map((month) => month.nonMarketingCostM)),
  operatingMarketingM: sum(FINANCIAL_MONTHS.map((month) => month.operatingMarketingM)),
  roundFundedMarketingM: sum(FINANCIAL_MONTHS.map((month) => month.roundFundedMarketingM)),
  totalOperatingCostM: sum(FINANCIAL_MONTHS.map((month) => month.totalOperatingCostM)),
  netResultM: sum(FINANCIAL_MONTHS.map((month) => month.netResultM)),
};

export const YEAR_ONE_SCENARIOS = [
  {
    label: "Base",
    subs12: "3.600",
    cursos6m: "600",
    revenueM: FINANCIAL_TOTALS.recurringRevenueM + FINANCIAL_TOTALS.courseRevenueM,
    netM: FINANCIAL_TOTALS.netResultM,
    highlight: true,
    negative: false,
  },
  { label: "Optimista", subs12: "4.500", cursos6m: "~750", revenueM: 106, netM: 106 - FINANCIAL_TOTALS.totalOperatingCostM, highlight: false, negative: false },
  { label: "Agresivo", subs12: "6.000", cursos6m: "~1.000", revenueM: 141, netM: 141 - FINANCIAL_TOTALS.totalOperatingCostM, highlight: false, negative: false },
  { label: "Churn 15%", subs12: "≈1.720", cursos6m: "600", revenueM: 55, netM: 55 - FINANCIAL_TOTALS.totalOperatingCostM, highlight: false, negative: false },
] as const;

export const BASE_CASE = {
  conservativeValleyM: Math.min(...FINANCIAL_MONTHS.map((month) => month.cumulativeResultM)),
  firstPositiveMonth: FINANCIAL_MONTHS.find((month) => month.netResultM >= 0)?.month ?? null,
  cumulativeRecoveryMonth: FINANCIAL_MONTHS.find((month) => month.cumulativeResultM >= 0)?.month ?? null,
};

export const INVESTMENT = {
  totalM: 29.938,
  prelaunchRunwayMonths: 3,
  prelaunchRunwayMonthlyM: 1.596,
  prelaunchRunwayTotalM: 4.788,
  launchMarketingReserveM: 2.5,
  deployedByLaunchM: 27.438,
};

export function formatMillions(value: number, digits = 1, signed = false) {
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(digits).replace(".", ",")}M`;
}