import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-xs font-mono text-ink3 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-rose"></span>
        HTTP 404
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
        <span className="text-ink">Page Not Found</span>
      </h1>
      <p className="text-lg text-ink3 max-w-md mx-auto mb-10">
        The page you visited does not exist or has been moved.
        <br />
        12 tools are on the homepage, start over.
      </p>
      <Link href="/en" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line2 bg-surface text-sm text-ink font-medium hover:bg-surface2 hover:border-line2 transition-all duration-300">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      <p className="mt-16 text-xs font-mono text-ink3">error 404 · page not found</p>
    </div>
  );
}
