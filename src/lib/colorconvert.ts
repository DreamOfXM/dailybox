/** 颜色格式互转（HEX / RGB / HSL，纯函数，可单测） */

import type { TryResult } from "./base64";

export interface Rgb {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface Hsl {
  h: number; // 0-360 度
  s: number; // 0-100 %
  l: number; // 0-100 %
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/* ==================== HEX ==================== */

/**
 * HEX → RGB。支持 #RGB / #RRGGBB / 不带 # 的写法，大小写不敏感。
 * 非法输入返回 ok:false（中文提示可直接展示）。
 */
export function hexToRgb(hex: string): TryResult<Rgb> {
  if (typeof hex !== "string") {
    return { ok: false, message: "颜色值必须是文本" };
  }
  let s = hex.trim();
  if (s.startsWith("#")) s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) {
    return { ok: false, message: "HEX 颜色格式非法：仅支持 #RGB 或 #RRGGBB（十六进制）" };
  }
  return {
    ok: true,
    value: {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    },
  };
}

/** RGB → 大写 #RRGGBB；越界分量收敛到 0-255，非数字按 0 处理 */
export function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (n: number): string =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return "#" + to2(r) + to2(g) + to2(b);
}

/**
 * 归一化任意合法 HEX 写法为 #RRGGBB（大写、短写展开）。
 * 如 "#fff" → "#FFFFFF"、"abc" → "#AABBCC"；非法输入 ok:false。
 */
export function normalizeHex(input: string): TryResult<string> {
  const rgb = hexToRgb(input);
  if (!rgb.ok) return rgb;
  return { ok: true, value: rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b) };
}

/* ==================== RGB ↔ HSL ==================== */

/** RGB → HSL；h 为 0-360 整数（360 归零），s/l 为 0-100 整数。越界分量先收敛 */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  let hh = Math.round(h) % 360;
  if (hh < 0) hh += 360;
  return { h: hh, s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * HSL → RGB；h 允许任意数值（按 360 取模循环），s/l 收敛到 0-100。
 * 返回分量四舍五入到 0-255 整数。
 */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hn = ((Number.isFinite(h) ? h : 0) % 360 + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1: number;
  let g1: number;
  let b1: number;
  if (hn < 60) [r1, g1, b1] = [c, x, 0];
  else if (hn < 120) [r1, g1, b1] = [x, c, 0];
  else if (hn < 180) [r1, g1, b1] = [0, c, x];
  else if (hn < 240) [r1, g1, b1] = [0, x, c];
  else if (hn < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const f = (v: number): number => Math.round((v + m) * 255);
  return { r: f(r1), g: f(g1), b: f(b1) };
}

/* ==================== 字符串解析（组件层输入联动用） ==================== */

/**
 * 解析 RGB 文本：兼容 "255, 0, 0" / "rgb(255,0,0)" / "rgb(255 0 0)"。
 * 分量必须是 0-255 的整数，否则 ok:false。
 */
export function parseRgb(input: string): TryResult<Rgb> {
  const s = String(input)
    .trim()
    .replace(/^rgb\s*\(\s*/i, "")
    .replace(/\s*\)\s*$/, "");
  const parts = s.split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 3) {
    return { ok: false, message: "RGB 需要 3 个分量，如 rgb(255, 0, 0)" };
  }
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return { ok: false, message: "RGB 分量必须是 0-255 的整数" };
  }
  return { ok: true, value: { r: nums[0], g: nums[1], b: nums[2] } };
}

/**
 * 解析 HSL 文本：兼容 "0, 100%, 50%" / "hsl(0, 100%, 50%)" / "hsl(0 100% 50%)"。
 * h 为 0-360，s/l 为 0-100% 百分数，否则 ok:false。
 */
export function parseHsl(input: string): TryResult<Hsl> {
  const s = String(input)
    .trim()
    .replace(/^hsl\s*\(\s*/i, "")
    .replace(/\s*\)\s*$/, "");
  const parts = s.split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 3) {
    return { ok: false, message: "HSL 需要 3 个分量，如 hsl(0, 100%, 50%)" };
  }
  const h = Number(parts[0]);
  const sm = /^(\d+(?:\.\d+)?)%$/.exec(parts[1]);
  const lm = /^(\d+(?:\.\d+)?)%$/.exec(parts[2]);
  if (!Number.isFinite(h) || h < 0 || h > 360) {
    return { ok: false, message: "HSL 色相 h 必须是 0-360 的数字" };
  }
  if (!sm || !lm) {
    return { ok: false, message: "HSL 饱和度 s 与亮度 l 必须是百分数，如 100%" };
  }
  const sn = Number(sm[1]);
  const ln = Number(lm[1]);
  if (sn > 100 || ln > 100) {
    return { ok: false, message: "HSL 饱和度 s 与亮度 l 不能超过 100%" };
  }
  return { ok: true, value: { h, s: sn, l: ln } };
}

/* ==================== 展示格式化 ==================== */

/** RGB → "rgb(255, 0, 0)" */
export function rgbToString(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/** HSL → "hsl(0, 100%, 50%)" */
export function hslToString(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
