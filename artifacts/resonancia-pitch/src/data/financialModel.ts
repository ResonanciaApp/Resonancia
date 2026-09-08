export const VAT_RATE = 0.19;
export const STORE_COMMISSION_RATE = 0.30;
export const NET_REVENUE_FACTOR = (1 - STORE_COMMISSION_RATE) / (1 + VAT_RATE);
export const MONTHLY_CHURN = 0.15;

export const PRICING = {
  premium: { monthly: 4_990, annual: 39_990 },
  premiumPlus: { monthly: 6_990, annual: 69_990 },
  launchPremium: { monthly: 1_990, annual: 19_990 },
} as const;

export const NET_COURSE_REVENUE = 15_294;
export const FIXED_MONTHLY_COST_M = 2.58;
export const CONTENT_COSTS_M = [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45] as const;
export const OPERATING_MARKETING_M = [0, 0, 0, 0, 0, 0, 1, 1, 1.8, 1.8, 2, 2] as const;
export const ROUND_FUNDED_MARKETING_M = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const;
export const COURSE_UNITS = [0, 0, 0, 0, 0, 0, 60, 80, 100, 110, 120, 130] as const;

const net = (gross: number) => gross * NET_REVENUE_FACTOR;
const monthlyEquivalent = (annual: number) => net(annual) / 12;

export const PHASE_ARPU = {
  launch: 0.70 * net(PRICING.launchPremium.monthly) + 0.30 * monthlyEquivalent(PRICING.launchPremium.annual),
  premium: 0.65 * net(PRICING.premium.monthly) + 0.35 * monthlyEquivalent(PRICING.premium.annual),
  premiumPlus: 0.65 * net(PRICING.premiumPlus.monthly) + 0.35 * monthlyEquivalent(PRICING.premiumPlus.annual),
} as const;
export const MONTHLY_COHORT_ARPU =
  0.65 * net(PRICING.premium.monthly) + 0.35 * net(PRICING.premiumPlus.monthly);
export const ARPU_NORMAL = 0.65 * PHASE_ARPU.premium + 0.35 * PHASE_ARPU.premiumPlus;
export const ARPU_LAUNCH = PHASE_ARPU.launch;

export const BASE_ACTIVE_M12_TARGET = 4_400;
export const OPTIMISTIC_ACTIVE_M12_TARGET = 7_000;
export const AGGRESSIVE_ACTIVE_M12_TARGET = 9_000;

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

function acquisitionCurve(targetActiveM12: number) {
  const activeAtM12 = (additions: number[]) => additions.reduce((active, gross, index) => {
    const month = index + 1;
    const monthlyShare = month === 1 ? 0.70 : 0.65;
    const annualShare = 1 - monthlyShare;
    return active + gross * (annualShare + monthlyShare * (1 - MONTHLY_CHURN) ** (12 - month));
  }, 0);
  // Solve a uniform M2–M12 curve, then round M2–M11 and adjust M12 exactly.
  let low = 0;
  let high = targetActiveM12;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (activeAtM12([1_000, ...Array(11).fill(mid)]) < targetActiveM12) low = mid;
    else high = mid;
  }
  const additions = [1_000];
  const uniform = Math.round((low + high) / 2);
  for (let month = 2; month <= 11; month += 1) additions.push(uniform);
  additions.push(targetActiveM12 - activeAtM12([...additions, 0]));
  return additions;
}

function phaseFor(month: number) {
  return month === 1 ? "lanzamiento" : month === 2 ? "premium" : "premium + plus";
}

type Cohort = {
  acquiredMonth: number; gross: number; monthlySubscribers: number; annualSubscribers: number;
  monthlyRevenue: number; annualRevenue: number; annualCash: number;
};

function cohortFor(month: number, gross: number): Cohort {
  if (month === 1) return {
    acquiredMonth: month, gross, monthlySubscribers: gross * 0.70, annualSubscribers: gross * 0.30,
    monthlyRevenue: gross * 0.70 * net(PRICING.launchPremium.monthly),
    annualRevenue: gross * 0.30 * monthlyEquivalent(PRICING.launchPremium.annual),
    annualCash: gross * 0.30 * net(PRICING.launchPremium.annual),
  };
  if (month === 2) return {
    acquiredMonth: month, gross, monthlySubscribers: gross * 0.65, annualSubscribers: gross * 0.35,
    monthlyRevenue: gross * 0.65 * net(PRICING.premium.monthly),
    annualRevenue: gross * 0.35 * monthlyEquivalent(PRICING.premium.annual),
    annualCash: gross * 0.35 * net(PRICING.premium.annual),
  };
  return {
    acquiredMonth: month, gross, monthlySubscribers: gross * 0.65, annualSubscribers: gross * 0.35,
    monthlyRevenue: gross * (0.65 * 0.65 * net(PRICING.premium.monthly) + 0.35 * 0.65 * net(PRICING.premiumPlus.monthly)),
    annualRevenue: gross * (0.65 * 0.35 * monthlyEquivalent(PRICING.premium.annual) + 0.35 * 0.35 * monthlyEquivalent(PRICING.premiumPlus.annual)),
    annualCash: gross * (0.65 * 0.35 * net(PRICING.premium.annual) + 0.35 * 0.35 * net(PRICING.premiumPlus.annual)),
  };
}

