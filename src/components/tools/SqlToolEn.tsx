"use client";

import { useState, type ReactNode } from "react";
import { findToolEn } from "@/lib/seo-en";
import { formatSql } from "@/lib/sql";
import type { TryResult } from "@/lib/base64";
import { CopyButton, Hint, PageHeader, SectionCard, Toggle, downloadFile } from "@/components/ui";

const seo = findToolEn("sql")!;

/* ---------- Syntax highlighting (render-only, no character changes) ---------- */
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

/** Line-by-line tokenize with color: strings/comments protected as whole segments, keywords/functions/numbers colored separately */
function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /('[^']*'|"[^"]*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[^\sA-Za-z0-9_]+|\s+)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line)) !== null) {
    const t = m[0];
    const ch = t[0];
    let cls = "text-neutral-400"; // Punctuation default
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

/** Default example: an unformatted common query */
const SAMPLE_SQL =
  "select u.id, u.name, count(o.id) as order_count from users u left join orders o on o.user_id = u.id where u.status = 'active' and o.created_at >= '2026-01-01' group by u.id, u.name having count(o.id) > 3 order by order_count desc limit 20;";

/** Map Chinese error messages from sql.ts to English equivalents. */
function enMsg(msg: string): string {
  if (/请输入 SQL/.test(msg)) return "Please enter a SQL statement";
  if (/内容为空或仅含注释/.test(msg)) return "SQL content is empty or contains only comments";
  return msg;
}

export default function SqlTool() {
  const [sql, setSql] = useState(SAMPLE_SQL);
  const [upper, setUpper] = useState(true);
  const [commaNl, setCommaNl] = useState(true);
  // Show formatted sample result on first render, avoid blank page
  const [result, setResult] = useState<TryResult<string>>(() =>
    formatSql(SAMPLE_SQL, { upperCase: true, commaNewline: true }),
  );

  const runFormat = (s: string, u: boolean, c: boolean) => {
    setResult(formatSql(s, { upperCase: u, commaNewline: c }));
  };

  return (
    <>
      <PageHeader badge="Dev" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        {/* Input */}
        <SectionCard
          title="Input SQL"
          subtitle="SELECT / INSERT / UPDATE / DELETE · strings and comments preserved"
          aside={
            <button
              type="button"
              onClick={() => {
                setSql(SAMPLE_SQL);
                runFormat(SAMPLE_SQL, upper, commaNl);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              Example
            </button>
          }
        >
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={7}
            placeholder="Paste your SQL here…"
            autoComplete="off"
            spellCheck={false}
            aria-label="SQL Input"
            className="w-full px-4 py-3 rounded-xl font-mono text-xs leading-relaxed resize-y whitespace-pre overflow-x-auto"
          />

          {/* Options + Format */}
          <div className="flex items-center gap-6 flex-wrap mt-3">
            <Toggle
              checked={upper}
              onChange={(v) => {
                setUpper(v);
                runFormat(sql, v, commaNl); // Reformat immediately on option change
              }}
              label="Uppercase keywords"
              hint="SELECT / FROM / WHERE…"
            />
            <Toggle
              checked={commaNl}
              onChange={(v) => {
                setCommaNl(v);
                runFormat(sql, upper, v);
              }}
              label="Break after commas"
              hint="List items on separate lines"
            />
            <button
              type="button"
              onClick={() => runFormat(sql, upper, commaNl)}
              className="px-4 py-1.5 rounded-lg text-xs font-mono bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              Format
            </button>
          </div>
        </SectionCard>

        {/* Output */}
        <SectionCard
          title="Formatted"
          subtitle="Clauses on new lines · JOIN indented · local processing"
          aside={
            result.ok ? (
              <>
                <CopyButton text={result.value} label="Copy" />
                <button
                  type="button"
                  onClick={() => downloadFile("formatted.sql", result.value, "text/plain;charset=utf-8")}
                  className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
                >
                  Download .sql
                </button>
              </>
            ) : undefined
          }
        >
          {result.ok ? (
            <SqlHighlighted code={result.value} />
          ) : (
            <Hint kind="error">{enMsg(result.message)}</Hint>
          )}
        </SectionCard>
      </div>
    </>
  );
}
