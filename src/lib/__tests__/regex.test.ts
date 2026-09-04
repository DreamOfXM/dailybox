import { describe, expect, it } from "vitest";
import { MAX_MATCHES, explainRegex, parseRegex, runMatches, regexIssueEn } from "../regex";

describe("parseRegex", () => {
  it("合法模式与标志组合", () => {
    const r = parseRegex("(?<year>\\d{4})", "gims");
    expect(r.issue).toBeUndefined();
    expect(r.re).toBeInstanceOf(RegExp);
    expect(r.re?.flags).toContain("g");
  });

  it("非法 pattern 返回 issue 不抛异常", () => {
    for (const p of ["(", "(?<a>", "[", "*", "(?<1a>x)"]) {
      const r = parseRegex(p, "");
      expect(r.re, `pattern=${JSON.stringify(p)}`).toBeUndefined();
      expect(r.issue, `pattern=${JSON.stringify(p)}`).toBeTruthy();
    }
  });

  it("非法标志返回中文 issue", () => {
    const r = parseRegex("a", "z");
    expect(r.re).toBeUndefined();
    expect(r.issue).toMatch(/仅允许/);
  });

  it("重复标志返回中文 issue", () => {
    const r = parseRegex("a", "gg");
    expect(r.re).toBeUndefined();
    expect(r.issue).toMatch(/重复/);
  });
});

describe("runMatches", () => {
  it("命名分组 (?<year>\\d{4}) 提取 named.year", () => {
    const { re } = parseRegex("(?<year>\\d{4})-(?<month>\\d{2})", "");
    expect(re).toBeDefined();
    const ms = runMatches("日期 2024-07 与 2025-01", re!);
    expect(ms.length).toBe(2);
    expect(ms[0].full).toBe("2024-07");
    expect(ms[0].index).toBe(3);
    expect(ms[0].length).toBe(7);
    expect(ms[0].named?.year).toBe("2024");
    expect(ms[0].named?.month).toBe("07");
    expect(ms[0].groups).toEqual(["2024", "07"]);
    expect(ms[1].named?.year).toBe("2025");
  });

  it("g 与非 g：内部统一克隆为带 g 全量迭代", () => {
    expect(runMatches("aaa", /a/).length).toBe(3);
    expect(runMatches("aaa", /a/g).length).toBe(3);
  });

  it("不修改传入正则的 lastIndex", () => {
    const re = /a/g;
    runMatches("aaa", re);
    expect(re.lastIndex).toBe(0);
  });

  it("m 标志下 ^$ 的多行行为", () => {
    const multi = runMatches("ab\ncd", new RegExp("^.", "gm"));
    expect(multi.map((m) => m.full)).toEqual(["a", "c"]);
    expect(multi[1].index).toBe(3);
    const single = runMatches("ab\ncd", new RegExp("^.", "g"));
    expect(single.map((m) => m.full)).toEqual(["a"]);
  });

  it("中文文本匹配的 index 按 UTF-16 码元", () => {
    const ms = runMatches("你好世界", /世界/);
    expect(ms.length).toBe(1);
    expect(ms[0].index).toBe(2);
    expect(ms[0].length).toBe(2);
    expect(ms[0].full).toBe("世界");
  });

  it("emoji（代理对）后的 index 正确", () => {
    const ms = runMatches("a😀b", /b/);
    expect(ms[0].index).toBe(3); // 😀 占 2 个码元
  });

  it("零宽匹配 a* 对 'aaa' 不死循环", () => {
    const ms = runMatches("aaa", /a*/g);
    expect(ms.map((m) => m.full)).toEqual(["aaa", ""]);
    expect(ms[1].length).toBe(0);
  });

  it("未参与匹配的捕获组为 null", () => {
    const ms = runMatches("b", /(a)|(b)/);
    expect(ms[0].groups).toEqual([null, "b"]);
  });

  it("超过上限 10000 条时截断", () => {
    expect(runMatches("a".repeat(MAX_MATCHES + 2000), /a/g).length).toBe(MAX_MATCHES);
  });
});

