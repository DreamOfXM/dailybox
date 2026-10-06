import Link from "next/link";
import { ALL_TOOLS } from "@/lib/seo";

/**
 * 全局 404 页（静态导出 output: "export" 下输出为 out/404.html，
 * GitHub Pages 对未命中路径自动回退到 404.html）。
 * App Router 的 not-found 渲染在根 layout 之内，因此不要写 <html>/<body>。
 * next/link 的 href 会自动带上 basePath（构建产物中 "/" → "/toolkit/"，静态 HTML 可直接点击）。
 */
export default function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-xs font-mono text-ink3 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-rose"></span>
        HTTP 404
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
        <span className="text-ink">
          页面不存在
        </span>
      </h1>
      <p className="text-lg text-ink3 max-w-md mx-auto mb-10">
        你访问的地址不存在或已被移动。
        <br />
        {ALL_TOOLS.length} 个在线工具都在首页，随时可以从头开始。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line2 bg-surface text-sm text-ink font-medium hover:bg-surface2 hover:border-line2 transition-all duration-300"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>
      <p className="mt-16 text-xs font-mono text-ink3">error 404 · page not found</p>
    </div>
  );
}
