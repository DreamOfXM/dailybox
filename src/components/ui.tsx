"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { copyText } from "@/lib/format";
import type { ToolSeo } from "@/lib/seo";
import { ALL_TOOLS, TOOL_GROUPS } from "@/lib/seo";
import { ALL_TOOLS_EN, TOOL_GROUPS_EN } from "@/lib/seo-en";
import { ToolIcon } from "@/components/Icon";

/* ---------- 结构化数据 ---------- */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ---------- 页面骨架 ---------- */
export function PageHeader({
  badge,
  title,
  subtitle,
  tone = "blue",
  extra,
}: {
  badge: string;
  title: string;
  subtitle: string;
  tone?: "blue" | "emerald" | "violet" | "amber";
  /** 可选：标题右侧附加内容（新增可选 prop，不影响既有调用） */
  extra?: ReactNode;
}) {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  // 工具图标按路由段取：/regex 与 /en/regex 都是 slug「regex」
  const slug = pathname.replace(/^\/en(?=\/|$)/, "").split("/").filter(Boolean)[0] ?? "";
  const tones: Record<string, string> = {
    blue: "text-info border-line2 bg-infop",
    emerald: "text-acc border-acct bg-accp",
    violet: "text-viol border-violp bg-violp",
    amber: "text-warn border-warnp bg-warnp",
  };
  return (
    <header className="mb-10">
      <Link
        href={isEn ? "/en" : "/"}
        className="inline-flex items-center gap-1.5 text-[14px] font-mono text-ink3 hover:text-ink mb-8 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {isEn ? "Back to all tools" : "返回全部工具"}
      </Link>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <ToolIcon slug={slug} size={26} className="shrink-0 text-acc -mb-1" />
        <span className={`px-2 py-0.5 rounded-[4px] text-[12.5px] font-mono uppercase tracking-wider border ${tones[tone]}`}>
          {badge}
        </span>
        <h1 className="text-[34px] font-extrabold text-ink tracking-[-0.025em]">{title}</h1>
        {extra}
      </div>
      <p className="text-[16px] text-ink2">{subtitle}</p>
    </header>
  );
}

/* ---------- 分段控制器 ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode }>;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex bg-surface rounded-lg p-1 border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${
            value === o.value
              ? "bg-acc text-white shadow-[var(--shadow-1)]"
              : "text-ink3 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 徽章（新增） ---------- */
export type BadgeTone = "neutral" | "blue" | "emerald" | "violet" | "amber" | "rose";
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "text-ink2 border-line bg-surface",
    blue: "text-info border-line2 bg-infop",
    emerald: "text-acc border-acct bg-accp",
    violet: "text-viol border-violp bg-violp",
    amber: "text-warn border-warnp bg-warnp",
    rose: "text-rose border-errline bg-errbg",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- 分区卡片（新增） ---------- */
