import type { Metadata } from "next";
import { SITE_ORIGIN, BASE_PATH } from "@/lib/seo";

export const metadata: Metadata = {
  title: { default: "DailyBox EN - Free Online Toolbox", template: "%s | DailyBox EN" },
  description: "Free online toolbox for developers: URL, Hash, Regex, UUID, Base Converter, JWT, SQL, Cron, PDF, Image, Video, Unit. All local, no upload.",
  alternates: { canonical: SITE_ORIGIN + BASE_PATH + "/en/" },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
