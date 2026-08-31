import { describe, expect, it } from "vitest";
import { annualizedRate, comparePlans, compound, compoundByPeriods, simpleInterest } from "../deposit";

describe("simpleInterest 单利（银行定期口径）", () => {
  it("10000 元 2.5% 3 年 → 利息 750、本息 10750", () => {
    const r = simpleInterest(10000, 0.025, 3);
    expect(r.interest).toBeCloseTo(750, 8);
    expect(r.maturity).toBeCloseTo(10750, 8);
  });

  it("利率 0 → 本息等于本金", () => {
    const r = simpleInterest(5000, 0, 2);
    expect(r.interest).toBe(0);
    expect(r.maturity).toBe(5000);
  });

  it("非法输入抛中文错误", () => {
    expect(() => simpleInterest(0, 0.02, 1)).toThrow(/本金/);
    expect(() => simpleInterest(100, -0.01, 1)).toThrow(/利率/);
    expect(() => simpleInterest(100, 0.02, 0)).toThrow(/期限/);
  });
});

describe("compound 复利", () => {
  it("10000 元 3% 3 年按年复利 → 本息 10927.27", () => {
    const r = compound(10000, 0.03, 3, 1);
    expect(r.maturity).toBeCloseTo(10927.27, 2);
  });

  it("计息频率越高收益越高（同名义利率）", () => {
    const yearly = compound(10000, 0.04, 5, 1);
    const monthly = compound(10000, 0.04, 5, 12);
    expect(monthly.maturity).toBeGreaterThan(yearly.maturity);
  });

  it("封闭公式 vs 逐期累加交叉验证（50 组随机参数，相对误差 < 1e-9）", () => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 50; i++) {
      const principal = 1e3 + rnd() * 1e7;
      const rate = 0.001 + rnd() * 0.079;
      const years = 1 + Math.floor(rnd() * 10);
      const m = [1, 2, 4, 12][Math.floor(rnd() * 4)];
      const a = compound(principal, rate, years, m);
      const b = compoundByPeriods(principal, rate, years, m);
      expect(Math.abs(a.maturity - b.maturity) / b.maturity).toBeLessThan(1e-9);
    }
  });

  it("计息次数非法抛错", () => {
    expect(() => compound(100, 0.02, 1, 0)).toThrow(/计息次数/);
  });
});

describe("annualizedRate 年化换算", () => {
  it("50000 元 90 天收益 300 → 年化 2.4333%", () => {
    expect(annualizedRate(50000, 300, 90)).toBeCloseTo(0.024333333, 6);
  });

  it("365 天收益等于本金×利率时年化恰为该利率", () => {
    expect(annualizedRate(10000, 250, 365)).toBeCloseTo(0.025, 10);
  });

  it("非法输入抛错", () => {
    expect(() => annualizedRate(0, 10, 30)).toThrow(/本金/);
    expect(() => annualizedRate(100, 10, 0)).toThrow(/天数/);
  });
});

describe("comparePlans 方案对比", () => {
  it("按到期本息降序且标记最优", () => {
    const rs = comparePlans([
      { name: "A 单利", principal: 10000, annualRate: 0.025, years: 3 },
      { name: "B 复利", principal: 10000, annualRate: 0.025, years: 3, compound: true },
      { name: "C 高息单利", principal: 10000, annualRate: 0.03, years: 3 },
    ]);
    expect(rs[0].name).toBe("C 高息单利");
    expect(rs[0].maturity).toBeCloseTo(10900, 8);
    expect(rs[rs.length - 1].name).toBe("A 单利");
    // 复利 > 同利率单利
    const b = rs.find((r) => r.name === "B 复利")!;
    const a = rs.find((r) => r.name === "A 单利")!;
    expect(b.maturity).toBeGreaterThan(a.maturity);
  });

  it("空方案抛错", () => {
    expect(() => comparePlans([])).toThrow(/至少/);
  });
});
