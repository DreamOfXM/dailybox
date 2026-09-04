"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOL_GROUPS_EN } from "@/lib/seo-en";
import { Badge, TOOL_ICON, TOOL_TILE_GRADIENT } from "@/components/ui";

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
              <Link key={t.slug} href={`/en/${t.slug}`} className="card-hover group relative p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] flex flex-col gap-3 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${TOOL_TILE_GRADIENT[t.slug] || "from-white/5 to-white/5"} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none`} />
                <div className="relative z-10 flex items-center gap-3">
                  <span className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${TOOL_TILE_GRADIENT[t.slug] || "from-white/10 to-white/5"} flex items-center justify-center text-base font-bold font-mono text-white shadow-[var(--shadow-1)]`}>{TOOL_ICON[t.slug] || t.slug.slice(0,2).toUpperCase()}</span>
                  <span className="text-sm font-semibold text-white line-clamp-1">{t.title}</span>
                </div>
                <span className="relative z-10 text-xs text-neutral-500 line-clamp-2 flex-1">{t.subtitle}</span>
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <Badge>{g.group}</Badge>
                  <svg className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="text-center text-xs font-mono text-neutral-700 mt-10">12 tools · English version · {FLAT.length} tools total</p>
    </div>
  );
}
