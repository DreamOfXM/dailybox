"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { dedupeLines, type SortMode } from "@/lib/dedupe";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented, Stat, Toggle } from "@/components/ui";

const seo = findTool("dedupe")!;

/** 预置示例：含重复行与空行，一键体验 */
const EXAMPLE = "banana\napple\nbanana\ncherry\napple\n\nBanana";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "none", label: "保持顺序" },
  { value: "asc", label: "升序" },
  { value: "desc", label: "降序" },
  { value: "length", label: "按长度" },
];

export default function DedupeTool() {
  const [input, setInput] = useState("");
  const [trim, setTrim] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sort, setSort] = useState<SortMode>("none");

  const result = useMemo(
    () => (input ? dedupeLines(input, { trim, caseSensitive, removeEmpty, sort }) : null),
    [input, trim, caseSensitive, removeEmpty, sort],
  );

  return (
    <div>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 输入区 */}
        <SectionCard
          title="输入"
          subtitle="每行一条 · 实时处理"
          aside={
            <button
              type="button"
              onClick={() => setInput(EXAMPLE)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Toggle checked={trim} onChange={setTrim} label="去除首尾空格" />
            <Toggle checked={caseSensitive} onChange={setCaseSensitive} label="区分大小写" />
            <Toggle checked={removeEmpty} onChange={setRemoveEmpty} label="清理空行" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented value={sort} onChange={setSort} options={SORT_OPTIONS} ariaLabel="排序方式" />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder="输入或粘贴多行文本，重复行将实时去除"
            aria-label="输入内容"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        {/* 处理结果 */}
        <SectionCard
          title="处理结果"
          subtitle={result ? `保留首次出现 · 移除 ${result.removed} 行` : undefined}
          aside={result ? <CopyButton text={result.text} label="复制结果" /> : undefined}
        >
          {result ? (
            <>
              <textarea
                readOnly
                value={result.text}
                rows={8}
                placeholder="结果将显示在这里"
                aria-label="处理结果"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Stat label="原始行数" value={result.total} />
                <Stat label="保留行数" value={result.total - result.removed} tone="good" />
                <Stat label="移除行数" value={result.removed} tone={result.removed > 0 ? "warn" : "default"} />
              </div>
            </>
          ) : (
            <Hint kind="info">输入多行文本后即刻处理：去重、空行清理与排序均在本地完成，数据不上传。</Hint>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
