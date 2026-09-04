"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { binaryToText, textToBinary } from "@/lib/textbinary";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findTool("textbinary")!;

type Direction = "t2b" | "b2t";

/** 预置示例：中文 + emoji，直观展示 UTF-8 逐字节编码 */
const EXAMPLE_TEXT = "Hi 世界🎉";

export default function TextbinaryTool() {
  const [direction, setDirection] = useState<Direction>("t2b");
  const [input, setInput] = useState(EXAMPLE_TEXT);
  const [sep, setSep] = useState(" ");

  const result = useMemo<{ text: string; error?: string }>(() => {
    if (!input) return { text: "" };
    if (direction === "t2b") return { text: textToBinary(input, sep) };
    const r = binaryToText(input, sep);
    return r.ok ? { text: r.value } : { text: "", error: r.message };
  }, [input, direction, sep]);

  /** 结果填回输入并反转方向，方便往返校验 */
  const feedBack = () => {
    if (!result.text) return;
    setInput(result.text);
    setDirection(direction === "t2b" ? "b2t" : "t2b");
  };

  const inputLabel = direction === "t2b" ? "文本" : "二进制";

  return (
    <div>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="输入"
          aside={
            <button
              type="button"
              onClick={() => {
                setDirection("t2b");
                setInput(EXAMPLE_TEXT);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: "t2b", label: "文本 → 二进制" },
                { value: "b2t", label: "二进制 → 文本" },
              ]}
              ariaLabel="转换方向"
            />
            <label className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              分隔符
              <input
                value={sep}
                onChange={(e) => setSep(e.target.value)}
                placeholder="空格"
                aria-label="字节分隔符"
                className="w-24 px-3 py-1.5 rounded-md font-mono text-sm border border-white/[0.06] bg-white/[0.03] focus:outline-none focus:border-white/20"
              />
              {sep === "" && <span className="text-neutral-700">无分隔符（连续 01 串）</span>}
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={
              direction === "t2b"
                ? "输入或粘贴文本（支持中文与 emoji），结果实时出现在下方"
                : "输入 01 二进制序列，每 8 位一组，结果实时出现在下方"
            }
            aria-label={inputLabel}
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="输出"
          aside={
            <>
              <button
                type="button"
                onClick={feedBack}
                disabled={!result.text}
                className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
              >
                ↙ 结果填回输入
              </button>
              <CopyButton text={result.text} label="复制结果" />
            </>
          }
        >
          <textarea
            readOnly
            value={result.text}
            rows={5}
            placeholder="结果将显示在这里"
            aria-label="输出结果"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {result.error && (
            <div className="mt-3">
              <Hint kind="error">{result.error}</Hint>
            </div>
          )}
        </SectionCard>

        <Hint kind="info">
          编码规则：文本先按 UTF-8 转为字节（ASCII 1 字节、中文 3 字节、emoji 4 字节），每字节输出 8
          位二进制并用分隔符连接。解码时每 8 位一组还原为字节，换行与多余空格自动忽略；出现非 0/1 字符、位数不足 8
          位或字节序列不是合法 UTF-8 时会明确报错。
        </Hint>
      </div>
    </div>
  );
}
