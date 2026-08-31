import { describe, expect, it } from "vitest";
import { UNIT_CATEGORIES, convert, convertAll, fmtUnit } from "../unit";
import type { UnitCategory, UnitDef } from "../unit";

const cat = (id: string): UnitCategory => {
  const c = UNIT_CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`category ${id} not found`);
  return c;
};

const u = (catId: string, unitId: string): UnitDef => {
  const unit = cat(catId).units.find((x) => x.id === unitId);
  if (!unit) throw new Error(`unit ${catId}/${unitId} not found`);
  return unit;
};

/** 绝对误差 < 1e-9 断言 */
const closeTo = (actual: number, expected: number): void => {
  expect(Math.abs(actual - expected), `expect ${actual} ≈ ${expected}`).toBeLessThan(1e-9);
};

describe("长度换算", () => {
  it("市制：1 里 = 500 m、1 丈 = 10/3 m、1 尺 = 1/3 m", () => {
    expect(convert(1, u("length", "li"), u("length", "m"))).toBe(500);
    closeTo(convert(1, u("length", "zhang"), u("length", "m")), 10 / 3);
    closeTo(convert(1, u("length", "chi"), u("length", "m")), 1 / 3);
  });

  it("英制精确定义：1 mi = 1.609344 km、1 in = 2.54 cm", () => {
    closeTo(convert(1, u("length", "mi"), u("length", "km")), 1.609344);
    closeTo(convert(1, u("length", "in"), u("length", "cm")), 2.54);
  });

  it("海里为精确 1852 m", () => {
    expect(convert(1, u("length", "nmi"), u("length", "m"))).toBe(1852);
  });
});

describe("质量换算", () => {
  it("市制：1 斤 = 0.5 kg、1 两 = 50 g", () => {
    expect(convert(1, u("mass", "jin"), u("mass", "kg"))).toBe(0.5);
    expect(convert(1, u("mass", "liang"), u("mass", "g"))).toBe(50);
  });

  it("国际磅精确定义：1 lb = 0.45359237 kg（≈ 0.453592）", () => {
    closeTo(convert(1, u("mass", "lb"), u("mass", "kg")), 0.45359237);
  });
});

describe("面积换算", () => {
  it("市制：1 亩 = 2000/3 m²、1 顷 = 100 亩、1 分 = 0.1 亩", () => {
    closeTo(convert(1, u("area", "mu"), u("area", "m2")), 2000 / 3); // ≈ 666.666667
    closeTo(convert(1, u("area", "qing"), u("area", "mu")), 100);
    closeTo(convert(1, u("area", "fen"), u("area", "mu")), 0.1);
  });

  it("英制面积由长度定义平方导出：1 ft² = 0.09290304 m²", () => {
    closeTo(convert(1, u("area", "ft2"), u("area", "m2")), 0.09290304);
  });
});

describe("温度换算", () => {
  it("冰点：0°C = 32°F = 273.15 K = 491.67 °R", () => {
    closeTo(convert(0, u("temperature", "c"), u("temperature", "f")), 32);
    closeTo(convert(0, u("temperature", "c"), u("temperature", "k")), 273.15);
    closeTo(convert(0, u("temperature", "c"), u("temperature", "r")), 491.67);
  });

  it("沸点：100°C = 212°F", () => {
    closeTo(convert(100, u("temperature", "c"), u("temperature", "f")), 212);
  });

  it("关键交汇点：-40°C = -40°F", () => {
    closeTo(convert(-40, u("temperature", "c"), u("temperature", "f")), -40);
  });

  it("绝对零度：0 K = -273.15°C", () => {
    closeTo(convert(0, u("temperature", "k"), u("temperature", "c")), -273.15);
  });
});

describe("数据量换算", () => {
  it("二进制进位：1 GB = 1024 MB、1 TB = 1024 GB、8 bit = 1 B", () => {
    expect(convert(1, u("data", "GB"), u("data", "MB"))).toBe(1024);
    expect(convert(1, u("data", "TB"), u("data", "GB"))).toBe(1024);
    expect(convert(8, u("data", "bit"), u("data", "B"))).toBe(1);
  });
});

describe("往返恒等（a→b→a 误差 < 1e-9）", () => {
  const roundTripUnits: Array<[string, string[], number]> = [
    ["length", ["li", "km", "in"], 7.5],
    ["mass", ["jin", "lb", "mg"], 3.25],
    ["area", ["mu", "ha", "ft2"], 12.75],
    ["temperature", ["c", "f", "k"], 37],
    ["data", ["GB", "bit", "KB"], 2.5],
  ];
  for (const [catId, ids, value] of roundTripUnits) {
    it(`${catId}: ${ids.join(" ↔ ")}`, () => {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = u(catId, ids[i]);
          const b = u(catId, ids[j]);
          const back = convert(convert(value, a, b), b, a);
          expect(Math.abs(back - value)).toBeLessThan(1e-9);
        }
      }
    });
  }
});

describe("convertAll", () => {
  it("长度类 1 m：覆盖全部单位且含源单位自身", () => {
    const results = convertAll(cat("length"), 1, "m");
    expect(results).toHaveLength(cat("length").units.length);
    const byId = new Map(results.map((r) => [r.unit.id, r.value]));
    expect(byId.get("m")).toBe(1); // 含源单位自身
    closeTo(byId.get("km") as number, 0.001);
    closeTo(byId.get("cm") as number, 100);
    closeTo(byId.get("ft") as number, 1 / 0.3048);
  });

  it("未知 fromId 返回空数组", () => {
    expect(convertAll(cat("length"), 1, "nope")).toHaveLength(0);
  });
});

describe("fmtUnit 智能格式化", () => {
  it("0 → \"0\"", () => {
    expect(fmtUnit(0)).toBe("0");
  });

  it("大数 → 科学计数", () => {
    const s = fmtUnit(123456789);
    expect(s).toContain("e");
    expect(s).toBe("1.23457e+8");
  });

  it("小数保留 6 位有效数字并去尾零", () => {
    expect(fmtUnit(0.000001)).toBe("0.000001");
    expect(fmtUnit(123.456789)).toBe("123.457");
    expect(fmtUnit(100)).toBe("100");
  });

  it("极值走科学计数", () => {
    expect(fmtUnit(1e15)).toBe("1e+15");
    expect(fmtUnit(5e-10)).toBe("5e-10");
  });

  it("NaN / Infinity → \"—\"", () => {
    expect(fmtUnit(NaN)).toBe("—");
    expect(fmtUnit(Infinity)).toBe("—");
    expect(fmtUnit(-Infinity)).toBe("—");
  });
});
