/** 大小写 / 命名风格转换（纯函数） */

export type CaseMode = "upper" | "lower" | "capitalize" | "camel" | "snake" | "kebab";

/** 分词：连续字母/数字为一词（按非字母数字切分；汉字属于 \p{L}，整体保留） */
const TOKEN_RE = /[\p{L}\p{N}]+/gu;

/** 首字符（首个字母）大写，其余不变 */
function upperFirst(token: string): string {
  return token.replace(/\p{L}/u, (c) => c.toUpperCase());
}

/**
 * 文本大小写 / 命名风格转换。
 * upper / lower / capitalize 保留原有空白与标点；
 * camel / snake / kebab 按非字母数字分词后重组，中文等非拉丁字符原样保留。
 */
export function convertCase(text: string, mode: CaseMode): string {
  if (text === "") return "";
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "capitalize":
      // 每个空白分隔词的首字母大写，空白本身原样保留
      return text.replace(/\S+/g, (w) => upperFirst(w));
    case "camel":
    case "snake":
    case "kebab": {
      const tokens = text.match(TOKEN_RE) ?? [];
      if (tokens.length === 0) return "";
      if (mode === "snake") return tokens.map((t) => t.toLowerCase()).join("_");
      if (mode === "kebab") return tokens.map((t) => t.toLowerCase()).join("-");
      // camelCase：首词全小写，后续词小写后首字母大写
      return tokens
        .map((t, i) => (i === 0 ? t.toLowerCase() : upperFirst(t.toLowerCase())))
        .join("");
    }
  }
}
