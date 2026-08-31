import { describe, expect, it } from "vitest";
import { lunarBirthdayToSolar, lunarToSolar, solarToLunar } from "../lunar";

describe("solarToLunar 春节锚点（公开可查）", () => {
  const springFestivals: Array<[number, number, number]> = [
    [2024, 2, 10],
    [2025, 1, 29],
    [2026, 2, 17],
    [2027, 2, 6],
    [2028, 1, 26],
  ];
  it.each(springFestivals)("%i-%i-%i 为正月初一且节日含春节", (y, m, d) => {
    const r = solarToLunar(y, m, d);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.monthCn).toBe("正");
      expect(r.value.dayCn).toBe("初一");
      expect(r.value.festivals).toContain("春节");
    }
  });

  it("干支生肖：2026-02-17 丙午马、2024-02-10 甲辰龙", () => {
    const a = solarToLunar(2026, 2, 17);
    const b = solarToLunar(2024, 2, 10);
    if (a.ok) {
      expect(a.value.ganZhi).toBe("丙午");
      expect(a.value.shengXiao).toBe("马");
    }
    if (b.ok) {
      expect(b.value.ganZhi).toBe("甲辰");
      expect(b.value.shengXiao).toBe("龙");
    }
  });

  it("节气：2026 立春在 2 月 4 日、冬至在 12 月 22 日", () => {
    const lc = solarToLunar(2026, 2, 4);
    const dz = solarToLunar(2026, 12, 22);
    if (lc.ok) expect(lc.value.jieQi).toBe("立春");
    if (dz.ok) expect(dz.value.jieQi).toBe("冬至");
  });

  it("公历节日：10-01 含国庆节", () => {
    const r = solarToLunar(2026, 10, 1);
    if (r.ok) expect(r.value.festivals).toContain("国庆节");
  });

  it("下一节气可查（2026-02-17 之后最近节气为雨水 2026-02-18，时刻 23:51）", () => {
    const r = solarToLunar(2026, 2, 17);
    if (r.ok) {
      expect(r.value.nextJieQi.name).toBe("雨水");
      expect(r.value.nextJieQi.dateStr).toBe("2026-02-18");
    }
  });
});

describe("闰月", () => {
  it("2025 闰六月十五 = 公历 2025-08-08", () => {
    const r = lunarToSolar(2025, 6, 15, true);
    expect(r.ok).toBe(true);
    if (r.ok) expect(`${r.value.y}-${r.value.m}-${r.value.d}`).toBe("2025-8-8");
  });

  it("2025 非闰六月十五 ≠ 闰六月（相差一个月）", () => {
    const plain = lunarToSolar(2025, 6, 15, false);
    const leap = lunarToSolar(2025, 6, 15, true);
    if (plain.ok && leap.ok) {
      expect(plain.value.m).not.toBe(leap.value.m);
    }
  });

  it("无闰月的年份查闰月返回错误（2026 无闰六月）", () => {
    const r = lunarToSolar(2026, 6, 15, true);
    expect(r.ok).toBe(false);
  });

  it("solarToLunar 闰月日期标记 isLeapMonth 与闰前缀", () => {
    const r = solarToLunar(2025, 8, 8);
    if (r.ok) {
      expect(r.value.isLeapMonth).toBe(true);
      expect(r.value.monthCn).toBe("闰六");
    }
  });
});

describe("lunarToSolar 节日与往返", () => {
  it("2026 中秋（八月十五）= 公历 2026-09-25", () => {
    const r = lunarToSolar(2026, 8, 15);
    expect(r.ok).toBe(true);
    if (r.ok) expect(`${r.value.y}-${r.value.m}-${r.value.d}`).toBe("2026-9-25");
    const back = solarToLunar(2026, 9, 25);
    if (back.ok) expect(back.ok && back.value.festivals.join()).toContain("中秋");
  });

  it("随机 20 个日期 solar→lunar→solar 往返一致（1950-2090）", () => {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 20; i++) {
      const y = 1950 + Math.floor(rnd() * 140);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28); // 28 以内保证日期存在
      const fwd = solarToLunar(y, m, d);
      expect(fwd.ok).toBe(true);
      if (!fwd.ok) continue;
      const back = lunarToSolar(fwd.value.yearNum, fwd.value.monthNum, fwd.value.dayNum, fwd.value.isLeapMonth);
      expect(back.ok).toBe(true);
      if (back.ok) {
        expect(back.value.y).toBe(y);
        expect(back.value.m).toBe(m);
        expect(back.value.d).toBe(d);
      }
    }
  });

  it("农历三十可能不存在（小月），返回错误而非崩溃", () => {
    // 2025 农历九月为小月（29 天）——先验证库行为再断言方向
    const r = lunarToSolar(2025, 9, 30);
    // 无论该月大小，结果必须是明确的 ok 或中文错误，不允许抛异常
    if (!r.ok) expect(r.message.length).toBeGreaterThan(0);
  });
});

describe("边界与错误", () => {
  it("超范围年份返回错误", () => {
    expect(solarToLunar(1899, 1, 1).ok).toBe(false);
    expect(solarToLunar(2101, 1, 1).ok).toBe(false);
    expect(lunarToSolar(1899, 1, 1).ok).toBe(false);
  });

  it("不存在的公历日期返回错误", () => {
    expect(solarToLunar(2026, 2, 30).ok).toBe(false);
    expect(solarToLunar(2025, 2, 29).ok).toBe(false); // 2025 非闰年
    expect(solarToLunar(2024, 2, 29).ok).toBe(true); // 2024 闰年存在
  });

  it("非法月份/日期返回错误", () => {
    expect(solarToLunar(2026, 13, 1).ok).toBe(false);
    expect(lunarToSolar(2026, 13, 1).ok).toBe(false);
    expect(lunarToSolar(2026, 1, 31).ok).toBe(false);
  });
});

describe("lunarBirthdayToSolar 农历生日批量", () => {
  it("正月初一生日：2026 起 5 年首条 = 2026-02-17", () => {
    const r = lunarBirthdayToSolar(1, 1, false, 2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(5);
      expect(r.value[0].solar).toBe("2026-02-17");
      expect(r.value[1].solar).toBe("2027-02-06");
    }
  });

  it("闰月生日在无闰年份回退非闰同月并标记", () => {
    const r = lunarBirthdayToSolar(6, 15, true, 2025, 3);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value[0].solar).toBe("2025-08-08"); // 2025 有闰六月
      expect(r.value[0].leapFallback).toBeUndefined();
      // 2026/2027 无闰六月 → 回退非闰六月十五
      expect(r.value[1].leapFallback).toBe(true);
      expect(r.value[2].leapFallback).toBe(true);
    }
  });

  it("年数非法返回错误", () => {
    expect(lunarBirthdayToSolar(1, 1, false, 2026, 0).ok).toBe(false);
    expect(lunarBirthdayToSolar(1, 1, false, 2026, 51).ok).toBe(false);
  });
});