export function SectionCard({
  title,
  subtitle,
  count,
  aside,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-ink tracking-wide truncate">{title}</h2>
          {subtitle && <span className="text-[11px] font-mono text-ink3 truncate">{subtitle}</span>}
          {typeof count === "number" && (
            <span className="text-[10px] font-mono text-ink3 tabular-nums">× {count}</span>
          )}
        </div>
        {aside && <div className="flex items-center gap-2">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/* ---------- 开关 ---------- */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-info" : "bg-surface2"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-card transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
      <span className="text-sm text-ink">
        {label}
        {hint && <span className="ml-1.5 text-xs text-ink3 font-mono">{hint}</span>}
      </span>
    </label>
  );
}

/* ---------- 数字/文本输入（带校验） ---------- */
export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-mono text-ink3 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] font-mono text-ink3">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-errink font-mono flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-errink" />
          {error}
        </p>
      )}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
  invalid,
  className = "",
}: {
  value: number | string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  invalid?: boolean;
  /** 新增可选：附加类名，不影响既有调用 */
  className?: string;
}) {
  // 输入草稿：编辑中允许完全清空（显示空框），合法数字才上报；失焦时空框回落为 0。
  // 不用 type="number"，因为浏览器会把 "1."、"-" 等中间态吞成空串。
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (raw.trim() !== "" && Number.isFinite(Number(raw))) onChange(raw);
  };

  const handleBlur = () => {
    if (draft === null) return;
    if (draft.trim() === "") onChange("0");
    else if (!Number.isFinite(Number(draft))) onChange(String(value));
    setDraft(null);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-full px-4 py-3 rounded-xl font-mono text-[15px] pr-14 ${
          invalid ? "border-errline" : ""
        }`}
      />
      {suffix && <span className="absolute right-4 text-xs font-mono text-ink3 pointer-events-none">{suffix}</span>}
    </div>
  );
}

/* ---------- 文件拖放区（PDF/图片/视频工具共用） ---------- */
/**
 * 统一的文件选择入口：原生 file input 的「选择文件」按钮在浅色主题下几乎
 * 不可见（file:bg-surface 贴近白底），这里用虚线卡片承载，拖入时高亮。
 * accept 同时约束点选与拖放：MIME 精确匹配、"image/*" 通配、".png" 后缀。
 */
export function FileDrop({
  accept,
  multiple,
  onFiles,
  hint,
  className = "",
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** 次行说明文案（支持格式等）；缺省时从 accept 推导 */
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const isEn = (usePathname() || "").startsWith("/en");

  const accepts = useMemo(
    () => (accept ? accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : []),
    [accept],
  );

  const matchAccept = useCallback(
    (f: File) => {
      if (!accepts.length) return true;
      const type = f.type.toLowerCase();
      const name = f.name.toLowerCase();
      return accepts.some((tok) =>
        tok.startsWith(".")
          ? name.endsWith(tok)
          : tok.endsWith("/*")
            ? type.startsWith(tok.slice(0, -1))
            : type === tok,
      );
    },
    [accepts],
  );

  const emit = useCallback(
    (list: FileList | File[] | null) => {
      const picked = list ? Array.from(list) : [];
      const ok = accepts.length ? picked.filter(matchAccept) : picked;
      if (ok.length) onFiles(ok);
      // 清掉 value，让下次重新选择同一批文件也能再次触发 change
      if (inputRef.current) inputRef.current.value = "";
    },
    [accepts, matchAccept, onFiles],
  );

  const derived =
    accepts.length > 0
      ? accepts
          .map((t) =>
            t.startsWith(".")
              ? t.slice(1).toUpperCase()
              : t.endsWith("/*")
                ? t.slice(0, -2).toUpperCase()
                : t.split("/").pop()!.toUpperCase(),
          )
          .join(" / ")
      : "";
  const sub = `${hint ?? (isEn ? `Supports ${derived}` : `支持 ${derived} 格式`)}${multiple ? (isEn ? " · multiple" : " · 可多选") : ""}`;

  return (
    <label
      className={`block cursor-pointer rounded-2xl border border-dashed transition-colors select-none has-[:focus-visible]:border-acc has-[:focus-visible]:bg-accp ${
        over ? "border-acc bg-accp" : "border-line2 bg-ground hover:border-acc hover:bg-surface"
      } ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        emit(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => emit(e.target.files)}
      />
      <div className="flex flex-col items-center gap-1.5 py-8 px-4 text-center">
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink3"
          aria-hidden="true"
        >
          <path d="M12 16V5m0 0l-4 4m4-4l4 4" />
          <path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5" />
        </svg>
        <p className="text-sm text-ink2">{isEn ? "Click to choose or drop file(s) here" : "点击选择，或把文件拖到这里"}</p>
        {sub.trim() && <p className="text-[11px] font-mono text-ink3">{sub}</p>}
      </div>
    </label>
  );
}

/* ---------- 结果统计卡 ---------- */
export function Stat({
  label,
  value,
  unit,
  tone = "default",
  emphasis,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: "default" | "good" | "bad" | "warn" | "accent";
  emphasis?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "text-ink",
    good: "text-acc",
    bad: "text-errink",
    warn: "text-warn",
    accent: "text-info",
  };
  return (
    <div
      className={`card-hover rounded-xl border p-4 ${
        emphasis
          ? "border-line2 bg-info/[0.06]"
          : "border-line bg-surface hover:bg-surface2"
      }`}
    >
      <div className="text-[11px] font-mono text-ink3 mb-1.5">{label}</div>
      <div className={`font-mono tabular-nums ${emphasis ? "text-2xl" : "text-xl"} font-semibold ${tones[tone]}`}>
        {value}
        {unit && <span className="text-xs text-ink3 ml-1 font-normal">{unit}</span>}
      </div>
    </div>
  );
}

