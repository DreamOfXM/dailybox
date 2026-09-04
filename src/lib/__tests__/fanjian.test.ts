import { describe, expect, it } from "vitest";
import { convert } from "../fanjian";

/** 断言转换成功且结果逐字相等 */
function expectConvert(text: string, dir: "s2t" | "t2s", expected: string): void {
  const res = convert(text, dir);
  expect(res.ok, `convert(${JSON.stringify(text)}, ${dir}) 应成功`).toBe(true);
  if (res.ok) expect(res.value).toBe(expected);
}

describe("convert 繁简转换（OpenCC）", () => {
  it("简→繁：基础字符", () => {
    expectConvert("简体", "s2t", "簡體");
    expectConvert("简体字转换测试", "s2t", "簡體字轉換測試");
  });

  it("繁→简：基础字符", () => {
    expectConvert("簡體", "t2s", "简体");
    expectConvert("簡體字轉換測試", "t2s", "简体字转换测试");
  });

  it("往返：简→繁→简 恢复原文", () => {
    const src = "简体字转换测试";
    const toT = convert(src, "s2t");
    expect(toT.ok).toBe(true);
    if (toT.ok) expectConvert(toT.value, "t2s", src);
  });

  it("空串返回空串", () => {
    expectConvert("", "s2t", "");
    expectConvert("", "t2s", "");
  });

  it("纯英文/数字两个方向都原样保留", () => {
    const ascii = "Hello, World! 123";
    expectConvert(ascii, "s2t", ascii);
    expectConvert(ascii, "t2s", ascii);
  });

  it("含标点：中文转换、标点保留", () => {
    expectConvert("汉字，标点！", "s2t", "漢字，標點！");
    expectConvert("漢字，標點！", "t2s", "汉字，标点！");
  });
});
