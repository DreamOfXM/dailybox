import type { TryResult } from "./base64";

/* ============================================================
 * DailyBox PDF 引擎 —— 纯 pdf-lib 原语，全部本地运算，不上传。
 * 设计原则：
 *  1. 每个操作独立、幂等、返回新字节，绝不改原文件；
 *  2. 所有对外函数返回 TryResult，出错给中文可读信息而非抛异常；
 *  3. 文本绘制使用 pdf-lib 内置 Helvetica（WinAnsi），只支持 ASCII；
 *     遇到中文/emoji 明确报错并引导用户改用图片水印，绝不静默乱码。
 *  4. pdf-lib 懒加载（动态 import），组件首屏不背这个包。
 * ============================================================ */

type PdfLib = typeof import("pdf-lib");

let _lib: PdfLib | null = null;
async function lib(): Promise<PdfLib> {
  if (!_lib) _lib = await import("pdf-lib");
  return _lib;
}

const ok = <T,>(value: T): TryResult<T> => ({ ok: true, value });
const fail = <T,>(message: string): TryResult<T> => ({ ok: false, message });

export type ByteInput = ArrayBuffer | Uint8Array;

/** 统一成 Uint8Array（pdf-lib 可直接吃，但拷贝一份避免 detached buffer 问题） */
function toU8(input: ByteInput): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

/** pdf-lib 的 EncryptedPDFError 名字（不同构建下类名可能被压缩，用消息兜底判断） */
function isEncryptedError(e: unknown): boolean {
  const name = e instanceof Error ? e.constructor.name : "";
  const msg = e instanceof Error ? e.message : String(e);
  return name === "EncryptedPDFError" || /encrypt/i.test(msg);
}

/** 把任意异常翻译成用户可读的中文信息 */
function toMessage(e: unknown, fallback: string): string {
  if (isEncryptedError(e)) return "该 PDF 已加密，暂不支持处理，请先解密后再试";
  if (e instanceof Error) {
    const m = e.message;
    if (/WinAnsi|cannot be encoded|not .*encodable/i.test(m))
      return "内置字体不支持中文/特殊字符，请改用英文数字，或使用图片水印";
    if (/Invalid PDF|not a valid|Failed to parse/i.test(m)) return "文件不是有效的 PDF，或已损坏";
    return m;
  }
  return fallback;
}

export interface PageMeta {
  width: number;
  height: number;
  /** 页面显示旋转角（0/90/180/270） */
  rotation: number;
}

export interface PdfMeta {
  pageCount: number;
  pages: PageMeta[];
  encrypted: boolean;
  /** 源文件字节数，用于展示压缩/体积变化 */
  byteLength: number;
}

/* ==================== 读取元信息 ==================== */

/** 读取 PDF 页数、每页尺寸与旋转角；加密文件返回 encrypted:true（不抛错） */
export async function readPdfMeta(input: ByteInput): Promise<TryResult<PdfMeta>> {
  try {
    const { PDFDocument } = await lib();
    const bytes = toU8(input);
    let doc: import("pdf-lib").PDFDocument;
    let encrypted = false;
    try {
      doc = await PDFDocument.load(bytes, { updateMetadata: false });
    } catch (e) {
      if (isEncryptedError(e)) {
        doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
        encrypted = true;
      } else throw e;
    }
    const pages = doc.getPages().map((p) => {
      const { width, height } = p.getSize();
      const rot = p.getRotation().angle;
      return { width: round2(width), height: round2(height), rotation: ((rot % 360) + 360) % 360 };
    });
    return ok({ pageCount: pages.length, pages, encrypted, byteLength: bytes.byteLength });
  } catch (e) {
    return fail(toMessage(e, "无法读取 PDF"));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ==================== 合并 ==================== */

/** 按顺序合并多个 PDF 为一个；任一文件损坏/加密则整体失败并指明第几个 */
export async function mergePdfs(inputs: ByteInput[]): Promise<TryResult<Uint8Array>> {
  if (inputs.length === 0) return fail("请先选择至少一个 PDF");
  try {
    const { PDFDocument } = await lib();
    const merged = await PDFDocument.create();
    for (let i = 0; i < inputs.length; i++) {
      let src: import("pdf-lib").PDFDocument;
      try {
        src = await PDFDocument.load(toU8(inputs[i]), { updateMetadata: false });
      } catch (e) {
        return fail(`第 ${i + 1} 个文件：${toMessage(e, "无法解析")}`);
      }
      const copied = await merged.copyPages(src, src.getPageIndices());
      copied.forEach((p) => merged.addPage(p));
    }
    return ok(await merged.save());
  } catch (e) {
    return fail(toMessage(e, "合并失败"));
  }
}

/* ==================== 拆分 / 抽取页面 ==================== */

/**
 * 从 PDF 抽取指定页（0-based 索引，按给定顺序）生成新 PDF。
 * 用于「拆分」「抽取」「整理-仅保留部分页」。越界索引直接报错。
 */
export async function extractPages(input: ByteInput, indices: number[]): Promise<TryResult<Uint8Array>> {
  if (indices.length === 0) return fail("请至少选择一个页面");
  try {
    const { PDFDocument } = await lib();
    const src = await loadOrEncryptedFail(input);
    const total = src.getPageCount();
    for (const idx of indices) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= total) return fail(`页码 ${idx + 1} 超出范围（共 ${total} 页）`);
    }
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    return ok(await out.save());
  } catch (e) {
    return fail(toMessage(e, "抽取页面失败"));
  }
}

