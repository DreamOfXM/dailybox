"use client";

import { useMemo, useState, type ReactNode } from "react";
import { findToolEn } from "@/lib/seo-en";
import { parseRegex, runMatches, explainRegex, type MatchInfo } from "@/lib/regex";
import { Badge, CopyButton, Field, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("regex")!;

/** Common regex：One-click fill pattern */
const PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "Phone", pattern: "^1[3-9]\\d{9}$" },
  { label: "Email", pattern: "^[\\w.+-]+@[\\w-]+\\.[\\w.]+$" },
  { label: "IPv4", pattern: "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$" },
  { label: "URL", pattern: "^https?:\\/\\/[^\\s]+$" },
  { label: "Chinese", pattern: "[\\u4e00-\\u9fa5]+" },
  { label: "EN", pattern: "^\\d{17}[\\dXx]$" },
];

const DEFAULT_TEXT =
  "ENPhoneEN 13812345678，Email zhangsan@example.com，EN IP 192.168.1.1，EN https://example.com/login。EN：EN 15900008888。";

/** ENcountEN */
const LIST_LIMIT = 100;

/** ENResultEN React ENcountEN：EN emerald EN mark，ENOutput */
function buildHighlight(text: string, matches: MatchInfo[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.length === 0) continue; // EN
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index));
    nodes.push(
      <mark key={`${m.index}-${m.length}`} className="bg-emerald-500/25 text-emerald-300 rounded px-0.5">
        {text.slice(m.index, m.index + m.length)}
      </mark>,
    );
    cursor = m.index + m.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export default function RegexTool() {
  const [pattern, setPattern] = useState("1[3-9]\\d{9}");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState(DEFAULT_TEXT);

  const parsed = useMemo(() => parseRegex(pattern, flags), [pattern, flags]);

  const matches = useMemo(() => {
    if (!parsed.re || pattern === "") return [];
    return runMatches(text, parsed.re);
  }, [parsed.re, pattern, text]);

  const highlight = useMemo(() => buildHighlight(text, matches), [text, matches]);
  const tokens = useMemo(() => (pattern === "" ? [] : explainRegex(pattern)), [pattern]);

  const matchedText = matches.map((m) => m.full).join("\n");

  return (
    <>
      <PageHeader badge="EN" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        {/* ENInput */}
        <SectionCard title="EN" subtitle="pattern + flags">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Field label="Pattern">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="InputEN，EN \d+"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>
            <div className="sm:w-36">
              <Field label="Flags" hint="EN">
                <input
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="g i m s u y"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>
          </div>

          {/* Common regex */}
          <div className="mt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 mb-2">EN · EN</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  title={p.pattern}
                  onClick={() => setPattern(p.pattern)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                    pattern === p.pattern
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {pattern !== "" && parsed.issue && (
            <div className="mt-4">
              <Hint kind="error">{parsed.issue}</Hint>
            </div>
          )}
        </SectionCard>

        {/* EN + EN */}
        <SectionCard title="EN" subtitle="ENAllEN">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="EN…"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-neutral-300 min-h-12">
            {highlight.length > 0 ? highlight : <span className="text-neutral-600">（EN）</span>}
          </div>
        </SectionCard>

        {/* ENResultEN */}
        <SectionCard
          title="ENResult"
          subtitle={parsed.re ? `flags: ${parsed.re.flags || "（EN）"}` : undefined}
          count={matches.length}
          aside={matches.length > 0 ? <CopyButton text={matchedText} label="CopyAllEN" /> : undefined}
        >
          {pattern === "" ? (
            <Hint kind="info">InputENResult</Hint>
          ) : parsed.issue ? (
            <Hint kind="error">EN，EN</Hint>
          ) : matches.length === 0 ? (
            <Hint kind="info">EN</Hint>
          ) : (
            <div>
              {matches.slice(0, LIST_LIMIT).map((m, i) => (
                <div key={`${m.index}-${i}`} className="py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="violet">#{i + 1}</Badge>
                    <span className="text-[11px] font-mono text-neutral-600 tabular-nums">index {m.index}</span>
                    <code className="font-mono text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded break-all">
                      {m.length === 0 ? "（EN）" : m.full}
                    </code>
                  </div>
                  {(m.groups.length > 0 || m.named) && (
                    <div className="mt-1.5 pl-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="text-neutral-500">
                          ${gi + 1}=<span className="text-neutral-300">{g === null ? "∅ EN" : g}</span>
                        </span>
                      ))}
                      {m.named &&
                        Object.entries(m.named).map(([k, v]) => (
                          <span key={k} className="text-violet-400">
                            {k}=<span className="text-neutral-300">{v ?? "∅ EN"}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {matches.length > LIST_LIMIT && (
                <div className="mt-3">
                  <Hint kind="warn">
                    total {matches.length} EN，EN {LIST_LIMIT} EN
                  </Hint>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* EN token ChineseEN */}
        <SectionCard title="EN" subtitle="EN token ChineseEN">
          {tokens.length === 0 ? (
            <Hint kind="info">InputEN</Hint>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    <th className="px-3 py-2 w-1/3">Token</th>
                    <th className="px-3 py-2">EN</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="px-3 py-1.5 font-mono text-violet-300 whitespace-pre-wrap break-all align-top">{t.token}</td>
                      <td className="px-3 py-1.5 text-neutral-400">{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
