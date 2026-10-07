import type { MetadataRoute } from "next";
import { ALL_TOOLS, absUrl } from "@/lib/seo";
import { ALL_TOOLS_EN } from "@/lib/seo-en";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    // W3C 要求不带毫秒
  const now = new Date().toISOString().split(".")[0] + "Z";
  const home = absUrl("/");
  const homeEn = absUrl("/en");
  const entries: MetadataRoute.Sitemap = [
    {
      url: home,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { "zh-CN": home, en: homeEn } },
    },
    {
      url: homeEn,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { "zh-CN": home, en: homeEn } },
    },
    ...ALL_TOOLS.map((t) => ({
      url: absUrl(`/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      // 中英同 slug 互指，帮助 Google 把两语言版本配对
      ...(ALL_TOOLS_EN.some((e) => e.slug === t.slug)
        ? { alternates: { languages: { "zh-CN": absUrl(`/${t.slug}`), en: absUrl(`/en/${t.slug}`) } } }
        : {}),
    })),
    ...ALL_TOOLS_EN.map((t) => ({
      url: absUrl(`/en/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages: { "zh-CN": absUrl(`/${t.slug}`), en: absUrl(`/en/${t.slug}`) } },
    })),
  ];
  return entries.map((e) => ({
    url: e.url,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
    ...(e.alternates ? { alternates: e.alternates } : {}),
  }));
}
