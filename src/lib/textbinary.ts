/** 文本 ↔ 二进制互转（纯函数）：按 UTF-8 逐字节转 8 位 01 序列，双向可逆 */

import type { TryResult } from "./base64";

/** 文本 → 二进制：UTF-8 编码后每字节输出 8 位二进制，用 sep 连接（默认空格） */
export function textToBinary(text: string, sep: string = " "): string {
  const bytes = new TextEncoder().encode(text);
  const parts: string[] = [];
  for (const b of bytes) parts.push(b.toString(2).padStart(8, "0"));
  return parts.join(sep);
}

/** 分隔符为空或纯空白时按「连续流」解析：忽略所有空白，总位数须是 8 的倍数 */
function isWhitespaceSep(sep: string): boolean {
  return sep === "" || /^\s+$/.test(sep);
}

/**
 * 二进制 → 文本：按 sep 分组（默认空格），每组必须恰好 8 位 0/1。
 * - sep 为空或纯空白时按连续流解析，忽略所有空白（换行/制表符/多空格均容错）
 * - 自定义分隔符（如 - ,）时按其分组，空组跳过，组内空白忽略
 * - 非法 01 序列（含非 0/1 字符、位数不是 8 的倍数/每组不足 8 位）返回 { ok:false }
 * - 字节序列不是合法 UTF-8（如残缺的多字节字符）也返回 { ok:false }
 */
export function binaryToText(bin: string, sep: string = " "): TryResult<string> {
  const groups: string[] = [];

  if (isWhitespaceSep(sep)) {
    const s = bin.replace(/\s/g, "");
    if (s === "") return { ok: true, value: "" };
    const bad = /[^01]/.exec(s);
    if (bad) return { ok: false, message: `含非 0/1 字符「${bad[0]}」，无法还原文本` };
    if (s.length % 8 !== 0) {
      return { ok: false, message: `共 ${s.length} 位，不是 8 的倍数，无法按字节还原` };
    }
    for (let k = 0; k < s.length; k += 8) groups.push(s.slice(k, k + 8));
  } else {
    const parts = bin
      .split(sep)
      .map((t) => t.replace(/\s/g, ""))
      .filter((t) => t !== "");
    if (parts.length === 0) return { ok: true, value: "" };
    for (let i = 0; i < parts.length; i++) {
      const g = parts[i];
      if (/[^01]/.test(g)) return { ok: false, message: `第 ${i + 1} 组「${g}」含非 0/1 字符，无法还原` };
      if (g.length !== 8) return { ok: false, message: `第 ${i + 1} 组「${g}」长度为 ${g.length} 位，每组必须恰好 8 位` };
      groups.push(g);
    }
  }

  const bytes = Uint8Array.from(groups.map((g) => parseInt(g, 2)));
  try {
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, message: "字节序列不是合法的 UTF-8 文本（可能是残缺的多字节字符）" };
  }
}
