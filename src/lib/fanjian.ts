/** 繁简双向转换（基于 opencc-js OpenCC 标准，同步纯函数） */

import { Converter } from "opencc-js";
import type { TryResult } from "./base64";

/** 转换方向：s2t 简体→繁体（台湾习惯），t2s 繁体→简体 */
export type FanjianDir = "s2t" | "t2s";

type ConvertFn = (text: string) => string;

/** 转换器按方向惰性构建并模块级缓存（构建 Trie 有成本，避免每次转换重建） */
let s2tFn: ConvertFn | null = null;
let t2sFn: ConvertFn | null = null;

function getConverter(dir: FanjianDir): ConvertFn {
  if (dir === "s2t") {
    // cn → twp：简体转台湾繁体，含短语级转换（如「里面」→「裡面」）
    return (s2tFn ??= Converter({ from: "cn", to: "twp" }));
  }
  // tw → cn：台湾繁体转简体
  return (t2sFn ??= Converter({ from: "tw", to: "cn" }));
}

/**
 * 繁简转换。同步纯函数，空串返回空串，非中文字符（英文/数字/标点）原样保留。
 * 仅在 opencc-js 词典加载异常时返回 ok:false。
 */
export function convert(text: string, dir: FanjianDir): TryResult<string> {
  try {
    return { ok: true, value: getConverter(dir)(text) };
  } catch {
    return { ok: false, message: "转换失败：OpenCC 词典未能加载，请刷新页面重试" };
  }
}
