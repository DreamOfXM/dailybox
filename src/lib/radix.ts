/** 任意进制（2-36）解析与转换：基于 bigint，大数无损；错误信息为中文 */

import type { TryResult } from "./base64";

/** 数字字符表：下标即数值，覆盖 0-9 与 a-z */
export const RADIX_DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/** 字符 → 数值（字母大小写均可）；非法字符取不到值 */
const CHAR_VALUES = new Map<string, number>();
for (let i = 0; i < RADIX_DIGITS.length; i++) {
  const c = RADIX_DIGITS[i];
  CHAR_VALUES.set(c, i);
  CHAR_VALUES.set(c.toUpperCase(), i);
}

/** 进制是否合法：2-36 的整数 */
function isValidRadix(radix: number): boolean {
  return Number.isInteger(radix) && radix >= 2 && radix <= 36;
}

/** 数字前缀：仅当 from 与之一致时剥离（0x→16 / 0o→8 / 0b→2） */
const RADIX_PREFIX: Record<number, string> = { 16: "x", 8: "o", 2: "b" };

/**
 * 按 from 进制解析字符串为 bigint；空串 / 非法字符 / 进制越界返回 null。
 * 允许前导 -/+（可在 0x/0o/0b 前缀之前）；字母大小写均可；
 * 0x/0o/0b 前缀仅在 from 为 16/8/2 时剥离，否则按普通字符校验。
 */
export function parseRadix(s: string, from: number): bigint | null {
  if (!isValidRadix(from)) return null;
  let str = s;
  let neg = false;
  if (str.startsWith("-") || str.startsWith("+")) {
    neg = str.startsWith("-");
    str = str.slice(1);
  }
  const prefix = RADIX_PREFIX[from];
  if (prefix && str.length >= 2 && str[0] === "0" && str[1].toLowerCase() === prefix) {
    str = str.slice(2);
  }
  if (!str) return null;
  const base = BigInt(from);
  let v = 0n;
  for (const c of str) {
    const d = CHAR_VALUES.get(c);
    if (d === undefined || d >= from) return null;
    v = v * base + BigInt(d);
  }
  return neg ? -v : v;
}

/** bigint → to 进制字符串（小写字母；负数带 - 前缀）；to 越界抛错 */
export function toRadix(v: bigint, to: number): string {
  if (!isValidRadix(to)) throw new Error("进制必须在 2 到 36 之间");
  if (v === 0n) return "0";
  const neg = v < 0n;
  let n = neg ? -v : v;
  const base = BigInt(to);
  let out = "";
  while (n > 0n) {
    out = RADIX_DIGITS[Number(n % base)] + out;
    n /= base;
  }
  return neg ? `-${out}` : out;
}

/** from 进制字符串 → to 进制字符串；任何错误返回 { ok:false, message }（中文，可直接展示） */
export function convertRadix(s: string, from: number, to: number): TryResult<string> {
  if (!isValidRadix(from)) return { ok: false, message: `源进制 ${from} 不合法，仅支持 2-36` };
  if (!isValidRadix(to)) return { ok: false, message: `目标进制 ${to} 不合法，仅支持 2-36` };
  const v = parseRadix(s, from);
  if (v === null) return { ok: false, message: `「${s}」不是合法的 ${from} 进制数` };
  return { ok: true, value: toRadix(v, to) };
}

/** 常用进制卡片：页面快捷入口（二进制 / 八进制 / 十进制 / 十六进制） */
export const RADIX_CARDS: Array<{ base: number; label: string; hint: string }> = [
  { base: 2, label: "二进制 BIN", hint: "仅含 0 和 1，计算机底层计数" },
  { base: 8, label: "八进制 OCT", hint: "数字 0-7，常见于 Unix 文件权限" },
  { base: 10, label: "十进制 DEC", hint: "日常通用的计数方式" },
  { base: 16, label: "十六进制 HEX", hint: "0-9 与 a-f，常见于颜色码与内存地址" },
];
