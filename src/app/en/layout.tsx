import type { Metadata } from "next";
import { SITE_ORIGIN, BASE_PATH } from "@/lib/seo";
import { ALL_TOOLS_EN } from "@/lib/seo-en";

const N = ALL_TOOLS_EN.length;

export const metadata: Metadata = {
  title: {
    default: `${N} Free Online Tools: PDF Merge, Regex Tester, Mortgage Calculator - DailyBox`,
    template: "%s | DailyBox",
  },
  description: `Free online toolbox for developers: URL, Hash, Regex, UUID, Base Converter, JWT, SQL, Cron, PDF, Image, Video, Unit. ${N} tools, all local, no upload, no signup.`,
  alternates: {
    canonical: SITE_ORIGIN + BASE_PATH + "/en/",
    languages: { "zh-CN": SITE_ORIGIN + BASE_PATH + "/", en: SITE_ORIGIN + BASE_PATH + "/en/" },
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
