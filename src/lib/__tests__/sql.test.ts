import { describe, expect, it } from "vitest";
import { formatSql } from "../sql";

const ok = (r: ReturnType<typeof formatSql>): string => {
  if (!r.ok) throw new Error(`expected ok, got message: ${r.message}`);
  return r.value;
};

describe("formatSql 基础", () => {
  it("空输入返回中文错误不抛异常", () => {
    expect(formatSql("").ok).toBe(false);
    expect(formatSql("   \n ").ok).toBe(false);
    const r = formatSql("");
    if (!r.ok) expect(r.message).toContain("SQL");
  });

  it("仅注释视为空", () => {
    expect(formatSql("-- only comment").ok).toBe(false);
    expect(formatSql("/* block */").ok).toBe(false);
  });

  it("关键字大写但标识符与字符串内不动", () => {
    const out = ok(formatSql("select name from users where name = 'select from'"));
    expect(out).toContain("SELECT");
    expect(out).toContain("FROM");
    expect(out).toContain("WHERE");
    expect(out).toContain("name"); // 标识符保持原样
    expect(out).toContain("'select from'"); // 字符串内关键字不大写不拆散
  });

  it("upperCase:false 统一小写", () => {
    const out = ok(formatSql("SELECT a FROM t", { upperCase: false }));
    expect(out).toContain("select");
    expect(out).toContain("from");
    expect(out).not.toMatch(/SELECT|FROM/);
  });
});

describe("formatSql 结构", () => {
  it("SELECT 逗号换行且子句顶格", () => {
    const out = ok(formatSql("select a, b, c from t where a = 1"));
    const lines = out.split("\n").map((l) => l.trim());
    expect(lines[0]).toBe("SELECT");
    expect(lines).toContain("a,");
    expect(lines).toContain("b,");
    expect(lines).toContain("c");
    expect(lines.some((l) => l.startsWith("FROM"))).toBe(true);
    expect(lines.some((l) => l.startsWith("WHERE"))).toBe(true);
  });

  it("commaNewline:false 时 SELECT 项同行", () => {
    const out = ok(formatSql("select a, b, c from t", { commaNewline: false }));
    expect(out.split("\n").some((l) => l.includes("a, b, c"))).toBe(true);
  });

  it("JOIN 缩进且 ON 同行", () => {
    const out = ok(formatSql("select u.id from users u left join orders o on o.user_id = u.id"));
    const joinLine = out.split("\n").find((l) => l.includes("LEFT JOIN"));
    expect(joinLine).toBeDefined();
    expect(joinLine!.startsWith("  ")).toBe(true); // 缩进两格
    expect(joinLine).toContain("ON");
  });

  it("WHERE 中 AND 换行缩进", () => {
    const out = ok(formatSql("select a from t where x = 1 and y = 2"));
    const andLine = out.split("\n").find((l) => l.trim().startsWith("AND"));
    expect(andLine).toBeDefined();
    expect(andLine!.startsWith("  ")).toBe(true);
  });

  it("INSERT 多 VALUES 与 UPDATE SET 可格式化", () => {
    const ins = ok(formatSql("insert into t (a, b) values (1, 'x'), (2, 'y')"));
    expect(ins).toContain("INSERT INTO");
    expect(ins).toContain("VALUES");
    const upd = ok(formatSql("update t set a = 1, b = 'q' where id = 5"));
    expect(upd).toContain("UPDATE");
    expect(upd).toContain("SET");
    expect(upd).toContain("WHERE");
  });

  it("函数调用括号紧贴 COUNT(o.id)", () => {
    const out = ok(formatSql("select count(o.id) from orders o"));
    expect(out).toContain("COUNT(o.id)");
  });
});

describe("formatSql 字符串与注释保护", () => {
  it("字符串内逗号/分号不触发换行", () => {
    const out = ok(formatSql("select a from t where note = 'x, y; z'"));
    expect(out).toContain("'x, y; z'");
    // 字符串内的分号不应产生多语句空行拆分
    expect(out.includes("'x, y; z'")).toBe(true);
  });

  it("'' 转义保持在同一字符串内", () => {
    const out = ok(formatSql("select a from t where s = 'it''s ok'"));
    expect(out).toContain("'it''s ok'");
  });

  it("行注释与块注释原样保留", () => {
    const out = ok(formatSql("select a -- keep me\nfrom t /* also */"));
    expect(out).toContain("-- keep me");
    expect(out).toContain("/* also */");
  });

  it("未闭合引号容错不抛异常", () => {
    const r = formatSql("select a from t where s = 'oops");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toContain("'oops");
  });
});

describe("formatSql 多语句与幂等性", () => {
  it("分号分隔多语句", () => {
    const out = ok(formatSql("select 1; select 2;"));
    expect(out.match(/SELECT/g)?.length).toBe(2);
    expect(out).toContain(";");
  });

  it("二次格式化不破坏内容（token 集合一致）", () => {
    const src = "select u.id, count(*) c from users u left join orders o on o.uid = u.id where u.age >= 18 group by u.id order by c desc limit 10";
    const once = ok(formatSql(src));
    const twice = ok(formatSql(once));
    const tokens = (s: string) => s.match(/[A-Za-z0-9_$]+|'[^\n']*'|[^\sA-Za-z0-9_$]/g) ?? [];
    expect(tokens(twice)).toEqual(tokens(once));
  });
});
