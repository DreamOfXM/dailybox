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
      { slug: "qrcode", title: "二维码生成", subtitle: "文本/链接转码 · 尺寸容错可调", description: "在线二维码生成器，文本或链接即刻转码，支持尺寸、容错等级与前后景色自定义，可下载 PNG，收款码、分享链接场景刚需。本地生成，内容不上传。", keywords: ["二维码生成", "二维码制作", "QR码", "收款码", "链接转二维码"] },
    ],
  },
  {
    group: "文本",
    items: [
      { slug: "wordcount", title: "字数统计", subtitle: "字符/单词/行数 · 阅读时长", description: "在线字数统计工具，实时统计字符数、去空格字符、单词数、行数与预计阅读时长，中英文混排准确计数，写作、文案、投稿必备。", keywords: ["字数统计", "字数统计工具", "字符数", "单词数", "字数计算"] },
      { slug: "caseconvert", title: "大小写转换", subtitle: "大写/小写/驼峰/下划线", description: "在线文本大小写转换，支持全部大写、全部小写、首字母大写、驼峰命名、下划线命名互转，编程命名与文本处理一键搞定。", keywords: ["大小写转换", "大写转小写", "驼峰转换", "下划线转换"] },
      { slug: "textcompare", title: "文本对比", subtitle: "逐行差异 · 新增/删除高亮", description: "在线文本差异对比工具，逐行高亮新增、删除与修改，统计差异行数，适合代码、配置、文档版本比对，本地运算不上传。", keywords: ["文本对比", "文本差异", "内容对比", "diff", "版本对比"] },
      { slug: "dedupe", title: "去重排序", subtitle: "去重 · 排序 · 空行清理", description: "在线文本去重排序工具，一键去除重复行、按字典序/长度排序、清理空行与首尾空格，处理名单、关键词、数据列表高效。", keywords: ["去重", "文本去重", "排序", "去重排序", "删除重复"] },
      { slug: "fanjian", title: "繁简转换", subtitle: "简体↔繁体 · 双向互转", description: "在线繁体简体互转工具，简体转繁体、繁体转简体一键完成，用词习惯符合两岸规范，阅读、排版、跨境沟通必备。", keywords: ["繁简转换", "繁体转简体", "简体转繁体", "繁简互转"] },
      { slug: "textbinary", title: "字符↔二进制", subtitle: "文本转二进制 · 双向", description: "在线文本与二进制互转工具，文本转 01 二进制、二进制还原文本，支持中文 UTF-8 与自定义分隔符，学习、调试、CTF 场景适用。", keywords: ["文本转二进制", "二进制转文本", "text to binary", "01转换"] },
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
    group: "文件",
    items: [
      { slug: "pdf", title: "PDF 工具箱", subtitle: "合并 · 拆分 · 压缩 · 加密", description: "在线 PDF 工具箱，浏览器本地合并多个 PDF、拆分页数、压缩体积、加解密与加水印，基于 pdf-lib/pdflib WASM，无需上传，适合合同、简历、报告处理。", keywords: ["PDF合并", "PDF拆分", "PDF压缩", "PDF工具", "pdf在线"], faqs: [{ q: "PDF 会上传到服务器吗？", a: "不会。合并、拆分、压缩全部在浏览器本地通过 WASM 完成，文件不经过任何服务器。" }] },
      { slug: "image", title: "图片压缩转换", subtitle: "JPG/PNG/WebP · 批量 · 尺寸", description: "在线图片压缩与格式转换，支持 JPG/PNG/WebP 互转、批量压缩、尺寸缩放与质量调节，Canvas + WASM 本地处理，原图不上传，适合电商、博客配图。", keywords: ["图片压缩", "图片转换", "JPG转PNG", "WebP", "批量压缩"] },
      { slug: "video", title: "视频压缩转码", subtitle: "MP4/WebM · 压缩 · 剪切", description: "在线视频压缩与转码工具，支持 MP4/WebM 互转、分辨率压缩与片段剪切，ffmpeg.wasm 本地运算，超大视频懒加载，不上传隐私安全。", keywords: ["视频压缩", "视频转码", "MP4转WebM", "ffmpeg", "在线视频工具"] },
    ],
  },
  {
    group: "设计",
    items: [
      { slug: "colorconvert", title: "颜色转换", subtitle: "HEX/RGB/HSL · 取色 · 预览", description: "在线颜色转换工具，HEX、RGB、HSL 三种格式互转，可视化取色器与实时预览，一键复制任意格式，设计、前端开发配色必备。", keywords: ["颜色转换", "HEX转RGB", "RGB转HSL", "颜色选择器", "取色器"] },
    ],
  },
  {
    group: "生活",
    items: [
      { slug: "rmb", title: "人民币大写", subtitle: "金额转大写 · 四舍五入到分", description: "在线人民币大写金额转换，按财务规范处理零折叠、角分与整字，四舍五入到分，支持负数与超大金额，开票报销高频刚需。", keywords: ["人民币大写", "金额大写", "财务大写", "大写转换"] },
      { slug: "idcard", title: "身份证校验", subtitle: "校验位 · 生日 · 性别 · 年龄", description: "在线身份证号码校验工具，按 GB 11643 校验位算法验证真伪，解读省份、出生日期、性别与年龄，支持 15 位升级 18 位。全程本地运算，数据不上传。", keywords: ["身份证校验", "身份证号码", "校验位", "身份证解析"], faqs: [{ q: "输入的身份证号会被上传吗？", a: "不会。校验、生日/性别/年龄解读全部在你的浏览器本地完成，页面没有任何上传、统计或联网请求。" }] },
      { slug: "unit", title: "单位换算", subtitle: "全单位实时等值 · 中文单位", description: "在线单位换算工具，覆盖长度、重量、面积、温度、数据量，输入一个数所有单位实时等值展示，支持里/丈/尺/寸、斤/两、亩/分/顷等中文单位，点击任意卡片切换源单位。", keywords: ["单位换算", "长度换算", "重量换算", "温度换算", "亩"] },
      { slug: "mortgage", title: "房贷计算器", subtitle: "等额本息/本金 · 逐期还款表", description: "在线房贷计算器，支持等额本息与等额本金两种方式，逐期还款表明细、总利息对比、提前还款测算，全部本地精确计算，买房决策必备。", keywords: ["房贷计算器", "等额本息", "等额本金", "月供计算", "提前还款"] },
      { slug: "deposit", title: "存款收益计算", subtitle: "单利/复利 · 年化换算", description: "在线存款收益计算器，单利复利到期本息、年化收益率换算、不同期限方案对比，金融定义级公式精确计算，存钱比价不踩坑。", keywords: ["存款计算", "年化收益", "复利计算", "利息计算", "定期存款"] },
      { slug: "irr", title: "贷款真实年化", subtitle: "IRR 穿透分期费率", description: "在线 IRR 真实年化利率计算器，穿透信用卡分期、网贷、消费贷的名义费率，迭代法精确求解内部收益率，借钱前先看真实成本。", keywords: ["IRR计算", "真实年化", "分期利率", "信用卡分期", "贷款计算器"] },
      { slug: "phone", title: "手机号归属地", subtitle: "号段库本地查询 · 支持批量", description: "在线手机号归属地查询，内置数十万条号段数据，显示省份、城市与运营商，支持批量查询，全程本地检索不上传号码。", keywords: ["手机号归属地", "号码查询", "运营商查询", "号段"] },
      { slug: "lunar", title: "农历万年历", subtitle: "农历/干支/生肖/节气", description: "在线农历万年历，公历农历互转、天干地支、生肖、二十四节气与传统节日查询，覆盖 1900-2100 年，农历生日、择日、节日安排必备。", keywords: ["农历", "万年历", "阴历阳历转换", "节气", "干支纪年", "生肖"] },
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
  qrcode: "二维码",
  wordcount: "字数",
  caseconvert: "大小写",
  textcompare: "对比",
  dedupe: "去重",
  fanjian: "繁简",
  textbinary: "二进制",
  hash: "Hash",
  regex: "正则",
  uuid: "UUID",
  radix: "进制",
  jwt: "JWT",
  sql: "SQL",
  cron: "Cron",
  pdf: "PDF",
  image: "图片",
  video: "视频",
  colorconvert: "颜色",
  rmb: "大写",
  idcard: "身份证",
  unit: "单位",
  mortgage: "房贷",
  deposit: "存款",
  irr: "IRR",
  phone: "归属地",
  lunar: "农历",
};

export function navLabel(slug: string): string {
  return NAV_LABELS[slug] ?? slug;
}
