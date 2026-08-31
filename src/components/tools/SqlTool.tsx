"use client";

import { useState, type ReactNode } from "react";
import { findTool } from "@/lib/seo";
import { formatSql } from "@/lib/sql";
import type { TryResult } from "@/lib/base64";
import { CopyButton, Hint, PageHeader, SectionCard, Toggle, downloadFile } from "@/components/ui";

const seo = findTool("sql")!;

/* ---------- 语法高亮（纯渲染层，不改变任何字符） ---------- */
const HL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "FETCH",
  "UNION", "ALL", "INTERSECT", "EXCEPT", "JOIN", "LEFT", "RIGHT", "FULL", "INNER", "OUTER",
  "CROSS", "ON", "USING", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "ILIKE",
  "BETWEEN", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "INSERT", "INTO", "VALUES",
  "UPDATE", "SET", "DELETE", "WITH", "RECURSIVE", "DISTINCT", "ASC", "DESC",
]);
const HL_FUNCS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "IFNULL", "CAST", "NOW",
  "CONCAT", "SUBSTRING", "SUBSTR", "TRIM", "UPPER", "LOWER", "LENGTH", "ROUND", "FLOOR",
  "CEIL", "ABS", "MOD", "DATE", "YEAR", "MONTH", "DAY", "IF", "RANK", "ROW_NUMBER",
]);

/** 逐行 tokenize 上色：字符串/注释整段保护，关键字/函数/数字分色 */
function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /('[^']*'|"[^"]*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[^\sA-Za-z0-9_]+|\s+)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line)) !== null) {
    const t = m[0];
    const ch = t[0];
    let cls = "text-neutral-400"; // 标点默认
    if (ch === "'" || ch === '"' || ch === "`") cls = "text-amber-300";
    else if (t.startsWith("--") || t.startsWith("/*")) cls = "text-neutral-600 italic";
    else if (/^\d/.test(t)) cls = "text-orange-300";
    else if (/^[A-Za-z_]/.test(t)) {
      const u = t.toUpperCase();
      if (HL_KEYWORDS.has(u)) cls = "text-sky-400 font-semibold";
      else if (HL_FUNCS.has(u)) cls = "text-violet-400";
      else cls = "text-neutral-200";
    }
    out.push(
      <span key={k++} className={cls}>
        {t}
      </span>,
    );
  }
  return out;
}

function SqlHighlighted({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0f] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 text-[10px] font-mono text-neutral-600 uppercase tracking-wider">formatted.sql</span>
      </div>
      <div className="overflow-x-auto">
        <table className="font-mono text-xs leading-6 border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                <td className="select-none text-right pr-4 pl-4 text-neutral-700 align-top w-10 border-r border-white/[0.04]">
                  {i + 1}
                </td>
                <td className="pl-4 pr-4 whitespace-pre">{line === "" ? "\u00A0" : highlightLine(line)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 默认示例：一坨没格式的常见查询 */
const SAMPLE_SQL =
  "select u.id, u.name, count(o.id) as order_count from users u left join orders o on o.user_id = u.id where u.status = 'active' and o.created_at >= '2026-01-01' group by u.id, u.name having count(o.id) > 3 order by order_count desc limit 20;";

export default function SqlTool() {
  const [sql, setSql] = useState(SAMPLE_SQL);
  const [upper, setUpper] = useState(true);
  const [commaNl, setCommaNl] = useState(true);
  // 首屏即展示示例的格式化结果，不做空白页
  const [result, setResult] = useState<TryResult<string>>(() =>
    formatSql(SAMPLE_SQL, { upperCase: true, commaNewline: true }),
  );

  const runFormat = (s: string, u: boolean, c: boolean) => {
    setResult(formatSql(s, { upperCase: u, commaNewline: c }));
  };

  return (
    <>
      <PageHeader badge="开发" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* 输入 */}
        <SectionCard
          title="粘贴 SQL"
          subtitle="SELECT / INSERT / UPDATE / DELETE · 字符串与注释原样保留"
          aside={
            <button
              type="button"
              onClick={() => {
                setSql(SAMPLE_SQL);
                runFormat(SAMPLE_SQL, upper, commaNl);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          }
        >
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={7}
            placeholder="把一坨 SQL 粘贴到这里…"
            autoComplete="off"
            spellCheck={false}
            aria-label="SQL 输入"
            className="w-full px-4 py-3 rounded-xl font-mono text-xs leading-relaxed resize-y whitespace-pre overflow-x-auto"
          />

          {/* 选项 + 格式化 */}
          <div className="flex items-center gap-6 flex-wrap mt-3">
            <Toggle
              checked={upper}
              onChange={(v) => {
                setUpper(v);
                runFormat(sql, v, commaNl); // 切换即刻按新选项重排
              }}
              label="关键字大写"
              hint="SELECT / FROM / WHERE…"
            />
            <Toggle
              checked={commaNl}
              onChange={(v) => {
                setCommaNl(v);
                runFormat(sql, upper, v);
              }}
              label="逗号换行"
              hint="列表项逐行展开"
            />
            <button
              type="button"
              onClick={() => runFormat(sql, upper, commaNl)}
              className="px-4 py-1.5 rounded-lg text-xs font-mono bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              格式化
            </button>
          </div>
        </SectionCard>

        {/* 输出 */}
        <SectionCard
          title="格式化结果"
          subtitle="子句换行 · JOIN 缩进 · 本地运算"
          aside={
            result.ok ? (
              <>
                <CopyButton text={result.value} label="复制" />
                <button
                  type="button"
                  onClick={() => downloadFile("formatted.sql", result.value, "text/plain;charset=utf-8")}
                  className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
                >
                  下载 .sql
                </button>
              </>
            ) : undefined
          }
        >
          {result.ok ? (
            <SqlHighlighted code={result.value} />
          ) : (
            <Hint kind="error">{result.message}</Hint>
          )}
        </SectionCard>
      </div>
    </>
  );
}
