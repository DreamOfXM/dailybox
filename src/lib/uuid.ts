/** UUID 生成：v4（纯随机）与 v7（RFC 9562，时间有序）；另提供批量生成与区间随机数 */

import { secureRandomInt, type RandomInt } from "./random";

/** 16 字节 → 8-4-4-4-12 标准格式（小写十六进制） */
function formatUuid(bytes: Uint8Array): string {
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * UUID v4：16 个随机字节，第 7 字节高 4 位置 0100（version 4），
 * 第 9 字节高 2 位置 10（variant）。rng 缺省用密码学安全源。
 */
export function uuidV4(rng: RandomInt = secureRandomInt): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = rng(256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

/**
 * UUID v7（RFC 9562）：前 48 位 = unix 毫秒时间戳（大端），version 7，
 * variant 10，其余为随机；时间戳越大字典序越大。now 缺省 Date.now()。
 */
export function uuidV7(now?: number, rng: RandomInt = secureRandomInt): string {
  let ts = Math.floor(now ?? Date.now()) % 0x1000000000000; // 截取 48 位
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = rng(256);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuid(bytes);
}

export interface BatchOptions {
  /** 输出大写 */
  upper?: boolean;
  /** 去掉连字符（32 位纯十六进制） */
  noDash?: boolean;
  /** 仅 v7 生效：固定时间戳（毫秒） */
  now?: number;
}

/** 批量生成 UUID；n 上限 10000，超出抛错 */
export function generateBatch(n: number, version: 4 | 7, opts?: BatchOptions): string[] {
  if (!Number.isInteger(n) || n < 0) throw new Error("批量数量必须为非负整数");
  if (n > 10000) throw new Error("批量数量不能超过 10000");
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let s = version === 4 ? uuidV4() : uuidV7(opts?.now);
    if (opts?.noDash) s = s.replace(/-/g, "");
    if (opts?.upper) s = s.toUpperCase();
    out.push(s);
  }
  return out;
}

export interface RandomNumberOptions {
  /** 下界（含） */
  min: number;
  /** 上界（含，因四舍五入可能取到） */
  max: number;
  /** 保留小数位（四舍五入）；缺省不取整 */
  decimals?: number;
}

/** 区间随机数：min>max 抛错；decimals 控制小数位（四舍五入）。rng 缺省密码学安全源 */
export function randomNumber(opts: RandomNumberOptions, rng: RandomInt = secureRandomInt): number {
  const { min, max, decimals } = opts;
  if (min > max) throw new Error("min 不能大于 max");
  const u = rng(0x100000000) / 0x100000000; // [0, 1)
  let v = min + u * (max - min);
  if (decimals !== undefined) {
    const f = 10 ** decimals;
    v = Math.round(v * f) / f;
  }
  return v;
}
