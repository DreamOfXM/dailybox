"use client";

import { useMemo, useState } from "react";
import { findTool } from "@/lib/seo";
import { lunarBirthdayToSolar, lunarToSolar, solarToLunar } from "@/lib/lunar";
import { Badge, CopyButton, Hint, PageHeader, SectionCard, Segmented, Stat, Toggle } from "@/components/ui";

const seo = findTool("lunar")!;

const pad = (n: number) => String(n).padStart(2, "0");
const today = new Date();

export default function LunarTool() {
  const [tab, setTab] = useState<"s2l" | "l2s" | "birthday">("s2l");

  // 公历 → 农历
  const [sy, setSy] = useState(String(today.getFullYear()));
  const [sm, setSm] = useState(String(today.getMonth() + 1));
  const [sd, setSd] = useState(String(today.getDate()));

  // 农历 → 公历
  const [ly, setLy] = useState(String(today.getFullYear()));
  const [lm, setLm] = useState("1");
  const [ld, setLd] = useState("1");
  const [leap, setLeap] = useState(false);

  // 农历生日
  const [bm, setBm] = useState("1");
  const [bd, setBd] = useState("1");
  const [bLeap, setBLeap] = useState(false);
  const [bYears, setBYears] = useState<"5" | "10" | "20">("10");

  const s2l = useMemo(() => {
    const y = parseInt(sy, 10), m = parseInt(sm, 10), d = parseInt(sd, 10);
    if (!y || !m || !d) return null;
    return solarToLunar(y, m, d);
  }, [sy, sm, sd]);

  const l2s = useMemo(() => {
    const y = parseInt(ly, 10), m = parseInt(lm, 10), d = parseInt(ld, 10);
    if (!y || !m || !d) return null;
    return lunarToSolar(y, m, d, leap);
  }, [ly, lm, ld, leap]);

  const birthdays = useMemo(() => {
    const m = parseInt(bm, 10), d = parseInt(bd, 10);
    if (!m || !d) return null;
    return lunarBirthdayToSolar(m, d, bLeap, today.getFullYear(), parseInt(bYears, 10));
  }, [bm, bd, bLeap, bYears]);

  const numInput = "w-full px-4 py-2.5 rounded-xl font-mono text-sm";

  return (
    <>
      <PageHeader badge="生活" title={seo.title} subtitle={seo.subtitle} tone="amber" />

      <div className="space-y-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "s2l", label: "公历 → 农历" },
            { value: "l2s", label: "农历 → 公历" },
            { value: "birthday", label: "农历生日查询" },
          ]}
          ariaLabel="功能切换"
        />

        {tab === "s2l" && (
          <>
            <SectionCard title="选择公历日期" subtitle="覆盖 1900-2100 年权威历算">
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">年</span>
                  <input value={sy} onChange={(e) => setSy(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">月</span>
                  <input value={sm} onChange={(e) => setSm(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">日</span>
                  <input value={sd} onChange={(e) => setSd(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
              </div>
            </SectionCard>

            {s2l === null ? (
              <Hint kind="error">请输入完整的年月日</Hint>
            ) : !s2l.ok ? (
              <Hint kind="error">{s2l.message}</Hint>
            ) : (
              <SectionCard
                title="农历信息"
                aside={
                  <CopyButton
                    text={`${sy}-${pad(parseInt(sm, 10))}-${pad(parseInt(sd, 10))} = 农历${s2l.value.ganZhi}${s2l.value.shengXiao}年 ${s2l.value.monthCn}月${s2l.value.dayCn}（${s2l.value.weekdayCn}）${s2l.value.festivals.length ? "，节日：" + s2l.value.festivals.join("、") : ""}`}
                    label="复制结果"
                  />
                }
              >
                <div className="text-center py-4">
                  <div className="text-3xl sm:text-4xl font-bold text-amber-300 mb-2">
                    {s2l.value.monthCn}月{s2l.value.dayCn}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {s2l.value.ganZhi}年（{s2l.value.shengXiao}）· {s2l.value.weekdayCn}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Stat label="干支（民俗·正月初一为界）" value={s2l.value.ganZhi + "年"} />
                  <Stat label="干支（命理·立春为界）" value={s2l.value.ganZhiExact + "年"} />
                  <Stat label="生肖" value={s2l.value.shengXiao} />
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  {s2l.value.isLeapMonth && <Badge tone="amber">闰月</Badge>}
                  {s2l.value.jieQi && <Badge tone="emerald">节气 · {s2l.value.jieQi}</Badge>}
                  {s2l.value.festivals.map((f) => (
                    <Badge key={f} tone="rose">{f}</Badge>
                  ))}
                  {s2l.value.nextJieQi.name && (
                    <span className="text-xs text-neutral-500 ml-auto">
                      下一节气：{s2l.value.nextJieQi.name}（{s2l.value.nextJieQi.dateStr}）
                    </span>
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {tab === "l2s" && (
          <>
            <SectionCard title="输入农历日期" subtitle="闰月勾选「闰月」开关；不存在的日期会明确提示">
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">农历年</span>
                  <input value={ly} onChange={(e) => setLy(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">农历月（1-12）</span>
                  <input value={lm} onChange={(e) => setLm(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">农历日（1-30）</span>
                  <input value={ld} onChange={(e) => setLd(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
              </div>
              <div className="mt-4">
                <Toggle checked={leap} onChange={setLeap} label="闰月" hint="该年存在闰此月时生效，如 2025 闰六月" />
              </div>
            </SectionCard>

            {l2s === null ? (
              <Hint kind="error">请输入完整的农历年月日</Hint>
            ) : !l2s.ok ? (
              <Hint kind="error">{l2s.message}</Hint>
            ) : (
              <SectionCard title="对应公历日期" aside={<CopyButton text={`农历 ${ly} 年${leap ? "闰" : ""}${lm}月${ld}日 = 公历 ${l2s.value.y}-${pad(l2s.value.m)}-${pad(l2s.value.d)}（${l2s.value.weekdayCn}）`} label="复制结果" />}>
                <div className="text-center py-4">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-300 mb-2 font-mono">
                    {l2s.value.y}-{pad(l2s.value.m)}-{pad(l2s.value.d)}
                  </div>
                  <div className="text-sm text-neutral-400">{l2s.value.weekdayCn}</div>
                </div>
              </SectionCard>
            )}
          </>
        )}

        {tab === "birthday" && (
          <>
            <SectionCard title="农历生日" subtitle="查询未来若干年里，农历生日对应的公历日期">
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">农历月（1-12）</span>
                  <input value={bm} onChange={(e) => setBm(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-500 mb-1.5 block">农历日（1-30）</span>
                  <input value={bd} onChange={(e) => setBd(e.target.value)} inputMode="numeric" className={numInput} />
                </label>
              </div>
              <div className="flex items-center gap-6 flex-wrap mt-4">
                <Toggle checked={bLeap} onChange={setBLeap} label="闰月生日" hint="无该闰月的年份按非闰同月过（民俗通行）" />
                <Segmented
                  value={bYears}
                  onChange={setBYears}
                  options={[
                    { value: "5", label: "未来 5 年" },
                    { value: "10", label: "未来 10 年" },
                    { value: "20", label: "未来 20 年" },
                  ]}
                  ariaLabel="查询年数"
                />
              </div>
            </SectionCard>

            {birthdays === null ? (
              <Hint kind="error">请输入农历月日</Hint>
            ) : !birthdays.ok ? (
              <Hint kind="error">{birthdays.message}</Hint>
            ) : (
              <SectionCard
                title="未来公历日期表"
                aside={
                  <CopyButton
                    text={birthdays.value.map((b) => `${b.solarYear} 年：${b.solar}（${b.weekdayCn}）${b.leapFallback ? "［该年无闰月，按非闰月过］" : ""}`).join("\n")}
                    label="复制全部"
                  />
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-neutral-500 border-b border-white/[0.06]">
                        <th className="text-left py-2 pr-4">年份</th>
                        <th className="text-left py-2 px-4">公历日期</th>
                        <th className="text-left py-2 px-4">星期</th>
                        <th className="text-left py-2 pl-4">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {birthdays.value.map((b) => (
                        <tr key={b.solarYear} className="border-b border-white/[0.04]">
                          <td className="py-2.5 pr-4 text-neutral-300">{b.solarYear}</td>
                          <td className="py-2.5 px-4 text-neutral-200">{b.solar}</td>
                          <td className="py-2.5 px-4 text-neutral-400">{b.weekdayCn}</td>
                          <td className="py-2.5 pl-4">{b.leapFallback && <Badge tone="amber">非闰月 fallback</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </>
        )}

        <Hint kind="info">
          历算基于权威农历数据（1900-2100 年），节气为天文精确时刻。干支年民俗以正月初一为界，命理以立春为界，两者已分别列出。
        </Hint>
      </div>
    </>
  );
}
