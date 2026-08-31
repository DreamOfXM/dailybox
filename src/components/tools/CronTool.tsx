"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { parseCron, describeCron, nextRuns } from "@/lib/cron";
import { CopyButton, Hint, PageHeader, SectionCard, Toggle } from "@/components/ui";

const seo = findTool("cron")!;

/** 常用模板：一键填入（均为 5 字段表达式） */
const PRESETS: Array<{ label: string; expr: string }> = [
  { label: "每分钟", expr: "* * * * *" },
  { label: "每 5 分钟", expr: "*/5 * * * *" },
  { label: "每小时整点", expr: "0 * * * *" },
  { label: "每天 08:30", expr: "30 8 * * *" },
  { label: "每周一 09:00", expr: "0 9 * * 1" },
  { label: "每月 1 日 00:00", expr: "0 0 1 * *" },
];

/** 下次执行时间：zh-CN 本地化，含星期，秒模式才显示秒 */
function formatRun(d: Date, withSecond: boolean): string {
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: withSecond ? "2-digit" : undefined,
    hour12: false,
  });
}

export default function CronTool() {
  const [expr, setExpr] = useState("*/5 * * * *");
  const [seconds, setSeconds] = useState(false);

  const parsed = useMemo(() => parseCron(expr, { seconds }), [expr, seconds]);

  // 解析成功才推算接下来 5 次执行时间；输入或模式变化才重算
  const runs = useMemo(() => {
    if (!parsed.ok) return [];
    return nextRuns(parsed.value, new Date(), 5);
  }, [parsed]);

  const description = parsed.ok ? describeCron(parsed.value) : "";
  const normalized = expr.trim().replace(/\s+/g, " ");

  const applyPreset = (p: { label: string; expr: string }) => {
    setExpr(p.expr);
    setSeconds(false); // 模板均为 5 字段，切回标准模式保证即刻可解析
  };

  return (
    <>
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* 表达式输入 */}
        <SectionCard
          title="Cron 表达式"
          subtitle={seconds ? "秒 分 时 日 月 周（6 字段）" : "分 时 日 月 周（5 字段）"}
          aside={
            <Toggle
              checked={seconds}
              onChange={setSeconds}
              label="含秒字段"
              hint="6 字段模式"
            />
          }
        >
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder={seconds ? "如 0 */5 * * * *" : "如 */5 * * * *"}
            autoComplete="off"
            spellCheck={false}
            aria-label="Cron 表达式"
            className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
          />

          {/* 常用模板 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                  normalized === p.expr && !seconds
                    ? "text-blue-300 border-blue-500/40 bg-blue-500/10"
                    : "text-neutral-400 border-white/[0.06] hover:border-white/20 hover:text-white"
                }`}
                title={p.expr}
              >
                {p.label}
              </button>
            ))}
          </div>

          {!parsed.ok && (
            <div className="mt-3">
              <Hint kind="error">{parsed.message}</Hint>
            </div>
          )}
        </SectionCard>

        {parsed.ok && (
          <>
            {/* 中文描述 */}
            <SectionCard title="人话解释" subtitle="describeCron · 本地时区" aside={<CopyButton text={normalized} label="复制表达式" />}>
              <p className="text-2xl sm:text-3xl font-semibold text-white leading-snug">
                {description}
              </p>
              <code className="inline-block mt-3 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-neutral-400 break-all">
                {normalized}
              </code>
            </SectionCard>

            {/* 接下来 5 次执行 */}
            <SectionCard title="接下来 5 次执行" subtitle="nextRuns · 从当前时刻推算" count={runs.length}>
              {runs.length === 0 ? (
                <Hint kind="warn">扫描步数达到上限仍未找到足够的执行时刻，请检查表达式是否过于罕见（如仅 2 月 30 日附近组合）。</Hint>
              ) : (
                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {runs.map((d, i) => (
                    <li
                      key={d.getTime()}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono flex-shrink-0 ${
                          i === 0 ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.05] text-neutral-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="font-mono text-sm text-neutral-200 tabular-nums">
                        {formatRun(d, seconds)}
                      </span>
                      {i === 0 && (
                        <span className="ml-auto text-[10px] font-mono text-blue-400 whitespace-nowrap">最近一次</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
}
