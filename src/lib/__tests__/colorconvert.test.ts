import { describe, expect, it } from "vitest";
import {
  hexToRgb,
  hslToRgb,
  hslToString,
  normalizeHex,
  parseHsl,
  parseRgb,
  rgbToHex,
  rgbToHsl,
  rgbToString,
} from "../colorconvert";

describe("hexToRgb HEX 解析", () => {
  it("#FFF 短写展开为白色", () => {
    const res = hexToRgb("#FFF");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("#000000 完整写法", () => {
    const res = hexToRgb("#000000");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("大小写与无 # 写法等价", () => {
    for (const input of ["#fff", "#FFFFFF", "fff", "#FfF", " FFFFfF ".trim()]) {
      const res = hexToRgb(input);
      expect(res.ok, `hexToRgb(${input}) 应成功`).toBe(true);
      if (res.ok) expect(res.value).toEqual({ r: 255, g: 255, b: 255 });
    }
    const mixed = hexToRgb("#3a7BdE");
    expect(mixed.ok).toBe(true);
    if (mixed.ok) expect(mixed.value).toEqual({ r: 0x3a, g: 0x7b, b: 0xde });
  });

  it("非法 hex 报错", () => {
    for (const bad of ["", "#", "#GGG", "#12345", "#1234567", "zzzzzz", "12"]) {
      const res = hexToRgb(bad);
      expect(res.ok, `hexToRgb(${JSON.stringify(bad)}) 应失败`).toBe(false);
      if (!res.ok) expect(res.message.length).toBeGreaterThan(0);
    }
  });
});

describe("rgbToHex RGB → HEX", () => {
  it("常规转换输出大写 #RRGGBB", () => {
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
    expect(rgbToHex(58, 123, 222)).toBe("#3A7BDE");
  });

  it("越界分量收敛到 0-255，小数四舍五入", () => {
    expect(rgbToHex(300, -5, 128.4)).toBe("#FF0080");
  });
});

describe("normalizeHex 归一化", () => {
  it("短写与无 # 归一为 #RRGGBB", () => {
    const white = normalizeHex("#fff");
    expect(white.ok).toBe(true);
    if (white.ok) expect(white.value).toBe("#FFFFFF");
    const res = normalizeHex("abc");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe("#AABBCC");
  });

  it("非法输入报错", () => {
    const res = normalizeHex("nope");
    expect(res.ok).toBe(false);
  });
});

describe("rgbToHsl / hslToRgb 往返", () => {
  it("纯红 255,0,0 → hsl(0, 100%, 50%) → 回 255,0,0", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("原色与灰阶往返一致", () => {
    const cases: Array<[number, number, number]> = [
      [255, 0, 0],
      [0, 128, 0],
      [0, 0, 255],
      [255, 255, 255],
      [0, 0, 0],
      [128, 128, 128],
      [255, 128, 0],
    ];
    for (const [r, g, b] of cases) {
      const hsl = rgbToHsl(r, g, b);
      expect(hslToRgb(hsl.h, hsl.s, hsl.l), `rgb(${r},${g},${b}) 往返`).toEqual({ r, g, b });
    }
  });

  it("hsl 中间值：hsl(120,100,25) 与 hsl(240,100,50)", () => {
    expect(hslToRgb(120, 100, 25)).toEqual({ r: 0, g: 128, b: 0 });
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
    expect(rgbToHsl(0, 128, 0)).toEqual({ h: 120, s: 100, l: 25 });
  });

  it("色相按 360 循环、灰阶饱和度为 0", () => {
    expect(hslToRgb(360, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb(720, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
    expect(rgbToHsl(120, 120, 120).s).toBe(0);
  });
});

describe("parseRgb / parseHsl 文本解析", () => {
  it("rgb 括号与逗号/空格分隔均可", () => {
    expect(parseRgb("rgb(255, 0, 0)")).toEqual({ ok: true, value: { r: 255, g: 0, b: 0 } });
    expect(parseRgb("255 128 0")).toEqual({ ok: true, value: { r: 255, g: 128, b: 0 } });
  });

  it("rgb 非法分量报错", () => {
    expect(parseRgb("256, 0, 0").ok).toBe(false);
    expect(parseRgb("1, 2").ok).toBe(false);
    expect(parseRgb("a, b, c").ok).toBe(false);
  });

  it("hsl 常规解析", () => {
    expect(parseHsl("hsl(0, 100%, 50%)")).toEqual({ ok: true, value: { h: 0, s: 100, l: 50 } });
    expect(parseHsl("240 50% 25%")).toEqual({ ok: true, value: { h: 240, s: 50, l: 25 } });
  });

  it("hsl 非法输入报错", () => {
    expect(parseHsl("361, 0%, 0%").ok).toBe(false);
    expect(parseHsl("0, 120%, 0%").ok).toBe(false);
    expect(parseHsl("0, 100, 50").ok).toBe(false);
    expect(parseHsl("").ok).toBe(false);
  });
});

describe("格式化输出", () => {
  it("rgbToString / hslToString", () => {
    expect(rgbToString({ r: 255, g: 0, b: 0 })).toBe("rgb(255, 0, 0)");
    expect(hslToString({ h: 0, s: 100, l: 50 })).toBe("hsl(0, 100%, 50%)");
  });
});
