"use client";

import { usePathname } from "next/navigation";
import { ALL_TOOLS } from "@/lib/seo";
import { ALL_TOOLS_EN } from "@/lib/seo-en";
import { CategoryLinks, MobileNav, type NavItem } from "@/components/ui";

export default function SiteNav() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const items: NavItem[] = (isEn ? ALL_TOOLS_EN : ALL_TOOLS).map((t) => ({
    slug: t.slug,
    href: isEn ? `/en/${t.slug}` : `/${t.slug}`,
    label: t.slug,
    title: t.title,
  }));
  return (
    <>
      <CategoryLinks />
      <MobileNav items={items} />
    </>
  );
}
