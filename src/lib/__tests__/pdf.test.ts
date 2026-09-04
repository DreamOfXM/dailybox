import { describe, it, expect } from "vitest";
import { deflateSync, crc32 } from "zlib";
import type { TryResult } from "../base64";
import {
  readPdfMeta,
  mergePdfs,
  extractPages,
  reorderPages,
  rotatePages,
  addTextWatermark,
  addImageWatermark,
  addPageNumbers,
  imagesToPdf,
  hexToRgb01,
} from "../pdf";

/* ---------- 测试夹具：构造结构已知的 PDF / PNG ---------- */

/** 造一个每页宽度互不相同的 PDF（页宽=widths[i]，高固定 200），便于用尺寸校验顺序 */
async function makeDoc(widths: number[]): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const d = await PDFDocument.create();
  const font = await d.embedFont(StandardFonts.Helvetica);
  for (const w of widths) {
    const p = d.addPage([w, 200]);
    p.drawText("hello", { x: 10, y: 100, size: 14, font });
  }
  return await d.save();
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** 造一个合法的 w×h RGB PNG（不依赖任何图片库） */
function makePng(w: number, h: number): Uint8Array {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = 1 + w * 3;
  const raw = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < w * 3; x++) raw[y * stride + 1 + x] = (x * 7 + y * 13) & 0xff;
  }
  const idat = deflateSync(raw);
  return new Uint8Array(Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", idat), pngChunk("IEND", Buffer.alloc(0))]));
}

