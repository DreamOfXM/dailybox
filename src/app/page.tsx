"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_TOOLS, TOOL_GROUPS } from "@/lib/seo";
import { CARD_COPY } from "@/lib/card-copy";
import { parseRegex, runMatches } from "@/lib/regex";
import { RecentTools, catAnchor, recordToolVisit } from "@/components/ui";
import { CatIcon, ToolIcon } from "@/components/Icon";
import "./hero.css";
import "./wall.css";

/** 搜索预设标签：一键填入 */
const PRESET_TAGS = ["编码", "哈希", "正则", "UUID", "进制", "JWT", "SQL", "Cron", "大写", "身份证", "单位"];

/* 面板演示数据：交给 src/lib/regex 的真引擎跑，数字全部是算出来的 */
const PATTERN = String.raw`\d{3,4}-\d{4}|[\w.+-]+@[\w-]+\.[\w-]{2,}`;
const FLAGS = "gim";
const PANEL_TEXT = `发票校验：invoice@example.com
技术支持：support@example.com
工单号 8823-4471 / 4471-8823`;

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

const DEV_GROUP = TOOL_GROUPS.find((g) => g.group === "开发")!;

function HeroPanel() {
  const [copied, setCopied] = useState("");
  const copy = (what: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(what);
        setTimeout(() => setCopied(""), 1600);
      },
      () => setCopied("复制失败")
    );
  };

  return (
    <div id="dbx">
      <div className="dbx-cap">
        <h2>正则测试打开后的样子</h2>
        <p className="who">左侧八个分类、中间 pattern 与文本、右侧逐条命中，都是产品里真实运行的结果。</p>
        <Link className="live" href="/regex" onClick={() => recordToolVisit("regex")}>
          打开能用的那一台 →
        </Link>
      </div>
      <div className="dbx-app">
        <div className="dbx-rail">
          <div className="dbx-lab">八个分类</div>
          {TOOL_GROUPS.map((g) => (
            <Link
              key={g.group}
              href={`#${catAnchor(g.group)}`}
              className={`dbx-rc${g.group === "开发" ? " on" : ""}`}
            >
              <CatIcon group={g.group} size={16} />
              <span>{g.group}</span>
              <i className="n">{g.items.length}</i>
            </Link>
          ))}
          <div className="dbx-railfoot">
            共 {ALL_TOOLS.length} 件
            <br />
            全部在浏览器里算完
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
              <b>正则测试</b>
            </span>
            <span className="dbx-crumbs">盒子 / 开发</span>
            <span className="dbx-req">全部本地运算</span>
          </div>
          <div className="dbx-chips">
            <span className="dbx-lab" style={{ padding: 0 }}>
              同类工具
            </span>
            {DEV_GROUP.items.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
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
                <span className="dbx-fnote">全局 · 忽略大小写 · 多行</span>
              </div>
              <label className="dbx-flab" style={{ marginTop: 10 }}>
                测试文本
              </label>
              <div className="dbx-box dbx-ta">{marked(PANEL_TEXT)}</div>
            </div>
            <div className="dbx-pcol">
              <label className="dbx-flab">结果</label>
              <div className="dbx-big">
                <b>{PANEL.ms.length}</b>
                <span>处命中</span>
                <span className="sub">
                  GROUPS {PANEL.groups} · {PANEL.chars} 字符
                </span>
              </div>
              <div className="dbx-mlist">
                {PANEL.ms.map((m, i) => (
                  <div key={i} className="dbx-mi">
                    <span className="mt">{m.full}</span>
                    <span className="ix">@{m.index}</span>
                  </div>
                ))}
              </div>
              <div className="dbx-copy">
                <button
                  type="button"
                  className="dbx-btn"
                  onClick={() => copy("已复制匹配结果", PANEL.ms.map((m) => m.full).join("\n"))}
                >
                  {copied.startsWith("已复制匹配") ? copied : "复制匹配结果"}
                </button>
                <button type="button" className="dbx-btn" onClick={() => copy("已复制 PATTERN", PATTERN)}>
                  {copied === "已复制 PATTERN" ? copied : "复制 PATTERN"}
                </button>
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
      href={`/${t.slug}`}
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
      <p>{CARD_COPY[t.slug] ?? t.title}</p>
    </Link>
  );
}

export default function Home() {
  const [cat, setCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  /** 组序 → 色阶 class；卡片按分类成组排列（与 TOOL_GROUPS 同序） */
  const ordered = useMemo(
    () =>
      TOOL_GROUPS.flatMap((g, gi) =>
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
    return TOOL_GROUPS.flatMap((g, gi) =>
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
        <h1>处理文本、编码、加密、PDF 的 {ALL_TOOLS.length} 个工具</h1>
        <p>复制粘贴就有结果，输入不出你的浏览器 —— 不上传、不注册、不收费。</p>
      </section>

      {/* ---------- 分类胶囊：选中即筛上方卡墙 ---------- */}
      <div className="wb-break">
        <div className="wb-pills" role="group" aria-label="按分类筛选工具">
          {[null, ...TOOL_GROUPS.map((g) => g.group)].map((g) => (
            <button
              key={g ?? "all"}
              type="button"
              className="wb-pill"
              aria-pressed={cat === g}
              onClick={() => setCat(g)}
            >
              {g ?? "全部"}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- 卡墙：33 张长卡，首屏就摆满工具本身 ---------- */}
      <section id="tools" className="wb-break scroll-mt-24">
        <h2 className="sr-only">全部工具</h2>
        <div className="wb-wall">
          {ordered.map(({ t, gi, group, first }) => (
            <WallCard key={t.slug} t={t} groupIdx={gi} anchorId={first ? catAnchor(group) : undefined} />
          ))}
        </div>
      </section>

      {/* ---------- 按名字搜：墙下方的第二找法，结果用同一种卡 ---------- */}
      <section className="mt-2 mb-10" aria-label="搜索工具">
        <div className="wb-search">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="想不起名字就搜：输入「正则」「二维码」「身份证」…"
            aria-label="搜索工具"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="清空搜索"
              className="w-6 h-6 shrink-0 rounded-full bg-surface hover:bg-surface2 text-ink2 hover:text-ink text-xs flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4" aria-label="预设搜索标签">
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
              找到 <span className="text-ink tabular-nums">{hits.length}</span> 个匹配「{query.trim()}」的工具
            </p>
            {hits.length > 0 ? (
              <div className="wb-wall" style={{ padding: "0 0 8px" }}>
                {hits.map(({ t, gi }) => (
                  <WallCard key={t.slug} t={t} groupIdx={gi} />
                ))}
              </div>
            ) : (
              <p className="text-[15px] font-mono text-ink3">
                没有匹配的工具，试试上面的标签，或换个关键词
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---------- 最近使用（localStorage，空态自动隐藏） ---------- */}
      <RecentTools tools={ALL_TOOLS} />

      {/* ---------- 摊开的真产品界面：正则测试打开后的样子 ---------- */}
      <HeroPanel />
    </div>
  );
}
