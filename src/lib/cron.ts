/** Cron 表达式解析 / 中文描述 / 下次执行时间推算（纯自研，无依赖；本地时区，vixie 语义） */

import type { TryResult } from "./base64";

/** 单个字段的取值集合（升序去重） */
export type FieldSpec = { values: number[] };

/** 解析结果：5 字段（分 时 日 月 周）或 seconds 模式 6 字段（秒在最前） */
export type CronFields = {
  sec?: FieldSpec;
  min: FieldSpec;
  hour: FieldSpec;
  dom: FieldSpec;
  month: FieldSpec;
  dow: FieldSpec;
  /** 日字段是否非 *（与 dowRestricted 同时为 true 时按 OR 语义匹配） */
  domRestricted: boolean;
  /** 周字段是否非 * */
  dowRestricted: boolean;
};

type FieldKind = "sec" | "min" | "hour" | "dom" | "month" | "dow";

interface FieldDef {
  min: number;
  max: number;
  /** 中文名，用于错误提示 */
  label: string;
  /** 名称映射（月份 JAN-DEC / 星期 SUN-SAT），大小写不敏感 */
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const FIELD_DEFS: Record<FieldKind, FieldDef> = {
  sec: { min: 0, max: 59, label: "秒" },
  min: { min: 0, max: 59, label: "分钟" },
  hour: { min: 0, max: 23, label: "小时" },
  dom: { min: 1, max: 31, label: "日" },
  month: { min: 1, max: 12, label: "月份", names: MONTH_NAMES },
  dow: { min: 0, max: 7, label: "星期", names: DOW_NAMES },
};

/** 字段内部错误：中文说明，由 parseCron 捕获后转 TryResult */
class CronFieldError extends Error {}

/** 名称（JAN-DEC / SUN-SAT）→ 数字，大小写不敏感 */
function replaceNames(part: string, names?: Record<string, number>): string {
  if (!names) return part;
  let s = part.toUpperCase();
  for (const name of Object.keys(names)) {
    s = s.split(name).join(String(names[name]));
  }
  return s;
}

/** 解析单个逗号项（* | *\/n | a-b | a-b/n | 单值），返回取值列表 */
function parsePart(part: string, def: FieldDef): number[] {
  if (part === "") throw new CronFieldError(`${def.label}字段存在空的列表项`);
  const s = replaceNames(part, def.names);
  if (!/^[\d*/,-]+$/.test(s)) {
    throw new CronFieldError(`${def.label}字段含有非法字符：「${part}」`);
  }
  const pushRange = (out: number[], a: number, b: number, step: number) => {
    for (let v = a; v <= b; v += step) out.push(v);
  };
  const checkBounds = (v: number, where: string): number => {
    if (v < def.min || v > def.max) {
      throw new CronFieldError(`${def.label}字段值 ${v} 越界（允许 ${def.min}-${def.max}）：「${where}」`);
    }
    return v;
  };
  const out: number[] = [];
  if (s === "*") {
    pushRange(out, def.min, def.max, 1);
    return out;
  }
  const starStep = /^\*\/(\d+)$/.exec(s);
  if (starStep) {
    const step = Number(starStep[1]);
    if (step < 1) throw new CronFieldError(`${def.label}字段步长必须为正整数：「${part}」`);
    pushRange(out, def.min, def.max, step);
    return out;
  }
  const range = /^(\d+)-(\d+)(?:\/(\d+))?$/.exec(s);
  if (range) {
    const a = checkBounds(Number(range[1]), part);
    const b = checkBounds(Number(range[2]), part);
    if (a > b) throw new CronFieldError(`${def.label}字段范围起点 ${a} 不能大于终点 ${b}：「${part}」`);
    const step = range[3] === undefined ? 1 : Number(range[3]);
    if (step < 1) throw new CronFieldError(`${def.label}字段步长必须为正整数：「${part}」`);
    pushRange(out, a, b, step);
    return out;
  }
  if (/^\d+$/.test(s)) {
    out.push(checkBounds(Number(s), part));
    return out;
  }
  throw new CronFieldError(`${def.label}字段格式非法：「${part}」`);
}

/** 解析单个字段：逗号列表 → 合并、星期 7 归一为 0、升序去重 */
function parseField(raw: string, kind: FieldKind): TryResult<FieldSpec> {
  const def = FIELD_DEFS[kind];
  try {
    const values: number[] = [];
    for (const part of raw.split(",")) values.push(...parsePart(part, def));
    const norm = kind === "dow" ? values.map((v) => (v === 7 ? 0 : v)) : values;
    return { ok: true, value: { values: [...new Set(norm)].sort((a, b) => a - b) } };
  } catch (e) {
    return { ok: false, message: e instanceof CronFieldError ? e.message : `${def.label}字段解析失败` };
  }
}

/**
 * 解析 cron 表达式：默认 5 字段（分 时 日 月 周）；opts.seconds=true 时 6 字段（秒在最前）。
 * 越界 / 非法格式返回 { ok:false, message } 中文错误。
 */
export function parseCron(expr: string, opts?: { seconds?: boolean }): TryResult<CronFields> {
  const withSec = opts?.seconds ?? false;
  const parts = expr.trim().split(/\s+/);
  const expected = withSec ? 6 : 5;
  if (parts.length !== expected) {
    return {
      ok: false,
      message: withSec
        ? `秒模式 cron 表达式应有 6 个字段（秒 分 时 日 月 周），实际 ${parts.length} 个`
        : `cron 表达式应有 5 个字段（分 时 日 月 周），实际 ${parts.length} 个`,
    };
  }
  const kinds: FieldKind[] = withSec
    ? ["sec", "min", "hour", "dom", "month", "dow"]
    : ["min", "hour", "dom", "month", "dow"];
  const specs: Partial<Record<FieldKind, FieldSpec>> = {};
  for (let i = 0; i < kinds.length; i++) {
    const r = parseField(parts[i], kinds[i]);
    if (!r.ok) return r;
    specs[kinds[i]] = r.value;
  }
  const domRaw = parts[kinds.indexOf("dom")];
  const dowRaw = parts[kinds.indexOf("dow")];
  const fields: CronFields = {
    min: specs.min as FieldSpec,
    hour: specs.hour as FieldSpec,
    dom: specs.dom as FieldSpec,
    month: specs.month as FieldSpec,
    dow: specs.dow as FieldSpec,
    domRestricted: domRaw !== "*",
    dowRestricted: dowRaw !== "*",
  };
  if (specs.sec) fields.sec = specs.sec;
  return { ok: true, value: fields };
}

/* ==================== 中文描述 ==================== */

const DOW_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 是否覆盖 [min, max] 全量（等价于 *） */
function isFull(values: number[], min: number, max: number): boolean {
  if (values.length !== max - min + 1) return false;
  for (let i = 0; i < values.length; i++) if (values[i] !== min + i) return false;
  return true;
}

/** 若形如 *\/step（从 min 起等差、步长 > 1、无法再续）返回步长，否则 null */
function stepOf(values: number[], min: number, max: number): number | null {
  if (values.length < 2 || values[0] !== min) return null;
  const step = values[1] - values[0];
  if (step <= 1) return null;
  for (let i = 1; i < values.length; i++) if (values[i] !== min + i * step) return null;
  if (values[values.length - 1] + step <= max) return null;
  return step;
}

/** 兜底：逐字段「分 时 日 月 周」描述（全量字段显示为 *） */
function fallbackDescribe(f: CronFields): string {
  const vals = (spec: FieldSpec, min: number, max: number): string => {
    if (isFull(spec.values, min, max)) return "*";
    const list = spec.values.join(",");
    return list.length > 40 ? `${list.slice(0, 40)}…` : list;
  };
  const parts: string[] = [];
  if (f.sec) parts.push(`秒: ${vals(f.sec, 0, 59)}`);
  parts.push(`分钟: ${vals(f.min, 0, 59)}`);
  parts.push(`小时: ${vals(f.hour, 0, 23)}`);
  parts.push(`日: ${vals(f.dom, 1, 31)}`);
  parts.push(`月: ${vals(f.month, 1, 12)}`);
  parts.push(`周: ${vals(f.dow, 0, 6)}`);
  return parts.join(" ");
}

/** 中文人话描述，如 "每 5 分钟"、"每天 08:30"、"每周一 09:00"；复杂组合走逐字段兜底 */
export function describeCron(f: CronFields): string {
  const secWild = !f.sec || isFull(f.sec.values, 0, 59);
  const minFull = isFull(f.min.values, 0, 59);
  const hourFull = isFull(f.hour.values, 0, 23);
  const domFull = isFull(f.dom.values, 1, 31);
  const monFull = isFull(f.month.values, 1, 12);
  const dowFull = isFull(f.dow.values, 0, 6);
  const otherWild = domFull && monFull && dowFull;

  if (!secWild) return fallbackDescribe(f);
  if (minFull && hourFull && otherWild) return "每分钟";

  // 每 N 分钟
  const mStep = stepOf(f.min.values, 0, 59);
  if (mStep !== null && hourFull && otherWild) return `每 ${mStep} 分钟`;

  // 每 N 小时（固定分钟）
  const hStep = stepOf(f.hour.values, 0, 23);
  if (f.min.values.length === 1 && hStep !== null && otherWild) {
    return `每 ${hStep} 小时的第 ${pad2(f.min.values[0])} 分钟`;
  }

  if (f.min.values.length === 1 && f.hour.values.length === 1) {
    const t = `${pad2(f.hour.values[0])}:${pad2(f.min.values[0])}`;
    if (!domFull && !monFull && dowFull && f.dom.values.length === 1 && f.month.values.length === 1) {
      return `每年 ${f.month.values[0]} 月 ${f.dom.values[0]} 日 ${t}`;
    }
    if (!domFull && monFull && dowFull) {
      return `每月 ${f.dom.values.map((d) => `${d} 日`).join("、")} ${t}`;
    }
    if (!dowFull && domFull && monFull) {
      return `每${f.dow.values.map((d) => DOW_ZH[d]).join("、")} ${t}`;
    }
    if (otherWild) return `每天 ${t}`;
  }

  if (f.min.values.length === 1 && hourFull && otherWild) {
    return `每小时的第 ${pad2(f.min.values[0])} 分钟`;
  }

  return fallbackDescribe(f);
}

/* ==================== English description ==================== */

const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Fallback: per-field English description (full-range fields shown as *) */
function fallbackDescribeEn(f: CronFields): string {
  const vals = (spec: FieldSpec, min: number, max: number): string => {
    if (isFull(spec.values, min, max)) return "*";
    const list = spec.values.join(",");
    return list.length > 40 ? `${list.slice(0, 40)}…` : list;
  };
  const parts: string[] = [];
  if (f.sec) parts.push(`Sec: ${vals(f.sec, 0, 59)}`);
  parts.push(`Min: ${vals(f.min, 0, 59)}`);
  parts.push(`Hour: ${vals(f.hour, 0, 23)}`);
  parts.push(`Day: ${vals(f.dom, 1, 31)}`);
  parts.push(`Month: ${vals(f.month, 1, 12)}`);
  parts.push(`Weekday: ${vals(f.dow, 0, 6)}`);
  return parts.join(" ");
}

/** English human-readable description mirroring every branch of describeCron */
export function describeCronEn(f: CronFields): string {
  const secWild = !f.sec || isFull(f.sec.values, 0, 59);
  const minFull = isFull(f.min.values, 0, 59);
  const hourFull = isFull(f.hour.values, 0, 23);
  const domFull = isFull(f.dom.values, 1, 31);
  const monFull = isFull(f.month.values, 1, 12);
  const dowFull = isFull(f.dow.values, 0, 6);
  const otherWild = domFull && monFull && dowFull;

  if (!secWild) return fallbackDescribeEn(f);
  if (minFull && hourFull && otherWild) return "Every minute";

  // Every N minutes
  const mStep = stepOf(f.min.values, 0, 59);
  if (mStep !== null && hourFull && otherWild) return `Every ${mStep} minutes`;

  // Every N hours at fixed minute
  const hStep = stepOf(f.hour.values, 0, 23);
  if (f.min.values.length === 1 && hStep !== null && otherWild) {
    return `Every ${hStep} hours at minute ${pad2(f.min.values[0])}`;
  }

  if (f.min.values.length === 1 && f.hour.values.length === 1) {
    const t = `${pad2(f.hour.values[0])}:${pad2(f.min.values[0])}`;
    if (!domFull && !monFull && dowFull && f.dom.values.length === 1 && f.month.values.length === 1) {
      return `Annual on ${f.month.values[0]}/${f.dom.values[0]} at ${t}`;
    }
    if (!domFull && monFull && dowFull) {
      return `Monthly on day ${f.dom.values.join(", ")} at ${t}`;
    }
    if (!dowFull && domFull && monFull) {
      return `Weekly on ${f.dow.values.map((d) => DOW_EN[d]).join(", ")} at ${t}`;
    }
    if (otherWild) return `Daily at ${t}`;
  }

  if (f.min.values.length === 1 && hourFull && otherWild) {
    return `Hourly at minute ${pad2(f.min.values[0])}`;
  }

  return fallbackDescribeEn(f);
}

/** Map Chinese parseCron failure messages to English equivalents */
export function cronIssueEn(msg: string): string {
  // Field-count errors
  if (/秒模式.*应有\s*6\s*个字段/.test(msg)) {
    const m = /实际\s*(\d+)\s*个/.exec(msg);
    return `Seconds-mode cron expression requires 6 fields (sec min hour day month weekday), got ${m?.[1] ?? "?"}.`;
  }
  if (/cron\s*表达式应有\s*5\s*个字段/.test(msg)) {
    const m = /实际\s*(\d+)\s*个/.exec(msg);
    return `Cron expression requires 5 fields (min hour day month weekday), got ${m?.[1] ?? "?"}.`;
  }
  // Per-field errors (label prefix varies by field kind)
  if (/字段存在空的列表项/.test(msg)) {
    return "A field contains an empty list item.";
  }
  if (/字段含有非法字符/.test(msg)) {
    return "A field contains invalid characters.";
  }
  if (/字段值.*越界/.test(msg)) {
    return "A field value is out of range.";
  }
  if (/字段步长必须为正整数/.test(msg)) {
    return "A field step value must be a positive integer.";
  }
  if (/字段范围起点.*不能大于终点/.test(msg)) {
    return "A field range start exceeds its end.";
  }
  if (/字段格式非法/.test(msg)) {
    return "A field has an invalid format.";
  }
  if (/字段解析失败/.test(msg)) {
    return "A field failed to parse.";
  }
  return "Invalid cron expression.";
}

/* ==================== 下次执行时间推算 ==================== */

/**
 * 从 from 的下一分钟（有秒字段则下一秒）开始逐时刻扫描，返回最多 n 个命中时刻（本地时区）。
 * vixie 语义：日与周都受限（非 *）时任一匹配即可，只有一个受限时按该字段。
 * maxIter 为扫描步数硬上限（默认 2_000_000），达到上限返回已找到的结果，防止死循环。
 */
export function nextRuns(f: CronFields, from: Date, n: number, opts?: { maxIter?: number }): Date[] {
  const maxIter = opts?.maxIter ?? 2_000_000;
  const out: Date[] = [];
  if (n <= 0) return out;
  const secSet = f.sec ? new Set(f.sec.values) : null;
  const minSet = new Set(f.min.values);
  const hourSet = new Set(f.hour.values);
  const domSet = new Set(f.dom.values);
  const monSet = new Set(f.month.values);
  const dowSet = new Set(f.dow.values);

  const cur = new Date(from.getTime());
  if (secSet) {
    cur.setMilliseconds(0);
    cur.setSeconds(cur.getSeconds() + 1);
  } else {
    cur.setSeconds(0, 0);
    cur.setMinutes(cur.getMinutes() + 1);
  }

  let iter = 0;
  while (out.length < n && iter < maxIter) {
    iter++;
    if (
      minSet.has(cur.getMinutes()) &&
      hourSet.has(cur.getHours()) &&
      monSet.has(cur.getMonth() + 1) &&
      (!secSet || secSet.has(cur.getSeconds()))
    ) {
      const domOk = domSet.has(cur.getDate());
      const dowOk = dowSet.has(cur.getDay());
      const dayOk = f.domRestricted && f.dowRestricted ? domOk || dowOk : domOk && dowOk;
      if (dayOk) out.push(new Date(cur.getTime()));
    }
    if (secSet) cur.setSeconds(cur.getSeconds() + 1);
    else cur.setMinutes(cur.getMinutes() + 1);
  }
  return out;
}

/* ==================== 常用预设构造 ==================== */

export type CronPreset =
  | { kind: "everyMinute" }
  | { kind: "everyNMinutes"; n: number }
  | { kind: "hourly"; minute?: number }
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "weekly"; dow: number; hour: number; minute: number }
  | { kind: "monthly"; dom: number; hour: number; minute: number };

