"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { countText } from "@/lib/wordcount";
import { CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findTool("wordcount")!;

/** 预置示例：中英混排，一键体验 */
const EXAMPLE = "DailyBox 是一个开箱即用的在线工具箱。\nHello, world! 纯前端本地运行。";

export default function WordcountTool() {
  const [input, setInput] = useState("");

  const stats = useMemo(() => countText(input), [input]);
  const empty = input.length === 0;

  /** 复制用的统计摘要 */
  const summary = useMemo(() => {
    if (empty) return "";
    return [
      `字符数：${stats.chars}`,
      `去空格字符：${stats.charsNoSpace}`,
      `单词数：${stats.words}`,
      `中文字符：${stats.cjkChars}`,
      `行数：${stats.lines}`,
      `非空行数：${stats.nonEmptyLines}`,
      `预计阅读：约 ${stats.readMinutes} 分钟`,
    ].join("\n");
  }, [empty, stats]);

  return (
    <div>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 输入区 */}
        <SectionCard
          title="输入"
          subtitle="粘贴或输入文本 · 实时统计"
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder="输入或粘贴文本，字符、单词、行数与阅读时长实时更新"
            aria-label="待统计文本"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        {/* 统计结果 */}
        <SectionCard
          title="统计结果"
          subtitle="中文按字 · 英文按词"
          aside={!empty ? <CopyButton text={summary} label="复制统计" /> : undefined}
        >
          {empty ? (
            <Hint kind="info">输入文本后即刻统计，支持中英文混排、多行内容与 emoji。</Hint>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="字符数" value={stats.chars} emphasis />
              <Stat label="去空格字符" value={stats.charsNoSpace} />
              <Stat label="单词数" value={stats.words} tone="accent" />
              <Stat label="中文字符" value={stats.cjkChars} />
              <Stat label="行数" value={stats.lines} />
              <Stat label="非空行数" value={stats.nonEmptyLines} />
            </div>
          )}
        </SectionCard>

        {/* 阅读时长 */}
        <SectionCard title="预计阅读时长" subtitle="中文 300 字/分 · 英文 200 词/分">
          {empty ? (
            <Hint kind="info">输入内容后自动估算阅读所需时间。</Hint>
          ) : (
            <p className="font-mono tabular-nums text-2xl font-semibold text-emerald-300" aria-live="polite">
              {stats.readMinutes < 0.1 ? "<0.1" : stats.readMinutes}
              <span className="text-sm text-neutral-500 ml-1.5 font-normal">分钟</span>
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
