import { describe, it, expect } from 'vitest';
import { UndoManager } from '../src/core/UndoManager';

function state(value: string, start = 0, end = 0) {
  return { value, cursorStart: start, cursorEnd: end };
}

describe('UndoManager', () => {
  it('starts empty with no undo/redo', () => {
    const um = new UndoManager();
    expect(um.canUndo()).toBe(false);
    expect(um.canRedo()).toBe(false);
    expect(um.undo()).toBeNull();
    expect(um.redo()).toBeNull();
  });

  it('push + undo returns previous state', () => {
    const um = new UndoManager();
    um.push(state('a'));
    um.push(state('ab'));
    expect(um.canUndo()).toBe(true);
    const prev = um.undo();
    expect(prev?.value).toBe('a');
  });

  it('redo restores after undo', () => {
    const um = new UndoManager();
    um.push(state('a'));
    um.push(state('ab'));
    um.undo();
    expect(um.canRedo()).toBe(true);
    const next = um.redo();
    expect(next?.value).toBe('ab');
  });

  it('push after undo discards redo stack', () => {
    const um = new UndoManager();
    um.push(state('a'));
    um.push(state('ab'));
    um.push(state('abc'));
    um.undo(); // back to 'ab'
    um.push(state('abd'));
    expect(um.canRedo()).toBe(false);
    expect(um.undo()?.value).toBe('ab');
  });

  it('respects maxSteps limit', () => {
    const um = new UndoManager(3);
    um.push(state('a'));
    um.push(state('b'));
    um.push(state('c'));
    um.push(state('d')); // 'a' should be evicted
    // Can only undo to 'b' (3 items: b, c, d — pointer 2, undo to 1, then to 0)
    expect(um.undo()?.value).toBe('c');
    expect(um.undo()?.value).toBe('b');
    expect(um.undo()).toBeNull(); // Can't go further back
  });

  it('clear resets everything', () => {
    const um = new UndoManager();
    um.push(state('a'));
    um.push(state('b'));
    um.clear();
    expect(um.canUndo()).toBe(false);
    expect(um.canRedo()).toBe(false);
  });

  it('preserves cursor positions', () => {
    const um = new UndoManager();
    um.push(state('hello', 5, 5));
    um.push(state('hello world', 11, 11));
    const prev = um.undo();
    expect(prev?.cursorStart).toBe(5);
    expect(prev?.cursorEnd).toBe(5);
  });

  it('handles single state (no undo possible)', () => {
    const um = new UndoManager();
    um.push(state('only'));
    expect(um.canUndo()).toBe(false);
    expect(um.undo()).toBeNull();
  });

  it('multiple undo/redo cycles', () => {
    const um = new UndoManager();
    um.push(state('1'));
    um.push(state('2'));
    um.push(state('3'));

    expect(um.undo()?.value).toBe('2');
    expect(um.undo()?.value).toBe('1');
    expect(um.redo()?.value).toBe('2');
    expect(um.redo()?.value).toBe('3');
    expect(um.redo()).toBeNull();
  });
});
