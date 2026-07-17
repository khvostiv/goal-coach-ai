import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/15 bg-[#050b18]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        <Link href="/" className="flex items-center gap-4">

          <div>
            <h1 className="text-xl font-bold text-white">
              Goal Coach AI
            </h1>

            <p className="text-sm text-sky-300">
              Autonomous AI Goal Planner
            </p>
          </div>

        </Link>

        <nav className="flex items-center gap-3">

          <Link
            href="/"
            className="rounded-xl border border-white-500/20 px-5 py-2 text-sm font-semibold text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/10"
          >
            Home
          </Link>

          <Link
            href="/workspace"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,.30)] transition hover:scale-105"
          >
            Workspace
          </Link>

        </nav>

      </div>
    </header>
  );
}