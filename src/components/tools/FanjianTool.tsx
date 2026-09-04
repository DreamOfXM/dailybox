"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { convert, type FanjianDir } from "@/lib/fanjian";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findTool("fanjian")!;

export default function FanjianTool() {
  const [input, setInput] = useState("");
  const [dir, setDir] = useState<FanjianDir>("s2t");

  /** opencc 转换是同步纯函数，直接 useMemo 实时算 */
  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: "" };
    return convert(input, dir);
  }, [input, dir]);
  const output = result.ok ? result.value : "";

  return (
    <>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 输入 */}
        <SectionCard
          title="输入"
          subtitle="输入即实时转换 · 数据不出浏览器"
          aside={
            <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
              {Array.from(input).length} 字符
            </span>
          }
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={dir === "s2t" ? "输入或粘贴简体中文，右侧实时转为繁体" : "输入或粘贴繁体中文，右侧实时转为简体"}
            aria-label="待转换的文本"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4">
            <Segmented
              value={dir}
              onChange={setDir}
              options={[
                { value: "s2t", label: "简体→繁体" },
                { value: "t2s", label: "繁体→简体" },
              ]}
              ariaLabel="转换方向"
            />
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                input
                  ? "text-neutral-400 border-white/[0.06] hover:border-white/20 hover:text-white"
                  : "text-neutral-600 border-white/[0.04] cursor-not-allowed"
              }`}
            >
              清空
            </button>
          </div>
        </SectionCard>

        {/* 转换结果 */}
        <SectionCard
          title={dir === "s2t" ? "繁体结果" : "简体结果"}
          subtitle="输入变化即实时重算"
          aside={result.ok ? <CopyButton text={output} label="复制" /> : undefined}
        >
          {result.ok ? (
            <textarea
              value={output}
              readOnly
              rows={5}
              aria-label="转换结果"
              aria-live="polite"
              placeholder="转换结果将显示在这里"
              className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
            />
          ) : (
            <Hint kind="error">{result.message}</Hint>
          )}
        </SectionCard>

        <Hint>采用 OpenCC 开放中文转换标准，支持一对多映射</Hint>
      </div>
    </>
  );
}
