import type { Task, CreateTaskDto, UpdateTaskDto } from "./models.js";
import { TaskStatus, TaskPriority } from "./models.js";
import { findElementById } from "./utils.js";

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class TaskNotFoundError extends Error {
  constructor(id: number) {
    super(`Task with id ${id} was not found.`);
    this.name = "TaskNotFoundError";
  }
}

// ─── TaskManager ──────────────────────────────────────────────────────────────

export class TaskManager {
  private tasks: Task[] = [];
  private nextId: number = 1;

  // ── Read ──────────────────────────────────────────────────────────────────

  getAll(): readonly Task[] {
    return this.tasks;
  }

  getById(id: number): Task {
    const task = findElementById(this.tasks, id);
    if (!task) throw new TaskNotFoundError(id);
    return task;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  add(dto: CreateTaskDto): Task {
    const task: Task = {
      ...dto,
      id:        this.nextId++,
      createdAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  update(id: number, dto: UpdateTaskDto): Task {
    const task = this.getById(id); // throws TaskNotFoundError if missing

    if (dto.title       !== undefined) task.title       = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority    !== undefined) task.priority    = dto.priority;

    if (dto.status !== undefined) {
      task.status = dto.status;
      // Automatically record completion timestamp
      if (dto.status === TaskStatus.Completed) {
        task.completedAt = new Date();
      } else {
        // Removing completedAt when status moves away from Completed
        delete task.completedAt;
      }
    }

    return task;
  }

  delete(id: number): void {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new TaskNotFoundError(id);
    this.tasks.splice(index, 1);
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  filterByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((t) => t.status === status);
  }

  filterByPriority(priority: TaskPriority): Task[] {
    return this.tasks.filter((t) => t.priority === priority);
  }

  filterByStatusAndPriority(status: TaskStatus, priority: TaskPriority): Task[] {
    return this.tasks.filter((t) => t.status === status && t.priority === priority);
  }
}
