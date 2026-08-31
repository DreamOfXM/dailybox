import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { isValidCnMobile, lookupPhone, lookupRange, type PhoneData } from "../phone";

// 加载真实打包数据（与线上 public/phone-data.json 同一文件）
const DATA_PATH = resolve(__dirname, "../../../public/phone-data.json");
let data: PhoneData;

beforeAll(() => {
  data = JSON.parse(readFileSync(DATA_PATH, "utf8")) as PhoneData;
});

describe("数据完整性", () => {
  it("号段区间数量级正确（≥40 万原始号段压缩而来，区间数 5 万-20 万）", () => {
    expect(data.ranges.length).toBeGreaterThan(50000);
    expect(data.ranges.length).toBeLessThan(200000);
  });

  it("区间严格升序且不重叠", () => {
    for (let i = 1; i < data.ranges.length; i++) {
      const prev = data.ranges[i - 1];
      const cur = data.ranges[i];
      expect(prev[1]).toBeLessThan(cur[0]); // 上区间结束 < 下区间开始
      expect(cur[0]).toBeLessThanOrEqual(cur[1]);
    }
  });

  it("字典索引不越界", () => {
    for (const row of data.ranges) {
      expect(row[2]).toBeGreaterThanOrEqual(0);
      expect(row[2]).toBeLessThan(data.provinces.length);
      expect(row[3]).toBeLessThan(data.cities.length);
      expect(row[4]).toBeLessThan(data.isps.length);
    }
  });

  it("运营商集合合理（移动/联通/电信为主）", () => {
    expect(data.isps.join()).toMatch(/移动/);
    expect(data.isps.join()).toMatch(/联通/);
    expect(data.isps.join()).toMatch(/电信/);
  });
});

describe("已知号段抽样（权威事实）", () => {
  it("13800138000 → 北京 移动", () => {
    const r = lookupPhone(data, "13800138000");
    expect(r).not.toBeNull();
    expect(r!.province).toBe("北京");
    expect(r!.isp).toBe("移动");
  });

  it("18601750925 → 上海 联通", () => {
    const r = lookupPhone(data, "18601750925");
    expect(r).not.toBeNull();
    expect(r!.province).toBe("上海");
    expect(r!.isp).toBe("联通");
  });

  it("随机 500 个号段与原始数据字典交叉一致", () => {
    // 从区间中随机抽样，验证 lookupRange 返回的行与二分位置一致
    let seed = 99;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 500; i++) {
      const idx = Math.floor(rnd() * data.ranges.length);
      const row = data.ranges[idx];
      const mid = row[0] + Math.floor(rnd() * (row[1] - row[0] + 1));
      const hit = lookupRange(data.ranges, mid);
      expect(hit).not.toBeNull();
      expect(hit![0]).toBe(row[0]);
      expect(hit![1]).toBe(row[1]);
    }
  });
});

describe("输入校验与边界", () => {
  it("非法号码返回 null 不抛错", () => {
    expect(lookupPhone(data, "12345")).toBeNull();
    expect(lookupPhone(data, "2380013800")).toBeNull(); // 非 1 开头
    expect(lookupPhone(data, "12800138000")).toBeNull(); // 第二位 2 非法
    expect(lookupPhone(data, "1380013800a")).toBeNull();
    expect(lookupPhone(data, "")).toBeNull();
  });

  it("isValidCnMobile 边界", () => {
    expect(isValidCnMobile("13800138000")).toBe(true);
    expect(isValidCnMobile("19912345678")).toBe(true);
    expect(isValidCnMobile("1380013800")).toBe(false); // 10 位
    expect(isValidCnMobile("138001380001")).toBe(false); // 12 位
    expect(isValidCnMobile(" 13800138000 ")).toBe(true); // 允许首尾空白
  });

  it("号段未覆盖的号码段返回 null（不瞎编）", () => {
    // 构造一个可能不在数据里的 1 开头号码：遍历数据找空洞不现实，
    // 此处仅验证 lookupRange 对超出全部区间的值返回 null
    const beyond = data.ranges[data.ranges.length - 1][1] + 1;
    expect(lookupRange(data.ranges, beyond)).toBeNull();
    expect(lookupRange(data.ranges, 0)).toBeNull();
  });
});
