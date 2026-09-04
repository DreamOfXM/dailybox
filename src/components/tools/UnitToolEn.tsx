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

/** English category names (mirrors UNIT_CATEGORIES ids) */
const CAT_NAME_EN: Record<string, string> = {
  length: "Length",
  mass: "Weight",
  area: "Area",
  temperature: "Temperature",
  data: "Data",
};

/** English unit names keyed by unit id — matches src/lib/unit.ts exactly */
const UNIT_NAME_EN: Record<string, string> = {
  // Length
  mm: "Millimeter",
  cm: "Centimeter",
  m: "Meter",
  km: "Kilometer",
  in: "Inch",
  ft: "Foot",
  yd: "Yard",
  mi: "Mile",
  nmi: "Nautical mile",
  li: "li (500 m)",
  zhang: "zhang (3.33 m)",
  chi: "chi (0.33 m)",
  cun: "cun (3.33 cm)",
  // Mass
  mg: "Milligram",
  g: "Gram",
  kg: "Kilogram",
  t: "Tonne",
  oz: "Ounce",
  lb: "Pound",
  jin: "jin (500 g)",
  liang: "liang (50 g)",
  qian: "qian (5 g)",
  // Area
  mm2: "Square millimeter",
  cm2: "Square centimeter",
  m2: "Square meter",
  ha: "Hectare",
  km2: "Square kilometer",
  in2: "Square inch",
  ft2: "Square foot",
  mu: "mu (666.7 m²)",
  fen: "fen (66.7 m²)",
  qing: "qing (6.67 ha)",
  // Temperature
  c: "Celsius",
  f: "Fahrenheit",
  k: "Kelvin",
  r: "Rankine",
  // Data
  bit: "Bit",
  B: "Byte",
  KB: "KB",
  MB: "MB",
  GB: "GB",
  TB: "TB",
};

/** Look up the English display name for a unit; falls back to the CN name from the lib */
function enUnitName(id: string, fallback: string): string {
  return UNIT_NAME_EN[id] ?? fallback;
}

/** Look up the English category name; falls back to the CN name */
function enCatName(id: string, fallback: string): string {
  return CAT_NAME_EN[id] ?? fallback;
}

/** Traditional Chinese units carry hanzi symbols (里/丈/尺/寸) which must not leak into the EN UI */
function isCjkSymbol(symbol: string): boolean {
  return /[一-鿿]/.test(symbol);
}

/** Copy-friendly English label: "li (500 m)" -> "li" */
function enUnitShort(id: string, fallback: string): string {
  return enUnitName(id, fallback).split(" (")[0];
}

export default function UnitTool() {
  const [catId, setCatId] = useState<UnitCategory["id"]>("length");
  const [fromId, setFromId] = useState("m");
  // Raw input string: allows empty / negative / intermediate states; only warns on parse failure
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

  /** Click a card to set that unit as the new source unit and update the input value */
  const pickSource = (unitId: string) => {
    if (!valid) return;
    const hit = results.find((r) => r.unit.id === unitId);
    if (!hit || Number.isNaN(hit.value)) return;
    setFromId(unitId);
    setRaw(fmtUnit(hit.value));
  };

  return (
    <div>
      <PageHeader badge="Convert" title={seo.title} subtitle={seo.subtitle} tone="emerald" />

      <div className="space-y-6">
        <SectionCard title="Enter a value — all units update instantly" subtitle="Click any card below to switch the source unit">
          <div className="overflow-x-auto no-scrollbar mb-5">
            <Segmented
              value={catId}
              onChange={changeCategory}
              options={UNIT_CATEGORIES.map((c) => ({ value: c.id, label: enCatName(c.id, c.name) }))}
              ariaLabel="Unit category"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Enter a number (negatives supported)"
              aria-label="Value to convert"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
            />
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              aria-label="Source unit"
              className="sm:w-48 px-3 py-3 rounded-xl font-mono text-sm"
            >
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {enUnitName(u.id, u.name)}
                  {isCjkSymbol(u.symbol) ? "" : ` (${u.symbol})`}
                </option>
              ))}
            </select>
          </div>

          {!valid && (
            <div className="mt-3">
              <Hint kind="warn">Please enter a valid number (decimals and negatives supported). Conversions resume automatically once input is valid.</Hint>
            </div>
          )}
        </SectionCard>

        <SectionCard title={`${enCatName(cat.id, cat.name)} — All Units`} count={cat.units.length}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {results.map(({ unit, value }) => {
              const isSource = unit.id === fromId;
              const copyText = valid ? `${fmtUnit(value)} ${isCjkSymbol(unit.symbol) ? enUnitShort(unit.id, unit.name) : unit.symbol}` : "";
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
                  title={`Click to use "${enUnitName(unit.id, unit.name)}" as source unit`}
                  className={`card-hover cursor-pointer select-none text-left rounded-xl border p-4 ${
                    isSource
                      ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[11px] font-mono text-neutral-500 truncate">{enUnitName(unit.id, unit.name)}</span>
                        {isCjkSymbol(unit.symbol) ? null : (
                          <span className="text-[10px] font-mono text-neutral-600 shrink-0">{unit.symbol}</span>
                        )}
                      </div>
                      <div
                        className={`font-mono tabular-nums text-lg font-semibold break-all ${
                          isSource ? "text-emerald-400" : "text-neutral-200"
                        }`}
                      >
                        {fmtUnit(value)}
                      </div>
                    </div>
                    {/* Stop propagation: copy does not trigger source unit switch */}
                    <div className="shrink-0 -mt-1 -mr-1.5" onClick={(e) => e.stopPropagation()}>
                      <CopyButton text={copyText} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] font-mono text-neutral-600">
            Fully local conversion · Temperature uses exact formulas, not approximations
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
