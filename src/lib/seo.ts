import type { Metadata } from "next";
import { SITE_ORIGIN, BASE_PATH, SITE_NAME, absUrl, OG_IMAGE, type ToolSeo } from "./site";
import { ALL_TOOLS_EN } from "./seo-en";

// 兼容既有引用：大量页面/组件从 "@/lib/seo" 导入这些常量
export { SITE_ORIGIN, BASE_PATH, SITE_NAME, absUrl, OG_IMAGE };

/** EN 版是否提供同 slug 工具页（决定 hreflang 是否互指） */
const EN_SLUGS = new Set(ALL_TOOLS_EN.map((t) => t.slug));

// 兼容既有引用：类型仍可从 "@/lib/seo" 导入
export type { ToolSeo } from "./site";

export function toolMetadata(seo: ToolSeo): Metadata {
  const url = absUrl(`/${seo.slug}`);
  const title = `${seo.title} - 免费在线工具 | DailyBox`;
  return {
    title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: url,
      // 有英文版的工具页做 zh↔en 互指，让两语种互相传递信号
      ...(EN_SLUGS.has(seo.slug) ? { languages: { "zh-CN": url, en: absUrl(`/en/${seo.slug}`) } } : {}),
    },
    openGraph: {
      title,
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
      title,
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
      { slug: "url", title: "URL 编解码", subtitle: "组件 · URI · 表单 三种模式", description: "在线 URL 编码解码工具，支持 encodeURIComponent、encodeURI、表单 application/x-www-form-urlencoded 三种模式，容错解码残缺百分号序列，中文与 emoji 完整支持。本地运算，数据不上传。", keywords: ["URL编码", "URL解码", "encodeURIComponent", "URL转码"] , faqs: [{q:"URL 编码和解码有什么区别？",a:"编码把中文、&、?、# 等特殊字符转成 %XX 安全形式，便于拼进链接；解码是逆操作，把 %XX 还原成原文，两者互逆。"},{q:"encodeURIComponent 和 encodeURI 该用哪个？",a:"encodeURIComponent 会连 / ? : @ & = + $ # 一起转义，适合编码参数值；encodeURI 保留这些分隔符，适合编码整条链接。"}] },
      { slug: "qrcode", title: "二维码生成", subtitle: "文本/链接转码 · 尺寸容错可调", description: "在线二维码生成器，文本或链接即刻转码，支持尺寸、容错等级与前后景色自定义，可下载 PNG，收款码、分享链接场景刚需。本地生成，内容不上传。", keywords: ["二维码生成", "二维码制作", "QR码", "收款码", "链接转二维码"] , faqs: [{q:"生成的二维码会过期吗？",a:"不会。内容直接编码在图案本身，只要图清晰就能永久扫描，不依赖任何服务器。"},{q:"二维码扫不出来怎么办？",a:"调大尺寸（≥300px）、提高容错等级（H 级）、保持深色前景浅色背景的高对比度，并避免遮挡三个定位角。"}] },
    ],
  },
  {
    group: "文本",
    items: [
      { slug: "wordcount", title: "字数统计", subtitle: "字符/单词/行数 · 阅读时长", description: "在线字数统计工具，实时统计字符数、去空格字符、单词数、行数与预计阅读时长，中英文混排准确计数，写作、文案、投稿必备。", keywords: ["字数统计", "字数统计工具", "字符数", "单词数", "字数计算"] , faqs: [{q:"中文怎么算字数？",a:"中文按字符计数，一个汉字算一个字；工具同时给出含/不含空格字符数、英文单词数、行数与预计阅读时长。"}] },
      { slug: "caseconvert", title: "大小写转换", subtitle: "大写/小写/驼峰/下划线", description: "在线文本大小写转换，支持全部大写、全部小写、首字母大写、驼峰命名、下划线命名互转，编程命名与文本处理一键搞定。", keywords: ["大小写转换", "大写转小写", "驼峰转换", "下划线转换"] , faqs: [{q:"首字母大写模式会怎么处理？",a:"每个单词首字母转大写、其余转小写（Title Case），适合标题；驼峰与下划线模式面向编程变量命名。"}] },
      { slug: "textcompare", title: "文本对比", subtitle: "逐行差异 · 新增/删除高亮", description: "在线文本差异对比工具，逐行高亮新增、删除与修改，统计差异行数，适合代码、配置、文档版本比对，本地运算不上传。", keywords: ["文本对比", "文本差异", "内容对比", "diff", "版本对比"] , faqs: [{q:"可以对比代码或配置文件吗？",a:"可以。逐行差异对比对任何纯文本有效，代码、JSON、YAML 均可，新增、删除、修改分色高亮并统计差异行数。"}] },
      { slug: "dedupe", title: "去重排序", subtitle: "去重 · 排序 · 空行清理", description: "在线文本去重排序工具，一键去除重复行、按字典序/长度排序、清理空行与首尾空格，处理名单、关键词、数据列表高效。", keywords: ["去重", "文本去重", "排序", "去重排序", "删除重复"] , faqs: [{q:"去重会保留哪一行？",a:"保留首次出现的行，其余重复行丢弃；可再按字典序或长度排序，并一键清理空行与首尾空格。"}] },
      { slug: "fanjian", title: "繁简转换", subtitle: "简体↔繁体 · 双向互转", description: "在线繁体简体互转工具，简体转繁体、繁体转简体一键完成，用词习惯符合两岸规范，阅读、排版、跨境沟通必备。", keywords: ["繁简转换", "繁体转简体", "简体转繁体", "繁简互转"] , faqs: [{q:"只是字符替换还是按词转换？",a:"按词转换。如「内存/記憶體」「软件/軟體」这类两岸用词差异会一并处理，不只是逐字映射。"}] },
      { slug: "textbinary", title: "字符↔二进制", subtitle: "文本转二进制 · 双向", description: "在线文本与二进制互转工具，文本转 01 二进制、二进制还原文本，支持中文 UTF-8 与自定义分隔符，学习、调试、CTF 场景适用。", keywords: ["文本转二进制", "二进制转文本", "text to binary", "01转换"] , faqs: [{q:"中文用什么编码转二进制？",a:"UTF-8，一个汉字通常 3 字节 24 位二进制；字节间分隔符可自定义，支持双向还原。"}] },
    ],
  },
  {
    group: "加密",
    items: [
      { slug: "hash", title: "Hash 计算", subtitle: "MD5 · SHA-1 · SHA-256 · SHA-512", description: "在线哈希计算工具，同时输出 MD5、SHA-1、SHA-256、SHA-384、SHA-512，支持十六进制与 Base64 输出，SHA 系列基于浏览器 Web Crypto。本地运算，适合文件校验、签名、去重。", keywords: ["MD5", "SHA256", "哈希计算", "散列", "校验"] , faqs: [{q:"MD5 还能用吗？",a:"MD5 与 SHA-1 已可构造碰撞，不能用于安全用途；文件完整性校验与去重仍可用。安全场景请选 SHA-256 及以上。"}] },
    ],
  },
  {
    group: "开发",
    items: [
      { slug: "regex", title: "正则测试", subtitle: "实时匹配 · 高亮 · 中文解释", description: "在线正则表达式测试工具，实时高亮全部匹配、捕获组与命名分组，逐 token 中文解释正则含义，回溯风险提示，写正则不用来回试。", keywords: ["正则测试", "正则表达式", "regex", "正则在线"] , faqs: [{q:"支持哪种正则语法？",a:"JavaScript 正则（ES2023），含命名分组与前后断言；工具逐 token 给出中文解释，并提示灾难性回溯风险。"}] },
      { slug: "uuid", title: "UUID / 随机数", subtitle: "v4 · v7 · 批量 · 区间随机", description: "在线 UUID 生成器（v4 随机、v7 时间有序）与随机数生成器，支持批量、大小写与连字符格式选项，基于浏览器加密级随机源，适合造测试数据与 mock。", keywords: ["UUID生成", "GUID", "随机数生成", "uuid v7"] , faqs: [{q:"v4 和 v7 选哪个？",a:"v4 纯随机，适合绝大多数场景；v7 带毫秒时间戳前缀，天然有序、对数据库索引友好，适合做主键。"}] },
      { slug: "radix", title: "进制转换", subtitle: "2/8/10/16 实时联动 · BigInt", description: "在线进制转换工具，2/8/10/16 四卡实时联动，输入任意进制即刻显示其余进制等值，BigInt 支持超大整数，适合看位掩码与协议字段。", keywords: ["进制转换", "二进制", "十六进制", "BigInt"] , faqs: [{q:"数字大小有限制吗？",a:"基于 BigInt，不受浮点精度限制；2/8/10/16 进制卡片实时联动，输入任意一种立刻显示其余等值。"}] },
      { slug: "jwt", title: "JWT 解析", subtitle: "结构 · 过期状态 · 人性化时间", description: "在线 JWT 解析工具，解码 header 与 payload，展示 iat/nbf/exp 的人性化本地时间与过期状态徽章，三段颜色分区，不校验签名、数据不出浏览器。", keywords: ["JWT解析", "JWT解码", "token解析", "过期时间"] , faqs: [{q:"会校验 JWT 签名吗？",a:"不会。本工具只解码 header 与 payload，把 iat/nbf/exp 显示为本地时间并标注过期状态；签名验证需要服务端密钥。"}] },
      { slug: "sql", title: "SQL 格式化", subtitle: "常用语句美化 · 关键字大写", description: "在线 SQL 格式化工具，支持 SELECT / INSERT / UPDATE / DELETE 常用语句美化：关键字大写、逗号换行、JOIN 缩进，字符串与注释原样保留，长 SQL 一眼看懂。", keywords: ["SQL格式化", "SQL美化", "sql formatter", "格式化SQL"] , faqs: [{q:"支持哪些 SQL 语句？",a:"SELECT / INSERT / UPDATE / DELETE 常用语句的通用美化：关键字大写、逗号换行、JOIN 缩进，字符串与注释原样保留。"}] },
    ],
  },
  {
    group: "时间",
    items: [
      { slug: "cron", title: "Cron 表达式", subtitle: "解析 · 中文描述 · 下次执行", description: "在线 Cron 表达式解析与生成工具，中文人话解释每个字段含义，推算接下来 5 次执行时间，附常用预设生成器，运维排班高频必备。", keywords: ["Cron表达式", "Cron解析", "Cron生成", "定时任务"] , faqs: [{q:"5 段和 6 段 cron 有什么区别？",a:"Linux crontab 是 5 段（分 时 日 月 周）；带秒的 6 段多见于 Quartz/Spring。本工具解析 5 段式，并推算接下来 5 次执行时间。"}] },
    ],
  },
  {
    group: "文件",
    items: [
      { slug: "pdf", title: "PDF 合并拆分", subtitle: "多个合并 · 按页拆分抽取", description: "在线 PDF 合并与拆分工具，浏览器本地把多个 PDF 按顺序合并成一个，或从单个 PDF 抽取、拆分出指定页面，基于 pdf-lib 纯本地运算，文件不上传，适合合同、简历、报告整理。", keywords: ["PDF合并", "PDF拆分", "PDF抽取页面", "PDF工具", "pdf在线"], faqs: [{q:"PDF 会上传到服务器吗？",a:"不会。合并、拆分全部在浏览器本地通过 pdf-lib 完成，文件不经过任何服务器。"},{q:"合并有数量或大小限制吗？",a:"没有硬性限制，取决于设备内存；建议单文件 100MB 以内、一次 20 个以内保持流畅。"}] },
      { slug: "pdftojpg", title: "PDF 转图片", subtitle: "每页导出 JPG/PNG · 可调清晰度", description: "在线 PDF 转图片工具，用 pdf.js 在浏览器本地把每一页渲染成 JPG 或 PNG，可调节清晰度与背景，单页下载或一键打包 ZIP，文件不上传，适合截图、归档、发图、微信传阅。", keywords: ["PDF转JPG", "PDF转图片", "PDF转PNG", "PDF导出图片", "pdf转jpg在线"] , faqs: [{q:"能调清晰度吗？",a:"可以，1x-3x 缩放约对应 72-216 DPI，扫描件建议 2x 起；全部页面可一键打包 ZIP 下载。"}] },
      { slug: "jpgtopdf", title: "图片转 PDF", subtitle: "JPG/PNG 合成 · A4 或原尺寸", description: "在线图片转 PDF 工具，把多张 JPG/PNG 按顺序合成一个 PDF，可选贴合原图尺寸或统一 A4 排版、横竖向与页边距，本地生成不上传，扫描件、相册、截图转文档必备。", keywords: ["图片转PDF", "JPG转PDF", "PNG转PDF", "照片转PDF", "多图合成PDF"] , faqs: [{q:"多张图按什么顺序合成？",a:"按列表顺序，合成前可拖拽调整；可选贴合原图尺寸或统一 A4 排版，横竖向与页边距均可调。"}] },
      { slug: "pdfrotate", title: "PDF 旋转", subtitle: "整份或单页 · 90/180/270", description: "在线 PDF 旋转工具，顺时针旋转整份文档或指定页面，支持 90/180/270 度并实时预览每页角度，扫描件、拍照文档方向颠倒一键摆正，本地处理不上传。", keywords: ["PDF旋转", "旋转PDF", "PDF页面旋转", "PDF方向", "pdf rotate"] , faqs: [{q:"能只旋转其中几页吗？",a:"可以，整份旋转或指定页码都支持，90/180/270 度，实时预览每页角度后导出新文件。"}] },
      { slug: "pdforganize", title: "PDF 整理页面", subtitle: "重排 · 删除 · 抽取页面", description: "在线 PDF 页面整理工具，可视化拖拽调整页面顺序、删除多余页、抽取需要的页并实时缩略图预览，本地生成全新 PDF，不改动原件也不上传，长文档重排、去页高效。", keywords: ["PDF整理", "PDF删除页面", "PDF重排", "PDF页面排序", "整理PDF"] , faqs: [{q:"会改动我的原 PDF 吗？",a:"不会。重排、删除、抽取都基于原件生成全新文件，原件保持不变，也不经过任何服务器。"}] },
      { slug: "pdfwatermark", title: "PDF 加水印", subtitle: "文字/图片 · 透明度角度平铺", description: "在线 PDF 加水印工具，支持文字水印（英文数字）与图片水印（中文 logo、印章），可调字号、颜色、透明度、旋转角、平铺密度，逐页或指定页叠加，本地处理不上传。", keywords: ["PDF加水印", "PDF水印", "文字水印", "图片水印", "pdf watermark"], faqs: [{ q: "能加中文文字水印吗？", a: "浏览器内置字体不支持中文字形，中文水印请用「图片水印」模式（上传中文印章或 logo 图）；文字水印支持英文、数字与常见符号。" }] },
      { slug: "pdfpagenum", title: "PDF 加页码", subtitle: "六个位置 · 自定义格式与起始页", description: "在线 PDF 加页码工具，支持页眉页脚六个位置、自定义格式（{n} 当前页、{total} 总页数）、起始页码、字号颜色与首页是否显示，本地添加不上传，论文、合同、报告排版更规范。", keywords: ["PDF加页码", "PDF页码", "添加页码", "页脚页码", "pdf page numbers"] , faqs: [{q:"页码格式可以自定义吗？",a:"可以，{n} 是当前页、{total} 是总页数，如「第 {n} 页 / 共 {total} 页」；页眉页脚六个位置、起始页码、字号颜色、首页是否显示均可调。"}] },
      { slug: "image", title: "图片压缩转换", subtitle: "JPG/PNG/WebP · 批量 · 尺寸", description: "在线图片压缩与格式转换，支持 JPG/PNG/WebP 互转、批量压缩、尺寸缩放与质量调节，Canvas + WASM 本地处理，原图不上传，适合电商、博客配图。", keywords: ["图片压缩", "图片转换", "JPG转PNG", "WebP", "批量压缩"] , faqs: [{q:"压缩会损失画质吗？",a:"JPG/WebP 为有损压缩，用质量滑杆平衡体积与画质；PNG 转换不损失画质。全部本地处理，原图不上传。"}] },
      { slug: "video", title: "视频压缩转码", subtitle: "MP4/WebM · 压缩 · 剪切", description: "在线视频压缩与转码工具，支持 MP4/WebM 互转、分辨率压缩与片段剪切，ffmpeg.wasm 本地运算，超大视频懒加载，不上传隐私安全。", keywords: ["视频压缩", "视频转码", "MP4转WebM", "ffmpeg", "在线视频工具"] , faqs: [{q:"为什么第一次用加载很慢？",a:"视频处理依赖 ffmpeg.wasm（约 25MB），首次使用需要下载，之后由浏览器缓存复用，第二次起明显变快。"}] },
    ],
  },
  {
    group: "设计",
    items: [
      { slug: "colorconvert", title: "颜色转换", subtitle: "HEX/RGB/HSL · 取色 · 预览", description: "在线颜色转换工具，HEX、RGB、HSL 三种格式互转，可视化取色器与实时预览，一键复制任意格式，设计、前端开发配色必备。", keywords: ["颜色转换", "HEX转RGB", "RGB转HSL", "颜色选择器", "取色器"] , faqs: [{q:"有可视化取色器吗？",a:"有，点色块唤起系统取色器，HEX/RGB/HSL 三种格式实时互转，任意格式一键复制。"}] },
    ],
  },
  {
    group: "生活",
    items: [
      { slug: "rmb", title: "人民币大写", subtitle: "金额转大写 · 四舍五入到分", description: "在线人民币大写金额转换，按财务规范处理零折叠、角分与整字，四舍五入到分，支持负数与超大金额，开票报销高频刚需。", keywords: ["人民币大写", "金额大写", "财务大写", "大写转换"] , faqs: [{q:"大写金额符合财务规范吗？",a:"符合。按惯例处理零的折叠（如 1005 → 壹仟零伍）、角分与整字、四舍五入到分，支持负数与超大金额。"}] },
      { slug: "idcard", title: "身份证校验", subtitle: "校验位 · 生日 · 性别 · 年龄", description: "在线身份证号码校验工具，按 GB 11643 校验位算法验证真伪，解读省份、出生日期、性别与年龄，支持 15 位升级 18 位。全程本地运算，数据不上传。", keywords: ["身份证校验", "身份证号码", "校验位", "身份证解析"], faqs: [{ q: "输入的身份证号会被上传吗？", a: "不会。校验、生日/性别/年龄解读全部在你的浏览器本地完成，页面没有任何上传、统计或联网请求。" }] },
      { slug: "unit", title: "单位换算", subtitle: "全单位实时等值 · 中文单位", description: "在线单位换算工具，覆盖长度、重量、面积、温度、数据量，输入一个数所有单位实时等值展示，支持里/丈/尺/寸、斤/两、亩/分/顷等中文单位，点击任意卡片切换源单位。", keywords: ["单位换算", "长度换算", "重量换算", "温度换算", "亩"] , faqs: [{q:"支持中文传统单位吗？",a:"支持。长度含里/丈/尺/寸、重量含斤/两、面积含亩/分/顷，与公制、英制全部实时互算。"}] },
      { slug: "mortgage", title: "房贷计算器", subtitle: "等额本息/本金 · 逐期还款表", description: "在线房贷计算器，支持等额本息与等额本金两种方式，逐期还款表明细、总利息对比、提前还款测算，全部本地精确计算，买房决策必备。", keywords: ["房贷计算器", "等额本息", "等额本金", "月供计算", "提前还款"] , faqs: [{q:"等额本息和等额本金怎么选？",a:"等额本息每月还款固定、前期利息占比高；等额本金月供逐月递减、总利息更少。工具附逐期明细与提前还款测算。"}] },
      { slug: "deposit", title: "存款收益计算", subtitle: "单利/复利 · 年化换算", description: "在线存款收益计算器，单利复利到期本息、年化收益率换算、不同期限方案对比，金融定义级公式精确计算，存钱比价不踩坑。", keywords: ["存款计算", "年化收益", "复利计算", "利息计算", "定期存款"] , faqs: [{q:"单利和复利差在哪？",a:"单利只对本金计息；复利把每期利息滚入本金再生息。定期存款多为单利，理财产品常按复利标注年化。"}] },
      { slug: "irr", title: "贷款真实年化", subtitle: "IRR 穿透分期费率", description: "在线 IRR 真实年化利率计算器，穿透信用卡分期、网贷、消费贷的名义费率，迭代法精确求解内部收益率，借钱前先看真实成本。", keywords: ["IRR计算", "真实年化", "分期利率", "信用卡分期", "贷款计算器"] , faqs: [{q:"为什么真实年化比名义费率高？",a:"分期手续费始终按初始本金收取，而你实际占用的本金逐月减少，真实成本约为名义费率的 1.8-2 倍；本工具用 IRR 迭代法精确求解。"}] },
      { slug: "phone", title: "手机号归属地", subtitle: "号段库本地查询 · 支持批量", description: "在线手机号归属地查询，内置数十万条号段数据，显示省份、城市与运营商，支持批量查询，全程本地检索不上传号码。", keywords: ["手机号归属地", "号码查询", "运营商查询", "号段"] , faqs: [{q:"查询的号码会被上传吗？",a:"不会。号段库内置在页面里本地检索，批量查询也全部在浏览器完成，无任何网络请求。"}] },
      { slug: "lunar", title: "农历万年历", subtitle: "农历/干支/生肖/节气", description: "在线农历万年历，公历农历互转、天干地支、生肖、二十四节气与传统节日查询，覆盖 1900-2100 年，农历生日、择日、节日安排必备。", keywords: ["农历", "万年历", "阴历阳历转换", "节气", "干支纪年", "生肖"] , faqs: [{q:"覆盖哪些年份？",a:"1900-2100 年，公历农历互转、天干地支、生肖、二十四节气与传统节日查询。"}] },
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
  pdftojpg: "转图片",
  jpgtopdf: "图转PDF",
  pdfrotate: "旋转",
  pdforganize: "整理",
  pdfwatermark: "水印",
  pdfpagenum: "页码",
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
