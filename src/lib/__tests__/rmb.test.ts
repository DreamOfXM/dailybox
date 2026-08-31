import { describe, expect, it } from "vitest";
import { toRmbUpper } from "../rmb";

/** 断言转换成功且结果逐字相等 */
function expectUpper(amount: number, expected: string): void {
  const res = toRmbUpper(amount);
  expect(res.ok, `toRmbUpper(${amount}) 应成功`).toBe(true);
  if (res.ok) expect(res.value).toBe(expected);
}

/** 断言转换失败（ok:false 且带中文错误信息） */
function expectFail(amount: number): void {
  const res = toRmbUpper(amount);
  expect(res.ok, `toRmbUpper(${amount}) 应失败`).toBe(false);
  if (!res.ok) expect(res.message.length).toBeGreaterThan(0);
}

describe("toRmbUpper 人民币大写", () => {
  it("常规金额：角分齐全", () => {
    expectUpper(1002.3, "壹仟零贰元叁角整");
    expectUpper(10.5, "壹拾元伍角整");
    expectUpper(123456789.12, "壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元壹角贰分");
  });

  it("只有分（整数部分为 0 时不写零元）", () => {
    expectUpper(0.05, "伍分");
  });

  it("整元金额", () => {
    expectUpper(10, "壹拾元整");
    expectUpper(1002, "壹仟零贰元整");
    expectUpper(1000000, "壹佰万元整");
    expectUpper(100000000, "壹亿元整");
    expectUpper(10000000000, "壹佰亿元整");
  });

  it("组内零折叠与跨组零衔接", () => {
    expectUpper(1000100, "壹佰万零壹佰元整");
  });

  it("角为 0、分非 0 时写零X分（四舍五入到分）", () => {
    // 1.005 * 100 = 100.5 → round = 101 分 = 1 元 0 角 1 分
    expectUpper(1.005, "壹元零壹分");
  });

  it("0 与负数", () => {
    expectUpper(0, "零元整");
    expectUpper(-520, "负伍佰贰拾元整");
  });

  it("NaN / Infinity / 超限金额报错", () => {
    expectFail(NaN);
    expectFail(Infinity);
    expectFail(-Infinity);
    expectFail(1e13);
    expectFail(-1e13);
  });

  it("上限内的大金额可正常转换", () => {
    expectUpper(1e13 - 1, "玖万亿玖仟玖佰玖拾玖亿玖仟玖佰玖拾玖万玖仟玖佰玖拾玖元整");
  });
});