function buildScenario(label: string, targetActiveM12: number, courseUnits = COURSE_UNITS) {
  const grossAdditions = acquisitionCurve(targetActiveM12);
  let registrations = 0;
  let cumulativeResult = 0;
  let cumulativeCash = 0;
  const cohorts: Cohort[] = [];
  const months = grossAdditions.map((gross, index) => {
    const month = index + 1;
    cohorts.push(cohortFor(month, gross));
    registrations += gross;
    const survivingCohorts = cohorts.map((cohort) => ({
      cohort,
      survival: (1 - MONTHLY_CHURN) ** (month - cohort.acquiredMonth),
    }));
    // P&L recognizes annual subscriptions monthly, while preserving each cohort's acquired price and tier.
    const recurringRevenueM = sum(survivingCohorts.map(({ cohort, survival }) =>
      survival * cohort.monthlyRevenue + cohort.annualRevenue,
    )) / 1_000_000;
    const monthlyActiveSubscribers = sum(survivingCohorts.map(({ cohort, survival }) => survival * cohort.monthlySubscribers));
    const annualActiveSubscribers = sum(survivingCohorts.map(({ cohort }) => cohort.annualSubscribers));
    const activeSubscribers = monthlyActiveSubscribers + annualActiveSubscribers;
    const courseRevenueM = courseUnits[index] * NET_COURSE_REVENUE / 1_000_000;
    const nonMarketingCostM = FIXED_MONTHLY_COST_M + CONTENT_COSTS_M[index];
    const operatingMarketingM = OPERATING_MARKETING_M[index];
    const totalOperatingCostM = nonMarketingCostM + operatingMarketingM + ROUND_FUNDED_MARKETING_M[index];
    const netResultM = recurringRevenueM + courseRevenueM - totalOperatingCostM;
    cumulativeResult += netResultM;
    // Cash collects annual cohorts only at acquisition and monthly cohorts on every surviving renewal.
    const annualPrepaidCashM = cohorts[cohorts.length - 1].annualCash / 1_000_000;
    const monthlyCashM = sum(survivingCohorts.map(({ cohort, survival }) => survival * cohort.monthlyRevenue)) / 1_000_000;
    const subscriptionCashM = annualPrepaidCashM + monthlyCashM;
    const cashExpensesM = totalOperatingCostM;
    const cashResultM = subscriptionCashM + courseRevenueM - cashExpensesM;
    cumulativeCash += cashResultM;
    return {
      month, label: month === 1 ? "M1 Lanzamiento" : `Mes ${month}`, shortLabel: `M${month}`,
      phase: phaseFor(month), grossAdditions: gross, cumulativeRegistrations: registrations,
      activeSubscribers, monthlyActiveSubscribers, annualActiveSubscribers, subscribers: activeSubscribers, courseUnits: courseUnits[index],
      arpu: recurringRevenueM * 1_000_000 / activeSubscribers, recurringRevenueM, courseRevenueM, annualPrepaidCashM, monthlyCashM,
      subscriptionCashM, nonMarketingCostM, operatingMarketingM,
      roundFundedMarketingM: ROUND_FUNDED_MARKETING_M[index], totalOperatingCostM, netResultM,
      cumulativeResultM: cumulativeResult, cashExpensesM, cashResultM, cumulativeCashM: cumulativeCash,
    };
  });
  return { label, targetActiveM12, grossAdditions, months };
}

export const BASE_SCENARIO = buildScenario("Base", BASE_ACTIVE_M12_TARGET);
export const FINANCIAL_MONTHS = BASE_SCENARIO.months;
export const OPTIMISTIC_SCENARIO = buildScenario("Optimista", OPTIMISTIC_ACTIVE_M12_TARGET);
export const AGGRESSIVE_SCENARIO = buildScenario("Agresivo", AGGRESSIVE_ACTIVE_M12_TARGET);