/**
 * 整理页面：给定「最终页面顺序」（原页 0-based 索引数组，可缺省=删除、可乱序=重排），
 * 生成新 PDF。删除=不出现在数组里；重排=改变数组顺序；两者可叠加。
 */
export async function reorderPages(input: ByteInput, finalOrder: number[]): Promise<TryResult<Uint8Array>> {
  return extractPages(input, finalOrder);
}

/* ==================== 旋转 ==================== */

export interface RotateOp {
  /** 0-based 页索引 */
  index: number;
  /** 顺时针增量角度（90/180/270，也接受任意整数，内部归一化） */
  delta: number;
}

/** 按页旋转：在原旋转角基础上叠加 delta（顺时针），归一化到 [0,360) */
export async function rotatePages(input: ByteInput, ops: RotateOp[]): Promise<TryResult<Uint8Array>> {
  if (ops.length === 0) return fail("没有需要旋转的页面");
  try {
    const { degrees } = await lib();
    const src = await loadOrEncryptedFail(input);
    const total = src.getPageCount();
    for (const op of ops) {
      if (!Number.isInteger(op.index) || op.index < 0 || op.index >= total)
        return fail(`页码 ${op.index + 1} 超出范围（共 ${total} 页）`);
    }
    const pages = src.getPages();
    for (const op of ops) {
      const page = pages[op.index];
      const cur = page.getRotation().angle;
      const next = (((cur + op.delta) % 360) + 360) % 360;
      page.setRotation(degrees(next));
    }
    return ok(await src.save());
  } catch (e) {
    return fail(toMessage(e, "旋转失败"));
  }
}

/* ==================== 颜色工具 ==================== */

/** #rgb / #rrggbb → [0..1,0..1,0..1]，非法则回退到中灰 */
export function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0.5, 0.5, 0.5];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const ASCII_ONLY = /^[\x20-\x7E\t]*$/;

/* ==================== 文字水印 ==================== */

export type WatermarkPosition = "center" | "tile";

export interface TextWatermarkOptions {
  text: string;
  /** 字号（pt），默认 60 */
  fontSize?: number;
  /** 十六进制颜色，默认 #999999 */
  color?: string;
  /** 不透明度 0..1，默认 0.18 */
  opacity?: number;
  /** 旋转角（度），默认 45（对角） */
  angle?: number;
  /** 粗体，默认 false */
  bold?: boolean;
  /** center=每页正中一个；tile=平铺多个，默认 center */
  position?: WatermarkPosition;
  /** 平铺时的水平/垂直间距（pt），默认 200/160 */
  tileGapX?: number;
  tileGapY?: number;
  /** 仅处理这些页（0-based）；缺省=全部页 */
  pageIndices?: number[];
}

