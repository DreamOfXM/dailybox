"use client";

import { useState } from "react";
import { findTool } from "@/lib/seo";
import { parseRadix, toRadix, RADIX_DIGITS } from "@/lib/radix";
import { CopyButton, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findTool("radix")!;

const BASES = [2, 8, 10, 16] as const;
type Base = (typeof BASES)[number];

const BASE_META: Record<Base, { label: string; name: string; hint: string }> = {
  2: { label: "BIN", name: "二进制", hint: "0 / 1" },
  8: { label: "OCT", name: "八进制", hint: "0-7" },
  10: { label: "DEC", name: "十进制", hint: "0-9" },
  16: { label: "HEX", name: "十六进制", hint: "0-9 a-f" },
};

const UINT32_LIMIT = 2n ** 32n;

/** 生成某卡输入非法时的中文错误提示（定位第一个非法字符） */
function describeInvalid(raw: string, base: Base): string {
  const name = BASE_META[base].name;
  let s = raw.trim();
  if (s === "") return `请输入${name}数`;
  if (s.startsWith("-") || s.startsWith("+")) s = s.slice(1);
  const prefixes: Partial<Record<Base, string>> = { 2: "0b", 8: "0o", 16: "0x" };
  const p = prefixes[base];
  if (p && s.toLowerCase().startsWith(p)) s = s.slice(2);
  for (const ch of s) {
    const d = RADIX_DIGITS.indexOf(ch.toLowerCase());
    if (d < 0 || d >= base) return `包含${name}非法字符: ${ch}`;
  }
  return `「${raw.trim()}」不是合法的${name}数`;
}

export default function RadixTool() {
  /** 各卡用户原始输入草稿 */
  const [drafts, setDrafts] = useState<Record<Base, string>>({ 2: "", 8: "", 10: "", 16: "" });
  /** 正在编辑的卡：保留原始输入，其余卡显示换算结果 */
  const [active, setActive] = useState<Base | null>(null);
  /** 最近一次有效值（非法输入时其余卡沿用） */
  const [value, setValue] = useState<bigint | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = (base: Base, raw: string) => {
    setDrafts((d) => ({ ...d, [base]: raw }));
    setActive(base);
    setTouched(true);
    const parsed = parseRadix(raw, base);
    if (parsed !== null) setValue(parsed);
    else if (raw.trim() === "") setValue(null); // 清空：其余卡一并清空
    // 非法字符：保留上次有效值，仅该卡报错
  };

  /** 某卡的当前展示值：编辑中的卡显示原始输入，其余卡显示换算结果 */
  const displayOf = (base: Base): string => {
    if (active === base) return drafts[base];
    return value !== null ? toRadix(value, base) : "";
  };

  const errorOf = (base: Base): string => {
    if (active !== base) return "";
    const raw = drafts[base];
    if (parseRadix(raw, base) !== null) return "";
    if (raw.trim() === "") return touched ? "请输入数值" : "";
    return describeInvalid(raw, base);
  };

  /* ---------- 位分解：0 ≤ v < 2^32 ---------- */
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
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="amber" />

      <div className="space-y-6">
        {/* 四卡联动输入 */}
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
                  <CopyButton text={copyValue} label="复制" />
                </div>
                <input
                  type="text"
                  value={shown}
                  onChange={(e) => handleChange(base, e.target.value)}
                  placeholder={meta.hint}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`${meta.name}输入`}
                  className="w-full px-3 py-2.5 rounded-xl font-mono text-sm break-all"
                />
                {err && <p className="mt-1.5 text-xs text-red-400 font-mono">{err}</p>}
              </div>
            );
          })}
        </div>

        {value === null && touched && (
          <Hint kind="info">在任意一张卡片输入数字，其余三张实时显示等值（支持超大整数，BigInt 无损）</Hint>
        )}

        {/* 位分解：看位掩码 / 协议字段 */}
        {showBits && value !== null && (
          <SectionCard title="位分解" subtitle={`DEC ${value.toString()} · 32 位视角`}>
            <div className="space-y-4">
              {/* 32 位二进制串，每 4 位一组空格分隔，置 1 的位高亮 */}
              <div className="font-mono text-base sm:text-lg tracking-wide break-all leading-relaxed">
                {bin32.split("").map((ch, i) => (
                  <span key={i}>
                    <span className={ch === "1" ? "text-amber-400 font-bold" : "text-neutral-700"}>{ch}</span>
                    {(i + 1) % 4 === 0 && i !== 31 && <span className="text-neutral-800"> </span>}
                  </span>
                ))}
              </div>

              {/* 置 1 的位：bit3(8) + bit1(2) */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 font-mono text-xs sm:text-sm text-neutral-300 break-all">
                <span className="text-neutral-600 mr-2">置 1 的位</span>
                {setBits.length === 0 ? (
                  <span className="text-neutral-600">无（值为 0）</span>
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

              {/* 常用掩码读数 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                {[
                  { k: "HEX", v: "0x" + value.toString(16) },
                  { k: "OCT", v: value.toString(8) },
                  { k: "置 1 位数", v: String(setBits.length) },
                  { k: "最高位", v: setBits.length > 0 ? `bit${setBits[0].bit}` : "—" },
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
