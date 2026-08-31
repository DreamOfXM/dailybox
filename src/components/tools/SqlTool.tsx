"use client";

import { useState } from "react";
import { findTool } from "@/lib/seo";
import { formatSql } from "@/lib/sql";
import type { TryResult } from "@/lib/base64";
import { CopyButton, Hint, PageHeader, SectionCard, Toggle, downloadFile } from "@/components/ui";

const seo = findTool("sql")!;

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
            <pre className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 font-mono text-xs leading-relaxed text-neutral-200 whitespace-pre overflow-x-auto">
              {result.value}
            </pre>
          ) : (
            <Hint kind="error">{result.message}</Hint>
          )}
        </SectionCard>
      </div>
    </>
  );
}
