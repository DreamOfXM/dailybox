"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { comparePlans, compound, simpleInterest } from "@/lib/deposit";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Segmented, Stat } from "@/components/ui";

const seo = findToolEn("deposit")!;

const fmtMoney = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DepositToolEn() {
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

  // Compare common term options with the same principal and rate
  const plans = useMemo(() => {
    if (!valid) return [];
    try {
      return comparePlans(
        [1, 2, 3, 5].map((y) => ({
          name: `${y}-year`,
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
      <PageHeader badge="Finance" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard title="Deposit Parameters" subtitle="Fixed deposits typically use simple interest; compound applies to bonds and wealth products">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Principal (CNY)</span>
              <input
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm"
                placeholder="100000"
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Annual rate (%)</span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                inputMode="decimal"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm"
                placeholder="2.5"
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Term (years)</span>
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
                { value: "simple", label: "Simple" },
                { value: "compound", label: "Compound" },
              ]}
              ariaLabel="Interest method"
            />
            {method === "compound" && (
              <Segmented
                value={freq}
                onChange={setFreq}
                options={[
                  { value: "1", label: "Annual" },
                  { value: "2", label: "Semi-annual" },
                  { value: "4", label: "Quarterly" },
                  { value: "12", label: "Monthly" },
                ]}
                ariaLabel="Compounding frequency"
              />
            )}
          </div>
        </SectionCard>

        {!valid ? (
          <Hint kind="error">Please enter valid principal, rate, and term (all must be positive).</Hint>
        ) : result ? (
          <SectionCard
            title="Results"
            aside={<CopyButton text={`Principal ${fmtMoney(p)} CNY, rate ${(r * 100).toFixed(2)}%, ${t} yr ${method === "simple" ? "simple" : "compound"}, interest earned ${fmtMoney(result.interest)} CNY, maturity value ${fmtMoney(result.maturity)} CNY`} label="Copy results" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Interest earned" value={fmtMoney(result.interest)} unit="CNY" tone="good" emphasis />
              <Stat label="Maturity value" value={fmtMoney(result.maturity)} unit="CNY" />
              <Stat label="Return multiple" value={(result.maturity / p).toFixed(4)} unit="x" />
            </div>
          </SectionCard>
        ) : null}

        {plans.length > 0 && (
          <SectionCard title="Term Comparison" subtitle="Same principal and rate — see which term yields the highest maturity value">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-4">Term</th>
                    <th className="text-right py-2 px-4">Interest</th>
                    <th className="text-right py-2 px-4">Maturity</th>
                    <th className="text-right py-2 pl-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, i) => (
                    <tr key={plan.name} className="border-b border-white/[0.04]">
                      <td className="py-2.5 pr-4 text-neutral-300">{plan.name}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-400">{fmtMoney(plan.interest)}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-200">{fmtMoney(plan.maturity)}</td>
                      <td className="py-2.5 pl-4 text-right">{i === 0 && <Badge tone="emerald">Best</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        <Hint kind="info">
          Annualized yield (APY): actual earnings / principal / (days / 365). Early withdrawal from fixed deposits usually earns demand-deposit rates — check your bank&apos;s policy.
        </Hint>
      </div>
    </>
  );
}
