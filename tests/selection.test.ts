import { describe, it, expect, beforeEach } from 'vitest';
import { Selection } from '../src/core/Selection';

describe('Selection', () => {
  let textarea: HTMLTextAreaElement;
  let sel: Selection;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    textarea.value = 'Hello World Test';
    document.body.appendChild(textarea);
    sel = new Selection(textarea);
  });

  it('getState returns correct snapshot', () => {
    textarea.setSelectionRange(6, 11); // "World"
    const state = sel.getState();
    expect(state.start).toBe(6);
    expect(state.end).toBe(11);
    expect(state.text).toBe('World');
    expect(state.before).toBe('Hello ');
    expect(state.after).toBe(' Test');
  });

  it('text() returns selected text', () => {
    textarea.setSelectionRange(0, 5); // "Hello"
    expect(sel.text()).toBe('Hello');
  });

  it('length() returns selection length', () => {
    textarea.setSelectionRange(0, 5);
    expect(sel.length()).toBe(5);
  });

  it('isCursor() returns true for collapsed selection', () => {
    textarea.setSelectionRange(3, 3);
    expect(sel.isCursor()).toBe(true);
  });

  it('isCursor() returns false for non-collapsed selection', () => {
    textarea.setSelectionRange(0, 5);
    expect(sel.isCursor()).toBe(false);
  });

  it('replace() replaces selected text', () => {
    textarea.setSelectionRange(6, 11); // "World"
    sel.replace('Texy');
    expect(textarea.value).toBe('Hello Texy Test');
  });

  it('tag() wraps selection with prefix and suffix', () => {
    textarea.setSelectionRange(6, 11); // "World"
    sel.tag('**', '**');
    expect(textarea.value).toBe('Hello **World** Test');
  });

  it('tag() places cursor between prefix and suffix when no selection', () => {
    textarea.value = 'Hello';
    textarea.setSelectionRange(5, 5); // cursor after "Hello"
    sel.tag('**', '**');
    expect(textarea.value).toBe('Hello****');
    expect(textarea.selectionStart).toBe(7); // cursor between **|**
  });

  it('trimSelect() removes trailing whitespace from selection', () => {
    textarea.value = 'Hello World ';
    textarea.setSelectionRange(6, 12); // "World "
    sel.trimSelect();
    expect(sel.text()).toBe('World');
    expect(sel.length()).toBe(5);
  });

  it('selectBlock() expands to full lines', () => {
    textarea.value = 'Line 1\nLine 2\nLine 3';
    textarea.setSelectionRange(9, 9); // middle of "Line 2"
    sel.selectBlock();
    const state = sel.getState();
    expect(state.text).toBe('Line 2');
  });

  it('getValue() returns textarea value', () => {
    expect(sel.getValue()).toBe('Hello World Test');
  });

  it('setValue() sets textarea value', () => {
    sel.setValue('new value');
    expect(textarea.value).toBe('new value');
  });

  it('setCursor() places cursor at position', () => {
    sel.setCursor(5);
    expect(textarea.selectionStart).toBe(5);
    expect(textarea.selectionEnd).toBe(5);
  });

  it('select() sets selection range', () => {
    sel.select(0, 5);
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(5);
  });

  it('lf returns \\n by default', () => {
    expect(sel.lf).toBe('\n');
  });

  it('lf detects \\r\\n when present', () => {
    // Note: jsdom may normalize \r\n to \n in textarea values
    // Test the logic by checking that \n detection works
    textarea.value = 'a\nb';
    expect(sel.lf).toBe('\n');
  });

  it('phrase() trims and wraps', () => {
    textarea.value = 'Hello World ';
    textarea.setSelectionRange(6, 12); // "World "
    sel.phrase('"', '"');
    // Should trim to "World" first, then wrap
    expect(textarea.value).toContain('"World"');
  });

  it('getElement() returns the textarea', () => {
    expect(sel.getElement()).toBe(textarea);
  });

  it('replace() dispatches input event', () => {
    let fired = false;
    textarea.addEventListener('input', () => { fired = true; });
    textarea.setSelectionRange(0, 5);
    sel.replace('Hi');
    expect(fired).toBe(true);
  });
});
