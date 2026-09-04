import { describe, expect, it } from "vitest";
import { QR_WARN_LEN, validateQrInput } from "../qrcodegen";

describe("validateQrInput 二维码输入校验", () => {
  it("空串报错（ok:false 且带中文提示）", () => {
    const res = validateQrInput("");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message.length).toBeGreaterThan(0);
  });

  it("普通文本通过并返回长度", () => {
    const res = validateQrInput("hello");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.len).toBe(5);
      expect(res.value.warning).toBeUndefined();
    }
  });

  it("链接与中文按字符计数", () => {
    const res = validateQrInput("https://example.com/工具箱");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.len).toBe("https://example.com/工具箱".length);
  });

  it("恰好 2000 字符不警告", () => {
    const res = validateQrInput("a".repeat(QR_WARN_LEN));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.len).toBe(QR_WARN_LEN);
      expect(res.value.warning).toBeUndefined();
    }
  });

  it("超过 2000 字符返回警告但仍允许生成", () => {
    const res = validateQrInput("a".repeat(QR_WARN_LEN + 1));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.len).toBe(QR_WARN_LEN + 1);
      expect(res.value.warning).toBeTruthy();
    }
  });
});