/* ---------- 空/错误态 ---------- */
export function Hint({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const map = {
    info: { c: "border-line bg-surface text-ink2", d: "•" },
    error: { c: "border-errline bg-errbg text-errink", d: "!" },
    success: { c: "border-acct bg-acc/5 text-accd", d: "✓" },
    warn: { c: "border-warnp bg-warnp text-warn", d: "⚠" },
  }[kind];
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm font-mono ${map.c}`}>
      <span className="mt-0.5 w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px] flex-shrink-0">
        {map.d}
      </span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

/* ---------- 显式假设说明 ---------- */
export function AssumptionNote({ items }: { items: Array<{ k: string; v: string }> }) {
  return (
    <div className="rounded-xl border border-violp bg-violp p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-viol text-sm">ⓘ</span>
        <span className="text-xs font-mono uppercase tracking-wider text-viol">计算假设 · 可展开核对</span>
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
        {items.map((it) => (
          <div key={it.k} className="text-xs font-mono">
            <dt className="text-ink3">{it.k}</dt>
            <dd className="text-ink">{it.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- 文件下载（触发浏览器保存） ---------- */
export function downloadFile(name: string, content: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- 复制按钮（带 toast） ---------- */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const onCopy = useCallback(async () => {
    const ok = await copyText(text);
    setState(ok ? "ok" : "fail");
    setTimeout(() => setState("idle"), 1500);
  }, [text]);
  if (!text) return null;
  return (
    <button
      onClick={onCopy}
      className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${
        state === "ok"
          ? "text-acc bg-accp"
          : state === "fail"
          ? "text-errink bg-errbg"
          : "text-info hover:text-info hover:bg-surface"
      }`}
      aria-live="polite"
    >
      {state === "ok" ? (isEn ? "Copied" : "已复制") : state === "fail" ? (isEn ? "Failed" : "失败") : label ?? (isEn ? "Copy" : "复制")}
    </button>
  );
}

/* ============================================================
   最近使用（localStorage，无账号）
   存储 {路径 slug + 时间戳}，按 slug 去重、倒序、最多 8 条。
   仅记录站内点击（首页卡片 / 顶栏 / 最近使用自身），直接输入
   URL 进入的工具页无法被本组件感知（各工具页不在本 agent 范围）。
   ============================================================ */
const RECENT_KEY = "toolkit.recent.v1";
const RECENT_MAX = 8;

export interface RecentEntry {
  slug: string;
  ts: number;
}

export function readRecentEntries(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: RecentEntry[] = [];
    for (const it of arr) {
      if (it && typeof it === "object" && typeof (it as RecentEntry).slug === "string" && typeof (it as RecentEntry).ts === "number") {
        const e = it as RecentEntry;
        if (!seen.has(e.slug)) {
          seen.add(e.slug);
          out.push({ slug: e.slug, ts: e.ts });
        }
      }
    }
    return out.slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

export function recordToolVisit(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const rest = readRecentEntries().filter((e) => e.slug !== slug);
    const next = [{ slug, ts: Date.now() }, ...rest].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式等场景下静默降级 */
  }
}

