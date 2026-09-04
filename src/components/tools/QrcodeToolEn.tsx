"use client";

import { useEffect, useState } from "react";
// @ts-expect-error qrcode has no type declarations
import QRCode from "qrcode";
import { findToolEn } from "@/lib/seo-en";
import { normalizeHex } from "@/lib/colorconvert";
import { Field, Hint, NumberInput, PageHeader, SectionCard, Segmented } from "@/components/ui";

const seo = findToolEn("qrcode")!;

type EcLevel = "L" | "M" | "Q" | "H";

/** Output size range (px) */
const MIN_SIZE = 128;
const MAX_SIZE = 1024;

/** Max content length before showing a density warning */
const QR_WARN_LEN = 2000;

function clampSize(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 256;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
}

/** Normalize foreground/background hex; fall back to default on invalid input */
function safeHex(input: string, fallback: string): string {
  const res = normalizeHex(input);
  return res.ok ? res.value : fallback;
}

function isBadHex(input: string): boolean {
  return !normalizeHex(input).ok;
}

interface QrValidation {
  len: number;
  warning?: string;
}

function validateQrInputEn(text: string): { ok: true; value: QrValidation } | { ok: false; message: string } {
  if (typeof text !== "string" || text.length === 0) {
    return { ok: false, message: "Content cannot be empty. Enter text or paste a link." };
  }
  const len = text.length;
  if (len > QR_WARN_LEN) {
    return {
      ok: true,
      value: {
        len,
        warning: `Content is long (${len} chars, over ${QR_WARN_LEN}). The resulting QR code will be very dense and may be hard to scan.`,
      },
    };
  }
  return { ok: true, value: { len } };
}

export default function QrcodeToolEn() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState("256");
  const [ec, setEc] = useState<EcLevel>("M");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#FFFFFF");
  const [dataUrl, setDataUrl] = useState("");
  const [genError, setGenError] = useState("");
  const [generating, setGenerating] = useState(false);

  const validation = validateQrInputEn(text);
  const sizePx = clampSize(Number(size));
  const fgBad = isBadHex(fg);
  const bgBad = isBadHex(bg);

  const generate = async () => {
    const v = validateQrInputEn(text);
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
      setGenError("Generation failed. Please check your content and color settings, then try again.");
      setDataUrl("");
    } finally {
      setGenerating(false);
    }
  };

  // Generate on mount so users see a result immediately
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
      <PageHeader badge="Encoding" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* Content input */}
        <SectionCard title="Content" subtitle="Text / URL / any characters">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Enter text or paste a link, then click Generate QR Code"
            aria-label="QR code content"
            className="w-full px-4 py-3 rounded-xl font-mono text-sm leading-relaxed resize-y"
          />
          <div className="mt-3 space-y-2">
            {!validation.ok && <Hint kind="info">Content cannot be empty. Enter text or a link to generate a QR code.</Hint>}
            {validation.ok && validation.value.warning && <Hint kind="warn">{validation.value.warning}</Hint>}
          </div>
        </SectionCard>

        {/* Parameters */}
        <SectionCard title="Style options" subtitle="Size / Error correction / Colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Size" hint={`${MIN_SIZE}-${MAX_SIZE} px`}>
              <NumberInput value={size} onChange={setSize} suffix="px" placeholder="256" />
            </Field>

            <Field label="Error correction" hint="Higher levels tolerate more damage but produce denser patterns">
              <Segmented
                value={ec}
                onChange={setEc}
                options={[
                  { value: "L", label: "Low 7%" },
                  { value: "M", label: "Medium 15%" },
                  { value: "Q", label: "Quartile 25%" },
                  { value: "H", label: "High 30%" },
                ]}
                ariaLabel="Error correction level"
              />
            </Field>

            <Field label="Foreground" hint="HEX" error={fgBad ? "Invalid HEX format; black will be used as fallback" : undefined}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeHex(fg, "#000000").toLowerCase()}
                  onChange={(e) => setFg(e.target.value.toUpperCase())}
                  aria-label="Foreground color picker"
                  className="w-11 h-11 shrink-0 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  placeholder="#000000"
                  aria-label="Foreground HEX"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </div>
            </Field>

            <Field label="Background" hint="HEX" error={bgBad ? "Invalid HEX format; white will be used as fallback" : undefined}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={safeHex(bg, "#FFFFFF").toLowerCase()}
                  onChange={(e) => setBg(e.target.value.toUpperCase())}
                  aria-label="Background color picker"
                  className="w-11 h-11 shrink-0 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  placeholder="#FFFFFF"
                  aria-label="Background HEX"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl font-mono text-[15px]"
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Result */}
        <SectionCard
          title="Result"
          subtitle={`Output ${sizePx} x ${sizePx} px - generated locally, nothing uploads`}
          aside={
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
            >
              Download PNG
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
              {generating ? "Generating..." : "Generate QR Code"}
            </button>

            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Generated QR code"
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg border border-white/[0.08]"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-neutral-600 font-mono text-xs">
                {validation.ok ? "Click Generate QR Code to render" : "Waiting for content"}
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
          Error correction determines how much damage a QR code can sustain while remaining scannable:
          Low ~7%, Medium ~15%, Quartile ~25%, High ~30%. Choose Q or H when overlaying a logo or printing
          on surfaces prone to wear. Make sure the foreground color is significantly darker than the background,
          otherwise scanners may fail to read the code.
        </Hint>
      </div>
    </div>
  );
}
