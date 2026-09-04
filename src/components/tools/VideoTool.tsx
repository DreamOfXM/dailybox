"use client";

import { useCallback, useState } from "react";
import { findTool } from "@/lib/seo";
import { Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findTool("video")!;

export default function VideoTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outName, setOutName] = useState("");

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setOutUrl(null);
    setMsg("");
  }, []);

  const transcode = useCallback(async (target: "mp4" | "webm") => {
    if (!file) return;
    setBusy(true);
    setMsg("懒加载 ffmpeg.wasm (~25MB)…");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => setMsg(message.slice(0, 80)));
      await ffmpeg.load();
      const inName = "input." + (file.name.split(".").pop() || "mp4");
      const out = `output.${target}`;
      await ffmpeg.writeFile(inName, await fetchFile(file));
      // 压缩到 720p, 1M 码率
      await ffmpeg.exec(["-i", inName, "-vf", "scale=-2:720", "-b:v", "1M", "-b:a", "128k", out]);
      const data = await ffmpeg.readFile(out);
      const blob = new Blob([data as unknown as BlobPart], { type: target === "webm" ? "video/webm" : "video/mp4" });
      setOutUrl(URL.createObjectURL(blob));
      setOutName(file.name.replace(/\.[^.]+$/, "") + "." + target);
      setMsg(`已生成 ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [file]);

  return (
    <div>
      <PageHeader badge="文件" title={seo.title} subtitle={seo.subtitle} tone="amber" />
      <div className="space-y-6">
        <SectionCard title="视频压缩转码" subtitle="MP4↔WebM，ffmpeg.wasm 本地 720p/1M，随用随加载">
          <input type="file" accept="video/*" onChange={onFile} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white/[0.06] file:text-sm file:text-white hover:file:bg-white/[0.1]" />
          {file && <p className="text-xs font-mono text-neutral-500 mt-2">{file.name} {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => transcode("mp4")} disabled={!file || busy} className="px-4 py-2 rounded-xl bg-white text-black text-sm disabled:opacity-40">压为 MP4</button>
            <button onClick={() => transcode("webm")} disabled={!file || busy} className="px-4 py-2 rounded-xl bg-white/[0.06] text-white text-sm disabled:opacity-40">转 WebM</button>
          </div>
          {msg && <p className="text-xs font-mono text-neutral-400 mt-2 break-all">{msg}</p>}
          {outUrl && <a href={outUrl} download={outName} className="inline-flex mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm">下载 {outName}</a>}
          <Hint>首次转码会下载 ffmpeg 核心，二次秒开；大文件建议先切 1 分钟片段试效果。</Hint>
        </SectionCard>
      </div>
    </div>
  );
}
