"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_TOOLS_EN, TOOL_GROUPS_EN } from "@/lib/seo-en";
import { parseRegex, runMatches } from "@/lib/regex";
import { RecentTools, catAnchor, recordToolVisit } from "@/components/ui";
import { CatIcon, ToolIcon } from "@/components/Icon";
import "../hero.css";

/** EN 分类名 → 图标集里的中文分类键（图标只按中文键注册） */
const EN_TO_CN_CAT: Record<string, string> = {
  Encoding: "编码",
  Text: "文本",
  Crypto: "加密",
  Dev: "开发",
  Time: "时间",
  Files: "文件",
  Convert: "文件",
  Design: "设计",
  Finance: "生活",
};

const PRESET_TAGS = ["regex", "hash", "uuid", "base", "jwt", "cron", "pdf", "unit", "case", "color"];

/* 面板演示数据：交给 src/lib/regex 的真引擎跑，数字全部是算出来的 */
const PATTERN = String.raw`\d{3,4}-\d{4}|[\w.+-]+@[\w-]+\.[\w-]{2,}`;
const FLAGS = "gim";
const PANEL_TEXT = `Invoice check: invoice@example.com
Support: support@example.com
Ticket 8823-4471 / 4471-8823`;

const PANEL = (() => {
  const { re, issue } = parseRegex(PATTERN, FLAGS);
  const ms = re && !issue ? runMatches(PANEL_TEXT, re) : [];
  return { ms, groups: ms[0]?.groups.length ?? 0, chars: PANEL_TEXT.length };
})();

