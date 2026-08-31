/** JWT 解码与时间声明（claim）解析（纯函数，只解码不验签；复用 base64.ts 的 base64url 解码） */

import { tryDecodeBase64ToText, type TryResult } from "./base64";

export type { TryResult };

/** JWT 结构：header / payload 为解析后的 JSON 对象，*Raw 保留 base64url 原文 */
export type JwtParts = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** 第三段原文；两段式（无签名）token 无此字段 */
  signature?: string;
  headerRaw: string;
  payloadRaw: string;
};

/** 单段 base64url → JSON 对象；解码失败 / JSON 非法 / 非对象均返回中文错误 */
function decodeSegment(raw: string, label: string): TryResult<Record<string, unknown>> {
  const text = tryDecodeBase64ToText(raw, { urlSafe: true });
  if (!text.ok) {
    return { ok: false, message: `JWT ${label} 段不是合法的 Base64URL 编码：${text.message}` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.value);
  } catch {
    return { ok: false, message: `JWT ${label} 段解码后不是合法 JSON` };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    const actual = parsed === null ? "null" : Array.isArray(parsed) ? "数组" : typeof parsed;
    return { ok: false, message: `JWT ${label} 必须是 JSON 对象，实际为${actual}` };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

/**
 * 解码 JWT（不校验签名）。按 "." 切分：2 段（无签名）或 3 段合法，其余报错。
 * header / payload 以 base64url 解码（自动补齐 padding、-_ → +/）后 JSON.parse。
 */
export function decodeJwt(token: string): TryResult<JwtParts> {
  const segs = token.trim().split(".");
  if (segs.length !== 2 && segs.length !== 3) {
    return {
      ok: false,
      message: `JWT 格式错误：应由 2 段或 3 段组成（以 . 分隔），实际为 ${segs.length} 段`,
    };
  }
  const header = decodeSegment(segs[0], "header");
  if (!header.ok) return header;
  const payload = decodeSegment(segs[1], "payload");
  if (!payload.ok) return payload;
  const parts: JwtParts = {
    header: header.value,
    payload: payload.value,
    headerRaw: segs[0],
    payloadRaw: segs[1],
  };
  if (segs.length === 3) parts.signature = segs[2];
  return { ok: true, value: parts };
}

/* ==================== 时间类 claim（iat / nbf / exp） ==================== */

export type ClaimStatus = "expired" | "active" | "pending";

export type ClaimTimeInfo = {
  claim: "iat" | "nbf" | "exp";
  /** 声明中的原始 Unix 时间戳（秒） */
  seconds: number;
  /** 本地时间展示（zh-CN，24 小时制） */
  local: string;
  /** 相对当前时间的中文描述，如 "3 天前"、"2 小时后"、"刚刚" */
  relative: string;
  status: ClaimStatus;
};

const TIME_CLAIMS: Array<ClaimTimeInfo["claim"]> = ["iat", "nbf", "exp"];

/** 目标时间相对 now 的中文描述：<1 分钟视为 "刚刚"，其余按 分/时/天/月/年 向下取整 */
function relativeZh(targetSec: number, nowSec: number): string {
  const diff = targetSec - nowSec;
  const abs = Math.abs(diff);
  if (abs < 60) return "刚刚";
  const suffix = diff > 0 ? "后" : "前";
  let v: number;
  let unit: string;
  if (abs < 3600) {
    v = Math.floor(abs / 60);
    unit = "分钟";
  } else if (abs < 86400) {
    v = Math.floor(abs / 3600);
    unit = "小时";
  } else if (abs < 86400 * 30) {
    v = Math.floor(abs / 86400);
    unit = "天";
  } else if (abs < 86400 * 365) {
    v = Math.floor(abs / (86400 * 30));
    unit = "个月";
  } else {
    v = Math.floor(abs / (86400 * 365));
    unit = "年";
  }
  return `${v} ${unit}${suffix}`;
}

/** exp 早于 now → expired；nbf 晚于 now → pending；其余（含 iat）→ active */
function claimStatus(claim: ClaimTimeInfo["claim"], seconds: number, nowSec: number): ClaimStatus {
  if (claim === "exp" && seconds < nowSec) return "expired";
  if (claim === "nbf" && seconds > nowSec) return "pending";
  return "active";
}

/**
 * 提取 payload 中存在且为数值型的 iat / nbf / exp 声明（按此顺序返回）。
 * now 为当前 Unix 时间戳（秒），缺省取 Date.now()/1000，测试可注入固定值。
 */
export function claimTimes(payload: Record<string, unknown>, now?: number): ClaimTimeInfo[] {
  const nowSec = now ?? Math.floor(Date.now() / 1000);
  const out: ClaimTimeInfo[] = [];
  for (const claim of TIME_CLAIMS) {
    const v = payload[claim];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out.push({
      claim,
      seconds: v,
      local: new Date(v * 1000).toLocaleString("zh-CN", { hour12: false }),
      relative: relativeZh(v, nowSec),
      status: claimStatus(claim, v, nowSec),
    });
  }
  return out;
}
