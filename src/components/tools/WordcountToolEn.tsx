"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { countText } from "@/lib/wordcount";
import { CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findToolEn("wordcount")!;

const EXAMPLE = "DailyBox is a ready-to-use online toolbox.\nHello, world! Runs entirely in your browser.";

export default function WordcountToolEn() {
  const [input, setInput] = useState("");

  const stats = useMemo(() => countText(input), [input]);
  const empty = input.length === 0;

  const summary = useMemo(() => {
    if (empty) return "";
    return [
      `Characters: ${stats.chars}`,
      `Chars (no spaces): ${stats.charsNoSpace}`,
      `Words: ${stats.words}`,
      `CJK characters: ${stats.cjkChars}`,
      `Lines: ${stats.lines}`,
      `Non-empty lines: ${stats.nonEmptyLines}`,
      `Reading time: ~${stats.readMinutes} min`,
    ].join("\n");
  }, [empty, stats]);

  return (
    <div>
      <PageHeader badge="Text" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          subtitle="Paste or type text - live stats"
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder="Type or paste text here - characters, words, lines and reading time update instantly"
            aria-label="Text to count"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="Statistics"
          subtitle="Chinese counted by character, English by word"
          aside={!empty ? <CopyButton text={summary} label="Copy stats" /> : undefined}
        >
          {empty ? (
            <Hint kind="info">Start typing to see live stats. Supports mixed CJK/Latin text, multiline content and emoji.</Hint>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Characters" value={stats.chars} emphasis />
              <Stat label="Chars (no spaces)" value={stats.charsNoSpace} />
              <Stat label="Words" value={stats.words} tone="accent" />
              <Stat label="CJK characters" value={stats.cjkChars} />
              <Stat label="Lines" value={stats.lines} />
              <Stat label="Non-empty lines" value={stats.nonEmptyLines} />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Estimated reading time" subtitle="Chinese 300 chars/min - English 200 words/min">
          {empty ? (
            <Hint kind="info">Enter some text to estimate reading time.</Hint>
          ) : (
            <p className="font-mono tabular-nums text-2xl font-semibold text-emerald-300" aria-live="polite">
              {stats.readMinutes < 0.1 ? "<0.1" : stats.readMinutes}
              <span className="text-sm text-neutral-500 ml-1.5 font-normal">min</span>
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
