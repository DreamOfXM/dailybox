"use client";

import { useMemo, useState, type ReactNode } from "react";
import { findToolEn } from "@/lib/seo-en";
import { parseRegex, runMatches, explainRegex, regexIssueEn, type MatchInfo } from "@/lib/regex";
import { Badge, CopyButton, Field, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("regex")!;

/** Common regex patterns: one-click fill */
const PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "Phone", pattern: "^1[3-9]\\d{9}$" },
  { label: "Email", pattern: "^[\\w.+-]+@[\\w-]+\\.[\\w.]+$" },
  { label: "IPv4", pattern: "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$" },
  { label: "URL", pattern: "^https?:\\/\\/[^\\s]+$" },
  { label: "Chinese", pattern: "[\\u4e00-\\u9fa5]+" },
  { label: "ID Card", pattern: "^\\d{17}[\\dXx]$" },
];

const DEFAULT_TEXT =
  "Phone 13812345678, email zhangsan@example.com, server IP 192.168.1.1, website https://example.com/login. Alternate contact: 15900008888.";

/** Maximum number of match segments to display in the list */
const LIST_LIMIT = 100;

/** Split test text into React nodes by match results: matched segments get emerald background mark, rest output as-is */
function buildHighlight(text: string, matches: MatchInfo[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.length === 0) continue; // Zero-width match cannot be highlighted
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index));
    nodes.push(
      <mark key={`${m.index}-${m.length}`} className="bg-acc/25 text-accd rounded px-0.5">
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
      <PageHeader badge="Dev" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        {/* Regex input */}
        <SectionCard title="Pattern" subtitle="pattern + flags">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Field label="Pattern">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter a regex, e.g. \d+"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>
            <div className="sm:w-36">
              <Field label="Flags" hint="Multiple allowed">
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
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink3 mb-2">Common patterns · click to fill</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  title={p.pattern}
                  onClick={() => setPattern(p.pattern)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                    pattern === p.pattern
                      ? "border-viol/45 bg-violp text-viol"
                      : "border-line bg-surface text-ink2 hover:text-ink hover:bg-surface"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {pattern !== "" && parsed.issue && (
            <div className="mt-4">
              <Hint kind="error">{regexIssueEn(parsed.issue)}</Hint>
            </div>
          )}
        </SectionCard>

        {/* Test string + highlight preview */}
        <SectionCard title="Test string" subtitle="Live highlight of all matches">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste text to test…"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="mt-3 rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-ink min-h-12">
            {highlight.length > 0 ? highlight : <span className="text-ink3">(No match)</span>}
          </div>
        </SectionCard>

        {/* Match results list */}
        <SectionCard
          title="Matches"
          subtitle={parsed.re ? `flags: ${parsed.re.flags || "(none)"}` : undefined}
          count={matches.length}
          aside={matches.length > 0 ? <CopyButton text={matchedText} label="Copy all" /> : undefined}
        >
          {pattern === "" ? (
            <Hint kind="info">Enter a regex to see match results.</Hint>
          ) : parsed.issue ? (
            <Hint kind="error">Regex failed to compile. Please check the error above.</Hint>
          ) : matches.length === 0 ? (
            <Hint kind="info">No matches found.</Hint>
          ) : (
            <div>
              {matches.slice(0, LIST_LIMIT).map((m, i) => (
                <div key={`${m.index}-${i}`} className="py-2.5 border-b border-line last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="violet">#{i + 1}</Badge>
                    <span className="text-[11px] font-mono text-ink3 tabular-nums">index {m.index}</span>
                    <code className="font-mono text-sm text-accd bg-accp border border-acct px-1.5 py-0.5 rounded break-all">
                      {m.length === 0 ? "(zero-width)" : m.full}
                    </code>
                  </div>
                  {(m.groups.length > 0 || m.named) && (
                    <div className="mt-1.5 pl-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="text-ink3">
                          ${gi + 1}=<span className="text-ink">{g === null ? "∅ not matched" : g}</span>
                        </span>
                      ))}
                      {m.named &&
                        Object.entries(m.named).map(([k, v]) => (
                          <span key={k} className="text-viol">
                            {k}=<span className="text-ink">{v ?? "∅ not matched"}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {matches.length > LIST_LIMIT && (
                <div className="mt-3">
                  <Hint kind="warn">
                    total {matches.length} matches, showing first {LIST_LIMIT} only
                  </Hint>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Token-by-token explanation */}
        <SectionCard title="Explanation" subtitle="Token-by-token breakdown">
          {tokens.length === 0 ? (
            <Hint kind="info">Enter a regex to see a token-by-token explanation.</Hint>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left text-[10px] font-mono uppercase tracking-wider text-ink3">
                    <th className="px-3 py-2 w-1/3">Token</th>
                    <th className="px-3 py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-1.5 font-mono text-viol whitespace-pre-wrap break-all align-top">{t.token}</td>
                      <td className="px-3 py-1.5 text-ink2">{t.descEn}</td>
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
