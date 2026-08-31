import { describe, expect, it } from "vitest";
import { installmentIrr, irrMonthly, npv, type CashFlow } from "../irr";

describe("npv / irrMonthly 定义级验证", () => {
  it("解出的月利率代回 NPV 残差 < 1e-7（多组参数）", () => {
    const cases: CashFlow[][] = [
      [{ t: 0, amount: 12000 }, ...Array.from({ length: 12 }, (_, i) => ({ t: i + 1, amount: -1060 }))],
      [{ t: 0, amount: 10000 }, ...Array.from({ length: 24 }, (_, i) => ({ t: i + 1, amount: -500 }))],
      [{ t: 0, amount: 50000 }, ...Array.from({ length: 36 }, (_, i) => ({ t: i + 1, amount: -1600 }))],
      [{ t: 0, amount: 3000 }, ...Array.from({ length: 6 }, (_, i) => ({ t: i + 1, amount: -520 }))],
    ];
    for (const flows of cases) {
      const r = irrMonthly(flows);
      expect(r.ok).toBe(true);
      if (r.ok) expect(Math.abs(npv(r.value, flows))).toBeLessThan(1e-7);
    }
  });

  it("零利率：每期还 P/n → IRR = 0", () => {
    const P = 12000;
    const flows: CashFlow[] = [{ t: 0, amount: P }, ...Array.from({ length: 12 }, (_, i) => ({ t: i + 1, amount: -(P / 12) }))];
    const r = irrMonthly(flows);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Math.abs(r.value)).toBeLessThan(1e-8);
  });

  it("与等额本息公式互证：月利率 0.4% 生成的月供，IRR 反解误差 < 1e-6", () => {
    const P = 100000;
    const r0 = 0.004;
    const n = 24;
    const M = (P * r0 * Math.pow(1 + r0, n)) / (Math.pow(1 + r0, n) - 1);
    const flows: CashFlow[] = [{ t: 0, amount: P }, ...Array.from({ length: n }, (_, i) => ({ t: i + 1, amount: -M }))];
    const r = irrMonthly(flows);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Math.abs(r.value - r0)).toBeLessThan(1e-6);
  });

  it("非法现金流返回中文错误", () => {
    expect(irrMonthly([{ t: 0, amount: 100 }]).ok).toBe(false);
    expect(irrMonthly([{ t: 0, amount: 100 }, { t: 1, amount: 50 }]).ok).toBe(false);
  });
});

describe("installmentIrr 分期真实年化", () => {
  it("经典场景：借 12000、12 期、每期 1060（月费率 0.5% 口径）→ 名义年化 ≈ 10.9%", () => {
    const r = installmentIrr(12000, 1060, 12);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.annualNominal * 100).toBeGreaterThan(10.5);
      expect(r.value.annualNominal * 100).toBeLessThan(11.3);
      expect(r.value.totalPayment).toBeCloseTo(12720, 8);
      expect(r.value.totalCost).toBeCloseTo(720, 8);
    }
  });

  it("前置手续费拉高真实年化", () => {
    const base = installmentIrr(10000, 900, 12);
    const withFee = installmentIrr(10000, 900, 12, 200);
    expect(base.ok && withFee.ok).toBe(true);
    if (base.ok && withFee.ok) {
      expect(withFee.value.annualNominal).toBeGreaterThan(base.value.annualNominal);
      expect(withFee.value.nominalFeeRate).toBeGreaterThan(0);
    }
  });

  it("有效年化 > 名义年化（月利率为正时）", () => {
    const r = installmentIrr(12000, 1060, 12);
    if (r.ok) expect(r.value.annualEffective).toBeGreaterThan(r.value.annualNominal);
  });

  it("非法输入返回中文错误", () => {
    expect(installmentIrr(0, 100, 12).ok).toBe(false);
    expect(installmentIrr(1000, 100, 0).ok).toBe(false);
    expect(installmentIrr(1000, 10, 12).ok).toBe(false); // 总还款 < 到手
    expect(installmentIrr(1000, 100, 12, 1000).ok).toBe(false); // 费用=本金
  });
});
