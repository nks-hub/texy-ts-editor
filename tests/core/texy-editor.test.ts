// Polyfill for jsdom (no native dialog support)
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= function() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close ??= function() { this.removeAttribute('open'); };
} else {
  Object.defineProperty(window, 'HTMLDialogElement', {
    value: class HTMLDialogElement extends HTMLElement {
      showModal() { this.setAttribute('open', ''); }
      close() { this.removeAttribute('open'); }
    },
  });
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TexyEditor } from '../../src/core/TexyEditor';
import { TexyMode } from '../../src/modes/TexyMode';
import { MarkdownMode } from '../../src/modes/MarkdownMode';
import type { SyntaxMode } from '../../src/modes/SyntaxMode';
import type { TexyEditorOptions, TexyPlugin } from '../../src/types';

// ── Helpers ──────────────────────────────────────────────────────

function makeTextarea(value = ''): HTMLTextAreaElement {
  const ta = document.createElement('textarea');
  ta.value = value;
  document.body.appendChild(ta);
  return ta;
}

function makeEditor(
  ta: HTMLTextAreaElement,
  options: TexyEditorOptions = {},
): TexyEditor {
  return new TexyEditor(ta, { language: 'en', autoResize: false, ...options });
}

// ── Construction ─────────────────────────────────────────────────

describe('TexyEditor — construction', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates editor from a textarea element', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    expect(editor).toBeInstanceOf(TexyEditor);
    editor.destroy();
  });

  it('creates editor from a CSS selector string', () => {
    const ta = makeTextarea();
    ta.id = 'my-editor-ta';
    const editor = new TexyEditor('#my-editor-ta', { language: 'en', autoResize: false });
    expect(editor).toBeInstanceOf(TexyEditor);
    editor.destroy();
  });

  it('throws on a non-existent CSS selector', () => {
    expect(() => new TexyEditor('#does-not-exist')).toThrow(
      'TexyEditor: textarea "#does-not-exist" not found',
    );
  });

  it('throws on double-initialization of the same textarea', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    expect(() => makeEditor(ta)).toThrow(
      'TexyEditor: this textarea is already initialized',
    );
    editor.destroy();
  });

  it('wraps textarea in a .te-editor container', () => {
    const ta = makeTextarea();
    makeEditor(ta);
    const container = document.querySelector('.te-editor');
    expect(container).not.toBeNull();
    expect(container?.contains(ta)).toBe(true);
    (container as any)?.__editor?.destroy?.();
  });

  it('creates a .te-toolbar inside the container', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    const toolbar = editor.getContainer().querySelector('.te-toolbar');
    expect(toolbar).not.toBeNull();
    editor.destroy();
  });

  it('creates a .te-edit-area inside the container', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    const editArea = editor.getContainer().querySelector('.te-edit-area');
    expect(editArea).not.toBeNull();
    editor.destroy();
  });

  it('marks textarea with data-texy-editor attribute', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    expect(ta.dataset.texyEditor).toBe('true');
    editor.destroy();
  });

  it('adds te-textarea class to textarea', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    expect(ta.classList.contains('te-textarea')).toBe(true);
    editor.destroy();
  });
});

// ── Public API ───────────────────────────────────────────────────

