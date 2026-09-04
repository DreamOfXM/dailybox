"use client";

import { useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { generateBatch, randomNumber } from "@/lib/uuid";
import { CopyButton, downloadFile, Field, Hint, NumberInput, PageHeader, SectionCard, Segmented, Toggle } from "@/components/ui";

const seo = findToolEn("uuid")!;

type Tab = "uuid" | "random";

export default function UuidTool() {
  const [tab, setTab] = useState<Tab>("uuid");

  /* ---------- UUID Tab ---------- */
  const [version, setVersion] = useState<"4" | "7">("4");
  const [countStr, setCountStr] = useState("5");
  const [upper, setUpper] = useState(false);
  const [noDash, setNoDash] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidError, setUuidError] = useState("");

  /* ---------- RandomTab ---------- */
  const [minStr, setMinStr] = useState("1");
  const [maxStr, setMaxStr] = useState("100");
  const [decimalsStr, setDecimalsStr] = useState("0");
  const [numCountStr, setNumCountStr] = useState("10");
  const [numbers, setNumbers] = useState<string[]>([]);
  const [numError, setNumError] = useState("");

  const genUuids = () => {
    const n = Number(countStr);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setUuidError("Count must be 1-1000 integer");
      return;
    }
    setUuidError("");
    // rng default crypto.getRandomValues（EN）
    setUuids(generateBatch(n, version === "4" ? 4 : 7, { upper, noDash }));
  };

  const genNumbers = () => {
    const min = Number(minStr);
    const max = Number(maxStr);
    const decimals = Number(decimalsStr);
    const n = Number(numCountStr);
    if (min > max) {
      setNumError("min EN max");
      return;
    }
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setNumError("Count must be 1-1000 integer");
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
      <PageHeader badge="EN" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <Segmented<Tab>
          ariaLabel="EN"
          value={tab}
          onChange={setTab}
          options={[
            { value: "uuid", label: "UUID" },
            { value: "random", label: "Random" },
          ]}
        />

        {tab === "uuid" ? (
          <>
            <SectionCard title="ENOptions" subtitle="EN">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 mb-2">EN</div>
                    <Segmented<"4" | "7">
                      ariaLabel="UUID EN"
                      value={version}
                      onChange={setVersion}
                      options={[
                        { value: "4", label: "v4 EN" },
                        { value: "7", label: "v7 EN" },
                      ]}
                    />
                  </div>
                  <Toggle checked={upper} onChange={setUpper} label="Uppercase" />
                  <Toggle checked={noDash} onChange={setNoDash} label="EN" hint="32 ENHex" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                  <div className="sm:w-44">
                    <Field label="countEN" hint="1-1000" error={uuidError}>
                      <NumberInput value={countStr} onChange={setCountStr} suffix="EN" invalid={!!uuidError} />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={genUuids}
                    className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-[var(--shadow-1)]"
                  >
                    EN
                  </button>
                </div>
              </div>
            </SectionCard>

            {uuids.length > 0 && (
              <SectionCard
                title="Result"
                count={uuids.length}
                aside={
                  <>
                    <CopyButton text={uuids.join("\n")} label="CopyAll" />
                    <button
                      type="button"
                      onClick={() => downloadFile("uuids.txt", uuids.join("\n"), "text/plain")}
                      className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
                    >
                      Download .txt
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
            <SectionCard title="RandomOptions" subtitle="EN · EN">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <Field label="EN min" hint="EN">
                  <NumberInput value={minStr} onChange={setMinStr} />
                </Field>
                <Field label="EN max" hint="EN">
                  <NumberInput value={maxStr} onChange={setMaxStr} invalid={Number(minStr) > Number(maxStr)} />
                </Field>
                <Field label="ENcountEN" hint="0 = ENcount">
                  <NumberInput value={decimalsStr} onChange={setDecimalsStr} suffix="EN" />
                </Field>
                <Field label="countEN" hint="1-1000">
                  <NumberInput value={numCountStr} onChange={setNumCountStr} suffix="EN" />
                </Field>
              </div>
              {Number(minStr) > Number(maxStr) ? (
                <Hint kind="error">min EN max：EN min={minStr}，max={maxStr}</Hint>
              ) : numError ? (
                <Hint kind="error">{numError}</Hint>
              ) : null}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={genNumbers}
                  className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-[var(--shadow-1)]"
                >
                  EN
                </button>
              </div>
            </SectionCard>

            {numbers.length > 0 && (
              <SectionCard title="Result" count={numbers.length} aside={<CopyButton text={numbers.join("\n")} label="CopyAll" />}>
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
