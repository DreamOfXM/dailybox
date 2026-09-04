/** 文本行去重排序（纯函数） */

export type SortMode = "none" | "asc" | "desc" | "length";

export interface DedupeOptions {
  /** 去除每行首尾空格后再比较与输出（默认 false） */
  trim?: boolean;
  /** 区分大小写（默认 false，即 "A" 与 "a" 视为重复） */
  caseSensitive?: boolean;
  /** 清理空行（默认 false；trim 开启时纯空白行也视为空行） */
  removeEmpty?: boolean;
  /** 输出排序方式（默认 none，保持首次出现顺序） */
  sort?: SortMode;
}

export interface DedupeResult {
  /** 处理后的文本（以 \n 连接） */
  text: string;
  /** 被移除的行数（含去重与清理的空行） */
  removed: number;
  /** 原文总行数（空串为 0 行） */
  total: number;
}

/**
 * 按行去重并可选排序。
 * 重复行保留首次出现的一条；空行在未开启 removeEmpty 时也参与去重
 * （多个连续空行会折叠为一条）。
 */
export function dedupeLines(text: string, opts: DedupeOptions = {}): DedupeResult {
  const { trim = false, caseSensitive = false, removeEmpty = false, sort = "none" } = opts;
  if (text === "") return { text: "", removed: 0, total: 0 };

  const lines = text.split(/\r\n|\r|\n/);
  const total = lines.length;

  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of lines) {
    const line = trim ? raw.trim() : raw;
    if (removeEmpty && line === "") continue;
    const key = caseSensitive ? line : line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }

  if (sort === "asc") {
    kept.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  } else if (sort === "desc") {
    kept.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  } else if (sort === "length") {
    // 长度升序，同长按字典序兜底保证结果确定
    kept.sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0));
  }

  return { text: kept.join("\n"), removed: total - kept.length, total };
}
