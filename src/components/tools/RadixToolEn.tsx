"use client";

import { useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { parseRadix, toRadix, RADIX_DIGITS } from "@/lib/radix";
import { CopyButton, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("radix")!;

const BASES = [2, 8, 10, 16] as const;
type Base = (typeof BASES)[number];

const BASE_META: Record<Base, { label: string; name: string; hint: string }> = {
  2: { label: "BIN", name: "Binary", hint: "0 / 1" },
  8: { label: "OCT", name: "Octal", hint: "0-7" },
  10: { label: "DEC", name: "Decimal", hint: "0-9" },
  16: { label: "HEX", name: "Hex", hint: "0-9 a-f" },
};

const UINT32_LIMIT = 2n ** 32n;

/** Generate an error message when a card has invalid input (locates first illegal character) */
function describeInvalid(raw: string, base: Base): string {
  const name = BASE_META[base].name;
  let s = raw.trim();
  if (s === "") return `Please enter a ${name} number`;
  if (s.startsWith("-") || s.startsWith("+")) s = s.slice(1);
  const prefixes: Partial<Record<Base, string>> = { 2: "0b", 8: "0o", 16: "0x" };
  const p = prefixes[base];
  if (p && s.toLowerCase().startsWith(p)) s = s.slice(2);
  for (const ch of s) {
    const d = RADIX_DIGITS.indexOf(ch.toLowerCase());
    if (d < 0 || d >= base) return `Invalid ${name} character: ${ch}`;
  }
  return `"${raw.trim()}" is not a valid ${name} number`;
}

export default function RadixTool() {
  /** Raw input drafts per base */
  const [drafts, setDrafts] = useState<Record<Base, string>>({ 2: "", 8: "", 10: "", 16: "" });
  /** The card currently being edited: preserves raw input, other cards show converted result */
  const [active, setActive] = useState<Base | null>(null);
  /** Last valid value (other cards keep using it when current input is invalid) */
  const [value, setValue] = useState<bigint | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = (base: Base, raw: string) => {
    setDrafts((d) => ({ ...d, [base]: raw }));
    setActive(base);
    setTouched(true);
    const parsed = parseRadix(raw, base);
    if (parsed !== null) setValue(parsed);
    else if (raw.trim() === "") setValue(null); // Clear: also clears other cards
    // Invalid character: keeps last valid value, only this card shows error
  };

  /** Display value for a card: editing card shows raw input, others show converted result */
  const displayOf = (base: Base): string => {
    if (active === base) return drafts[base];
    return value !== null ? toRadix(value, base) : "";
  };

  const errorOf = (base: Base): string => {
    if (active !== base) return "";
    const raw = drafts[base];
    if (parseRadix(raw, base) !== null) return "";
    if (raw.trim() === "") return touched ? "Please enter a value" : "";
    return describeInvalid(raw, base);
  };

  /* ---------- Bit breakdown: 0 <= v < 2^32 ---------- */
  const showBits = value !== null && value >= 0n && value < UINT32_LIMIT;
  const setBits: Array<{ bit: number; weight: bigint }> = [];
  if (showBits && value !== null) {
    for (let i = 31; i >= 0; i--) {
      if ((value >> BigInt(i)) & 1n) setBits.push({ bit: i, weight: 1n << BigInt(i) });
    }
  }
  const bin32 = showBits && value !== null ? value.toString(2).padStart(32, "0") : "";

  return (
    <>
      <PageHeader badge="Dev" title={seo.title} subtitle={seo.subtitle} tone="amber" />

      <div className="space-y-6">
        {/* Four linked input cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {BASES.map((base) => {
            const meta = BASE_META[base];
            const shown = displayOf(base);
            const err = errorOf(base);
            const copyValue = value !== null ? toRadix(value, base) : "";
            return (
              <div
                key={base}
                className={`rounded-2xl border p-4 transition-colors ${
                  active === base && !err
                    ? "border-amber-500/30 bg-amber-500/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-amber-400">{meta.label}</span>
                    <span className="text-[11px] font-mono text-neutral-600">{meta.name}</span>
                  </div>
                  <CopyButton text={copyValue} label="Copy" />
                </div>
                <input
                  type="text"
                  value={shown}
                  onChange={(e) => handleChange(base, e.target.value)}
                  placeholder={meta.hint}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`${meta.name} input`}
                  className="w-full px-3 py-2.5 rounded-xl font-mono text-sm break-all"
                />
                {err && <p className="mt-1.5 text-xs text-red-400 font-mono">{err}</p>}
              </div>
            );
          })}
        </div>

        {value === null && touched && (
          <Hint kind="info">Enter a number in any card — the other three update in real time (supports arbitrarily large integers via BigInt)</Hint>
        )}

        {/* Bit breakdown: inspect bitmasks / protocol fields */}
        {showBits && value !== null && (
          <SectionCard title="Bit Breakdown" subtitle={`DEC ${value.toString()} · 32-bit view`}>
            <div className="space-y-4">
              {/* 32-bit binary string, grouped by 4 bits with spaces, set bits highlighted */}
              <div className="font-mono text-base sm:text-lg tracking-wide break-all leading-relaxed">
                {bin32.split("").map((ch, i) => (
                  <span key={i}>
                    <span className={ch === "1" ? "text-amber-400 font-bold" : "text-neutral-700"}>{ch}</span>
                    {(i + 1) % 4 === 0 && i !== 31 && <span className="text-neutral-800"> </span>}
                  </span>
                ))}
              </div>

              {/* Set bits: bit3(8) + bit1(2) */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 font-mono text-xs sm:text-sm text-neutral-300 break-all">
                <span className="text-neutral-600 mr-2">Set bits</span>
                {setBits.length === 0 ? (
                  <span className="text-neutral-600">None (value is 0)</span>
                ) : (
                  setBits.map((b, i) => (
                    <span key={b.bit}>
                      {i > 0 && <span className="text-neutral-600"> + </span>}
                      <span className="text-amber-400">bit{b.bit}</span>
                      <span className="text-neutral-500">({b.weight.toString()})</span>
                    </span>
                  ))
                )}
              </div>

              {/* Common mask readings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                {[
                  { k: "HEX", v: "0x" + value.toString(16) },
                  { k: "OCT", v: value.toString(8) },
                  { k: "Set bit count", v: String(setBits.length) },
                  { k: "Highest bit", v: setBits.length > 0 ? `bit${setBits[0].bit}` : "—" },
                ].map((it) => (
                  <div key={it.k} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                    <div className="text-neutral-600 mb-0.5">{it.k}</div>
                    <div className="text-neutral-300 break-all">{it.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
