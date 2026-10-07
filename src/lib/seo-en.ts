import type { Metadata } from "next";
import { SITE_NAME, OG_IMAGE, absUrl, type ToolSeo } from "./site";

/** English SEO for 28 universal tools (CN-only tools like 人民币大写/身份证 stay Chinese) */
export const TOOL_GROUPS_EN: Array<{ group: string; items: ToolSeo[] }> = [
  {
    group: "Encoding",
    items: [
      { slug: "url", title: "URL Encoder/Decoder", subtitle: "encodeURIComponent · encodeURI · Form", description: "Free online URL encode/decode with 3 modes, tolerant to broken percent sequences, full Unicode & emoji support. Runs locally, no upload.", keywords: ["URL encode", "URL decode", "encodeURIComponent", "online URL tool"] , faqs: [{q:"Does it upload my data?",a:"No. Encoding and decoding run entirely in your browser; nothing leaves your device."}] },
      { slug: "qrcode", title: "QR Code Generator", subtitle: "Text/URL · Size · ECC", description: "Generate QR codes from text or links in the browser, adjustable size, error correction level and colors, download as PNG. Local, nothing uploads.", keywords: ["QR code generator", "make QR code", "link to QR", "free QR code"] , faqs: [{q:"Do the QR codes expire?",a:"No. The content is encoded into the pattern itself and scans forever, no server involved."}] },
    ],
  },
  {
    group: "Text",
    items: [
      { slug: "wordcount", title: "Word Counter", subtitle: "Chars · Words · Read time", description: "Count characters, characters without spaces, words, lines and estimated reading time in real time, accurate for mixed CJK and Latin text.", keywords: ["word counter", "character count", "text count", "reading time"] , faqs: [{q:"Is CJK text counted correctly?",a:"Yes. CJK characters count per character, plus words, lines and estimated reading time."}] },
      { slug: "caseconvert", title: "Case Converter", subtitle: "UPPER/lower/camel/snake", description: "Convert text between upper case, lower case, title case, camelCase and snake_case instantly, for code naming and text cleanup.", keywords: ["case converter", "uppercase to lowercase", "camelCase", "snake_case"] , faqs: [{q:"Which cases are supported?",a:"UPPER, lower, Title Case, camelCase and snake_case, one click each."}] },
      { slug: "textcompare", title: "Text Compare", subtitle: "Line diff · add/delete highlight", description: "Compare two texts line by line with added, deleted and changed highlights plus diff counts, for code, config and document versions. Local.", keywords: ["text compare", "diff tool", "text difference", "compare online"] , faqs: [{q:"Can I compare code?",a:"Yes. Line-based diff works on any plain text: code, JSON, YAML, config files."}] },
      { slug: "dedupe", title: "Dedupe & Sort", subtitle: "Dedupe · Sort · clean blank lines", description: "Remove duplicate lines, sort alphabetically or by length, strip blank lines and trim leading/trailing spaces in one pass, for lists and keywords.", keywords: ["remove duplicates", "dedupe lines", "sort lines", "text clean"] , faqs: [{q:"Does dedupe keep the first occurrence?",a:"Yes. Later duplicates are dropped; optionally sort A-Z or by length and strip blank lines."}] },
      { slug: "textbinary", title: "Text ↔ Binary", subtitle: "UTF-8 · two-way · separator", description: "Convert text to 01 binary and back, UTF-8 safe for CJK characters, custom separator, for learning, debugging and CTF practice.", keywords: ["text to binary", "binary to text", "01 converter", "utf-8 binary"] , faqs: [{q:"Which encoding is used?",a:"UTF-8, so CJK characters convert correctly; the separator is customizable."}] },
    ],
  },
  {
    group: "Crypto",
    items: [
      { slug: "hash", title: "Hash Generator", subtitle: "MD5 · SHA-1/256/384/512", description: "Online hash calculator for MD5, SHA-1, SHA-256, SHA-384, SHA-512 with hex & base64 output, Web Crypto powered. Local.", keywords: ["MD5", "SHA256", "hash calculator", "online hash"] , faqs: [{q:"Is MD5 still safe?",a:"MD5 and SHA-1 are broken for security purposes but fine for checksums. Prefer SHA-256 or above."}] },
    ],
  },
  {
    group: "Dev",
    items: [
      { slug: "regex", title: "Regex Tester", subtitle: "Live match · Highlight · Explain", description: "Online regex tester with live highlight, groups, and plain English explanation. Covers JS regex.", keywords: ["regex tester", "regular expression", "online regex"] , faqs: [{q:"Which regex flavor is supported?",a:"JavaScript (ES2023), including named groups and lookbehind, with plain-English token explanations."}] },
      { slug: "uuid", title: "UUID Generator", subtitle: "v4 · v7 · Bulk", description: "Generate UUID v4/v7 and random numbers in bulk, with format options, using crypto-grade randomness.", keywords: ["UUID generator", "GUID", "random generator", "uuid v7"] , faqs: [{q:"Should I pick v4 or v7?",a:"v4 is fully random and fits most cases; v7 is time-ordered and index-friendly for database keys."}] },
      { slug: "radix", title: "Base Converter", subtitle: "Bin/Oct/Dec/Hex · BigInt", description: "Convert between binary, octal, decimal, hex in real time, BigInt for huge numbers.", keywords: ["base converter", "binary", "hex", "BigInt"] , faqs: [{q:"How large can numbers be?",a:"BigInt-powered, with no floating-point precision limit across binary, octal, decimal and hex."}] },
      { slug: "jwt", title: "JWT Decoder", subtitle: "Header · Payload · Expiry", description: "Decode JWT header/payload, show human time and expiry badge, no signature verification, local.", keywords: ["JWT decoder", "JWT parser", "token decode"] , faqs: [{q:"Does it verify signatures?",a:"No. It decodes header and payload and shows expiry; verification requires the server secret."}] },
      { slug: "sql", title: "SQL Formatter", subtitle: "Beautify · Uppercase Keywords", description: "Format SQL (SELECT/INSERT/UPDATE/DELETE) with keyword uppercasing and indentation.", keywords: ["SQL formatter", "beautify SQL", "sql formatter online"] , faqs: [{q:"Which SQL statements are supported?",a:"Generic beautifying for SELECT/INSERT/UPDATE/DELETE with keyword uppercasing; strings and comments preserved."}] },
    ],
  },
  {
    group: "Time",
    items: [
      { slug: "cron", title: "Cron Expression", subtitle: "Parse · Human Readable · Next Run", description: "Parse cron expressions to plain English and next 5 run times.", keywords: ["cron", "cron parser", "cron generator"] , faqs: [{q:"5-field or 6-field cron?",a:"Standard 5-field Linux crontab, with the next 5 run times computed for you."}] },
    ],
  },
  {
    group: "Files",
    items: [
      { slug: "pdf", title: "PDF Merge & Split", subtitle: "Merge many · Extract pages", description: "Browser PDF tool: merge multiple PDFs in order, or split/extract a page range into a new file, powered by pdf-lib entirely locally, no upload.", keywords: ["PDF merge", "PDF split", "extract PDF pages", "online PDF"] , faqs: [{q:"Are files uploaded?",a:"Never. Merging and splitting run locally via pdf-lib in your browser."}] },
      { slug: "image", title: "Image Compress & Convert", subtitle: "JPG/PNG/WebP · Bulk", description: "Compress and convert JPG/PNG/WebP in bulk, resize and quality control via Canvas/WASM, local.", keywords: ["image compress", "image converter", "jpg to png", "webp"] , faqs: [{q:"Is compression lossy?",a:"JPG/WebP are lossy with a quality slider; PNG conversion stays lossless. Everything is local."}] },
      { slug: "video", title: "Video Compress & Convert", subtitle: "MP4/WebM · Compress", description: "Compress and convert MP4/WebM with ffmpeg.wasm locally, 720p, no upload.", keywords: ["video compress", "video converter", "mp4 to webm", "ffmpeg"] , faqs: [{q:"Why is the first load slow?",a:"Video processing downloads ffmpeg.wasm (about 25MB) once; your browser caches it afterwards."}] },
      { slug: "pdfrotate", title: "PDF Rotate", subtitle: "Whole file or per page · 90/180/270", description: "Rotate all pages or selected pages by 90/180/270 degrees with per-page angle preview, straighten scanned documents. pdf-lib, local.", keywords: ["rotate PDF", "PDF rotate pages", "fix PDF orientation"] , faqs: [{q:"Can I rotate specific pages only?",a:"Yes — whole file or selected pages, 90/180/270 degrees with live preview."}] },
      { slug: "pdforganize", title: "PDF Organize", subtitle: "Reorder · delete · extract pages", description: "Reorder, delete or extract PDF pages with thumbnail preview and export a brand-new PDF, original untouched, powered by pdf-lib locally.", keywords: ["organize PDF", "reorder PDF pages", "delete PDF pages", "extract pages"] , faqs: [{q:"Does it modify my original PDF?",a:"No. A brand-new file is exported; the original stays untouched."}] },
      { slug: "pdfwatermark", title: "PDF Watermark", subtitle: "Text/image · opacity · tile", description: "Add text watermarks (Latin letters, digits, symbols) or image watermarks (logos, stamps) with size, color, opacity, rotation and tiling, on all or selected pages. Local.", keywords: ["PDF watermark", "add watermark to PDF", "stamp PDF"] , faqs: [{q:"Can I watermark with a Chinese logo?",a:"Yes — use image watermark mode with a PNG/JPG logo for CJK text; text mode covers Latin letters, digits and symbols."}] },
      { slug: "pdfpagenum", title: "PDF Page Numbers", subtitle: "6 positions · format · start at", description: "Add page numbers in six header/footer positions with custom format ({n} current page, {total} page count), start number, font size/color and skip-first-page option. Local.", keywords: ["PDF page numbers", "add page numbers PDF", "number PDF pages"] , faqs: [{q:"Can the page number format be customized?",a:"Yes: {n} for current page, {total} for page count, 6 positions, start number, size and color."}] },
      { slug: "pdftojpg", title: "PDF to JPG", subtitle: "Every page · JPG/PNG · quality", description: "Render every PDF page to JPG or PNG in the browser with pdf.js, adjustable scale and background, download a single page or a ZIP of all pages. Local.", keywords: ["PDF to JPG", "PDF to PNG", "convert PDF to image", "PDF export images"] , faqs: [{q:"Can I adjust image quality?",a:"Yes, 1x-3x scale; every page can be downloaded individually or zipped in one click."}] },
      { slug: "jpgtopdf", title: "Image to PDF", subtitle: "JPG/PNG · A4 or original size", description: "Combine multiple JPG/PNG images into one PDF in order, fit original image size or uniform A4 with orientation and margin control. Local.", keywords: ["image to PDF", "JPG to PDF", "PNG to PDF", "combine images to PDF"] , faqs: [{q:"What order are images merged in?",a:"List order, drag to rearrange; original size or uniform A4 with orientation and margin control."}] },
    ],
  },
  {
    group: "Design",
    items: [
      { slug: "colorconvert", title: "Color Converter", subtitle: "HEX/RGB/HSL · picker · preview", description: "Convert between HEX, RGB and HSL with a visual picker and live preview, copy any format in one click, for design and frontend work.", keywords: ["color converter", "hex to rgb", "rgb to hsl", "color picker"] , faqs: [{q:"Is there a color picker?",a:"Yes, a visual picker with live HEX/RGB/HSL conversion and one-click copy."}] },
    ],
  },
  {
    group: "Convert",
    items: [
      { slug: "unit", title: "Unit Converter", subtitle: "Length · Weight · Temp", description: "Convert length, weight, area, temp, data size with all units live. Includes imperial.", keywords: ["unit converter", "length", "weight", "temperature"] , faqs: [{q:"Which unit systems are covered?",a:"Length, weight, area, temperature and data size, with imperial and metric converting live."}] },
    ],
  },
  {
    group: "Finance",
    items: [
      { slug: "mortgage", title: "Mortgage Calculator", subtitle: "Annuity/equal principal · schedule", description: "Calculate monthly payments under annuity and equal-principal plans with a full period-by-period schedule, total interest comparison and prepayment estimates. Exact local math.", keywords: ["mortgage calculator", "loan payment", "amortization schedule", "equal principal"] , faqs: [{q:"Annuity or equal principal?",a:"Both plans with a full amortization schedule, total interest comparison and prepayment estimates."}] },
      { slug: "deposit", title: "Deposit Calculator", subtitle: "Simple/compound · APY", description: "Compute maturity value with simple or compound interest, convert to annualized yield and compare term options, finance-grade formulas, all local.", keywords: ["deposit calculator", "interest calculator", "compound interest", "APY"] , faqs: [{q:"Simple or compound interest?",a:"Both, plus APY conversion and side-by-side term comparison."}] },
      { slug: "irr", title: "True APR (IRR)", subtitle: "See through installment fees", description: "Solve the internal rate of return behind credit-card installments and consumer loans to reveal the true annualized cost, iterative solver, all local.", keywords: ["IRR calculator", "true APR", "installment rate", "loan true cost"] , faqs: [{q:"Why is the true APR higher than quoted?",a:"Installment fees are charged on the original principal while your balance shrinks monthly; the true APR is roughly 1.8-2x the quoted rate."}] },
    ],
  },
];

export const ALL_TOOLS_EN: ToolSeo[] = TOOL_GROUPS_EN.flatMap((g) => g.items);

export function findToolEn(slug: string): ToolSeo | undefined {
  return ALL_TOOLS_EN.find((t) => t.slug === slug);
}

export function toolMetadataEn(seo: ToolSeo): Metadata {
  const url = absUrl(`/en/${seo.slug}`);
  const title = `${seo.title} - Free Online Tool | DailyBox`;
  return {
    // absolute：避免 en/layout 的 title.template 再叠一遍 "| DailyBox"
    title: { absolute: title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: url,
      languages: { "zh-CN": absUrl(`/${seo.slug}`), en: url },
    },
    openGraph: {
      title,
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
