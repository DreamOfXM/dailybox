"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { parseCron, describeCron, nextRuns } from "@/lib/cron";
import { CopyButton, Hint, PageHeader, SectionCard, Toggle } from "@/components/ui";

const seo = findToolEn("cron")!;

/** Common templates：One-click fill（All are 5 field expr） */
const PRESETS: Array<{ label: string; expr: string }> = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "EN 5 EN", expr: "*/5 * * * *" },
  { label: "EN", expr: "0 * * * *" },
  { label: "EN 08:30", expr: "30 8 * * *" },
  { label: "EN 09:00", expr: "0 9 * * 1" },
  { label: "EN 1 EN 00:00", expr: "0 0 1 * *" },
];

/** EN：zh-CN EN，EN，EN */
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

  // EN 5 EN；InputEN
  const runs = useMemo(() => {
    if (!parsed.ok) return [];
    return nextRuns(parsed.value, new Date(), 5);
  }, [parsed]);

  const description = parsed.ok ? describeCron(parsed.value) : "";
  const normalized = expr.trim().replace(/\s+/g, " ");

  const applyPreset = (p: { label: string; expr: string }) => {
    setExpr(p.expr);
    setSeconds(false); // ENAll are 5 EN，EN
  };

  return (
    <>
      <PageHeader badge="EN" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* ENInput */}
        <SectionCard
          title="Cron EN"
          subtitle={seconds ? "EN EN EN EN EN EN（6 EN）" : "EN EN EN EN EN（5 EN）"}
          aside={
            <Toggle
              checked={seconds}
              onChange={setSeconds}
              label="EN"
              hint="6 EN"
            />
          }
        >
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder={seconds ? "EN 0 */5 * * * *" : "EN */5 * * * *"}
            autoComplete="off"
            spellCheck={false}
            aria-label="Cron EN"
            className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
          />

          {/* Common templates */}
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
            {/* ChineseDescription */}
            <SectionCard title="EN" subtitle="describeCron · EN" aside={<CopyButton text={normalized} label="CopyEN" />}>
              <p className="text-2xl sm:text-3xl font-semibold text-white leading-snug">
                {description}
              </p>
              <code className="inline-block mt-3 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-neutral-400 break-all">
                {normalized}
              </code>
            </SectionCard>

            {/* EN 5 EN */}
            <SectionCard title="EN 5 EN" subtitle="nextRuns · EN" count={runs.length}>
              {runs.length === 0 ? (
                <Hint kind="warn">ENcountEN，EN（EN 2 EN 30 EN）。</Hint>
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
                        <span className="ml-auto text-[10px] font-mono text-blue-400 whitespace-nowrap">EN</span>
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
