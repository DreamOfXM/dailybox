"use client";

import { useCallback, useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { Hint, PageHeader, SectionCard, Segmented, downloadFile } from "@/components/ui";
import { mergePdfs, extractPages, readPdfMeta } from "@/lib/pdf";

const seo = findTool("pdf")!;

type Mode = "merge" | "split";

/** 解析 "1-3,5,8-" 这类页码范围表达式（1-based，含端点）→ 0-based 索引数组 */
function parseRanges(expr: string, total: number): { indices: number[]; error?: string } {
  const parts = expr.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { indices: [], error: "请输入页码范围，如 1-3,5" };
  const out: number[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d*)\s*-\s*(\d*)$/) || p.match(/^(\d+)$/);
    if (!m) return { indices: [], error: `无法识别「${p}」，请用 5、1-3、2- 或 -4 形式` };
    if (m.length === 2) {
      const n = parseInt(m[1], 10);
      if (n < 1 || n > total) return { indices: [], error: `页码 ${n} 超出范围（共 ${total} 页）` };
      out.push(n - 1);
    } else {
      const a = m[1] ? parseInt(m[1], 10) : 1;
      const b = m[2] ? parseInt(m[2], 10) : total;
      if (a < 1 || b > total || a > b) return { indices: [], error: `范围「${p}」无效（共 ${total} 页）` };
      for (let i = a; i <= b; i++) out.push(i - 1);
    }
  }
  return { indices: Array.from(new Set(out)).sort((x, y) => x - y) };
}

export default function PdfTool() {
  const [mode, setMode] = useState<Mode>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotal, setSplitTotal] = useState(0);
  const [range, setRange] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reset = () => {
    setMsg("");
    setErr("");
  };

  const onMergeFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
    reset();
  }, []);

  const onSplitFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSplitFile(f);
    setSplitTotal(0);
    reset();
    if (!f) return;
    const meta = await readPdfMeta(await f.arrayBuffer());
    if (meta.ok) setSplitTotal(meta.value.pageCount);
    else setErr(meta.message);
  }, []);

  const parsed = useMemo(() => (splitTotal ? parseRanges(range, splitTotal) : { indices: [] }), [range, splitTotal]);

  const runMerge = useCallback(async () => {
    if (!files.length) return;
    setBusy(true);
    reset();
    setMsg("加载 pdf-lib 并合并中…");
    const r = await mergePdfs(await Promise.all(files.map((f) => f.arrayBuffer())));
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    downloadFile("merged.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`已合并 ${files.length} 个 PDF（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
  }, [files]);

  const runSplit = useCallback(async () => {
    if (!splitFile || parsed.error || !parsed.indices.length) return;
    setBusy(true);
    reset();
    setMsg("抽取页面中…");
    const r = await extractPages(await splitFile.arrayBuffer(), parsed.indices);
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    downloadFile("split.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`已抽取 ${parsed.indices.length} 页（${(r.value.byteLength / 1024).toFixed(0)} KB），已开始下载`);
  }, [splitFile, parsed]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard
          title="PDF 合并 / 拆分"
          subtitle="纯浏览器本地运算，文件不上传"
          aside={
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "merge", label: "合并" },
                { value: "split", label: "拆分抽取" },
              ]}
              ariaLabel="模式"
            />
          }
        >
          {mode === "merge" ? (
            <div className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={onMergeFiles}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
              />
              {files.length > 0 && (
                <ol className="text-xs font-mono text-neutral-500 space-y-1">
                  {files.map((f, i) => (
                    <li key={i}>
                      {i + 1}. {f.name} <span className="text-neutral-700">· {(f.size / 1024).toFixed(0)} KB</span>
                    </li>
                  ))}
                </ol>
              )}
              <button
                onClick={runMerge}
                disabled={!files.length || busy}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "处理中…" : "合并并下载"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={onSplitFile}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.1]"
              />
              {splitTotal > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-neutral-500">共 {splitTotal} 页 · 输入要保留/抽取的页码范围</p>
                  <input
                    value={range}
                    onChange={(e) => {
                      setRange(e.target.value);
                      reset();
                    }}
                    placeholder="如 1-3,5,8-"
                    className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                  />
                  {range && !parsed.error && parsed.indices.length > 0 && (
                    <p className="text-xs font-mono text-emerald-400">
                      将抽取 {parsed.indices.length} 页：{parsed.indices.map((i) => i + 1).join(", ")}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={runSplit}
                disabled={!splitFile || !!parsed.error || !parsed.indices.length || busy}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "处理中…" : "抽取并下载"}
              </button>
            </div>
          )}

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
          {parsed.error && mode === "split" && range && <p className="text-xs font-mono text-amber-400 mt-2">{parsed.error}</p>}
        </SectionCard>

        <Hint>
          合并会把多个 PDF 按选择顺序拼成一个；拆分抽取按页码范围（<span className="font-mono">1-3,5,8-</span>）取出指定页生成新文件。
          需要调整页面顺序、删页请用「PDF 整理页面」，全部基于 pdf-lib 本地完成。
        </Hint>
      </div>
    </div>
  );
}
