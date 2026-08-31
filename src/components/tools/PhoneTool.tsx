"use client";

import { useMemo, useState } from "react";
import { BASE_PATH, findTool } from "@/lib/seo";
import { isValidCnMobile, loadPhoneData, lookupPhone, type PhoneData, type PhoneInfo } from "@/lib/phone";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Stat } from "@/components/ui";

const seo = findTool("phone")!;

interface Row {
  phone: string;
  info: PhoneInfo | null;
  invalid: boolean;
}

export default function PhoneTool() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<PhoneData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const ensureData = async (): Promise<PhoneData | null> => {
    if (data) return data;
    setLoading(true);
    setLoadError("");
    try {
      const d = await loadPhoneData(BASE_PATH);
      setData(d);
      return d;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "号段数据加载失败，请刷新重试");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const query = async () => {
    const d = await ensureData();
    if (!d) return;
    const phones = input
      .split(/[\s,，;；\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 500);
    setRows(
      phones.map((p) => ({
        phone: p,
        invalid: !isValidCnMobile(p),
        info: lookupPhone(d, p),
      })),
    );
  };

  const single = rows.length === 1 ? rows[0] : null;
  const summary = useMemo(() => {
    const valid = rows.filter((r) => !r.invalid && r.info);
    const prov = new Set(valid.map((r) => r.info!.province));
    const isp = new Set(valid.map((r) => r.info!.isp));
    return { total: rows.length, hit: valid.length, prov: prov.size, isp: isp.size };
  }, [rows]);

  const copyText = rows
    .map((r) =>
      r.invalid
        ? `${r.phone}\t格式非法`
        : r.info
          ? `${r.phone}\t${r.info.province}\t${r.info.city}\t${r.info.isp}`
          : `${r.phone}\t号段未收录`,
    )
    .join("\n");

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="blue" />

      <div className="space-y-6">
        <SectionCard
          title="输入手机号"
          subtitle="支持单个或批量（空格/逗号/换行分隔，最多 500 个）· 全程本地检索，号码不上传"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder={"13800138000\n批量查询时每行一个号码"}
            autoComplete="off"
            spellCheck={false}
            aria-label="手机号输入"
            className="w-full px-4 py-3 rounded-xl font-mono text-xs leading-relaxed resize-y"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={query}
              disabled={loading || !input.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-mono bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {loading ? "加载号段数据…" : "查询"}
            </button>
            <button
              type="button"
              onClick={() => setInput("13800138000")}
              className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-white/[0.05] transition-colors"
            >
              填入示例
            </button>
          </div>
          {loadError && <div className="mt-3"><Hint kind="error">{loadError}</Hint></div>}
        </SectionCard>

        {single && !single.invalid && single.info && (
          <SectionCard title="查询结果" aside={<CopyButton text={`${single.phone} → ${single.info.province} ${single.info.city} ${single.info.isp}`} label="复制结果" />}>
            <div className="text-center py-4">
              <div className="text-3xl sm:text-4xl font-bold text-sky-300 mb-2">
                {single.info.province} · {single.info.city}
              </div>
              <div className="text-sm text-neutral-400">号段 {single.info.segment} · {single.info.isp}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="省份" value={single.info.province} />
              <Stat label="城市" value={single.info.city} />
              <Stat label="运营商" value={single.info.isp} tone="accent" />
            </div>
          </SectionCard>
        )}

        {single && single.invalid && <Hint kind="error">「{single.phone}」不是有效的 11 位大陆手机号</Hint>}
        {single && !single.invalid && !single.info && <Hint kind="warn">号段库暂未收录该号段，不做猜测</Hint>}

        {rows.length > 1 && (
          <SectionCard
            title={`批量结果（${summary.hit}/${summary.total} 命中）`}
            subtitle={`覆盖 ${summary.prov} 个省份 · ${summary.isp} 家运营商`}
            aside={<CopyButton text={copyText} label="复制全部" />}
          >
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-[#0d0d0f]">
                  <tr className="text-neutral-500 border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-4">号码</th>
                    <th className="text-left py-2 px-4">省份</th>
                    <th className="text-left py-2 px-4">城市</th>
                    <th className="text-left py-2 pl-4">运营商</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td className="py-2 pr-4 text-neutral-300">{r.phone}</td>
                      {r.invalid ? (
                        <td colSpan={3} className="py-2 px-4"><Badge tone="rose">格式非法</Badge></td>
                      ) : r.info ? (
                        <>
                          <td className="py-2 px-4 text-neutral-300">{r.info.province}</td>
                          <td className="py-2 px-4 text-neutral-300">{r.info.city}</td>
                          <td className="py-2 pl-4 text-neutral-400">{r.info.isp}</td>
                        </>
                      ) : (
                        <td colSpan={3} className="py-2 px-4"><Badge tone="amber">号段未收录</Badge></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        <Hint kind="info">
          号段数据约 48 万条（MIT 许可开源库），首次查询加载约 0.8MB 后常驻内存。归属地以号段发卡地为准，携号转网后运营商可能变化。
        </Hint>
      </div>
    </>
  );
}
