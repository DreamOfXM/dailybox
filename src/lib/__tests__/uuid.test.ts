import { describe, expect, it } from "vitest";
import { makeSeededRandomInt } from "../random";
import { generateBatch, randomNumber, uuidV4, uuidV7 } from "../uuid";

const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidV4", () => {
  it("符合 8-4-4-4-12 小写格式，version=4、variant∈[89ab]", () => {
    for (let i = 0; i < 200; i++) expect(uuidV4()).toMatch(V4_RE);
  });

  it("注入种子 rng 后结果可复现", () => {
    const a = uuidV4(makeSeededRandomInt(99));
    const b = uuidV4(makeSeededRandomInt(99));
    expect(a).toBe(b);
    expect(a).toMatch(V4_RE);
    expect(uuidV4(makeSeededRandomInt(100))).not.toBe(a);
  });
});

describe("uuidV7", () => {
  it("version=7、variant∈[89ab]，缺省时间为当前时刻", () => {
    for (let i = 0; i < 200; i++) expect(uuidV7()).toMatch(V7_RE);
  });

  it("前 48 位为 unix 毫秒时间戳 hex（1000=0x3e8，2000=0x7d0）", () => {
    expect(uuidV7(1000).startsWith("00000000-03e8-")).toBe(true);
    expect(uuidV7(2000).startsWith("00000000-07d0-")).toBe(true);
  });

  it("时间序：now=1000 生成的 uuid 字典序 < now=2000", () => {
    for (let i = 0; i < 50; i++) {
      expect(uuidV7(1000) < uuidV7(2000)).toBe(true);
    }
  });

  it("注入种子 rng 后结果可复现", () => {
    const a = uuidV7(12345, makeSeededRandomInt(7));
    const b = uuidV7(12345, makeSeededRandomInt(7));
    expect(a).toBe(b);
    expect(a).toMatch(V7_RE);
  });
});

describe("generateBatch", () => {
  it("批量 10000 个 v4 无重复且格式合法", () => {
    const list = generateBatch(10000, 4);
    expect(list).toHaveLength(10000);
    expect(new Set(list).size).toBe(10000);
    for (const s of list) expect(s).toMatch(V4_RE);
  });

  it("v7 批量支持固定 now，全部共享时间戳前缀", () => {
    const list = generateBatch(10, 7, { now: 1000 });
    for (const s of list) {
      expect(s).toMatch(V7_RE);
      expect(s.startsWith("00000000-03e8-")).toBe(true);
    }
    expect(new Set(list).size).toBe(10);
  });

  it("upper 与 noDash 选项", () => {
    const V4_UPPER_RE = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
    for (const s of generateBatch(4, 4, { upper: true })) {
      expect(s).toMatch(V4_UPPER_RE);
    }
    for (const s of generateBatch(4, 7, { noDash: true, upper: true })) {
      expect(s).toMatch(/^[0-9A-F]{32}$/);
    }
  });

  it("n 超过 10000 或为负数抛错", () => {
    expect(() => generateBatch(10001, 4)).toThrow();
    expect(() => generateBatch(-1, 7)).toThrow();
    expect(generateBatch(0, 4)).toEqual([]);
  });
});

describe("randomNumber", () => {
  it("结果落在 [min, max] 内", () => {
    const rng = makeSeededRandomInt(5);
    for (let i = 0; i < 1000; i++) {
      const v = randomNumber({ min: 3, max: 8 }, rng);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(8);
    }
  });

  it("decimals 控制小数位（四舍五入）", () => {
    const rng = makeSeededRandomInt(11);
    for (let i = 0; i < 1000; i++) {
      const v = randomNumber({ min: 0, max: 10, decimals: 2 }, rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
      expect(Number(v.toFixed(2))).toBe(v);
    }
  });

  it("decimals=0 返回整数", () => {
    const rng = makeSeededRandomInt(3);
    for (let i = 0; i < 500; i++) {
      const v = randomNumber({ min: -5, max: 5, decimals: 0 }, rng);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it("min>max 抛错", () => {
    expect(() => randomNumber({ min: 9, max: 1 })).toThrow();
  });

  it("注入种子 rng 后可复现", () => {
    const a = randomNumber({ min: 0, max: 100, decimals: 3 }, makeSeededRandomInt(42));
    const b = randomNumber({ min: 0, max: 100, decimals: 3 }, makeSeededRandomInt(42));
    expect(a).toBe(b);
  });

  it("min=max 时恒返回该值", () => {
    expect(randomNumber({ min: 7, max: 7 })).toBe(7);
  });
});
