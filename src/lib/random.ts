/** 随机整数工具：密码学安全随机（rejection sampling，无模偏差）与可复现的种子伪随机（mulberry32） */

/** 随机整数源：返回 [0, maxExclusive) 内的整数 */
export type RandomInt = (maxExclusive: number) => number;

/** maxExclusive 必须为正整数，否则抛错（中文信息可直接展示） */
function assertMaxExclusive(maxExclusive: number): void {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive 必须是正整数");
  }
}

/** 底层随机字节填充（浏览器与 Node 19+ 均有全局 crypto.getRandomValues） */
function fillRandom(buf: Uint32Array): void {
  const g = globalThis.crypto;
  if (!g || typeof g.getRandomValues !== "function") {
    throw new Error("当前环境不支持 crypto.getRandomValues");
  }
  g.getRandomValues(buf);
}

/**
 * 密码学安全随机整数，返回 [0, maxExclusive)。
 * 采用 rejection sampling：只在 2^bitLen 空间中接受小于 maxExclusive 的样本，
 * 丢弃越界值，保证各值概率完全相等（无模偏差）。
 */
export function secureRandomInt(maxExclusive: number): number {
  assertMaxExclusive(maxExclusive);
  if (maxExclusive === 1) return 0;
  // 覆盖 [0, maxExclusive) 所需的最少比特数（逐次折半，避免浮点 log 误差）
  let bitLen = 0;
  for (let n = maxExclusive - 1; n > 0; n = Math.floor(n / 2)) bitLen++;
  const buf = new Uint32Array(2);
  for (;;) {
    fillRandom(buf);
    let x: number;
    if (bitLen === 32) {
      x = buf[0];
    } else if (bitLen < 32) {
      x = buf[0] & (2 ** bitLen - 1); // 掩码 < 2^31，按位与结果非负
    } else {
      // bitLen ∈ (32, 53]：取低 bitLen-32 位作高位，拼成 ≤53 位的安全整数
      x = (buf[0] & (2 ** (bitLen - 32) - 1)) * 0x100000000 + buf[1];
    }
    if (x < maxExclusive) return x;
  }
}

/**
 * mulberry32 确定性伪随机整数源：同 seed 序列可复现，供测试注入。
 * 同样用 rejection sampling 消除模偏差；maxExclusive 上限 Number.MAX_SAFE_INTEGER。
 */
export function makeSeededRandomInt(seed: number): RandomInt {
  let state = seed >>> 0;
  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return (maxExclusive: number): number => {
    assertMaxExclusive(maxExclusive);
    if (maxExclusive === 1) return 0;
    if (maxExclusive <= 0x100000000) {
      // limit 为不超过 2^32 的 maxExclusive 最大整数倍，丢弃尾部样本消除模偏差
      const limit = 0x100000000 - (0x100000000 % maxExclusive);
      for (;;) {
        const x = nextUint32();
        if (x < limit) return x % maxExclusive;
      }
    }
    if (maxExclusive > Number.MAX_SAFE_INTEGER) {
      throw new Error("maxExclusive 超出安全整数范围");
    }
    // >2^32 时拼出 53 位空间再做 rejection sampling
    const space = 2 ** 53;
    const limit = space - (space % maxExclusive);
    for (;;) {
      // 2^32 % 2^21 = 0，低 21 位取值无偏
      const x = (nextUint32() % 0x200000) * 0x100000000 + nextUint32();
      if (x < limit) return x % maxExclusive;
    }
  };
}
