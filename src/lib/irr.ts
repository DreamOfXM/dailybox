/** IRR 真实年化利率（纯函数）：穿透分期名义费率，二分法求解内部收益率 */

import type { TryResult } from "./base64";

export interface CashFlow {
  /** 时间点（月），t=0 为放款/投入时刻 */
  t: number;
  /** 金额：正=收到（放款），负=支出（还款） */
  amount: number;
}

/** NPV = Σ amount / (1 + rate)^t，rate 为月利率 */
export function npv(rate: number, flows: CashFlow[]): number {
  let sum = 0;
  for (const f of flows) sum += f.amount / Math.pow(1 + rate, f.t);
  return sum;
}

/**
 * 二分法求月利率使 NPV = 0
 * NPV 关于利率单调递减（常规现金流），搜索区间 (-0.9, 10)，精度 1e-10
 */
export function irrMonthly(flows: CashFlow[]): TryResult<number> {
  if (flows.length < 2) return { ok: false, message: "至少需要两笔现金流（放款与还款）" };
  const hasPositive = flows.some((f) => f.amount > 0);
  const hasNegative = flows.some((f) => f.amount < 0);
  if (!hasPositive || !hasNegative) return { ok: false, message: "现金流必须同时包含收入与支出" };

  let lo = -0.9;
  let hi = 10;
  let fLo = npv(lo, flows);
  const fHi = npv(hi, flows);
  if (fLo * fHi > 0) return { ok: false, message: "该现金流在合理利率区间内无解" };

  // 收敛到区间宽度 1e-14（约 50 次迭代）；绝对残差阈值按现金流规模缩放，避免大本金过早收敛
  const scale = flows.reduce((s, f) => s + Math.abs(f.amount), 0);
  const fTol = 1e-14 * scale;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, flows);
    if (Math.abs(fMid) < fTol || (hi - lo) / 2 < 1e-14) return { ok: true, value: mid };
    // NPV 单调递减：fMid 与 fLo 同号则根在右半区
    if (fMid * fLo > 0) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }
  return { ok: true, value: (lo + hi) / 2 };
}

export interface InstallmentIrrResult {
  /** 月利率（IRR） */
  monthlyIrr: number;
  /** 名义年化 = 月利率 × 12（监管披露口径） */
  annualNominal: number;
  /** 有效年化 = (1 + 月利率)^12 − 1 */
  annualEffective: number;
  /** 总还款 */
  totalPayment: number;
  /** 总成本（总还款 − 到手金额） */
  totalCost: number;
  /** 名义费率口径（前置费用摊到每期本金的年化百分比，用于与宣传费率对比），无前置费用时为 0 */
  nominalFeeRate: number;
}

/**
 * 分期贷款 IRR：到手 principal − upfrontFee，之后 periods 期每期还 monthlyPayment
 * upfrontFee：前置费用（服务费/手续费，从放款中直接扣除）
 */
export function installmentIrr(
  principal: number,
  monthlyPayment: number,
  periods: number,
  upfrontFee = 0,
): TryResult<InstallmentIrrResult> {
  if (!(principal > 0)) return { ok: false, message: "到手金额必须大于 0" };
  if (!(monthlyPayment > 0)) return { ok: false, message: "每期还款必须大于 0" };
  if (!Number.isInteger(periods) || periods <= 0) return { ok: false, message: "期数必须为正整数" };
  if (upfrontFee < 0 || upfrontFee >= principal) return { ok: false, message: "前置费用必须不小于 0 且小于到手金额" };

  const net = principal - upfrontFee;
  if (monthlyPayment * periods <= net) {
    return { ok: false, message: "总还款未超过到手金额，利率无解" };
  }

  const flows: CashFlow[] = [{ t: 0, amount: net }];
  for (let t = 1; t <= periods; t++) flows.push({ t, amount: -monthlyPayment });

  const r = irrMonthly(flows);
  if (!r.ok) return r;

  const monthlyIrr = r.value;
  return {
    ok: true,
    value: {
      monthlyIrr,
      annualNominal: monthlyIrr * 12,
      annualEffective: Math.pow(1 + monthlyIrr, 12) - 1,
      totalPayment: monthlyPayment * periods,
      totalCost: monthlyPayment * periods - net,
      nominalFeeRate: upfrontFee > 0 ? (upfrontFee / principal) * (12 / periods) * 12 : 0,
    },
  };
}
