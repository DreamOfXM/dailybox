"use client";

import { useState } from "react";
import { findTool } from "@/lib/seo";
import { generateBatch, randomNumber } from "@/lib/uuid";
import { CopyButton, downloadFile, Field, Hint, NumberInput, PageHeader, SectionCard, Segmented, Toggle } from "@/components/ui";

const seo = findTool("uuid")!;

type Tab = "uuid" | "random";

export default function UuidTool() {
  const [tab, setTab] = useState<Tab>("uuid");

  /* ---------- UUID 页签 ---------- */
  const [version, setVersion] = useState<"4" | "7">("4");
  const [countStr, setCountStr] = useState("5");
  const [upper, setUpper] = useState(false);
  const [noDash, setNoDash] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidError, setUuidError] = useState("");

  /* ---------- 随机数页签 ---------- */
  const [minStr, setMinStr] = useState("1");
  const [maxStr, setMaxStr] = useState("100");
  const [decimalsStr, setDecimalsStr] = useState("0");
  const [numCountStr, setNumCountStr] = useState("10");
  const [numbers, setNumbers] = useState<string[]>([]);
  const [numError, setNumError] = useState("");

  const genUuids = () => {
    const n = Number(countStr);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setUuidError("数量需为 1-1000 的整数");
      return;
    }
    setUuidError("");
    // rng 缺省使用 crypto.getRandomValues（加密级随机源）
    setUuids(generateBatch(n, version === "4" ? 4 : 7, { upper, noDash }));
  };

  const genNumbers = () => {
    const min = Number(minStr);
    const max = Number(maxStr);
    const decimals = Number(decimalsStr);
    const n = Number(numCountStr);
    if (min > max) {
      setNumError("min 不能大于 max");
      return;
    }
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setNumError("数量需为 1-1000 的整数");
      return;
    }
    setNumError("");
    const d = Math.max(0, Math.floor(decimals || 0));
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      out.push(String(randomNumber({ min, max, decimals: d })));
    }
    setNumbers(out);
  };

  return (
    <>
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <Segmented<Tab>
          ariaLabel="选择生成类型"
          value={tab}
          onChange={setTab}
          options={[
            { value: "uuid", label: "UUID" },
            { value: "random", label: "随机数" },
          ]}
        />

        {tab === "uuid" ? (
          <>
            <SectionCard title="生成选项" subtitle="加密级随机源">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 mb-2">版本</div>
                    <Segmented<"4" | "7">
                      ariaLabel="UUID 版本"
                      value={version}
                      onChange={setVersion}
                      options={[
                        { value: "4", label: "v4 纯随机" },
                        { value: "7", label: "v7 时间有序" },
                      ]}
                    />
                  </div>
                  <Toggle checked={upper} onChange={setUpper} label="大写" />
                  <Toggle checked={noDash} onChange={setNoDash} label="去连字符" hint="32 位纯十六进制" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                  <div className="sm:w-44">
                    <Field label="数量" hint="1-1000" error={uuidError}>
                      <NumberInput value={countStr} onChange={setCountStr} suffix="个" invalid={!!uuidError} />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={genUuids}
                    className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-[var(--shadow-1)]"
                  >
                    生成
                  </button>
                </div>
              </div>
            </SectionCard>

            {uuids.length > 0 && (
              <SectionCard
                title="结果"
                count={uuids.length}
                aside={
                  <>
                    <CopyButton text={uuids.join("\n")} label="复制全部" />
                    <button
                      type="button"
                      onClick={() => downloadFile("uuids.txt", uuids.join("\n"), "text/plain")}
                      className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
                    >
                      下载 .txt
                    </button>
                  </>
                }
              >
                <div className="max-h-96 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                  {uuids.map((u, i) => (
                    <div key={i} className="font-mono text-xs text-neutral-300 tabular-nums break-all leading-relaxed">
                      <span className="text-neutral-700 mr-2 select-none">{String(i + 1).padStart(3, " ")}.</span>
                      {u}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        ) : (
          <>
            <SectionCard title="随机数选项" subtitle="区间含两端 · 加密级随机源">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <Field label="最小值 min" hint="含">
                  <NumberInput value={minStr} onChange={setMinStr} />
                </Field>
                <Field label="最大值 max" hint="含">
                  <NumberInput value={maxStr} onChange={setMaxStr} invalid={Number(minStr) > Number(maxStr)} />
                </Field>
                <Field label="小数位" hint="0 = 整数">
                  <NumberInput value={decimalsStr} onChange={setDecimalsStr} suffix="位" />
                </Field>
                <Field label="数量" hint="1-1000">
                  <NumberInput value={numCountStr} onChange={setNumCountStr} suffix="个" />
                </Field>
              </div>
              {Number(minStr) > Number(maxStr) ? (
                <Hint kind="error">min 不能大于 max：当前 min={minStr}，max={maxStr}</Hint>
              ) : numError ? (
                <Hint kind="error">{numError}</Hint>
              ) : null}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={genNumbers}
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-[var(--shadow-1)]"
                >
                  生成
                </button>
              </div>
            </SectionCard>

            {numbers.length > 0 && (
              <SectionCard title="结果" count={numbers.length} aside={<CopyButton text={numbers.join("\n")} label="复制全部" />}>
                <div className="max-h-96 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                  {numbers.map((v, i) => (
                    <div key={i} className="font-mono text-sm text-neutral-300 tabular-nums leading-relaxed">
                      <span className="text-neutral-700 mr-2 select-none">{String(i + 1).padStart(3, " ")}.</span>
                      {v}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </>
  );
}