/** 最近使用区：挂在首页，空态不渲染（避免 SSR/首屏闪烁） */
export function RecentTools({ tools }: { tools: ToolSeo[] }) {
  const [recent, setRecent] = useState<ToolSeo[]>([]);
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");

  useEffect(() => {
    const entries = readRecentEntries();
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    setRecent(entries.map((e) => bySlug.get(e.slug)).filter((t): t is ToolSeo => !!t));
  }, [tools]);

  if (recent.length === 0) return null;

  return (
    <section className="mb-12" aria-label={isEn ? "Recently used" : "最近使用"}>
      <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ink3 mb-4">
        <span className="w-1 h-1 rounded-full bg-acc" />
        {isEn ? "Recently used" : "最近使用"}
        <span className="text-ink3 tabular-nums">· {recent.length}</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {recent.map((t) => (
          <Link
            key={t.slug}
            href={isEn ? `/en/${t.slug}` : `/${t.slug}`}
            onClick={() => recordToolVisit(t.slug)}
            className="card-hover shrink-0 flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full border border-line bg-surface hover:bg-surface2"
            title={t.subtitle}
          >
            <span className="w-6 h-6 shrink-0 flex items-center justify-center text-ink2">
              <ToolIcon slug={t.slug} size={20} />
            </span>
            <span className="text-sm text-ink whitespace-nowrap">{t.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   全局壳：顶栏分类导航 + 页脚站点地图（L10 版式）
   ============================================================ */
export interface NavItem {
  slug: string;
  href: string;
  label: string;
  title?: string;
}

/** 中文分类 → ASCII 锚点段 */
export const CAT_SLUG: Record<string, string> = {
  编码: "encode", 文本: "text", 加密: "crypto", 开发: "dev",
  时间: "time", 文件: "files", 设计: "design", 生活: "life",
};

/** 分类 → 首页锚点 id（顶栏、首页分组区块、面板侧栏共用同一套） */
export const catAnchor = (group: string, isEn = false) =>
  isEn ? group.toLowerCase().replace(/[^a-z0-9]+/g, "-") : CAT_SLUG[group] ?? "tools";

function useActiveSlug() {
  const pathname = usePathname();
  const seg = pathname?.replace(/^\/en(?=\/|$)/, "").split("/").filter(Boolean)[0];
  return seg ?? "";
}

/** 顶栏 logo：字标 + 一枚实心绿方标（W7 顶栏锚点的两半之一，另一半是右侧绿胶囊） */
export function SiteBrand() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  return (
    <Link href={isEn ? "/en" : "/"} className="shrink-0 whitespace-nowrap flex items-center gap-[7px] text-[24px] font-extrabold tracking-[-0.025em] leading-[1.3] text-ink">
      <i
        aria-hidden="true"
        className="inline-flex w-[26px] h-[26px] shrink-0 items-center justify-center rounded-[8px] bg-acc text-ground"
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M3 11h18M8 7V4.5h8V7" />
        </svg>
      </i>
      dailybox
    </Link>
  );
}

/** 顶栏语言切换：优先跳到当前页的另一语言版本；CN 独有工具在 EN 无对应页时回退到 EN 首页 */
export function SiteLangToggle() {
  const pathname = usePathname() || "";
  const p = pathname.replace(/\/+$/, "") || "/";
  const isEn = p.startsWith("/en");
  let href: string;
  if (isEn) {
    href = p === "/en" ? "/" : p.slice(3) || "/";
  } else {
    const slug = p.replace(/^\//, "");
    href = slug && !ALL_TOOLS_EN.some((t) => t.slug === slug) ? "/en" : `/en${p === "/" ? "" : p}`;
  }
  return (
    <Link
      href={href}
      title={isEn ? "切换到中文站" : "Switch to the English site"}
      className="order-3 shrink-0 whitespace-nowrap font-mono text-[15.5px] leading-[2.05] text-ink3 hover:text-ink border-b border-line2 hover:border-ink transition-colors"
    >
      {isEn ? "中文" : "EN"}
    </Link>
  );
}

/** 顶栏主操作：实心绿胶囊（W7 量到的那枚「顶栏实心品牌块」，34px 高、全圆角），真的跳到卡墙 */
export function NavCta() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const n = (isEn ? ALL_TOOLS_EN : ALL_TOOLS).length;
  return (
    <Link
      href={isEn ? "/en#tools" : "/#tools"}
      className="order-4 shrink-0 whitespace-nowrap inline-flex items-center h-[34px] px-[13px] sm:px-[16px] rounded-full bg-acc text-[#fff] text-[14px] font-medium hover:bg-accd transition-colors"
    >
      {isEn ? `All ${n} tools` : `全部 ${n} 个工具`}
    </Link>
  );
}

/** 桌面端分类锚点（<768px 由 MobileNav 抽屉接管）。锚点与首页各分类区块的 id 一致 */
export function CategoryLinks() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const groups = isEn ? TOOL_GROUPS_EN : TOOL_GROUPS;
  return (
    <nav
      aria-label={isEn ? "Tool categories" : "工具分类"}
      className="hidden md:flex min-w-0 flex-1 items-center gap-6 overflow-x-auto no-scrollbar text-[15.5px]"
    >
      {groups.map((g) => (
        <Link
          key={g.group}
          href={`${isEn ? "/en" : "/"}#${catAnchor(g.group, isEn)}`}
          className="shrink-0 whitespace-nowrap text-ink2 hover:text-ink transition-colors"
        >
          {g.group}
        </Link>
      ))}
    </nav>
  );
}

/** 移动端抽屉导航（<768px 显示汉堡按钮 + 展开面板，33 个工具全在里面） */
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const active = useActiveSlug();
  const isEn = (usePathname() || "").startsWith("/en");
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="md:hidden relative order-3 md:order-none">
      <button
        type="button"
        aria-label={open ? (isEn ? "Close menu" : "关闭导航") : isEn ? "Open menu" : "打开导航"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-md border border-line bg-card hover:bg-ground"
      >
        <span className={`block w-4 h-px bg-ink2 transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
        <span className={`block w-4 h-px bg-ink2 transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 top-[66px] z-40 bg-ink/20" onClick={close} aria-hidden="true" />
          <nav
            aria-label={isEn ? "All tools" : "全部工具"}
            className="fixed right-3 top-[74px] z-50 w-60 rounded-xl border border-line bg-card/95 backdrop-blur-md shadow-[var(--shadow-lift)] p-2 max-h-[70vh] overflow-y-auto"
          >
            {items.map((it) => (
              <Link
                key={it.slug}
                href={it.href}
                onClick={() => {
                  recordToolVisit(it.slug);
                  close();
                }}
                aria-current={active === it.slug ? "page" : undefined}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  active === it.slug
                    ? "text-ink bg-accp font-semibold"
                    : "text-ink2 hover:text-ink hover:bg-ground"
                }`}
              >
                {it.title || it.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

/* ---------- 页脚：大字字标 + 口径行 + 8 分类站点地图 + 落款 ---------- */
export function SiteFooter() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");
  const groups = isEn ? TOOL_GROUPS_EN : TOOL_GROUPS;
  const total = isEn ? ALL_TOOLS_EN.length : ALL_TOOLS.length;
  return (
    <footer className="border-t border-line2 bg-ground2">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8 pt-16 pb-10">
        <p
          aria-hidden="true"
          className="text-[clamp(56px,15vw,180px)] leading-[0.86] tracking-[-0.05em] font-extrabold text-line2 mb-7"
        >
          dailybox
        </p>
        <div className="flex flex-wrap gap-x-[34px] gap-y-2 border-t border-line pt-6 text-[15.5px] text-ink2">
          <span>{isEn ? `${total} everyday tools, computed in your browser` : `${total} 个日常工具，全部在浏览器里算完`}</span>
          <span>{isEn ? `${groups.length} categories` : `${groups.length} 个分类`}</span>
          <span>{isEn ? "No account, no upload" : "无需注册，输入不上传"}</span>
          <Link href={isEn ? "/en" : "/"} className="font-semibold text-ink hover:text-acc transition-colors">
            {isEn ? "All tools" : "回到全部工具"}
          </Link>
        </div>
        <div className={`mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 ${isEn ? "lg:grid-cols-5" : "lg:grid-cols-4 xl:grid-cols-8"}`}>
          {groups.map((g) => (
            <div key={g.group}>
              <h3 className="mb-2.5 font-mono text-[12.5px] uppercase tracking-wider text-ink3">{g.group}</h3>
              <ul className="space-y-1.5">
                {g.items.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={isEn ? `/en/${t.slug}` : `/${t.slug}`}
                      onClick={() => recordToolVisit(t.slug)}
                      className="text-[14.5px] text-ink2 hover:text-acc transition-colors"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 font-mono text-[15.5px] leading-[1.8] text-ink3">
          <b className="text-ink2">dailybox</b> ·{" "}
          {isEn
            ? `one person's toolbox — ${total} tools, © 2026`
            : `一个人写的一只纸盒：${total} 件工具 · 2026`}
        </p>
      </div>
    </footer>
  );
}
