"use client";

import { useCallback, useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { Field, Hint, NumberInput, PageHeader, SectionCard, Segmented, Toggle, downloadFile } from "@/components/ui";
import { addImageWatermark, addTextWatermark, readPdfMeta } from "@/lib/pdf";

const seo = findToolEn("pdfwatermark")!;

type WmMode = "text" | "image";
type TextPos = "center" | "tile";
type ImgPos = "center" | "bottomRight" | "tile";
type PageScope = "all" | "first" | "custom";

const ASCII_RE = /^[\x20-\x7E]*$/;

function parsePageList(raw: string, total: number): { indices: number[]; error?: string } {
  const parts = raw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { indices: [], error: "Enter page numbers, e.g. 1,3,5" };
  const out: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 1 || n > total) return { indices: [], error: `Page ${p} out of range (${total} pages total)` };
    out.push(n - 1);
  }
  return { indices: Array.from(new Set(out)).sort((a, b) => a - b) };
}

/** Map Chinese error messages from pdf.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/加密/.test(msg)) return "This PDF is encrypted and cannot be processed. Please decrypt it first.";
  if (/不支持中文|WinAnsi|cannot be encoded/i.test(msg)) return "Built-in font does not support CJK characters. Use ASCII text or switch to Image Watermark mode.";
  if (/不是有效的 PDF|已损坏|Invalid PDF/i.test(msg)) return "The file is not a valid PDF or may be corrupted.";
  if (/无法读取/.test(msg)) return "Unable to read the PDF.";
  if (/水印文字不能为空/.test(msg)) return "Watermark text cannot be empty.";
  if (/超出范围/.test(msg)) return msg.replace(/页码 (\d+) 超出范围（共 (\d+) 页）/, "Page $1 out of range (document has $2 pages)");
  if (/加水印失败/.test(msg)) return "Failed to add text watermark.";
  if (/加图片水印失败/.test(msg)) return "Failed to add image watermark.";
  return msg;
}

export default function PdfWatermarkToolEn() {
  /* ---- upload state ---- */
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);

  /* ---- mode ---- */
  const [mode, setMode] = useState<WmMode>("text");

  /* ---- text watermark opts ---- */
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState("60");
  const [color, setColor] = useState("#999999");
  const [opacity, setOpacity] = useState(0.18);
  const [angle, setAngle] = useState("45");
  const [bold, setBold] = useState(false);
  const [textPos, setTextPos] = useState<TextPos>("center");
  const [tileGapX, setTileGapX] = useState("200");
  const [tileGapY, setTileGapY] = useState("160");

  /* ---- image watermark opts ---- */
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgBytes, setImgBytes] = useState<Uint8Array | null>(null);
  const [imgType, setImgType] = useState<"png" | "jpg">("png");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState("150");
  const [imgOpacity, setImgOpacity] = useState(0.25);
  const [imgAngle, setImgAngle] = useState("0");
  const [imgPos, setImgPos] = useState<ImgPos>("center");
  const [imgMargin, setImgMargin] = useState("36");
  const [imgTileGapX, setImgTileGapX] = useState("200");
  const [imgTileGapY, setImgTileGapY] = useState("160");

  /* ---- page scope ---- */
  const [pageScope, setPageScope] = useState<PageScope>("all");
  const [customPages, setCustomPages] = useState("");

  /* ---- status ---- */
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reset = () => { setMsg(""); setErr(""); };

  /* ---- file upload ---- */
  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    reset();
    const buf = await f.arrayBuffer();
    const u8 = new Uint8Array(buf);
    setBytes(u8);
    const meta = await readPdfMeta(buf);
    if (meta.ok) setPageCount(meta.value.pageCount);
    else setErr("Could not read PDF metadata. Please check the file.");
  }, []);

  /* ---- image upload ---- */
  const onImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    reset();
    if (f.type !== "image/png" && f.type !== "image/jpeg") {
      setImgFile(null);
      setImgBytes(null);
      setImgPreview(null);
      setErr("Only JPG and PNG images are supported. Use the Image Compress & Convert tool to convert other formats first.");
      return;
    }
    setImgFile(f);
    setImgType(f.type === "image/png" ? "png" : "jpg");
    const buf = await f.arrayBuffer();
    setImgBytes(new Uint8Array(buf));
    setImgPreview(URL.createObjectURL(f));
  }, []);

  /* ---- non-ASCII warning ---- */
  const hasNonAscii = !ASCII_RE.test(text);

  /* ---- page indices ---- */
  const parsedPages = useMemo(() => {
    if (pageScope === "all") return { indices: undefined as number[] | undefined, error: undefined };
    if (pageScope === "first") return { indices: [0] as number[] | undefined, error: undefined };
    if (!pageCount) return { indices: undefined as number[] | undefined, error: undefined };
    const r = parsePageList(customPages, pageCount);
    if (r.error) return { indices: undefined as number[] | undefined, error: r.error };
    return { indices: r.indices, error: undefined };
  }, [pageScope, customPages, pageCount]);

  /* ---- can download ---- */
  const canDownload = !!bytes && !busy && !parsedPages.error && (
    mode === "text" ? text.trim().length > 0 : !!imgBytes
  );

  /* ---- download handler ---- */
  const run = useCallback(async () => {
    if (!bytes || !canDownload) return;
    setBusy(true);
    reset();
    const pageIndices = parsedPages.indices;

    if (mode === "text") {
      const r = await addTextWatermark(bytes, {
        text,
        fontSize: Number(fontSize) || 60,
        color,
        opacity,
        angle: Number(angle) || 0,
        bold,
        position: textPos,
        tileGapX: textPos === "tile" ? (Number(tileGapX) || 200) : undefined,
        tileGapY: textPos === "tile" ? (Number(tileGapY) || 160) : undefined,
        pageIndices,
      });
      setBusy(false);
      if (!r.ok) return setErr(enMsg(r.message));
      downloadFile("watermarked.pdf", r.value as unknown as BlobPart, "application/pdf");
      setMsg(`Text watermark added (${(r.value.byteLength / 1024).toFixed(0)} KB) — download started`);
    } else {
      if (!imgBytes) return;
      const r = await addImageWatermark(bytes, {
        image: imgBytes,
        imageType: imgType,
        width: Number(imgWidth) || 150,
        opacity: imgOpacity,
        angle: Number(imgAngle) || 0,
        position: imgPos,
        margin: imgPos === "bottomRight" ? (Number(imgMargin) || 36) : undefined,
        tileGapX: imgPos === "tile" ? (Number(imgTileGapX) || 200) : undefined,
        tileGapY: imgPos === "tile" ? (Number(imgTileGapY) || 160) : undefined,
        pageIndices,
      });
      setBusy(false);
      if (!r.ok) return setErr(enMsg(r.message));
      downloadFile("watermarked.pdf", r.value as unknown as BlobPart, "application/pdf");
      setMsg(`Image watermark added (${(r.value.byteLength / 1024).toFixed(0)} KB) — download started`);
    }
  }, [bytes, canDownload, parsedPages, mode, text, fontSize, color, opacity, angle, bold, textPos, tileGapX, tileGapY, imgBytes, imgType, imgWidth, imgOpacity, imgAngle, imgPos, imgMargin, imgTileGapX, imgTileGapY]);

  /* ---- live preview helpers ---- */
  const previewLabel = mode === "text" ? (text || "WATERMARK") : "";
  const previewAngle = mode === "text" ? (Number(angle) || 0) : (Number(imgAngle) || 0);
  const previewOpacity = mode === "text" ? opacity : imgOpacity;
  const previewPos = mode === "text" ? textPos : imgPos;

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        {/* Upload */}
        <SectionCard title="Upload PDF" subtitle="Runs entirely in your browser — files never upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
          />
          {file && pageCount > 0 && (
            <p className="mt-2 text-xs font-mono text-neutral-500">
              {file.name} · {(file.size / 1024).toFixed(0)} KB · {pageCount} pages
            </p>
          )}
        </SectionCard>

        {bytes && pageCount > 0 && (
          <>
            {/* Mode switch */}
            <SectionCard
              title="Watermark Settings"
              aside={
                <Segmented
                  value={mode}
                  onChange={(v) => { setMode(v); reset(); }}
                  options={[
                    { value: "text", label: "Text Watermark" },
                    { value: "image", label: "Image Watermark" },
                  ]}
                  ariaLabel="Watermark mode"
                />
              }
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Controls column */}
                <div className="space-y-4">
                  {mode === "text" ? (
                    <>
                      <Field label="Watermark Text">
                        <input
                          value={text}
                          onChange={(e) => { setText(e.target.value); reset(); }}
                          placeholder="CONFIDENTIAL"
                          className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                        />
                      </Field>
                      {hasNonAscii && (
                        <Hint kind="warn">
                          The built-in font does not support non-Latin characters. Text watermarks support Latin letters, digits, and symbols only. For logos or stamps, switch to Image Watermark mode.
                        </Hint>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Font Size">
                          <NumberInput value={fontSize} onChange={setFontSize} suffix="pt" />
                        </Field>
                        <Field label="Rotation">
                          <NumberInput value={angle} onChange={setAngle} suffix="°" />
                        </Field>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[0, 45, 90, -45].map((a) => (
                          <button
                            key={a}
                            onClick={() => setAngle(String(a))}
                            className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors ${
                              Number(angle) === a
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/[0.06] text-neutral-500 hover:text-white"
                            }`}
                          >
                            {a}°
                          </button>
                        ))}
                      </div>
                      <Field label="Color">
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
                      <Field label={`Opacity ${(opacity * 100).toFixed(0)}%`}>
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
                      <Toggle checked={bold} onChange={setBold} label="Bold" />
                      <Field label="Position">
                        <Segmented
                          value={textPos}
                          onChange={setTextPos}
                          options={[
                            { value: "center", label: "Center" },
                            { value: "tile", label: "Tile" },
                          ]}
                          ariaLabel="Text position"
                        />
                      </Field>
                      {textPos === "tile" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Horizontal Gap">
                            <NumberInput value={tileGapX} onChange={setTileGapX} suffix="pt" />
                          </Field>
                          <Field label="Vertical Gap">
                            <NumberInput value={tileGapY} onChange={setTileGapY} suffix="pt" />
                          </Field>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Field label="Watermark Image">
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={onImage}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
                        />
                      </Field>
                      {imgPreview && (
                        <div className="flex items-center gap-3">
                          <img src={imgPreview} alt="Preview" className="h-16 w-auto rounded-lg border border-white/[0.06]" />
                          <span className="text-xs font-mono text-neutral-500">{imgFile?.name}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Width">
                          <NumberInput value={imgWidth} onChange={setImgWidth} suffix="pt" />
                        </Field>
                        <Field label="Rotation">
                          <NumberInput value={imgAngle} onChange={setImgAngle} suffix="°" />
                        </Field>
                      </div>
                      <Field label={`Opacity ${(imgOpacity * 100).toFixed(0)}%`}>
                        <input
                          type="range"
                          min={0.02}
                          max={1}
                          step={0.01}
                          value={imgOpacity}
                          onChange={(e) => setImgOpacity(Number(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </Field>
                      <Field label="Position">
                        <Segmented
                          value={imgPos}
                          onChange={setImgPos}
                          options={[
                            { value: "center", label: "Center" },
                            { value: "bottomRight", label: "Bottom Right" },
                            { value: "tile", label: "Tile" },
                          ]}
                          ariaLabel="Image position"
                        />
                      </Field>
                      {imgPos === "bottomRight" && (
                        <Field label="Margin">
                          <NumberInput value={imgMargin} onChange={setImgMargin} suffix="pt" />
                        </Field>
                      )}
                      {imgPos === "tile" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Horizontal Gap">
                            <NumberInput value={imgTileGapX} onChange={setImgTileGapX} suffix="pt" />
                          </Field>
                          <Field label="Vertical Gap">
                            <NumberInput value={imgTileGapY} onChange={setImgTileGapY} suffix="pt" />
                          </Field>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Live CSS Preview column */}
                <div className="flex flex-col items-center justify-start">
                  <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider mb-2">Live Preview</p>
                  <div
                    className="relative border border-white/[0.08] bg-white/[0.02] rounded-lg overflow-hidden"
                    style={{ width: 200, height: 283 }}
                  >
                    {mode === "text" && text.trim() ? (
                      previewPos === "tile" ? (
                        <div className="absolute inset-0 overflow-hidden">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <span
                              key={i}
                              className="absolute font-mono whitespace-nowrap select-none pointer-events-none"
                              style={{
                                left: `${(i % 3) * 35}%`,
                                top: `${Math.floor(i / 3) * 45 + 10}%`,
                                transform: `rotate(${previewAngle}deg)`,
                                opacity: previewOpacity,
                                color,
                                fontSize: 10,
                                fontWeight: bold ? 700 : 400,
                              }}
                            >
                              {previewLabel}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span
                          className="absolute font-mono whitespace-nowrap select-none pointer-events-none"
                          style={{
                            left: "50%",
                            top: "50%",
                            transform: `translate(-50%, -50%) rotate(${previewAngle}deg)`,
                            opacity: previewOpacity,
                            color,
                            fontSize: 14,
                            fontWeight: bold ? 700 : 400,
                          }}
                        >
                          {previewLabel}
                        </span>
                      )
                    ) : mode === "image" && imgPreview ? (
                      previewPos === "tile" ? (
                        <div className="absolute inset-0 overflow-hidden">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <img
                              key={i}
                              src={imgPreview}
                              alt=""
                              className="absolute select-none pointer-events-none"
                              style={{
                                left: `${(i % 2) * 50}%`,
                                top: `${Math.floor(i / 2) * 50}%`,
                                width: 40,
                                opacity: previewOpacity,
                                transform: `rotate(${previewAngle}deg)`,
                              }}
                            />
                          ))}
                        </div>
                      ) : previewPos === "bottomRight" ? (
                        <img
                          src={imgPreview}
                          alt=""
                          className="absolute select-none pointer-events-none"
                          style={{
                            right: 10,
                            bottom: 10,
                            width: 40,
                            opacity: previewOpacity,
                            transform: `rotate(${previewAngle}deg)`,
                          }}
                        />
                      ) : (
                        <img
                          src={imgPreview}
                          alt=""
                          className="absolute select-none pointer-events-none"
                          style={{
                            left: "50%",
                            top: "50%",
                            transform: `translate(-50%, -50%) rotate(${previewAngle}deg)`,
                            width: 50,
                            opacity: previewOpacity,
                          }}
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-neutral-700">
                        {mode === "text" ? "Type text to preview" : "Upload an image to preview"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Page scope */}
            <SectionCard title="Page Range">
              <div className="space-y-4">
                <Segmented
                  value={pageScope}
                  onChange={(v) => { setPageScope(v); reset(); }}
                  options={[
                    { value: "all", label: "All Pages" },
                    { value: "first", label: "First Page Only" },
                    { value: "custom", label: "Custom" },
                  ]}
                  ariaLabel="Page range"
                />
                {pageScope === "custom" && (
                  <Field label="Page numbers (comma-separated)" error={parsedPages.error}>
                    <input
                      value={customPages}
                      onChange={(e) => { setCustomPages(e.target.value); reset(); }}
                      placeholder="e.g. 1,3,5"
                      className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                    />
                  </Field>
                )}
                {pageScope === "custom" && !parsedPages.error && parsedPages.indices && (
                  <p className="text-xs font-mono text-emerald-400">
                    Will process {parsedPages.indices.length} pages: {parsedPages.indices.map((i) => i + 1).join(", ")}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Download */}
            <SectionCard title="Export">
              <button
                onClick={run}
                disabled={!canDownload}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "Processing..." : "Add Watermark & Download"}
              </button>
              {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
              {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
            </SectionCard>
          </>
        )}

        <Hint>
          Text watermarks use the built-in Helvetica font and support Latin letters, digits, and common symbols only.
          For logos or stamps, use Image Watermark mode to upload a PNG/JPG image.
          All operations run locally in the browser via pdf-lib — no files are uploaded to any server.
        </Hint>
      </div>
    </div>
  );
}
