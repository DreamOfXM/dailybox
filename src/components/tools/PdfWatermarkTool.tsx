"use client";

import { useCallback, useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { Field, Hint, NumberInput, PageHeader, SectionCard, Segmented, Toggle, downloadFile } from "@/components/ui";
import { addImageWatermark, addTextWatermark, readPdfMeta } from "@/lib/pdf";

const seo = findTool("pdfwatermark")!;

type WmMode = "text" | "image";
type TextPos = "center" | "tile";
type ImgPos = "center" | "bottomRight" | "tile";
type PageScope = "all" | "first" | "custom";

const ASCII_RE = /^[\x20-\x7E]*$/;

function parsePageList(raw: string, total: number): { indices: number[]; error?: string } {
  const parts = raw.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { indices: [], error: "请输入页码，如 1,3,5" };
  const out: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 1 || n > total) return { indices: [], error: `页码 ${p} 超出范围（共 ${total} 页）` };
    out.push(n - 1);
  }
  return { indices: Array.from(new Set(out)).sort((a, b) => a - b) };
}

export default function PdfWatermarkTool() {
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
    else setErr(meta.message);
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
      setErr("仅支持 JPG/PNG，其它格式请先用「图片压缩转换」工具处理");
      return;
    }
    setImgFile(f);
    setImgType(f.type === "image/png" ? "png" : "jpg");
    const buf = await f.arrayBuffer();
    setImgBytes(new Uint8Array(buf));
    setImgPreview(URL.createObjectURL(f));
  }, []);

  /* ---- CJK warning ---- */
  const hasCjk = !ASCII_RE.test(text);

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
      if (!r.ok) return setErr(r.message);
      downloadFile("watermarked.pdf", r.value as unknown as BlobPart, "application/pdf");
      setMsg(`已添加文字水印（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
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
      if (!r.ok) return setErr(r.message);
      downloadFile("watermarked.pdf", r.value as unknown as BlobPart, "application/pdf");
      setMsg(`已添加图片水印（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
    }
  }, [bytes, canDownload, parsedPages, mode, text, fontSize, color, opacity, angle, bold, textPos, tileGapX, tileGapY, imgBytes, imgType, imgWidth, imgOpacity, imgAngle, imgPos, imgMargin, imgTileGapX, imgTileGapY]);

  /* ---- live preview helpers ---- */
  const previewLabel = mode === "text" ? (text || "WATERMARK") : "";
  const previewAngle = mode === "text" ? (Number(angle) || 0) : (Number(imgAngle) || 0);
  const previewOpacity = mode === "text" ? opacity : imgOpacity;
  const previewPos = mode === "text" ? textPos : imgPos;

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
            {/* Mode switch */}
            <SectionCard
              title="水印设置"
              aside={
                <Segmented
                  value={mode}
                  onChange={(v) => { setMode(v); reset(); }}
                  options={[
                    { value: "text", label: "文字水印" },
                    { value: "image", label: "图片水印" },
                  ]}
                  ariaLabel="水印模式"
                />
              }
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Controls column */}
                <div className="space-y-4">
                  {mode === "text" ? (
                    <>
                      <Field label="水印文字">
                        <input
                          value={text}
                          onChange={(e) => { setText(e.target.value); reset(); }}
                          placeholder="CONFIDENTIAL"
                          className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                        />
                      </Field>
                      {hasCjk && (
                        <Hint kind="warn">
                          内置字体不支持中文，中文水印请切换到「图片水印」上传印章/logo 图；文字水印支持英文、数字与符号。
                        </Hint>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="字号">
                          <NumberInput value={fontSize} onChange={setFontSize} suffix="pt" />
                        </Field>
                        <Field label="旋转角">
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
                      <Field label="位置">
                        <Segmented
                          value={textPos}
                          onChange={setTextPos}
                          options={[
                            { value: "center", label: "居中" },
                            { value: "tile", label: "平铺" },
                          ]}
                          ariaLabel="文字位置"
                        />
                      </Field>
                      {textPos === "tile" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="水平间距">
                            <NumberInput value={tileGapX} onChange={setTileGapX} suffix="pt" />
                          </Field>
                          <Field label="垂直间距">
                            <NumberInput value={tileGapY} onChange={setTileGapY} suffix="pt" />
                          </Field>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Field label="水印图片">
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={onImage}
                          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
                        />
                      </Field>
                      {imgPreview && (
                        <div className="flex items-center gap-3">
                          <img src={imgPreview} alt="预览" className="h-16 w-auto rounded-lg border border-white/[0.06]" />
                          <span className="text-xs font-mono text-neutral-500">{imgFile?.name}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="宽度">
                          <NumberInput value={imgWidth} onChange={setImgWidth} suffix="pt" />
                        </Field>
                        <Field label="旋转角">
                          <NumberInput value={imgAngle} onChange={setImgAngle} suffix="°" />
                        </Field>
                      </div>
                      <Field label={`不透明度 ${(imgOpacity * 100).toFixed(0)}%`}>
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
                      <Field label="位置">
                        <Segmented
                          value={imgPos}
                          onChange={setImgPos}
                          options={[
                            { value: "center", label: "居中" },
                            { value: "bottomRight", label: "右下角" },
                            { value: "tile", label: "平铺" },
                          ]}
                          ariaLabel="图片位置"
                        />
                      </Field>
                      {imgPos === "bottomRight" && (
                        <Field label="边距">
                          <NumberInput value={imgMargin} onChange={setImgMargin} suffix="pt" />
                        </Field>
                      )}
                      {imgPos === "tile" && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="水平间距">
                            <NumberInput value={imgTileGapX} onChange={setImgTileGapX} suffix="pt" />
                          </Field>
                          <Field label="垂直间距">
                            <NumberInput value={imgTileGapY} onChange={setImgTileGapY} suffix="pt" />
                          </Field>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Live CSS Preview column */}
                <div className="flex flex-col items-center justify-start">
                  <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider mb-2">实时预览</p>
                  <div
                    className="relative border border-white/[0.08] bg-white/[0.02] rounded-lg overflow-hidden"
                    style={{ width: 200, height: 283 }}
                  >
                    {mode === "text" && text.trim() ? (
                      previewPos === "tile" ? (
                        /* tile preview: repeat text */
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
                        /* center preview */
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
                        {mode === "text" ? "输入文字预览" : "上传图片预览"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Page scope */}
            <SectionCard title="页面范围">
              <div className="space-y-4">
                <Segmented
                  value={pageScope}
                  onChange={(v) => { setPageScope(v); reset(); }}
                  options={[
                    { value: "all", label: "全部页" },
                    { value: "first", label: "仅首页" },
                    { value: "custom", label: "自定义" },
                  ]}
                  ariaLabel="页面范围"
                />
                {pageScope === "custom" && (
                  <Field label="页码（逗号分隔）" error={parsedPages.error}>
                    <input
                      value={customPages}
                      onChange={(e) => { setCustomPages(e.target.value); reset(); }}
                      placeholder="如 1,3,5"
                      className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                    />
                  </Field>
                )}
                {pageScope === "custom" && !parsedPages.error && parsedPages.indices && (
                  <p className="text-xs font-mono text-emerald-400">
                    将处理 {parsedPages.indices.length} 页：{parsedPages.indices.map((i) => i + 1).join(", ")}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Download */}
            <SectionCard title="导出">
              <button
                onClick={run}
                disabled={!canDownload}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "处理中…" : "添加水印并下载"}
              </button>
              {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
              {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
            </SectionCard>
          </>
        )}

        <Hint>
          文字水印使用内置 Helvetica 字体，仅支持英文、数字与常见符号；中文 logo/印章请使用「图片水印」模式上传 PNG/JPG。
          所有操作基于 pdf-lib 在浏览器本地完成，文件不会上传到任何服务器。
        </Hint>
      </div>
    </div>
  );
}
