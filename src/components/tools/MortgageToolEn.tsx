"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
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

const seo = findToolEn("mortgage")!;

const YEARS = ["10", "15", "20", "25", "30"] as const;
type YearStr = (typeof YEARS)[number];

const METHOD_NAME: Record<Method, string> = {
  installment: "Annuity (equal monthly)",
  principal: "Equal principal",
};

/** Amount display: thousands separator + two decimals */
const money = (n: number): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Map Chinese error messages from mortgage.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/贷款总额必须大于/.test(msg)) return "Loan amount must be greater than 0";
  if (/年利率不能为负数/.test(msg)) return "Annual interest rate cannot be negative";
  if (/还款期数必须是正整数（月）/.test(msg)) return "Repayment periods must be a positive integer (months)";
  if (/提前还款期数必须是正整数$/.test(msg)) return "Prepayment period must be a positive integer";
  if (/提前还款期数必须小于总期数/.test(msg)) return "Prepayment period must be less than total periods";
  if (/提前还款金额必须大于/.test(msg)) return "Prepayment amount must be greater than 0";
  if (/提前还款金额不能超过/.test(msg)) return "Prepayment amount cannot exceed remaining balance after that period";
  if (/新还款期数必须是正整数/.test(msg)) return "New repayment term must be a positive integer (months)";
  return msg;
}

/** Comparison card row */
function Row({ label, value, tone = "text-neutral-200" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] font-mono text-neutral-500 shrink-0">{label}</span>
      <span className={`font-mono tabular-nums text-sm ${tone}`}>{value}</span>
    </div>
  );
}

