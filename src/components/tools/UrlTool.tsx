"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";
import { decodeUrl, encodeFormUrl, encodeUrl, encodeUrlComponent } from "@/lib/urlcode";

const seo = findTool("url")!;

type Direction = "encode" | "decode";
type Mode = "component" | "uri" | "form";

/** 预置示例：含中文、空格与保留字符，一键体验 */
const EXAMPLE = "https://example.com/search?q=工具箱&lang=zh CN";

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
    return r.ok ? { text: r.value } : { text: "", error: r.message };
  }, [input, direction, mode]);

  /** 结果填回输入，并自动反转方向（编码↔解码），方便往返校验 */
  const feedBack = () => {
    if (!result.text) return;
    setInput(result.text);
    setDirection(direction === "encode" ? "decode" : "encode");
  };

  return (
    <div>
      <PageHeader badge="编码" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        <SectionCard
          title="输入"
          aside={
            <button
              type="button"
              onClick={() => setInput(EXAMPLE)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: "encode", label: "编码" },
                { value: "decode", label: "解码" },
              ]}
              ariaLabel="转换方向"
            />
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "component", label: "component" },
                { value: "uri", label: "完整URI" },
                { value: "form", label: "表单" },
              ]}
              ariaLabel="编码模式"
            />
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="输入或粘贴待编码 / 解码的内容，结果实时出现在下方"
            aria-label="输入内容"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
        </SectionCard>

        <SectionCard
          title="输出"
          aside={
            <>
              <button
                type="button"
                onClick={feedBack}
                disabled={!result.text}
                className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
              >
                ↙ 结果填回输入
              </button>
              <CopyButton text={result.text} label="复制结果" />
            </>
          }
        >
          <textarea
            readOnly
            value={result.text}
            rows={5}
            placeholder="结果将显示在这里"
            aria-label="输出结果"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          {result.error && (
            <div className="mt-3">
              <Hint kind="error">{result.error}</Hint>
            </div>
          )}
        </SectionCard>

        <Hint kind="info">
          三种模式区别：component（encodeURIComponent）会编码 & / ? = 等保留字符，适合查询参数；完整URI（encodeURI）不编码
          : / ? & 等 URL 语法字符，适合整条链接；表单（application/x-www-form-urlencoded）把空格转为 +，适合表单提交。
        </Hint>
      </div>
    </div>
  );
}
