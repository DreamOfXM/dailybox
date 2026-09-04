"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";
import { decodeUrl, encodeFormUrl, encodeUrl, encodeUrlComponent } from "@/lib/urlcode";

const seo = findToolEn("url")!;

type Direction = "encode" | "decode";
type Mode = "component" | "uri" | "form";

/** Example with Unicode, spaces & reserved chars */
const EXAMPLE = "https://example.com/search?q=toolbox&lang=en";

/** Map Chinese error messages from urlcode.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/解码失败/.test(msg)) return msg.replace(/解码失败（(.+?) 模式）：输入包含非法或残缺的 % 转义序列/, "Decoding failed ($1 mode): input contains invalid or incomplete percent-escape sequences");
  return msg;
}

export default function UrlTool() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [mode, setMode] = useState<Mode>("component");
  const [input, setInput] = useState("");

  const result = useMemo<{ text: string; error?: string }>(() => {
    if (!input) return { text: "" };
    if (direction === "encode") {
      const fn = mode === "uri" ? encodeUrl : mode === "form" ? encodeFormUrl : encodeUrlComponent;
      return { text: fn(input) };
    }
    const r = decodeUrl(input, mode);
    return r.ok ? { text: r.value } : { text: "", error: enMsg(r.message) };
  }, [input, direction, mode]);

  /** Feed result back into input and auto-reverse direction (Encode/Decode) for round-trip verification */
  const feedBack = () => {
    if (!result.text) return;
    setInput(result.text);
    setDirection(direction === "encode" ? "decode" : "encode");
  };

  return (
    <div>
      <PageHeader badge="Encoding" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        <SectionCard
          title="Input"
          aside={
            <button
              type="button"
              onClick={() => setInput(EXAMPLE)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              Example
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: "encode", label: "Encode" },
                { value: "decode", label: "Decode" },
              ]}
              ariaLabel="Direction"
            />
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "component", label: "Component" },
                { value: "uri", label: "Full URL" },
                { value: "form", label: "Form URL" },
              ]}
              ariaLabel="Encoding mode"
            />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Enter or paste text to encode / decode — result appears below"
            aria-label="Input content"
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
                ↙ Feed back as input
              </button>
              <CopyButton text={result.text} label="Copy result" />
            </>
          }
        >
          <textarea
            readOnly
            value={result.text}
            rows={5}
            placeholder="Result will appear here"
            aria-label="Output result"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {result.error && (
            <div className="mt-3">
              <Hint kind="error">{result.error}</Hint>
            </div>
          )}
        </SectionCard>

        <Hint kind="info">
          Mode differences: Component (encodeURIComponent) encodes reserved characters like &amp; / ? =, ideal for query parameters.
          Full URL (encodeURI) preserves URL syntax characters like : / ? &amp;, ideal for complete links.
          Form URL (application/x-www-form-urlencoded) converts spaces to +, ideal for form submissions.
        </Hint>
      </div>
    </div>
  );
}