export default function MortgageToolEn() {
  /* ---------- Input state (keep raw strings so invalid input shows hint instead of crashing) ---------- */
  const [totalStr, setTotalStr] = useState("100"); // 10k CNY
  const [years, setYears] = useState<YearStr>("30");
  const [rateStr, setRateStr] = useState("4.9"); // %

  const [tableMethod, setTableMethod] = useState<Method>("installment");
  const [showAll, setShowAll] = useState(false);

  // Prepayment inputs
  const [periodStr, setPeriodStr] = useState("60");
  const [prepayStr, setPrepayStr] = useState("20"); // 10k CNY
  const [newMonthsStr, setNewMonthsStr] = useState(""); // empty = keep remaining periods

  /* ---------- Parse base parameters ---------- */
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

  /* ---------- Annuity vs Equal-principal summary comparison ---------- */
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

  /* ---------- Period-by-period amortization schedule ---------- */
  const rows = useMemo(() => {
    if (!baseValid) return [];
    try {
      return schedule(totalWan * 10000, ratePct / 100, months, tableMethod);
    } catch {
      return [];
    }
  }, [baseValid, totalWan, ratePct, months, tableMethod]);
  const visibleRows = showAll ? rows : rows.slice(0, 12);

  /* ---------- Prepayment estimate ---------- */
  const prepay = useMemo(() => {
    if (!baseValid) return { ok: false as const, message: "Please enter valid loan parameters first." };
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
      return { ok: false as const, message: e instanceof Error ? enMsg(e.message) : "Invalid prepayment parameters." };
    }
  }, [baseValid, totalWan, ratePct, months, tableMethod, periodStr, prepayStr, newMonthsStr]);

  const methodOptions = (Object.keys(METHOD_NAME) as Method[]).map((m) => ({
    value: m,
    label: METHOD_NAME[m],
  }));

  return (
    <div>
      <PageHeader badge="Finance" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* Loan parameters */}
        <SectionCard title="Loan Parameters" subtitle="All results update in real time">
          <div className="grid gap-4">
            <Field label="Loan amount" hint="x 10,000 CNY">
              <NumberInput value={totalStr} onChange={setTotalStr} suffix="wan" placeholder="e.g. 100" invalid={totalWan <= 0} />
            </Field>

            <Field label="Term (years)">
              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  value={years}
                  onChange={setYears}
                  options={YEARS.map((y) => ({ value: y, label: `${y} yr` }))}
                  ariaLabel="Loan term"
                />
              </div>
            </Field>

            <Field label="Interest rate (annual)" hint="% · decimals allowed, 0 = interest-free">
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rateStr}
                  onChange={(e) => setRateStr(e.target.value)}
                  placeholder="e.g. 4.9"
                  aria-label="Annual interest rate (%)"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px] pr-10"
                />
                <span className="absolute right-4 text-xs font-mono text-neutral-600 pointer-events-none">%</span>
              </div>
            </Field>
          </div>

          {!baseValid && (
            <div className="mt-4">
              <Hint kind="warn">Please enter valid parameters: loan amount must be greater than 0, annual rate must be a non-negative number.</Hint>
            </div>
          )}
        </SectionCard>

        {/* Two-method comparison */}
        {compare && (
          <SectionCard
            title="Annuity vs Equal Principal"
            subtitle={`Loan ${totalWan.toLocaleString("en-US")} wan · ${years} yr (${months} periods) · Rate ${rateStr}%`}
            aside={
              savedByPrincipal > 0 ? (
                <Badge tone="emerald">Equal principal saves {money(savedByPrincipal)} in interest</Badge>
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
                      {isPrincipal && <Badge tone="emerald">Lower total interest</Badge>}
                    </div>
                    <div className="mb-3">
                      <div className="text-[11px] font-mono text-neutral-500 mb-1">First month payment</div>
                      <div className={`font-mono tabular-nums text-2xl font-semibold ${isPrincipal ? "text-emerald-300" : "text-blue-300"}`}>
                        {money(s.monthlyFirst)}
                        <span className="text-xs text-neutral-500 ml-1 font-normal">CNY</span>
                      </div>
                    </div>
                    <Row label="Last month payment" value={`${money(s.monthlyLast)} CNY`} />
                    <Row label="Total interest" value={`${money(s.totalInterest)} CNY`} tone={isPrincipal ? "text-emerald-300" : "text-neutral-200"} />
                    <Row label="Total payment" value={`${money(s.totalPayment)} CNY`} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Amortization schedule */}
        {baseValid && rows.length > 0 && (
          <SectionCard
            title="Amortization Schedule"
            subtitle={`${METHOD_NAME[tableMethod]} · Amounts in CNY`}
            count={rows.length}
            aside={
              <Segmented value={tableMethod} onChange={(m) => setTableMethod(m)} options={methodOptions} ariaLabel="Repayment method" />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono tabular-nums min-w-[520px]">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/[0.08]">
                    <th className="py-2 pr-2 text-left font-normal">Period</th>
                    <th className="py-2 px-2 text-right font-normal">Payment</th>
                    <th className="py-2 px-2 text-right font-normal">Principal</th>
                    <th className="py-2 px-2 text-right font-normal">Interest</th>
                    <th className="py-2 pl-2 text-right font-normal">Balance</th>
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
                {showAll ? "Collapse" : `Show all ${rows.length} periods`}
              </button>
            </div>
          </SectionCard>
        )}

        {/* Prepayment estimate */}
        {baseValid && (
          <SectionCard
            title="Prepayment Estimate"
            subtitle={`Recalculated under current method (${METHOD_NAME[tableMethod]}) at the original rate`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Prepay after period" hint={`1 – ${months - 1}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={periodStr}
                  onChange={(e) => setPeriodStr(e.target.value)}
                  placeholder="e.g. 60"
                  aria-label="Prepay after which period"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
              <Field label="Prepayment amount" hint="x 10,000 CNY">
                <NumberInput value={prepayStr} onChange={setPrepayStr} suffix="wan" placeholder="e.g. 20" />
              </Field>
              <Field label="New term (periods)" hint="Leave empty = keep remaining periods">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={newMonthsStr}
                  onChange={(e) => setNewMonthsStr(e.target.value)}
                  placeholder={`Default ${months - (Number(periodStr) > 0 ? Math.min(Math.floor(Number(periodStr)), months - 1) : 0)}`}
                  aria-label="New repayment term (months)"
                  className="w-full px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </Field>
            </div>

            <div className="mt-4">
              {prepay.ok ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Stat label="New monthly (first)" value={money(prepay.newMonthly)} unit="CNY" tone="accent" emphasis />
                    <Stat label="Interest saved" value={money(prepay.savedInterest)} unit="CNY" tone="good" emphasis />
                    <Stat label="Remaining balance after prepay" value={money(prepay.remainingAfter)} unit="CNY" />
                  </div>
                  <p className="mt-3 text-[11px] font-mono text-neutral-600">
                    Lump-sum prepayment after period {periodStr}. Remaining balance recalculated under {METHOD_NAME[tableMethod]} over {prepay.targetMonths} periods.
                  </p>
                </>
              ) : (
                <Hint kind="error">{prepay.message}</Hint>
              )}
            </div>
          </SectionCard>
        )}

        {/* Calculation methodology */}
        <AssumptionNote
          items={[
            { k: "Monthly rate", v: "Annual rate / 12, compounded monthly, no intermediate rounding" },
            { k: "Annuity", v: "Payment = P*r*(1+r)^n / ((1+r)^n - 1), fixed each month" },
            { k: "Equal principal", v: "Monthly principal = P / n, interest on remaining balance, payment decreases" },
            { k: "Final period", v: "Last period uses exact remaining balance to zero out principal" },
            { k: "Prepayment", v: "Same method & rate applied to new balance; interest saved = original total - paid - new total" },
          ]}
        />

        <p className="text-[11px] font-mono text-neutral-600">Results are for reference only. Actual terms depend on your lender.</p>
      </div>
    </div>
  );
}
