/** SQL 格式化（纯函数，无依赖）：关键字大小写、子句换行、JOIN 缩进、逗号换行；字符串与注释原样保留 */

import type { TryResult } from "./base64";

export interface FormatSqlOptions {
  /** 关键字是否大写（默认 true；false 时统一小写） */
  upperCase?: boolean;
  /** SELECT / GROUP BY / ORDER BY / SET 项是否按逗号换行（默认 true） */
  commaNewline?: boolean;
}

type Tok =
  | { kind: "word"; value: string }
  | { kind: "string"; value: string }
  | { kind: "comment"; value: string }
  | { kind: "punct"; value: string; /** 与前一 token 之间不加空格（函数调用开括号） */ glue?: boolean };

/** SQL 保留字与常见聚合函数（大小写化的目标）；表名/列名等标识符不受影响 */
const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "FETCH",
  "UNION", "ALL", "INTERSECT", "EXCEPT", "JOIN", "LEFT", "RIGHT", "FULL", "INNER", "OUTER",
  "CROSS", "ON", "USING", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "ILIKE",
  "BETWEEN", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "INSERT", "INTO", "VALUES",
  "UPDATE", "SET", "DELETE", "WITH", "RECURSIVE", "DISTINCT", "ASC", "DESC", "CREATE",
  "TABLE", "DROP", "ALTER", "INDEX", "VIEW", "IF", "REPLACE", "TEMPORARY", "PRIMARY", "KEY",
  "FOREIGN", "REFERENCES", "DEFAULT", "CONSTRAINT", "CASCADE", "BEGIN", "COMMIT", "ROLLBACK",
  "GRANT", "REVOKE", "OVER", "PARTITION", "WINDOW", "TRUE", "FALSE",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "IFNULL", "CAST", "NOW",
]);

interface ClauseDef {
  /** 构成子句头的单词序列（大写），长序列在前优先匹配 */
  words: string[];
  /** 次级子句（JOIN 系）额外缩进两格 */
  minor: boolean;
  /** 该子句的项支持逗号换行 */
  commaList?: boolean;
}

const CLAUSES: ClauseDef[] = [
  { words: ["UNION", "ALL"], minor: false },
  { words: ["INTERSECT", "ALL"], minor: false },
  { words: ["EXCEPT", "ALL"], minor: false },
  { words: ["LEFT", "OUTER", "JOIN"], minor: true },
  { words: ["RIGHT", "OUTER", "JOIN"], minor: true },
  { words: ["FULL", "OUTER", "JOIN"], minor: true },
  { words: ["LEFT", "JOIN"], minor: true },
  { words: ["RIGHT", "JOIN"], minor: true },
  { words: ["FULL", "JOIN"], minor: true },
  { words: ["INNER", "JOIN"], minor: true },
  { words: ["CROSS", "JOIN"], minor: true },
  { words: ["JOIN"], minor: true },
  { words: ["GROUP", "BY"], minor: false, commaList: true },
  { words: ["ORDER", "BY"], minor: false, commaList: true },
  { words: ["SELECT"], minor: false, commaList: true },
  { words: ["FROM"], minor: false },
  { words: ["WHERE"], minor: false },
  { words: ["HAVING"], minor: false },
  { words: ["LIMIT"], minor: false },
  { words: ["OFFSET"], minor: false },
  { words: ["FETCH"], minor: false },
  { words: ["UNION"], minor: false },
  { words: ["INTERSECT"], minor: false },
  { words: ["EXCEPT"], minor: false },
  { words: ["SET"], minor: false, commaList: true },
  { words: ["VALUES"], minor: false },
  { words: ["RETURNING"], minor: false },
  { words: ["WITH"], minor: false },
  { words: ["INSERT"], minor: false },
  { words: ["UPDATE"], minor: false },
  { words: ["DELETE"], minor: false },
];

/** 常见 SQL 函数：其后的开括号紧贴函数名（COUNT(o.id)），其余场景保留空格 */
const SQL_FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "IFNULL", "CAST", "NOW",
  "CONCAT", "CONCAT_WS", "SUBSTRING", "SUBSTR", "TRIM", "LTRIM", "RTRIM", "UPPER", "LOWER",
  "LENGTH", "CHAR_LENGTH", "ROUND", "FLOOR", "CEIL", "CEILING", "ABS", "MOD", "POWER", "SQRT",
  "DATE", "YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND", "DATEDIFF", "DATE_ADD", "DATE_SUB",
  "IF", "IIF", "GREATEST", "LEAST", "RANK", "ROW_NUMBER", "DENSE_RANK", "NTILE", "LAG", "LEAD",
  "FIRST_VALUE", "LAST_VALUE", "GROUP_CONCAT", "STRING_AGG", "ARRAY_AGG", "JSON_EXTRACT", "REPLACE",
]);

