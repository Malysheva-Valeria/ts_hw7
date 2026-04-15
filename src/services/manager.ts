import {
  AppEvent,
  EventType,
  MapByType,
  CreateEventDto,
  UpdateEventDto,
  TaskNotFoundError,
} from '../models/models.js';
import { findElementById } from '../utils/utils.js';

export class EventManager {
  private events: AppEvent[] = [];
  private nextId = 1;

  // ─── Add ────────────────────────────────────────────────────────────────────

  add<T extends AppEvent>(dto: CreateEventDto<T>): T {
    const event = {
      ...dto,
      id: this.nextId++,
      createdAt: new Date(),
    } as T;

    this.events.push(event);
    return event;
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

  delete(id: number): void {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new TaskNotFoundError(id);
    this.events.splice(index, 1);
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  /**
   * Applies a safe partial update.  The discriminator ('type'), 'id', and
   * 'createdAt' fields can never be mutated — this is enforced both at the
   * type level (UpdateEventDto excludes them) and at runtime (they are
   * explicitly stripped from the patch before merging).
   */
  update<T extends AppEvent>(id: number, patch: UpdateEventDto<T>): T {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new TaskNotFoundError(id);

    const existing = this.events[index] as T;

    // Runtime guard: strip any attempt to change protected fields
    const safePatch = { ...patch } as Partial<AppEvent>;
    delete (safePatch as Partial<{ id: number }>).id;
    delete (safePatch as Partial<{ createdAt: Date }>).createdAt;
    delete (safePatch as Partial<{ type: string }>).type;

    const updated: T = { ...existing, ...safePatch };
    this.events[index] = updated;
    return updated;
  }

  // ─── Read ───────────────────────────────────────────────────────────────────

  getAll(): AppEvent[] {
    return [...this.events];
  }

  getById(id: number): AppEvent {
    const found = findElementById(this.events, id);
    if (!found) throw new TaskNotFoundError(id);
    return found;
  }

  // ─── Filter ─────────────────────────────────────────────────────────────────

  filter(predicate: (event: AppEvent) => boolean): AppEvent[] {
    return this.events.filter(predicate);
  }

  // ─── Typed query ─────────────────────────────────────────────────────────────

  /**
   * Returns only events that match the given discriminator,
   * narrowed to the correct concrete type via Extract<>.
   */
  getEventsByType<T extends EventType>(type: T): Extract<AppEvent, { type: T }>[] {
    return this.events.filter(
      (e): e is Extract<AppEvent, { type: T }> => e.type === type,
    );
  }

  // ─── Grouping ────────────────────────────────────────────────────────────────

  /**
   * Returns a Record keyed by event type where each value is the array of
   * matching events, fully typed via the MapByType mapped type.
   */
  groupByType(): { [K in EventType]: MapByType[K][] } {
    const groups: { [K in EventType]: MapByType[K][] } = {
      meeting: [],
      task: [],
      reminder: [],
    };

    for (const event of this.events) {
      // TypeScript cannot narrow inside a generic key loop, so we use an
      // exhaustive cast here — it is safe because the union is closed.
      (groups[event.type] as AppEvent[]).push(event);
    }

    return groups;
  }

  get count(): number {
    return this.events.length;
  }
}
