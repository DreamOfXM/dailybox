"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { diffLines, type DiffLine } from "@/lib/textcompare";
import { Badge, CopyButton, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("textcompare")!;

const EXAMPLE_A = "name: dailybox\nversion: 1.0.0\ntheme: dark\ntools: 26";
const EXAMPLE_B = "name: dailybox\nversion: 1.1.0\ntheme: dark\ntools: 28\nauthor: DailyBox";

function serializeDiff(lines: DiffLine[]): string {
  return lines
    .map((l) => (l.type === "added" ? `+ ${l.text}` : l.type === "removed" ? `- ${l.text}` : `  ${l.text}`))
    .join("\n");
}

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

export default function TextcompareToolEn() {
  const [left, setLeft] = useState(EXAMPLE_A);
  const [right, setRight] = useState(EXAMPLE_B);

  const result = useMemo(() => diffLines(left, right), [left, right]);
  const { added, removed, same } = result.stats;
  const hasInput = left !== "" || right !== "";
  const hasDiff = added > 0 || removed > 0;

  return (
    <div>
      <PageHeader badge="Text" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          subtitle="Line-by-line comparison, real-time"
          aside={
            <button
              type="button"
              onClick={() => {
                setLeft(EXAMPLE_A);
                setRight(EXAMPLE_B);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              Load example
            </button>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">Left text</div>
              <textarea
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                rows={8}
                placeholder="Paste the original text here"
                aria-label="Left text"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
            </div>
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1.5">Right text</div>
              <textarea
                value={right}
                onChange={(e) => setRight(e.target.value)}
                rows={8}
                placeholder="Paste the modified text here"
                aria-label="Right text"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Diff result"
          subtitle={hasInput ? `${result.lines.length} lines total` : undefined}
          aside={
            hasInput ? (
              <>
                <Badge tone="emerald">Added +{added}</Badge>
                <Badge tone="rose">Deleted -{removed}</Badge>
                <Badge tone="neutral">Same {same}</Badge>
                <CopyButton text={serializeDiff(result.lines)} label="Copy" />
              </>
            ) : undefined
          }
        >
          {!hasInput ? (
            <Hint kind="info">Enter text on both sides above and the diff will be highlighted here line by line.</Hint>
          ) : (
            <>
              {result.approximate && (
                <div className="mb-3">
                  <Hint kind="warn">One side exceeds 2,000 lines — fell back to simple line-by-line alignment (results are complete but may not show the minimal diff).</Hint>
                </div>
              )}
              {hasDiff ? (
                <div className="space-y-0.5 max-h-[420px] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-2" aria-live="polite">
                  {result.lines.map((l, i) => (
                    <DiffRow key={i} line={l} />
                  ))}
                </div>
              ) : (
                <Hint kind="success">Both sides are identical — {same} lines, no differences.</Hint>
              )}
            </>
          )}
        </SectionCard>

        <Hint kind="info">
          Compares whole lines using LCS (Longest Common Subsequence): unchanged lines stay in place, lines only in the
          left text are marked red as deleted, lines only in the right text are marked green as added. Line endings
          (CRLF / CR) are normalized to LF, and trailing blank lines are included in the comparison.
        </Hint>
      </div>
    </div>
  );
}
