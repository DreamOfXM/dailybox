"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { toRmbUpper } from "@/lib/rmb";
import { AssumptionNote, CopyButton, Field, Hint, NumberInput, PageHeader, SectionCard } from "@/components/ui";

const seo = findTool("rmb")!;

/** 快捷示例金额（点击填入） */
const QUICK = ["1002.30", "0.05", "10", "123456789.12", "100000000"];

export default function RmbTool() {
  const [amount, setAmount] = useState("1002.30");

  // NumberInput 只会回传有限数字字符串，这里仍交给 toRmbUpper 统一兜底 NaN / 超限
  const result = useMemo(() => toRmbUpper(Number(amount)), [amount]);

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 金额输入 */}
        <SectionCard title="金额" subtitle="输入即刻转换 · 支持负数与超大金额">
          <Field label="金额" hint="元">
            <NumberInput value={amount} onChange={setAmount} suffix="元" placeholder="如 1002.30" />
          </Field>

          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                  amount === q
                    ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                    : "text-neutral-400 border-white/[0.06] hover:border-white/20 hover:text-white"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 大写结果 */}
        <SectionCard
          title="人民币大写"
          subtitle="财务规范 · 开票报销可直接使用"
          aside={result.ok ? <CopyButton text={result.value} label="复制" /> : undefined}
        >
          {result.ok ? (
            <p
              className="text-2xl sm:text-3xl font-semibold text-emerald-300 leading-snug break-all font-mono"
              aria-live="polite"
            >
              {result.value}
            </p>
          ) : (
            <Hint kind="error">{result.message}</Hint>
          )}
        </SectionCard>

        {/* 计算口径透明 */}
        <AssumptionNote
          items={[
            { k: "精度", v: "四舍五入到分（整数分运算，无浮点误差）" },
            { k: "「整」字", v: "角后无分时补「整」，如 10 元 → 壹拾元整" },
            { k: "金额上限", v: "整数部分须小于 1e13 元（10 万亿元），超出拒绝转换" },
            { k: "负数", v: "加「负」前缀，如 -1.5 → 负壹元伍角整" },
            { k: "零的处理", v: "组内零折叠、组尾零省略，如 1002.30 → 壹仟零贰元叁角整" },
          ]}
        />
      </div>
    </>
  );
}
