import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashAll, md5, sha1, sha256, sha384, sha512, toBase64, toHex } from "../hash";

const hasSubtle = !!globalThis.crypto?.subtle;

/** node:crypto 作为对照基准 */
function nodeHex(algo: string, input: string | Uint8Array): string {
  return createHash(algo).update(input).digest("hex");
}

const RANDOM_POOL = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:'\",.<>/?",
  ..."你好世界中文测试数据哈希摘要",
  ..."🌍😀🚀",
];

function randomString(maxLen: number): string {
  const len = Math.floor(Math.random() * (maxLen + 1));
  let s = "";
  for (let i = 0; i < len; i++) s += RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  return s;
}

describe("md5：RFC 1321 官方向量", () => {
  const RFC1321_VECTORS: Array<[string, string]> = [
    ["", "d41d8cd98f00b204e9800998ecf8427e"],
    ["a", "0cc175b9c0f1b6a831c399e269772661"],
    ["abc", "900150983cd24fb0d6963f7d28e17f72"],
    ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
    ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
    [
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      "d174ab98d277d9f5a5611c2c9f419d9f",
    ],
    [
      "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
      "57edf4a22be3c955ac49da2e2107b67a",
    ],
  ];

  it("7 条全量向量逐条一致", () => {
    for (const [input, hex] of RFC1321_VECTORS) {
      expect(toHex(md5(input)), `md5(${JSON.stringify(input)})`).toBe(hex);
    }
  });
});

describe("md5：node:crypto 随机与边界对照", () => {
  it("100 条随机字符串（长度 0~300，含中文/emoji）逐条一致", () => {
    for (let i = 0; i < 100; i++) {
      const s = randomString(300);
      expect(toHex(md5(s)), `第 ${i + 1} 条: ${JSON.stringify(s)}`).toBe(nodeHex("md5", s));
    }
  });

  it("块边界长度 55/56/63/64/111/112/119/120/128 字节一致", () => {
    for (const n of [55, 56, 63, 64, 111, 112, 119, 120, 128]) {
      const bytes = new Uint8Array(n);
      for (let i = 0; i < n; i++) bytes[i] = (i * 31 + 7) & 0xff;
      expect(toHex(md5(bytes)), `长度 ${n} 字节`).toBe(nodeHex("md5", bytes));
    }
  });

  it("多块长输入（>64 字节字符串）一致", () => {
    const s = "abcd".repeat(500); // 2000 字节
    expect(toHex(md5(s))).toBe(nodeHex("md5", s));
  });

  it("中文 UTF-8 编码与 node:crypto 一致", () => {
    const s = "你好，世界！🌍 dailybox 哈希";
    expect(toHex(md5(s))).toBe(nodeHex("md5", s));
  });

  it("接受 Uint8Array 输入", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe]);
    expect(toHex(md5(bytes))).toBe(nodeHex("md5", bytes));
  });
});

describe("sha 系列", () => {
  it("sha256('abc') 权威向量", async () => {
    const VECTOR = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    if (hasSubtle) {
      expect(toHex(await sha256("abc"))).toBe(VECTOR);
    } else {
      // 无 crypto.subtle 的环境（非 secure context）：用 node:crypto 对照向量
      expect(nodeHex("sha256", "abc")).toBe(VECTOR);
    }
  });

  it("sha1('abc') 权威向量", async () => {
    const VECTOR = "a9993e364706816aba3e25717850c26c9cd0d89d";
    if (hasSubtle) {
      expect(toHex(await sha1("abc"))).toBe(VECTOR);
    } else {
      expect(nodeHex("sha1", "abc")).toBe(VECTOR);
    }
  });

  if (hasSubtle) {
    it("sha1/sha256/sha384/sha512 与 node:crypto 随机对照", async () => {
      for (let i = 0; i < 20; i++) {
        const s = randomString(300);
        expect(toHex(await sha1(s)), `sha1 第 ${i + 1} 条`).toBe(nodeHex("sha1", s));
        expect(toHex(await sha256(s)), `sha256 第 ${i + 1} 条`).toBe(nodeHex("sha256", s));
        expect(toHex(await sha384(s)), `sha384 第 ${i + 1} 条`).toBe(nodeHex("sha384", s));
        expect(toHex(await sha512(s)), `sha512 第 ${i + 1} 条`).toBe(nodeHex("sha512", s));
      }
    });

    it("sha 系列接受 Uint8Array 输入", async () => {
      const bytes = new TextEncoder().encode("字节输入 🌍");
      expect(toHex(await sha256(bytes))).toBe(nodeHex("sha256", bytes));
    });
  } else {
    it("无 crypto.subtle 时以中文错误 reject（不抛未捕获异常）", async () => {
      await expect(sha1("abc")).rejects.toThrow(/crypto/);
      await expect(sha256("abc")).rejects.toThrow(/crypto/);
      await expect(sha384("abc")).rejects.toThrow(/crypto/);
      await expect(sha512("abc")).rejects.toThrow(/crypto/);
    });
  }
});

describe("toHex / toBase64 / hashAll", () => {
  it("toHex upper 选项", () => {
    expect(toHex(md5(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(toHex(md5(""), { upper: true })).toBe("D41D8CD98F00B204E9800998ECF8427E");
  });

  it("toBase64 与 Buffer 编码一致", () => {
    expect(toBase64(md5("abc"))).toBe(Buffer.from(md5("abc")).toString("base64"));
    expect(toBase64(md5(""))).toBe(Buffer.from("d41d8cd98f00b204e9800998ecf8427e", "hex").toString("base64"));
  });

  if (hasSubtle) {
    it("hashAll 五种算法齐全且与 node:crypto 一致", async () => {
      const s = "dailybox 哈希全家桶 🌍";
      const r = await hashAll(s);
      expect(Object.keys(r).sort()).toEqual(["md5", "sha1", "sha256", "sha384", "sha512"].sort());
      expect(r.md5).toBe(nodeHex("md5", s));
      expect(r.sha1).toBe(nodeHex("sha1", s));
      expect(r.sha256).toBe(nodeHex("sha256", s));
      expect(r.sha384).toBe(nodeHex("sha384", s));
      expect(r.sha512).toBe(nodeHex("sha512", s));
    });

    it("hashAll base64 与 upper 选项", async () => {
      const s = "abc";
      const b64 = await hashAll(s, { format: "base64" });
      expect(b64.md5).toBe(Buffer.from(nodeHex("md5", s), "hex").toString("base64"));
      expect(b64.sha256).toBe(Buffer.from(nodeHex("sha256", s), "hex").toString("base64"));
      const upper = await hashAll(s, { upper: true });
      expect(upper.md5).toBe(nodeHex("md5", s).toUpperCase());
      expect(upper.sha512).toBe(nodeHex("sha512", s).toUpperCase());
    });
  }
});
