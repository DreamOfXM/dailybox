import { describe, expect, it } from "vitest";
import { decodeUrl, encodeFormUrl, encodeUrl, encodeUrlComponent, safeDecode } from "../urlcode";

describe("encodeUrlComponent / encodeUrl", () => {
  it("中文与 emoji 编解码往返一致", () => {
    for (const s of ["你好，世界", "🌍😀🚀", "emoji 😀 混 中文", ""]) {
      const enc = encodeUrlComponent(s);
      const dec = decodeUrl(enc, "component");
      expect(dec.ok).toBe(true);
      if (dec.ok) expect(dec.value).toBe(s);
    }
  });

  it("& 在 component 模式被编码、uri 模式保留", () => {
    expect(encodeUrlComponent("a&b=c")).toBe("a%26b%3Dc");
    expect(encodeUrl("https://x.cn/p?a=1&b=2")).toBe("https://x.cn/p?a=1&b=2");
  });

  it("uri 模式解码不改变合法 URL", () => {
    expect(decodeUrl("https://x.cn/p?a=1&b=2", "uri")).toEqual({
      ok: true,
      value: "https://x.cn/p?a=1&b=2",
    });
  });
});

describe("form 模式", () => {
  it("+ ↔ 空格", () => {
    expect(encodeFormUrl("hello world")).toBe("hello+world");
    expect(encodeFormUrl("a b  c")).toBe("a+b++c");
    expect(decodeUrl("hello+world", "form")).toEqual({ ok: true, value: "hello world" });
    // 字面量 + 需编码为 %2B，解码时不被当成空格
    expect(decodeUrl("a%2Bb", "form")).toEqual({ ok: true, value: "a+b" });
  });

  it("中文表单往返一致", () => {
    const s = "你好 world";
    expect(encodeFormUrl(s)).toBe("%E4%BD%A0%E5%A5%BD+world");
    expect(decodeUrl(encodeFormUrl(s), "form")).toEqual({ ok: true, value: s });
  });
});

describe("decodeUrl 非法输入", () => {
  it("%ZZ 返回中文错误且不抛异常", () => {
    const r = decodeUrl("%ZZ", "component");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("%");
  });

  it("残缺序列返回错误", () => {
    expect(decodeUrl("%E4", "component").ok).toBe(false);
    expect(decodeUrl("%E4%B8", "form").ok).toBe(false);
    expect(decodeUrl("%E4%B8", "uri").ok).toBe(false);
  });

  it("%00 解码后保留 \\u0000 不截断", () => {
    const r = decodeUrl("a%00b", "component");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(3);
      expect(r.value.charCodeAt(0)).toBe(0x61);
      expect(r.value.charCodeAt(1)).toBe(0);
      expect(r.value.charCodeAt(2)).toBe(0x62);
    }
  });

  it("空串", () => {
    expect(encodeUrlComponent("")).toBe("");
    expect(encodeUrl("")).toBe("");
    expect(encodeFormUrl("")).toBe("");
    expect(decodeUrl("", "component")).toEqual({ ok: true, value: "" });
    expect(decodeUrl("", "uri")).toEqual({ ok: true, value: "" });
    expect(decodeUrl("", "form")).toEqual({ ok: true, value: "" });
  });
});

describe("safeDecode", () => {
  it("100% 不抛且原样保留", () => {
    expect(safeDecode("100%")).toEqual({ ok: true, value: "100%" });
  });

  it("正常片段解码、残缺/非法片段原样保留", () => {
    expect(safeDecode("%E4%B8%AD%E6%96%87")).toEqual({ ok: true, value: "中文" });
    expect(safeDecode("%ZZ")).toEqual({ ok: true, value: "%ZZ" });
    expect(safeDecode("a%2")).toEqual({ ok: true, value: "a%2" });
    expect(safeDecode("50%25off%2")).toEqual({ ok: true, value: "50%off%2" });
    // %C3 形式合法但不是合法 UTF-8 序列：保留原片段
    expect(safeDecode("%C3")).toEqual({ ok: true, value: "%C3" });
    expect(safeDecode("")).toEqual({ ok: true, value: "" });
    expect(safeDecode("plain text")).toEqual({ ok: true, value: "plain text" });
  });

  it("emoji 片段与残缺混合", () => {
    expect(safeDecode("%F0%9F%8C%8D%")).toEqual({ ok: true, value: "🌍%" });
  });
});
