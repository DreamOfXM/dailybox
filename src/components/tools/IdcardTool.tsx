"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { upgrade15, validateIdCard, type IdInfo } from "@/lib/idcard";
import type { TryResult } from "@/lib/base64";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findTool("idcard")!;

/** 校验位合法的示例号（仅供演示，不对应真实公民身份） */
const SAMPLE_ID = "11010519491231002X";

interface ParseOutcome {
  /** 15 位老号升级后的 18 位号（仅 15 位输入时有值） */
  upgraded: string | null;
  /** 对（升级后的）18 位号的校验结果 */
  check: TryResult<IdInfo>;
}

export default function IdcardTool() {
  const [id, setId] = useState("");
  const trimmed = id.trim();

  const outcome = useMemo<ParseOutcome | null>(() => {
    if (!trimmed) return null;
    if (trimmed.length === 15) {
      const up = upgrade15(trimmed);
      if (!up) {
        return {
          upgraded: null,
          check: { ok: false, message: "15 位老号格式非法或生日不真实，无法升级为 18 位" },
        };
      }
      return { upgraded: up, check: validateIdCard(up) };
    }
    return { upgraded: null, check: validateIdCard(trimmed) };
  }, [trimmed]);

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        {/* 隐私说明置顶：这是本工具的第一卖点 */}
        <Hint kind="info">全程浏览器本地运算，无任何上传与统计，可放心使用。</Hint>

        {/* 输入 */}
        <SectionCard
          title="身份证号"
          subtitle="GB 11643-1999 校验位算法"
          aside={
            <button
              type="button"
              onClick={() => setId(SAMPLE_ID)}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="18 位身份证号，支持 15 位老号"
            autoComplete="off"
            spellCheck={false}
            aria-label="身份证号"
            className="w-full px-4 py-3 rounded-xl font-mono text-[15px] tracking-wider"
          />
          <p className="mt-2 text-[11px] font-mono text-neutral-600">
            示例号 {SAMPLE_ID} 仅用于演示校验流程，不对应任何真实身份；本工具不提供任何号码生成功能。
          </p>
        </SectionCard>

        {/* 15 位升级展示 */}
        {outcome?.upgraded && (
          <SectionCard
            title="15 位老号升级"
            subtitle="生日位前补 19 · 重算校验位"
            aside={<CopyButton text={outcome.upgraded} label="复制 18 位号" />}
          >
            <code className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-base text-neutral-200 tracking-wider break-all">
              {outcome.upgraded}
            </code>
          </SectionCard>
        )}

        {/* 校验结果 */}
        {outcome && (
          <SectionCard
            title="校验结果"
            subtitle="长度 · 字符 · 省份 · 生日 · 校验位 逐项检查"
            aside={
              outcome.check.ok ? (
                <Badge tone="emerald">校验通过</Badge>
              ) : (
                <Badge tone="rose">校验不通过</Badge>
              )
            }
          >
            {outcome.check.ok ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="省份" value={outcome.check.value.province} />
                <Stat label="出生日期" value={outcome.check.value.birth} />
                <Stat label="性别" value={outcome.check.value.sex} />
                <Stat label="年龄" value={outcome.check.value.age} unit="周岁" tone="accent" />
              </div>
            ) : (
              <Hint kind="error">{outcome.check.message}</Hint>
            )}
          </SectionCard>
        )}

        {/* 空态引导 */}
        {!outcome && (
          <Hint kind="info">输入身份证号或点击「填入示例」开始校验；15 位老号会自动升级为 18 位后再校验。</Hint>
        )}
      </div>
    </>
  );
}
