"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { comparePlans, compound, simpleInterest } from "@/lib/deposit";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Segmented, Stat } from "@/components/ui";

const seo = findTool("deposit")!;

const fmtMoney = (v: number) =>
  v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DepositTool() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("2.5");
  const [years, setYears] = useState("3");
  const [method, setMethod] = useState<"simple" | "compound">("simple");
  const [freq, setFreq] = useState<"1" | "2" | "4" | "12">("1");

  const p = parseFloat(principal);
  const r = parseFloat(rate) / 100;
  const t = parseFloat(years);
  const valid = p > 0 && r >= 0 && t > 0;

  const result = useMemo(() => {
    if (!valid) return null;
    try {
      return method === "simple" ? simpleInterest(p, r, t) : compound(p, r, t, parseInt(freq, 10));
    } catch {
      return null;
    }
  }, [p, r, t, method, freq, valid]);

  // 常用期限方案对比（同本金同利率）
  const plans = useMemo(() => {
    if (!valid) return [];
    try {
      return comparePlans(
        [1, 2, 3, 5].map((y) => ({
          name: `${y} 年期`,
          principal: p,
          annualRate: r,
          years: y,
          compound: method === "compound",
        })),
      );
    } catch {
      return [];
    }
  }, [p, r, method, valid]);

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard title="存款参数" subtitle="国内定期存款为单利口径 · 复利适用于理财/国债等场景">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">本金（元）</span>
              <input
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm"
                placeholder="100000"
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">年利率（%）</span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm"
                placeholder="2.5"
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">期限（年）</span>
              <input
                value={years}
                onChange={(e) => setYears(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm"
                placeholder="3"
              />
            </label>
          </div>

          <div className="flex items-center gap-6 flex-wrap mt-4">
            <Segmented
              value={method}
              onChange={setMethod}
              options={[
                { value: "simple", label: "单利" },
                { value: "compound", label: "复利" },
              ]}
              ariaLabel="计息方式"
            />
            {method === "compound" && (
              <Segmented
                value={freq}
                onChange={setFreq}
                options={[
                  { value: "1", label: "按年" },
                  { value: "2", label: "按半年" },
                  { value: "4", label: "按季" },
                  { value: "12", label: "按月" },
                ]}
                ariaLabel="计息频率"
              />
            )}
          </div>
        </SectionCard>

        {!valid ? (
          <Hint kind="error">请输入有效的本金、利率与期限（均为正数）</Hint>
        ) : result ? (
          <SectionCard
            title="计算结果"
            aside={<CopyButton text={`本金 ${fmtMoney(p)} 元，年利率 ${(r * 100).toFixed(2)}%，${t} 年${method === "simple" ? "单利" : "复利"}，到期利息 ${fmtMoney(result.interest)} 元，本息合计 ${fmtMoney(result.maturity)} 元`} label="复制结果" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="到期利息" value={fmtMoney(result.interest)} unit="元" tone="good" emphasis />
              <Stat label="到期本息合计" value={fmtMoney(result.maturity)} unit="元" />
              <Stat label="收益倍数" value={(result.maturity / p).toFixed(4)} unit="×" />
            </div>
          </SectionCard>
        ) : null}

        {plans.length > 0 && (
          <SectionCard title="不同期限对比" subtitle="同本金同利率，看哪个期限到期本息最多">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-4">期限</th>
                    <th className="text-right py-2 px-4">到期利息</th>
                    <th className="text-right py-2 px-4">到期本息</th>
                    <th className="text-right py-2 pl-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, i) => (
                    <tr key={plan.name} className="border-b border-white/[0.04]">
                      <td className="py-2.5 pr-4 text-neutral-300">{plan.name}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-400">{fmtMoney(plan.interest)}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-200">{fmtMoney(plan.maturity)}</td>
                      <td className="py-2.5 pl-4 text-right">{i === 0 && <Badge tone="emerald">最优</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        <Hint kind="info">
          年化收益率换算：实际收益 ÷ 本金 ÷（天数 ÷ 365）。定期存款提前支取通常按活期计息，请以银行规则为准。
        </Hint>
      </div>
    </>
  );
}