/** 词法切分：字符串（'' "" ``）与注释（-- 与块注释）整段保留，多字符运算符不拆散 */
function tokenize(input: string): Tok[] {
  const toks: Tok[] = [];
  const n = input.length;
  let i = 0;
  while (i < n) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "-" && input[i + 1] === "-") {
      let j = i;
      while (j < n && input[j] !== "\n") j++;
      toks.push({ kind: "comment", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === "/" && input[i + 1] === "*") {
      const end = input.indexOf("*/", i + 2);
      const j = end === -1 ? n : end + 2;
      toks.push({ kind: "comment", value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < n) {
        if (input[j] === ch) {
          if (ch === "'" && input[j + 1] === "'") {
            j += 2; // '' 转义仍在字符串内
            continue;
          }
          break;
        }
        j++;
      }
      const closed = j < n;
      const stop = closed ? j + 1 : n;
      toks.push({ kind: "string", value: input.slice(i, stop) });
      i = stop;
      continue;
    }
    if (/[A-Za-z0-9_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(input[j])) j++;
      toks.push({ kind: "word", value: input.slice(i, j) });
      i = j;
      continue;
    }
    const two = input.slice(i, i + 2);
    if ([">=", "<=", "<>", "!=", "||", "->", "::"].includes(two)) {
      toks.push({ kind: "punct", value: two });
      i += 2;
      continue;
    }
    toks.push({ kind: "punct", value: ch });
    i++;
  }
  return toks;
}

interface ClauseMatch {
  label: string;
  minor: boolean;
  commaList: boolean;
  /** 子句头占用的单词 token 数 */
  count: number;
}

/** 从位置 i（word token）尝试匹配子句头；允许单词之间夹注释，遇字符串/标点即停 */
function matchClauseAt(toks: Tok[], i: number): ClauseMatch | null {
  const wordIdx: number[] = [i];
  for (let j = i + 1; j < toks.length && wordIdx.length < 4; j++) {
    const k = toks[j].kind;
    if (k === "word") wordIdx.push(j);
    else if (k !== "comment") break;
  }
  for (const c of CLAUSES) {
    if (c.words.length > wordIdx.length) continue;
    let ok = true;
    for (let w = 0; w < c.words.length; w++) {
      const t = toks[wordIdx[w]];
      if (t.kind !== "word" || t.value.toUpperCase() !== c.words[w]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return { label: c.words.join(" "), minor: c.minor, commaList: c.commaList ?? false, count: c.words.length };
    }
  }
  return null;
}

/** AND / OR 仅在条件/连接语境换行，避免拆散 BETWEEN x AND y 之类的一般表达式 */
function andOrBreakable(clause: string | null): boolean {
  return clause === "WHERE" || clause === "HAVING" || (clause !== null && clause.includes("JOIN"));
}

/**
 * 格式化 SQL：空输入返回 { ok:false, message } 中文提示。
 * 顶级子句顶格换行，JOIN / AND / OR 缩进两格，括号内层级再缩进；
 * 字符串与注释原样保留；分号后空行分隔多语句。
 */
export function formatSql(input: string, opts?: FormatSqlOptions): TryResult<string> {
  const upper = opts?.upperCase ?? true;
  const commaNl = opts?.commaNewline ?? true;

  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, message: "请输入 SQL 语句" };
  }

  const toks = tokenize(input);
  if (toks.every((t) => t.kind === "comment")) {
    return { ok: false, message: "SQL 内容为空或仅含注释" };
  }

  /** word token 命中关键字表时统一大小写，其余 token 原样 */
  const render = (t: Tok): string => {
    if (t.kind === "word" && KEYWORDS.has(t.value.toUpperCase())) {
      return upper ? t.value.toUpperCase() : t.value.toLowerCase();
    }
    return t.value;
  };

  /** 行内 token 拼回文本：) , ; . 前与 ( . 后不加空格 */
  const joinLine = (list: Tok[]): string => {
    let out = "";
    for (const t of list) {
      const s = render(t);
      if (out === "") {
        out = s;
      } else if (t.kind === "punct" && t.glue) {
        out += s;
      } else if (/^[),;.]/.test(s)) {
        out += s;
      } else if (/[(.]$/.test(out)) {
        out += s;
      } else {
        out += " " + s;
      }
    }
    return out.trim();
  };

  const lines: string[] = [];
  let cur: Tok[] = [];
  /** 当前括号嵌套深度 */
  let depth = 0;
  /** 开括号栈：记录每个未闭合括号内部是否发生过换行（决定闭括号能否行内收尾） */
  const parenStack: boolean[] = [];
  /** 行级上下文：起始深度决定基础缩进，minor/cont 追加两格 */
  let ctx = { depth: 0, minor: false, cont: false };
  let lastClause: string | null = null;
  /** 逗号换行只作用于子句头所在层级 */
  let clauseDepth = 0;
  let commaListOn = false;

  const flush = () => {
    const s = joinLine(cur);
    cur = [];
    if (s) {
      lines.push("  ".repeat(ctx.depth) + (ctx.minor || ctx.cont ? "  " : "") + s);
      // 在某个开括号内部产出行 → 标记该括号内部已换行
      if (parenStack.length > 0) parenStack[parenStack.length - 1] = true;
    }
  };
  const begin = (minor: boolean, cont: boolean) => {
    ctx = { depth, minor, cont };
  };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];

    if (t.kind === "string") {
      cur.push(t);
      continue;
    }
    if (t.kind === "comment") {
      cur.push(t);
      if (t.value.startsWith("--")) {
        // 行注释独占一行
        flush();
        begin(false, false);
      }
      continue;
    }

    if (t.kind === "word") {
      const m = matchClauseAt(toks, i);
      if (m) {
        flush();
        begin(m.minor, false);
        lastClause = m.label;
        clauseDepth = depth;
        commaListOn = m.commaList;
        let pushed = 0;
        while (pushed < m.count && i < toks.length) {
          const tt = toks[i];
          cur.push(tt);
          if (tt.kind === "word") pushed++;
          i++;
        }
        i--; // 抵消 for 自增
        if (commaNl && m.commaList) {
          // 逗号换行开启时子句头独占一行，列表项缩进
          flush();
          begin(false, true);
        }
        continue;
      }
      const u = t.value.toUpperCase();
      if ((u === "AND" || u === "OR") && andOrBreakable(lastClause)) {
        flush();
        begin(true, false);
        cur.push(t);
        continue;
      }
      cur.push(t);
      continue;
    }

    // 标点
    if (t.value === "(") {
      // 前一个有效 token 是单词 → 括号紧跟其后（函数调用 COUNT(o.id) 或 IN (1,2) 等），行内处理
      let k = cur.length - 1;
      while (k >= 0 && cur[k].kind === "comment") k--;
      const prev = k >= 0 ? cur[k] : null;
      const prevWord = prev !== null && prev.kind === "word";
      // 已知函数名后的开括号紧贴（COUNT(o.id)）；其余场景保留空格（IN (1,2)、t (a,b)）
      const glue = prevWord && SQL_FUNCTIONS.has(prev!.value.toUpperCase());
      cur.push({ kind: "punct", value: "(", glue });
      depth++;
      parenStack.push(false);
      // 行内与否由内部子句关键字 / 闭括号换行逻辑决定，这里不强制 flush
      continue;
    }
    if (t.value === ")") {
      const broke = parenStack.pop() ?? true;
      depth = Math.max(0, depth - 1);
      if (!broke) {
        // 括号内部未换行 → 闭括号行内收尾（函数调用写法）
        cur.push(t);
        continue;
      }
      flush();
      begin(false, false);
      cur.push(t); // 闭括号与后续别名同行
      continue;
    }
    if (t.value === ";") {
      cur.push(t);
      flush();
      begin(false, false);
      lines.push(""); // 多语句间空行分隔（末尾空行最终 trim）
      lastClause = null;
      commaListOn = false;
      continue;
    }
    if (t.value === "," && commaNl && commaListOn && depth === clauseDepth) {
      cur.push(t);
      flush();
      begin(false, true);
      continue;
    }
    cur.push(t);
  }
  flush();

  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return { ok: false, message: "SQL 内容为空或仅含注释" };
  return { ok: true, value: text };
}
