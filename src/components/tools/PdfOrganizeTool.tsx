"use client";

import { useCallback, useRef, useState } from "react";
import { findTool } from "@/lib/seo";
import { Hint, PageHeader, SectionCard, downloadFile } from "@/components/ui";
import { readPdfMeta, reorderPages } from "@/lib/pdf";
import type { PdfMeta } from "@/lib/pdf";

const seo = findTool("pdforganize")!;

export default function PdfOrganizeTool() {
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [order, setOrder] = useState<number[]>([]);
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
        setOrder([]);
        originalBytes.current = null;
      } else {
        setMeta(r.value);
        setOrder(Array.from({ length: r.value.pageCount }, (_, i) => i));
      }
    } catch {
      setErr("读取文件失败");
    } finally {
      setBusy(false);
    }
  }, []);

  const moveUp = useCallback((pos: number) => {
    if (pos <= 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
      return next;
    });
    reset();
  }, []);

  const moveDown = useCallback((pos: number) => {
    setOrder((prev) => {
      if (pos >= prev.length - 1) return prev;
      const next = [...prev];
      [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
      return next;
    });
    reset();
  }, []);

  const removePage = useCallback((pos: number) => {
    setOrder((prev) => prev.filter((_, i) => i !== pos));
    reset();
  }, []);

  const resetOrder = useCallback(() => {
    if (!meta) return;
    setOrder(Array.from({ length: meta.pageCount }, (_, i) => i));
    reset();
  }, [meta]);

  const deletedCount = meta ? meta.pageCount - order.length : 0;

  const runDownload = useCallback(async () => {
    if (!originalBytes.current || order.length === 0) return;
    setBusy(true);
    reset();
    const r = await reorderPages(originalBytes.current, order);
    setBusy(false);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    downloadFile("organized.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`已整理 ${order.length} 页（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
  }, [order]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="PDF 页面整理" subtitle="纯浏览器本地运算，文件不上传">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
          />

          {meta && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-mono text-neutral-500">
                  保留 {order.length} / 共 {meta.pageCount} 页 · 已删除 {deletedCount} 页
                </p>
                <button
                  onClick={resetOrder}
                  disabled={busy}
                  className="px-3 py-1 rounded-lg bg-white/[0.06] text-white text-xs font-medium disabled:opacity-40 hover:bg-white/[0.1]"
                >
                  重置顺序
                </button>
              </div>

              {/* Page cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {order.map((origIdx, pos) => {
                  const page = meta.pages[origIdx];
                  return (
                    <div
                      key={`${origIdx}-${pos}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-xs font-mono text-neutral-500">
                        新序 #{pos + 1}
                      </span>
                      {/* Placeholder card representing the page */}
                      <div className="w-14 h-18 border-2 border-white/20 rounded-md flex items-center justify-center">
                        <span className="text-lg font-bold text-white/60">
                          {origIdx + 1}
                        </span>
                      </div>
                      {page && (
                        <span className="text-[10px] font-mono text-neutral-600">
                          {Math.round(page.width)}×{Math.round(page.height)}
                        </span>
                      )}
                      <div className="flex gap-1 flex-wrap justify-center">
                        <button
                          onClick={() => moveUp(pos)}
                          disabled={pos === 0 || busy}
                          className="px-2 py-1 rounded-lg bg-white/[0.06] text-white text-[10px] font-medium disabled:opacity-40 hover:bg-white/[0.1]"
                        >
                          ↑ 前移
                        </button>
                        <button
                          onClick={() => moveDown(pos)}
                          disabled={pos === order.length - 1 || busy}
                          className="px-2 py-1 rounded-lg bg-white/[0.06] text-white text-[10px] font-medium disabled:opacity-40 hover:bg-white/[0.1]"
                        >
                          ↓ 后移
                        </button>
                        <button
                          onClick={() => removePage(pos)}
                          disabled={busy}
                          className="px-2 py-1 rounded-lg bg-red-900/30 text-red-300 text-[10px] font-medium disabled:opacity-40 hover:bg-red-900/50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Download */}
              <div className="pt-2">
                {order.length === 0 && (
                  <Hint kind="error">所有页面都被删除了</Hint>
                )}
                <button
                  onClick={runDownload}
                  disabled={order.length === 0 || busy}
                  className="mt-3 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  {busy ? "处理中…" : "整理并下载"}
                </button>
              </div>
            </div>
          )}

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
        </SectionCard>

        <Hint>
          用每页卡片上的「↑ 前移 / ↓ 后移」调整顺序、「删除」去掉不需要的页面，最终生成一份全新 PDF（不改动原件）。支持重排、删页、提取子集，一次操作完成。
        </Hint>
      </div>
    </div>
  );
}
