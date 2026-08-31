import { describe, expect, it } from "vitest";
import { monthlyPayment, prepayAfter, schedule, summarize, type Method } from "../mortgage";

/** 权威基准：100 万贷款、年利率 4.9%、30 年（360 期） */
const TOTAL = 1_000_000;
const RATE = 0.049;
const MONTHS = 360;

/** 金额绝对误差断言（银行标准值容差） */
function expectMoney(actual: number, expected: number, tol: number, label = ""): void {
  expect(Math.abs(actual - expected), `${label} 期望 ${expected}，实际 ${actual}`).toBeLessThanOrEqual(tol);
}

/** 舍入到分（仅断言银行公布的分级数值时使用） */
const round2 = (x: number): number => Math.round(x * 100) / 100;

describe("monthlyPayment 等额本息月供", () => {
  it("基准：100万 / 4.9% / 360期 → 月供 5307.27（银行通用值，舍入到分）", () => {
    expect(round2(monthlyPayment(TOTAL, RATE, MONTHS))).toBe(5307.27);
  });

  it("利率为 0：月供精确等于 P/n", () => {
    expect(monthlyPayment(1_200_000, 0, 120)).toBe(10_000);
    expect(monthlyPayment(TOTAL, 0, MONTHS)).toBeCloseTo(TOTAL / MONTHS, 12);
  });

  it("非法输入抛中文错误", () => {
    expect(() => monthlyPayment(0, RATE, MONTHS)).toThrow(/大于 0/);
    expect(() => monthlyPayment(-100, RATE, MONTHS)).toThrow(/大于 0/);
    expect(() => monthlyPayment(NaN, RATE, MONTHS)).toThrow(/大于 0/);
    expect(() => monthlyPayment(TOTAL, -0.01, MONTHS)).toThrow(/负数/);
    expect(() => monthlyPayment(TOTAL, 0, 0)).toThrow(/正整数/);
    expect(() => monthlyPayment(TOTAL, 0, -12)).toThrow(/正整数/);
    expect(() => monthlyPayment(TOTAL, RATE, 360.5)).toThrow(/正整数/);
  });
});

describe("summarize 方案汇总", () => {
  it("等额本息基准：总利息 ≈ 910616.19（±0.01）", () => {
    const s = summarize(TOTAL, RATE, MONTHS, "installment");
    expectMoney(s.totalInterest, 910_616.19, 0.01, "等额本息总利息");
    expectMoney(s.totalPayment, TOTAL + 910_616.19, 0.02, "等额本息总还款");
    // 等额本息首月月供 = 末月月供 = 月供
    expect(s.monthlyFirst).toBe(monthlyPayment(TOTAL, RATE, MONTHS));
    expect(s.monthlyLast).toBe(monthlyPayment(TOTAL, RATE, MONTHS));
  });

  it("等额本金基准：首月 6861.11、末月 2789.12、总利息 = P·r·(n+1)/2 闭式值（±0.01）", () => {
    const s = summarize(TOTAL, RATE, MONTHS, "principal");
    expect(round2(s.monthlyFirst)).toBe(6861.11);
    // 末月 = P/n + (P/n)·r 闭式值（= 2789.12，与闭式总利息自洽）
    const r = RATE / 12;
    expectMoney(s.monthlyLast, (TOTAL / MONTHS) * (1 + r), 0.01, "等额本金末月月供");
    expectMoney(s.monthlyLast, 2789.12, 0.01, "等额本金末月月供（分级）");
    expectMoney(s.totalInterest, (TOTAL * r * (MONTHS + 1)) / 2, 0.01, "等额本金总利息闭式");
    expectMoney(s.totalInterest, 737_041.67, 0.01, "等额本金总利息（分级）");
  });

  it("同本金对比：等额本金总利息少于等额本息，本金总额相同", () => {
    const inst = summarize(TOTAL, RATE, MONTHS, "installment");
    const prin = summarize(TOTAL, RATE, MONTHS, "principal");
    expect(prin.totalInterest).toBeLessThan(inst.totalInterest);
    // 两种方式偿还的本金相同：总还款 − 总利息 = 贷款本金
    expectMoney(prin.totalPayment - prin.totalInterest, TOTAL, 1e-6, "等额本金本金合计");
    expectMoney(inst.totalPayment - inst.totalInterest, TOTAL, 1e-6, "等额本息本金合计");
  });

  it("利率为 0：两种方式总利息均为 0", () => {
    expect(summarize(TOTAL, 0, 120, "installment").totalInterest).toBe(0);
    expect(summarize(TOTAL, 0, 120, "principal").totalInterest).toBe(0);
  });
});

