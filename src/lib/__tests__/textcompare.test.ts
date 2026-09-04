import { describe, expect, it } from "vitest";
import { diffLines, LCS_MAX_LINES } from "../textcompare";

/** 把 diff 结果压缩成紧凑字符串：same 前缀 =，added 前缀 +，removed 前缀 - */
function compact(a: string, b: string): string {
  return diffLines(a, b)
    .lines.map((l) => `${l.type === "same" ? "=" : l.type === "added" ? "+" : "-"}${l.text}`)
    .join("|");
}

describe("diffLines 逐行文本对比", () => {
  it("完全相同：全部 same，无增删", () => {
    const text = "第一行\n第二行\n第三行";
    const res = diffLines(text, text);
    expect(res.lines).toEqual([
      { type: "same", text: "第一行" },
      { type: "same", text: "第二行" },
      { type: "same", text: "第三行" },
    ]);
    expect(res.stats).toEqual({ added: 0, removed: 0, same: 3 });
    expect(res.approximate).toBe(false);
  });

  it("纯新增：原文为空，对比文逐行 added", () => {
    const res = diffLines("", "甲\n乙");
    expect(res.lines).toEqual([
      { type: "added", text: "甲" },
      { type: "added", text: "乙" },
    ]);
    expect(res.stats).toEqual({ added: 2, removed: 0, same: 0 });
  });

  it("纯删除：对比文为空，原文逐行 removed", () => {
    const res = diffLines("甲\n乙", "");
    expect(res.lines).toEqual([
      { type: "removed", text: "甲" },
      { type: "removed", text: "乙" },
    ]);
    expect(res.stats).toEqual({ added: 0, removed: 2, same: 0 });
  });

  it("混合：公共行保持 same，中间修改表现为删旧增新", () => {
    const res = diffLines("a\nb\nc\nd", "a\nx\nc\nd\ne");
    expect(compact("a\nb\nc\nd", "a\nx\nc\nd\ne")).toBe("=a|-b|+x|=c|=d|+e");
    expect(res.stats).toEqual({ added: 2, removed: 1, same: 3 });
    expect(res.approximate).toBe(false);
  });

  it("LCS 性质：重排公共子序列仍识别出最长公共行", () => {
    // a b c d 与 a x c y：公共子序列为 a、c
    const res = diffLines("a\nb\nc\nd", "a\nx\nc\ny");
    expect(res.stats).toEqual({ added: 2, removed: 2, same: 2 });
    expect(res.lines.filter((l) => l.type === "same").map((l) => l.text)).toEqual(["a", "c"]);
  });

  it("空对空：无任何行", () => {
    const res = diffLines("", "");
    expect(res.lines).toEqual([]);
    expect(res.stats).toEqual({ added: 0, removed: 0, same: 0 });
    expect(res.approximate).toBe(false);
  });

  it("空行参与对比：末尾换行会多出空行", () => {
    const res = diffLines("a\n", "a");
    expect(res.lines).toEqual([
      { type: "same", text: "a" },
      { type: "removed", text: "" },
    ]);
    expect(res.stats).toEqual({ added: 0, removed: 1, same: 1 });
  });

  it("CRLF / CR 换行统一为 LF 后对比", () => {
    expect(diffLines("a\r\nb", "a\nb").stats).toEqual({ added: 0, removed: 0, same: 2 });
    expect(diffLines("a\rb", "a\nb").stats).toEqual({ added: 0, removed: 0, same: 2 });
    // 末尾的 CR 与末尾的 LF 等价：都会多出一个空行
    expect(diffLines("a\r", "a\n").stats).toEqual({ added: 0, removed: 0, same: 2 });
  });

  it("超过阈值降级为逐行对齐并标注 approximate", () => {
    const n = LCS_MAX_LINES + 10;
    const A = Array.from({ length: n }, (_, i) => `行${i}`).join("\n");
    // 只改首行，其余相同
    const B = ["首行被改", ...Array.from({ length: n - 1 }, (_, i) => `行${i + 1}`)].join("\n");
    const res = diffLines(A, B);
    expect(res.approximate).toBe(true);
    expect(res.lines[0]).toEqual({ type: "removed", text: "行0" });
    expect(res.lines[1]).toEqual({ type: "added", text: "首行被改" });
    expect(res.stats).toEqual({ added: 1, removed: 1, same: n - 1 });
  });

  it("恰好等于阈值仍走完整 LCS", () => {
    const n = LCS_MAX_LINES;
    const A = Array.from({ length: n }, (_, i) => `行${i}`).join("\n");
    const res = diffLines(A, A);
    expect(res.approximate).toBe(false);
    expect(res.stats).toEqual({ added: 0, removed: 0, same: n });
  });
});
