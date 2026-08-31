"use client";

import { useEffect, useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented, Toggle } from "@/components/ui";
import { md5, sha1, sha256, sha384, sha512, toBase64, toHex } from "@/lib/hash";

const seo = findTool("hash")!;

type OutFormat = "hex" | "base64";

const ALGO_ROWS = [
  { key: "md5", label: "MD5", bits: "128 bit" },
  { key: "sha1", label: "SHA-1", bits: "160 bit" },
  { key: "sha256", label: "SHA-256", bits: "256 bit" },
  { key: "sha384", label: "SHA-384", bits: "384 bit" },
  { key: "sha512", label: "SHA-512", bits: "512 bit" },
] as const;

export default function HashTool() {
  const [input, setInput] = useState("");
  const [upper, setUpper] = useState(false);
  const [format, setFormat] = useState<OutFormat>("hex");
  const [shaValues, setShaValues] = useState<Record<string, string> | null>(null);
  const [cryptoOk, setCryptoOk] = useState(true);

  /** MD5 为纯 JS 同步实现，直接 useMemo 实时算 */
  const md5Text = useMemo(() => {
    if (!input) return "";
    const bytes = md5(input);
    return format === "base64" ? toBase64(bytes) : toHex(bytes, { upper });
  }, [input, format, upper]);

  /** 输入字节数（UTF-8） */
  const byteCount = useMemo(() => new TextEncoder().encode(input).length, [input]);

  /** SHA 系列走 Web Crypto（异步）；crypto.subtle 不存在时降级提示 */
  useEffect(() => {
    if (!input) {
      setShaValues(null);
      return;
    }
    let cancelled = false;
    setShaValues(null);
    const bytes = new TextEncoder().encode(input);
    Promise.all([sha1(bytes), sha256(bytes), sha384(bytes), sha512(bytes)])
      .then(([s1, s256, s384, s512]) => {
        if (cancelled) return;
        const enc = (b: Uint8Array) => (format === "base64" ? toBase64(b) : toHex(b, { upper }));
        setCryptoOk(true);
        setShaValues({ sha1: enc(s1), sha256: enc(s256), sha384: enc(s384), sha512: enc(s512) });
      })
      .catch(() => {
        if (cancelled) return;
        setCryptoOk(false);
        setShaValues(null);
      });
    return () => {
      cancelled = true;
    };
  }, [input, format, upper]);

  const values: Record<(typeof ALGO_ROWS)[number]["key"], string> = {
    md5: md5Text,
    sha1: shaValues?.sha1 ?? "",
    sha256: shaValues?.sha256 ?? "",
    sha384: shaValues?.sha384 ?? "",
    sha512: shaValues?.sha512 ?? "",
  };

  return (
    <div>
      <PageHeader badge="加密" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <SectionCard
          title="输入"
          subtitle="按 UTF-8 编码计算"
          aside={
            <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
              {byteCount} 字节
            </span>
          }
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="输入或粘贴文本，实时计算 MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512，数据不出浏览器"
            aria-label="待计算哈希的文本"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4">
            <Segmented
              value={format}
              onChange={setFormat}
              options={[
                { value: "hex", label: "hex" },
                { value: "base64", label: "base64" },
              ]}
              ariaLabel="输出格式"
            />
            <Toggle checked={upper} onChange={setUpper} label="大写" hint="仅 hex 生效" />
          </div>
        </SectionCard>

        <SectionCard title="哈希结果" subtitle="输入变化即实时重算 · 每行一键复制" count={5}>
          <div className="space-y-2.5">
            {ALGO_ROWS.map((row) => {
              const isSha = row.key !== "md5";
              const showCryptoHint = isSha && input !== "" && !cryptoOk;
              const v = values[row.key];
              const pending = input !== "" && isSha && cryptoOk && !v;
              return (
                <div
                  key={row.key}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5"
                >
                  <div className="w-24 shrink-0 sm:pt-0.5">
                    <div className="text-xs font-mono text-neutral-300">{row.label}</div>
                    <div className="text-[10px] font-mono text-neutral-600">{row.bits}</div>
                  </div>
                  {showCryptoHint ? (
                    <div className="flex-1 min-w-0">
                      <Hint kind="warn">当前环境不支持 Web Crypto，请通过 HTTPS 或 localhost 访问</Hint>
                    </div>
                  ) : (
                    <>
                      <code className="flex-1 min-w-0 font-mono text-[13px] leading-relaxed break-all text-neutral-200">
                        {v || (pending ? "计算中…" : "—")}
                      </code>
                      <div className="shrink-0">
                        <CopyButton text={v} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
