import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { isValidCnMobile, lookupInShard, lookupRange, type PhoneShard } from "../phone";

// 加载全部分片（与线上 public/phone-data-*.json 同一批文件）
const PUBLIC_DIR = resolve(__dirname, "../../../public");
const shards = new Map<string, PhoneShard>();

beforeAll(() => {
  const files = readdirSync(PUBLIC_DIR).filter((f) => /^phone-data-\d{2}\.json$/.test(f)).sort();
  expect(files.length).toBe(7); // 13x-19x
  for (const f of files) {
    const key = f.match(/phone-data-(\d{2})\.json/)![1];
    shards.set(key, JSON.parse(readFileSync(resolve(PUBLIC_DIR, f), "utf8")) as PhoneShard);
  }
});

describe("数据完整性", () => {
  it("7 个分片覆盖 13-19 全部号段前缀", () => {
    expect([...shards.keys()].sort()).toEqual(["13", "14", "15", "16", "17", "18", "19"]);
  });

  it("总区间数与压缩前一致（135983）", () => {
    let total = 0;
    for (const s of shards.values()) total += s.ranges.length;
    expect(total).toBe(135983);
  });

  it("每个分片内区间严格升序且不重叠", () => {
    for (const [key, s] of shards) {
      for (let i = 1; i < s.ranges.length; i++) {
        const prev = s.ranges[i - 1];
        const cur = s.ranges[i];
        expect(prev[1], `shard ${key} row ${i}`).toBeLessThan(cur[0]);
        expect(cur[0]).toBeLessThanOrEqual(cur[1]);
      }
    }
  });

  it("分片内号段前两位与分片键一致", () => {
    for (const [key, s] of shards) {
      for (const row of s.ranges) {
        expect(String(row[0]).slice(0, 2)).toBe(key);
      }
    }
  });

  it("字典索引不越界", () => {
    for (const s of shards.values()) {
      for (const row of s.ranges) {
        expect(row[2]).toBeLessThan(s.provinces.length);
        expect(row[3]).toBeLessThan(s.cities.length);
        expect(row[4]).toBeLessThan(s.isps.length);
      }
    }
  });
});

describe("已知号段抽样（权威事实）", () => {
  it("13800138000 → 北京 移动", () => {
    const r = lookupInShard(shards.get("13")!, "13800138000");
    expect(r).not.toBeNull();
    expect(r!.province).toBe("北京");
    expect(r!.isp).toBe("移动");
  });

  it("18601750925 → 上海 联通", () => {
    const r = lookupInShard(shards.get("18")!, "18601750925");
    expect(r).not.toBeNull();
    expect(r!.province).toBe("上海");
    expect(r!.isp).toBe("联通");
  });

  it("19210617486 → 浙江 杭州 广电（192 号段覆盖）", () => {
    const r = lookupInShard(shards.get("19")!, "19210617486");
    expect(r).not.toBeNull();
    expect(r!.province).toBe("浙江");
    expect(r!.city).toBe("杭州");
    expect(r!.isp).toBe("广电");
  });

  it("随机 500 个区间抽样与二分查找一致", () => {
    let seed = 99;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (const s of shards.values()) {
      for (let i = 0; i < 70; i++) {
        const idx = Math.floor(rnd() * s.ranges.length);
        const row = s.ranges[idx];
        const mid = row[0] + Math.floor(rnd() * (row[1] - row[0] + 1));
        const hit = lookupRange(s.ranges, mid);
        expect(hit).not.toBeNull();
        expect(hit![0]).toBe(row[0]);
        expect(hit![1]).toBe(row[1]);
      }
    }
  });
});

describe("输入校验与边界", () => {
  it("非法号码返回 null 不抛错", () => {
    const s = shards.get("13")!;
    expect(lookupInShard(s, "12345")).toBeNull();
    expect(lookupInShard(s, "2380013800")).toBeNull();
    expect(lookupInShard(s, "12800138000")).toBeNull();
    expect(lookupInShard(s, "")).toBeNull();
  });

  it("isValidCnMobile 边界", () => {
    expect(isValidCnMobile("13800138000")).toBe(true);
    expect(isValidCnMobile("19912345678")).toBe(true);
    expect(isValidCnMobile("1380013800")).toBe(false);
    expect(isValidCnMobile("138001380001")).toBe(false);
    expect(isValidCnMobile(" 13800138000 ")).toBe(true);
  });

  it("超出全部区间的值返回 null（不瞎编）", () => {
    for (const s of shards.values()) {
      const beyond = s.ranges[s.ranges.length - 1][1] + 1;
      expect(lookupRange(s.ranges, beyond)).toBeNull();
      expect(lookupRange(s.ranges, 0)).toBeNull();
    }
  });
});
