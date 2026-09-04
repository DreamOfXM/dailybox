"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { diffLines, type DiffLine } from "@/lib/textcompare";
import { Badge, CopyButton, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findTool("textcompare")!;

/** 预置示例：两版配置，一键体验差异高亮 */
const EXAMPLE_A = "name: dailybox\nversion: 1.0.0\ntheme: dark\ntools: 26";
const EXAMPLE_B = "name: dailybox\nversion: 1.1.0\ntheme: dark\ntools: 28\nauthor: DailyBox";

/** diff 序列化为可复制文本：+ 新增 / - 删除 / 空格 相同 */
function serializeDiff(lines: DiffLine[]): string {
  return lines
    .map((l) => (l.type === "added" ? `+ ${l.text}` : l.type === "removed" ? `- ${l.text}` : `  ${l.text}`))
    .join("\n");
}

/** 单行 diff 渲染：新增绿底、删除红底 + 删除线、相同原色 */
function DiffRow({ line }: { line: DiffLine }) {
  const style =
    line.type === "added"
      ? "bg-emerald-500/10 text-emerald-300"
      : line.type === "removed"
        ? "bg-red-500/10 text-red-300 line-through decoration-red-400/60"
        : "text-neutral-400";
  const sym = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
  return (
    <div className={`px-2 py-0.5 rounded font-mono text-sm leading-relaxed whitespace-pre-wrap break-all ${style}`}>
      <span className="select-none mr-2 opacity-70">{sym}</span>
      {line.text === "" ? "\u00A0" : line.text}
    </div>
  );
}

export default function TextcompareTool() {
  const [left, setLeft] = useState(EXAMPLE_A);
  const [right, setRight] = useState(EXAMPLE_B);

  const result = useMemo(() => diffLines(left, right), [left, right]);
  const { added, removed, same } = result.stats;
  const hasInput = left !== "" || right !== "";
  const hasDiff = added > 0 || removed > 0;

  return (
    <div>
      <PageHeader badge="文本" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 左右输入 */}
        <SectionCard
          title="输入"
          subtitle="逐行对比 · 实时计算"
          aside={
            <button
              type="button"
              onClick={() => {
                setLeft(EXAMPLE_A);
                setRight(EXAMPLE_B);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">原文</div>
              <textarea
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                rows={8}
                placeholder="粘贴原始文本，每行一条"
                aria-label="原文"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
            </div>
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">对比文</div>
              <textarea
                value={right}
                onChange={(e) => setRight(e.target.value)}
                rows={8}
                placeholder="粘贴修改后的文本，每行一条"
                aria-label="对比文"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
            </div>
          </div>
        </SectionCard>

        {/* 差异结果 */}
        <SectionCard
          title="差异结果"
          subtitle={hasInput ? `共 ${result.lines.length} 行` : undefined}
          aside={
            hasInput ? (
              <>
                <Badge tone="emerald">新增 +{added}</Badge>
                <Badge tone="rose">删除 -{removed}</Badge>
                <Badge tone="neutral">相同 {same}</Badge>
                <CopyButton text={serializeDiff(result.lines)} label="复制结果" />
              </>
            ) : undefined
          }
        >
          {!hasInput ? (
            <Hint kind="info">在上方输入原文与对比文，差异将逐行高亮显示在这里。</Hint>
          ) : (
            <>
              {result.approximate && (
                <div className="mb-3">
                  <Hint kind="warn">任一侧超过 2000 行，已降级为逐行对齐模式（不保证最小差异，但结果完整）。</Hint>
                </div>
              )}
              {hasDiff ? (
                <div className="space-y-0.5 max-h-[420px] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-2" aria-live="polite">
                  {result.lines.map((l, i) => (
                    <DiffRow key={i} line={l} />
                  ))}
                </div>
              ) : (
                <Hint kind="success">两侧内容完全一致，共 {same} 行，没有任何差异。</Hint>
              )}
            </>
          )}
        </SectionCard>

        <Hint kind="info">
          按整行比较（LCS 最长公共子序列）：相同的行保持原位，仅在原文出现的行标红删除，仅在对比文出现的行标绿新增。换行符
          CRLF / CR 会统一按 LF 处理，末尾多出的空行也会参与对比。
        </Hint>
      </div>
    </div>
  );
}
