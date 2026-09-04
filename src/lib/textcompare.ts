/** 逐行文本对比（纯函数）：经典 LCS DP 求最长公共子序列，输出逐行 diff */

export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: { added: number; removed: number; same: number };
  /** 行数超限走了简单逐行对齐降级（结果仍完整，仅不保证最小编辑） */
  approximate: boolean;
}

/** 任一侧行数超过该阈值时降级为简单逐行对齐，避免 O(m*n) 内存爆炸 */
export const LCS_MAX_LINES = 2000;

/** 统一换行符（CRLF / CR → LF）后按行切分；空串视为 0 行 */
function splitLines(s: string): string[] {
  if (s === "") return [];
  return s.replace(/\r\n?/g, "\n").split("\n");
}

/**
 * 逐行 LCS diff：a 为原文、b 为对比文。
 * same = 公共行，removed = 仅在 a，added = 仅在 b。
 * 任一侧行数超过 LCS_MAX_LINES 时降级为按行号简单对齐（超限行整体视为删/增），
 * 并通过 approximate 标注，保证大文本不卡死页面。
 */
export function diffLines(a: string, b: string): DiffResult {
  const A = splitLines(a);
  const B = splitLines(b);
  if (A.length > LCS_MAX_LINES || B.length > LCS_MAX_LINES) {
    const lines = fallbackDiff(A, B);
    return { lines, stats: countStats(lines), approximate: true };
  }
  const lines = lcsDiff(A, B);
  return { lines, stats: countStats(lines), approximate: false };
}

/** 经典 LCS DP：(m+1)*(n+1) 单张 Uint32 表，回溯输出 diff */
function lcsDiff(A: string[], B: string[]): DiffLine[] {
  const m = A.length;
  const n = B.length;
  const width = n + 1;
  const dp = new Uint32Array((m + 1) * width);
  for (let i = m - 1; i >= 0; i--) {
    const row = i * width;
    const next = row + width;
    const ai = A[i];
    for (let j = n - 1; j >= 0; j--) {
      dp[row + j] = ai === B[j] ? dp[next + j + 1] + 1 : Math.max(dp[next + j], dp[row + j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      out.push({ type: "removed", text: A[i] });
      i++;
    } else {
      out.push({ type: "added", text: B[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: "removed", text: A[i++] });
  while (j < n) out.push({ type: "added", text: B[j++] });
  return out;
}

/** 降级：按行号逐位对齐，相等记 same，否则原位记 removed + added */
function fallbackDiff(A: string[], B: string[]): DiffLine[] {
  const out: DiffLine[] = [];
  const minLen = Math.min(A.length, B.length);
  for (let k = 0; k < minLen; k++) {
    if (A[k] === B[k]) out.push({ type: "same", text: A[k] });
    else {
      out.push({ type: "removed", text: A[k] });
      out.push({ type: "added", text: B[k] });
    }
  }
  for (let k = minLen; k < A.length; k++) out.push({ type: "removed", text: A[k] });
  for (let k = minLen; k < B.length; k++) out.push({ type: "added", text: B[k] });
  return out;
}

function countStats(lines: DiffLine[]): { added: number; removed: number; same: number } {
  let added = 0;
  let removed = 0;
  let same = 0;
  for (const l of lines) {
    if (l.type === "added") added++;
    else if (l.type === "removed") removed++;
    else same++;
  }
  return { added, removed, same };
}
