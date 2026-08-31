import { describe, expect, it } from "vitest";
import { convertRadix, parseRadix, RADIX_CARDS, RADIX_DIGITS, toRadix } from "../radix";

describe("parseRadix", () => {
  it("十六进制大小写均可：ff / FF / Ff = 255", () => {
    expect(parseRadix("ff", 16)).toBe(255n);
    expect(parseRadix("FF", 16)).toBe(255n);
    expect(parseRadix("Ff", 16)).toBe(255n);
  });

  it("0x/0o/0b 前缀仅在 from 匹配时剥离", () => {
    expect(parseRadix("0x1A", 16)).toBe(26n);
    expect(parseRadix("0X1a", 16)).toBe(26n);
    expect(parseRadix("0o17", 8)).toBe(15n);
    expect(parseRadix("0b101", 2)).toBe(5n);
    // from=10 时 x 不是合法十进制字符 → null；前缀后无数字 → null
    expect(parseRadix("0x1A", 10)).toBeNull();
    expect(parseRadix("0x", 16)).toBeNull();
  });

  it("允许前导 -/+ 与负数", () => {
    expect(parseRadix("-ff", 16)).toBe(-255n);
    expect(parseRadix("+255", 10)).toBe(255n);
    expect(parseRadix("-0", 10)).toBe(0n);
    expect(parseRadix("-0x10", 16)).toBe(-16n);
  });

  it("非法输入返回 null", () => {
    expect(parseRadix("12g", 16)).toBeNull(); // g 超出 16 进制字符集
    expect(parseRadix("", 10)).toBeNull(); // 空串
    expect(parseRadix("-", 10)).toBeNull(); // 只有符号
    expect(parseRadix("2", 2)).toBeNull(); // 数字 2 超出二进制
    expect(parseRadix(" 1", 10)).toBeNull(); // 空白也是非法字符
  });

  it("进制越界（1 / 37 / 非整数）返回 null", () => {
    expect(parseRadix("1", 1)).toBeNull();
    expect(parseRadix("1", 37)).toBeNull();
    expect(parseRadix("1", 2.5)).toBeNull();
  });

  it("大数解析：2^64 的十进制与十六进制一致", () => {
    expect(parseRadix("18446744073709551616", 10)).toBe(2n ** 64n);
    expect(parseRadix("10000000000000000", 16)).toBe(2n ** 64n);
  });
});

describe("toRadix", () => {
  it("255 → 十六进制 ff", () => {
    expect(toRadix(255n, 16)).toBe("ff");
  });

  it("0 任意进制 → \"0\"", () => {
    expect(toRadix(0n, 2)).toBe("0");
    expect(toRadix(0n, 16)).toBe("0");
    expect(toRadix(0n, 36)).toBe("0");
  });

  it("负数带 - 前缀", () => {
    expect(toRadix(-255n, 10)).toBe("-255");
    expect(toRadix(-255n, 16)).toBe("-ff");
  });

  it("2^64 十进制 → 十六进制 \"10000000000000000\" 再转回恒等", () => {
    const v = 18446744073709551616n;
    const hex = toRadix(v, 16);
    expect(hex).toBe("10000000000000000");
    expect(parseRadix(hex, 16)).toBe(v);
  });

  it("2^16 → 二进制 1 后跟 16 个 0", () => {
    expect(toRadix(65536n, 2)).toBe("10000000000000000");
  });

  it("to 越界（1 / 37）抛错", () => {
    expect(() => toRadix(5n, 1)).toThrow();
    expect(() => toRadix(5n, 37)).toThrow();
  });
});

describe("convertRadix", () => {
  it("负数 -ff 16→10 = -255", () => {
    expect(convertRadix("-ff", 16, 10)).toEqual({ ok: true, value: "-255" });
  });

  it("0 任意进制互转 → \"0\"", () => {
    expect(convertRadix("0", 2, 16)).toEqual({ ok: true, value: "0" });
    expect(convertRadix("0", 16, 10)).toEqual({ ok: true, value: "0" });
    expect(convertRadix("0", 10, 8)).toEqual({ ok: true, value: "0" });
    expect(convertRadix("0000", 36, 2)).toEqual({ ok: true, value: "0" });
  });

  it("2↔16 往返恒等（含大数）", () => {
    expect(convertRadix("11111111", 2, 16)).toEqual({ ok: true, value: "ff" });
    expect(convertRadix("ff", 16, 2)).toEqual({ ok: true, value: "11111111" });
    const v = 2n ** 64n + 0xdeadbeefn;
    const bin = toRadix(v, 2);
    expect(parseRadix(bin, 2)).toBe(v);
    expect(convertRadix(bin, 2, 16)).toEqual({ ok: true, value: toRadix(v, 16) });
    expect(parseRadix(toRadix(v, 16), 16)).toBe(v);
  });

  it("错误路径返回 ok:false 且带中文信息", () => {
    const bad = convertRadix("12g", 16, 10);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message.length).toBeGreaterThan(0);
    expect(convertRadix("10", 1, 10).ok).toBe(false); // 源进制 1
    expect(convertRadix("10", 10, 37).ok).toBe(false); // 目标进制 37
    expect(convertRadix("", 10, 2).ok).toBe(false); // 空串
  });
});

describe("RADIX_DIGITS / RADIX_CARDS", () => {
  it("RADIX_DIGITS 为标准 36 位数字表", () => {
    expect(RADIX_DIGITS).toBe("0123456789abcdefghijklmnopqrstuvwxyz");
  });

  it("RADIX_CARDS 覆盖 2/8/10/16 四卡", () => {
    expect(RADIX_CARDS.map((c) => c.base)).toEqual([2, 8, 10, 16]);
    for (const c of RADIX_CARDS) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.hint.length).toBeGreaterThan(0);
    }
  });
});
