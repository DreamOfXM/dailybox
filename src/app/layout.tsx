import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN, BASE_PATH, OG_IMAGE } from "@/lib/seo";
import { ALL_TOOLS } from "@/lib/seo";
import SiteNav from "@/components/SiteNav";
import { SiteFooter, SiteBrand, SiteLangToggle, NavCta } from "@/components/ui";

const inter = Inter({ subsets: ["latin"], variable: "--font-latin" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-PH76KYPYVX";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DailyBox - 日常工具箱",
  url: SITE_ORIGIN + BASE_PATH + "/",
  description:
    "简洁到极致的免费在线日常工具箱：URL 编解码、MD5/SHA 哈希、正则测试、UUID、进制转换、JWT 解析、SQL 格式化、Cron 表达式、人民币大写、身份证校验、单位换算。全部本地运算，无需注册。",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
};

// 首页标题：搜索词前置（品牌后置），33 个工具里挑搜索量最大的几类露出
const N = ALL_TOOLS.length;
const HOME_TITLE = `免费在线工具箱：PDF 合并、正则测试、房贷计算等 ${N} 个工具 - DailyBox`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN + BASE_PATH),
  title: {
    default: HOME_TITLE,
    template: "%s",
  },
  description:
    "简洁到极致的免费在线日常工具箱：URL 编解码、MD5/SHA 哈希、正则测试、UUID、进制转换、JWT 解析、SQL 格式化、Cron 表达式、人民币大写、身份证校验、单位换算。全部本地运算，无需注册。",
  keywords: [
    "在线工具", "免费工具箱", "URL编码", "MD5", "SHA256", "正则测试", "UUID生成",
    "进制转换", "JWT解析", "SQL格式化", "Cron表达式", "人民币大写", "身份证校验", "单位换算",
  ],
  // 静态导出下 Next 不会自动补 basePath，这里显式带上
  manifest: "/dailybox/manifest.webmanifest",
  alternates: {
    canonical: "/",
    languages: { "zh-CN": "/", en: "/en/" },
  },
  openGraph: {
    title: "DailyBox - 日常工具箱",
    description: "33 个免费在线工具：哈希、正则、UUID、进制、JWT、Cron、PDF 合并拆分、大写金额、身份证校验、单位换算等。",
    url: SITE_ORIGIN + BASE_PATH,
    siteName: "DailyBox",
    type: "website",
    locale: "zh_CN",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "DailyBox 日常工具箱" }],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans bg-ground text-ink`}>
        <nav className="sticky top-0 z-50 border-b border-line bg-ground/92 backdrop-blur-md">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-8 min-h-[66px] flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-1 py-2">
            <SiteBrand />
            <SiteNav />
            <SiteLangToggle />
            <NavCta />
          </div>
        </nav>
        <main className="mx-auto max-w-[1180px] px-4 sm:px-8 pt-10 pb-16">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
