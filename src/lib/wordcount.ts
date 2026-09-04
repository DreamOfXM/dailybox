/** 字数统计（纯函数；按 Unicode 码点遍历，emoji/生僻字计数正确） */

/** 一段文本的完整统计结果 */
export interface WordCountResult {
  /** 总字符数（含空白，按码点计数） */
  chars: number;
  /** 去除空白后的字符数 */
  charsNoSpace: number;
  /** 单词数：连续 CJK 每字算一词 + 拉丁/数字连续串算一词 */
  words: number;
  /** 中日韩统一表意文字（汉字）数量 */
  cjkChars: number;
  /** 总行数（空串为 0 行，兼容 \r\n / \r / \n 换行） */
  lines: number;
  /** 非空行数（纯空白行不计入） */
  nonEmptyLines: number;
  /** 预计阅读时长（分钟）：中文 300 字/分 + 其余单词 200 词/分，四舍五入到 0.1 */
  readMinutes: number;
}

/** 是否为汉字（CJK 统一表意文字：基本区 / 扩展 A / 兼容 / 扩展 B~G+） */
function isHan(cp: number): boolean {
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0x20000 && cp <= 0x2a6df) ||
    (cp >= 0x2a700 && cp <= 0x2ebef) ||
    (cp >= 0x30000 && cp <= 0x3134f)
  );
}

const RE_SPACE = /\s/u;
/** 词内字符：Unicode 字母或数字（CJK 会先被 isHan 分支拦截，不会走到这里） */
const RE_WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * 统计文本的字符 / 单词 / 行数 / 阅读时长。
 * 分词规则：按空白与标点断词，连续汉字每字一词，连续拉丁字母/数字为一词。
 */
export function countText(text: string): WordCountResult {
  let chars = 0;
  let charsNoSpace = 0;
  let words = 0;
  let cjkChars = 0;
  let inLatinWord = false;

  for (const ch of text) {
    chars += 1;
    const cp = ch.codePointAt(0)!;
    if (!RE_SPACE.test(ch)) charsNoSpace += 1;

    if (isHan(cp)) {
      if (inLatinWord) {
        words += 1;
        inLatinWord = false;
      }
      cjkChars += 1;
      words += 1; // 每个汉字算一词
    } else if (RE_WORD_CHAR.test(ch)) {
      inLatinWord = true;
    } else if (inLatinWord) {
      words += 1;
      inLatinWord = false;
    }
  }
  if (inLatinWord) words += 1;

  const rawLines = text === "" ? [] : text.split(/\r\n|\r|\n/);
  const lines = rawLines.length;
  const nonEmptyLines = rawLines.filter((l) => l.trim() !== "").length;

  // 阅读时长：汉字已计入 words，需扣除后才是拉丁单词数
  const latinWords = words - cjkChars;
  const minutes = cjkChars / 300 + latinWords / 200;
  const readMinutes = Math.round(minutes * 10) / 10;

  return { chars, charsNoSpace, words, cjkChars, lines, nonEmptyLines, readMinutes };
}
