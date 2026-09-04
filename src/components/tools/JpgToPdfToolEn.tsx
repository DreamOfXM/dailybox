"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { Hint, NumberInput, PageHeader, SectionCard, Segmented, downloadFile } from "@/components/ui";
import { imagesToPdf } from "@/lib/pdf";

const seo = findToolEn("jpgtopdf")!;

interface ImageEntry {
  id: number;
  file: File;
  url: string;
  supported: boolean;
}

/** Map Chinese error messages from pdf.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/请先选择至少一张图片/.test(msg)) return "Please select at least one image first.";
  if (/无法解析/.test(msg)) return msg.replace(/第 (\d+) 张图片无法解析（仅支持标准 JPG\/PNG）/, "Image $1 cannot be parsed (only standard JPG/PNG supported)");
  if (/图片转 PDF 失败/.test(msg)) return "Failed to convert images to PDF.";
  if (/加密/.test(msg)) return "This PDF is encrypted and cannot be processed.";
  if (/不是有效的 PDF|已损坏|Invalid PDF/i.test(msg)) return "The file is not a valid PDF or may be corrupted.";
  return msg;
}

let nextId = 0;

export default function JpgToPdfToolEn() {
  const [items, setItems] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4">("fit");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<string>("0");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      for (const it of items) URL.revokeObjectURL(it.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setMsg("");
    setErr("");
  };

  const onFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    reset();
    const newItems: ImageEntry[] = Array.from(e.target.files).map((file) => {
      const supported = file.type === "image/jpeg" || file.type === "image/png";
      return { id: ++nextId, file, url: URL.createObjectURL(file), supported };
    });
    setItems((prev) => [...prev, ...newItems]);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((it) => it.id !== id);
    });
    reset();
  }, []);

  const moveItem = useCallback((id: number, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const hasUnsupported = items.some((it) => !it.supported);
  const supportedCount = items.filter((it) => it.supported).length;

  const runConvert = useCallback(async () => {
    if (supportedCount === 0) return;
    setBusy(true);
    reset();
    setMsg("Generating PDF...");
    try {
      const supported = items.filter((it) => it.supported);
      const images = await Promise.all(
        supported.map(async (it) => ({
          bytes: await it.file.arrayBuffer(),
          type: (it.file.type === "image/png" ? "png" : "jpg") as "png" | "jpg",
        }))
      );
      const marginNum = Number(margin) || 0;
      const r = await imagesToPdf(images, {
        pageSize,
        orientation: pageSize === "a4" ? orientation : undefined,
        margin: pageSize === "a4" ? marginNum : undefined,
      });
      setBusy(false);
      if (!r.ok) {
        setMsg("");
        return setErr(enMsg(r.message));
      }
      downloadFile("images.pdf", r.value as unknown as BlobPart, "application/pdf");
      const kb = (r.value.byteLength / 1024).toFixed(0);
      setMsg(`PDF generated (${kb} KB, ${supported.length} pages) — download started`);
    } catch (e) {
      setBusy(false);
      setMsg("");
      setErr(e instanceof Error ? enMsg(e.message) : "Failed to generate PDF.");
    }
  }, [items, pageSize, orientation, margin, supportedCount]);

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard title="Image to PDF" subtitle="Combine multiple JPG/PNG images into one PDF in order">
          <div className="space-y-4">
            {/* Upload */}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={onFiles}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
            />

            {/* Image list */}
            {items.length > 0 && (
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li
                    key={it.id}
                    className={`flex items-center gap-3 p-2 rounded-xl border ${
                      it.supported ? "border-white/[0.06] bg-white/[0.02]" : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    <img
                      src={it.url}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg shrink-0 bg-black/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-neutral-300 truncate">{it.file.name}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{(it.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {!it.supported && (
                      <span className="text-[10px] font-mono text-red-400 shrink-0 max-w-[180px] leading-tight">
                        Only JPG/PNG supported. Use the Image Compress &amp; Convert tool to convert first.
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(it.id, -1)}
                        disabled={idx === 0}
                        className="px-1.5 py-1 text-[10px] font-mono rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
                      >
                        Move Up
                      </button>
                      <button
                        onClick={() => moveItem(it.id, 1)}
                        disabled={idx === items.length - 1}
                        className="px-1.5 py-1 text-[10px] font-mono rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"
                      >
                        Move Down
                      </button>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="px-1.5 py-1 text-[10px] font-mono rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Options */}
            {items.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Segmented
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); reset(); }}
                  options={[
                    { value: "fit", label: "Fit Original" },
                    { value: "a4", label: "Uniform A4" },
                  ]}
                  ariaLabel="Page size"
                />
                {pageSize === "a4" && (
                  <>
                    <Segmented
                      value={orientation}
                      onChange={(v) => { setOrientation(v); reset(); }}
                      options={[
                        { value: "auto", label: "Auto" },
                        { value: "portrait", label: "Portrait" },
                        { value: "landscape", label: "Landscape" },
                      ]}
                      ariaLabel="Orientation"
                    />
                    <NumberInput
                      value={margin}
                      onChange={(v) => { setMargin(v); reset(); }}
                      placeholder="0"
                      suffix="pt"
                      className="w-28"
                    />
                  </>
                )}
              </div>
            )}

            {/* Action */}
            <button
              onClick={runConvert}
              disabled={supportedCount === 0 || busy}
              className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? "Generating..." : "Generate & Download PDF"}
            </button>
          </div>

          {hasUnsupported && (
            <Hint kind="warn">Some images in the list are in unsupported formats and will be excluded. Use the Image Compress &amp; Convert tool to convert them to JPG or PNG first.</Hint>
          )}
          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
        </SectionCard>

        <Hint>
          All processing runs locally in the browser — no images are uploaded.
          Supported formats: JPG and PNG. For other formats, use the Image Compress &amp; Convert tool first.
        </Hint>
      </div>
    </div>
  );
}
