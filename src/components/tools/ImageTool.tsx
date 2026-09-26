"use client";

import { useCallback, useState } from "react";
import { findTool } from "@/lib/seo";
import { Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findTool("image")!;

type OutFormat = "jpeg" | "png" | "webp";

export default function ImageTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutFormat>("jpeg");
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [results, setResults] = useState<{ name: string; url: string; size: number; origSize: number }[]>([]);
  const [processing, setProcessing] = useState(false);

  const onFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
    setResults([]);
  }, []);

  const process = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    const out: typeof results = [];
    for (const file of files) {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("load fail"));
        img.src = url;
      });
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      // fill white for jpeg
      if (format === "jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, quality));
      URL.revokeObjectURL(url);
      if (!blob) continue;
      const outUrl = URL.createObjectURL(blob);
      out.push({ name: file.name.replace(/\.[^.]+$/, "") + "." + format, url: outUrl, size: blob.size, origSize: file.size });
    }
    setResults(out);
    setProcessing(false);
  }, [files, format, quality, maxWidth]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="emerald" />
      <div className="space-y-6">
        <SectionCard title="上传图片" subtitle="JPG/PNG/WebP 批量，本地 Canvas 压缩不上传">
          <input type="file" accept="image/*" multiple onChange={onFiles} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-surface file:text-sm file:text-ink hover:file:bg-surface2" />
          {files.length > 0 && <p className="text-xs font-mono text-ink3 mt-2">已选 {files.length} 张，共 {(files.reduce((a, f) => a + f.size, 0) / 1024).toFixed(0)} KB</p>}
          <div className="flex flex-wrap gap-4 mt-4">
            <Segmented value={format} onChange={setFormat} options={[{ value: "jpeg", label: "JPEG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WebP" }]} ariaLabel="输出格式" />
            <label className="flex items-center gap-2 text-xs font-mono text-ink2">质量 <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} /> {Math.round(quality * 100)}%</label>
            <label className="flex items-center gap-2 text-xs font-mono text-ink2">最大宽 <input type="number" value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value) || 1920)} className="w-20 px-2 py-1 rounded bg-surface border border-line" />px</label>
          </div>
          <button onClick={process} disabled={!files.length || processing} className="mt-4 px-5 py-2 rounded-xl bg-acc text-white text-sm font-medium disabled:opacity-40 hover:bg-ground2">{processing ? "处理中…" : "开始压缩转换"}</button>
          <Hint>全部在浏览器 Canvas 完成，适合电商配图、博客图床，批量一次可几十张。</Hint>
        </SectionCard>
        {results.length > 0 && (
          <SectionCard title="结果" subtitle={`${results.length} 张已生成，点击下载`} count={results.length}>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{r.name}</div>
                    <div className="text-xs font-mono text-ink3">{(r.origSize / 1024).toFixed(0)}KB → {(r.size / 1024).toFixed(0)}KB {r.size < r.origSize ? `省 ${(((r.origSize - r.size) / r.origSize) * 100).toFixed(0)}%` : ""}</div>
                  </div>
                  <a href={r.url} download={r.name} className="shrink-0 px-3 py-1.5 rounded-lg bg-acc text-white text-xs">下载</a>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
