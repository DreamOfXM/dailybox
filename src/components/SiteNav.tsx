"use client";

import { usePathname } from "next/navigation";
import { ALL_TOOLS, navLabel } from "@/lib/seo";
import { ALL_TOOLS_EN } from "@/lib/seo-en";
import { DesktopNavLinks, MobileNav, type NavItem } from "@/components/ui";

export default function SiteNav() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const items: NavItem[] = isEn
    ? ALL_TOOLS_EN.map((t) => ({ slug: `en/${t.slug}`, label: t.slug.toUpperCase(), title: t.title }))
    : ALL_TOOLS.map((t) => ({ slug: t.slug, label: navLabel(t.slug), title: t.title }));
  return (
    <>
      <DesktopNavLinks items={items} />
      <MobileNav items={items} />
    </>
  );
}