/** 加文字水印（仅 ASCII；中文请用图片水印） */
export async function addTextWatermark(input: ByteInput, opts: TextWatermarkOptions): Promise<TryResult<Uint8Array>> {
  const text = opts.text ?? "";
  if (!text.trim()) return fail("水印文字不能为空");
  if (!ASCII_ONLY.test(text)) return fail("内置字体不支持中文/特殊字符，请改用英文数字，或使用图片水印");
  try {
    const { StandardFonts, degrees, rgb } = await lib();
    const doc = await loadOrEncryptedFail(input);
    const font = await doc.embedFont(opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
    const size = clamp(opts.fontSize ?? 60, 4, 400);
    const opacity = clamp(opts.opacity ?? 0.18, 0.02, 1);
    const angle = opts.angle ?? 45;
    const [r, g, b] = hexToRgb01(opts.color ?? "#999999");
    const color = rgb(r, g, b);
    const pages = doc.getPages();
    const targets = opts.pageIndices && opts.pageIndices.length ? opts.pageIndices : pages.map((_, i) => i);
    const total = pages.length;
    for (const idx of targets) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= total) return fail(`页码 ${idx + 1} 超出范围（共 ${total} 页）`);
    }
    const tw = font.widthOfTextAtSize(text, size);
    for (const idx of targets) {
      const page = pages[idx];
      const { width, height } = page.getSize();
      if (opts.position === "tile") {
        const gx = clamp(opts.tileGapX ?? 200, 40, 2000);
        const gy = clamp(opts.tileGapY ?? 160, 40, 2000);
        for (let y = gy / 2; y < height + gy; y += gy) {
          for (let x = -tw; x < width + gx; x += gx + tw) {
            page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
          }
        }
      } else {
        const rad = (angle * Math.PI) / 180;
        const x = width / 2 - (tw / 2) * Math.cos(rad);
        const y = height / 2 - (tw / 2) * Math.sin(rad);
        page.drawText(text, { x, y, size, font, color, opacity, rotate: degrees(angle) });
      }
    }
    return ok(await doc.save());
  } catch (e) {
    return fail(toMessage(e, "加水印失败"));
  }
}

export interface ImageWatermarkOptions {
  /** 图片字节 */
  image: ByteInput;
  imageType: "png" | "jpg";
  /** 显示宽度（pt），高度按原图比例；默认按页面宽的 1/3 */
  width?: number;
  opacity?: number;
  angle?: number;
  /** 位置：center 正中；bottomRight 右下角（含边距）；tile 平铺 */
  position?: "center" | "bottomRight" | "tile";
  /** 距边距（pt），bottomRight 用，默认 36 */
  margin?: number;
  tileGapX?: number;
  tileGapY?: number;
  pageIndices?: number[];
}

/** 加图片水印（支持中文 logo/印章图，是中文水印的推荐方式） */
export async function addImageWatermark(input: ByteInput, opts: ImageWatermarkOptions): Promise<TryResult<Uint8Array>> {
  try {
    const { degrees } = await lib();
    const doc = await loadOrEncryptedFail(input);
    const img = opts.imageType === "png" ? await doc.embedPng(toU8(opts.image)) : await doc.embedJpg(toU8(opts.image));
    const ratio = img.height / img.width || 1;
    const opacity = clamp(opts.opacity ?? 0.25, 0.02, 1);
    const angle = opts.angle ?? 0;
    const pages = doc.getPages();
    const targets = opts.pageIndices && opts.pageIndices.length ? opts.pageIndices : pages.map((_, i) => i);
    const total = pages.length;
    for (const idx of targets) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= total) return fail(`页码 ${idx + 1} 超出范围（共 ${total} 页）`);
    }
    for (const idx of targets) {
      const page = pages[idx];
      const { width: pw, height: ph } = page.getSize();
      const w = clamp(opts.width ?? pw / 3, 8, pw * 2);
      const h = w * ratio;
      const margin = clamp(opts.margin ?? 36, 0, 400);
      if (opts.position === "tile") {
        const gx = clamp(opts.tileGapX ?? 200, 40, 2000);
        const gy = clamp(opts.tileGapY ?? 160, 40, 2000);
        for (let y = 0; y < ph + gy; y += gy) {
          for (let x = 0; x < pw + gx; x += gx) {
            page.drawImage(img, { x, y, width: w, height: h, opacity, rotate: degrees(angle) });
          }
        }
      } else if (opts.position === "bottomRight") {
        page.drawImage(img, { x: pw - w - margin, y: margin, width: w, height: h, opacity, rotate: degrees(angle) });
      } else {
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h, opacity, rotate: degrees(angle) });
      }
    }
    return ok(await doc.save());
  } catch (e) {
    return fail(toMessage(e, "加图片水印失败"));
  }
}

/* ==================== 页码 ==================== */

export type PageNumPosition =
  | "bottom-center" | "bottom-right" | "bottom-left"
  | "top-center" | "top-right" | "top-left";

export interface PageNumberOptions {
  /** 模板，支持 {n}=当前页 {total}=总页数，仅 ASCII。默认 "{n} / {total}" */
  format?: string;
  /** 起始页码，默认 1 */
  start?: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  bold?: boolean;
  position?: PageNumPosition;
  /** 距页边（pt），默认 36 */
  margin?: number;
  /** 首页是否显示页码（封面常不显示），默认 true */
  showFirst?: boolean;
  /** 仅处理这些页（0-based），缺省=全部；注意 {n} 仍按物理页序计算 */
  pageIndices?: number[];
}

