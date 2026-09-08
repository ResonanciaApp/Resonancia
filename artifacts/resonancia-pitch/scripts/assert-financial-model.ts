import {
  AGGRESSIVE_SCENARIO,
  BASE_SCENARIO,
  BASE_CASE,
  CAC_MARKETING_M,
  FINANCIAL_TOTALS,
  FINANCIAL_MONTHS,
  MONTHLY_CHURN,
  MONTHLY_COHORT_ARPU,
  NET_REVENUE_FACTOR,
  OPTIMISTIC_SCENARIO,
  PRICING,
} from "../src/data/financialModel";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

const targets = [
  [BASE_SCENARIO, 4_400],
  [OPTIMISTIC_SCENARIO, 7_000],
  [AGGRESSIVE_SCENARIO, 9_000],
] as const;

for (const [scenario, target] of targets) {
  const actual = scenario.months[11].activeSubscribers;
  assert(Math.abs(actual - target) < 0.000001, `${scenario.label}: expected ${target} active M12, got ${actual}`);
}

const m2 = FINANCIAL_MONTHS[1];
const m2NewCohortOnly = m2.grossAdditions * 0.65 * PRICING.premium.monthly * NET_REVENUE_FACTOR / 1_000_000;
assert(
  m2.monthlyCashM > m2NewCohortOnly,
  "M2 monthly cash must include surviving monthly renewals from the M1 cohort",
);
assert(MONTHLY_CHURN === 0.15, "Monthly churn must remain 15%");
assert(
  Math.abs(m2.annualActiveSubscribers - (1_000 * 0.30 + m2.grossAdditions * 0.35)) < 0.000001,
  "Annual cohorts must remain active for their full paid term",
);
assert(
  FINANCIAL_MONTHS[1].monthlyActiveSubscribers < 1_000 * 0.70 + m2.grossAdditions * 0.65,
  "Monthly cohorts must apply 15% churn before renewal",
);
for (const month of FINANCIAL_MONTHS) {
  assert(
    Math.abs(month.totalOperatingCostM - (month.nonMarketingCostM + month.operatingMarketingM + month.roundFundedMarketingM)) < 0.000001,
    `M${month.month}: all incurred marketing must be included in P&L expenses`,
  );
}
assert(
  Math.abs(FINANCIAL_TOTALS.marketingExpenseM - 11.6) < 0.000001,
  `Expected $11.6M of year-one P&L marketing, got $${FINANCIAL_TOTALS.marketingExpenseM}M`,
);
assert(
  Math.abs(FINANCIAL_TOTALS.roundFundedMarketingM - 2) < 0.000001 && Math.abs(CAC_MARKETING_M - 12.6) < 0.000001,
  "Marketing allocation must be $1M pre-launch + $1M M1 + $1M M2, with $12.6M CAC numerator",
);
assert(
  Math.abs(
    FINANCIAL_TOTALS.recurringRevenueM + FINANCIAL_TOTALS.courseRevenueM -
    FINANCIAL_TOTALS.nonMarketingCostM - FINANCIAL_TOTALS.marketingExpenseM -
    FINANCIAL_TOTALS.netResultM,
  ) < 0.000001,
  "Annual displayed P&L revenue - all costs must equal net result",
);
assert(
  FINANCIAL_MONTHS.reduce((total, month) => total + month.courseUnits, 0) === 600 &&
  Math.abs(FINANCIAL_TOTALS.courseRevenueM - 9.1764) < 0.000001,
  "SlideUpSells must remain centralized at 600 sales and $9.1764M course revenue",
);
assert(
  BASE_CASE.valleyMonth === 2 &&
  Math.abs(BASE_CASE.conservativeValleyM - FINANCIAL_MONTHS[1].cumulativeResultM) < 0.000001,
  "Accrual P&L valley must be derived as M2",
);
assert(
  BASE_CASE.cashValleyM > 0 && BASE_CASE.cashValleyMonth === 1,
  "Base-case actual cash must remain positive with its minimum at M1",
);
const expectedMonthlyCohortArpu =
  (0.65 * PRICING.premium.monthly + 0.35 * PRICING.premiumPlus.monthly) * NET_REVENUE_FACTOR;
assert(
  Math.abs(MONTHLY_COHORT_ARPU - expectedMonthlyCohortArpu) < 0.000001,
  "Monthly cohort ARPU must use only monthly prices and the M3+ tier mix",
);

console.log("✓ Financial model assertions passed: targets, cohort billing, $11.6M P&L marketing, reconciliation, and monthly-cohort ARPU.");