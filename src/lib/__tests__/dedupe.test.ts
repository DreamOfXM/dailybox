import { describe, expect, it } from "vitest";
import { dedupeLines } from "../dedupe";

describe("dedupeLines 行去重排序", () => {
  it("重复行去除：保留首次出现", () => {
    const r = dedupeLines("apple\nbanana\napple\ncherry\nbanana");
    expect(r.text).toBe("apple\nbanana\ncherry");
    expect(r.total).toBe(5);
    expect(r.removed).toBe(2);
  });

  it("空串：返回全零结果", () => {
    expect(dedupeLines("")).toEqual({ text: "", removed: 0, total: 0 });
  });

  it("大小写敏感开关", () => {
    const input = "Apple\napple\nAPPLE\nbanana";
    const insensitive = dedupeLines(input, { caseSensitive: false });
    expect(insensitive.text).toBe("Apple\nbanana");
    expect(insensitive.removed).toBe(2);

    const sensitive = dedupeLines(input, { caseSensitive: true });
    expect(sensitive.text).toBe("Apple\napple\nAPPLE\nbanana");
    expect(sensitive.removed).toBe(0);
  });

  it("trim 后比较：首尾空格不同的行视为重复", () => {
    const r = dedupeLines(" a \na\n  b", { trim: true });
    expect(r.text).toBe("a\nb");
    expect(r.total).toBe(3);
    expect(r.removed).toBe(1);
  });

  it("空行清理（trim 开启时纯空格行也算空行）", () => {
    const r = dedupeLines("a\n\nb\n \n\n", { removeEmpty: true, trim: true });
    expect(r.text).toBe("a\nb");
    expect(r.total).toBe(6);
    expect(r.removed).toBe(4);
  });

  it("未开 removeEmpty 时空行也参与去重", () => {
    const r = dedupeLines("a\n\nb\n");
    expect(r.text).toBe("a\n\nb"); // 两个空行折叠为一个
    expect(r.total).toBe(4);
    expect(r.removed).toBe(1);
  });

  it("排序：升序 / 降序", () => {
    const input = "banana\napple\ncherry\napple";
    expect(dedupeLines(input, { sort: "asc" }).text).toBe("apple\nbanana\ncherry");
    expect(dedupeLines(input, { sort: "desc" }).text).toBe("cherry\nbanana\napple");
  });

  it("排序：按长度升序", () => {
    const r = dedupeLines("ccc\na\nbb\na\ncc", { sort: "length" });
    expect(r.text).toBe("a\nbb\ncc\nccc");
    expect(r.removed).toBe(1);
  });

  it("组合：trim + 空行清理 + 升序", () => {
    const r = dedupeLines(" b \na\n\na\n  b  ", { trim: true, removeEmpty: true, sort: "asc" });
    expect(r.text).toBe("a\nb");
    expect(r.total).toBe(5);
    expect(r.removed).toBe(3);
  });
});
