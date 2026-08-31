/**
 * 手机号归属地查询（纯函数 + 分片懒加载）
 * 数据源：MIT 许可号段库（48.3 万号段，区间编码），按号码前两位拆分为 7 个分片
 * （public/phone-data-13.json … phone-data-19.json），查哪个号段才加载哪个分片。
 * 查询全程本地二分检索，号码不上传。
 */

export interface PhoneShard {
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

/** 在单个分片内查询（纯函数） */
export function lookupInShard(shard: PhoneShard, phone: string): PhoneInfo | null {
  if (!isValidCnMobile(phone)) return null;
  const prefix7 = Number(phone.trim().slice(0, 7));
  const row = lookupRange(shard.ranges, prefix7);
  if (!row) return null;
  return {
    province: shard.provinces[row[2]] ?? "",
    city: shard.cities[row[3]] ?? "",
    isp: shard.isps[row[4]] ?? "",
    segment: String(prefix7),
  };
}

const shardCache = new Map<string, PhoneShard>();
const shardLoading = new Map<string, Promise<PhoneShard>>();

/** 分片键：号码前两位（"13"…"19"） */
export function shardKey(phone: string): string {
  return phone.trim().slice(0, 2);
}

/**
 * 懒加载单个分片（gzip 后约 30-190KB），加载后常驻内存
 * 失败时清除 loading 标记允许重试
 */
export function loadPhoneShard(basePath: string, prefix2: string): Promise<PhoneShard> {
  const cached = shardCache.get(prefix2);
  if (cached) return Promise.resolve(cached);
  const inflight = shardLoading.get(prefix2);
  if (inflight) return inflight;

  const p = fetch(`${basePath}/phone-data-${prefix2}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`号段数据 ${prefix2}x 加载失败（HTTP ${r.status}）`);
      return r.json() as Promise<PhoneShard>;
    })
    .then((d) => {
      shardCache.set(prefix2, d);
      shardLoading.delete(prefix2);
      return d;
    })
    .catch((e) => {
      shardLoading.delete(prefix2);
      throw e;
    });
  shardLoading.set(prefix2, p);
  return p;
}

/** 单号查询：自动加载对应分片 */
export async function lookupPhone(basePath: string, phone: string): Promise<PhoneInfo | null> {
  if (!isValidCnMobile(phone)) return null;
  const shard = await loadPhoneShard(basePath, shardKey(phone));
  return lookupInShard(shard, phone);
}

export interface BatchRow {
  phone: string;
  invalid: boolean;
  info: PhoneInfo | null;
}

/**
 * 批量查询：按前两位分组，只加载涉及的分片（并行）
 * onShardLoaded 回调用于进度提示
 */
export async function lookupPhones(
  basePath: string,
  phones: string[],
  onShardLoaded?: (loaded: number, total: number) => void,
): Promise<BatchRow[]> {
  const valid = phones.filter(isValidCnMobile);
  const keys = [...new Set(valid.map(shardKey))];
  let loaded = 0;
  const shards = new Map<string, PhoneShard>();
  await Promise.all(
    keys.map(async (k) => {
      const s = await loadPhoneShard(basePath, k);
      shards.set(k, s);
      loaded++;
      onShardLoaded?.(loaded, keys.length);
    }),
  );
  return phones.map((phone) => {
    if (!isValidCnMobile(phone)) return { phone, invalid: true, info: null };
    const shard = shards.get(shardKey(phone));
    return { phone, invalid: false, info: shard ? lookupInShard(shard, phone) : null };
  });
}
