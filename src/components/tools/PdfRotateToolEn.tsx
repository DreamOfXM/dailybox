"use client";

import { useCallback, useRef, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { Hint, PageHeader, SectionCard, downloadFile } from "@/components/ui";
import { readPdfMeta, rotatePages } from "@/lib/pdf";
import type { PdfMeta } from "@/lib/pdf";

const seo = findToolEn("pdfrotate")!;

/** Map Chinese error messages from pdf.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/加密/.test(msg)) return "This PDF is encrypted and cannot be processed. Please decrypt it first.";
  if (/不支持中文|WinAnsi|cannot be encoded/i.test(msg)) return "Built-in font does not support CJK characters. Use ASCII text or an image watermark.";
  if (/不是有效的 PDF|已损坏|Invalid PDF/i.test(msg)) return "The file is not a valid PDF or may be corrupted.";
  if (/无法读取/.test(msg)) return "Unable to read the PDF.";
  if (/超出范围/.test(msg)) return msg.replace(/页码 (\d+) 超出范围（共 (\d+) 页）/, "Page $1 out of range (document has $2 pages)");
  if (/没有需要旋转/.test(msg)) return "No pages to rotate.";
  if (/旋转失败/.test(msg)) return "Rotation failed.";
  if (/读取文件失败/.test(msg)) return "Failed to read the file.";
  return msg;
}

export default function PdfRotateToolEn() {
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [deltas, setDeltas] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const originalBytes = useRef<ArrayBuffer | null>(null);

  const reset = () => {
    setMsg("");
    setErr("");
  };

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    reset();
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      originalBytes.current = buf;
      const r = await readPdfMeta(buf);
      if (!r.ok) {
        setErr(enMsg(r.message));
        setMeta(null);
        setDeltas([]);
        originalBytes.current = null;
      } else {
        setMeta(r.value);
        setDeltas(new Array(r.value.pageCount).fill(0));
      }
    } catch {
      setErr("Failed to read the file.");
    } finally {
      setBusy(false);
    }
  }, []);

  const applyAll = useCallback((delta: number) => {
    setDeltas((prev) => prev.map((d) => d + delta));
    reset();
  }, []);

  const applyOne = useCallback((index: number, delta: number) => {
    setDeltas((prev) => {
      const next = [...prev];
      next[index] = next[index] + delta;
      return next;
    });
    reset();
  }, []);

  const resetAll = useCallback(() => {
    setDeltas((prev) => prev.map(() => 0));
    reset();
  }, []);

  const hasOps = deltas.some((d) => ((d % 360) + 360) % 360 !== 0);

  const runDownload = useCallback(async () => {
    if (!originalBytes.current || !hasOps) return;
    setBusy(true);
    reset();
    const ops = deltas
      .map((d, i) => ({ index: i, delta: d }))
      .filter((o) => ((o.delta % 360) + 360) % 360 !== 0);
    const r = await rotatePages(originalBytes.current, ops);
    setBusy(false);
    if (!r.ok) {
      setErr(enMsg(r.message));
      return;
    }
    downloadFile("rotated.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`Rotated ${ops.length} page${ops.length > 1 ? "s" : ""} (${(r.value.byteLength / 1024).toFixed(0)} KB) — download started`);
  }, [deltas, hasOps]);

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="PDF Rotate" subtitle="Runs entirely in your browser — files never upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
          />

          {meta && (
            <div className="space-y-4 mt-4">
              <p className="text-xs font-mono text-neutral-500">
                {meta.pageCount} pages · {(meta.byteLength / 1024).toFixed(0)} KB
              </p>

              {/* Global controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyAll(90)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  All clockwise 90°
                </button>
                <button
                  onClick={() => applyAll(180)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  All 180°
                </button>
                <button
                  onClick={() => applyAll(270)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  All counter-clockwise 90°
                </button>
                <button
                  onClick={resetAll}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white text-sm font-medium disabled:opacity-40"
                >
                  Reset
                </button>
              </div>

              {/* Per-page grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {meta.pages.map((page, i) => {
                  const resultAngle =
                    ((page.rotation + deltas[i]) % 360 + 360) % 360;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-xs font-mono text-neutral-500">
                        Page {i + 1}
                      </span>
                      {/* Visual page orientation indicator */}
                      <div className="relative w-12 h-16 flex items-center justify-center">
                        <div
                          className="w-8 h-11 border-2 border-white/30 rounded-sm transition-transform duration-300"
                          style={{ transform: `rotate(${resultAngle}deg)` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white">
                        {resultAngle}°
                      </span>
                      <button
                        onClick={() => applyOne(i, 90)}
                        disabled={busy}
                        className="px-3 py-1 rounded-lg bg-white/[0.06] text-white text-xs font-medium disabled:opacity-40 hover:bg-white/[0.1]"
                      >
                        ⟳ Rotate 90°
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Download */}
              <div className="pt-2">
                {!hasOps && (
                  <Hint kind="info">No rotations applied yet</Hint>
                )}
                <button
                  onClick={runDownload}
                  disabled={!hasOps || busy}
                  className="mt-3 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  {busy ? "Processing…" : "Rotate & download"}
                </button>
              </div>
            </div>
          )}

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
        </SectionCard>

        <Hint>
          Rotation is applied on top of each page&apos;s existing angle, always calculated from the
          original file so errors never accumulate. Supports per-page or batch rotation by 90°/180°/270°.
        </Hint>
      </div>
    </div>
  );
}
