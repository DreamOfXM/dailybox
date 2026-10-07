/**
 * 站点级共享常量。独立成模块是为了让 seo.ts 与 seo-en.ts 可以互相引用
 * （hreflang 中英互指）而不产生循环初始化问题。
 */
export const SITE_ORIGIN = "https://dreamofxm.github.io";
export const BASE_PATH = "/dailybox";
export const SITE_NAME = "DailyBox 日常工具箱";

export function absUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${BASE_PATH}${p === "/" ? "" : p.replace(/\/$/, "")}/`;
}

/** 全站默认分享图（1200×630）。文件位于 public/og.png，构建后可访问 /dailybox/og.png。 */
export const OG_IMAGE = absUrl("/og.png");

/** PWA 图标（public/icon.svg，绿色纸盒字标） */
export const ICON_SVG = absUrl("/icon.svg");

export interface ToolSeo {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  /** FAQ / 说明，用于 JSON-LD */
  faqs?: Array<{ q: string; a: string }>;
}
