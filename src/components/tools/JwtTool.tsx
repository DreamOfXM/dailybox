"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { decodeJwt, claimTimes, type ClaimStatus } from "@/lib/jwt";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, type BadgeTone } from "@/components/ui";

const seo = findTool("jwt")!;

/** jwt.io 官方示例 token */
const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const CLAIM_LABEL: Record<string, string> = {
  iat: "签发时间",
  nbf: "生效时间",
  exp: "过期时间",
};

const STATUS_META: Record<ClaimStatus, { label: string; tone: BadgeTone }> = {
  expired: { label: "已过期", tone: "rose" },
  active: { label: "有效", tone: "emerald" },
  pending: { label: "未生效", tone: "amber" },
};

export default function JwtTool() {
  const [token, setToken] = useState(SAMPLE_TOKEN);

  // 输入变化即自动解析（纯本地解码，不验签）
  const result = useMemo(() => decodeJwt(token), [token]);
  const claims = useMemo(() => (result.ok ? claimTimes(result.value.payload) : []), [result]);

  const headerJson = result.ok ? JSON.stringify(result.value.header, null, 2) : "";
  const payloadJson = result.ok ? JSON.stringify(result.value.payload, null, 2) : "";

  return (
    <>
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* 粘贴即解析 */}
        <SectionCard
          title="粘贴 Token"
          subtitle="只解码不验签 · 数据不出浏览器"
          aside={
            <button
              type="button"
              onClick={() => setToken(SAMPLE_TOKEN)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            placeholder="粘贴 JWT（以 . 分隔的 2 段或 3 段 Base64URL）…"
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
              <SectionCard title="Header" subtitle="算法与类型" aside={<CopyButton text={headerJson} label="复制" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {headerJson}
                </pre>
              </SectionCard>

              {/* Payload */}
              <SectionCard title="Payload" subtitle="载荷声明" aside={<CopyButton text={payloadJson} label="复制" />}>
                <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                  {payloadJson}
                </pre>
              </SectionCard>
            </div>

            {/* Signature */}
            <SectionCard title="Signature" subtitle="签名段原文（本工具不验签）">
              {result.value.signature !== undefined ? (
                <code className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs text-neutral-300 break-all">
                  {result.value.signature}
                </code>
              ) : (
                <Hint kind="warn">该 token 只有两段（header.payload），没有签名段</Hint>
              )}
            </SectionCard>

            {/* 时间类 claims */}
            <SectionCard title="时间声明" subtitle="iat / nbf / exp" count={claims.length}>
              {claims.length === 0 ? (
                <Hint kind="info">payload 中没有数值型的 iat / nbf / exp 时间声明</Hint>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-sm min-w-130">
                    <thead>
                      <tr className="bg-white/[0.03] text-left text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        <th className="px-3 py-2">Claim</th>
                        <th className="px-3 py-2">本地时间</th>
                        <th className="px-3 py-2">相对时间</th>
                        <th className="px-3 py-2">状态</th>
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
