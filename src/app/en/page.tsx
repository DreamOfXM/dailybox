"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_TOOLS_EN, TOOL_GROUPS_EN } from "@/lib/seo-en";
import { CARD_COPY_EN } from "@/lib/card-copy";
import { parseRegex, runMatches } from "@/lib/regex";
import { RecentTools, catAnchor, recordToolVisit } from "@/components/ui";
import { CatIcon, ToolIcon } from "@/components/Icon";
import "../hero.css";
import "../wall.css";

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

/** 卡墙里的一张工具卡 —— 首页的墙与搜索结果共用同一张卡，保证两处形状一致 */
function WallCard({
  t,
  groupIdx,
  anchorId,
}: {
  t: { slug: string; title: string };
  groupIdx: number;
  anchorId?: string;
}) {
  return (
    <Link
      href={`/en/${t.slug}`}
      id={anchorId}
      onClick={() => recordToolVisit(t.slug)}
      className={`wb-card wg-${groupIdx}`}
    >
      <span className="wb-ico" aria-hidden="true">
        <span className="plate" />
        <span className="block">
          <ToolIcon slug={t.slug} size={17} />
        </span>
      </span>
      <h3>{t.title}</h3>
      <p>{CARD_COPY_EN[t.slug] ?? t.title}</p>
    </Link>
  );
}

export default function EnHome() {
  const [cat, setCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  /** 组序 → 色阶 class；卡片按分类成组排列（与 TOOL_GROUPS_EN 同序） */
  const ordered = useMemo(
    () =>
      TOOL_GROUPS_EN.flatMap((g, gi) =>
        (cat && g.group !== cat ? [] : g.items).map((t) => ({
          t,
          gi: gi + 1,
          group: g.group,
          first: g.items[0].slug === t.slug,
        }))
      ),
    [cat]
  );

  const hits = useMemo(() => {
    if (!q) return [];
    return TOOL_GROUPS_EN.flatMap((g, gi) =>
      g.items
        .filter((t) =>
          [t.title, t.subtitle, t.description, t.slug, g.group, ...t.keywords]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
        .map((t) => ({ t, gi: gi + 1 }))
    );
  }, [q]);

  return (
    <div>
      <div className="wb-bg" aria-hidden="true">
        <i className="r1" />
        <i className="c1" />
        <i className="c2" />
        <i className="e1" />
        <i className="r2" />
      </div>

      {/* ---------- 报头：把分类念出来的具名标题 + 一句结果承诺 ---------- */}
      <section className="wb-break wb-hero">
        <h1>{ALL_TOOLS_EN.length} tools for text, encoding, crypto and PDF</h1>
        <p>
          Copy, paste, get the result — your input never leaves this browser. No upload, no sign-up, no charge.
        </p>
      </section>

      {/* ---------- 分类胶囊：选中即筛上方卡墙 ---------- */}
      <div className="wb-break">
        <div className="wb-pills" role="group" aria-label="Filter tools by category">
          {[null, ...TOOL_GROUPS_EN.map((g) => g.group)].map((g) => (
            <button
              key={g ?? "all"}
              type="button"
              className="wb-pill"
              aria-pressed={cat === g}
              onClick={() => setCat(g)}
            >
              {g ?? "All"}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- 卡墙：28 张长卡，首屏就摆满工具本身 ---------- */}
      <section id="tools" className="wb-break scroll-mt-24">
        <h2 className="sr-only">All tools</h2>
        <div className="wb-wall">
          {ordered.map(({ t, gi, group, first }) => (
            <WallCard key={t.slug} t={t} groupIdx={gi} anchorId={first ? catAnchor(group, true) : undefined} />
          ))}
        </div>
      </section>

      {/* ---------- 按名字搜：墙下方的第二找法，结果用同一种卡 ---------- */}
      <section className="mt-2 mb-10" aria-label="Search tools">
        <div className="wb-search">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Not sure of the name? Search — try “regex”, “hash”, “watermark”…"
            aria-label="Search tools"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="w-6 h-6 shrink-0 rounded-full bg-surface hover:bg-surface2 text-ink2 hover:text-ink text-xs flex items-center justify-center"
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
        {q && (
          <div className="mt-6">
            <p className="text-[15px] font-mono text-ink3 mb-4" aria-live="polite">
              <span className="text-ink tabular-nums">{hits.length}</span> tools match “{query.trim()}”
            </p>
            {hits.length > 0 ? (
              <div className="wb-wall" style={{ padding: "0 0 8px" }}>
                {hits.map(({ t, gi }) => (
                  <WallCard key={t.slug} t={t} groupIdx={gi} />
                ))}
              </div>
            ) : (
              <p className="text-[15px] font-mono text-ink3">
                No tool matches it — try one of the tags above, or another keyword
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---------- 最近使用（localStorage，空态自动隐藏） ---------- */}
      <RecentTools tools={ALL_TOOLS_EN} />

      {/* ---------- 摊开的真产品界面：Regex Tester 打开后的样子 ---------- */}
      <HeroPanel />
    </div>
  );
}
