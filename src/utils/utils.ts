import type { AppEvent, MeetingEvent, TaskEvent, ReminderEvent } from '../models/models.js';

// ─── Generic finder ───────────────────────────────────────────────────────────

/**
 * Finds an element in `items` whose `id` matches, or returns `undefined`.
 * Works for any object that carries a numeric `id`.
 */
export function findElementById<T extends { id: number }>(
  items: T[],
  id: number,
): T | undefined {
  return items.find((item) => item.id === id);
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isMeetingEvent(event: AppEvent): event is MeetingEvent {
  return event.type === 'meeting';
}

export function isTaskEvent(event: AppEvent): event is TaskEvent {
  return event.type === 'task';
}

export function isReminderEvent(event: AppEvent): event is ReminderEvent {
  return event.type === 'reminder';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatEvent(event: AppEvent): Record<string, unknown> {
  const base = {
    id: event.id,
    type: event.type,
    createdAt: formatDate(event.createdAt),
  };

  if (isMeetingEvent(event)) {
    return {
      ...base,
      title: event.title,
      location: event.location,
      participants: event.participants.join(', '),
      startTime: formatDate(event.startTime),
    };
  }

  if (isTaskEvent(event)) {
    return {
      ...base,
      title: event.title,
      dueDate: formatDate(event.dueDate),
      tags: event.tags.join(', '),
      completed: event.completed,
    };
  }

  // ReminderEvent
  return {
    ...base,
    message: event.message,
    notifyBefore: `${event.notifyBefore} min`,
    triggerAt: formatDate(event.triggerAt),
  };
}
