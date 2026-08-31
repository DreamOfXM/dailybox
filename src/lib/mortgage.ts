/** 房贷计算核心（纯函数；金额内部全程 number 完整精度，仅在展示层舍入到分） */

/** 还款方式：installment=等额本息，principal=等额本金 */
export type Method = "installment" | "principal";

/** 单期还款明细（金额均为元，完整浮点精度，未做任何提前舍入） */
export interface ScheduleRow {
  /** 期数（1 起） */
  period: number;
  /** 本期月供 = 本金 + 利息 */
  payment: number;
  /** 本期偿还本金 */
  principal: number;
  /** 本期利息 = 期初剩余本金 × 月利率 */
  interest: number;
  /** 本期还款后剩余本金（末期精确归零） */
  remaining: number;
}

/** 方案汇总 */
export interface MortgageSummary {
  /** 首月月供 */
  monthlyFirst: number;
  /** 末月月供（等额本息时与首月相同） */
  monthlyLast: number;
  /** 还款总额（本金 + 利息） */
  totalPayment: number;
  /** 利息总额 */
  totalInterest: number;
}

/** 提前还款测算结果 */
export interface PrepayResult {
  /** 相比原方案节省的利息 */
  savedInterest: number;
  /** 提前还款后的新月供 */
  newMonthly: number;
}

/** 参数校验：非法输入抛出中文错误（message 可直接展示） */
function assertLoan(total: number, annualRate: number, months: number): void {
  if (!Number.isFinite(total) || total <= 0) throw new Error("贷款总额必须大于 0");
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new Error("年利率不能为负数");
  if (!Number.isFinite(months) || !Number.isInteger(months) || months <= 0) {
    throw new Error("还款期数必须是正整数（月）");
  }
}

/** 月利率（年利率 / 12，不做舍入） */
function monthlyRate(annualRate: number): number {
  return annualRate / 12;
}

/**
 * 等额本息月供：M = P·r·(1+r)^n / ((1+r)^n − 1)，r = 年利率/12。
 * 年利率为 0 时退化为 P/n。参数非法抛中文错误。
 */
export function monthlyPayment(total: number, annualRate: number, months: number): number {
  assertLoan(total, annualRate, months);
  if (annualRate === 0) return total / months;
  const r = monthlyRate(annualRate);
  const factor = Math.pow(1 + r, months);
  return (total * r * factor) / (factor - 1);
}

/**
 * 逐期还款表（完整精度，不做提前舍入）。
 * - 等额本息：每期利息 = 期初剩余本金 × r，本金 = 月供 − 利息；
 * - 等额本金：每期本金 = P/n，利息 = 期初剩余本金 × r，月供逐月递减；
 * - 最后一期本金用剩余本金找平，消除累计浮点误差，remaining 精确归零（< 1e-6）。
 */
export function schedule(
  total: number,
  annualRate: number,
  months: number,
  method: Method,
): ScheduleRow[] {
  assertLoan(total, annualRate, months);
  const r = monthlyRate(annualRate);
  const fixedPayment = method === "installment" ? monthlyPayment(total, annualRate, months) : 0;
  const basePrincipal = total / months;

  const rows: ScheduleRow[] = [];
  let remaining = total;
  for (let period = 1; period <= months; period++) {
    const interest = remaining * r;
    let principal: number;
    if (period === months) {
      // 末期找平：本金直接取剩余本金，保证 remaining 精确归零
      principal = remaining;
    } else if (method === "installment") {
      principal = fixedPayment - interest;
    } else {
      principal = basePrincipal;
    }
    const payment = principal + interest;
    remaining -= principal;
    rows.push({ period, payment, principal, interest, remaining });
  }
  return rows;
}

/**
 * 方案汇总。等额本息 monthlyFirst = monthlyLast = 月供；
 * 总还款 / 总利息由逐期明细累加，与 schedule 完全一致。
 */
export function summarize(
  total: number,
  annualRate: number,
  months: number,
  method: Method,
): MortgageSummary {
  const rows = schedule(total, annualRate, months, method);
  let totalPayment = 0;
  let totalInterest = 0;
  for (const row of rows) {
    totalPayment += row.payment;
    totalInterest += row.interest;
  }
  const monthlyFirst = rows[0].payment;
  const monthlyLast = method === "installment" ? monthlyPayment(total, annualRate, months) : rows[rows.length - 1].payment;
  return { monthlyFirst, monthlyLast, totalPayment, totalInterest };
}

/**
 * 提前还款测算：第 payPeriod 期还完后一次性提前还 prepayAmount（元），
 * 剩余本金按原还款方式、newMonths 期（缺省 = 剩余期数）重新计算。
 * savedInterest = 原方案总利息 −（已付利息 + 新方案总利息）。
 */
export function prepayAfter(
  total: number,
  annualRate: number,
  months: number,
  method: Method,
  payPeriod: number,
  prepayAmount: number,
  newMonths?: number,
): PrepayResult {
  assertLoan(total, annualRate, months);
  if (!Number.isFinite(payPeriod) || !Number.isInteger(payPeriod) || payPeriod <= 0) {
    throw new Error("提前还款期数必须是正整数");
  }
  if (payPeriod >= months) throw new Error("提前还款期数必须小于总期数");
  if (!Number.isFinite(prepayAmount) || prepayAmount <= 0) {
    throw new Error("提前还款金额必须大于 0");
  }

  const rows = schedule(total, annualRate, months, method);
  let paidInterest = 0;
  for (let i = 0; i < payPeriod; i++) paidInterest += rows[i].interest;
  const remainingAfter = rows[payPeriod - 1].remaining;
  if (prepayAmount >= remainingAfter) {
    throw new Error("提前还款金额不能超过该期还款后的剩余本金");
  }

  const restMonths = months - payPeriod;
  const targetMonths = newMonths ?? restMonths;
  if (!Number.isFinite(targetMonths) || !Number.isInteger(targetMonths) || targetMonths <= 0) {
    throw new Error("新还款期数必须是正整数（月）");
  }

  const newTotal = remainingAfter - prepayAmount;
  const newSchedule = schedule(newTotal, annualRate, targetMonths, method);
  let newTotalInterest = 0;
  for (const row of newSchedule) newTotalInterest += row.interest;

  const originalInterest = summarize(total, annualRate, months, method).totalInterest;
  return {
    savedInterest: originalInterest - (paidInterest + newTotalInterest),
    newMonthly: newSchedule[0].payment,
  };
}