/** 加页码（ASCII 模板；中文「第 x 页」暂不支持，可用 {n} 数字） */
export async function addPageNumbers(input: ByteInput, opts: PageNumberOptions): Promise<TryResult<Uint8Array>> {
  const format = opts.format ?? "{n} / {total}";
  if (!ASCII_ONLY.test(format)) return fail("页码模板不支持中文，请使用 {n}、{total}、Page、- 等英文数字符号");
  try {
    const { StandardFonts, rgb } = await lib();
    const doc = await loadOrEncryptedFail(input);
    const font = await doc.embedFont(opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
    const size = clamp(opts.fontSize ?? 11, 4, 72);
    const opacity = clamp(opts.opacity ?? 1, 0.02, 1);
    const [r, g, b] = hexToRgb01(opts.color ?? "#333333");
    const color = rgb(r, g, b);
    const margin = clamp(opts.margin ?? 36, 0, 400);
    const start = Number.isFinite(opts.start) ? Math.trunc(opts.start as number) : 1;
    const pos = opts.position ?? "bottom-center";
    const pages = doc.getPages();
    const total = pages.length;
    const targets = opts.pageIndices && opts.pageIndices.length ? opts.pageIndices : pages.map((_, i) => i);
    for (const idx of targets) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= total) return fail(`页码 ${idx + 1} 超出范围（共 ${total} 页）`);
    }
    for (const idx of targets) {
      if (idx === 0 && opts.showFirst === false) continue;
      const page = pages[idx];
      const label = format.replace(/\{n\}/g, String(start + idx)).replace(/\{total\}/g, String(total));
      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(label, size);
      const th = font.heightAtSize(size);
      let x = margin;
      let y = margin;
      if (pos.includes("center")) x = (width - tw) / 2;
      else if (pos.includes("right")) x = width - tw - margin;
      if (pos.startsWith("top")) y = height - margin - th;
      page.drawText(label, { x, y, size, font, color, opacity });
    }
    return ok(await doc.save());
  } catch (e) {
    return fail(toMessage(e, "加页码失败"));
  }
}

/* ==================== 图片 → PDF ==================== */

export interface ImageItem {
  bytes: ByteInput;
  type: "png" | "jpg";
}

export interface ImagesToPdfOptions {
  /** fit=每页尺寸贴合图片；a4=统一 A4 并等比居中；默认 fit */
  pageSize?: "fit" | "a4";
  /** A4 方向：auto 按图片长宽比自动；或固定 portrait/landscape。默认 auto */
  orientation?: "auto" | "portrait" | "landscape";
  /** a4 模式下的页边距（pt），默认 0（铺满）或 24 */
  margin?: number;
}

const A4_W = 595.28;
const A4_H = 841.89;

/** 多张图片按顺序合成一个 PDF */
export async function imagesToPdf(images: ImageItem[], opts: ImagesToPdfOptions = {}): Promise<TryResult<Uint8Array>> {
  if (images.length === 0) return fail("请先选择至少一张图片");
  try {
    const { PDFDocument } = await lib();
    const doc = await PDFDocument.create();
    const pageSize = opts.pageSize ?? "fit";
    for (let i = 0; i < images.length; i++) {
      let img: import("pdf-lib").PDFImage;
      try {
        img = images[i].type === "png" ? await doc.embedPng(toU8(images[i].bytes)) : await doc.embedJpg(toU8(images[i].bytes));
      } catch {
        return fail(`第 ${i + 1} 张图片无法解析（仅支持标准 JPG/PNG）`);
      }
      const iw = img.width;
      const ih = img.height;
      if (pageSize === "fit") {
        const page = doc.addPage([iw, ih]);
        page.drawImage(img, { x: 0, y: 0, width: iw, height: ih });
      } else {
        const orient = opts.orientation ?? "auto";
        const landscape = orient === "landscape" || (orient === "auto" && iw > ih);
        const pw = landscape ? A4_H : A4_W;
        const ph = landscape ? A4_W : A4_H;
        const page = doc.addPage([pw, ph]);
        const m = clamp(opts.margin ?? 0, 0, 200);
        const availW = pw - m * 2;
        const availH = ph - m * 2;
        const scale = Math.min(availW / iw, availH / ih);
        const w = iw * scale;
        const h = ih * scale;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
    }
    return ok(await doc.save());
  } catch (e) {
    return fail(toMessage(e, "图片转 PDF 失败"));
  }
}

/* ==================== 内部工具 ==================== */

async function loadOrEncryptedFail(input: ByteInput): Promise<import("pdf-lib").PDFDocument> {
  const { PDFDocument } = await lib();
  return PDFDocument.load(toU8(input), { updateMetadata: false });
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
