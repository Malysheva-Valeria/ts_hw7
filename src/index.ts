import { TaskStatus, TaskPriority } from "./models.js";
import { isTask } from "./utils.js";
import { TaskManager, TaskNotFoundError } from "./manager.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIVIDER = "─".repeat(60);

function section(title: string): void {
  console.log(`\n${DIVIDER}`);
  console.log(`  ${title}`);
  console.log(DIVIDER);
}

function printTask(task: unknown): void {
  if (!isTask(task)) {
    console.log("  [invalid task object]");
    return;
  }
  console.log(`  [#${task.id}] ${task.title}`);
  console.log(`        Status   : ${task.status}`);
  console.log(`        Priority : ${task.priority}`);
  console.log(`        Created  : ${task.createdAt.toISOString()}`);
  if (task.completedAt) {
    console.log(`        Completed: ${task.completedAt.toISOString()}`);
  }
  console.log(`        Desc     : ${task.description}`);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const manager = new TaskManager();

const seeds = [
  { title: "Set up CI/CD pipeline",         description: "Configure GitHub Actions for automated builds.",       status: TaskStatus.Completed,  priority: TaskPriority.High   },
  { title: "Design database schema",         description: "Draft ERD for the new user module.",                   status: TaskStatus.Completed,  priority: TaskPriority.High   },
  { title: "Implement authentication",       description: "Add JWT-based login and registration endpoints.",      status: TaskStatus.InProgress, priority: TaskPriority.High   },
  { title: "Write unit tests for auth",      description: "Achieve ≥ 90 % coverage on the auth service.",         status: TaskStatus.Todo,       priority: TaskPriority.Medium },
  { title: "Build dashboard UI",             description: "Create the main analytics dashboard with charts.",     status: TaskStatus.InProgress, priority: TaskPriority.Medium },
  { title: "Optimize database queries",      description: "Profile slow queries and add missing indexes.",        status: TaskStatus.Todo,       priority: TaskPriority.Low    },
  { title: "Update API documentation",       description: "Sync Swagger docs with the latest endpoint changes.",  status: TaskStatus.Todo,       priority: TaskPriority.Low    },
  { title: "Migrate legacy data",            description: "Run ETL scripts to move records from the old system.", status: TaskStatus.Canceled,   priority: TaskPriority.Medium },
] as const;

for (const seed of seeds) {
  manager.add({ ...seed });
}

// ─── Demo: Show all seeded tasks ──────────────────────────────────────────────

section("ALL SEEDED TASKS (8 items)");
manager.getAll().forEach(printTask);

// ─── Demo: Add a new task ─────────────────────────────────────────────────────

section("ADD: New task → 'Deploy to staging'");
const newTask = manager.add({
  title:       "Deploy to staging",
  description: "Push the latest release candidate to the staging environment.",
  status:      TaskStatus.Todo,
  priority:    TaskPriority.High,
});
printTask(newTask);
console.log(`\n  Total tasks now: ${manager.getAll().length}`);

// ─── Demo: Update status → InProgress ────────────────────────────────────────

section("UPDATE: #9 status → InProgress");
const inProgress = manager.update(newTask.id, { status: TaskStatus.InProgress });
printTask(inProgress);

// ─── Demo: Update status → Completed (sets completedAt) ──────────────────────

section("UPDATE: #9 status → Completed  (completedAt auto-set)");
const completed = manager.update(newTask.id, { status: TaskStatus.Completed });
printTask(completed);

// ─── Demo: Delete a task ──────────────────────────────────────────────────────

section("DELETE: task #7 ('Update API documentation')");
manager.delete(7);
console.log("  Task #7 deleted successfully.");
console.log(`  Total tasks now: ${manager.getAll().length}`);

// ─── Demo: Filter by Status ───────────────────────────────────────────────────

section("FILTER: status = Todo");
manager.filterByStatus(TaskStatus.Todo).forEach(printTask);

section("FILTER: status = Completed");
manager.filterByStatus(TaskStatus.Completed).forEach(printTask);

// ─── Demo: Filter by Priority ─────────────────────────────────────────────────

section("FILTER: priority = High");
manager.filterByPriority(TaskPriority.High).forEach(printTask);

// ─── Demo: Combined filter (status + priority) ────────────────────────────────

section("FILTER (combined): status = InProgress  AND  priority = High");
manager.filterByStatusAndPriority(TaskStatus.InProgress, TaskPriority.High).forEach(printTask);

// ─── Demo: Error handling ─────────────────────────────────────────────────────

section("ERROR HANDLING: getById(999) → TaskNotFoundError");
try {
  manager.getById(999);
} catch (err) {
  if (err instanceof TaskNotFoundError) {
    console.log(`  Caught ${err.name}: ${err.message}`);
  }
}

section("ERROR HANDLING: delete(999) → TaskNotFoundError");
try {
  manager.delete(999);
} catch (err) {
  if (err instanceof TaskNotFoundError) {
    console.log(`  Caught ${err.name}: ${err.message}`);
  }
}

console.log(`\n${DIVIDER}`);
console.log("  Done.");
console.log(DIVIDER + "\n");
