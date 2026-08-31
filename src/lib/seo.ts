import type { Metadata } from "next";

/**
 * SEO 辅助：为每个工具页生成 metadata + JSON-LD。
 * 站点部署在项目页子路径 /dailybox，因此 canonical / sitemap 绝对 URL 需带 basePath。
 */
export const SITE_ORIGIN = "https://hnyxgxm.github.io";
export const BASE_PATH = "/dailybox";
export const SITE_NAME = "DailyBox 日常工具箱";

export function absUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${BASE_PATH}${p === "/" ? "" : p.replace(/\/$/, "")}/`;
}

/**
 * 全站默认分享图（1200×630）。文件位于 public/og.png，构建后可访问 /dailybox/og.png。
 * 注意：og.png 由主线程另行生成放入 public/，缺失时社交平台分享将无图（不影响构建）。
 */
export const OG_IMAGE = absUrl("/og.png");

export interface ToolSeo {
  slug: string;
  title: string; // 中文标题，如 "进制转换"
  subtitle: string; // 一句话功能
  description: string; // SEO 描述
  keywords: string[];
  ogImage?: string;
  /** FAQ / 说明，用于 JSON-LD */
  faqs?: Array<{ q: string; a: string }>;
}

export function toolMetadata(seo: ToolSeo): Metadata {
  const url = absUrl(`/${seo.slug}`);
  return {
    title: `${seo.title} - ${SITE_NAME}`,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${seo.title} - ${SITE_NAME}`,
      description: seo.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
      images: [
        {
          url: seo.ogImage ? absUrl(seo.ogImage) : OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${seo.title} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.title} - ${SITE_NAME}`,
      description: seo.description,
      images: [seo.ogImage ? absUrl(seo.ogImage) : OG_IMAGE],
    },
  };
}

/** WebApplication 结构化数据 + FAQPage */
export function toolJsonLd(seo: ToolSeo): object {
  const url = absUrl(`/${seo.slug}`);
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${seo.title} - ${SITE_NAME}`,
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
    description: seo.description,
  };
  if (seo.faqs && seo.faqs.length) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        app,
        {
          "@type": "FAQPage",
          mainEntity: seo.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };
  }
  return app;
}

