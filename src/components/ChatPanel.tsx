"use client";

import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import type { ChatMessage } from "@/types/task";

const QUICK_PROMPTS = [
  {
    title: "AWS certification",
    prompt:
      "Pass the AWS Solutions Architect Associate exam by September 15, 2026. I can study 60 minutes per day.",
  },
  {
    title: "Learn Java",
    prompt:
      "Learn Java programming in 30 days. I can study 45 minutes per day.",
  },
  {
    title: "Interview prep",
    prompt:
      "Prepare for a data engineering interview in 6 weeks. I can study 90 minutes per day.",
  },
  {
    title: "Learn French",
    prompt:
      "Learn conversational French in 2 months. I can practice 30 minutes per day.",
  },
];

type ChatPanelProps = {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onQuickPrompt: (prompt: string) => void;
};

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  onQuickPrompt,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isLoading]);

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <section className="flex h-[680px] min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/50 bg-[#0b1728] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <header className="flex shrink-0 items-center justify-between gap-5 border-b border-white/50 px-6 py-5 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-400">
            AI conversation
          </p>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
            Create your personal goal
          </h2>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            Agent ready
          </span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7"
      >
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex items-end gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sky-400/10 bg-sky-400/[0.08] text-xs font-bold text-sky-300">
                  AI
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3.5 text-sm leading-6 sm:max-w-[76%] ${
                  isUser
                    ? "rounded-br-md bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]"
                    : "rounded-bl-md border border-blue-400/10 bg-[#11203a] text-slate-200"
                }`}
              >
                <div
                  className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    isUser ? "text-blue-100" : "text-sky-400"
                  }`}
                >
                  {isUser ? "You" : "Goal Coach"}
                </div>

                {isUser ? (
                  message.content
                ) : (
                  <Markdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-white">
                          {children}
                        </strong>
                      ),
                      ol: ({ children }) => (
                        <ol className="ml-5 list-decimal space-y-1.5">
                          {children}
                        </ol>
                      ),
                      ul: ({ children }) => (
                        <ul className="ml-5 list-disc space-y-1.5">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                    }}
                  >
                    {message.content}
                  </Markdown>
                )}
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-200">
                  You
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sky-400/10 bg-sky-400/[0.08] text-xs font-bold text-sky-300">
              AI
            </div>

            <div className="rounded-2xl rounded-bl-md border border-blue-400/10 bg-[#11203a] px-4 py-3.5 text-sm text-slate-300">
              <span className="inline-flex items-center gap-3">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" />
                </span>

                Creating your goal plan...
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/50 bg-[#091524]/85 px-5 py-5 sm:px-7">
        <div className="mb-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
            Start with an example
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onQuickPrompt(item.prompt)}
                disabled={isLoading}
                className="group rounded-xl border border-white/50 bg-blue-400/[0.04] px-3 py-3 text-left transition hover:border-sky-400/20 hover:bg-blue-500/[0.08] disabled:opacity-50"
              >
                <p className="text-xs font-semibold text-slate-300 transition group-hover:text-white">
                  {item.title}
                </p>

                <p className="mt-1 line-clamp-1 text-[11px] text-slate-300">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-[#07111f] p-2 transition focus-within:border-blue-500/60 focus-within:ring-4 focus-within:ring-blue-500/15">
          <textarea
            value={input}
            onChange={(event) =>
              onInputChange(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder='Example: "Pass AWS Developer Associate in one month. I can study 120 minutes per day."'
            rows={2}
            disabled={isLoading}
            className="min-h-[68px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-300 disabled:opacity-60"
          />

          <div className="flex items-center justify-between gap-4 px-2 pb-1">
            <p className="hidden text-[11px] text-slate-300 sm:block">
              Enter to send · Shift + Enter for a new line
            </p>

            <button
              type="button"
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              className="sb-btn-primary ml-auto rounded-xl px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create Goal
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}