describe('TexyEditor — public API', () => {
  let ta: HTMLTextAreaElement;
  let editor: TexyEditor;

  beforeEach(() => {
    document.body.innerHTML = '';
    ta = makeTextarea('initial value');
    editor = makeEditor(ta);
  });

  afterEach(() => {
    editor.destroy();
  });

  it('getValue() returns the current textarea value', () => {
    expect(editor.getValue()).toBe('initial value');
  });

  it('setValue() updates the textarea value', () => {
    editor.setValue('new value');
    expect(editor.getValue()).toBe('new value');
  });

  it('setValue() emits a change event with the new value', () => {
    const handler = vi.fn();
    editor.on('change', handler);
    editor.setValue('changed');
    expect(handler).toHaveBeenCalledWith({ value: 'changed' });
  });

  it('getSelection() returns the selected text', () => {
    ta.value = 'hello world';
    ta.setSelectionRange(6, 11);
    expect(editor.getSelection()).toBe('world');
  });

  it('replaceSelection() replaces the selected text', () => {
    ta.value = 'hello world';
    ta.setSelectionRange(6, 11);
    editor.replaceSelection('earth');
    expect(editor.getValue()).toBe('hello earth');
  });

  it('setView("edit") switches to edit mode', () => {
    editor.setView('edit');
    expect(editor.getView()).toBe('edit');
  });

  it('setView("preview") switches to preview mode', () => {
    editor.setView('preview');
    expect(editor.getView()).toBe('preview');
  });

  it('setView("split") switches to split mode', () => {
    editor.setView('split');
    expect(editor.getView()).toBe('split');
  });

  it('getView() returns the current view mode', () => {
    editor.setView('split');
    expect(editor.getView()).toBe('split');
    editor.setView('edit');
    expect(editor.getView()).toBe('edit');
  });

  it('getMode() returns the active SyntaxMode instance', () => {
    const mode = editor.getMode();
    expect(mode).toBeDefined();
    expect(typeof mode.name).toBe('string');
  });

  it('getTextarea() returns the original textarea element', () => {
    expect(editor.getTextarea()).toBe(ta);
  });

  it('getContainer() returns the .te-editor container element', () => {
    const container = editor.getContainer();
    expect(container.classList.contains('te-editor')).toBe(true);
  });

  it('getStrings() returns i18n strings object with expected keys', () => {
    const strings = editor.getStrings();
    expect(typeof strings.bold).toBe('string');
    expect(typeof strings.italic).toBe('string');
    expect(typeof strings.ok).toBe('string');
    expect(typeof strings.cancel).toBe('string');
  });

  it('wrapSelection() wraps selected text with prefix and suffix', () => {
    ta.value = 'hello';
    ta.setSelectionRange(0, 5);
    editor.wrapSelection('**', '**');
    expect(editor.getValue()).toBe('**hello**');
  });

  it('focus() does not throw', () => {
    expect(() => editor.focus()).not.toThrow();
  });

  it('execAction() with an unknown action does not throw', () => {
    expect(() => editor.execAction('nonexistent-action')).not.toThrow();
  });

  it('toggleFullscreen() adds te-fullscreen class to container', () => {
    editor.toggleFullscreen();
    expect(editor.getContainer().classList.contains('te-fullscreen')).toBe(true);
    editor.toggleFullscreen(); // reset
  });
});

// ── Events ───────────────────────────────────────────────────────

