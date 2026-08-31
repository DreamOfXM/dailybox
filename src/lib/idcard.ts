/** 身份证号校验与信息提取（GB 11643-1999，纯函数） */

import type { TryResult } from "./base64";

/** 省级行政区划码表（身份证前两位），依据 GB/T 2260 常用码段 */
export const PROVINCES: Record<number, string> = {
  11: "北京",
  12: "天津",
  13: "河北",
  14: "山西",
  15: "内蒙古",
  21: "辽宁",
  22: "吉林",
  23: "黑龙江",
  31: "上海",
  32: "江苏",
  33: "浙江",
  34: "安徽",
  35: "福建",
  36: "江西",
  37: "山东",
  41: "河南",
  42: "湖北",
  43: "湖南",
  44: "广东",
  45: "广西",
  46: "海南",
  50: "重庆",
  51: "四川",
  52: "贵州",
  53: "云南",
  54: "西藏",
  61: "陕西",
  62: "甘肃",
  63: "青海",
  64: "宁夏",
  65: "新疆",
  71: "台湾",
  81: "香港",
  82: "澳门",
};

/** GB 11643-1999 前 17 位加权因子 */
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
/** 加权和 mod 11 → 校验码映射表（下标 0~10） */
const CHECK_CODES = "10X98765432";

/** 由前 17 位数字计算第 18 位校验码（0-9 或 X）；导出供测试构造合法号 */
export function checksum17(id17: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (id17.charCodeAt(i) - 48) * WEIGHTS[i];
  }
  return CHECK_CODES[sum % 11];
}

/** 身份证解析结果 */
export type IdInfo = {
  /** 省份（码表前两位对应名称） */
  province: string;
  /** 出生日期 YYYY-MM-DD */
  birth: string;
  /** 性别（第 17 位奇数为男、偶数为女） */
  sex: "男" | "女";
  /** 按生日与当前时间计算的周岁（未过生日减 1） */
  age: number;
};

/** 用 Date 构造回查判断年月日是否真实存在（拦截 2/30、13 月等伪日期，含闰年判定） */
function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * 校验 18 位身份证号并解析信息；now 可注入便于测试。
 * 错误分级：长度错 / 字符错 / 省份不存在 / 生日非法 / 校验位不符。
 */
export function validateIdCard(id: string, now?: Date): TryResult<IdInfo> {
  if (typeof id !== "string" || id.length !== 18) {
    return { ok: false, message: "身份证号长度必须为 18 位" };
  }
  if (!/^\d{17}[\dXx]$/.test(id)) {
    return { ok: false, message: "身份证号含有非法字符（前 17 位须为数字，末位可为数字或 X）" };
  }
  const provinceCode = Number(id.slice(0, 2));
  const province = PROVINCES[provinceCode];
  if (!province) {
    return { ok: false, message: `省份代码 ${id.slice(0, 2)} 不存在` };
  }
  const year = Number(id.slice(6, 10));
  const month = Number(id.slice(10, 12));
  const day = Number(id.slice(12, 14));
  const base = now ?? new Date();
  if (year < 1900 || year > base.getFullYear() || !isValidDate(year, month, day)) {
    return { ok: false, message: `生日 ${id.slice(6, 14)} 非法` };
  }
  const expected = checksum17(id.slice(0, 17));
  const actual = id.charAt(17).toUpperCase();
  if (actual !== expected) {
    return { ok: false, message: `校验位不符（应为 ${expected}）` };
  }
  const sexDigit = Number(id.charAt(16));
  const birth = `${id.slice(6, 10)}-${id.slice(10, 12)}-${id.slice(12, 14)}`;
  let age = base.getFullYear() - year;
  const monthDayNow = base.getMonth() * 31 + base.getDate();
  const monthDayBirth = (month - 1) * 31 + day;
  if (monthDayNow < monthDayBirth) age -= 1;
  return {
    ok: true,
    value: {
      province,
      birth,
      sex: sexDigit % 2 === 1 ? "男" : "女",
      age,
    },
  };
}

/**
 * 15 位老身份证升 18 位：生日位前插入 "19" 后计算校验位。
 * 格式错误或补全后生日非法返回 null。
 */
export function upgrade15(id15: string): string | null {
  if (typeof id15 !== "string" || !/^\d{6}\d{6}\d{3}$/.test(id15)) return null;
  const year = 1900 + Number(id15.slice(6, 8));
  const month = Number(id15.slice(8, 10));
  const day = Number(id15.slice(10, 12));
  if (year < 1900 || !isValidDate(year, month, day)) return null;
  const id17 = id15.slice(0, 6) + "19" + id15.slice(6);
  return id17 + checksum17(id17);
}
