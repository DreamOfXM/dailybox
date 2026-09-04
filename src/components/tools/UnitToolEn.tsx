"use client";

import { useMemo, useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";
import { UNIT_CATEGORIES, convertAll, fmtUnit, type UnitCategory } from "@/lib/unit";

const seo = findToolEn("unit")!;

/** Default source unit per category */
const DEFAULT_FROM: Record<UnitCategory["id"], string> = {
  length: "m",
  mass: "kg",
  area: "m2",
  temperature: "c",
  data: "MB",
};

export default function UnitTool() {
  const [catId, setCatId] = useState<UnitCategory["id"]>("length");
  const [fromId, setFromId] = useState("m");
  // OriginalInputstring：allow empty / negative / EN，EN
  const [raw, setRaw] = useState("1");

  const cat = UNIT_CATEGORIES.find((c) => c.id === catId)!;
  const parsed = Number(raw);
  const valid = raw.trim() !== "" && Number.isFinite(parsed);

  const results = useMemo(
    () => convertAll(cat, valid ? parsed : NaN, fromId),
    [cat, valid, parsed, fromId],
  );

  const changeCategory = (id: UnitCategory["id"]) => {
    setCatId(id);
    setFromId(DEFAULT_FROM[id]);
  };

  /** EN：EN，InputEN */
  const pickSource = (unitId: string) => {
    if (!valid) return;
    const hit = results.find((r) => r.unit.id === unitId);
    if (!hit || Number.isNaN(hit.value)) return;
    setFromId(unitId);
    setRaw(fmtUnit(hit.value));
  };

  return (
    <div>
      <PageHeader badge="EN" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard title="InputENcountEN，EN" subtitle="EN">
          <div className="overflow-x-auto no-scrollbar mb-5">
            <Segmented
              value={catId}
              onChange={changeCategory}
              options={UNIT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
              ariaLabel="EN"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="InputcountEN，ENnegative"
              aria-label="ENcountEN"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
            />
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              aria-label="EN"
              className="sm:w-48 px-3 py-3 rounded-xl font-mono text-sm"
            >
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}（{u.symbol}）
                </option>
              ))}
            </select>
          </div>

          {!valid && (
            <div className="mt-3">
              <Hint kind="warn">ENInputENcountEN（ENcountENnegative），InputENAllEN。</Hint>
            </div>
          )}
        </SectionCard>

        <SectionCard title={`${cat.name} · EN`} count={cat.units.length}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {results.map(({ unit, value }) => {
              const isSource = unit.id === fromId;
              const copyText = valid ? `${fmtUnit(value)} ${unit.symbol}` : "";
              return (
                <div
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => pickSource(unit.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pickSource(unit.id);
                    }
                  }}
                  title={`EN「${unit.name}」EN`}
                  className={`card-hover cursor-pointer select-none text-left rounded-xl border p-4 ${
                    isSource
                      ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[11px] font-mono text-neutral-500 truncate">{unit.name}</span>
                        <span className="text-[10px] font-mono text-neutral-600 shrink-0">{unit.symbol}</span>
                      </div>
                      <div
                        className={`font-mono tabular-nums text-lg font-semibold break-all ${
                          isSource ? "text-emerald-400" : "text-neutral-200"
                        }`}
                      >
                        {fmtUnit(value)}
                      </div>
                    </div>
                    {/* EN：CopyEN */}
                    <div className="shrink-0 -mt-1 -mr-1.5" onClick={(e) => e.stopPropagation()}>
                      <CopyButton text={copyText} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] font-mono text-neutral-600">
            EN · EN
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
