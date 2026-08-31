/** 哈希摘要核心：MD5（RFC 1321 纯 JS 实现）+ SHA-1/256/384/512（Web Crypto）；纯函数，无 DOM 依赖 */

import { encodeBase64 } from "./base64";

/* ==================== MD5（RFC 1321 纯 JS 实现） ==================== */

/** 每轮左移位数表（RFC 1321 §3.4） */
const MD5_SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** 常量表 K[i] = floor(2^32 × |sin(i + 1)|)（RFC 1321 §3.4，按公式精确计算） */
const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);

function rotl32(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/** 字符串 → UTF-8 字节；字节输入原样返回 */
function toBytes(input: string | Uint8Array): Uint8Array {
  return typeof input === "string" ? new TextEncoder().encode(input) : input;
}

/**
 * MD5 摘要（RFC 1321）：字符串输入先转 UTF-8 字节，返回 16 字节摘要。
 * 支持 >64 字节多块；填充规则：0x80 + 零填充到 56 mod 64 + 64 位小端 bit 长度。
 */
export function md5(input: string | Uint8Array): Uint8Array {
  const data = toBytes(input);
  const len = data.length;
  const padded = len + 1 + ((55 - (len % 64) + 64) % 64) + 8;
  const buf = new Uint8Array(padded);
  buf.set(data);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  // bit 长度按 64 位小端写入（低 32 位 + 高 32 位分开计算，避免 JS 位运算溢出）
  view.setUint32(padded - 8, (len % 0x20000000) * 8, true);
  view.setUint32(padded - 4, Math.floor(len / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const M = new Uint32Array(16);

  for (let off = 0; off < padded; off += 64) {
    for (let k = 0; k < 16; k++) M[k] = view.getUint32(off + k * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) & 15;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) & 15;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) & 15;
      }
      const tmp = (F + A + MD5_K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl32(tmp, MD5_SHIFT[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true);
  ov.setUint32(4, b0, true);
  ov.setUint32(8, c0, true);
  ov.setUint32(12, d0, true);
  return out;
}

/* ==================== SHA 系列（Web Crypto） ==================== */

export type HashAlgo = "md5" | "sha1" | "sha256" | "sha384" | "sha512";

const SUBTLE_ALGO = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
} as const;

type SubtleAlgo = keyof typeof SUBTLE_ALGO;

/** 共享实现：crypto.subtle 不存在（非 secure context）时 reject 并带明确中文错误 */
async function subtleDigest(algo: SubtleAlgo, input: string | Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("当前环境不支持 Web Crypto（crypto.subtle）：请在 HTTPS 或 localhost 等安全上下文中使用");
  }
  const src = toBytes(input);
  const data = new Uint8Array(src.byteLength);
  data.set(src);
  const buf = await subtle.digest(SUBTLE_ALGO[algo], data);
  return new Uint8Array(buf);
}

/** SHA-1 摘要（20 字节）；字符串先转 UTF-8 字节；无 crypto.subtle 时 reject（中文错误） */
export function sha1(input: string | Uint8Array): Promise<Uint8Array> {
  return subtleDigest("sha1", input);
}

/** SHA-256 摘要（32 字节） */
export function sha256(input: string | Uint8Array): Promise<Uint8Array> {
  return subtleDigest("sha256", input);
}

/** SHA-384 摘要（48 字节） */
export function sha384(input: string | Uint8Array): Promise<Uint8Array> {
  return subtleDigest("sha384", input);
}

/** SHA-512 摘要（64 字节） */
export function sha512(input: string | Uint8Array): Promise<Uint8Array> {
  return subtleDigest("sha512", input);
}

/* ==================== 摘要格式化 ==================== */

/** 字节 → 十六进制字符串；upper=true 输出大写 */
export function toHex(bytes: Uint8Array, opts?: { upper?: boolean }): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return opts?.upper ? s.toUpperCase() : s;
}

/** 字节 → 标准 Base64（复用 base64.ts 编码核心） */
export function toBase64(bytes: Uint8Array): string {
  return encodeBase64(bytes);
}

/* ==================== 一键全量 ==================== */

/**
 * 一次计算 MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 全部五种摘要。
 * format 默认 hex，可选 base64；upper 仅对 hex 生效。
 */
export async function hashAll(
  text: string,
  opts?: { upper?: boolean; format?: "hex" | "base64" },
): Promise<Record<HashAlgo, string>> {
  const format = opts?.format ?? "hex";
  const upper = opts?.upper ?? false;
  const encode = (b: Uint8Array): string => (format === "base64" ? toBase64(b) : toHex(b, { upper }));
  const bytes = toBytes(text);
  const [s1, s256, s384, s512] = await Promise.all([sha1(bytes), sha256(bytes), sha384(bytes), sha512(bytes)]);
  return {
    md5: encode(md5(bytes)),
    sha1: encode(s1),
    sha256: encode(s256),
    sha384: encode(s384),
    sha512: encode(s512),
  };
}