describe('TexyEditor — events', () => {
  let ta: HTMLTextAreaElement;
  let editor: TexyEditor;

  beforeEach(() => {
    document.body.innerHTML = '';
    ta = makeTextarea('');
    editor = makeEditor(ta);
  });

  afterEach(() => {
    editor.destroy();
  });

  it('on("change") fires when setValue() is called', () => {
    const handler = vi.fn();
    editor.on('change', handler);
    editor.setValue('abc');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 'abc' });
  });

  it('on("view:change") fires when setView() is called', () => {
    const handler = vi.fn();
    editor.on('view:change', handler);
    editor.setView('preview');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ mode: 'preview' });
  });

  it('on("view:change") fires for each setView() call', () => {
    const handler = vi.fn();
    editor.on('view:change', handler);
    editor.setView('preview');
    editor.setView('split');
    editor.setView('edit');
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('off() removes the event handler so it no longer fires', () => {
    const handler = vi.fn();
    editor.on('change', handler);
    editor.setValue('first');
    expect(handler).toHaveBeenCalledTimes(1);

    editor.off('change', handler);
    editor.setValue('second');
    expect(handler).toHaveBeenCalledTimes(1); // still 1, not called again
  });

  it('on("destroy") fires when destroy() is called', () => {
    const handler = vi.fn();
    editor.on('destroy', handler);
    editor.destroy();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('on("fullscreen:toggle") fires when toggleFullscreen() is called', () => {
    const handler = vi.fn();
    editor.on('fullscreen:toggle', handler);
    editor.toggleFullscreen();
    expect(handler).toHaveBeenCalledWith({ active: true });
    editor.toggleFullscreen();
    expect(handler).toHaveBeenCalledWith({ active: false });
  });
});

// ── Undo / Redo ──────────────────────────────────────────────────

describe('TexyEditor — undo/redo', () => {
  let ta: HTMLTextAreaElement;
  let editor: TexyEditor;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    ta = makeTextarea('');
    editor = makeEditor(ta);
  });

  afterEach(() => {
    editor.destroy();
    vi.useRealTimers();
  });

  it('undo() restores previous value after setValue + timer advance', () => {
    editor.setValue('first');
    vi.advanceTimersByTime(400); // flush 300ms undo debounce

    editor.setValue('second');
    vi.advanceTimersByTime(400);

    editor.undo();
    expect(editor.getValue()).toBe('first');
  });

  it('redo() restores undone value', () => {
    editor.setValue('first');
    vi.advanceTimersByTime(400);

    editor.setValue('second');
    vi.advanceTimersByTime(400);

    editor.undo();
    expect(editor.getValue()).toBe('first');

    editor.redo();
    expect(editor.getValue()).toBe('second');
  });

  it('multiple undo steps work', () => {
    editor.setValue('step1');
    vi.advanceTimersByTime(400);

    editor.setValue('step2');
    vi.advanceTimersByTime(400);

    editor.setValue('step3');
    vi.advanceTimersByTime(400);

    editor.undo();
    expect(editor.getValue()).toBe('step2');

    editor.undo();
    expect(editor.getValue()).toBe('step1');
  });

  it('undo() at the beginning does not throw or corrupt value', () => {
    editor.setValue('only');
    vi.advanceTimersByTime(400);

    // undo back to initial empty state
    editor.undo();
    expect(() => editor.undo()).not.toThrow();
  });

  it('undo() emits the "undo" event', () => {
    const handler = vi.fn();
    editor.on('undo', handler);

    editor.setValue('something');
    vi.advanceTimersByTime(400);

    editor.undo();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('redo() emits the "redo" event', () => {
    const handler = vi.fn();
    editor.on('redo', handler);

    editor.setValue('something');
    vi.advanceTimersByTime(400);

    editor.undo();
    editor.redo();
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ── Destroy ──────────────────────────────────────────────────────

describe('TexyEditor — destroy', () => {
  let ta: HTMLTextAreaElement;
  let parent: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    parent = document.createElement('div');
    document.body.appendChild(parent);
    ta = document.createElement('textarea');
    parent.appendChild(ta);
  });

  it('destroy() restores textarea to original parent', () => {
    const editor = makeEditor(ta);
    editor.destroy();
    expect(parent.contains(ta)).toBe(true);
  });

  it('destroy() removes the .te-editor container from DOM', () => {
    const editor = makeEditor(ta);
    const container = editor.getContainer();
    editor.destroy();
    expect(document.body.contains(container)).toBe(false);
    expect(parent.contains(container)).toBe(false);
  });

  it('destroy() is idempotent — second call does not throw', () => {
    const editor = makeEditor(ta);
    editor.destroy();
    expect(() => editor.destroy()).not.toThrow();
  });

  it('after destroy(), textarea.dataset.texyEditor is removed', () => {
    const editor = makeEditor(ta);
    expect(ta.dataset.texyEditor).toBe('true');
    editor.destroy();
    expect(ta.dataset.texyEditor).toBeUndefined();
  });

  it('after destroy(), the textarea can be re-initialized', () => {
    const editor = makeEditor(ta);
    editor.destroy();
    const editor2 = makeEditor(ta);
    expect(editor2).toBeInstanceOf(TexyEditor);
    editor2.destroy();
  });
});

// ── Options ──────────────────────────────────────────────────────

describe('TexyEditor — options', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('syntaxMode: "texy" (default) creates a TexyMode instance', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { syntaxMode: 'texy' });
    expect(editor.getMode()).toBeInstanceOf(TexyMode);
    editor.destroy();
  });

  it('syntaxMode defaults to TexyMode when not specified', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta);
    expect(editor.getMode()).toBeInstanceOf(TexyMode);
    editor.destroy();
  });

  it('syntaxMode: "markdown" creates a MarkdownMode instance', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { syntaxMode: 'markdown' });
    expect(editor.getMode()).toBeInstanceOf(MarkdownMode);
    editor.destroy();
  });

  it('syntaxMode: "markdown" sets mode name to "markdown"', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { syntaxMode: 'markdown' });
    expect(editor.getMode().name).toBe('markdown');
    editor.destroy();
  });

  it('custom SyntaxMode instance can be passed as syntaxMode', () => {
    class CustomMode extends TexyMode {
      override readonly name = 'custom' as const;
    }
    const customMode: SyntaxMode = new CustomMode();
    const ta = makeTextarea();
    const editor = makeEditor(ta, { syntaxMode: customMode });
    expect(editor.getMode()).toBe(customMode);
    expect(editor.getMode().name).toBe('custom');
    editor.destroy();
  });

  it('language option selects correct i18n strings', () => {
    const ta = makeTextarea();
    const editor = new TexyEditor(ta, { language: 'en', autoResize: false });
    expect(editor.getStrings().bold).toBe('Bold');
    editor.destroy();
  });

  it('defaultView option sets initial view mode', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { defaultView: 'preview' });
    expect(editor.getView()).toBe('preview');
    editor.destroy();
  });

  it('theme option adds te-theme-* class to container', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { theme: 'dark' });
    expect(editor.getContainer().classList.contains('te-theme-dark')).toBe(true);
    editor.destroy();
  });

  it('width option sets inline style on container', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { width: '800px' });
    expect(editor.getContainer().style.width).toBe('800px');
    editor.destroy();
  });

  it('ariaLabel option sets aria-label attribute on container', () => {
    const ta = makeTextarea();
    const editor = makeEditor(ta, { ariaLabel: 'My editor' });
    expect(editor.getContainer().getAttribute('aria-label')).toBe('My editor');
    editor.destroy();
  });

  it('plugins option calls plugin.init() with the editor', () => {
    const initFn = vi.fn();
    const plugin: TexyPlugin = { name: 'test-plugin', init: initFn };
    const ta = makeTextarea();
    const editor = makeEditor(ta, { plugins: [plugin] });
    expect(initFn).toHaveBeenCalledOnce();
    expect(initFn).toHaveBeenCalledWith(editor);
    editor.destroy();
  });

  it('plugins option calls plugin.destroy() on editor destroy', () => {
    const destroyFn = vi.fn();
    const plugin: TexyPlugin = {
      name: 'test-plugin',
      init: vi.fn(),
      destroy: destroyFn,
    };
    const ta = makeTextarea();
    const editor = makeEditor(ta, { plugins: [plugin] });
    editor.destroy();
    expect(destroyFn).toHaveBeenCalledOnce();
  });
});

