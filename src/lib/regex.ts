/** 正则工具：构建校验、匹配执行、逐 token 中文解释（纯函数，无 DOM 依赖） */

/* ==================== 构建与校验 ==================== */

const VALID_FLAGS = "dgimsuvy";

/**
 * 校验并构建 RegExp：flags 只允许 d g i m s u v y 的子集且不得重复；
 * 语法错误与非法 flags 一律返回 issue（中文说明），不抛异常。
 */
export function parseRegex(pattern: string, flags: string): { re?: RegExp; issue?: string } {
  const seen = new Set<string>();
  for (const f of flags) {
    if (!VALID_FLAGS.includes(f)) return { issue: `非法标志「${f}」：正则标志仅允许 d g i m s u v y 的子集` };
    if (seen.has(f)) return { issue: `标志「${f}」重复：每个标志最多出现一次` };
    seen.add(f);
  }
  try {
    return { re: new RegExp(pattern, flags) };
  } catch (e) {
    return { issue: `正则语法错误：${e instanceof Error ? e.message : "无法解析该表达式"}` };
  }
}

/* ==================== 匹配执行 ==================== */

export interface MatchInfo {
  /** 匹配起始位置（0 起，UTF-16 码元偏移） */
  index: number;
  /** 匹配长度（零宽匹配为 0） */
  length: number;
  /** 完整匹配文本 */
  full: string;
  /** 捕获组 1..n；未参与匹配的组为 null */
  groups: (string | null)[];
  /** 命名捕获组（pattern 含命名分组时才有） */
  named?: Record<string, string>;
}

/** 单次执行返回的匹配条数上限：超出截断，避免灾难性输入卡死页面 */
export const MAX_MATCHES = 10000;

/**
 * 执行匹配：内部克隆为带 g 标志的副本做全量迭代，不修改传入的 re；
 * 零宽匹配（length 0）时 lastIndex+1 防死循环；最多返回 MAX_MATCHES 条。
 */
export function runMatches(text: string, re: RegExp): MatchInfo[] {
  // sticky（y）会阻止全量迭代，克隆时去掉；再确保带 g
  const flags = re.flags.replace("y", "");
  const g = new RegExp(re.source, flags.includes("g") ? flags : `${flags}g`);
  const out: MatchInfo[] = [];
  let m: RegExpExecArray | null;
  while (out.length < MAX_MATCHES && (m = g.exec(text)) !== null) {
    out.push({
      index: m.index,
      length: m[0].length,
      full: m[0],
      groups: (m.slice(1) as Array<string | undefined>).map((v) => v ?? null),
      named: m.groups ? { ...m.groups } : undefined,
    });
    if (m[0] === "") g.lastIndex++; // 零宽匹配：前进一个字符防死循环
  }
  return out;
}

/* ==================== 逐 token 中文解释 ==================== */

export interface TokenExplain {
  /** 原始 pattern 中的 token 文本 */
  token: string;
  /** 中文解释 */
  desc: string;
}

const ESCAPE_DESC: Record<string, string> = {
  d: "数字 0-9",
  D: "非数字（0-9 以外的字符）",
  w: "字母、数字或下划线",
  W: "非字母、数字、下划线",
  s: "空白字符（空格、制表符、换行、回车等）",
  S: "非空白字符",
  b: "单词边界（锚点，不消耗字符）",
  B: "非单词边界（锚点，不消耗字符）",
  n: "换行符（\\n）",
  t: "制表符（\\t）",
  r: "回车符（\\r）",
  f: "换页符（\\f）",
  v: "垂直制表符（\\v）",
};

/**
 * 逐 token 解释正则 pattern（中文）。
 * 覆盖：字符类 [...]（含 ^ 取反）、分组 ( (?: (?<name> (?= (?! (?<= (?<!、
 * 锚点 ^ $ \b \B、量词 * + ? {n} {n,} {n,m} 及懒惰 ?、
 * 转义 \d \D \w \W \s \S \n \t \r \0 \xHH \uHHHH、或 |、点 .，其余按字面量。
 * 仅做词法解释，不校验整体语法；永不抛异常。
 */
