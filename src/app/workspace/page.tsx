"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { TaskList } from "@/components/TaskList";
import {
  deleteTaskApi,
  fetchTasks,
  normalizeApiUrl,
  sendChatMessage,
  updateTaskApi,
} from "@/lib/api";
import type { ChatMessage, Task } from "@/types/task";

const SESSION_STORAGE_KEY = "task-agent-session-id";

type TaskFilter = "all" | "active" | "done";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  };
}

export default function WorkspacePage() {
  const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [sessionId, setSessionId] = useState(() =>
    typeof window === "undefined" ? "" : getOrCreateSessionId()
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "agent",
      "Hi! I'm ProjectPilot AI. Describe your engineering project, and I'll break it into a prioritized implementation plan with actionable tasks."
    ),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const completionPercent =
    tasks.length === 0
      ? 0
      : Math.round(
          (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
        );

  const loadTasks = useCallback(async () => {
    if (!apiUrl) return;

    setIsRefreshing(true);

    try {
      const nextTasks = await fetchTasks(apiUrl);
      setTasks(nextTasks);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load tasks";

      setMessages((current) => [
        ...current,
        createMessage("agent", `Couldn't refresh tasks: ${message}`),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [apiUrl]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isLoading) return;

    if (!apiUrl) {
      setMessages((current) => [
        ...current,
        createMessage(
          "agent",
          "Missing NEXT_PUBLIC_API_URL. Add your API Gateway URL to .env.local and restart the dev server."
        ),
      ]);
      return;
    }

    setMessages((current) => [...current, createMessage("user", trimmed)]);
    setInput("");
    setIsLoading(true);

    try {
      const activeSessionId = sessionId || getOrCreateSessionId();
      const data = await sendChatMessage(apiUrl, trimmed, activeSessionId);

      if (data.sessionId) {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        setSessionId(data.sessionId);
      }

      setMessages((current) => [
        ...current,
        createMessage("agent", data.message || "Project plan generated successfully."),
      ]);

      await loadTasks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown frontend error";

      setMessages((current) => [
        ...current,
        createMessage("agent", `Something went wrong: ${message}`),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTask(task: Task) {
    if (!apiUrl || updatingTaskId) return;

    setUpdatingTaskId(task.taskId);

    try {
      await deleteTaskApi(apiUrl, task.taskId);
      setTasks((current) => current.filter((t) => t.taskId !== task.taskId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete task";

      setMessages((current) => [
        ...current,
        createMessage("agent", `Couldn't delete "${task.title}": ${message}`),
      ]);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function toggleTaskComplete(task: Task) {
    if (!apiUrl || updatingTaskId) return;

    const nextStatus = task.status === "completed" ? "pending" : "completed";

    setUpdatingTaskId(task.taskId);

    try {
      const updated = await updateTaskApi(apiUrl, task.taskId, {
        status: nextStatus,
      });

      setTasks((current) =>
        current.map((item) => (item.taskId === updated.taskId ? updated : item))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update task";

      setMessages((current) => [
        ...current,
        createMessage("agent", `Couldn't update "${task.title}": ${message}`),
      ]);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  useEffect(() => {
    if (!apiUrl) return;

    let cancelled = false;

    fetchTasks(apiUrl)
      .then((nextTasks) => {
        if (!cancelled) setTasks(nextTasks);
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load tasks";

          setMessages((current) => [
            ...current,
            createMessage("agent", `Couldn't refresh tasks: ${message}`),
          ]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-transparent">
      <SiteHeader />
  
      <main className="mx-auto flex w-full max-w-screen-2xl flex-col px-8 py-8">
  
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            ProjectPilot AI
          </h1>
  
          <p className="mt-4 text-lg text-violet-300">
            AI Engineering Project Planner
          </p>
        </div>
  
        <div className="grid min-h-[680px] gap-10 xl:grid-cols-[1.5fr_1fr]">
          <div className="min-h-0">
            <ChatPanel
              messages={messages}
              input={input}
              isLoading={isLoading}
              onInputChange={setInput}
              onSend={() => sendMessage(input)}
              onQuickPrompt={sendMessage}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-5">

            <div className="min-h-0 flex-1">
              <TaskList
                tasks={tasks}
                filter={filter}
                onFilterChange={setFilter}
                onToggleComplete={toggleTaskComplete}
                onDelete={deleteTask}
                onRefresh={loadTasks}
                updatingTaskId={updatingTaskId}
                isRefreshing={isRefreshing}
                completionPercent={completionPercent}
              />
            </div>
          </div>
        </div>
  
      </main>
    </div>
  );
}