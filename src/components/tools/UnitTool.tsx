"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { CopyButton, Hint, PageHeader, SectionCard, Segmented } from "@/components/ui";
import { UNIT_CATEGORIES, convertAll, fmtUnit, type UnitCategory } from "@/lib/unit";

const seo = findTool("unit")!;

/** 每个类别的默认源单位 */
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
  // 原始输入字符串：允许空 / 负数 / 中间态，解析失败时只提示不崩溃
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

  /** 点击卡片：把该单位设为新的源单位，输入框值变为该卡当前显示值 */
  const pickSource = (unitId: string) => {
    if (!valid) return;
    const hit = results.find((r) => r.unit.id === unitId);
    if (!hit || Number.isNaN(hit.value)) return;
    setFromId(unitId);
    setRaw(fmtUnit(hit.value));
  };

  return (
    <div>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard title="输入一个数值，全单位实时等值" subtitle="点击下方任意卡片即可切换源单位">
          <div className="overflow-x-auto no-scrollbar mb-5">
            <Segmented
              value={catId}
              onChange={changeCategory}
              options={UNIT_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
              ariaLabel="单位类别"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="输入数值，支持负数"
              aria-label="待换算数值"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
            />
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              aria-label="源单位"
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
              <Hint kind="warn">请输入合法数字（支持小数与负数），输入合法后自动恢复全部等值换算。</Hint>
            </div>
          )}
        </SectionCard>

        <SectionCard title={`${cat.name} · 全单位等值`} count={cat.units.length}>
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
                  title={`点击以「${unit.name}」作为源单位`}
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
                    {/* 阻止冒泡：复制不触发源单位切换 */}
                    <div className="shrink-0 -mt-1 -mr-1.5" onClick={(e) => e.stopPropagation()}>
                      <CopyButton text={copyText} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] font-mono text-neutral-600">
            纯本地换算 · 温度为精确公式非近似
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