describe("explainRegex", () => {
  it("\\d{2,4} 含 \\d 与量词两条解释", () => {
    const t = explainRegex("\\d{2,4}");
    expect(t.length).toBe(2);
    expect(t[0].token).toBe("\\d");
    expect(t[0].desc).toContain("数字");
    expect(t[1].token).toBe("{2,4}");
    expect(t[1].desc).toContain("2");
    expect(t[1].desc).toContain("4");
  });

  it("覆盖锚点、命名分组、否定字符类、懒惰量词、或、非捕获分组", () => {
    const t = explainRegex("^(?<id>[^0-9]+)\\w?\\.(?:com|cn)$");
    const tokens = t.map((x) => x.token);
    expect(tokens).toContain("^");
    expect(tokens).toContain("(?<id>");
    expect(tokens).toContain("[^0-9]");
    expect(tokens).toContain("+");
    expect(tokens).toContain("\\w");
    expect(tokens).toContain("?");
    expect(tokens).toContain("\\.");
    expect(tokens).toContain("(?:");
    expect(tokens).toContain("|");
    expect(tokens).toContain("$");
    const cls = t.find((x) => x.token === "[^0-9]");
    expect(cls?.desc).toContain("否定");
    const named = t.find((x) => x.token === "(?<id>");
    expect(named?.desc).toContain("id");
  });

  it("四种断言 token", () => {
    const t = explainRegex("(?=p)(?!q)(?<=r)(?<!s)");
    expect(t.map((x) => x.token)).toEqual(["(?=", "p", ")", "(?!", "q", ")", "(?<=", "r", ")", "(?<!", "s", ")"]);
  });

  it("懒惰 ? 与量词 ? 的区分", () => {
    const t = explainRegex("a+?b?");
    const lazy = t.find((x) => x.token === "?" && x.desc.includes("懒惰"));
    const greedy = t.find((x) => x.token === "?" && !x.desc.includes("懒惰"));
    expect(lazy).toBeDefined();
    expect(greedy).toBeDefined();
  });

  it("\\xHH 与 \\uHHHH 转义", () => {
    const t = explainRegex("\\x41\\u4e2d");
    expect(t.length).toBe(2);
    expect(t[0].token).toBe("\\x41");
    expect(t[0].desc).toContain("0x41");
    expect(t[1].token).toBe("\\u4e2d");
    expect(t[1].desc).toContain("U+4e2d");
  });

  it("锚点 \\b \\B 与 \\0、字面量", () => {
    const t = explainRegex("\\b\\B\\0c");
    expect(t.map((x) => x.token)).toEqual(["\\b", "\\B", "\\0", "c"]);
    expect(t[0].desc).toContain("单词边界");
    expect(t[3].desc).toContain("字面量");
  });
});

describe("explainRegex descEn", () => {
  const CJK = /[一-鿿]/;

  const patterns = ["\\d+", "(?<year>\\d{4})-(\\d{2})", "[^abc]", "a|b", "^foo$", "(?=x)\\w*"];

  for (const p of patterns) {
    it(`descEn non-empty and no CJK for pattern ${JSON.stringify(p)}`, () => {
      const tokens = explainRegex(p);
      for (const t of tokens) {
        expect(t.descEn, `token=${t.token}`).toBeTruthy();
        expect(t.descEn, `token=${t.token} contains CJK`).not.toMatch(CJK);
      }
    });
  }

  it("spot-check: \\d -> 'Digit 0-9'", () => {
    const tokens = explainRegex("\\d+");
    const dToken = tokens.find((t) => t.token === "\\d");
    expect(dToken?.descEn).toBe("Digit 0-9");
  });

  it("spot-check: (?= -> 'Positive lookahead'", () => {
    const tokens = explainRegex("(?=x)\\w*");
    const laToken = tokens.find((t) => t.token === "(?=");
    expect(laToken?.descEn).toContain("Positive lookahead");
  });

  it("CN desc still Chinese for \\d (guards against CN regression)", () => {
    const tokens = explainRegex("\\d+");
    const dToken = tokens.find((t) => t.token === "\\d");
    expect(dToken?.desc).toMatch(CJK);
    expect(dToken?.desc).toContain("数字");
  });
});

describe("regexIssueEn", () => {
  it("maps invalid flag issue to English", () => {
    const r = parseRegex("a", "z");
    expect(r.issue).toBeDefined();
    const en = regexIssueEn(r.issue!);
    expect(en).toMatch(/Invalid flag/);
    expect(en).not.toMatch(/[一-鿿]/);
  });

  it("maps duplicate flag issue to English", () => {
    const r = parseRegex("a", "gg");
    expect(r.issue).toBeDefined();
    const en = regexIssueEn(r.issue!);
    expect(en).toMatch(/Duplicate flag/);
    expect(en).not.toMatch(/[一-鿿]/);
  });

  it("maps syntax error issue to English", () => {
    const r = parseRegex("(", "");
    expect(r.issue).toBeDefined();
    const en = regexIssueEn(r.issue!);
    expect(en).toMatch(/Regex syntax error/);
    expect(en).not.toMatch(/[一-鿿]/);
  });

  it("unknown message falls back to generic English", () => {
    const en = regexIssueEn("something unexpected");
    expect(en).toBe("Invalid regular expression.");
  });
});
