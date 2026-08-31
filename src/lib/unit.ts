/** 单位换算（长度 / 质量 / 面积 / 温度 / 数据量，纯函数） */

/** 单个单位定义：常规单位用 toBase（→ 基准单位的倍率）；温度用 affine（base 值 = a*v + b，base 为摄氏度） */
export type UnitDef =
  | { id: string; name: string; symbol: string; toBase: number }
  | { id: string; name: string; symbol: string; affine: { a: number; b: number } };

/** 单位类别 */
export type UnitCategory = {
  id: "length" | "mass" | "area" | "temperature" | "data";
  name: string;
  units: UnitDef[];
};

/** 换算结果：目标单位 + 等值数值 */
export type UnitResult = { unit: UnitDef; value: number };

/** 全部单位定义与系数均依据国际/国家法定标准（SI、国际磅码协定、GB 法定计量单位、IEC 80000-13） */
export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: "length",
    name: "长度",
    units: [
      { id: "mm", name: "毫米", symbol: "mm", toBase: 0.001 },
      { id: "cm", name: "厘米", symbol: "cm", toBase: 0.01 },
      { id: "m", name: "米", symbol: "m", toBase: 1 },
      { id: "km", name: "千米", symbol: "km", toBase: 1000 },
      { id: "in", name: "英寸", symbol: "in", toBase: 0.0254 }, // 1959 国际码磅协定精确定义
      { id: "ft", name: "英尺", symbol: "ft", toBase: 0.3048 },
      { id: "yd", name: "码", symbol: "yd", toBase: 0.9144 },
      { id: "mi", name: "英里", symbol: "mi", toBase: 1609.344 }, // 5280 ft
      { id: "nmi", name: "海里", symbol: "nmi", toBase: 1852 }, // 国际海里精确定义
      { id: "li", name: "里", symbol: "里", toBase: 500 }, // 市制：1 里 = 500 m
      { id: "zhang", name: "丈", symbol: "丈", toBase: 10 / 3 },
      { id: "chi", name: "尺", symbol: "尺", toBase: 1 / 3 },
      { id: "cun", name: "寸", symbol: "寸", toBase: 1 / 30 },
    ],
  },
  {
    id: "mass",
    name: "质量",
    units: [
      { id: "mg", name: "毫克", symbol: "mg", toBase: 1e-6 },
      { id: "g", name: "克", symbol: "g", toBase: 0.001 },
      { id: "kg", name: "千克", symbol: "kg", toBase: 1 },
      { id: "t", name: "吨", symbol: "t", toBase: 1000 },
      { id: "oz", name: "盎司", symbol: "oz", toBase: 0.028349523125 }, // 常衡盎司精确定义
      { id: "lb", name: "磅", symbol: "lb", toBase: 0.45359237 }, // 国际磅精确定义
      { id: "jin", name: "斤", symbol: "斤", toBase: 0.5 }, // 市制：1 斤 = 500 g
      { id: "liang", name: "两", symbol: "两", toBase: 0.05 },
      { id: "qian", name: "钱", symbol: "钱", toBase: 0.005 },
    ],
  },
  {
    id: "area",
    name: "面积",
    units: [
      { id: "mm2", name: "平方毫米", symbol: "mm²", toBase: 1e-6 },
      { id: "cm2", name: "平方厘米", symbol: "cm²", toBase: 1e-4 },
      { id: "m2", name: "平方米", symbol: "m²", toBase: 1 },
      { id: "ha", name: "公顷", symbol: "ha", toBase: 10000 },
      { id: "km2", name: "平方千米", symbol: "km²", toBase: 1e6 },
      { id: "in2", name: "平方英寸", symbol: "in²", toBase: 0.00064516 }, // 0.0254²
      { id: "ft2", name: "平方英尺", symbol: "ft²", toBase: 0.09290304 }, // 0.3048²
      { id: "mu", name: "亩", symbol: "亩", toBase: 2000 / 3 }, // 市制：1 亩 = 2000/3 m²
      { id: "fen", name: "分", symbol: "分", toBase: 200 / 3 }, // 1 分 = 0.1 亩
      { id: "qing", name: "顷", symbol: "顷", toBase: 200000 / 3 }, // 1 顷 = 100 亩
    ],
  },
  {
    id: "temperature",
    name: "温度",
    units: [
      { id: "c", name: "摄氏度", symbol: "℃", affine: { a: 1, b: 0 } },
      { id: "f", name: "华氏度", symbol: "℉", affine: { a: 5 / 9, b: -160 / 9 } }, // C = (F-32)*5/9
      { id: "k", name: "开尔文", symbol: "K", affine: { a: 1, b: -273.15 } }, // C = K-273.15
      // C = R*5/9 - 273.15（由 R = (C+273.15)*9/5 反解；0 °R = 绝对零度 = -273.15 ℃）
      { id: "r", name: "兰氏度", symbol: "°R", affine: { a: 5 / 9, b: -273.15 } },
    ],
  },
  {
    id: "data",
    name: "数据量",
    units: [
      { id: "bit", name: "比特", symbol: "bit", toBase: 0.125 },
      { id: "B", name: "字节", symbol: "B", toBase: 1 },
      { id: "KB", name: "KB", symbol: "KB", toBase: 1024 },
      { id: "MB", name: "MB", symbol: "MB", toBase: 1024 ** 2 },
      { id: "GB", name: "GB", symbol: "GB", toBase: 1024 ** 3 },
      { id: "TB", name: "TB", symbol: "TB", toBase: 1024 ** 4 },
    ],
  },
];

/** 类型守卫：判断是否为温度类 affine 单位 */
function isAffine(u: UnitDef): u is Extract<UnitDef, { affine: unknown }> {
  return "affine" in u;
}

/**
 * 单位换算。常规单位：v*from.toBase/to.toBase；
 * 温度：先经 affine 转摄氏度，再反解目标单位 (c - b) / a。
 */
export function convert(v: number, from: UnitDef, to: UnitDef): number {
  if (isAffine(from) && isAffine(to)) {
    const celsius = from.affine.a * v + from.affine.b;
    return (celsius - to.affine.b) / to.affine.a;
  }
  if (!isAffine(from) && !isAffine(to)) {
    return (v * from.toBase) / to.toBase;
  }
  return NaN; // 温度与常规单位不可互换
}

/** 类别内全部单位等值换算（含源单位自身）；fromId 不存在返回空数组 */
export function convertAll(cat: UnitCategory, value: number, fromId: string): UnitResult[] {
  const from = cat.units.find((u) => u.id === fromId);
  if (!from) return [];
  return cat.units.map((unit) => ({ unit, value: convert(value, from, unit) }));
}

/** 指数形式去尾零："1.23000e+16" → "1.23e+16" */
function trimExponential(s: string): string {
  return s.replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
}

/**
 * 智能格式化：|v|≥1e15 或 0<|v|<1e-9 用科学计数；否则最多 6 位有效数字并去尾零；
 * NaN / Infinity → "—"。
 */
export function fmtUnit(v: number): string {
  if (Number.isNaN(v) || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (v !== 0 && (abs >= 1e15 || abs < 1e-9)) return trimExponential(v.toExponential(5));
  const s = v.toPrecision(6);
  if (s.includes("e")) return trimExponential(s); // toPrecision 自身选择了科学计数
  let out = s;
  if (out.includes(".")) out = out.replace(/0+$/, "").replace(/\.$/, "");
  return out === "-0" ? "0" : out;
}
