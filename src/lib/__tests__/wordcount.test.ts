import { describe, expect, it } from "vitest";
import { countText } from "../wordcount";

describe("countText 字数统计", () => {
  it("空串：全部指标为 0", () => {
    expect(countText("")).toEqual({
      chars: 0,
      charsNoSpace: 0,
      words: 0,
      cjkChars: 0,
      lines: 0,
      nonEmptyLines: 0,
      readMinutes: 0,
    });
  });

  it("纯中文：每字算一词，标点不计", () => {
    const r = countText("你好，世界！");
    expect(r.chars).toBe(6);
    expect(r.charsNoSpace).toBe(6);
    expect(r.words).toBe(4); // 你 好 世 界
    expect(r.cjkChars).toBe(4);
    expect(r.lines).toBe(1);
    expect(r.nonEmptyLines).toBe(1);
  });

  it("纯英文：空白分词", () => {
    const r = countText("Hello, world!");
    expect(r.chars).toBe(13);
    expect(r.charsNoSpace).toBe(12);
    expect(r.words).toBe(2);
    expect(r.cjkChars).toBe(0);
    expect(r.lines).toBe(1);
  });

  it("中英混排：汉字逐字 + 拉丁按词", () => {
    const r = countText("Hello 世界 abc");
    expect(r.chars).toBe(12);
    expect(r.charsNoSpace).toBe(10);
    expect(r.words).toBe(4); // hello + 世 + 界 + abc
    expect(r.cjkChars).toBe(2);
    expect(r.lines).toBe(1);
    expect(r.nonEmptyLines).toBe(1);
  });

  it("汉字与字母直接相邻也能正确断词", () => {
    const r = countText("AI人工智能2024");
    expect(r.words).toBe(6); // AI + 人 工 智 能 + 2024
    expect(r.cjkChars).toBe(4);
    expect(r.chars).toBe(10);
    expect(r.charsNoSpace).toBe(10);
  });

  it("多行：行数与非空行数", () => {
    const r = countText("第一行\n第二行\n\n   \n第四行\n");
    expect(r.lines).toBe(6);
    expect(r.nonEmptyLines).toBe(3);
    expect(r.words).toBe(9); // 3 行各 3 个汉字
    expect(r.cjkChars).toBe(9);
  });

  it("阅读时长：中文 300 字/分", () => {
    expect(countText("中".repeat(300)).readMinutes).toBe(1);
    expect(countText("中".repeat(600)).readMinutes).toBe(2);
  });

  it("阅读时长：英文 200 词/分", () => {
    const text = Array.from({ length: 200 }, () => "word").join(" ");
    expect(countText(text).readMinutes).toBe(1);
  });

  it("阅读时长：中英混排两种口径相加", () => {
    const text = "中".repeat(300) + " " + Array.from({ length: 200 }, () => "word").join(" ");
    expect(countText(text).readMinutes).toBe(2);
  });
});
