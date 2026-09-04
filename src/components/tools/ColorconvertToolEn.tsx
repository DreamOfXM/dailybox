"use client";

import { useState } from "react";
import { findToolEn } from "@/lib/seo-en";
import {
  hexToRgb,
  hslToRgb,
  hslToString,
  parseHsl,
  parseRgb,
  rgbToHex,
  rgbToHsl,
  rgbToString,
  type Rgb,
} from "@/lib/colorconvert";
import { CopyButton, Field, Hint, PageHeader, SectionCard } from "@/components/ui";

const seo = findToolEn("colorconvert")!;

const EXAMPLE: Rgb = { r: 139, g: 92, b: 246 };

const PRESETS: Array<{ hex: string; name: string }> = [
  { hex: "#EF4444", name: "Red" },
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#10B981", name: "Emerald" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#EC4899", name: "Pink" },
];

export default function ColorconvertToolEn() {
  const [rgb, setRgb] = useState<Rgb>(EXAMPLE);
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [rgbDraft, setRgbDraft] = useState<string | null>(null);
  const [hslDraft, setHslDraft] = useState<string | null>(null);

  const hexStr = rgbToHex(rgb.r, rgb.g, rgb.b);
  const rgbStr = rgbToString(rgb);
  const hslStr = hslToString(rgbToHsl(rgb.r, rgb.g, rgb.b));

  const hexInvalid = hexDraft !== null && !hexToRgb(hexDraft).ok;
  const rgbInvalid = rgbDraft !== null && !parseRgb(rgbDraft).ok;
  const hslInvalid = hslDraft !== null && !parseHsl(hslDraft).ok;

  const setColor = (next: Rgb) => setRgb(next);

  const onHexChange = (v: string) => {
    setHexDraft(v);
    const res = hexToRgb(v);
    if (res.ok) setColor(res.value);
  };
  const onRgbChange = (v: string) => {
    setRgbDraft(v);
    const res = parseRgb(v);
    if (res.ok) setColor(res.value);
  };
  const onHslChange = (v: string) => {
    setHslDraft(v);
    const res = parseHsl(v);
    if (res.ok) setColor(hslToRgb(res.value.h, res.value.s, res.value.l));
  };
  const onPicker = (v: string) => {
    const res = hexToRgb(v);
    if (!res.ok) return;
    setColor(res.value);
    setHexDraft(null);
    setRgbDraft(null);
    setHslDraft(null);
  };

  const applyHex = (hex: string) => {
    const res = hexToRgb(hex);
    if (res.ok) onPicker(hex);
  };

  const luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  const onColorText = luma > 160 ? "text-black/70" : "text-white/85";

  const inputCls = "flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]";

  return (
    <div>
      <PageHeader badge="Design" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        <SectionCard title="Preview" subtitle="Edit any field below — the swatch updates live">
          <div
            className="relative h-40 rounded-xl border border-white/[0.08] overflow-hidden transition-colors"
            style={{ backgroundColor: hexStr }}
            role="img"
            aria-label={`Current color ${hexStr}`}
          >
            <span className={`absolute left-4 bottom-3 font-mono text-sm ${onColorText}`}>{hexStr}</span>
            <span className={`absolute right-4 bottom-3 font-mono text-xs ${onColorText}`}>
              {rgb.r}, {rgb.g}, {rgb.b}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <input
              type="color"
              value={hexStr.toLowerCase()}
              onChange={(e) => onPicker(e.target.value)}
              aria-label="Color picker"
              className="w-12 h-10 shrink-0 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
            />
            <div className="flex items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.name}
                  onClick={() => applyHex(p.hex)}
                  className={`w-7 h-7 rounded-full border transition-transform hover:scale-110 ${
                    hexStr === p.hex ? "border-white" : "border-white/10"
                  }`}
                  style={{ backgroundColor: p.hex }}
                  aria-label={`Preset color ${p.name} ${p.hex}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-neutral-600">Use the picker or click a preset swatch</span>
          </div>
        </SectionCard>

        <SectionCard title="Format sync" subtitle="HEX / RGB / HSL — edit any one, the rest update">
          <div className="space-y-4">
            <div>
              <Field label="HEX" hint="#RRGGBB">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hexDraft ?? hexStr}
                    onChange={(e) => onHexChange(e.target.value)}
                    onBlur={() => setHexDraft(null)}
                    placeholder="#8B5CF6"
                    aria-label="HEX color value"
                    className={inputCls}
                  />
                  <CopyButton text={hexStr} />
                </div>
              </Field>
              {hexInvalid && (
                <div className="mt-2">
                  <Hint kind="error">Invalid HEX format: only #RGB or #RRGGBB are supported (hex digits 0-9 A-F).</Hint>
                </div>
              )}
            </div>

            <div>
              <Field label="RGB" hint="rgb(r, g, b) · 0-255">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rgbDraft ?? rgbStr}
                    onChange={(e) => onRgbChange(e.target.value)}
                    onBlur={() => setRgbDraft(null)}
                    placeholder="rgb(139, 92, 246)"
                    aria-label="RGB color value"
                    className={inputCls}
                  />
                  <CopyButton text={rgbStr} />
                </div>
              </Field>
              {rgbInvalid && (
                <div className="mt-2">
                  <Hint kind="error">Invalid RGB format: requires 3 integers from 0 to 255, e.g. rgb(139, 92, 246).</Hint>
                </div>
              )}
            </div>

            <div>
              <Field label="HSL" hint="hsl(h, s%, l%) · h 0-360">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hslDraft ?? hslStr}
                    onChange={(e) => onHslChange(e.target.value)}
                    onBlur={() => setHslDraft(null)}
                    placeholder="hsl(258, 90%, 66%)"
                    aria-label="HSL color value"
                    className={inputCls}
                  />
                  <CopyButton text={hslStr} />
                </div>
              </Field>
              {hslInvalid && (
                <div className="mt-2">
                  <Hint kind="error">Invalid HSL format: hue must be 0-360, saturation and lightness must be percentages (0-100%), e.g. hsl(258, 90%, 66%).</Hint>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <Hint kind="info">
          HEX is ideal for CSS and config files; RGB shows the three color channels directly; HSL matches human
          perception, making it easier to adjust lightness (l) and saturation (s). Invalid input is preserved while you
          type and normalized on blur.
        </Hint>
      </div>
    </div>
  );
}
