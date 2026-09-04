import type { Metadata } from "next";
import { SITE_NAME, OG_IMAGE, type ToolSeo, absUrl } from "./seo";

/** English SEO for 28 universal tools (CN-only tools like 人民币大写/身份证 stay Chinese) */
export const TOOL_GROUPS_EN: Array<{ group: string; items: ToolSeo[] }> = [
  {
    group: "Encoding",
    items: [
      { slug: "url", title: "URL Encoder/Decoder", subtitle: "encodeURIComponent · encodeURI · Form", description: "Free online URL encode/decode with 3 modes, tolerant to broken percent sequences, full Unicode & emoji support. Runs locally, no upload.", keywords: ["URL encode", "URL decode", "encodeURIComponent", "online URL tool"] },
      { slug: "qrcode", title: "QR Code Generator", subtitle: "Text/URL · Size · ECC", description: "Generate QR codes from text or links in the browser, adjustable size, error correction level and colors, download as PNG. Local, nothing uploads.", keywords: ["QR code generator", "make QR code", "link to QR", "free QR code"] },
    ],
  },
  {
    group: "Text",
    items: [
      { slug: "wordcount", title: "Word Counter", subtitle: "Chars · Words · Read time", description: "Count characters, characters without spaces, words, lines and estimated reading time in real time, accurate for mixed CJK and Latin text.", keywords: ["word counter", "character count", "text count", "reading time"] },
      { slug: "caseconvert", title: "Case Converter", subtitle: "UPPER/lower/camel/snake", description: "Convert text between upper case, lower case, title case, camelCase and snake_case instantly, for code naming and text cleanup.", keywords: ["case converter", "uppercase to lowercase", "camelCase", "snake_case"] },
      { slug: "textcompare", title: "Text Compare", subtitle: "Line diff · add/delete highlight", description: "Compare two texts line by line with added, deleted and changed highlights plus diff counts, for code, config and document versions. Local.", keywords: ["text compare", "diff tool", "text difference", "compare online"] },
      { slug: "dedupe", title: "Dedupe & Sort", subtitle: "Dedupe · Sort · clean blank lines", description: "Remove duplicate lines, sort alphabetically or by length, strip blank lines and trim leading/trailing spaces in one pass, for lists and keywords.", keywords: ["remove duplicates", "dedupe lines", "sort lines", "text clean"] },
      { slug: "textbinary", title: "Text ↔ Binary", subtitle: "UTF-8 · two-way · separator", description: "Convert text to 01 binary and back, UTF-8 safe for CJK characters, custom separator, for learning, debugging and CTF practice.", keywords: ["text to binary", "binary to text", "01 converter", "utf-8 binary"] },
    ],
  },
  {
    group: "Crypto",
    items: [
      { slug: "hash", title: "Hash Generator", subtitle: "MD5 · SHA-1/256/384/512", description: "Online hash calculator for MD5, SHA-1, SHA-256, SHA-384, SHA-512 with hex & base64 output, Web Crypto powered. Local.", keywords: ["MD5", "SHA256", "hash calculator", "online hash"] },
    ],
  },
  {
    group: "Dev",
    items: [
      { slug: "regex", title: "Regex Tester", subtitle: "Live match · Highlight · Explain", description: "Online regex tester with live highlight, groups, and plain English explanation. Covers JS regex.", keywords: ["regex tester", "regular expression", "online regex"] },
      { slug: "uuid", title: "UUID Generator", subtitle: "v4 · v7 · Bulk", description: "Generate UUID v4/v7 and random numbers in bulk, with format options, using crypto-grade randomness.", keywords: ["UUID generator", "GUID", "random generator", "uuid v7"] },
      { slug: "radix", title: "Base Converter", subtitle: "Bin/Oct/Dec/Hex · BigInt", description: "Convert between binary, octal, decimal, hex in real time, BigInt for huge numbers.", keywords: ["base converter", "binary", "hex", "BigInt"] },
      { slug: "jwt", title: "JWT Decoder", subtitle: "Header · Payload · Expiry", description: "Decode JWT header/payload, show human time and expiry badge, no signature verification, local.", keywords: ["JWT decoder", "JWT parser", "token decode"] },
      { slug: "sql", title: "SQL Formatter", subtitle: "Beautify · Uppercase Keywords", description: "Format SQL (SELECT/INSERT/UPDATE/DELETE) with keyword uppercasing and indentation.", keywords: ["SQL formatter", "beautify SQL", "sql formatter online"] },
    ],
  },
  {
    group: "Time",
    items: [
      { slug: "cron", title: "Cron Expression", subtitle: "Parse · Human Readable · Next Run", description: "Parse cron expressions to plain English and next 5 run times.", keywords: ["cron", "cron parser", "cron generator"] },
    ],
  },
  {
    group: "Files",
    items: [
      { slug: "pdf", title: "PDF Merge & Split", subtitle: "Merge many · Extract pages", description: "Browser PDF tool: merge multiple PDFs in order, or split/extract a page range into a new file, powered by pdf-lib entirely locally, no upload.", keywords: ["PDF merge", "PDF split", "extract PDF pages", "online PDF"] },
      { slug: "image", title: "Image Compress & Convert", subtitle: "JPG/PNG/WebP · Bulk", description: "Compress and convert JPG/PNG/WebP in bulk, resize and quality control via Canvas/WASM, local.", keywords: ["image compress", "image converter", "jpg to png", "webp"] },
      { slug: "video", title: "Video Compress & Convert", subtitle: "MP4/WebM · Compress", description: "Compress and convert MP4/WebM with ffmpeg.wasm locally, 720p, no upload.", keywords: ["video compress", "video converter", "mp4 to webm", "ffmpeg"] },
      { slug: "pdfrotate", title: "PDF Rotate", subtitle: "Whole file or per page · 90/180/270", description: "Rotate all pages or selected pages by 90/180/270 degrees with per-page angle preview, straighten scanned documents. pdf-lib, local.", keywords: ["rotate PDF", "PDF rotate pages", "fix PDF orientation"] },
      { slug: "pdforganize", title: "PDF Organize", subtitle: "Reorder · delete · extract pages", description: "Reorder, delete or extract PDF pages with thumbnail preview and export a brand-new PDF, original untouched, powered by pdf-lib locally.", keywords: ["organize PDF", "reorder PDF pages", "delete PDF pages", "extract pages"] },
      { slug: "pdfwatermark", title: "PDF Watermark", subtitle: "Text/image · opacity · tile", description: "Add text watermarks (Latin letters, digits, symbols) or image watermarks (logos, stamps) with size, color, opacity, rotation and tiling, on all or selected pages. Local.", keywords: ["PDF watermark", "add watermark to PDF", "stamp PDF"] },
      { slug: "pdfpagenum", title: "PDF Page Numbers", subtitle: "6 positions · format · start at", description: "Add page numbers in six header/footer positions with custom format ({n} current page, {total} page count), start number, font size/color and skip-first-page option. Local.", keywords: ["PDF page numbers", "add page numbers PDF", "number PDF pages"] },
      { slug: "pdftojpg", title: "PDF to JPG", subtitle: "Every page · JPG/PNG · quality", description: "Render every PDF page to JPG or PNG in the browser with pdf.js, adjustable scale and background, download a single page or a ZIP of all pages. Local.", keywords: ["PDF to JPG", "PDF to PNG", "convert PDF to image", "PDF export images"] },
      { slug: "jpgtopdf", title: "Image to PDF", subtitle: "JPG/PNG · A4 or original size", description: "Combine multiple JPG/PNG images into one PDF in order, fit original image size or uniform A4 with orientation and margin control. Local.", keywords: ["image to PDF", "JPG to PDF", "PNG to PDF", "combine images to PDF"] },
    ],
  },
  {
    group: "Design",
    items: [
      { slug: "colorconvert", title: "Color Converter", subtitle: "HEX/RGB/HSL · picker · preview", description: "Convert between HEX, RGB and HSL with a visual picker and live preview, copy any format in one click, for design and frontend work.", keywords: ["color converter", "hex to rgb", "rgb to hsl", "color picker"] },
    ],
  },
  {
    group: "Convert",
    items: [
      { slug: "unit", title: "Unit Converter", subtitle: "Length · Weight · Temp", description: "Convert length, weight, area, temp, data size with all units live. Includes imperial.", keywords: ["unit converter", "length", "weight", "temperature"] },
    ],
  },
  {
    group: "Finance",
    items: [
      { slug: "mortgage", title: "Mortgage Calculator", subtitle: "Annuity/equal principal · schedule", description: "Calculate monthly payments under annuity and equal-principal plans with a full period-by-period schedule, total interest comparison and prepayment estimates. Exact local math.", keywords: ["mortgage calculator", "loan payment", "amortization schedule", "equal principal"] },
      { slug: "deposit", title: "Deposit Calculator", subtitle: "Simple/compound · APY", description: "Compute maturity value with simple or compound interest, convert to annualized yield and compare term options, finance-grade formulas, all local.", keywords: ["deposit calculator", "interest calculator", "compound interest", "APY"] },
      { slug: "irr", title: "True APR (IRR)", subtitle: "See through installment fees", description: "Solve the internal rate of return behind credit-card installments and consumer loans to reveal the true annualized cost, iterative solver, all local.", keywords: ["IRR calculator", "true APR", "installment rate", "loan true cost"] },
    ],
  },
];

export const ALL_TOOLS_EN: ToolSeo[] = TOOL_GROUPS_EN.flatMap((g) => g.items);

export function findToolEn(slug: string): ToolSeo | undefined {
  return ALL_TOOLS_EN.find((t) => t.slug === slug);
}

export function toolMetadataEn(seo: ToolSeo): Metadata {
  const url = absUrl(`/en/${seo.slug}`);
  return {
    title: `${seo.title} - ${SITE_NAME} EN`,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${seo.title} - ${SITE_NAME} EN`,
      description: seo.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [OG_IMAGE] },
  };
}