export function explainRegex(pattern: string): TokenExplain[] {
  const out: TokenExplain[] = [];
  let prevIsQuantifier = false;
  let i = 0;

  const push = (token: string, desc: string, isQuantifier = false): void => {
    out.push({ token, desc });
    prevIsQuantifier = isQuantifier;
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    /* ---- 转义序列 ---- */
    if (ch === "\\") {
      const next = pattern[i + 1];
      if (next === undefined) {
        push("\\", "孤立反斜杠（语法错误：缺少被转义的字符）");
        i++;
        continue;
      }
      if (next === "x" && /^[0-9a-fA-F]{2}/.test(pattern.slice(i + 2, i + 4))) {
        const hh = pattern.slice(i + 2, i + 4);
        push(`\\x${hh}`, `十六进制转义：码位 0x${hh} 对应的字符`);
        i += 4;
        continue;
      }
      if (next === "u" && /^[0-9a-fA-F]{4}/.test(pattern.slice(i + 2, i + 6))) {
        const hhhh = pattern.slice(i + 2, i + 6);
        push(`\\u${hhhh}`, `Unicode 转义：字符 U+${hhhh}`);
        i += 6;
        continue;
      }
      // \0 后不能再跟数字（否则是八进制/反向引用语义）
      if (next === "0" && !/^[0-9]/.test(pattern[i + 2] ?? "")) {
        push("\\0", "空字符 NUL（\\u0000）");
        i += 2;
        continue;
      }
      const known = ESCAPE_DESC[next];
      if (known) {
        push(`\\${next}`, known);
        i += 2;
        continue;
      }
      push(`\\${next}`, `转义字符：按字面量匹配「${next}」`);
      i += 2;
      continue;
    }

    /* ---- 字符类 [...] ---- */
    if (ch === "[") {
      let j = i + 1;
      if (pattern[j] === "^") j++;
      if (pattern[j] === "]") j++; // [ ] 或 [^ ] 中紧邻的第一个 ] 是字面量
      while (j < pattern.length) {
        if (pattern[j] === "\\") j += 2;
        else if (pattern[j] === "]") break;
        else j++;
      }
      if (j >= pattern.length) {
        push(pattern.slice(i), "未闭合的字符类（缺少 ]，语法错误）");
        i = pattern.length;
        continue;
      }
      const cls = pattern.slice(i, j + 1);
      const negated = pattern[i + 1] === "^";
      push(
        cls,
        negated
          ? "否定字符类：匹配任意一个不在方括号内的字符"
          : "字符类：匹配方括号内的任意一个字符（- 表示范围）",
      );
      i = j + 1;
      continue;
    }

    /* ---- 分组与断言 ---- */
    if (ch === "(") {
      if (pattern.startsWith("(?:", i)) {
        push("(?:", "非捕获分组：只分组、不捕获");
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?<=", i)) {
        push("(?<=", "正向后瞻断言：要求当前位置之前能匹配（零宽，不消耗字符）");
        i += 4;
        continue;
      }
      if (pattern.startsWith("(?<!", i)) {
        push("(?<!", "负向后瞻断言：要求当前位置之前不能匹配（零宽，不消耗字符）");
        i += 4;
        continue;
      }
      if (pattern.startsWith("(?=", i)) {
        push("(?=", "正向前瞻断言：要求当前位置之后能匹配（零宽，不消耗字符）");
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?!", i)) {
        push("(?!", "负向前瞻断言：要求当前位置之后不能匹配（零宽，不消耗字符）");
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?<", i)) {
        const gt = pattern.indexOf(">", i + 3);
        if (gt === -1) {
          push(pattern.slice(i), "命名分组未闭合（缺少 >，语法错误）");
          i = pattern.length;
          continue;
        }
        push(pattern.slice(i, gt + 1), `命名捕获分组「${pattern.slice(i + 3, gt)}」`);
        i = gt + 1;
        continue;
      }
      push("(", "捕获分组：匹配并捕获，可按序号或名称引用");
      i++;
      continue;
    }
    if (ch === ")") {
      push(")", "分组结束");
      i++;
      continue;
    }

    /* ---- 锚点 ---- */
    if (ch === "^") {
      push("^", "锚点：字符串开头（m 标志下为行首）");
      i++;
      continue;
    }
    if (ch === "$") {
      push("$", "锚点：字符串结尾（m 标志下为行尾）");
      i++;
      continue;
    }

    /* ---- 或 / 点 ---- */
    if (ch === "|") {
      push("|", "或：匹配左侧或右侧表达式");
      i++;
      continue;
    }
    if (ch === ".") {
      push(".", "任意单个字符（默认不含换行符）");
      i++;
      continue;
    }

    /* ---- 量词 ---- */
    if (ch === "{") {
      const q = /^\{(\d+)(,(\d*))?\}/.exec(pattern.slice(i));
      if (q) {
        const token = q[0];
        let desc: string;
        if (!q[2]) desc = `量词：前一项恰好重复 ${q[1]} 次`;
        else if (!q[3]) desc = `量词：前一项至少重复 ${q[1]} 次`;
        else desc = `量词：前一项重复 ${q[1]} 到 ${q[3]} 次`;
        push(token, desc, true);
        i += token.length;
        continue;
      }
      push("{", "字面量「{」（不构成合法量词）");
      i++;
      continue;
    }
    if (ch === "*") {
      push("*", "量词：前一项重复 0 次或多次", true);
      i++;
      continue;
    }
    if (ch === "+") {
      push("+", "量词：前一项重复 1 次或多次", true);
      i++;
      continue;
    }
    if (ch === "?") {
      if (prevIsQuantifier) push("?", "懒惰修饰符：跟在量词后，尽可能少匹配");
      else push("?", "量词：前一项出现 0 次或 1 次", true);
      i++;
      continue;
    }

    /* ---- 其余为字面量 ---- */
    push(ch, `字面量「${ch}」`);
    i++;
  }
  return out;
}
