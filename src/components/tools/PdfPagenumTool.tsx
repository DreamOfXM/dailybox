"use client";

import { useCallback, useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { Field, Hint, NumberInput, PageHeader, SectionCard, Toggle, downloadFile } from "@/components/ui";
import { addPageNumbers, readPdfMeta } from "@/lib/pdf";
import type { PageNumPosition } from "@/lib/pdf";

const seo = findTool("pdfpagenum")!;

const ASCII_RE = /^[\x20-\x7E]*$/;

const POSITIONS: { value: PageNumPosition; label: string; row: number; col: number }[] = [
  { value: "top-left", label: "↖", row: 0, col: 0 },
  { value: "top-center", label: "↑", row: 0, col: 1 },
  { value: "top-right", label: "↗", row: 0, col: 2 },
  { value: "bottom-left", label: "↙", row: 1, col: 0 },
  { value: "bottom-center", label: "↓", row: 1, col: 1 },
  { value: "bottom-right", label: "↘", row: 1, col: 2 },
];

const FORMAT_PRESETS = ["{n}", "{n}/{total}", "- {n} -", "Page {n} of {total}"];

export default function PdfPagenumTool() {
  /* ---- upload ---- */
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  /* ---- opts ---- */
  const [format, setFormat] = useState("{n} / {total}");
  const [start, setStart] = useState("1");
  const [position, setPosition] = useState<PageNumPosition>("bottom-center");
  const [fontSize, setFontSize] = useState("11");
  const [color, setColor] = useState("#333333");
  const [opacity, setOpacity] = useState(1);
  const [bold, setBold] = useState(false);
  const [margin, setMargin] = useState("36");
  const [showFirst, setShowFirst] = useState(true);

  /* ---- status ---- */
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reset = () => { setMsg(""); setErr(""); };

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    reset();
    const buf = await f.arrayBuffer();
    setBytes(new Uint8Array(buf));
    const meta = await readPdfMeta(buf);
    if (meta.ok) setPageCount(meta.value.pageCount);
    else setErr(meta.message);
  }, []);

  const hasNonAscii = !ASCII_RE.test(format);

  const canDownload = !!bytes && !busy && format.trim().length > 0;

  const run = useCallback(async () => {
    if (!bytes || !canDownload) return;
    setBusy(true);
    reset();
    const r = await addPageNumbers(bytes, {
      format,
      start: Number(start) || 1,
      fontSize: Number(fontSize) || 11,
      color,
      opacity,
      bold,
      position,
      margin: Number(margin) || 36,
      showFirst,
    });
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    downloadFile("numbered.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`已添加页码（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
  }, [bytes, canDownload, format, start, fontSize, color, opacity, bold, position, margin, showFirst]);

  /* ---- preview label ---- */
  const previewLabel = useMemo(() => {
    const s = Number(start) || 1;
    const t = pageCount || 1;
    return format.replace(/\{n\}/g, String(s)).replace(/\{total\}/g, String(t));
  }, [format, start, pageCount]);

  /* ---- preview position style ---- */
  const previewPosStyle = useMemo(() => {
    const m = 8; // scaled margin for preview box
    const base: React.CSSProperties = { position: "absolute" };
    if (position.includes("center") && !position.startsWith("top") && !position.startsWith("bottom")) {
      // shouldn't happen but fallback
      return { ...base, left: "50%", bottom: m, transform: "translateX(-50%)" };
    }
    const vert = position.startsWith("top") ? { top: m } : { bottom: m };
    let horiz: React.CSSProperties;
    if (position.includes("left")) horiz = { left: m };
    else if (position.includes("right")) horiz = { right: m };
    else horiz = { left: "50%", transform: "translateX(-50%)" };
    return { ...base, ...vert, ...horiz };
  }, [position]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        {/* Upload */}
        <SectionCard title="上传 PDF" subtitle="纯浏览器本地运算，文件不上传">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
          />
          {file && pageCount > 0 && (
            <p className="mt-2 text-xs font-mono text-neutral-500">
              {file.name} · {(file.size / 1024).toFixed(0)} KB · 共 {pageCount} 页
            </p>
          )}
        </SectionCard>

        {bytes && pageCount > 0 && (
          <>
            <SectionCard title="页码设置">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-4">
                  <Field label="页码模板">
                    <input
                      value={format}
                      onChange={(e) => { setFormat(e.target.value); reset(); }}
                      placeholder="{n} / {total}"
                      className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                    />
                  </Field>
                  {hasNonAscii && (
                    <Hint kind="warn">
                      页码模板不支持中文，请使用 {"{"}n{"}"}、{"{"}total{"}"}、Page、数字与符号。
                    </Hint>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {FORMAT_PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setFormat(p); reset(); }}
                        className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors ${
                          format === p
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-white/[0.06] text-neutral-500 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="起始页码">
                      <NumberInput value={start} onChange={setStart} />
                    </Field>
                    <Field label="字号">
                      <NumberInput value={fontSize} onChange={setFontSize} suffix="pt" />
                    </Field>
                  </div>
                  <Field label="颜色">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </Field>
                  <Field label={`不透明度 ${(opacity * 100).toFixed(0)}%`}>
                    <input
                      type="range"
                      min={0.02}
                      max={1}
                      step={0.01}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </Field>
                  <Toggle checked={bold} onChange={setBold} label="粗体" />
                  <Field label="边距">
                    <NumberInput value={margin} onChange={setMargin} suffix="pt" />
                  </Field>
                  <Toggle checked={showFirst} onChange={setShowFirst} label="首页显示页码" />
                </div>

                {/* Position + Preview */}
                <div className="space-y-4">
                  <Field label="位置">
                    <div className="grid grid-cols-3 gap-2 w-fit">
                      {POSITIONS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPosition(p.value)}
                          className={`w-12 h-10 rounded-lg text-sm font-mono border transition-colors ${
                            position === p.value
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/[0.06] text-neutral-500 hover:text-white hover:bg-white/[0.04]"
                          }`}
                          title={p.value}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Live CSS Preview */}
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider mb-2">实时预览</p>
                    <div
                      className="relative border border-white/[0.08] bg-white/[0.02] rounded-lg overflow-hidden"
                      style={{ width: 200, height: 283 }}
                    >
                      <span
                        className="select-none pointer-events-none whitespace-nowrap"
                        style={{
                          ...previewPosStyle,
                          opacity,
                          color,
                          fontSize: Math.max(8, Math.min(14, Number(fontSize) || 11)),
                          fontWeight: bold ? 700 : 400,
                          fontFamily: "monospace",
                        }}
                      >
                        {previewLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Download */}
            <SectionCard title="导出">
              <button
                onClick={run}
                disabled={!canDownload}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "处理中…" : "添加页码并下载"}
              </button>
              {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
              {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
            </SectionCard>
          </>
        )}

        <Hint>
          页码模板支持 {"{"}n{"}"}（当前页）和 {"{"}total{"}"}（总页数），仅支持英文数字与符号。
          所有操作基于 pdf-lib 在浏览器本地完成，文件不会上传到任何服务器。
        </Hint>
      </div>
    </div>
  );
}
