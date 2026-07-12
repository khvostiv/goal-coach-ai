"use client";

import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import type { ChatMessage } from "@/types/task";

const QUICK_PROMPTS = [
  "Build a Spring Boot REST API with JWT",
  "Create an AWS Data Lake using S3, Glue and Athena",
  "Plan a Kafka streaming pipeline",
  "Build an ETL pipeline from MySQL to Redshift",
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <section className="sb-panel flex h-[680px] min-h-0 flex-col rounded-[2rem]">
      <header className="shrink-0 border-b border-[var(--sb-border)] px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="sb-label">AI Engineering Assistant</p>
            <h2 className="text-base font-bold text-[var(--sb-text)]">
              Engineering Project Planner
            </h2>
          </div>

          <div className="rounded-xl border border-[var(--sb-border)] bg-[var(--sb-cyan-dim)] px-3 py-1.5 text-center">
            <p className="font-[family-name:var(--font-mono)] text-[9px] font-bold uppercase tracking-wider text-[var(--sb-cyan)]">
              Powered by Bedrock
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? "rounded-br-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    : "rounded-bl-sm border border-violet-500/20 bg-[#140d24] text-[var(--sb-text)]"
                }`}
              >
                <div className="mb-1 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isUser ? "You" : "Agent"}
                </div>
                {isUser ? (
                  message.content
                ) : (
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-[var(--sb-text)]">{children}</strong>,
                      ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
                      ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                    }}
                  >
                    {message.content}
                  </Markdown>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-[var(--sb-border)] bg-[var(--sb-bg-elevated)] px-4 py-3 text-sm text-[var(--sb-text-muted)] shadow-lg">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-ping rounded-full bg-[var(--sb-cyan)]" />
                  Analyzing your project and generating an implementation roadmap...
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--sb-border)] px-5 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onQuickPrompt(prompt)}
              disabled={isLoading}
              className="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-bg-elevated)] px-2.5 py-1 text-left text-[11px] text-[var(--sb-text-muted)] transition hover:border-[var(--sb-cyan)] hover:text-[var(--sb-text)] disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex flex-col rounded-2xl border border-[var(--sb-border)] bg-[var(--sb-bg)] transition focus-within:border-[var(--sb-cyan)]">
          <textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Describe your engineering project...
            Example: "Build an AWS data pipeline using S3, Glue and Redshift"'
            rows={2}
            disabled={isLoading}
            className="min-h-[52px] w-full resize-none bg-transparent px-4 pt-3 text-sm text-[var(--sb-text)] outline-none placeholder:text-[var(--sb-text-muted)] disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider text-[var(--sb-text-muted)]">
              Press Enter to generate your project plan
            </p>
            <button
              type="button"
              onClick={onSend}
              disabled={isLoading || !input.trim()}
              className="sb-btn-primary rounded-xl px-4 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Plan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}