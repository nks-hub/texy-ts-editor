import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/core/EventBus';

describe('EventBus', () => {
  it('calls handler on emit', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('change', handler);
    bus.emit('change', { value: 'test' });
    expect(handler).toHaveBeenCalledWith({ value: 'test' });
  });

  it('supports multiple handlers for same event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('change', h1);
    bus.on('change', h2);
    bus.emit('change', { value: 'x' });
    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it('unsubscribes with off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('change', handler);
    bus.off('change', handler);
    bus.emit('change', { value: 'x' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not throw on emit with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('change', { value: 'x' })).not.toThrow();
  });

  it('removeAll clears all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('change', handler);
    bus.on('undo', handler as () => void);
    bus.removeAll();
    bus.emit('change', { value: 'x' });
    bus.emit('undo', undefined as never);
    expect(handler).not.toHaveBeenCalled();
  });

  it('handler error does not break other handlers', () => {
    const bus = new EventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = vi.fn(() => { throw new Error('fail'); });
    const passing = vi.fn();
    bus.on('change', failing);
    bus.on('change', passing);
    bus.emit('change', { value: 'x' });
    expect(passing).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('supports different event types', () => {
    const bus = new EventBus();
    const changeHandler = vi.fn();
    const viewHandler = vi.fn();
    bus.on('change', changeHandler);
    bus.on('view:change', viewHandler);
    bus.emit('change', { value: 'x' });
    expect(changeHandler).toHaveBeenCalled();
    expect(viewHandler).not.toHaveBeenCalled();
  });
});
