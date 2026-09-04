"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { installmentIrr } from "@/lib/irr";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findToolEn("irr")!;

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

const SAMPLES = [
  { name: "Credit card 12 mo", principal: "12000", payment: "1060", periods: "12", fee: "0" },
  { name: "Online loan w/ fee", principal: "10000", payment: "900", periods: "12", fee: "200" },
  { name: "Consumer 24 mo", principal: "24000", payment: "1120", periods: "24", fee: "0" },
];

/** Map Chinese error messages from irr.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/到手金额必须大于/.test(msg)) return "Amount received must be greater than 0";
  if (/每期还款必须大于/.test(msg)) return "Monthly payment must be greater than 0";
  if (/期数必须为正整数/.test(msg)) return "Number of periods must be a positive integer";
  if (/前置费用/.test(msg)) return "Upfront fee must be non-negative and less than the amount received";
  if (/总还款未超过/.test(msg)) return "Total repayment does not exceed amount received; rate cannot be solved";
  if (/至少需要两笔现金流/.test(msg)) return "At least two cash flows (disbursement and repayment) are required";
  if (/现金流必须同时包含/.test(msg)) return "Cash flows must include both income and expenditure";
  if (/合理利率区间内无解/.test(msg)) return "No solution found within a reasonable interest rate range";
  return msg;
}

export default function IrrToolEn() {
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
      <PageHeader badge="Finance" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <SectionCard
          title="Installment Parameters"
          subtitle="IRR = Internal Rate of Return — the true annualized cost regulators require lenders to disclose"
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
              <span className="text-xs text-neutral-500 mb-1.5 block">Amount received (CNY)</span>
              <input value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Monthly payment (CNY)</span>
              <input value={payment} onChange={(e) => setPayment(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Periods (months)</span>
              <input value={periods} onChange={(e) => setPeriods(e.target.value)} inputMode="numeric" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500 mb-1.5 block">Upfront fee (CNY, 0 if none)</span>
              <input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" className="w-full px-4 py-2.5 rounded-xl font-mono text-sm" />
            </label>
          </div>
        </SectionCard>

        {result === null ? (
          <Hint kind="error">Please enter valid parameters: amount received and monthly payment must be positive, periods must be a positive integer.</Hint>
        ) : !result.ok ? (
          <Hint kind="error">{enMsg(result.message)}</Hint>
        ) : (
          <SectionCard
            title="True Annualized Rate"
            aside={
              <CopyButton
                text={`Received ${p} CNY, paying ${m} CNY x ${n} periods${f > 0 ? `, upfront fee ${f} CNY` : ""}: True APR (IRR) ${pct(result.value.annualNominal)}, Effective annual rate ${pct(result.value.annualEffective)}, Total cost ${result.value.totalCost.toFixed(2)} CNY`}
                label="Copy results"
              />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="True APR (IRR x 12)" value={pct(result.value.annualNominal)} tone="accent" emphasis />
              <Stat label="Effective annual rate" value={pct(result.value.annualEffective)} />
              <Stat label="Total paid" value={result.value.totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })} unit="CNY" />
              <Stat label="Total cost" value={result.value.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} unit="CNY" tone={result.value.totalCost > 0 ? "warn" : "good"} />
            </div>

            {f > 0 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Badge tone="amber">Note</Badge>
                <span className="text-xs text-neutral-400">
                  The upfront fee of {f} CNY implies a nominal fee rate of about {pct(nominalFeeRate)}. Combined with monthly payments, the true annualized rate reaches {pct(result.value.annualNominal)} — always check IRR before borrowing, not just the advertised fee rate.
                </span>
              </div>
            )}
          </SectionCard>
        )}

        <Hint kind="info">
          A &quot;0.5% monthly fee&quot; over 12 periods looks like 6% per year, but because the outstanding principal shrinks each month while the fee stays fixed, the true annualized cost is roughly 10.9%. IRR makes all loans comparable.
        </Hint>
      </div>
    </>
  );
}