export const FINANCIAL_TOTALS = {
  recurringRevenueM: sum(FINANCIAL_MONTHS.map((month) => month.recurringRevenueM)),
  courseRevenueM: sum(FINANCIAL_MONTHS.map((month) => month.courseRevenueM)),
  subscriptionCashM: sum(FINANCIAL_MONTHS.map((month) => month.subscriptionCashM)),
  monthlyRenewalCashM: sum(FINANCIAL_MONTHS.map((month) => month.monthlyCashM)),
  annualPrepaidCashM: sum(FINANCIAL_MONTHS.map((month) => month.annualPrepaidCashM)),
  nonMarketingCostM: sum(FINANCIAL_MONTHS.map((month) => month.nonMarketingCostM)),
  operatingMarketingM: sum(FINANCIAL_MONTHS.map((month) => month.operatingMarketingM)),
  roundFundedMarketingM: sum(FINANCIAL_MONTHS.map((month) => month.roundFundedMarketingM)),
  marketingExpenseM: sum(FINANCIAL_MONTHS.map((month) => month.operatingMarketingM + month.roundFundedMarketingM)),
  totalOperatingCostM: sum(FINANCIAL_MONTHS.map((month) => month.totalOperatingCostM)),
  netResultM: sum(FINANCIAL_MONTHS.map((month) => month.netResultM)),
  cashExpensesM: sum(FINANCIAL_MONTHS.map((month) => month.cashExpensesM)),
  cashResultM: sum(FINANCIAL_MONTHS.map((month) => month.cashResultM)),
  grossAdditions: sum(FINANCIAL_MONTHS.map((month) => month.grossAdditions)),
  cumulativeRegistrations: FINANCIAL_MONTHS[11].cumulativeRegistrations,
};
export const CAC_MARKETING_M = 1 + FINANCIAL_TOTALS.roundFundedMarketingM + FINANCIAL_TOTALS.operatingMarketingM;
export const BLENDED_CAC = CAC_MARKETING_M * 1_000_000 / FINANCIAL_TOTALS.grossAdditions;
export const PAYBACK_MONTHS = BLENDED_CAC / MONTHLY_COHORT_ARPU;

const scenarioTotals = (scenario: typeof BASE_SCENARIO) => ({
  revenueM: sum(scenario.months.map((month) => month.recurringRevenueM + month.courseRevenueM)),
  netM: sum(scenario.months.map((month) => month.netResultM)),
  cashM: sum(scenario.months.map((month) => month.cashResultM)),
  m12RecurringArrM: scenario.months[11].recurringRevenueM * 12,
});

export const YEAR_ONE_SCENARIOS = [BASE_SCENARIO, OPTIMISTIC_SCENARIO, AGGRESSIVE_SCENARIO].map((scenario) => ({
  label: scenario.label,
  subs12: Math.round(scenario.months[11].activeSubscribers).toLocaleString("es-CL"),
  registrations: Math.round(scenario.months[11].cumulativeRegistrations).toLocaleString("es-CL"),
  grossM2toM11: Math.round(scenario.grossAdditions[1]).toLocaleString("es-CL"),
  cursos6m: "600",
  ...scenarioTotals(scenario),
  highlight: scenario.label === "Base",
  negative: false,
}));

export const BASE_CASE = {
  conservativeValleyM: Math.min(...FINANCIAL_MONTHS.map((month) => month.cumulativeResultM)),
  valleyMonth: FINANCIAL_MONTHS.reduce((lowest, month) =>
    month.cumulativeResultM < lowest.cumulativeResultM ? month : lowest,
  ).month,
  firstPositiveMonth: FINANCIAL_MONTHS.find((month) => month.netResultM >= 0)?.month ?? null,
  cumulativeRecoveryMonth: FINANCIAL_MONTHS.find((month) => month.cumulativeResultM >= 0)?.month ?? null,
  cashValleyM: Math.min(...FINANCIAL_MONTHS.map((month) => month.cumulativeCashM)),
  cashValleyMonth: FINANCIAL_MONTHS.reduce((lowest, month) =>
    month.cumulativeCashM < lowest.cumulativeCashM ? month : lowest,
  ).month,
  cashRecoveryMonth: FINANCIAL_MONTHS.find((month) => month.cumulativeCashM >= 0)?.month ?? null,
};

export const INVESTMENT = {
  totalM: 13.4,
  prelaunchRunwayMonths: 4,
  prelaunchRunwayTotalM: 1.95,
  launchMarketingReserveM: 2,
  totalRoundMarketingM: 3,
};

export function formatMillions(value: number, digits = 1, signed = false) {
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(digits).replace(".", ",")}M`;
}