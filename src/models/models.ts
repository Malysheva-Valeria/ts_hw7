// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseEvent {
  readonly id: number;
  readonly createdAt: Date;
  readonly type: string;
}

// ─── Concrete event shapes ────────────────────────────────────────────────────

export interface MeetingEvent extends BaseEvent {
  readonly type: 'meeting';
  title: string;
  location: string;
  participants: string[];
  startTime: Date;
}

export interface TaskEvent extends BaseEvent {
  readonly type: 'task';
  title: string;
  dueDate: Date;
  tags: string[];
  completed: boolean;
}

export interface ReminderEvent extends BaseEvent {
  readonly type: 'reminder';
  message: string;
  notifyBefore: number; // minutes before the trigger time
  triggerAt: Date;
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type AppEvent = MeetingEvent | TaskEvent | ReminderEvent;

export type EventType = AppEvent['type']; // 'meeting' | 'task' | 'reminder'

// ─── Conditional / Mapped types ───────────────────────────────────────────────

/**
 * Groups AppEvent sub-types by their discriminator value.
 *
 * MapByType = {
 *   meeting:  MeetingEvent;
 *   task:     TaskEvent;
 *   reminder: ReminderEvent;
 * }
 */
export type MapByType = {
  [K in EventType]: Extract<AppEvent, { type: K }>;
};

// ─── DTO types ────────────────────────────────────────────────────────────────

/**
 * Strips service-managed fields so callers cannot supply them at creation time.
 */
export type CreateEventDto<T extends AppEvent> = Omit<T, 'id' | 'createdAt'>;

/**
 * Safe partial update: only mutable, non-discriminator fields may be touched.
 * 'id', 'createdAt', and 'type' are all excluded.
 */
export type UpdateEventDto<T extends AppEvent> = Partial<
  Pick<T, Exclude<keyof T, 'id' | 'createdAt' | 'type'>>
>;

// ─── Custom error ─────────────────────────────────────────────────────────────

export class TaskNotFoundError extends Error {
  constructor(public readonly eventId: number) {
    super(`Event with id ${eventId} was not found.`);
    this.name = 'TaskNotFoundError';
    // Restore prototype chain when targeting ES5 / transpiled envs
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