/** 按真实命中下标把文本切成 <mark> 段 */
function marked(text: string) {
  const out: React.ReactNode[] = [];
  let at = 0;
  PANEL.ms.forEach((m, i) => {
    if (m.index > at) out.push(text.slice(at, m.index));
    out.push(<mark key={i}>{m.full}</mark>);
    at = m.index + m.length;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

const DEV_GROUP = TOOL_GROUPS_EN.find((g) => g.group === "Dev")!;

function HeroPanel() {
  return (
    <div id="dbx">
      <div className="dbx-cap">
        <h2>What the Regex Tester looks like</h2>
        <p className="who">Categories on the left, pattern and text in the middle, every hit on the right — all computed live.</p>
        <Link className="live" href="/en/regex" onClick={() => recordToolVisit("regex")}>
          Open the real one →
        </Link>
      </div>
      <div className="dbx-app">
        <div className="dbx-rail">
          <div className="dbx-lab">Categories</div>
          {TOOL_GROUPS_EN.map((g) => (
            <Link
              key={g.group}
              href={`#${catAnchor(g.group, true)}`}
              className={`dbx-rc${g.group === "Dev" ? " on" : ""}`}
            >
              <CatIcon group={EN_TO_CN_CAT[g.group] ?? ""} size={16} />
              <span>{g.group}</span>
              <i className="n">{g.items.length}</i>
            </Link>
          ))}
          <div className="dbx-railfoot">
            {ALL_TOOLS_EN.length} tools
            <br />
            all computed in your browser
          </div>
        </div>
        <div className="dbx-pane">
          <div className="dbx-tbar">
            <span className="dbx-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="dbx-ttl">
              <ToolIcon slug="regex" size={18} />
              <b>Regex Tester</b>
            </span>
            <span className="dbx-crumbs">box / Dev</span>
            <span className="dbx-req">runs locally</span>
          </div>
          <div className="dbx-chips">
            <span className="dbx-lab" style={{ padding: 0 }}>
              In this category
            </span>
            {DEV_GROUP.items.map((t) => (
              <Link
                key={t.slug}
                href={`/en/${t.slug}`}
                onClick={() => recordToolVisit(t.slug)}
                className={`dbx-ch${t.slug === "regex" ? " on" : ""}`}
              >
                <ToolIcon slug={t.slug} size={15} />
                {t.title}
              </Link>
            ))}
          </div>
          <div className="dbx-pbody">
            <div className="dbx-pcol">
              <label className="dbx-flab">PATTERN</label>
              <div className="dbx-box dbx-inpat">
                <span className="dbx-sl" aria-hidden="true">
                  /
                </span>
                <code>{PATTERN}</code>
                <span className="dbx-sl" aria-hidden="true">
                  /{FLAGS}
                </span>
              </div>
              <div className="dbx-flags">
                {FLAGS.split("").map((f) => (
                  <span key={f} className="dbx-fg" aria-pressed="true">
                    {f}
                  </span>
                ))}
                <span className="dbx-fnote">global · ignore case · multiline</span>
              </div>
              <label className="dbx-flab" style={{ marginTop: 10 }}>
                Test text
              </label>
              <div className="dbx-box dbx-ta">{marked(PANEL_TEXT)}</div>
            </div>
            <div className="dbx-pcol">
              <label className="dbx-flab">Result</label>
              <div className="dbx-big">
                <b>{PANEL.ms.length}</b>
                <span>matches</span>
                <span className="sub">{PANEL.chars} chars</span>
              </div>
              <div className="dbx-mlist">
                {PANEL.ms.map((m, i) => (
                  <div key={i} className="dbx-mi">
                    <span className="mt">{m.full}</span>
                    <span className="ix">@{m.index}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EnHome() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return TOOL_GROUPS_EN;
    return TOOL_GROUPS_EN.map((g) => ({
      ...g,
      items: g.items.filter((t) =>
        [t.title, t.subtitle, t.description, t.slug, g.group, ...t.keywords].join(" ").toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length);
  }, [q]);

  const total = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  return (
    <div>
      <section className="hero">
        <div className="hero-in">
          <div>
            <p className="pill">
              <b aria-hidden="true" />
              {TOOL_GROUPS_EN.length} categories · {ALL_TOOLS_EN.length} tools · nothing leaves this device
            </p>
            <h1 className="disp">
              {ALL_TOOLS_EN.length} everyday tools,
              <em>all computed in your browser</em>
            </h1>
            <p className="lede">
              Encoding, hashing, regex, PDF, units and finance. No upload, no sign-up, no queue — they keep working offline.
            </p>
            <p className="cta">
              <Link href="#tools" className="btn">
                Browse all tools
              </Link>
              <Link href="/en/regex" className="lnk" onClick={() => recordToolVisit("regex")}>
                Try the regex tester
              </Link>
            </p>
          </div>
          <div className="hero-num" aria-hidden="true">
            <span>{ALL_TOOLS_EN.length}</span>
            <small>TOOLS</small>
          </div>
        </div>
        <HeroPanel />
      </section>

      <section className="mt-10 mb-8" aria-label="Search tools">
        <div className="relative max-w-2xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink3 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools by name or keyword…"
            aria-label="Search tools"
            className="w-full pl-11 pr-11 py-3 rounded-[10px] text-[15.5px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface hover:bg-surface2 text-ink2 hover:text-ink text-xs flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4" aria-label="Suggested searches">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(query.trim() === tag ? "" : tag)}
              aria-pressed={query.trim() === tag}
              className={`px-3 py-1 rounded-[8px] text-[15px] font-mono border transition-colors ${
                query.trim() === tag
                  ? "text-accd border-acct bg-accp font-semibold"
                  : "text-ink2 border-line hover:border-line2 hover:text-ink"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {!q && <RecentTools tools={ALL_TOOLS_EN} />}

      <section id="tools" className="scroll-mt-24">
        {q ? (
          <p className="text-[15px] font-mono text-ink3 mb-5" aria-live="polite">
            <span className="text-ink tabular-nums">{total}</span> tools match “{query.trim()}”
          </p>
        ) : (
          <h2 className="text-[26px] font-extrabold tracking-[-0.025em] text-ink mb-5">All tools</h2>
        )}

        {groups.map((group) => (
          <div key={group.group} id={catAnchor(group.group, true)} className="scroll-mt-24 mb-9">
            <h3 className="flex items-center gap-2.5 text-[19px] font-bold text-ink mb-3.5">
              <CatIcon group={EN_TO_CN_CAT[group.group] ?? ""} size={19} className="text-acc" />
              {group.group}
              <span className="text-ink3 font-mono text-[15px] tabular-nums">{group.items.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {group.items.map((t) => (
                <Link
                  key={t.slug}
                  href={`/en/${t.slug}`}
                  onClick={() => recordToolVisit(t.slug)}
                  className="card-hover group rounded-[6px] border border-line bg-card px-5 pt-5 pb-[18px] flex flex-col"
                >
                  <h4 className="flex items-center gap-2.5 text-[17.5px] font-bold text-ink leading-snug mb-2">
                    <ToolIcon slug={t.slug} size={19} className="text-acc shrink-0" />
                    <span className="min-w-0">{t.title}</span>
                  </h4>
                  <p className="text-[16px] leading-[1.6] text-ink2 flex-1">{t.subtitle}</p>
                  <span className="mt-3.5 flex items-center gap-1 text-[15px] font-mono text-ink3 group-hover:text-ink transition-colors">
                    Open
                    <svg
                      className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {q && total === 0 && (
          <div className="text-center py-16">
            <p className="text-[17px] text-ink2 mb-2">No tool matches “{query.trim()}”</p>
            <p className="text-[15px] font-mono text-ink3">Try “hash”, “regex” or “unit”, or another keyword</p>
          </div>
        )}
      </section>
    </div>
  );
}
