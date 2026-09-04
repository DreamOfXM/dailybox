"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { dedupeLines, type SortMode } from "@/lib/dedupe";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented, Stat, Toggle } from "@/components/ui";

const seo = findToolEn("dedupe")!;

const EXAMPLE = "banana\napple\nbanana\ncherry\napple\n\nBanana";

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "none", label: "Keep order" },
  { value: "asc", label: "A to Z" },
  { value: "desc", label: "Z to A" },
  { value: "length", label: "By length" },
];

export default function DedupeToolEn() {
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
      <PageHeader badge="Text" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          subtitle="One item per line - processed in real time"
          aside={
            <button
              type="button"
              onClick={() => setInput(EXAMPLE)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05] transition-colors"
            >
              Fill example
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Toggle checked={trim} onChange={setTrim} label="Trim whitespace" />
            <Toggle checked={caseSensitive} onChange={setCaseSensitive} label="Case sensitive" />
            <Toggle checked={removeEmpty} onChange={setRemoveEmpty} label="Remove blank lines" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented value={sort} onChange={setSort} options={SORT_OPTIONS} ariaLabel="Sort mode" />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder="Type or paste multiline text here - duplicate lines are removed instantly"
            aria-label="Input text"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="Result"
          subtitle={result ? `Keeps first occurrence - removed ${result.removed} lines` : undefined}
          aside={result ? <CopyButton text={result.text} label="Copy result" /> : undefined}
        >
          {result ? (
            <>
              <textarea
                readOnly
                value={result.text}
                rows={8}
                placeholder="Result will appear here"
                aria-label="Processed result"
                className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
              />
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Stat label="Original lines" value={result.total} />
                <Stat label="Kept lines" value={result.total - result.removed} tone="good" />
                <Stat label="Removed lines" value={result.removed} tone={result.removed > 0 ? "warn" : "default"} />
              </div>
            </>
          ) : (
            <Hint kind="info">Enter multiline text to process. Deduplication, blank-line cleanup and sorting all run locally - nothing is uploaded.</Hint>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
