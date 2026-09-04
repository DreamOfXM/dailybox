import type { Metadata } from "next";
import { SITE_NAME, OG_IMAGE, type ToolSeo, absUrl } from "./seo";

/** English SEO for 12 universal tools */
export const TOOL_GROUPS_EN: Array<{ group: string; items: ToolSeo[] }> = [
  {
    group: "Encoding",
    items: [
      { slug: "url", title: "URL Encoder/Decoder", subtitle: "encodeURIComponent · encodeURI · Form", description: "Free online URL encode/decode with 3 modes, tolerant to broken percent sequences, full Unicode & emoji support. Runs locally, no upload.", keywords: ["URL encode", "URL decode", "encodeURIComponent", "online URL tool"] },
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
      { slug: "pdf", title: "PDF Toolkit", subtitle: "Merge · Split · Compress", description: "Browser PDF toolkit: merge, split, compress, encrypt with pdf-lib WASM, no upload.", keywords: ["PDF merge", "PDF split", "compress PDF", "online PDF"] },
      { slug: "image", title: "Image Compress & Convert", subtitle: "JPG/PNG/WebP · Bulk", description: "Compress and convert JPG/PNG/WebP in bulk, resize and quality control via Canvas/WASM, local.", keywords: ["image compress", "image converter", "jpg to png", "webp"] },
      { slug: "video", title: "Video Compress & Convert", subtitle: "MP4/WebM · Compress", description: "Compress and convert MP4/WebM with ffmpeg.wasm locally, 720p, no upload.", keywords: ["video compress", "video converter", "mp4 to webm", "ffmpeg"] },
    ],
  },
  {
    group: "Convert",
    items: [
      { slug: "unit", title: "Unit Converter", subtitle: "Length · Weight · Temp", description: "Convert length, weight, area, temp, data size with all units live. Includes imperial.", keywords: ["unit converter", "length", "weight", "temperature"] },
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
