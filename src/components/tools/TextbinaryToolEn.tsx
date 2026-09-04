"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { binaryToText, textToBinary } from "@/lib/textbinary";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findToolEn("textbinary")!;

type Direction = "t2b" | "b2t";

const EXAMPLE_TEXT = "Hi World!";

/** Map Chinese lib error messages to English equivalents */
function translateError(msg: string): string {
  if (msg.includes("非 0/1")) return "Contains non-binary characters (only 0 and 1 are allowed).";
  if (msg.includes("不是 8 的倍数")) return "Total bit count is not a multiple of 8 — cannot reconstruct bytes.";
  if (msg.includes("每组必须恰好 8 位")) return "Each group must contain exactly 8 bits.";
  if (msg.includes("长度为")) {
    const m = msg.match(/第 (\d+) 组.*长度为 (\d+)/);
    if (m) return `Group ${m[1]} has ${m[2]} bits — each group must be exactly 8 bits.`;
    return "A group has the wrong number of bits — each group must be exactly 8 bits.";
  }
  if (msg.includes("UTF-8")) return "The byte sequence is not valid UTF-8 (possibly a truncated multi-byte character).";
  return msg;
}

export default function TextbinaryToolEn() {
  const [direction, setDirection] = useState<Direction>("t2b");
  const [input, setInput] = useState(EXAMPLE_TEXT);
  const [sep, setSep] = useState(" ");

  const result = useMemo<{ text: string; error?: string }>(() => {
    if (!input) return { text: "" };
    if (direction === "t2b") return { text: textToBinary(input, sep) };
    const r = binaryToText(input, sep);
    return r.ok ? { text: r.value } : { text: "", error: translateError(r.message) };
  }, [input, direction, sep]);

  const feedBack = () => {
    if (!result.text) return;
    setInput(result.text);
    setDirection(direction === "t2b" ? "b2t" : "t2b");
  };

  const inputLabel = direction === "t2b" ? "Text" : "Binary";

  return (
    <div>
      <PageHeader badge="Text" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          aside={
            <button
              type="button"
              onClick={() => {
                setDirection("t2b");
                setInput(EXAMPLE_TEXT);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              Load example
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: "t2b", label: "Text → Binary" },
                { value: "b2t", label: "Binary → Text" },
              ]}
              ariaLabel="Direction"
            />
            <label className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              Separator
              <input
                value={sep}
                onChange={(e) => setSep(e.target.value)}
                placeholder="Space"
                aria-label="Byte separator"
                className="w-24 px-3 py-1.5 rounded-md font-mono text-sm border border-white/[0.06] bg-white/[0.03] focus:outline-none focus:border-white/20"
              />
              {sep === "" && <span className="text-neutral-700">No separator (continuous 01 stream)</span>}
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={
              direction === "t2b"
                ? "Type or paste text here — the binary output updates in real time below"
                : "Enter a binary sequence (groups of 8 bits) — the text output updates in real time below"
            }
            aria-label={inputLabel}
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="Output"
          aside={
            <>
              <button
                type="button"
                onClick={feedBack}
                disabled={!result.text}
                className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
              >
                ↙ Feed back to input
              </button>
              <CopyButton text={result.text} label="Copy" />
            </>
          }
        >
          <textarea
            readOnly
            value={result.text}
            rows={5}
            placeholder="Result will appear here"
            aria-label="Output"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {result.error && (
            <div className="mt-3">
              <Hint kind="error">{result.error}</Hint>
            </div>
          )}
        </SectionCard>

        <Hint kind="info">
          Encoding: text is converted to UTF-8 bytes (ASCII = 1 byte, CJK = 3 bytes, emoji = 4 bytes), then each byte
          is output as 8 binary digits joined by the separator. Decoding reverses this: every 8 bits form one byte,
          line breaks and extra whitespace are ignored. Invalid input (non-0/1 characters, wrong bit count, or invalid
          UTF-8 sequences) produces a clear error message.
        </Hint>
      </div>
    </div>
  );
}
