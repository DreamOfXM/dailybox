"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOL_GROUPS_EN } from "@/lib/seo-en";
import { Badge } from "@/components/ui";

const FLAT = TOOL_GROUPS_EN.flatMap((g) => g.items);

export default function EnHome() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    if (!q) return TOOL_GROUPS_EN;
    const lower = q.toLowerCase();
    return TOOL_GROUPS_EN.map((g) => ({
      ...g,
      items: g.items.filter((t) => [t.title, t.description, t.slug, ...t.keywords].join(" ").toLowerCase().includes(lower)),
    })).filter((g) => g.items.length);
  }, [q]);
  return (
    <div>
      <section className="text-center mb-10">
        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">DailyBox EN</h1>
        <p className="text-neutral-500 max-w-md mx-auto">12 universal tools for developers — URL, Hash, Regex, UUID, Base, JWT, SQL, Cron, PDF, Image, Video, Unit. All local.</p>
        <Link href="/dailybox/" className="inline-flex mt-4 text-xs font-mono text-neutral-500 hover:text-white">← 中文版</Link>
      </section>
      <div className="max-w-xl mx-auto mb-8">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools..." className="w-full px-4 py-3 rounded-2xl text-sm font-mono" />
      </div>
      {groups.map((g) => (
        <section key={g.group} className="mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-600 mb-3">{g.group} · {g.items.length}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {g.items.map((t) => (
              <Link key={t.slug} href={`/en/${t.slug}`} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] flex flex-col gap-2">
                <span className="text-sm font-semibold text-white">{t.title}</span>
                <span className="text-xs text-neutral-500 line-clamp-2">{t.subtitle}</span>
                <Badge>{g.group}</Badge>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="text-center text-xs font-mono text-neutral-700 mt-10">12 tools · English version · {FLAT.length} tools total</p>
    </div>
  );
}
