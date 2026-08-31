import { describe, expect, it } from "vitest";
import type { TryResult } from "../base64";
import { buildCron, describeCron, nextRuns, parseCron, type CronFields } from "../cron";

/** 解包 TryResult，失败直接抛错让测试红掉 */
function unwrap(r: TryResult<CronFields>): CronFields {
  if (!r.ok) throw new Error(r.message);
  return r.value;
}

/** 本地时区 Date 构造（month 从 1 起，贴近书写习惯） */
function d(y: number, month: number, day: number, h = 0, m = 0): Date {
  return new Date(y, month - 1, day, h, m, 0, 0);
}

describe("parseCron", () => {
  it("基础 5 字段：*/5 * * * *", () => {
    const f = unwrap(parseCron("*/5 * * * *"));
    expect(f.min.values).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(f.hour.values.length).toBe(24);
    expect(f.dom.values).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(f.month.values.length).toBe(12);
    expect(f.dow.values).toEqual([0, 1, 2, 3, 4, 5, 6]); // 7 已归一为 0
    expect(f.domRestricted).toBe(false);
    expect(f.dowRestricted).toBe(false);
    expect(f.sec).toBeUndefined();
  });

  it("范围 / 步长 / 逗号列表 / 单值", () => {
    const f = unwrap(parseCron("0,30 9-17/2 1,15 2-4 1"));
    expect(f.min.values).toEqual([0, 30]);
    expect(f.hour.values).toEqual([9, 11, 13, 15, 17]);
    expect(f.dom.values).toEqual([1, 15]);
    expect(f.month.values).toEqual([2, 3, 4]);
    expect(f.dow.values).toEqual([1]);
    expect(f.domRestricted).toBe(true);
    expect(f.dowRestricted).toBe(true);
  });

  it("月份名称 JAN-DEC 与星期名称 SUN-SAT（大小写不敏感）", () => {
    const f = unwrap(parseCron("0 0 1 JAN,JUL,dec *"));
    expect(f.month.values).toEqual([1, 7, 12]);
    expect(f.dow.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const g = unwrap(parseCron("0 9 * * MON-FRI"));
    expect(g.dow.values).toEqual([1, 2, 3, 4, 5]);
    // SUN-SAT 全集等价于 *（7 归一为 0 后覆盖 0-6）
    const h = unwrap(parseCron("0 9 * * SUN-SAT"));
    expect(h.dow.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("星期 7 与 0 等价", () => {
    expect(unwrap(parseCron("0 9 * * 7")).dow.values).toEqual([0]);
    expect(unwrap(parseCron("0 9 * * 5-7")).dow.values).toEqual([0, 5, 6]);
  });

  it("seconds 模式：6 字段，秒在最前", () => {
    const f = unwrap(parseCron("0 */5 * * * *", { seconds: true }));
    expect(f.sec?.values).toEqual([0]);
    expect(f.min.values).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    // 默认模式下 6 字段报错
    expect(parseCron("0 */5 * * * *").ok).toBe(false);
    // seconds 模式下 5 字段报错
    expect(parseCron("* * * * *", { seconds: true }).ok).toBe(false);
  });

  it("非法表达式均返回 ok:false（中文错误）", () => {
    const bads = [
      "61 * * * *", // 分钟越界
      "* * 0 * *", // 日最小为 1
      "a b c d e", // 完全非法
      "* * * *", // 字段数不足
      "* * * * * *", // 字段数过多（默认模式）
      "* 24 * * *", // 小时越界
      "* * * 13 *", // 月份越界
      "* * * * 8", // 星期越界（允许 0-7）
      "5-1 * * * *", // 范围倒挂
      "*/0 * * * *", // 步长为 0
    ];
    for (const expr of bads) {
      const r = parseCron(expr);
      expect(r.ok, `「${expr}」应当解析失败`).toBe(false);
    }
    const r = parseCron("61 * * * *");
    if (!r.ok) expect(r.message.length).toBeGreaterThan(0);
  });
});

describe("nextRuns", () => {
  it("*/5：从 2026-01-01 00:02 起首个命中 00:05，连续 3 次 00:05/00:10/00:15", () => {
    const f = unwrap(parseCron("*/5 * * * *"));
    const runs = nextRuns(f, d(2026, 1, 1, 0, 2), 3);
    expect(runs.map((t) => t.getTime())).toEqual([
      d(2026, 1, 1, 0, 5).getTime(),
      d(2026, 1, 1, 0, 10).getTime(),
      d(2026, 1, 1, 0, 15).getTime(),
    ]);
  });

  it("0 0 1 * *：跨月，从 2026-01-15 起首个 2026-02-01 00:00", () => {
    const f = unwrap(parseCron("0 0 1 * *"));
    const runs = nextRuns(f, d(2026, 1, 15, 12, 0), 2);
    expect(runs[0].getTime()).toBe(d(2026, 2, 1, 0, 0).getTime());
    expect(runs[1].getTime()).toBe(d(2026, 3, 1, 0, 0).getTime());
  });

  it("0 9 * * 0 与 0 9 * * 7 结果一致（周日 0=7）", () => {
    const a = nextRuns(unwrap(parseCron("0 9 * * 0")), d(2026, 1, 1), 3);
    const b = nextRuns(unwrap(parseCron("0 9 * * 7")), d(2026, 1, 1), 3);
    expect(a.map((t) => t.getTime())).toEqual(b.map((t) => t.getTime()));
    // 2026-01-04 是周日
    expect(a[0].getTime()).toBe(d(2026, 1, 4, 9, 0).getTime());
  });

  it("vixie OR 语义：0 0 13 * 5（13 号或周五）先命中周五而不是干等 13 号", () => {
    const f = unwrap(parseCron("0 0 13 * 5"));
    // 2026-01-01 为周四；2026-01-02 为周五；2026-01-13 为周二
    const runs = nextRuns(f, d(2026, 1, 1, 0, 0), 5);
    expect(runs.map((t) => t.getTime())).toEqual([
      d(2026, 1, 2, 0, 0).getTime(), // 周五
      d(2026, 1, 9, 0, 0).getTime(), // 周五
      d(2026, 1, 13, 0, 0).getTime(), // 13 号（周二）
      d(2026, 1, 16, 0, 0).getTime(), // 周五
      d(2026, 1, 23, 0, 0).getTime(), // 周五
    ]);
  });

  it("只有一个受限字段时按该字段：0 0 13 * * 不会命中周五", () => {
    const f = unwrap(parseCron("0 0 13 * *"));
    const runs = nextRuns(f, d(2026, 1, 1, 0, 0), 2);
    expect(runs[0].getTime()).toBe(d(2026, 1, 13, 0, 0).getTime());
    expect(runs[1].getTime()).toBe(d(2026, 2, 13, 0, 0).getTime());
  });

  it("闰年：0 0 29 2 * 从 2026-01-01 起首个 2028-02-29（2027 非闰年跳过）", () => {
    const f = unwrap(parseCron("0 0 29 2 *"));
    const runs = nextRuns(f, d(2026, 1, 1, 0, 0), 1);
    expect(runs).toHaveLength(1);
    expect(runs[0].getTime()).toBe(d(2028, 2, 29, 0, 0).getTime());
    // 2029/2030/2031 均非闰年，下一个命中是 2032-02-29
    const later = nextRuns(f, d(2031, 1, 1, 0, 0), 1);
    expect(later[0].getTime()).toBe(d(2032, 2, 29, 0, 0).getTime());
  });

  it("性能：* * * * * 求 10 次（每次 10 个结果）总耗时 < 50ms", () => {
    const f = unwrap(parseCron("* * * * *"));
    const from = d(2026, 1, 1);
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      expect(nextRuns(f, from, 10)).toHaveLength(10);
    }
    expect(performance.now() - t0).toBeLessThan(50);
  });

  it("maxIter 兜底：永不匹配的字段组合不会无限循环", () => {
    const f = unwrap(parseCron("* * * * *"));
    f.min.values = []; // 手工改空 → 任何时刻都不匹配
    const runs = nextRuns(f, d(2026, 1, 1), 5, { maxIter: 10_000 });
    expect(runs).toEqual([]);
    // 默认硬上限（2_000_000）也能安全返回
    expect(nextRuns(f, d(2026, 1, 1), 1)).toEqual([]);
  });

  it("n 为 0 / 负数时返回空数组", () => {
    const f = unwrap(parseCron("* * * * *"));
    expect(nextRuns(f, d(2026, 1, 1), 0)).toEqual([]);
    expect(nextRuns(f, d(2026, 1, 1), -1)).toEqual([]);
  });
});

describe("describeCron", () => {
  it("*/5 * * * * → 每 5 分钟", () => {
    expect(describeCron(unwrap(parseCron("*/5 * * * *")))).toContain("每 5 分钟");
  });

  it("30 8 * * * → 每天 08:30", () => {
    const s = describeCron(unwrap(parseCron("30 8 * * *")));
    expect(s).toContain("08:30");
    expect(s).toContain("每天");
  });

  it("其余常见模式", () => {
    expect(describeCron(unwrap(parseCron("0 9 * * 1")))).toBe("每周一 09:00");
    expect(describeCron(unwrap(parseCron("0 9 * * 0")))).toBe("每周日 09:00");
    expect(describeCron(unwrap(parseCron("0 0 1 * *")))).toBe("每月 1 日 00:00");
    expect(describeCron(unwrap(parseCron("0 12 29 2 *")))).toBe("每年 2 月 29 日 12:00");
    expect(describeCron(unwrap(parseCron("* * * * *")))).toBe("每分钟");
  });

  it("复杂组合走逐字段兜底（分 时 日 月 周）", () => {
    const s = describeCron(unwrap(parseCron("0,20,40 8-18 1,15 3,6,9,12 *")));
    expect(s).toContain("分钟");
    expect(s).toContain("小时");
    expect(s).toContain("日");
    expect(s).toContain("月");
    expect(s).toContain("周");
  });
});

describe("buildCron", () => {
  it("各 preset 输出与 parseCron 双向兼容", () => {
    const cases: Array<[string, string]> = [
      [buildCron({ kind: "everyMinute" }), "* * * * *"],
      [buildCron({ kind: "everyNMinutes", n: 15 }), "*/15 * * * *"],
      [buildCron({ kind: "hourly" }), "0 * * * *"],
      [buildCron({ kind: "hourly", minute: 30 }), "30 * * * *"],
      [buildCron({ kind: "daily", hour: 8, minute: 30 }), "30 8 * * *"],
      [buildCron({ kind: "weekly", dow: 1, hour: 9, minute: 0 }), "0 9 * * 1"],
      [buildCron({ kind: "monthly", dom: 1, hour: 0, minute: 0 }), "0 0 1 * *"],
    ];
    for (const [actual, expected] of cases) {
      expect(actual).toBe(expected);
      expect(parseCron(actual).ok, `buildCron 输出「${actual}」应可解析`).toBe(true);
    }
  });

  it("everyNMinutes 产物语义正确", () => {
    const f = unwrap(parseCron(buildCron({ kind: "everyNMinutes", n: 15 })));
    expect(f.min.values).toEqual([0, 15, 30, 45]);
  });
});
