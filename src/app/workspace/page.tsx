"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { SiteHeader } from "@/components/SiteHeader";
import {
  normalizeApiUrl,
  sendChatMessage,
} from "@/lib/api";
import type { ChatMessage } from "@/types/task";

const SESSION_STORAGE_KEY = "goal-coach-session-id";
const GOAL_CREATED_STORAGE_KEY =
  "goal-coach-goal-created";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(
    SESSION_STORAGE_KEY
  );

  if (existing) {
    return existing;
  }

  const newSessionId = crypto.randomUUID();

  window.sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    newSessionId
  );

  return newSessionId;
}

function createMessage(
  role: ChatMessage["role"],
  content: string
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  };
}

export default function WorkspacePage() {
  const apiUrl = normalizeApiUrl(
    process.env.NEXT_PUBLIC_API_URL
  );

  const [input, setInput] = useState("");

  const [sessionId, setSessionId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : getOrCreateSessionId()
  );

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([
    createMessage(
      "agent",
      "Hi! I'm Goal Coach AI. Tell me your goal, deadline, and how many minutes you can spend each day. I'll create a personalized daily plan and send you an automatic morning brief."
    ),
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [goalCreated, setGoalCreated] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.sessionStorage.getItem(
          GOAL_CREATED_STORAGE_KEY
        ) === "true"
  );

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isLoading) {
      return;
    }

    if (!apiUrl) {
      setMessages((current) => [
        ...current,
        createMessage(
          "agent",
          "Missing NEXT_PUBLIC_API_URL. Add your API Gateway URL to .env.local and restart the development server."
        ),
      ]);

      return;
    }

    setMessages((current) => [
      ...current,
      createMessage("user", trimmed),
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const activeSessionId =
        sessionId || getOrCreateSessionId();

      const data = await sendChatMessage(
        apiUrl,
        trimmed,
        activeSessionId
      );

      if (data.sessionId) {
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          data.sessionId
        );

        setSessionId(data.sessionId);
      }

      const agentMessage =
        data.message ||
        "I could not create your goal plan.";

      const goalWasCreated =
        data.goalCreated === true ||
        agentMessage.includes("GOAL_CREATED");

      const visibleAgentMessage = agentMessage
        .replace("GOAL_CREATED", "")
        .trim();

      setMessages((current) => [
        ...current,
        createMessage("agent", visibleAgentMessage),
      ]);

      if (goalWasCreated) {
        setGoalCreated(true);

        window.sessionStorage.setItem(
          GOAL_CREATED_STORAGE_KEY,
          "true"
        );

        window.localStorage.setItem(
          "goal-coach-goal-updated",
          Date.now().toString()
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown frontend error";

      setMessages((current) => [
        ...current,
        createMessage(
          "agent",
          `Something went wrong: ${message}`
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function changeGoal() {
    const newSessionId = crypto.randomUUID();

    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      newSessionId
    );

    window.sessionStorage.removeItem(
      GOAL_CREATED_STORAGE_KEY
    );

    setSessionId(newSessionId);
    setGoalCreated(false);
    setInput("");

    setMessages([
      createMessage(
        "agent",
        "Tell me your new goal, deadline, and how many minutes you can spend each day."
      ),
    ]);
  }

  return (
    <div className="sb-page-shell min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
              Build your next goal with AI
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Describe your objective once. Goal Coach AI will
              save it, prepare the daily coaching workflow, and
              send a focused action to your inbox each morning.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/[0.08]">
              ✦
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Amazon Bedrock connected
              </p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                Agent and action group ready
              </p>
            </div>
          </div>
        </div>

        {goalCreated ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[30px] border border-sky-400/15 bg-[#0b1728] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] text-2xl font-bold text-sky-300">
                ✓
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
                Goal created successfully
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your coaching workflow is ready.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Your goal is saved in DynamoDB. Every morning,
                EventBridge will trigger the coaching Lambda,
                Amazon Nova will create your task, and SNS will
                deliver it to your email.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/"
                  className="sb-btn-primary rounded-xl px-6 py-3.5 text-center text-sm"
                >
                  View Goal Dashboard
                </a>

                <button
                  type="button"
                  onClick={changeGoal}
                  className="sb-btn-outline rounded-xl px-6 py-3.5 text-sm"
                >
                  Create Another Goal
                </button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                  Workflow status
                </p>

                <div className="mt-5 space-y-4">
                  {[
                    ["Goal saved", "Complete"],
                    ["Daily coaching", "Enabled"],
                    ["Email delivery", "Scheduled"],
                  ].map(([label, status]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-slate-300">
                        {label}
                      </span>

                      <span className="rounded-full bg-sky-400/[0.08] px-3 py-1 text-xs font-semibold text-sky-300">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-sky-400/10 bg-sky-400/[0.045] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
                  What happens next
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Your next personalized coaching email will be
                  generated automatically by Amazon Nova during
                  the scheduled morning workflow.
                </p>
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ChatPanel
              messages={messages}
              input={input}
              isLoading={isLoading}
              onInputChange={setInput}
              onSend={() => sendMessage(input)}
              onQuickPrompt={sendMessage}
            />

            <aside className="space-y-4">
              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
                  What to include
                </p>

                <div className="mt-5 space-y-5">
                  {[
                    {
                      number: "01",
                      title: "Your goal",
                      text: "What do you want to achieve?",
                    },
                    {
                      number: "02",
                      title: "Your deadline",
                      text: "Use a date or duration.",
                    },
                    {
                      number: "03",
                      title: "Daily time",
                      text: "How many minutes can you commit?",
                    },
                  ].map((item) => (
                    <div
                      key={item.number}
                      className="flex gap-3"
                    >
                      <span className="mt-0.5 text-xs font-bold text-sky-400">
                        {item.number}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/[0.07] bg-[#0b1728] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                  Example
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  “Pass the AWS Developer Associate exam in one
                  month. I can study 120 minutes per day.”
                </p>
              </div>

              <div className="rounded-[24px] border border-sky-400/15 bg-sky-400/[0.05] p-6">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(52,211,153,0.7)]" />

                  <p className="text-sm font-semibold text-sky-200">
                    All AWS services are online
                  </p>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-300">
                  Bedrock Agent, Lambda, DynamoDB, EventBridge,
                  Amazon Nova, and SNS are connected.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}