// ── View Switching DOM effects ────────────────────────────────────

describe('TexyEditor — view DOM effects', () => {
  let ta: HTMLTextAreaElement;
  let editor: TexyEditor;

  beforeEach(() => {
    document.body.innerHTML = '';
    ta = makeTextarea('hello');
    editor = makeEditor(ta);
  });

  afterEach(() => {
    editor.destroy();
  });

  it('setView("edit") shows edit area and hides preview area', () => {
    editor.setView('edit');
    const container = editor.getContainer();
    const editArea = container.querySelector<HTMLElement>('.te-edit-area')!;
    const previewArea = container.querySelector<HTMLElement>('.te-preview-area')!;
    expect(editArea.style.display).not.toBe('none');
    expect(previewArea.style.display).toBe('none');
  });

  it('setView("preview") hides edit area and shows preview area', () => {
    editor.setView('preview');
    const container = editor.getContainer();
    const editArea = container.querySelector<HTMLElement>('.te-edit-area')!;
    const previewArea = container.querySelector<HTMLElement>('.te-preview-area')!;
    expect(editArea.style.display).toBe('none');
    expect(previewArea.style.display).not.toBe('none');
  });

  it('setView("split") shows both edit and preview areas', () => {
    editor.setView('split');
    const container = editor.getContainer();
    const editArea = container.querySelector<HTMLElement>('.te-edit-area')!;
    const previewArea = container.querySelector<HTMLElement>('.te-preview-area')!;
    expect(editArea.style.display).not.toBe('none');
    expect(previewArea.style.display).not.toBe('none');
  });

  it('setView("edit") adds te-view-edit class to container', () => {
    editor.setView('edit');
    expect(editor.getContainer().classList.contains('te-view-edit')).toBe(true);
  });

  it('setView("preview") adds te-view-preview class to container', () => {
    editor.setView('preview');
    expect(editor.getContainer().classList.contains('te-view-preview')).toBe(true);
  });

  it('setView("split") adds te-view-split class to container', () => {
    editor.setView('split');
    expect(editor.getContainer().classList.contains('te-view-split')).toBe(true);
  });
});
