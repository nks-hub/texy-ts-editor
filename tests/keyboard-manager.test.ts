import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyboardManager } from '../src/core/KeyboardManager';

describe('KeyboardManager', () => {
  let textarea: HTMLTextAreaElement;
  let km: KeyboardManager;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    km = new KeyboardManager(textarea);
  });

  function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    textarea.dispatchEvent(event);
    return event;
  }

  it('registers and calls handler for Ctrl+B', () => {
    const handler = vi.fn();
    km.register('bold', handler);
    km.attach();

    fireKey('b', { ctrlKey: true });
    expect(handler).toHaveBeenCalled();
  });

  it('registers and calls handler for Ctrl+I', () => {
    const handler = vi.fn();
    km.register('italic', handler);
    km.attach();

    fireKey('i', { ctrlKey: true });
    expect(handler).toHaveBeenCalled();
  });

  it('registers Ctrl+Shift+Z for redo', () => {
    const handler = vi.fn();
    km.register('redo', handler);
    km.attach();

    fireKey('z', { ctrlKey: true, shiftKey: true });
    expect(handler).toHaveBeenCalled();
  });

  it('does not fire handler without modifier', () => {
    const handler = vi.fn();
    km.register('bold', handler);
    km.attach();

    fireKey('b');
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire after detach', () => {
    const handler = vi.fn();
    km.register('bold', handler);
    km.attach();
    km.detach();

    fireKey('b', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports custom shortcuts', () => {
    const customKm = new KeyboardManager(textarea, { bold: 'Alt+B' });
    const handler = vi.fn();
    customKm.register('bold', handler);
    customKm.attach();

    fireKey('b', { altKey: true });
    expect(handler).toHaveBeenCalled();
  });

  it('ignores unregistered shortcuts', () => {
    km.attach();
    // Should not throw
    expect(() => fireKey('x', { ctrlKey: true })).not.toThrow();
  });

  it('handles Tab for indent', () => {
    const handler = vi.fn();
    km.register('indent', handler);
    km.attach();

    fireKey('Tab');
    expect(handler).toHaveBeenCalled();
  });

  it('handles Shift+Tab for unindent', () => {
    const handler = vi.fn();
    km.register('unindent', handler);
    km.attach();

    fireKey('Tab', { shiftKey: true });
    expect(handler).toHaveBeenCalled();
  });

  it('handles F11 for fullscreen', () => {
    const handler = vi.fn();
    km.register('fullscreen', handler);
    km.attach();

    fireKey('F11');
    expect(handler).toHaveBeenCalled();
  });
});