/** 集中登记所有工具的 SEO + 首页分组导航 */
export const TOOL_GROUPS: Array<{ group: string; items: ToolSeo[] }> = [
  {
    group: "编码",
    items: [
      { slug: "url", title: "URL 编解码", subtitle: "组件 · URI · 表单 三种模式", description: "在线 URL 编码解码工具，支持 encodeURIComponent、encodeURI、表单 application/x-www-form-urlencoded 三种模式，容错解码残缺百分号序列，中文与 emoji 完整支持。本地运算，数据不上传。", keywords: ["URL编码", "URL解码", "encodeURIComponent", "URL转码"] },
    ],
  },
  {
    group: "加密",
    items: [
      { slug: "hash", title: "Hash 计算", subtitle: "MD5 · SHA-1 · SHA-256 · SHA-512", description: "在线哈希计算工具，同时输出 MD5、SHA-1、SHA-256、SHA-384、SHA-512，支持十六进制与 Base64 输出，SHA 系列基于浏览器 Web Crypto。本地运算，适合文件校验、签名、去重。", keywords: ["MD5", "SHA256", "哈希计算", "散列", "校验"] },
    ],
  },
  {
    group: "开发",
    items: [
      { slug: "regex", title: "正则测试", subtitle: "实时匹配 · 高亮 · 中文解释", description: "在线正则表达式测试工具，实时高亮全部匹配、捕获组与命名分组，逐 token 中文解释正则含义，回溯风险提示，写正则不用来回试。", keywords: ["正则测试", "正则表达式", "regex", "正则在线"] },
      { slug: "uuid", title: "UUID / 随机数", subtitle: "v4 · v7 · 批量 · 区间随机", description: "在线 UUID 生成器（v4 随机、v7 时间有序）与随机数生成器，支持批量、大小写与连字符格式选项，基于浏览器加密级随机源，适合造测试数据与 mock。", keywords: ["UUID生成", "GUID", "随机数生成", "uuid v7"] },
      { slug: "radix", title: "进制转换", subtitle: "2/8/10/16 实时联动 · BigInt", description: "在线进制转换工具，2/8/10/16 四卡实时联动，输入任意进制即刻显示其余进制等值，BigInt 支持超大整数，适合看位掩码与协议字段。", keywords: ["进制转换", "二进制", "十六进制", "BigInt"] },
      { slug: "jwt", title: "JWT 解析", subtitle: "结构 · 过期状态 · 人性化时间", description: "在线 JWT 解析工具，解码 header 与 payload，展示 iat/nbf/exp 的人性化本地时间与过期状态徽章，三段颜色分区，不校验签名、数据不出浏览器。", keywords: ["JWT解析", "JWT解码", "token解析", "过期时间"] },
      { slug: "sql", title: "SQL 格式化", subtitle: "常用语句美化 · 关键字大写", description: "在线 SQL 格式化工具，支持 SELECT / INSERT / UPDATE / DELETE 常用语句美化：关键字大写、逗号换行、JOIN 缩进，字符串与注释原样保留，长 SQL 一眼看懂。", keywords: ["SQL格式化", "SQL美化", "sql formatter", "格式化SQL"] },
    ],
  },
  {
    group: "时间",
    items: [
      { slug: "cron", title: "Cron 表达式", subtitle: "解析 · 中文描述 · 下次执行", description: "在线 Cron 表达式解析与生成工具，中文人话解释每个字段含义，推算接下来 5 次执行时间，附常用预设生成器，运维排班高频必备。", keywords: ["Cron表达式", "Cron解析", "Cron生成", "定时任务"] },
    ],
  },
  {
    group: "生活",
    items: [
      { slug: "rmb", title: "人民币大写", subtitle: "金额转大写 · 四舍五入到分", description: "在线人民币大写金额转换，按财务规范处理零折叠、角分与整字，四舍五入到分，支持负数与超大金额，开票报销高频刚需。", keywords: ["人民币大写", "金额大写", "财务大写", "大写转换"] },
      { slug: "idcard", title: "身份证校验", subtitle: "校验位 · 生日 · 性别 · 年龄", description: "在线身份证号码校验工具，按 GB 11643 校验位算法验证真伪，解读省份、出生日期、性别与年龄，支持 15 位升级 18 位。全程本地运算，数据不上传。", keywords: ["身份证校验", "身份证号码", "校验位", "身份证解析"], faqs: [{ q: "输入的身份证号会被上传吗？", a: "不会。校验、生日/性别/年龄解读全部在你的浏览器本地完成，页面没有任何上传、统计或联网请求。" }] },
      { slug: "unit", title: "单位换算", subtitle: "全单位实时等值 · 中文单位", description: "在线单位换算工具，覆盖长度、重量、面积、温度、数据量，输入一个数所有单位实时等值展示，支持里/丈/尺/寸、斤/两、亩/分/顷等中文单位，点击任意卡片切换源单位。", keywords: ["单位换算", "长度换算", "重量换算", "温度换算", "亩"] },
    ],
  },
];

export const ALL_TOOLS: ToolSeo[] = TOOL_GROUPS.flatMap((g) => g.items);

export function findTool(slug: string): ToolSeo | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}

/** 顶栏紧凑标签：短、不换行，避免中文被竖排折断 */
const NAV_LABELS: Record<string, string> = {
  url: "URL",
  hash: "Hash",
  regex: "正则",
  uuid: "UUID",
  radix: "进制",
  jwt: "JWT",
  sql: "SQL",
  cron: "Cron",
  rmb: "大写",
  idcard: "身份证",
  unit: "单位",
};

export function navLabel(slug: string): string {
  return NAV_LABELS[slug] ?? slug;
}
