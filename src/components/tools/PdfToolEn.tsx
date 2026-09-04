"use client";

import { useCallback, useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { Hint, PageHeader, SectionCard, Segmented, downloadFile } from "@/components/ui";
import { mergePdfs, extractPages, readPdfMeta } from "@/lib/pdf";

const seo = findToolEn("pdf")!;

type Mode = "merge" | "split";

/** Parse a page-range expression like "1-3,5,8-" (1-based, inclusive) into 0-based indices. */
function parseRanges(expr: string, total: number): { indices: number[]; error?: string } {
  const parts = expr.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { indices: [], error: "Enter a page range, e.g. 1-3,5" };
  const out: number[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d*)\s*-\s*(\d*)$/) || p.match(/^(\d+)$/);
    if (!m) return { indices: [], error: `Cannot parse "${p}" — use forms like 5, 1-3, 2- or -4` };
    if (m.length === 2) {
      const n = parseInt(m[1], 10);
      if (n < 1 || n > total) return { indices: [], error: `Page ${n} out of range (document has ${total} pages)` };
      out.push(n - 1);
    } else {
      const a = m[1] ? parseInt(m[1], 10) : 1;
      const b = m[2] ? parseInt(m[2], 10) : total;
      if (a < 1 || b > total || a > b) return { indices: [], error: `Range "${p}" invalid (document has ${total} pages)` };
      for (let i = a; i <= b; i++) out.push(i - 1);
    }
  }
  return { indices: Array.from(new Set(out)).sort((x, y) => x - y) };
}

export default function PdfToolEn() {
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
    setMsg("Loading pdf-lib and merging…");
    const r = await mergePdfs(await Promise.all(files.map((f) => f.arrayBuffer())));
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    downloadFile("merged.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`Merged ${files.length} PDFs (${(r.value.byteLength / 1024).toFixed(0)} KB) — download started`);
  }, [files]);

  const runSplit = useCallback(async () => {
    if (!splitFile || parsed.error || !parsed.indices.length) return;
    setBusy(true);
    reset();
    setMsg("Extracting pages…");
    const r = await extractPages(await splitFile.arrayBuffer(), parsed.indices);
    setBusy(false);
    if (!r.ok) return setErr(r.message);
    downloadFile("split.pdf", r.value as unknown as BlobPart, "application/pdf");
    setMsg(`Extracted ${parsed.indices.length} pages (${(r.value.byteLength / 1024).toFixed(0)} KB) — download started`);
  }, [splitFile, parsed]);

  return (
    <div>
      <PageHeader badge="Files" title={seo.title} subtitle={seo.subtitle} tone="blue" />
      <div className="space-y-6">
        <SectionCard
          title="PDF Merge / Split"
          subtitle="Runs entirely in your browser — files never upload"
          aside={
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "merge", label: "Merge" },
                { value: "split", label: "Split / Extract" },
              ]}
              ariaLabel="Mode"
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
                {busy ? "Processing…" : "Merge & download"}
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
                  <p className="text-xs font-mono text-neutral-500">{splitTotal} pages · enter the page range to keep / extract</p>
                  <input
                    value={range}
                    onChange={(e) => {
                      setRange(e.target.value);
                      reset();
                    }}
                    placeholder="e.g. 1-3,5,8-"
                    className="w-full px-4 py-3 rounded-xl font-mono text-sm"
                  />
                  {range && !parsed.error && parsed.indices.length > 0 && (
                    <p className="text-xs font-mono text-emerald-400">
                      Will extract {parsed.indices.length} pages: {parsed.indices.map((i) => i + 1).join(", ")}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={runSplit}
                disabled={!splitFile || !!parsed.error || !parsed.indices.length || busy}
                className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? "Processing…" : "Extract & download"}
              </button>
            </div>
          )}

          {msg && <p className="text-xs font-mono text-emerald-400 mt-3">{msg}</p>}
          {err && <p className="text-xs font-mono text-red-400 mt-3">{err}</p>}
          {parsed.error && mode === "split" && range && <p className="text-xs font-mono text-amber-400 mt-2">{parsed.error}</p>}
        </SectionCard>

        <Hint>
          Merge concatenates the selected PDFs in order; Split / Extract pulls the pages in a range
          (<span className="font-mono">1-3,5,8-</span>) into a new file. To reorder or delete pages use the
          Chinese version&apos;s organize tool — everything runs locally via pdf-lib.
        </Hint>
      </div>
    </div>
  );
}
