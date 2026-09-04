"use client";

import { useState } from "react";
import { findTool } from "@/lib/seo";
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

const seo = findTool("colorconvert")!;

/** 默认示例色（紫，与工具主题呼应） */
const EXAMPLE: Rgb = { r: 139, g: 92, b: 246 };

/** 快捷预设色板 */
const PRESETS: Array<{ hex: string; name: string }> = [
  { hex: "#EF4444", name: "红" },
  { hex: "#F59E0B", name: "琥珀" },
  { hex: "#10B981", name: "翡翠" },
  { hex: "#3B82F6", name: "蓝" },
  { hex: "#8B5CF6", name: "紫" },
  { hex: "#EC4899", name: "粉" },
];

export default function ColorconvertTool() {
  // 当前颜色（唯一事实源），三个输入框为草稿态：编辑中保留用户原文，合法即同步，失焦归一化
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
  /** 原生取色器返回合法 #rrggbb，直接同步并清空所有草稿 */
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

  // 色块上的文字对比：按亮度选黑/白
  const luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  const onColorText = luma > 160 ? "text-black/70" : "text-white/85";

  const inputCls = "flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]";

  return (
    <div>
      <PageHeader badge="设计" title={seo.title} subtitle={seo.subtitle} tone="violet" />

      <div className="space-y-6">
        {/* 实时预览 */}
        <SectionCard title="预览" subtitle="改任意输入框 · 色块实时同步">
          <div
            className="relative h-40 rounded-xl border border-white/[0.08] overflow-hidden transition-colors"
            style={{ backgroundColor: hexStr }}
            role="img"
            aria-label={`当前颜色 ${hexStr}`}
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
              aria-label="取色器"
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
                  aria-label={`预设颜色 ${p.name} ${p.hex}`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-neutral-600">取色器或点击预设色板快速取色</span>
          </div>
        </SectionCard>

        {/* 三格式联动 */}
        <SectionCard title="格式联动" subtitle="HEX / RGB / HSL 改任一个其余同步">
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
                    aria-label="HEX 颜色值"
                    className={inputCls}
                  />
                  <CopyButton text={hexStr} />
                </div>
              </Field>
              {hexInvalid && (
                <div className="mt-2">
                  <Hint kind="error">HEX 格式非法：仅支持 #RGB 或 #RRGGBB（十六进制 0-9 A-F）</Hint>
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
                    aria-label="RGB 颜色值"
                    className={inputCls}
                  />
                  <CopyButton text={rgbStr} />
                </div>
              </Field>
              {rgbInvalid && (
                <div className="mt-2">
                  <Hint kind="error">RGB 格式非法：需要 3 个 0-255 的整数，如 rgb(139, 92, 246)</Hint>
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
                    aria-label="HSL 颜色值"
                    className={inputCls}
                  />
                  <CopyButton text={hslStr} />
                </div>
              </Field>
              {hslInvalid && (
                <div className="mt-2">
                  <Hint kind="error">HSL 格式非法：色相 0-360，饱和度与亮度为 0-100% 百分数，如 hsl(258, 90%, 66%)</Hint>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <Hint kind="info">
          HEX 适合写进 CSS 与配置文件；RGB 直观显示三原色分量；HSL 更符合人的感知，调深浅（l）与鲜艳度（s）更方便。
          输入过程中非法内容不会丢，失焦后自动归一化为合法格式。
        </Hint>
      </div>
    </div>
  );
}
