"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchGoals,
  normalizeApiUrl,
  type GoalPlan,
} from "@/lib/api";

export default function Home() {
  const apiUrl = normalizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL
  );

  const [goals, setGoals] = useState<GoalPlan[]>([]);
  const [isLoading, setIsLoading] = useState(
    Boolean(apiUrl)
  );

  const activeGoal = [...goals]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .find((goal) => goal.status === "active");

  useEffect(() => {
    if (!apiUrl) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGoals() {
      setIsLoading(true);

      try {
        const nextGoals = await fetchGoals(apiUrl);

        if (!cancelled) {
          setGoals(nextGoals);
        }
      } catch (error) {
        console.error("Failed to load goals:", error);

        if (!cancelled) {
          setGoals([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadGoals();

    const handleFocus = () => {
      loadGoals();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [apiUrl]);

  return (
    <div className="sb-page-shell min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <section className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="pt-2">

            <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              One goal.
              <br />
              One focused action
              <br />
              every morning.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Goal Coach AI turns your long-term goal into
              practical daily coaching. Set your objective once,
              then receive a personalized task directly in your
              inbox every morning.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.28)] transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-sky-400 hover:shadow-[0_14px_36px_rgba(59,130,246,0.38)] active:scale-[0.98]"
              >
                {activeGoal
                  ? "Manage My Goal"
                  : "Create My First Goal"}
              </Link>

              <div className="flex items-center gap-3 px-1 text-sm text-slate-200 sm:px-4">
                <span className="flex -space-x-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07111f] bg-sky-500/20 text-xs text-sky-300">
                    B
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07111f] bg-blue-500/20 text-xs text-blue-300">
                    N
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#07111f] bg-emerald-500/20 text-xs text-emerald-300">
                    S
                  </span>
                </span>

                <span>Powered by AWS AI services</span>
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              <div className="border-l border-white/[0.08] pl-4">
                <p className="text-2xl font-bold text-white">
                  24/7
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  Autonomous coaching
                </p>
              </div>

              <div className="border-l border-white/[0.08] pl-4">
                <p className="text-2xl font-bold text-white">
                  Daily
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  Personalized task
                </p>
              </div>

              <div className="border-l border-white/[0.08] pl-4">
                <p className="text-2xl font-bold text-white">
                  Email
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  Automatic delivery
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/50 bg-[#0b1728] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
                  Active goal
                </p>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  {isLoading
                    ? "Loading your goal..."
                    : activeGoal?.goal ??
                      "No goal created yet"}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/[0.04] text-xl">
                🎯
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                  Deadline
                </p>

                <p className="mt-2 font-semibold text-slate-200">
                  {isLoading
                    ? "Loading..."
                    : activeGoal?.deadline ?? "Not set"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                  Daily time
                </p>

                <p className="mt-2 font-semibold text-slate-200">
                  {isLoading
                    ? "Loading..."
                    : activeGoal
                      ? `${activeGoal.dailyMinutes} minutes`
                      : "Not set"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-sky-400/10 bg-sky-400/[0.05] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400">
                    Coaching status
                  </p>

                  <p className="mt-2 font-semibold capitalize text-sky-100">
                    {isLoading
                      ? "Loading"
                      : activeGoal?.status ?? "Inactive"}
                  </p>
                </div>

                <span className="h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.7)]" />             
                 </div>
            </div>

            <div className="mt-6 border-t border-white/[0.8] pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/[0.08] text-lg">
                  ✉️
                </div>

                <div>
                  <p className="font-semibold text-white">
                    Morning coaching is enabled
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-200">
                    Amazon Nova generates a focused task and SNS
                    sends it directly to your email.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/workspace"
              className="mt-6 flex items-center justify-between rounded-xl bg-blue-500/[0.08] px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-blue-500/[0.15] hover:text-white"
            >
              Open goal workspace
              <span className="text-sky-400">→</span>
            </Link>
          </aside>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] border border-white/50 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
              Daily coaching
            </p>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Your next task arrives automatically.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                  EventBridge triggers the morning workflow,
                  Lambda reads your latest active goal, Amazon
                  Nova creates today's task, and SNS delivers it.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-sky-400/10 bg-sky-400/[0.05] px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-sky-400">
                  Delivery
                </p>
                <p className="mt-1 font-semibold text-white">
                  Every morning
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/50 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">
              Cloud architecture
            </p>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-white">
              Built with serverless AWS services.
            </h2>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Bedrock",
                "Lambda",
                "API Gateway",
                "DynamoDB",
                "EventBridge",
                "SNS",
                "Nova",
              ].map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-white/50 bg-blue-400/[0.06] px-3 py-2 text-xs font-medium border-blue-400/10 text-blue-100"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}