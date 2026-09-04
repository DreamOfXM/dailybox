import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { SITE_ORIGIN, BASE_PATH, OG_IMAGE } from "@/lib/seo";
import SiteNav from "@/components/SiteNav";
import { SiteFooter } from "@/components/ui";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });



const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-G7TXV4XC2B";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN + BASE_PATH),
  title: {
    default: "DailyBox - 日常工具箱",
    template: "%s",
  },
  description:
    "简洁到极致的免费在线日常工具箱：URL 编解码、MD5/SHA 哈希、正则测试、UUID、进制转换、JWT 解析、SQL 格式化、Cron 表达式、人民币大写、身份证校验、单位换算。全部本地运算，无需注册。",
  keywords: [
    "在线工具", "免费工具箱", "URL编码", "MD5", "SHA256", "正则测试", "UUID生成",
    "进制转换", "JWT解析", "SQL格式化", "Cron表达式", "人民币大写", "身份证校验", "单位换算",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "DailyBox - 日常工具箱",
    description: "11 个免费在线工具：哈希、正则、UUID、进制、JWT、Cron、大写金额、身份证校验、单位换算等。",
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
    <html lang="zh-CN" className="dark">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-64 h-14 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-shadow">
                D
              </div>
              <span className="font-semibold text-white tracking-tight">dailybox</span>
            </Link>
            <SiteNav />
          </div>
        </nav>
        <main className="relative z-10 w-full px-4 sm:px-6 lg:px-10 2xl:px-64 pt-24 pb-20">
          {children}
        </main>
        <footer className="relative z-10 border-t border-white/[0.06]">
          <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-64 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 font-mono">
            <SiteFooter />
          </div>
        </footer>
      </body>
    </html>
  );
}
