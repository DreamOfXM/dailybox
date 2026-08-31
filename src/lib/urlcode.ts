/** URL 编解码核心（纯函数，无 DOM 依赖；错误语义复用 base64.ts 的 TryResult 返回模式） */

import type { TryResult } from "./base64";

/* ==================== 编码 ==================== */

/** 组件级 URL 编码（encodeURIComponent 包装）：编码 & ? = / # + 空格等保留字符，中文/emoji 安全 */
export function encodeUrlComponent(s: string): string {
  return encodeURIComponent(s);
}

/** 整条 URL 编码（encodeURI 包装）：保留 URL 语法字符 : / ? # & = @ + 等 */
export function encodeUrl(s: string): string {
  return encodeURI(s);
}

/** 表单模式编码（application/x-www-form-urlencoded）：encodeURIComponent 后把 %20 替换为 + */
export function encodeFormUrl(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

/* ==================== 解码 ==================== */

/**
 * URL 解码，三种模式：
 * - component：decodeURIComponent，严格解码全部 % 序列
 * - uri：decodeURI，保留 URL 语法字符
 * - form：表单模式，先把 + 还原为空格再 decodeURIComponent
 * 非法序列返回 { ok:false, message }（中文说明），永不抛异常。
 */
export function decodeUrl(s: string, mode: "component" | "uri" | "form"): TryResult<string> {
  try {
    if (mode === "form") return { ok: true, value: decodeURIComponent(s.replace(/\+/g, " ")) };
    if (mode === "uri") return { ok: true, value: decodeURI(s) };
    return { ok: true, value: decodeURIComponent(s) };
  } catch {
    return { ok: false, message: `解码失败（${mode} 模式）：输入包含非法或残缺的 % 转义序列` };
  }
}

function isHexChar(c: string | undefined): boolean {
  if (!c) return false;
  return (c >= "0" && c <= "9") || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
}

/**
 * 宽容解码：连续的合法 %HH 片段正常解码；残缺/非法 % 序列
 * （如末尾孤立 %、%ZZ、形似合法但不构成合法 UTF-8 的 %C3）原样保留该片段，
 * 其余字符照抄。永不抛异常，始终返回 ok:true。
 * 注意：不做表单 + → 空格 还原，+ 按字面量保留。
 */
export function safeDecode(s: string): TryResult<string> {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch !== "%") {
      out += ch;
      i++;
      continue;
    }
    // 收集从 i 开始的连续合法 %HH 片段
    let j = i;
    while (j + 3 <= s.length && s[j] === "%" && isHexChar(s[j + 1]) && isHexChar(s[j + 2])) {
      j += 3;
    }
    if (j > i) {
      const seg = s.slice(i, j);
      try {
        out += decodeURIComponent(seg);
      } catch {
        out += seg; // 百分号形式合法但字节序列不是合法 UTF-8：原样保留
      }
      i = j;
    } else {
      out += "%"; // 残缺片段（如 %Z、%2、末尾孤立 %）：原样保留这个 %
      i++;
    }
  }
  return { ok: true, value: out };
}
