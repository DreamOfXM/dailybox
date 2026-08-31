"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { installmentIrr } from "@/lib/irr";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findTool("irr")!;

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

const SAMPLES = [
  { name: "信用卡分期 12 期", principal: "12000", payment: "1060", periods: "12", fee: "0" },
  { name: "网贷含服务费", principal: "10000", payment: "900", periods: "12", fee: "200" },
  { name: "消费分 24 期", principal: "24000", payment: "1120", periods: "24", fee: "0" },
];

export default function IrrTool() {
  const [principal, setPrincipal] = useState("12000");
  const [payment, setPayment] = useState("1060");
  const [periods, setPeriods] = useState("12");
  const [fee, setFee] = useState("0");

  const p = parseFloat(principal);
  const m = parseFloat(payment);
  const n = parseInt(periods, 10);
  const f = parseFloat(fee) || 0;

  const result = useMemo(() => {
    if (!(p > 0) || !(m > 0) || !Number.isInteger(n) || n <= 0 || f < 0) return null;
    return installmentIrr(p, m, n, f);
  }, [p, m, n, f]);

  const nominalFeeRate = p > 0 && n > 0 ? (f / p) * (12 / n) * 12 : 0;

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <SectionCard
          title="分期参数"
          subtitle="IRR = 内部收益率 · 监管要求金融机构披露的真实年化口径"
          aside={
            <div className="flex gap-2 flex-wrap">
              {SAMPLES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setPrincipal(s.principal);
                    setPayment(s.payment);
                    setPeriods(s.periods);
                    setFee(s.fee);
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-md text-violet-400 hover:text-violet-300 hover:bg-white/[0.05] transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">到手金额（元）</span>
              <input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">每期还款（元）</span>
              <input value={payment} onChange={(e) => setPayment(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">期数（月）</span>
              <input value={periods} onChange={(e) => setPeriods(e.target.value)} inputMode="numeric" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">前置费用（元，可 0）</span>
              <input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
          </div>
        </SectionCard>

        {result === null ? (
          <Hint kind="error">请输入有效参数：到手金额、每期还款为正数，期数为正整数</Hint>
        ) : !result.ok ? (
          <Hint kind="error">{result.message}</Hint>
        ) : (
          <SectionCard
            title="真实年化结果"
            aside={
              <CopyButton
                text={`到手 ${p} 元，每期还 ${m} 元 × ${n} 期${f > 0 ? `，前置费用 ${f} 元` : ""}：真实年化(IRR) ${pct(result.value.annualNominal)}，有效年化 ${pct(result.value.annualEffective)}，总成本 ${result.value.totalCost.toFixed(2)} 元`}
                label="复制结果"
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="真实年化（IRR×12）" value={pct(result.value.annualNominal)} tone="accent" emphasis />
              <Stat label="有效年化（复利口径）" value={pct(result.value.annualEffective)} />
              <Stat label="总还款" value={result.value.totalPayment.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} unit="元" />
              <Stat label="总成本" value={result.value.totalCost.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} unit="元" tone={result.value.totalCost > 0 ? "warn" : "good"} />
            </div>

            {f > 0 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Badge tone="amber">注意</Badge>
                <span className="text-xs text-neutral-400">
                  前置费用 {f} 元的名义费率约 {pct(nominalFeeRate)}，叠加月供后真实年化达 {pct(result.value.annualNominal)}——借钱前先看 IRR，别只看宣传费率
                </span>
              </div>
            )}
          </SectionCard>
        )}

        <Hint kind="info">
          「月费率 0.5%」的 12 期分期，名义年费率 6%，但本金逐月减少、利息照全额收，真实年化约 10.9%。IRR 让所有贷款可比。
        </Hint>
      </div>
    </>
  );
}
