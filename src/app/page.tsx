"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_TOOLS, TOOL_GROUPS } from "@/lib/seo";
import { parseRegex, runMatches } from "@/lib/regex";
import { RecentTools, catAnchor, recordToolVisit } from "@/components/ui";
import { CatIcon, ToolIcon } from "@/components/Icon";
import "./hero.css";

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

export default function Home() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return TOOL_GROUPS.map((g) => ({ ...g, items: g.items }));
    return TOOL_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((t) => {
        const hay = [t.title, t.subtitle, t.description, t.slug, g.group, ...t.keywords].join(" ").toLowerCase();
        return q.split(/\s+/).every((word) => hay.includes(word));
      }),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  const total = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  return (
    <div>
      {/* ---------- Hero：左文案，下方摊开的真产品界面 ---------- */}
      <section className="hero">
        <div className="hero-in">
          <div>
            <p className="pill">
              <b aria-hidden="true" />
              {TOOL_GROUPS.length} 个分类 · {ALL_TOOLS.length} 个工具 · 输入不出本机
            </p>
            <h1 className="disp">
              {ALL_TOOLS.length} 个日常工具，
              <em>全部在浏览器里算完</em>
            </h1>
            <p className="lede">
              编码、哈希、正则、PDF、汇率与单位换算。不上传、不注册、不排队；断网也能用，结果可以复制走。
            </p>
            <p className="cta">
              <Link href="#tools" className="btn">
                浏览全部工具
              </Link>
              <Link href="/regex" className="lnk" onClick={() => recordToolVisit("regex")}>
                先试试正则测试
              </Link>
            </p>
          </div>
          <div className="hero-num" aria-hidden="true">
            <span>{ALL_TOOLS.length}</span>
            <small>TOOLS</small>
          </div>
        </div>
        <HeroPanel />
      </section>

      {/* ---------- 搜索 + 预设标签 ---------- */}
      <section className="mt-10 mb-8" aria-label="搜索工具">
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
            placeholder="搜索工具：名称、关键词，如「正则」「单位」…"
            aria-label="搜索工具"
            className="w-full pl-11 pr-11 py-3 rounded-[10px] text-[15.5px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="清空搜索"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface hover:bg-surface2 text-ink2 hover:text-ink text-xs flex items-center justify-center"
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
      </section>

      {/* ---------- 最近使用（localStorage，空态自动隐藏） ---------- */}
      {!q && <RecentTools tools={ALL_TOOLS} />}

      {/* ---------- 工具列表 ---------- */}
      <section id="tools" className="scroll-mt-24">
        {q ? (
          <p className="text-[15px] font-mono text-ink3 mb-5" aria-live="polite">
            找到 <span className="text-ink tabular-nums">{total}</span> 个匹配「{query.trim()}」的工具
          </p>
        ) : (
          <h2 className="text-[26px] font-extrabold tracking-[-0.025em] text-ink mb-5">全部工具</h2>
        )}

        {groups.map((group) => (
          <div key={group.group} id={catAnchor(group.group)} className="scroll-mt-24 mb-9">
            <h3 className="flex items-center gap-2.5 text-[19px] font-bold text-ink mb-3.5">
              <CatIcon group={group.group} size={19} className="text-acc" />
              {group.group}
              <span className="text-ink3 font-mono text-[15px] tabular-nums">{group.items.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {group.items.map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  onClick={() => recordToolVisit(t.slug)}
                  className="card-hover group rounded-[6px] border border-line bg-card px-5 pt-5 pb-[18px] flex flex-col"
                >
                  <h4 className="flex items-center gap-2.5 text-[17.5px] font-bold text-ink leading-snug mb-2">
                    <ToolIcon slug={t.slug} size={19} className="text-acc shrink-0" />
                    <span className="min-w-0">{t.title}</span>
                  </h4>
                  <p className="text-[16px] leading-[1.6] text-ink2 flex-1">{t.subtitle}</p>
                  <span className="mt-3.5 flex items-center gap-1 text-[15px] font-mono text-ink3 group-hover:text-ink transition-colors">
                    打开
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
            <p className="text-[17px] text-ink2 mb-2">没有找到「{query.trim()}」相关的工具</p>
            <p className="text-[15px] font-mono text-ink3">试试「哈希」「正则」「单位」等标签，或换个关键词</p>
          </div>
        )}
      </section>
    </div>
  );
}
