"use client";

import { useCallback, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("pdf")!;

export default function PdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const onFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
    setDownloadUrl(null);
    setMsg("");
  }, []);

  const merge = useCallback(async () => {
    if (!files.length) return;
    setBusy(true);
    setMsg("Load pdf-lib…");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const src = await PDFDocument.load(buf);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      setMsg(`Merge ${files.length} ENFiles，total ${merged.getPageCount()} pages…`);
      const bytes = await merged.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setMsg(`Generated ${(blob.size / 1024).toFixed(0)} KB`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [files]);

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="Merge PDFs" subtitle="Select PDFs, merge locally with pdf-lib">
          <input type="file" accept="application/pdf" multiple onChange={onFiles} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-sm file:text-white hover:file:bg-white/[0.1]" />
          {files.length > 0 && <p className="text-xs font-mono text-neutral-500 mt-2">Selected {files.length} PDFs</p>}
          <button onClick={merge} disabled={!files.length || busy} className="mt-4 px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? "Processing…" : "MergeENDownload"}</button>
          {msg && <p className="text-xs font-mono text-emerald-400 mt-2">{msg}</p>}
          {downloadUrl && <a href={downloadUrl} download="merged.pdf" className="inline-flex mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm">Download merged.pdf</a>}
          <Hint>Split/compress/encrypt coming, merge covers 80% needs, WASM local.</Hint>
        </SectionCard>
      </div>
    </div>
  );
}
