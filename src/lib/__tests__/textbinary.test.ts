import { describe, expect, it } from "vitest";
import { binaryToText, textToBinary } from "../textbinary";

/** 断言解码成功且文本相等 */
function expectText(bin: string, sep: string | undefined, expected: string): void {
  const res = sep === undefined ? binaryToText(bin) : binaryToText(bin, sep);
  expect(res.ok, `binaryToText(${JSON.stringify(bin)}) 应成功`).toBe(true);
  if (res.ok) expect(res.value).toBe(expected);
}

/** 断言解码失败（ok:false 且带中文错误信息） */
function expectFail(bin: string, sep?: string): void {
  const res = sep === undefined ? binaryToText(bin) : binaryToText(bin, sep);
  expect(res.ok, `binaryToText(${JSON.stringify(bin)}) 应失败`).toBe(false);
  if (!res.ok) expect(res.message.length).toBeGreaterThan(0);
}

describe("textToBinary / binaryToText 文本↔二进制", () => {
  it("ASCII 编码：每字节 8 位，默认空格分隔", () => {
    expect(textToBinary("AB")).toBe("01000001 01000010");
    expect(textToBinary("hi")).toBe("01101000 01101001");
  });

  it("中文往返：按 UTF-8 逐字节编码后可完整还原", () => {
    // 中 = U+4E2D → UTF-8 E4 B8 AD
    expect(textToBinary("中")).toBe("11100100 10111000 10101101");
    expectText(textToBinary("你好，世界"), undefined, "你好，世界");
    expectText(textToBinary("中文与English混排123"), undefined, "中文与English混排123");
  });

  it("emoji 往返：4 字节 UTF-8 安全", () => {
    // 🎉 = U+1F389 → UTF-8 F0 9F 8E 89
    expect(textToBinary("🎉")).toBe("11110000 10011111 10001110 10001001");
    expectText(textToBinary("DailyBox🚀✨"), undefined, "DailyBox🚀✨");
  });

  it("自定义分隔符：编码输出与解码分组一致", () => {
    expect(textToBinary("AB", "-")).toBe("01000001-01000010");
    expectText("01000001-01000010", "-", "AB");
    expectText(textToBinary("你好", ","), ",", "你好");
  });

  it("空白容错：换行/多空格/制表符分隔均可解析", () => {
    expectText("01000001\n01000010\t01000011", undefined, "ABC");
    expectText("01000001  01000010", undefined, "AB");
    expectText("0100000101000010", undefined, "AB"); // 无分隔符连续流
  });

  it("空输入：编码为空串，解码为空文本", () => {
    expect(textToBinary("")).toBe("");
    expectText("", undefined, "");
    expectText("   \n  ", undefined, "");
  });

  it("非法输入：非 0/1 字符报错", () => {
    expectFail("abcdefgh");
    expectFail("01000001 0100001x");
    expectFail("010000012"); // 9 位粘连
    expectFail("01000001-2", "-"); // 自定义分隔符下组内含非法字符
  });

  it("非法输入：位数不是 8 的倍数报错", () => {
    expectFail("1100001"); // 7 位
    expectFail("01000001 0100001"); // 第二组 7 位
    expectFail("01000001-0100001", "-");
  });

  it("非法 UTF-8 字节序列报错（如残缺多字节字符）", () => {
    // 11100100 = 0xE4 是「中」的首字节，单独出现即残缺
    expectFail("11100100");
    // 10000000 = 0x80 是孤立的后续字节
    expectFail("10000000");
  });

  it("往返一致性：随机样本编码后解码还原", () => {
    const samples = ["a", "Hello, 世界！", "🎉🎊", "0123456789", "甲乙丙丁\n换行保留"];
    for (const s of samples) {
      const res = binaryToText(textToBinary(s));
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.value).toBe(s);
    }
  });
});