function meta(result: Awaited<ReturnType<typeof readPdfMeta>>) {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}
function bytes(result: TryResult<Uint8Array>): Uint8Array {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

/* ---------- 元信息 ---------- */

describe("readPdfMeta", () => {
  it("读出页数、每页尺寸与旋转角", async () => {
    const src = await makeDoc([100, 150, 200]);
    const m = meta(await readPdfMeta(src));
    expect(m.pageCount).toBe(3);
    expect(m.pages.map((p) => p.width)).toEqual([100, 150, 200]);
    expect(m.pages.every((p) => p.height === 200)).toBe(true);
    expect(m.pages.every((p) => p.rotation === 0)).toBe(true);
    expect(m.encrypted).toBe(false);
    expect(m.byteLength).toBeGreaterThan(0);
  });

  it("非法字节返回失败而非抛异常", async () => {
    const r = await readPdfMeta(new Uint8Array([1, 2, 3, 4, 5]));
    expect(r.ok).toBe(false);
  });
});

/* ---------- 合并 ---------- */

describe("mergePdfs", () => {
  it("按顺序合并，页数相加，页宽序列正确", async () => {
    const a = await makeDoc([100, 110]);
    const b = await makeDoc([200, 210, 220]);
    const out = bytes(await mergePdfs([a, b]));
    const m = meta(await readPdfMeta(out));
    expect(m.pageCount).toBe(5);
    expect(m.pages.map((p) => p.width)).toEqual([100, 110, 200, 210, 220]);
  });

  it("空列表报错", async () => {
    expect((await mergePdfs([])).ok).toBe(false);
  });

  it("其中一个损坏时指明是第几个", async () => {
    const a = await makeDoc([100]);
    const r = await mergePdfs([a, new Uint8Array([9, 9, 9])]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("第 2 个");
  });
});

/* ---------- 抽取 / 整理 ---------- */

describe("extractPages / reorderPages", () => {
  it("抽取子集并保持给定顺序", async () => {
    const src = await makeDoc([100, 150, 200, 250, 300]);
    const m = meta(await readPdfMeta(bytes(await extractPages(src, [4, 0, 2]))));
    expect(m.pageCount).toBe(3);
    expect(m.pages.map((p) => p.width)).toEqual([300, 100, 200]);
  });

  it("整体反转顺序", async () => {
    const src = await makeDoc([100, 200, 300]);
    const m = meta(await readPdfMeta(bytes(await reorderPages(src, [2, 1, 0]))));
    expect(m.pages.map((p) => p.width)).toEqual([300, 200, 100]);
  });

  it("删除页面=从顺序中省略", async () => {
    const src = await makeDoc([100, 200, 300, 400]);
    const m = meta(await readPdfMeta(bytes(await reorderPages(src, [0, 2, 3]))));
    expect(m.pageCount).toBe(3);
    expect(m.pages.map((p) => p.width)).toEqual([100, 300, 400]);
  });

  it("越界索引报错", async () => {
    const src = await makeDoc([100, 200]);
    const r = await extractPages(src, [0, 5]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("超出范围");
  });

  it("空选择报错", async () => {
    const src = await makeDoc([100]);
    expect((await extractPages(src, [])).ok).toBe(false);
  });
});

/* ---------- 旋转 ---------- */

describe("rotatePages", () => {
  it("单页顺时针旋转 90，可再叠加", async () => {
    const src = await makeDoc([100, 200]);
    const once = bytes(await rotatePages(src, [{ index: 0, delta: 90 }]));
    expect(meta(await readPdfMeta(once)).pages.map((p) => p.rotation)).toEqual([90, 0]);
    const twice = bytes(await rotatePages(once, [{ index: 0, delta: 90 }]));
    expect(meta(await readPdfMeta(twice)).pages[0].rotation).toBe(180);
  });

  it("归一化：0 转 270 → 270；再转 180 → 90（450%360）", async () => {
    const src = await makeDoc([100]);
    const a = bytes(await rotatePages(src, [{ index: 0, delta: 270 }]));
    expect(meta(await readPdfMeta(a)).pages[0].rotation).toBe(270);
    const b = bytes(await rotatePages(a, [{ index: 0, delta: 180 }]));
    expect(meta(await readPdfMeta(b)).pages[0].rotation).toBe(90);
  });

  it("批量多页各自旋转", async () => {
    const src = await makeDoc([100, 200, 300]);
    const out = bytes(await rotatePages(src, [
      { index: 0, delta: 90 },
      { index: 1, delta: 180 },
      { index: 2, delta: 270 },
    ]));
    expect(meta(await readPdfMeta(out)).pages.map((p) => p.rotation)).toEqual([90, 180, 270]);
  });

  it("越界页报错", async () => {
    const src = await makeDoc([100]);
    expect((await rotatePages(src, [{ index: 9, delta: 90 }])).ok).toBe(false);
  });
});

/* ---------- 文字水印 ---------- */

describe("addTextWatermark", () => {
  it("ASCII 水印成功，页数不变，体积增大（确有绘制）", async () => {
    const src = await makeDoc([300, 300]);
    const out = bytes(await addTextWatermark(src, { text: "CONFIDENTIAL", fontSize: 48, opacity: 0.2, angle: 45 }));
    const m = meta(await readPdfMeta(out));
    expect(m.pageCount).toBe(2);
    expect(m.byteLength).toBeGreaterThan(src.byteLength);
  });

  it("平铺模式也能生成有效 PDF", async () => {
    const src = await makeDoc([400]);
    const out = bytes(await addTextWatermark(src, { text: "DRAFT", position: "tile", tileGapX: 120, tileGapY: 100 }));
    expect(meta(await readPdfMeta(out)).pageCount).toBe(1);
  });

  it("中文水印被拒并给出引导（Helvetica 不支持）", async () => {
    const src = await makeDoc([300]);
    const r = await addTextWatermark(src, { text: "机密文件" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("图片水印");
  });

  it("空文字报错", async () => {
    const src = await makeDoc([300]);
    expect((await addTextWatermark(src, { text: "   " })).ok).toBe(false);
  });

  it("仅指定页加水印", async () => {
    const src = await makeDoc([300, 300, 300]);
    const out = bytes(await addTextWatermark(src, { text: "OK", pageIndices: [1] }));
    expect(meta(await readPdfMeta(out)).pageCount).toBe(3);
  });
});

/* ---------- 图片水印 ---------- */

describe("addImageWatermark", () => {
  it("PNG 水印：三种位置都生成有效 PDF，页数不变", async () => {
    const src = await makeDoc([400, 400]);
    const png = makePng(40, 20);
    for (const position of ["center", "bottomRight", "tile"] as const) {
      const out = bytes(await addImageWatermark(src, { image: png, imageType: "png", position, width: 80, opacity: 0.3 }));
      expect(meta(await readPdfMeta(out)).pageCount).toBe(2);
    }
  });

  it("越界页报错", async () => {
    const src = await makeDoc([400]);
    const r = await addImageWatermark(src, { image: makePng(10, 10), imageType: "png", pageIndices: [7] });
    expect(r.ok).toBe(false);
  });
});

/* ---------- 页码 ---------- */

describe("addPageNumbers", () => {
  it("默认模板 {n} / {total}，页数不变，体积增大", async () => {
    const src = await makeDoc([300, 300, 300]);
    const out = bytes(await addPageNumbers(src, {}));
    const m = meta(await readPdfMeta(out));
    expect(m.pageCount).toBe(3);
    expect(m.byteLength).toBeGreaterThan(src.byteLength);
  });

  it("六个位置都能生成有效 PDF", async () => {
    const src = await makeDoc([400]);
    const positions = ["bottom-center", "bottom-right", "bottom-left", "top-center", "top-right", "top-left"] as const;
    for (const position of positions) {
      const out = bytes(await addPageNumbers(src, { position, format: "- {n} -" }));
      expect(meta(await readPdfMeta(out)).pageCount).toBe(1);
    }
  });

  it("起始页码偏移不影响总页数", async () => {
    const src = await makeDoc([300, 300]);
    const out = bytes(await addPageNumbers(src, { start: 5, format: "{n}" }));
    expect(meta(await readPdfMeta(out)).pageCount).toBe(2);
  });

  it("中文模板被拒", async () => {
    const src = await makeDoc([300]);
    const r = await addPageNumbers(src, { format: "第{n}页" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("不支持中文");
  });
});

/* ---------- 图片转 PDF ---------- */

describe("imagesToPdf", () => {
  it("fit 模式：每页尺寸=图片尺寸", async () => {
    const pngs = [makePng(120, 80), makePng(60, 90)];
    const out = bytes(await imagesToPdf(pngs.map((b) => ({ bytes: b, type: "png" as const })), { pageSize: "fit" }));
    const m = meta(await readPdfMeta(out));
    expect(m.pageCount).toBe(2);
    expect(m.pages[0].width).toBe(120);
    expect(m.pages[0].height).toBe(80);
    expect(m.pages[1].width).toBe(60);
  });

  it("a4 模式：统一 A4，横向图自动转横向页", async () => {
    const wide = makePng(200, 100); // 宽>高 → auto 横向
    const out = bytes(await imagesToPdf([{ bytes: wide, type: "png" }], { pageSize: "a4", orientation: "auto" }));
    const m = meta(await readPdfMeta(out));
    expect(m.pages[0].width).toBeCloseTo(841.89, 1); // A4 长边
    expect(m.pages[0].height).toBeCloseTo(595.28, 1); // A4 短边
  });

  it("a4 portrait 固定竖向", async () => {
    const out = bytes(await imagesToPdf([{ bytes: makePng(200, 100), type: "png" }], { pageSize: "a4", orientation: "portrait", margin: 24 }));
    const m = meta(await readPdfMeta(out));
    expect(m.pages[0].width).toBeCloseTo(595.28, 1);
    expect(m.pages[0].height).toBeCloseTo(841.89, 1);
  });

  it("空列表报错", async () => {
    expect((await imagesToPdf([])).ok).toBe(false);
  });

  it("坏图指明第几张", async () => {
    const r = await imagesToPdf([
      { bytes: makePng(10, 10), type: "png" },
      { bytes: new Uint8Array([1, 2, 3]), type: "png" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("第 2 张");
  });
});

/* ---------- 颜色 ---------- */

describe("hexToRgb01", () => {
  it("解析 6 位/3 位十六进制", () => {
    expect(hexToRgb01("#ff0000")).toEqual([1, 0, 0]);
    expect(hexToRgb01("#0f0")).toEqual([0, 1, 0]);
    expect(hexToRgb01("0000ff")).toEqual([0, 0, 1]);
  });
  it("非法值回退中灰", () => {
    expect(hexToRgb01("zzz")).toEqual([0.5, 0.5, 0.5]);
  });
});
