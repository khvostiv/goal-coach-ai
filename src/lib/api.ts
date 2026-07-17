import type { Task, TaskPriority, TaskStatus } from "@/types/task";

export function normalizeApiUrl(url: string | undefined) {
  return url?.replace(/\/+$/, "") ?? "";
}

export type GoalPlan = {
  taskId: string;
  goal: string;
  deadline: string;
  dailyMinutes: number;
  status: string;
  createdAt: string;
};

export async function fetchGoals(apiUrl: string): Promise<GoalPlan[]> {
  const response = await fetch(`${apiUrl}/goals`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.status}`);
  }

  const data = await response.json();

  return Array.isArray(data) ? data : data.goals ?? [];
}

export async function fetchTasks(apiUrl: string): Promise<Task[]> {
  const response = await fetch(`${apiUrl}/tasks`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load tasks");
  }

  return data.tasks || [];
}

export async function updateTaskApi(
  apiUrl: string,
  taskId: string,
  updates: Partial<{
    status: TaskStatus;
    priority: TaskPriority;
    title: string;
    dueDate: string;
    category: string;
  }>
): Promise<Task> {
  const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update task");
  }

  return data.task;
}

export async function deleteTaskApi(
  apiUrl: string,
  taskId: string
): Promise<void> {
  const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete task");
  }
}

export async function sendChatMessage(
  apiUrl: string,
  message: string,
  sessionId: string
): Promise<{
  message: string;
  sessionId: string;
  goalCreated?: boolean;
}> {

  const response = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.details || data.error || "Something went wrong");
  }

  return data;
}
