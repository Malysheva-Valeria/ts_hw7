import { EventManager } from './services/manager.js';
import { TaskNotFoundError } from './models/models.js';
import { formatEvent, isMeetingEvent, isTaskEvent, isReminderEvent } from './utils/utils.js';

const hr = (label: string) =>
  console.log(`\n${'═'.repeat(60)}\n  ${label}\n${'═'.repeat(60)}`);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const manager = new EventManager();

// ─── 1. SEED — 9 diverse events ───────────────────────────────────────────────

hr('SEED DATA — adding 9 events');

manager.add<import('./models/models.js').MeetingEvent>({
  type: 'meeting',
  title: 'Sprint Planning',
  location: 'Conference Room A',
  participants: ['Alice', 'Bob', 'Charlie'],
  startTime: new Date('2026-04-20T10:00:00'),
});

manager.add<import('./models/models.js').MeetingEvent>({
  type: 'meeting',
  title: 'Design Review',
  location: 'Zoom #design-weekly',
  participants: ['Diana', 'Eve'],
  startTime: new Date('2026-04-21T14:00:00'),
});

manager.add<import('./models/models.js').MeetingEvent>({
  type: 'meeting',
  title: 'Stakeholder Demo',
  location: 'Main Hall',
  participants: ['Frank', 'Grace', 'Heidi', 'Ivan'],
  startTime: new Date('2026-04-25T09:00:00'),
});

manager.add<import('./models/models.js').TaskEvent>({
  type: 'task',
  title: 'Fix login bug',
  dueDate: new Date('2026-04-17T18:00:00'),
  tags: ['bug', 'auth', 'critical'],
  completed: false,
});

manager.add<import('./models/models.js').TaskEvent>({
  type: 'task',
  title: 'Write API docs',
  dueDate: new Date('2026-04-22T12:00:00'),
  tags: ['docs', 'api'],
  completed: false,
});

manager.add<import('./models/models.js').TaskEvent>({
  type: 'task',
  title: 'Migrate database schema',
  dueDate: new Date('2026-04-30T09:00:00'),
  tags: ['db', 'migration', 'backend'],
  completed: false,
});

manager.add<import('./models/models.js').ReminderEvent>({
  type: 'reminder',
  message: 'Submit quarterly report',
  notifyBefore: 60,
  triggerAt: new Date('2026-04-18T09:00:00'),
});

manager.add<import('./models/models.js').ReminderEvent>({
  type: 'reminder',
  message: 'Team lunch reservation',
  notifyBefore: 30,
  triggerAt: new Date('2026-04-19T12:00:00'),
});

manager.add<import('./models/models.js').ReminderEvent>({
  type: 'reminder',
  message: 'Renew SSL certificate',
  notifyBefore: 1440, // 24 hours
  triggerAt: new Date('2026-05-01T00:00:00'),
});

console.log(`Total events seeded: ${manager.count}`);

// ─── 2. READ ALL ──────────────────────────────────────────────────────────────

hr('ALL EVENTS (console.table)');
console.table(manager.getAll().map(formatEvent));

// ─── 3. TYPED QUERIES ─────────────────────────────────────────────────────────

hr('TYPED QUERY — getEventsByType("task")');
const tasks = manager.getEventsByType('task');
console.table(tasks.map(formatEvent));

// TypeScript knows these are TaskEvent — safe to access .dueDate directly:
console.log('Due dates:');
tasks.forEach((t) => console.log(`  [${t.id}] ${t.title} → ${t.dueDate.toDateString()}`));

// ─── 4. TYPE GUARDS ───────────────────────────────────────────────────────────

hr('TYPE GUARDS demo');
const all = manager.getAll();
all.forEach((event) => {
  if (isMeetingEvent(event)) {
    console.log(`[meeting #${event.id}] "${event.title}" @ ${event.location} — ${event.participants.length} participant(s)`);
  } else if (isTaskEvent(event)) {
    console.log(`[task    #${event.id}] "${event.title}" — tags: ${event.tags.join(', ')}`);
  } else if (isReminderEvent(event)) {
    console.log(`[remind  #${event.id}] "${event.message}" — notify ${event.notifyBefore} min before`);
  }
});

// ─── 5. UPDATE ────────────────────────────────────────────────────────────────

hr('UPDATE — mark task #4 completed & add a tag');
const updated = manager.update<import('./models/models.js').TaskEvent>(4, {
  completed: true,
  tags: ['bug', 'auth', 'critical', 'resolved'],
});
console.log('Updated event:');
console.table([formatEvent(updated)]);

// ─── 6. UPDATE — verify type cannot change ────────────────────────────────────

hr('UPDATE — attempt to change type (runtime strip, type error at compile time)');
// The UpdateEventDto type does NOT include 'type', so passing it is a compile
// error.  We demonstrate the runtime guard by casting to unknown first.
const maliciousPatch = { type: 'reminder' } as unknown as import('./models/models.js').UpdateEventDto<import('./models/models.js').TaskEvent>;
const safeResult = manager.update<import('./models/models.js').TaskEvent>(4, maliciousPatch);
console.log(`Event #4 type after patch attempt: "${safeResult.type}" (unchanged — still 'task')`);

// ─── 7. GROUPING ─────────────────────────────────────────────────────────────

hr('GROUP BY TYPE');
const groups = manager.groupByType();
(['meeting', 'task', 'reminder'] as const).forEach((key) => {
  console.log(`\n  ${key.toUpperCase()} (${groups[key].length}):`);
  groups[key].forEach((e) => console.log(`    #${e.id}`, formatEvent(e)));
});

// ─── 8. FILTER ───────────────────────────────────────────────────────────────

hr('FILTER — incomplete tasks');
const incomplete = manager.filter(
  (e): e is import('./models/models.js').TaskEvent => e.type === 'task' && !(e as import('./models/models.js').TaskEvent).completed,
);
console.table(incomplete.map(formatEvent));

// ─── 9. DELETE ────────────────────────────────────────────────────────────────

hr('DELETE — remove event #2');
manager.delete(2);
console.log(`Events after delete: ${manager.count}`);

// ─── 10. TaskNotFoundError ────────────────────────────────────────────────────

hr('ERROR HANDLING — TaskNotFoundError');

// Trigger on a deleted id
try {
  manager.getById(2);
} catch (err: unknown) {
  if (err instanceof TaskNotFoundError) {
    console.error(`Caught TaskNotFoundError: ${err.message} (eventId=${err.eventId})`);
  } else {
    throw err;
  }
}

// Trigger on a completely non-existent id
try {
  manager.delete(999);
} catch (err: unknown) {
  if (err instanceof TaskNotFoundError) {
    console.error(`Caught TaskNotFoundError: ${err.message} (eventId=${err.eventId})`);
  } else {
    throw err;
  }
}

// Trigger on update
try {
  manager.update(999, { title: 'Ghost' } as import('./models/models.js').UpdateEventDto<import('./models/models.js').MeetingEvent>);
} catch (err: unknown) {
  if (err instanceof TaskNotFoundError) {
    console.error(`Caught TaskNotFoundError: ${err.message} (eventId=${err.eventId})`);
  } else {
    throw err;
  }
}

// ─── 11. FINAL STATE ─────────────────────────────────────────────────────────

hr('FINAL STATE — all remaining events');
console.table(manager.getAll().map(formatEvent));
console.log(`\nTotal: ${manager.count} events`);
