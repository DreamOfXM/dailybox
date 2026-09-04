"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { convertCase, type CaseMode } from "@/lib/caseconvert";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findTool("caseconvert")!;

/** 预置示例：一键体验 */
const EXAMPLE = "hello world example";

const MODE_OPTIONS: Array<{ value: CaseMode; label: string }> = [
  { value: "upper", label: "全大写" },
  { value: "lower", label: "全小写" },
  { value: "capitalize", label: "首字母" },
  { value: "camel", label: "驼峰" },
  { value: "snake", label: "下划线" },
  { value: "kebab", label: "短横线" },
];

export default function CaseconvertTool() {
  const [mode, setMode] = useState<CaseMode>("upper");
  const [input, setInput] = useState("");

  const result = useMemo(() => (input ? convertCase(input, mode) : ""), [input, mode]);

  /** 结果填回输入，方便在各模式间往返转换 */
  const feedBack = () => {
    if (result) setInput(result);
  };

  return (
    <div>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 输入区 */}
        <SectionCard
          title="输入"
          subtitle="支持中英文 · 驼峰/下划线按非字母数字分词"
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
          <div className="mb-4 overflow-x-auto no-scrollbar">
            <Segmented value={mode} onChange={setMode} options={MODE_OPTIONS} ariaLabel="转换模式" />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            placeholder="输入或粘贴文本，结果实时出现在下方"
            aria-label="输入内容"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        {/* 转换结果 */}
        <SectionCard
          title="转换结果"
          aside={
            <>
              <button
                type="button"
                onClick={feedBack}
                disabled={!result}
                className="text-xs font-mono px-2.5 py-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
              >
                ↙ 结果填回输入
              </button>
              <CopyButton text={result} label="复制结果" />
            </>
          }
        >
          <textarea
            readOnly
            value={result}
            rows={6}
            placeholder="结果将显示在这里"
            aria-label="转换结果"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {!input && (
            <div className="mt-3">
              <Hint kind="info">输入文本后即刻转换；中文与标点在全大写/全小写/首字母模式下原样保留。</Hint>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
