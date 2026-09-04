"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { decodeJwt, claimTimes, type ClaimStatus } from "@/lib/jwt";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, type BadgeTone } from "@/components/ui";

const seo = findToolEn("jwt")!;

/** jwt.io Official example token */
const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const CLAIM_LABEL: Record<string, string> = {
  iat: "Issued at",
  nbf: "Not before",
  exp: "Expiry",
};

const STATUS_META: Record<ClaimStatus, { label: string; tone: BadgeTone }> = {
  expired: { label: "Expired", tone: "rose" },
  active: { label: "Valid", tone: "emerald" },
  pending: { label: "Not yet valid", tone: "amber" },
};

/** Map Chinese error messages from jwt.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/不是合法的 Base64URL 编码/.test(msg)) return msg.replace(/JWT (.+?) 段不是合法的 Base64URL 编码：(.+)/, "JWT $1 segment is not valid Base64URL encoding: $2");
  if (/解码后不是合法 JSON/.test(msg)) return msg.replace(/JWT (.+?) 段解码后不是合法 JSON/, "JWT $1 segment is not valid JSON after decoding");
  if (/必须是 JSON 对象/.test(msg)) return msg.replace(/JWT (.+?) 必须是 JSON 对象，实际为(.+)/, "JWT $1 must be a JSON object, got $2").replace("数组", "array");
  if (/格式错误/.test(msg)) return msg.replace(/JWT 格式错误：应由 2 段或 3 段组成（以 \. 分隔），实际为 (\d+) 段/, "Invalid JWT format: expected 2 or 3 dot-separated segments, got $1");
  return msg;
}

/** Format a Unix timestamp (seconds) as a locale-independent date string. */
function fmtLocal(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString("en-GB", { hour12: false });
}

/** Produce an English relative-time string like "3 days ago" or "in 2 hours". */
function relativeEn(targetSec: number, nowSec: number): string {
  const diff = targetSec - nowSec;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  const suffix = diff > 0 ? "from now" : "ago";
  let v: number;
  let unit: string;
  if (abs < 3600) { v = Math.floor(abs / 60); unit = v === 1 ? "minute" : "minutes"; }
  else if (abs < 86400) { v = Math.floor(abs / 3600); unit = v === 1 ? "hour" : "hours"; }
  else if (abs < 86400 * 30) { v = Math.floor(abs / 86400); unit = v === 1 ? "day" : "days"; }
  else if (abs < 86400 * 365) { v = Math.floor(abs / (86400 * 30)); unit = v === 1 ? "month" : "months"; }
  else { v = Math.floor(abs / (86400 * 365)); unit = v === 1 ? "year" : "years"; }
  return `${v} ${unit} ${suffix}`;
}

export default function JwtTool() {
  const [token, setToken] = useState(SAMPLE_TOKEN);

  // Auto-decode on input change (local decode only, no signature verification)
  const result = useMemo(() => decodeJwt(token), [token]);
  const claims = useMemo(() => (result.ok ? claimTimes(result.value.payload) : []), [result]);

  const headerJson = result.ok ? JSON.stringify(result.value.header, null, 2) : "";
  const payloadJson = result.ok ? JSON.stringify(result.value.payload, null, 2) : "";

  return (
    <>
      <PageHeader badge="Dev" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* Paste to decode */}
        <SectionCard
          title="Paste Token"
          subtitle="Decode only, no verification · data stays in browser"
          aside={
            <button
              type="button"
              onClick={() => setToken(SAMPLE_TOKEN)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              Example
            </button>
          }
        >
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            placeholder="Paste a JWT (2 or 3 Base64URL segments separated by dots)…"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl font-mono text-xs leading-relaxed resize-y break-all"
          />
          {!result.ok && (
            <div className="mt-3">
              <Hint kind="error">{enMsg(result.message)}</Hint>
            </div>
          )}
        </SectionCard>

        {result.ok && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Header */}
              <SectionCard title="Header" subtitle="algorithm · type" aside={<CopyButton text={headerJson} label="Copy" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {headerJson}
                </pre>
              </SectionCard>

              {/* Payload */}
              <SectionCard title="Payload" subtitle="claims · issued · expires" aside={<CopyButton text={payloadJson} label="Copy" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {payloadJson}
                </pre>
              </SectionCard>
            </div>

            {/* Signature */}
            <SectionCard title="Signature" subtitle="Raw signature segment (this tool does not verify)">
              {result.value.signature !== undefined ? (
                <code className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 break-all">
                  {result.value.signature}
                </code>
              ) : (
                <Hint kind="warn">This token has only two segments (header.payload) with no signature.</Hint>
              )}
            </SectionCard>

            {/* Time-based claims */}
            <SectionCard title="Time claims" subtitle="iat / nbf / exp" count={claims.length}>
              {claims.length === 0 ? (
                <Hint kind="info">No numeric iat / nbf / exp time claims found in payload.</Hint>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-sm min-w-130">
                    <thead>
                      <tr className="bg-white/[0.03] text-left text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        <th className="px-3 py-2">Claim</th>
                        <th className="px-3 py-2">Local time</th>
                        <th className="px-3 py-2">Relative</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((c) => {
                        const meta = STATUS_META[c.status];
                        return (
                          <tr key={c.claim} className="border-t border-white/[0.04]">
                            <td className="px-3 py-2 font-mono text-xs">
                              <span className="text-blue-400">{c.claim}</span>
                              <span className="text-neutral-600 ml-1.5">{CLAIM_LABEL[c.claim]}</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-neutral-300 tabular-nums whitespace-nowrap">
                              {fmtLocal(c.seconds)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-neutral-400 whitespace-nowrap">{relativeEn(c.seconds, Math.floor(Date.now() / 1000))}</td>
                            <td className="px-3 py-2">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
}
