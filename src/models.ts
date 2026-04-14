// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TaskStatus {
  Todo       = "Todo",
  InProgress = "InProgress",
  Completed  = "Completed",
  Canceled   = "Canceled",
}

export enum TaskPriority {
  Low    = "Low",
  Medium = "Medium",
  High   = "High",
}

// ─── Core Entity ──────────────────────────────────────────────────────────────

export interface Task {
  id:           number;
  title:        string;
  description:  string;
  status:       TaskStatus;
  priority:     TaskPriority;
  createdAt:    Date;
  completedAt?: Date;
}

// ─── Data Transfer Objects ────────────────────────────────────────────────────

/** All fields required when creating a task (id / timestamps are generated). */
export type CreateTaskDto = Omit<Task, "id" | "createdAt" | "completedAt">;

/** Any subset of mutable fields may be supplied when updating a task. */
export type UpdateTaskDto = Partial<Pick<Task, "title" | "description" | "status" | "priority">>;
