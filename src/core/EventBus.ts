import type { TexyEditorEvents, TexyEventHandler } from '../types';

export class EventBus<TMap extends Record<keyof TMap, unknown> = TexyEditorEvents> {
  private listeners = new Map<keyof TMap, Set<TexyEventHandler<TMap[keyof TMap]>>>();

  on<K extends keyof TMap>(event: K, handler: TexyEventHandler<TMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as TexyEventHandler<TMap[keyof TMap]>);
  }

  off<K extends keyof TMap>(event: K, handler: TexyEventHandler<TMap[K]>): void {
    this.listeners.get(event)?.delete(handler as TexyEventHandler<TMap[keyof TMap]>);
  }

  emit<K extends keyof TMap>(
    event: K,
    ...args: TMap[K] extends void ? [] : [data: TMap[K]]
  ): void {
    const data = args[0] as TMap[K];
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[TexyEditor] Event handler error for "${String(event)}":`, err);
      }
    });
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
