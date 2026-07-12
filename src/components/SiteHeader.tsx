import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-500/20 bg-[#090510]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        <Link href="/" className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_30px_rgba(168,85,247,.45)]">

            <Image
              src="/AWS Student Builder Group_RGB_Program Icon_Blue.png"
              alt="Engineering Project Planner"
              width={26}
              height={26}
            />

          </div>

          <div>
            <h1 className="text-xl font-bold text-white">
              ProjectPilot AI
            </h1>

            <p className="text-sm text-violet-300">
              Engineering Project Planner
            </p>
          </div>

        </Link>

        <nav className="flex items-center gap-3">

          <Link
            href="/"
            className="rounded-xl border border-violet-500/30 px-5 py-2 text-sm font-semibold text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/10"
          >
            Overview
          </Link>

          <Link
            href="/workspace"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,.35)] transition hover:scale-105"
          >
            Workspace
          </Link>

        </nav>

      </div>
    </header>
  );
}