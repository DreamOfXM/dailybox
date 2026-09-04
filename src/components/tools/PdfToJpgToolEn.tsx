"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/lib/seo";
import { findToolEn } from "@/lib/seo-en";
import { Hint, PageHeader, SectionCard, Segmented, downloadFile } from "@/components/ui";

const seo = findToolEn("pdftojpg")!;

interface RenderedPage {
  index: number;
  blob: Blob;
  url: string;
}

export default function PdfToJpgToolEn() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [format, setFormat] = useState<"jpg" | "png">("jpg");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState<"1x" | "2x" | "3x">("2x");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount or re-upload
  const cleanupPages = useCallback((list: RenderedPage[]) => {
    for (const p of list) URL.revokeObjectURL(p.url);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount — use ref-like access via setter callback is not ideal;
      // instead we track in a mutable ref below.
    };
  }, []);

  const pagesRef = useRef<RenderedPage[]>([]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    return () => cleanupPages(pagesRef.current);
  }, [cleanupPages]);

  const reset = () => {
    setMsg("");
    setErr("");
    setProgress("");
  };

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    // Cleanup previous pages
    cleanupPages(pagesRef.current);
    setPages([]);
    setFile(f);
    setTotalPages(0);
    reset();
    if (!f) return;

    // Quick page count via pdf.js (dynamic import)
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `${BASE_PATH}/pdf.worker.min.mjs`;
      const data = new Uint8Array(await f.arrayBuffer());
      const task = pdfjs.getDocument({ data });
      const doc = await task.promise;
      setTotalPages(doc.numPages);
      await task.destroy();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read the PDF file.");
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [cleanupPages]);

  const scaleNum = scale === "1x" ? 1 : scale === "2x" ? 2 : 3;
  const ext = format === "jpg" ? "jpg" : "png";
  const mime = format === "jpg" ? "image/jpeg" : "image/png";

  const runRender = useCallback(async () => {
    if (!file || totalPages === 0) return;
    setBusy(true);
    reset();
    // Cleanup previous rendered pages
    cleanupPages(pagesRef.current);
    setPages([]);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `${BASE_PATH}/pdf.worker.min.mjs`;
      const data = new Uint8Array(await file.arrayBuffer());
      const task = pdfjs.getDocument({ data });
      const doc = await task.promise;
      const n = doc.numPages;

      const rendered: RenderedPage[] = [];
      for (let i = 1; i <= n; i++) {
        setProgress(`Rendering page ${i} of ${n}...`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: scaleNum });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d")!;
        // JPEG has no alpha; paint white background to avoid black output
        if (format === "jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvas, viewport }).promise;
        const blob: Blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
            format === "jpg" ? "image/jpeg" : "image/png",
            format === "jpg" ? quality : undefined
          )
        );
        rendered.push({ index: i, blob, url: URL.createObjectURL(blob) });
        page.cleanup();
      }
      await task.destroy();
      setPages(rendered);
      setBusy(false);
      setProgress("");
      setMsg(`Rendered ${n} pages — download individually or as a ZIP`);
    } catch (e) {
      setBusy(false);
      setProgress("");
      setErr(e instanceof Error ? e.message : "PDF rendering failed. Please refresh and try again.");
    }
  }, [file, totalPages, format, quality, scaleNum, cleanupPages]);

  const downloadSingle = useCallback((p: RenderedPage) => {
    downloadFile(`page-${p.index}.${ext}`, p.blob, mime);
  }, [ext, mime]);

  const downloadZip = useCallback(async () => {
    if (pages.length === 0) return;
    setBusy(true);
    setProgress("Creating ZIP archive...");
    try {
      const { zipSync } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      for (const p of pages) {
        files[`page-${p.index}.${ext}`] = new Uint8Array(await p.blob.arrayBuffer());
      }
      const zipped = zipSync(files);
      downloadFile("pdf-images.zip", zipped as unknown as BlobPart, "application/zip");
      setBusy(false);
      setProgress("");
      setMsg("ZIP download started");
    } catch (e) {
      setBusy(false);
      setProgress("");
      setErr(e instanceof Error ? e.message : "Failed to create ZIP archive.");
    }
  }, [pages, ext]);

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="PDF to Image" subtitle="Render every page to JPG/PNG in the browser">
          <div className="space-y-4">
            {/* Upload */}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
            />

            {totalPages > 0 && (
              <>
                <p className="text-xs font-mono text-neutral-500">{totalPages} pages</p>

                {totalPages > 60 && (
                  <Hint kind="warn">This document has many pages ({totalPages}). Rendering may take a while — please be patient.</Hint>
                )}

                {/* Options */}
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented
                    value={format}
                    onChange={(v) => { setFormat(v); reset(); }}
                    options={[
                      { value: "jpg", label: "JPG" },
                      { value: "png", label: "PNG" },
                    ]}
                    ariaLabel="Output format"
                  />
                  <Segmented
                    value={scale}
                    onChange={(v) => { setScale(v); reset(); }}
                    options={[
                      { value: "1x", label: "1x" },
                      { value: "2x", label: "2x" },
                      { value: "3x", label: "3x" },
                    ]}
                    ariaLabel="Resolution"
                  />
                  {format === "jpg" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Quality</span>
                      <input
                        type="range"
                        min={0.5}
                        max={1}
                        step={0.05}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-24 accent-white"
                      />
                      <span className="text-xs font-mono text-neutral-400 tabular-nums w-8">{quality.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Render button */}
                <button
                  onClick={runRender}
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
                >
                  {busy ? (progress || "Processing...") : "Render All Pages"}
                </button>
              </>
            )}

            {/* Thumbnail grid */}
            {pages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-neutral-500">{pages.length} pages rendered</p>
                  <button
                    onClick={downloadZip}
                    disabled={busy}
                    className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-medium disabled:opacity-40"
                  >
                    {busy ? "Zipping..." : "Download ZIP"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {pages.map((p) => (
                    <div key={p.index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <img src={p.url} alt={`Page ${p.index}`} className="w-full aspect-[3/4] object-contain bg-black/20" />
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-500">P{p.index}</span>
                        <button
                          onClick={() => downloadSingle(p)}
                          className="text-[10px] font-mono text-blue-400 hover:text-blue-300"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
          {progress && busy && <p className="text-xs font-mono text-neutral-400 mt-3">{progress}</p>}
        </SectionCard>

        <Hint>
          Uses pdf.js to render locally in the browser — no files are uploaded.
          JPG output automatically fills a white background to prevent transparent areas from turning black.
          For large documents, lower the resolution to speed up rendering.
        </Hint>
      </div>
    </div>
  );
}
