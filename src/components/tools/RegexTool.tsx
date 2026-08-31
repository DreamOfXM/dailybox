"use client";

import { useMemo, useState, type ReactNode } from "react";
import { findTool } from "@/lib/seo";
import { parseRegex, runMatches, explainRegex, type MatchInfo } from "@/lib/regex";
import { Badge, CopyButton, Field, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findTool("regex")!;

/** 常用正则库：一键填入 pattern */
const PRESETS: Array<{ label: string; pattern: string }> = [
  { label: "手机号", pattern: "^1[3-9]\\d{9}$" },
  { label: "邮箱", pattern: "^[\\w.+-]+@[\\w-]+\\.[\\w.]+$" },
  { label: "IPv4", pattern: "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$" },
  { label: "URL", pattern: "^https?:\\/\\/[^\\s]+$" },
  { label: "中文", pattern: "[\\u4e00-\\u9fa5]+" },
  { label: "身份证", pattern: "^\\d{17}[\\dXx]$" },
];

const DEFAULT_TEXT =
  "张三的手机号是 13812345678，邮箱 zhangsan@example.com，服务器 IP 192.168.1.1，官网 https://example.com/login。备用联系方式：李四 15900008888。";

/** 匹配片段数列表展示上限 */
const LIST_LIMIT = 100;

/** 按匹配结果把测试文本拆成 React 片段数组：匹配段用 emerald 背景 mark，其余原样输出 */
function buildHighlight(text: string, matches: MatchInfo[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.length === 0) continue; // 零宽匹配无法高亮
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
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        {/* 正则表达式输入 */}
        <SectionCard title="正则表达式" subtitle="pattern + flags">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Field label="Pattern">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="输入正则表达式，如 \d+"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>
            <div className="sm:w-36">
              <Field label="Flags" hint="可多选">
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

          {/* 常用正则库 */}
          <div className="mt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 mb-2">常用正则 · 点击填入</div>
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

        {/* 测试文本 + 高亮预览 */}
        <SectionCard title="测试文本" subtitle="实时高亮全部匹配">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="粘贴要测试的文本…"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-neutral-300 min-h-12">
            {highlight.length > 0 ? highlight : <span className="text-neutral-600">（无匹配）</span>}
          </div>
        </SectionCard>

        {/* 匹配结果列表 */}
        <SectionCard
          title="匹配结果"
          subtitle={parsed.re ? `flags: ${parsed.re.flags || "（无）"}` : undefined}
          count={matches.length}
          aside={matches.length > 0 ? <CopyButton text={matchedText} label="复制全部匹配" /> : undefined}
        >
          {pattern === "" ? (
            <Hint kind="info">输入正则表达式后自动显示匹配结果</Hint>
          ) : parsed.issue ? (
            <Hint kind="error">正则无法编译，请检查上方错误提示</Hint>
          ) : matches.length === 0 ? (
            <Hint kind="info">没有匹配项</Hint>
          ) : (
            <div>
              {matches.slice(0, LIST_LIMIT).map((m, i) => (
                <div key={`${m.index}-${i}`} className="py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="violet">#{i + 1}</Badge>
                    <span className="text-[11px] font-mono text-neutral-600 tabular-nums">index {m.index}</span>
                    <code className="font-mono text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded break-all">
                      {m.length === 0 ? "（零宽匹配）" : m.full}
                    </code>
                  </div>
                  {(m.groups.length > 0 || m.named) && (
                    <div className="mt-1.5 pl-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="text-neutral-500">
                          ${gi + 1}=<span className="text-neutral-300">{g === null ? "∅ 未匹配" : g}</span>
                        </span>
                      ))}
                      {m.named &&
                        Object.entries(m.named).map(([k, v]) => (
                          <span key={k} className="text-violet-400">
                            {k}=<span className="text-neutral-300">{v ?? "∅ 未匹配"}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {matches.length > LIST_LIMIT && (
                <div className="mt-3">
                  <Hint kind="warn">
                    共 {matches.length} 条匹配，仅显示前 {LIST_LIMIT} 条
                  </Hint>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* 逐 token 中文解释 */}
        <SectionCard title="正则解释" subtitle="逐 token 中文说明">
          {tokens.length === 0 ? (
            <Hint kind="info">输入正则表达式后自动解释每个符号的含义</Hint>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    <th className="px-3 py-2 w-1/3">Token</th>
                    <th className="px-3 py-2">含义</th>
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
