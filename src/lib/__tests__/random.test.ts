import { describe, expect, it } from "vitest";
import { makeSeededRandomInt, secureRandomInt } from "../random";

describe("secureRandomInt", () => {
  it("maxExclusive=1 恒返回 0", () => {
    for (let i = 0; i < 100; i++) expect(secureRandomInt(1)).toBe(0);
  });

  it("maxExclusive<=0 / 非整数 / 非有限数抛错", () => {
    expect(() => secureRandomInt(0)).toThrow();
    expect(() => secureRandomInt(-3)).toThrow();
    expect(() => secureRandomInt(1.5)).toThrow();
    expect(() => secureRandomInt(Number.NaN)).toThrow();
  });

  it("1 万次采样全部落在 [0, max)", () => {
    for (let i = 0; i < 10000; i++) {
      const x = secureRandomInt(100);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(100);
    }
  });

  it("分布粗检：10 桶各占比相对偏差 <20%", () => {
    const max = 10;
    const total = 10000;
    const buckets = new Array<number>(max).fill(0);
    for (let i = 0; i < total; i++) buckets[secureRandomInt(max)]++;
    const expected = total / max;
    for (const c of buckets) {
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.2);
    }
  });

  it("maxExclusive 超过 2^32（走 53 位路径）仍落在范围内", () => {
    const max = 2 ** 40;
    for (let i = 0; i < 200; i++) {
      const x = secureRandomInt(max);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(max);
    }
  });
});

describe("makeSeededRandomInt", () => {
  it("maxExclusive=1 恒返回 0", () => {
    const rng = makeSeededRandomInt(42);
    for (let i = 0; i < 50; i++) expect(rng(1)).toBe(0);
  });

  it("maxExclusive<=0 抛错", () => {
    const rng = makeSeededRandomInt(1);
    expect(() => rng(0)).toThrow();
    expect(() => rng(-1)).toThrow();
  });

  it("同 seed 序列可复现", () => {
    const a = makeSeededRandomInt(2024);
    const b = makeSeededRandomInt(2024);
    for (let i = 0; i < 200; i++) expect(a(1000)).toBe(b(1000));
  });

  it("不同 seed 序列不同", () => {
    const a = makeSeededRandomInt(1);
    const b = makeSeededRandomInt(2);
    const seqA = Array.from({ length: 20 }, () => a(1_000_000_000));
    const seqB = Array.from({ length: 20 }, () => b(1_000_000_000));
    expect(seqA).not.toEqual(seqB);
  });

  it("1 万次采样落在 [0, max) 且分布粗检通过", () => {
    const rng = makeSeededRandomInt(7);
    const max = 5;
    const total = 10000;
    const buckets = new Array<number>(max).fill(0);
    for (let i = 0; i < total; i++) {
      const x = rng(max);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(max);
      buckets[x]++;
    }
    const expected = total / max;
    for (const c of buckets) {
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.2);
    }
  });
});
