"use client";

import { useEffect, useState } from "react";
// @ts-expect-error qrcode 无类型声明（仓库内未安装 @types/qrcode）
import QRCode from "qrcode";
import { findTool } from "@/lib/seo";
import { validateQrInput } from "@/lib/qrcodegen";
import { normalizeHex } from "@/lib/colorconvert";
import { Field, Hint, NumberInput, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findTool("qrcode")!;

type EcLevel = "L" | "M" | "Q" | "H";

/** 输出尺寸范围（px） */
const MIN_SIZE = 128;
const MAX_SIZE = 1024;

function clampSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 256;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
}

/** 前景/背景色归一化；非法时回落默认值（生成不因颜色输入中断） */
function safeHex(input: string, fallback: string): string {
  const res = normalizeHex(input);
  return res.ok ? res.value : fallback;
}

function isBadHex(input: string): boolean {
  return !normalizeHex(input).ok;
}

export default function QrcodeTool() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState("256");
  const [ec, setEc] = useState<EcLevel>("M");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#FFFFFF");
  const [dataUrl, setDataUrl] = useState("");
  const [genError, setGenError] = useState("");
  const [generating, setGenerating] = useState(false);

  const validation = validateQrInput(text);
  const sizePx = clampSize(Number(size));
  const fgBad = isBadHex(fg);
  const bgBad = isBadHex(bg);

  const generate = async () => {
    const v = validateQrInput(text);
    if (!v.ok) {
      setGenError(v.message);
      setDataUrl("");
      return;
    }
    setGenerating(true);
    setGenError("");
    try {
      const url: string = await QRCode.toDataURL(text, {
        width: sizePx,
        margin: 2,
        errorCorrectionLevel: ec,
        color: { dark: safeHex(fg, "#000000"), light: safeHex(bg, "#FFFFFF") },
      });
      setDataUrl(url);
    } catch {
      setGenError("生成失败：请检查内容与颜色设置后重试");
      setDataUrl("");
    } finally {
      setGenerating(false);
    }
  };

  // 首次进入用默认内容生成一张，便于即刻体验
  useEffect(() => {
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div>
      <PageHeader badge="编码" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* 内容输入 */}
        <SectionCard title="内容" subtitle="文本 / 链接 / 任意字符">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="输入文本或粘贴链接，点击「生成二维码」渲染"
            aria-label="二维码内容"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="mt-3 space-y-2">
            {!validation.ok && <Hint kind="info">内容不能为空：输入文本或链接后即可生成二维码</Hint>}
            {validation.ok && validation.value.warning && <Hint kind="warn">{validation.value.warning}</Hint>}
          </div>
        </SectionCard>

        {/* 参数 */}
        <SectionCard title="样式参数" subtitle="尺寸 · 容错 · 前后景色">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="尺寸" hint={`${MIN_SIZE}-${MAX_SIZE} px`}>
              <NumberInput value={size} onChange={setSize} suffix="px" placeholder="256" />
            </Field>

            <Field label="容错等级" hint="越高越耐遮挡，图案越密">
              <Segmented
                value={ec}
                onChange={setEc}
                options={[
                  { value: "L", label: "L 7%" },
                  { value: "M", label: "M 15%" },
                  { value: "Q", label: "Q 25%" },
                  { value: "H", label: "H 30%" },
                ]}
                ariaLabel="容错等级"
              />
            </Field>

            <Field label="前景色" hint="HEX" error={fgBad ? "HEX 格式非法，生成时将回落黑色" : undefined}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeHex(fg, "#000000").toLowerCase()}
                  onChange={(e) => setFg(e.target.value.toUpperCase())}
                  aria-label="前景色取色器"
                  className="w-11 h-11 shrink-0 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  placeholder="#000000"
                  aria-label="前景色 HEX"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </div>
            </Field>

            <Field label="背景色" hint="HEX" error={bgBad ? "HEX 格式非法，生成时将回落白色" : undefined}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeHex(bg, "#FFFFFF").toLowerCase()}
                  onChange={(e) => setBg(e.target.value.toUpperCase())}
                  aria-label="背景色取色器"
                  className="w-11 h-11 shrink-0 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  placeholder="#FFFFFF"
                  aria-label="背景色 HEX"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* 结果 */}
        <SectionCard
          title="结果"
          subtitle={`输出 ${sizePx} × ${sizePx} px · 本地生成不上传`}
          aside={
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
            >
              ↓ 下载 PNG
            </button>
          }
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <button
              type="button"
              onClick={() => void generate()}
              disabled={!validation.ok || generating}
              className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-mono transition-colors disabled:opacity-40 shrink-0"
            >
              {generating ? "生成中…" : "生成二维码"}
            </button>

            {dataUrl ? (
              <img
                src={dataUrl}
                alt="生成的二维码"
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg border border-white/[0.08]"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-neutral-600 font-mono text-xs">
                {validation.ok ? "点击「生成二维码」渲染" : "等待输入内容"}
              </div>
            )}
          </div>
          {genError && (
            <div className="mt-4">
              <Hint kind="error">{genError}</Hint>
            </div>
          )}
        </SectionCard>

        <Hint kind="info">
          容错等级决定二维码破损后的可扫性：L≈7%、M≈15%、Q≈25%、H≈30%。叠加 Logo 或打印在易磨损场景建议选 Q/H；
          前景色需明显深于背景色，否则扫码器可能无法识别。
        </Hint>
      </div>
    </div>
  );
}
