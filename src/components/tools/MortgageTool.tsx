"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { fmt } from "@/lib/format";
import { prepayAfter, schedule, summarize, type Method } from "@/lib/mortgage";
import {
  AssumptionNote,
  Badge,
  Field,
  Hint,
  NumberInput,
  PageHeader,
  SectionCard,
  Segmented,
  Stat,
} from "@/components/ui";

const seo = findTool("mortgage")!;

const YEARS = ["10", "15", "20", "25", "30"] as const;
type YearStr = (typeof YEARS)[number];

const METHOD_NAME: Record<Method, string> = {
  installment: "等额本息",
  principal: "等额本金",
};

/** 金额展示：千分位 + 两位小数（仅展示层舍入） */
const money = (n: number): string => fmt(n, 2);

/** 对比卡单行 */
function Row({ label, value, tone = "text-neutral-200" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] font-mono text-neutral-500 shrink-0">{label}</span>
      <span className={`font-mono tabular-nums text-sm ${tone}`}>{value}</span>
    </div>
  );
}

export default function MortgageTool() {
  /* ---------- 输入状态（保留原始字符串，非法时提示不崩溃） ---------- */
  const [totalStr, setTotalStr] = useState("100"); // 万元
  const [years, setYears] = useState<YearStr>("30");
  const [rateStr, setRateStr] = useState("4.9"); // %

  const [tableMethod, setTableMethod] = useState<Method>("installment");
  const [showAll, setShowAll] = useState(false);

  // 提前还款输入
  const [periodStr, setPeriodStr] = useState("60");
  const [prepayStr, setPrepayStr] = useState("20"); // 万元
  const [newMonthsStr, setNewMonthsStr] = useState(""); // 空 = 剩余期数不变

  /* ---------- 基础参数解析 ---------- */
  const totalWan = Number(totalStr);
  const ratePct = Number(rateStr);
  const months = Number(years) * 12;
  const baseValid =
    totalStr.trim() !== "" &&
    Number.isFinite(totalWan) &&
    totalWan > 0 &&
    rateStr.trim() !== "" &&
    Number.isFinite(ratePct) &&
    ratePct >= 0;

  /* ---------- 等额本息 vs 等额本金 汇总对比 ---------- */
  const compare = useMemo(() => {
    if (!baseValid) return null;
    try {
      const total = totalWan * 10000;
      const rate = ratePct / 100;
      return {
        installment: summarize(total, rate, months, "installment"),
        principal: summarize(total, rate, months, "principal"),
      };
    } catch {
      return null;
    }
  }, [baseValid, totalWan, ratePct, months]);

  const savedByPrincipal = compare ? compare.installment.totalInterest - compare.principal.totalInterest : 0;

  /* ---------- 逐期还款表 ---------- */
  const rows = useMemo(() => {
    if (!baseValid) return [];
    try {
      return schedule(totalWan * 10000, ratePct / 100, months, tableMethod);
    } catch {
      return [];
    }
  }, [baseValid, totalWan, ratePct, months, tableMethod]);
  const visibleRows = showAll ? rows : rows.slice(0, 12);

  /* ---------- 提前还款测算 ---------- */
  const prepay = useMemo(() => {
    if (!baseValid) return { ok: false as const, message: "请先填写合法的贷款参数" };
    const period = Number(periodStr);
    const amount = Number(prepayStr) * 10000;
    const newMonths = newMonthsStr.trim() === "" ? undefined : Number(newMonthsStr);
    try {
      const total = totalWan * 10000;
      const rate = ratePct / 100;
      const res = prepayAfter(total, rate, months, tableMethod, period, amount, newMonths);
      const remainingAfter = schedule(total, rate, months, tableMethod)[period - 1].remaining - amount;
      return { ok: true as const, ...res, remainingAfter, targetMonths: newMonths ?? months - period };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "提前还款参数不合法" };
    }
  }, [baseValid, totalWan, ratePct, months, tableMethod, periodStr, prepayStr, newMonthsStr]);

  const methodOptions = (Object.keys(METHOD_NAME) as Method[]).map((m) => ({
    value: m,
    label: METHOD_NAME[m],
  }));

  return (
    <div>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 贷款参数 */}
        <SectionCard title="贷款参数" subtitle="修改后全部结果实时更新">
          <div className="grid gap-4">
            <Field label="贷款总额" hint="万元">
              <NumberInput value={totalStr} onChange={setTotalStr} suffix="万" placeholder="如 100" invalid={totalWan <= 0} />
            </Field>

            <Field label="贷款年限">
              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  value={years}
                  onChange={setYears}
                  options={YEARS.map((y) => ({ value: y, label: `${y} 年` }))}
                  ariaLabel="贷款年限"
                />
              </div>
            </Field>

            <Field label="年利率" hint="% · 支持小数，0 表示无息">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rateStr}
                  onChange={(e) => setRateStr(e.target.value)}
                  placeholder="如 4.9"
                  aria-label="年利率（%）"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px] pr-10"
                />
                <span className="absolute right-4 text-xs font-mono text-neutral-600 pointer-events-none">%</span>
              </div>
            </Field>
          </div>

          {!baseValid && (
            <div className="mt-4">
              <Hint kind="warn">请输入合法参数：贷款总额须大于 0，年利率须为不小于 0 的数字。</Hint>
            </div>
          )}
        </SectionCard>

        {/* 两种方式对比 */}
        {compare && (
          <SectionCard
            title="等额本息 vs 等额本金"
            subtitle={`贷款 ${fmt(totalWan, 0)} 万 · ${years} 年（${months} 期）· 年利率 ${rateStr}%`}
            aside={
              savedByPrincipal > 0 ? (
                <Badge tone="emerald">等额本金省 {money(savedByPrincipal)} 元利息</Badge>
              ) : undefined
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["installment", "principal"] as Method[]).map((m) => {
                const s = compare[m];
                const isPrincipal = m === "principal";
                return (
                  <div
                    key={m}
                    className={`rounded-xl border p-4 ${
                      isPrincipal ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-neutral-400">{METHOD_NAME[m]}</span>
                      {isPrincipal && <Badge tone="emerald">总利息更低</Badge>}
                    </div>
                    <div className="mb-3">
                      <div className="text-[11px] font-mono text-neutral-500 mb-1">首月月供</div>
                      <div className={`font-mono tabular-nums text-2xl font-semibold ${isPrincipal ? "text-emerald-300" : "text-blue-300"}`}>
                        {money(s.monthlyFirst)}
                        <span className="text-xs text-neutral-500 ml-1 font-normal">元</span>
                      </div>
                    </div>
                    <Row label="末月月供" value={`${money(s.monthlyLast)} 元`} />
                    <Row label="总利息" value={`${money(s.totalInterest)} 元`} tone={isPrincipal ? "text-emerald-300" : "text-neutral-200"} />
                    <Row label="总还款" value={`${money(s.totalPayment)} 元`} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* 逐期还款表 */}
        {baseValid && rows.length > 0 && (
          <SectionCard
            title="逐期还款表"
            subtitle={`${METHOD_NAME[tableMethod]} · 金额单位：元`}
            count={rows.length}
            aside={
              <Segmented value={tableMethod} onChange={(m) => setTableMethod(m)} options={methodOptions} ariaLabel="还款方式" />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular-nums min-w-[520px]">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/[0.08]">
                    <th className="py-2 pr-2 text-left font-normal">期数</th>
                    <th className="py-2 px-2 text-right font-normal">月供</th>
                    <th className="py-2 px-2 text-right font-normal">本金</th>
                    <th className="py-2 px-2 text-right font-normal">利息</th>
                    <th className="py-2 pl-2 text-right font-normal">剩余本金</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.period} className="text-neutral-300 border-b border-white/[0.04] hover:bg-white/[0.03]">
                      <td className="py-1.5 pr-2 text-neutral-500">{row.period}</td>
                      <td className="py-1.5 px-2 text-right">{money(row.payment)}</td>
                      <td className="py-1.5 px-2 text-right">{money(row.principal)}</td>
                      <td className="py-1.5 px-2 text-right">{money(row.interest)}</td>
                      <td className="py-1.5 pl-2 text-right">{money(row.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="px-3 py-1.5 rounded-md text-xs font-mono border text-neutral-400 border-white/[0.06] hover:border-white/20 hover:text-white transition-all"
              >
                {showAll ? "收起" : `展开全部 ${rows.length} 期`}
              </button>
            </div>
          </SectionCard>
        )}

        {/* 提前还款测算 */}
        {baseValid && (
          <SectionCard
            title="提前还款测算"
            subtitle={`按当前方式（${METHOD_NAME[tableMethod]}）与原利率重算`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="第几期后提前还" hint={`1 ~ ${months - 1}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={periodStr}
                  onChange={(e) => setPeriodStr(e.target.value)}
                  placeholder="如 60"
                  aria-label="第几期后提前还款"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
              <Field label="提前还款金额" hint="万元">
                <NumberInput value={prepayStr} onChange={setPrepayStr} suffix="万" placeholder="如 20" />
              </Field>
              <Field label="新还款期数" hint="留空 = 剩余期数不变">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={newMonthsStr}
                  onChange={(e) => setNewMonthsStr(e.target.value)}
                  placeholder={`默认 ${months - (Number(periodStr) > 0 ? Math.min(Math.floor(Number(periodStr)), months - 1) : 0)}`}
                  aria-label="新还款期数（月）"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>

            <div className="mt-4">
              {prepay.ok ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Stat label="新月供（首期）" value={money(prepay.newMonthly)} unit="元" tone="accent" emphasis />
                    <Stat label="节省利息" value={money(prepay.savedInterest)} unit="元" tone="good" emphasis />
                    <Stat label="提前还款后剩余本金" value={money(prepay.remainingAfter)} unit="元" />
                  </div>
                  <p className="mt-3 text-[11px] font-mono text-neutral-600">
                    第 {periodStr} 期还完后一次性提前还款，剩余本金按 {METHOD_NAME[tableMethod]}、{prepay.targetMonths} 期重新计算。
                  </p>
                </>
              ) : (
                <Hint kind="error">{prepay.message}</Hint>
              )}
            </div>
          </SectionCard>
        )}

        {/* 计算口径透明 */}
        <AssumptionNote
          items={[
            { k: "月利率", v: "年利率 ÷ 12，按月复利，不做中途舍入" },
            { k: "等额本息", v: "月供 = P·r·(1+r)^n ÷ ((1+r)^n − 1)，每月固定" },
            { k: "等额本金", v: "每月本金 = P ÷ n，利息按剩余本金计，月供逐月递减" },
            { k: "末期找平", v: "最后一期以剩余本金为准，总本金精确还清" },
            { k: "提前还款", v: "按原方式、原利率对新本金重算，节省利息 = 原总利息 − 已付 − 新总利息" },
          ]}
        />

        <p className="text-[11px] font-mono text-neutral-600">计算结果仅供参考，实际以银行审批为准。</p>
      </div>
    </div>
  );
}
