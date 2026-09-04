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
  active: { label: "EN", tone: "emerald" },
  pending: { label: "EN", tone: "amber" },
};

export default function JwtTool() {
  const [token, setToken] = useState(SAMPLE_TOKEN);

  // InputEN（ENDecode，EN）
  const result = useMemo(() => decodeJwt(token), [token]);
  const claims = useMemo(() => (result.ok ? claimTimes(result.value.payload) : []), [result]);

  const headerJson = result.ok ? JSON.stringify(result.value.header, null, 2) : "";
  const payloadJson = result.ok ? JSON.stringify(result.value.payload, null, 2) : "";

  return (
    <>
      <PageHeader badge="EN" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* EN */}
        <SectionCard
          title="EN Token"
          subtitle="ENDecodeEN · countEN"
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
            placeholder="EN JWT（EN . EN 2 EN 3 EN Base64URL）…"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl font-mono text-xs leading-relaxed resize-y break-all"
          />
          {!result.ok && (
            <div className="mt-3">
              <Hint kind="error">{result.message}</Hint>
            </div>
          )}
        </SectionCard>

        {result.ok && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Header */}
              <SectionCard title="Header" subtitle="EN" aside={<CopyButton text={headerJson} label="Copy" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {headerJson}
                </pre>
              </SectionCard>

              {/* Payload */}
              <SectionCard title="Payload" subtitle="EN" aside={<CopyButton text={payloadJson} label="Copy" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {payloadJson}
                </pre>
              </SectionCard>
            </div>

            {/* Signature */}
            <SectionCard title="Signature" subtitle="EN（ENToolsEN）">
              {result.value.signature !== undefined ? (
                <code className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 break-all">
                  {result.value.signature}
                </code>
              ) : (
                <Hint kind="warn">EN token EN（header.payload），EN</Hint>
              )}
            </SectionCard>

            {/* EN claims */}
            <SectionCard title="EN" subtitle="iat / nbf / exp" count={claims.length}>
              {claims.length === 0 ? (
                <Hint kind="info">payload ENcountEN iat / nbf / exp EN</Hint>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-sm min-w-130">
                    <thead>
                      <tr className="bg-white/[0.03] text-left text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        <th className="px-3 py-2">Claim</th>
                        <th className="px-3 py-2">EN</th>
                        <th className="px-3 py-2">EN</th>
                        <th className="px-3 py-2">EN</th>
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
                              {c.local}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-neutral-400 whitespace-nowrap">{c.relative}</td>
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
