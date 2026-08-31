import { describe, expect, it } from "vitest";
import { PROVINCES, checksum17, upgrade15, validateIdCard } from "../idcard";

/** 固定“当前时间”保证测试确定性：2026-06-15 */
const NOW = new Date(2026, 5, 15);

/** 用 checksum17 构造完整 18 位合法号 */
const buildId = (id17: string): string => id17 + checksum17(id17);

describe("PROVINCES 省份码表", () => {
  it("覆盖 34 个省级区划码", () => {
    expect(Object.keys(PROVINCES)).toHaveLength(34);
    expect(PROVINCES[11]).toBe("北京");
    expect(PROVINCES[44]).toBe("广东");
    expect(PROVINCES[54]).toBe("西藏");
    expect(PROVINCES[82]).toBe("澳门");
  });
});

describe("checksum17 校验码", () => {
  it("按 GB 11643-1999 权重与映射表计算（手算核对：加权和 167 mod 11 = 2 → X）", () => {
    expect(checksum17("11010519491231002")).toBe("X");
  });
});

describe("validateIdCard 校验与解析", () => {
  it("合法号通过：省份、生日、性别、年龄均正确", () => {
    const id = buildId("11010519491231002"); // 校验位为 X
    const res = validateIdCard(id, NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.province).toBe("北京");
    expect(res.value.birth).toBe("1949-12-31");
    expect(res.value.sex).toBe("女"); // 第 17 位 2 为偶数
    expect(res.value.age).toBe(76); // 2026-06-15 时未过 12-31 生日：2026-1949-1
  });

  it("第 17 位奇数为男", () => {
    const id = buildId("11010519491231001");
    const res = validateIdCard(id, NOW);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.sex).toBe("男");
  });

  it("篡改末位 → 校验位不符", () => {
    const id17 = "11010519491231002";
    const check = checksum17(id17); // X
    const res = validateIdCard(id17 + (check === "0" ? "1" : "0"), NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("校验位");
  });

  it("末位小写 x 接受", () => {
    const id = "11010519491231002x"; // checksum17 结果为 X
    const res = validateIdCard(id, NOW);
    expect(res.ok).toBe(true);
  });

  it("13 月生日失败", () => {
    const res = validateIdCard("110105194913010026", NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("生日");
  });

  it("闰年判定：2023-02-29 失败、2024-02-29 通过", () => {
    const bad = validateIdCard(buildId("11010520230229002"), NOW);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toContain("生日");

    const good = validateIdCard(buildId("11010520240229002"), NOW);
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.value.birth).toBe("2024-02-29");
  });

  it("省份代码 90 不存在", () => {
    const res = validateIdCard("900105194912310020", NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("省份");
  });

  it("长度 17 / 19 失败", () => {
    const id = buildId("11010519491231002");
    const r17 = validateIdCard(id.slice(0, 17), NOW);
    expect(r17.ok).toBe(false);
    if (!r17.ok) expect(r17.message).toContain("长度");

    const r19 = validateIdCard(id + "0", NOW);
    expect(r19.ok).toBe(false);
    if (!r19.ok) expect(r19.message).toContain("长度");
  });

  it("含非法字符失败", () => {
    const res = validateIdCard("1101051949123100AB", NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toContain("非法字符");
  });

  it("出生年份超出 1900~当前年范围失败", () => {
    expect(validateIdCard(buildId("11010518991231002"), NOW).ok).toBe(false);
    expect(validateIdCard(buildId("11010520270101002"), NOW).ok).toBe(false);
  });

  it("age 按生日与 now 计算（未过生日减 1）", () => {
    const id = buildId("11010520000615002"); // 生日 2000-06-15
    const before = validateIdCard(id, new Date(2026, 5, 14));
    expect(before.ok).toBe(true);
    if (before.ok) expect(before.value.age).toBe(25);

    const onDay = validateIdCard(id, new Date(2026, 5, 15));
    expect(onDay.ok).toBe(true);
    if (onDay.ok) expect(onDay.value.age).toBe(26);
  });
});

describe("upgrade15 15 位升 18 位", () => {
  it("插入 19 并补校验位，结果可通过 validateIdCard", () => {
    const upgraded = upgrade15("110105491231002");
    expect(upgraded).toBe(buildId("11010519491231002"));
    expect(upgraded).toHaveLength(18);
    const res = validateIdCard(upgraded as string, NOW);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.birth).toBe("1949-12-31");
      expect(res.value.province).toBe("北京");
    }
  });

  it("生日非法或格式错误返回 null", () => {
    expect(upgrade15("110105491331002")).toBeNull(); // 13 月
    expect(upgrade15("110105490230002")).toBeNull(); // 1949-02-30 不存在
    expect(upgrade15("12345")).toBeNull();
    expect(upgrade15("11010549123100X")).toBeNull(); // 非纯数字
  });
});
