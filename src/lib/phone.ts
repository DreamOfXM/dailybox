/**
 * 手机号归属地查询（纯函数 + 懒加载数据）
 * 数据源：MIT 许可号段库（48.3 万号段，区间编码压缩），构建时置于 public/phone-data.json
 * 查询全程本地二分检索，号码不上传
 */

export interface PhoneData {
  v: number;
  provinces: string[];
  cities: string[];
  isps: string[];
  /** [起始号段, 结束号段, 省idx, 市idx, 运营商idx]，按起始号段升序 */
  ranges: number[][];
}

export interface PhoneInfo {
  province: string;
  city: string;
  isp: string;
  /** 命中的号段（7 位） */
  segment: string;
}

/** 校验 11 位大陆手机号（1 开头，第二位 3-9） */
export function isValidCnMobile(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

/**
 * 区间二分查找：prefix7 为 7 位号段数字
 * 返回命中的 range 行，未命中返回 null
 */
export function lookupRange(ranges: number[][], prefix7: number): number[] | null {
  let lo = 0;
  let hi = ranges.length - 1;
  let ans: number[] | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const row = ranges[mid];
    if (row[0] <= prefix7) {
      ans = row;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans && prefix7 <= ans[1] ? ans : null;
}

/** 完整查询：手机号 → 省/市/运营商 */
export function lookupPhone(data: PhoneData, phone: string): PhoneInfo | null {
  if (!isValidCnMobile(phone)) return null;
  const prefix7 = Number(phone.trim().slice(0, 7));
  const row = lookupRange(data.ranges, prefix7);
  if (!row) return null;
  return {
    province: data.provinces[row[2]] ?? "",
    city: data.cities[row[3]] ?? "",
    isp: data.isps[row[4]] ?? "",
    segment: String(prefix7),
  };
}

let cache: PhoneData | null = null;
let loading: Promise<PhoneData> | null = null;

/**
 * 懒加载号段数据（约 0.8MB gzip），加载后常驻内存
 * basePath 由 next/router 提供，静态导出下为 /dailybox
 */
export function loadPhoneData(basePath: string): Promise<PhoneData> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;
  loading = fetch(`${basePath}/phone-data.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`号段数据加载失败（HTTP ${r.status}），请刷新重试`);
      return r.json() as Promise<PhoneData>;
    })
    .then((d) => {
      cache = d;
      return d;
    })
    .catch((e) => {
      loading = null; // 失败后允许重试
      throw e;
    });
  return loading;
}
