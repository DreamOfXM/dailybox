"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { convertCase, type CaseMode } from "@/lib/caseconvert";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findToolEn("caseconvert")!;

const EXAMPLE = "hello world example";

const MODE_OPTIONS: Array<{ value: CaseMode; label: string }> = [
  { value: "upper", label: "UPPER CASE" },
  { value: "lower", label: "lower case" },
  { value: "capitalize", label: "Title Case" },
  { value: "camel", label: "camelCase" },
  { value: "snake", label: "snake_case" },
  { value: "kebab", label: "kebab-case" },
];

export default function CaseconvertToolEn() {
  const [mode, setMode] = useState<CaseMode>("upper");
  const [input, setInput] = useState("");

  const result = useMemo(() => (input ? convertCase(input, mode) : ""), [input, mode]);

  const feedBack = () => {
    if (result) setInput(result);
  };

  return (
    <div>
      <PageHeader badge="Text" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          subtitle="Supports CJK and Latin - camel/snake split on non-alphanumeric"
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
          <div className="mb-4 overflow-x-auto no-scrollbar">
            <Segmented value={mode} onChange={setMode} options={MODE_OPTIONS} ariaLabel="Conversion mode" />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            placeholder="Type or paste text here - result appears below instantly"
            aria-label="Input text"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="Result"
          aside={
            <>
              <button
                type="button"
                onClick={feedBack}
                disabled={!result}
                className="text-xs font-mono px-2.5 py-1 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
              >
                Feed back to input
              </button>
              <CopyButton text={result} label="Copy result" />
            </>
          }
        >
          <textarea
            readOnly
            value={result}
            rows={6}
            placeholder="Result will appear here"
            aria-label="Converted result"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {!input && (
            <div className="mt-3">
              <Hint kind="info">Enter text to convert instantly. Chinese characters and punctuation are preserved as-is in upper/lower/title case modes.</Hint>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
