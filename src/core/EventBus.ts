import type { TexyEditorEvents, TexyEventHandler } from '../types';

type EventMap = TexyEditorEvents;

export class EventBus {
  private listeners = new Map<string, Set<TexyEventHandler<unknown>>>();

  on<K extends keyof EventMap>(event: K, handler: TexyEventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(handler as TexyEventHandler<unknown>);
  }

  off<K extends keyof EventMap>(event: K, handler: TexyEventHandler<EventMap[K]>): void {
    this.listeners.get(event as string)?.delete(handler as TexyEventHandler<unknown>);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [data: EventMap[K]]
  ): void {
    const data = args[0] as EventMap[K];
    this.listeners.get(event as string)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[TexyEditor] Event handler error for "${event as string}":`, err);
      }
    });
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