function checkInt(v: number, min: number, max: number, label: string): number {
  if (!Number.isInteger(v) || v < min || v > max) {
    throw new Error(`buildCron：${label}必须为 ${min}-${max} 的整数，实际为 ${v}`);
  }
  return v;
}

/** 常用预设 → 标准 5 字段 cron 表达式（输出均可被 parseCron 解析） */
export function buildCron(preset: CronPreset): string {
  switch (preset.kind) {
    case "everyMinute":
      return "* * * * *";
    case "everyNMinutes":
      return `*/${checkInt(preset.n, 1, 59, "分钟间隔 n")} * * * *`;
    case "hourly":
      return `${checkInt(preset.minute ?? 0, 0, 59, "分钟")} * * * *`;
    case "daily": {
      const m = checkInt(preset.minute, 0, 59, "分钟");
      const h = checkInt(preset.hour, 0, 23, "小时");
      return `${m} ${h} * * *`;
    }
    case "weekly": {
      const m = checkInt(preset.minute, 0, 59, "分钟");
      const h = checkInt(preset.hour, 0, 23, "小时");
      const w = checkInt(preset.dow, 0, 7, "星期");
      return `${m} ${h} * * ${w}`;
    }
    case "monthly": {
      const m = checkInt(preset.minute, 0, 59, "分钟");
      const h = checkInt(preset.hour, 0, 23, "小时");
      const d = checkInt(preset.dom, 1, 31, "日期");
      return `${m} ${h} ${d} * *`;
    }
  }
}
