"use client";

import { useCallback, useRef, useState } from "react";
import { findTool } from "@/lib/seo";
import { Hint, PageHeader, SectionCard, downloadFile } from "@/components/ui";
import { readPdfMeta, rotatePages } from "@/lib/pdf";
import type { PdfMeta } from "@/lib/pdf";

const seo = findTool("pdfrotate")!;

export default function PdfRotateTool() {
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
        setErr(r.message);
        setMeta(null);
        setDeltas([]);
        originalBytes.current = null;
      } else {
        setMeta(r.value);
        setDeltas(new Array(r.value.pageCount).fill(0));
      }
    } catch {
      setErr("读取文件失败");
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
      setErr(r.message);
      return;
    }
    downloadFile("rotated.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`已旋转 ${ops.length} 页（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
  }, [deltas, hasOps]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="PDF 旋转" subtitle="纯浏览器本地运算，文件不上传">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
          />

          {meta && (
            <div className="space-y-4 mt-4">
              <p className="text-xs font-mono text-neutral-500">
                共 {meta.pageCount} 页 · {(meta.byteLength / 1024).toFixed(0)} KB
              </p>

              {/* Global controls */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyAll(90)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  全部顺时针 90°
                </button>
                <button
                  onClick={() => applyAll(180)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  全部 180°
                </button>
                <button
                  onClick={() => applyAll(270)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  全部逆时针 90°
                </button>
                <button
                  onClick={resetAll}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-white text-sm font-medium disabled:opacity-40"
                >
                  重置
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
                        第 {i + 1} 页
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
                        ⟳ 旋转 90°
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Download */}
              <div className="pt-2">
                {!hasOps && (
                  <Hint kind="info">当前没有任何旋转</Hint>
                )}
                <button
                  onClick={runDownload}
                  disabled={!hasOps || busy}
                  className="mt-3 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  {busy ? "处理中…" : "旋转并下载"}
                </button>
              </div>
            </div>
          )}

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
        </SectionCard>

        <Hint>
          旋转操作在页面原有角度基础上叠加，始终基于原始文件计算，不会累积误差。支持逐页或批量旋转 90°/180°/270°。
        </Hint>
      </div>
    </div>
  );
}
