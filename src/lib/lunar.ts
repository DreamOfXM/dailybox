/**
 * 农历万年历（封装 MIT 库 lunar-javascript，权威历算 1900-2100）
 * 本文件不做任何历法计算，只做封装、校验与组合；超范围/非法输入统一 TryResult 中文错误。
 */
// @ts-expect-error lunar-javascript 无类型声明
import { Lunar, Solar } from "lunar-javascript";
import type { TryResult } from "./base64";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export interface LunarInfo {
  /** 所属农历年（数字；春节前的一月日期属于上一农历年） */
  yearNum: number;
  /** 干支年（正月初一为界，民俗口径） */
  ganZhi: string;
  /** 干支年（立春为界，命理口径） */
  ganZhiExact: string;
  /** 生肖（正月初一为界） */
  shengXiao: string;
  /** 农历月（中文，闰月自带"闰"前缀，如"闰六"） */
  monthCn: string;
  /** 农历月数字（1-12，不含闰标记） */
  monthNum: number;
  /** 农历日（中文，如"十七"） */
  dayCn: string;
  /** 农历日数字（1-30） */
  dayNum: number;
  /** 是否闰月 */
  isLeapMonth: boolean;
  /** 当天节气（无则空串） */
  jieQi: string;
  /** 当天节日（农历节日+公历节日合并，如 春节/国庆节） */
  festivals: string[];
  /** 公历星期（中文，如"周三"） */
  weekdayCn: string;
  /** 未来最近一个节气 */
  nextJieQi: { name: string; dateStr: string };
}

function checkYear(y: number): string | null {
  if (!Number.isInteger(y) || y < MIN_YEAR || y > MAX_YEAR) {
    return `年份需在 ${MIN_YEAR}-${MAX_YEAR} 之间（农历历算数据覆盖范围）`;
  }
  return null;
}

function isRealDate(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** 未来最近一个节气：逐日向后扫描（节气间隔约 15 天，扫 20 天必中） */
function findNextJieQi(solar: unknown): { name: string; dateStr: string } {
  let cur = solar as { next: (days: number) => unknown; getLunar: () => { getJieQi: () => string }; toYmd: () => string };
  for (let i = 0; i < 20; i++) {
    cur = cur.next(1) as typeof cur;
    const name = cur.getLunar().getJieQi();
    if (name) return { name, dateStr: cur.toYmd() };
  }
  return { name: "", dateStr: "" };
}

/** 公历 → 农历完整信息 */
export function solarToLunar(y: number, m: number, d: number): TryResult<LunarInfo> {
  const err = checkYear(y);
  if (err) return { ok: false, message: err };
  if (!Number.isInteger(m) || m < 1 || m > 12) return { ok: false, message: "月份需在 1-12 之间" };
  if (!Number.isInteger(d) || !isRealDate(y, m, d)) return { ok: false, message: "日期不存在（请检查大小月与闰年）" };

  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const isLeapMonth = lunar.getMonth() < 0;
    return {
      ok: true,
      value: {
        yearNum: lunar.getYear(),
        ganZhi: lunar.getYearInGanZhi(),
        ganZhiExact: lunar.getYearInGanZhiExact(),
        shengXiao: lunar.getYearShengXiao(),
        monthCn: lunar.getMonthInChinese(),
        monthNum: Math.abs(lunar.getMonth()),
        dayCn: lunar.getDayInChinese(),
        dayNum: lunar.getDay(),
        isLeapMonth,
        jieQi: lunar.getJieQi(),
        festivals: [...lunar.getFestivals(), ...lunar.getOtherFestivals(), ...solar.getFestivals()],
        weekdayCn: "周" + solar.getWeekInChinese(),
        nextJieQi: findNextJieQi(solar),
      },
    };
  } catch {
    return { ok: false, message: "日期超出历算范围或格式非法" };
  }
}

export interface SolarDate {
  y: number;
  m: number;
  d: number;
  weekdayCn: string;
}

/** 农历 → 公历。isLeap=true 表示该年为闰月（库约定：闰月用负月参数） */
export function lunarToSolar(year: number, month: number, day: number, isLeap = false): TryResult<SolarDate> {
  const err = checkYear(year);
  if (err) return { ok: false, message: err };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false, message: "农历月份需在 1-12 之间" };
  if (!Number.isInteger(day) || day < 1 || day > 30) return { ok: false, message: "农历日期需在 1-30 之间" };

  try {
    const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
    const solar = lunar.getSolar();
    // 库对不存在日期（如某年无闰月却传闰月）会归一化到别的日期，需反查校验
    const back = solar.getLunar();
    const backMonth = back.getMonth();
    const monthMatch = Math.abs(backMonth) === month && (backMonth < 0) === isLeap;
    if (!monthMatch || back.getDay() !== day) {
      return { ok: false, message: isLeap ? `${year} 年没有闰${month} 月，或该月无 ${day} 日` : `该年农历${month}月没有 ${day} 日` };
    }
    return {
      ok: true,
      value: { y: solar.getYear(), m: solar.getMonth(), d: solar.getDay(), weekdayCn: "周" + solar.getWeekInChinese() },
    };
  } catch {
    return { ok: false, message: "农历日期不存在（请检查大小月与闰月）" };
  }
}

export interface BirthdayItem {
  solarYear: number;
  solar: string;
  weekdayCn: string;
  /** 该年无对应闰月，按非闰同月过的生日 */
  leapFallback?: boolean;
}

/**
 * 农历生日 → 未来 N 年公历日期。
 * 民俗通行规则：闰月生日在没有该闰月的年份，按非闰同月过。
 */
export function lunarBirthdayToSolar(
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean,
  fromYear: number,
  years: number,
): TryResult<BirthdayItem[]> {
  if (!Number.isInteger(years) || years < 1 || years > 50) return { ok: false, message: "查询年数需在 1-50 之间" };
  const out: BirthdayItem[] = [];
  for (let i = 0; i < years; i++) {
    const y = fromYear + i;
    if (y > MAX_YEAR) break;
    let r = lunarToSolar(y, lunarMonth, lunarDay, isLeap);
    let fallback = false;
    if (!r.ok && isLeap) {
      r = lunarToSolar(y, lunarMonth, lunarDay, false);
      fallback = true;
    }
    if (!r.ok) return r;
    out.push({ solarYear: y, solar: `${r.value.y}-${String(r.value.m).padStart(2, "0")}-${String(r.value.d).padStart(2, "0")}`, weekdayCn: r.value.weekdayCn, leapFallback: fallback || undefined });
  }
  if (!out.length) return { ok: false, message: "没有可查询的年份（超出 2100 年）" };
  return { ok: true, value: out };
}
