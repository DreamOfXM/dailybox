/** 存款收益计算（纯函数）：国内定期存款为单利口径；复利用于理财/对比场景 */

export interface InterestResult {
  /** 到期利息 */
  interest: number;
  /** 到期本息合计 */
  maturity: number;
}

/** 单利：利息 = 本金 × 年利率 × 年数（银行定期存款标准口径） */
export function simpleInterest(principal: number, annualRate: number, years: number): InterestResult {
  validate(principal, annualRate, years);
  const interest = principal * annualRate * years;
  return { interest, maturity: principal + interest };
}

/**
 * 复利：本息 = 本金 × (1 + r/m)^(m·t)，m 为每年计息次数
 * 注意浮点误差随乘方放大，测试用相对误差断言
 */
export function compound(principal: number, annualRate: number, years: number, timesPerYear = 1): InterestResult {
  validate(principal, annualRate, years);
  if (!Number.isInteger(timesPerYear) || timesPerYear <= 0) throw new Error("每年计息次数必须为正整数");
  const maturity = principal * Math.pow(1 + annualRate / timesPerYear, timesPerYear * years);
  return { interest: maturity - principal, maturity };
}

/** 复利交叉验证实现：逐期累加（与封闭公式独立，用于测试互验） */
export function compoundByPeriods(principal: number, annualRate: number, years: number, timesPerYear = 1): InterestResult {
  validate(principal, annualRate, years);
  if (!Number.isInteger(timesPerYear) || timesPerYear <= 0) throw new Error("每年计息次数必须为正整数");
  let balance = principal;
  const periods = timesPerYear * years;
  const periodRate = annualRate / timesPerYear;
  for (let i = 0; i < periods; i++) balance += balance * periodRate;
  return { interest: balance - principal, maturity: balance };
}

/**
 * 年化收益率（实际天数口径，365 基准）：
 * 年化 = 收益 / 本金 / (天数 / 365)
 */
export function annualizedRate(principal: number, earnings: number, days: number): number {
  if (principal <= 0) throw new Error("本金必须大于 0");
  if (days <= 0) throw new Error("天数必须大于 0");
  if (earnings < 0) throw new Error("收益不能为负（亏损场景请用负收益自行换算）");
  return earnings / principal / (days / 365);
}

export interface Plan {
  name: string;
  principal: number;
  annualRate: number;
  years: number;
  /** true 按年复利，false（缺省）按单利 */
  compound?: boolean;
}

export interface PlanResult extends Plan {
  interest: number;
  maturity: number;
}

/** 多方案对比：按到期本息降序 */
export function comparePlans(plans: Plan[]): PlanResult[] {
  if (!plans.length) throw new Error("请至少添加一个方案");
  return plans
    .map((p) => {
      const r = p.compound ? compound(p.principal, p.annualRate, p.years, 1) : simpleInterest(p.principal, p.annualRate, p.years);
      return { ...p, ...r };
    })
    .sort((a, b) => b.maturity - a.maturity);
}

function validate(principal: number, annualRate: number, years: number): void {
  if (!(principal > 0)) throw new Error("本金必须大于 0");
  if (!(annualRate >= 0)) throw new Error("年利率不能为负");
  if (!(years > 0)) throw new Error("期限必须大于 0");
}