describe("schedule 逐期还款表不变量", () => {
  const methods: Method[] = ["installment", "principal"];
  for (const method of methods) {
    const name = method === "installment" ? "等额本息" : "等额本金";

    it(`${name}：全部本金之和 = 贷款总额（±1e-6）`, () => {
      const rows = schedule(TOTAL, RATE, MONTHS, method);
      const sum = rows.reduce((acc, row) => acc + row.principal, 0);
      expectMoney(sum, TOTAL, 1e-6, `${name}本金合计`);
    });

    it(`${name}：全部月供之和 = summarize.totalPayment（±1e-6）`, () => {
      const rows = schedule(TOTAL, RATE, MONTHS, method);
      const sum = rows.reduce((acc, row) => acc + row.payment, 0);
      expectMoney(sum, summarize(TOTAL, RATE, MONTHS, method).totalPayment, 1e-6, `${name}月供合计`);
    });

    it(`${name}：末期剩余本金精确归零（±1e-6），期数正确`, () => {
      const rows = schedule(TOTAL, RATE, MONTHS, method);
      expect(rows.length).toBe(MONTHS);
      expect(Math.abs(rows[rows.length - 1].remaining)).toBeLessThan(1e-6);
    });

    it(`${name}：每期 payment = principal + interest，剩余本金逐期递减`, () => {
      const rows = schedule(TOTAL, RATE, MONTHS, method);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        expect(row.period).toBe(i + 1);
        expect(row.payment).toBeCloseTo(row.principal + row.interest, 9);
        expect(row.principal).toBeGreaterThan(0);
        if (i > 0) expect(row.remaining).toBeLessThan(rows[i - 1].remaining);
      }
    });

    it(`${name}：利率为 0 时无利息且每月本金均等`, () => {
      const rows = schedule(1_200_000, 0, 120, method);
      for (const row of rows) {
        expect(row.interest).toBe(0);
        expect(row.principal).toBeCloseTo(10_000, 9);
      }
      expect(Math.abs(rows[rows.length - 1].remaining)).toBeLessThan(1e-6);
    });
  }

  it("等额本金月供逐月递减", () => {
    const rows = schedule(TOTAL, RATE, MONTHS, "principal");
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].payment).toBeLessThan(rows[i - 1].payment);
    }
  });
});

describe("prepayAfter 提前还款测算", () => {
  it("基准：等额本息第 60 期后提前还 20 万、剩余期数不变 → 省息为正、月供下降", () => {
    const res = prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 200_000);
    expect(res.savedInterest).toBeGreaterThan(0);
    expect(res.newMonthly).toBeLessThan(5307.27);
  });

  it("savedInterest 与 schedule 拼接手工重算一致（±0.01）", () => {
    const payPeriod = 60;
    const prepay = 200_000;

    const res = prepayAfter(TOTAL, RATE, MONTHS, "installment", payPeriod, prepay);

    // 手工重算：原方案前 60 期利息 + 还完后的剩余本金 − 20 万 → 按 300 期重新出方案
    const original = schedule(TOTAL, RATE, MONTHS, "installment");
    let paidInterest = 0;
    for (let i = 0; i < payPeriod; i++) paidInterest += original[i].interest;
    const newTotal = original[payPeriod - 1].remaining - prepay;
    const fresh = schedule(newTotal, RATE, MONTHS - payPeriod, "installment");
    let newInterest = 0;
    for (const row of fresh) newInterest += row.interest;
    const originalInterest = summarize(TOTAL, RATE, MONTHS, "installment").totalInterest;

    expectMoney(res.savedInterest, originalInterest - (paidInterest + newInterest), 0.01, "节省利息");
    expectMoney(res.newMonthly, fresh[0].payment, 0.01, "新月供");
  });

  it("等额本金方式提前还款同样省息", () => {
    const res = prepayAfter(TOTAL, RATE, MONTHS, "principal", 60, 200_000);
    const originInterest = summarize(TOTAL, RATE, MONTHS, "principal").totalInterest;
    expect(res.savedInterest).toBeGreaterThan(0);
    expect(res.savedInterest).toBeLessThan(originInterest);
  });

  it("指定缩短期数（newMonths）时新月供更高、节省利息更多", () => {
    const keep = prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 200_000);
    const shorten = prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 200_000, 120);
    expect(shorten.newMonthly).toBeGreaterThan(keep.newMonthly);
    expect(shorten.savedInterest).toBeGreaterThan(keep.savedInterest);
  });

  it("非法输入抛中文错误", () => {
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 0, 200_000)).toThrow(/正整数/);
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60.5, 200_000)).toThrow(/正整数/);
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", MONTHS, 200_000)).toThrow(/小于总期数/);
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 0)).toThrow(/大于 0/);
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, -1)).toThrow(/大于 0/);
    // 提前还款金额超过剩余本金
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 2_000_000)).toThrow(/剩余本金/);
    // newMonths 非法
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 200_000, 0)).toThrow(/正整数/);
    expect(() => prepayAfter(TOTAL, RATE, MONTHS, "installment", 60, 200_000, 12.5)).toThrow(/正整数/);
  });
});
