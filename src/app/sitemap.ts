import type { MetadataRoute } from "next";
import { ALL_TOOLS, absUrl } from "@/lib/seo";
import { ALL_TOOLS_EN } from "@/lib/seo-en";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    // W3C 要求不带毫秒
  const now = new Date().toISOString().split(".")[0] + "Z";
  const entries = [
    { url: absUrl("/"), changeFrequency: "monthly" as const, priority: 1 },
    { url: absUrl("/en"), changeFrequency: "monthly" as const, priority: 0.9 },
    ...ALL_TOOLS.map((t) => ({
      url: absUrl(`/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...ALL_TOOLS_EN.map((t) => ({
      url: absUrl(`/en/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
  return entries.map((e) => ({
    url: e.url,
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
