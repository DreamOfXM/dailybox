/** 人民币大写（财务规范，纯函数） */

import type { TryResult } from "./base64";

/** 金额上限：整数部分（元）必须小于 1e13（万亿级），超出拒绝转换 */
const MAX_YUAN = 1e13;

const NUMS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
/** 组内位权：千百十个（最低位无单位） */
const GROUP_UNITS = ["仟", "佰", "拾", ""];
/** 从低到高的 4 位分组单位：个级 / 万级 / 亿级 / 万亿级 */
const SECTION_UNITS = ["", "万", "亿", "万亿"];

/** 0~9999 四位以内转大写：组内零折叠、组尾零省略，0 返回空串 */
function groupToUpper(n: number): string {
  if (n === 0) return "";
  const s = String(n);
  let out = "";
  let zeroPending = false;
  for (let i = 0; i < s.length; i++) {
    const d = s.charCodeAt(i) - 48;
    const unit = GROUP_UNITS[4 - s.length + i];
    if (d === 0) {
      zeroPending = true;
    } else {
      if (zeroPending) out += "零";
      zeroPending = false;
      out += NUMS[d] + unit;
    }
  }
  return out;
}

/** 整数元部分转大写（按 4 位一组，万/亿分级，跨组零衔接）；0 返回 "零" */
function integerToUpper(yuan: number): string {
  if (yuan === 0) return "零";
  const groups: number[] = [];
  let n = yuan;
  while (n > 0) {
    groups.push(n % 10000);
    n = Math.floor(n / 10000);
  }
  let out = "";
  let needZero = false; // 高位已输出而当前整组为 0，需补一个零衔接低位
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) {
      if (out !== "") needZero = true; // 整组为零：不写单位，仅保留零衔接
    } else {
      // 中间整组为零时补一个零；否则低位组不足四位（如 1002）也补一个零衔接
      if (needZero) out += "零";
      else if (out !== "" && g < 1000) out += "零";
      needZero = false;
      out += groupToUpper(g) + SECTION_UNITS[i];
    }
  }
  return out;
}

/**
 * 按十进制语义四舍五入到分（返回整数分）。
 * 基于数值的最短往返十进制串（String 输出）按第三位小数进位，
 * 避免二进制表示误差（如 1.005 的 double 略小于十进制原值，
 * 直接 Math.round(1.005*100) 会错得 100 分）；对常规输入与
 * Math.round(abs*100) 结果一致。
 */
function decimalFen(abs: number): number {
  const s = String(abs);
  if (s.includes("e") || s.includes("E")) return Math.round(abs * 100); // 仅 <1e-6 的极小值走到这里，均为 0 分
  const dot = s.indexOf(".");
  const intStr = dot === -1 ? s : s.slice(0, dot);
  const frac = dot === -1 ? "" : s.slice(dot + 1);
  const d = (i: number): number => (i < frac.length ? frac.charCodeAt(i) - 48 : 0);
  return Number(intStr) * 100 + d(0) * 10 + d(1) + (d(2) >= 5 ? 1 : 0);
}

/**
 * 金额 → 人民币大写（财务规范）。
 * 先按四舍五入到分处理（整数分运算避免浮点误差）；
 * NaN / Infinity / |元| ≥ 1e13 返回 ok:false。
 */
export function toRmbUpper(amount: number): TryResult<string> {
  if (typeof amount !== "number" || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return { ok: false, message: "金额必须是有效数字" };
  }
  const neg = amount < 0;
  // 四舍五入到分后全程使用整数分，避免浮点误差
  const fen = decimalFen(Math.abs(amount));
  if (fen >= MAX_YUAN * 100) {
    return { ok: false, message: "金额过大：整数部分必须小于 10 万亿元" };
  }
  const yuan = Math.floor(fen / 100);
  const jiao = Math.floor((fen % 100) / 10);
  const fenDigit = fen % 10;

  let out: string;
  if (fen === 0) {
    out = "零元整";
  } else if (yuan === 0) {
    // 整数部分为 0 时不写"零元"，只输出角/分（如 0.05 → 伍分）
    out = jiao > 0 ? NUMS[jiao] + "角" + (fenDigit > 0 ? NUMS[fenDigit] + "分" : "整") : NUMS[fenDigit] + "分";
  } else {
    out = integerToUpper(yuan) + "元";
    if (jiao === 0 && fenDigit === 0) {
      out += "整";
    } else if (jiao === 0) {
      out += "零" + NUMS[fenDigit] + "分";
    } else if (fenDigit === 0) {
      out += NUMS[jiao] + "角整";
    } else {
      out += NUMS[jiao] + "角" + NUMS[fenDigit] + "分";
    }
  }
  return { ok: true, value: (neg ? "负" : "") + out };
}
