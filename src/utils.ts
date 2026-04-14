import type { Task } from "./models.js";
import { TaskStatus, TaskPriority } from "./models.js";

// ─── Generic Finder ───────────────────────────────────────────────────────────

/**
 * Finds an element by its numeric `id` property in any typed array.
 * Returns `undefined` when no match is found.
 */
export function findElementById<T extends { id: number }>(
  items: T[],
  id: number,
): T | undefined {
  return items.find((item) => item.id === id);
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

/**
 * Narrows an `unknown` value to `Task`.
 * Checks every required field and validates enum membership.
 */
export function isTask(obj: unknown): obj is Task {
  if (typeof obj !== "object" || obj === null) return false;

  const record = obj as Record<string, unknown>;

  return (
    typeof record["id"]          === "number"  &&
    typeof record["title"]       === "string"  &&
    typeof record["description"] === "string"  &&
    Object.values(TaskStatus).includes(record["status"] as TaskStatus) &&
    Object.values(TaskPriority).includes(record["priority"] as TaskPriority) &&
    record["createdAt"] instanceof Date &&
    (record["completedAt"] === undefined || record["completedAt"] instanceof Date)
  );
}
