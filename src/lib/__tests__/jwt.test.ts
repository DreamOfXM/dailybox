import { describe, expect, it } from "vitest";
import { encodeBase64 } from "../base64";
import { claimTimes, decodeJwt } from "../jwt";

/** jwt.io 官方示例 token（HS256，header={"alg":"HS256","typ":"JWT"}） */
const JWT_IO_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/** 文本 → base64url 段（复用 base64.ts 编码器构造测试向量，避免手写常量） */
function seg(text: string): string {
  return encodeBase64(new TextEncoder().encode(text), true);
}

describe("decodeJwt", () => {
  it("jwt.io 官方示例：header / payload / signature 全部正确", () => {
    const r = decodeJwt(JWT_IO_TOKEN);
    if (!r.ok) throw new Error(r.message);
    expect(r.value.header.alg).toBe("HS256");
    expect(r.value.header.typ).toBe("JWT");
    expect(r.value.payload.sub).toBe("1234567890");
    expect(r.value.payload.name).toBe("John Doe");
    expect(r.value.payload.iat).toBe(1516239022);
    expect(r.value.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    expect(r.value.headerRaw).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(r.value.payloadRaw).toBe(
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    );
  });

  it("两段 token（无签名）可解，signature 缺省", () => {
    const twoSeg = JWT_IO_TOKEN.split(".").slice(0, 2).join(".");
    const r = decodeJwt(twoSeg);
    if (!r.ok) throw new Error(r.message);
    expect(r.value.header.alg).toBe("HS256");
    expect(r.value.payload.sub).toBe("1234567890");
    expect(r.value.signature).toBeUndefined();
  });

  it("一段 / 四段 / 空串报错", () => {
    expect(decodeJwt("abcdef").ok).toBe(false);
    expect(decodeJwt("a.b.c.d").ok).toBe(false);
    expect(decodeJwt("").ok).toBe(false);
    const r = decodeJwt("a.b.c.d");
    if (r.ok) throw new Error("应当失败");
    expect(r.message).toContain("段");
  });

  it("非法 base64url 段报错", () => {
    // 长度非法（去填充后末组剩 1 个字符）
    expect(decodeJwt(`A.${seg('{"sub":"1"}')}`).ok).toBe(false);
    // 非法字符
    expect(decodeJwt(`!!!.${seg('{"sub":"1"}')}`).ok).toBe(false);
    // payload 段非法
    expect(decodeJwt(`${seg('{"alg":"none"}')}.@@@`).ok).toBe(false);
  });

  it("段解码后不是合法 JSON 报错", () => {
    // "hello" 的 base64 为 aGVsbG8=
    const r = decodeJwt("aGVsbG8=.eyJhIjoxfQ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("JSON");
  });

  it("payload 为数组 / 字符串 / 数字时报错", () => {
    const header = seg('{"alg":"none"}');
    for (const bad of ["[1,2,3]", '"str"', "123"]) {
      const r = decodeJwt(`${header}.${seg(bad)}`);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toContain("对象");
    }
  });

  it("中文 claim 值正常解码（UTF-8）", () => {
    const token = `${seg('{"alg":"HS256","typ":"JWT"}')}.${seg('{"name":"张三","city":"北京","备注":"每日打卡"}')}`;
    const r = decodeJwt(token);
    if (!r.ok) throw new Error(r.message);
    expect(r.value.payload.name).toBe("张三");
    expect(r.value.payload.city).toBe("北京");
    expect(r.value.payload["备注"]).toBe("每日打卡");
  });
});

describe("claimTimes", () => {
  /** 固定 now：2023-11-14T22:13:20Z（Unix 秒），测试不依赖真实当前时间 */
  const NOW = 1_700_000_000;

  it("iat / nbf / exp 均存在时按此顺序返回，状态与相对时间正确", () => {
    const infos = claimTimes(
      { iat: NOW - 3 * 86400, nbf: NOW - 10, exp: NOW + 7 * 86400 },
      NOW,
    );
    expect(infos.map((i) => i.claim)).toEqual(["iat", "nbf", "exp"]);
    expect(infos[0].seconds).toBe(NOW - 3 * 86400);
    expect(infos[0].relative).toBe("3 天前");
    expect(infos[0].status).toBe("active");
    expect(infos[1].relative).toBe("刚刚");
    expect(infos[1].status).toBe("active");
    expect(infos[2].relative).toBe("7 天后");
    expect(infos[2].status).toBe("active");
  });

  it("exp 在过去 → expired；在未来 → active（固定 now 注入）", () => {
    const past = claimTimes({ exp: NOW - 2 * 3600 }, NOW);
    expect(past).toHaveLength(1);
    expect(past[0].status).toBe("expired");
    expect(past[0].relative).toBe("2 小时前");
    const future = claimTimes({ exp: NOW + 2 * 3600 }, NOW);
    expect(future[0].status).toBe("active");
    expect(future[0].relative).toBe("2 小时后");
  });

  it("nbf 在未来 → pending；在过去 → active", () => {
    expect(claimTimes({ nbf: NOW + 2 * 3600 }, NOW)[0].status).toBe("pending");
    expect(claimTimes({ nbf: NOW - 100 }, NOW)[0].status).toBe("active");
    expect(claimTimes({ nbf: NOW - 100 }, NOW)[0].relative).toBe("1 分钟前");
  });

  it("等于 now 的时间 → 刚刚", () => {
    expect(claimTimes({ iat: NOW }, NOW)[0].relative).toBe("刚刚");
  });

  it("无时间 claim 返回空数组", () => {
    expect(claimTimes({ sub: "x", name: "John Doe" }, NOW)).toEqual([]);
  });

  it("非数值型时间 claim 被忽略", () => {
    expect(claimTimes({ exp: "1600000000", iat: null, nbf: undefined }, NOW)).toEqual([]);
  });

  it("local 为 zh-CN 24 小时制本地时间（与 Date API 对齐，不手写常量）", () => {
    const infos = claimTimes({ iat: 1516239022 }, NOW);
    expect(infos[0].local).toBe(new Date(1516239022 * 1000).toLocaleString("zh-CN", { hour12: false }));
  });
});
