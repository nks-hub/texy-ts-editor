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
import { DialogHandlers } from '../../src/core/DialogHandlers';
import { TexyFormatter } from '../../src/core/TexyFormatter';
import { Selection } from '../../src/core/Selection';
import { DialogManager } from '../../src/core/DialogManager';
import { TexyMode } from '../../src/modes/TexyMode';
import { MarkdownMode } from '../../src/modes/MarkdownMode';
import { EventBus } from '../../src/core/EventBus';
import { en } from '../../src/i18n/en';
import type { TexyEditorOptions } from '../../src/types';

// ── Helpers ──────────────────────────────────────────────────────

function makeTextarea(value = ''): HTMLTextAreaElement {
  const ta = document.createElement('textarea');
  ta.value = value;
  document.body.appendChild(ta);
  return ta;
}

/** Creates a real HTMLInputElement and appends it to the container. */
function realCreateFormField(
  container: HTMLElement,
  _label: string,
  type: string,
  defaultValue: string,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.value = defaultValue;
  container.appendChild(input);
  return input;
}

interface MakeDepsOptions {
  syntaxMode?: 'texy' | 'markdown';
  options?: Partial<TexyEditorOptions>;
}

function makeDeps(opts: MakeDepsOptions = {}) {
  const ta = makeTextarea('selected text');
  ta.setSelectionRange(0, 13); // select "selected text"

  const mode = opts.syntaxMode === 'markdown' ? new MarkdownMode() : new TexyMode();
  const selection = new Selection(ta);
  const formatter = new TexyFormatter(selection, mode);
  const events = new EventBus();

  // Container needs a theme class so DialogManager can copy it
  const container = document.createElement('div');
  container.className = 'te-editor te-theme-light';
  container.setAttribute('data-te-theme', 'light');
  document.body.appendChild(container);

  const dialogManager = new DialogManager(container, en);

  const validateRequired = vi.fn().mockReturnValue(true);
  const focus = vi.fn();

  const options: TexyEditorOptions = {
    language: 'en',
    autoResize: false,
    ...opts.options,
  };

  const handlers = new DialogHandlers({
    formatter,
    selection,
    dialogManager,
    mode,
    strings: en,
    createFormField: realCreateFormField,
    validateRequired,
    focus,
    options,
    events,
  });

  return { handlers, dialogManager, formatter, selection, events, validateRequired, focus, ta, container };
}

// ── handleLink ───────────────────────────────────────────────────

describe('DialogHandlers — handleLink', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the link dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleLink();
    expect(dialogManager.isOpen('link')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleLink();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.link);
  });

  it('submit with a URL calls formatter.link()', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'link');
    handlers.handleLink();

    // Fill in the URL input and clear the text input so text is empty → undefined
    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = 'https://example.com';
    inputs[1].value = ''; // clear pre-filled selection text

    // Click the submit button
    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.link).toHaveBeenCalledWith('https://example.com', undefined);
  });

  it('submit calls focus() after inserting link', () => {
    const { handlers, focus, validateRequired } = makeDeps();
    validateRequired.mockReturnValue(true);
    handlers.handleLink();

    const urlInput = document.querySelector<HTMLInputElement>('dialog input[type="url"]')!;
    urlInput.value = 'https://example.com';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(focus).toHaveBeenCalled();
  });

  it('submit does not call formatter.link() when validateRequired returns false', () => {
    const { handlers, formatter, validateRequired } = makeDeps();
    validateRequired.mockReturnValue(false);
    vi.spyOn(formatter, 'link');
    handlers.handleLink();

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.link).not.toHaveBeenCalled();
  });

  it('submit passes text input value as second argument to formatter.link()', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'link');
    handlers.handleLink();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = 'https://example.com';
    inputs[1].value = 'My Link';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.link).toHaveBeenCalledWith('https://example.com', 'My Link');
  });

  it('submit with empty text passes undefined as text to formatter.link()', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'link');
    handlers.handleLink();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = 'https://example.com';
    inputs[1].value = '';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.link).toHaveBeenCalledWith('https://example.com', undefined);
  });
});

// ── handleImage ──────────────────────────────────────────────────

describe('DialogHandlers — handleImage (TexyMode — extended)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the image dialog', () => {
    const { handlers, dialogManager } = makeDeps({ syntaxMode: 'texy' });
    handlers.handleImage();
    expect(dialogManager.isOpen('image')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps({ syntaxMode: 'texy' });
    handlers.handleImage();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.image);
  });

  it('submit calls formatter.image()', () => {
    const { handlers, formatter } = makeDeps({ syntaxMode: 'texy' });
    vi.spyOn(formatter, 'image');
    handlers.handleImage();

    const urlInput = document.querySelector<HTMLInputElement>('dialog input[type="url"]')!;
    urlInput.value = 'https://example.com/img.jpg';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.image).toHaveBeenCalled();
  });

  it('submit calls focus() after inserting image', () => {
    const { handlers, focus } = makeDeps({ syntaxMode: 'texy' });
    handlers.handleImage();

    const urlInput = document.querySelector<HTMLInputElement>('dialog input[type="url"]')!;
    urlInput.value = 'https://example.com/img.jpg';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(focus).toHaveBeenCalled();
  });
});

describe('DialogHandlers — handleImage (MarkdownMode — simple)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the image dialog in simple mode', () => {
    const { handlers, dialogManager } = makeDeps({ syntaxMode: 'markdown' });
    handlers.handleImage();
    expect(dialogManager.isOpen('image')).toBe(true);
  });

  it('simple image dialog has fewer inputs than extended', () => {
    const { handlers } = makeDeps({ syntaxMode: 'markdown' });
    handlers.handleImage();
    // Simple mode: only url + alt (2 inputs). Extended has url + alt + width + height + link + caption (6).
    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    expect(inputs.length).toBe(2);
  });

  it('submit calls formatter.image() with url and alt', () => {
    const { handlers, formatter } = makeDeps({ syntaxMode: 'markdown' });
    vi.spyOn(formatter, 'image');
    handlers.handleImage();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = 'https://example.com/img.png';
    inputs[1].value = 'A description';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.image).toHaveBeenCalledWith('https://example.com/img.png', 'A description');
  });
});

// ── handleTable ──────────────────────────────────────────────────

describe('DialogHandlers — handleTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the table dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleTable();
    expect(dialogManager.isOpen('table')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleTable();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.table);
  });

  it('submit calls formatter.table() with parsed cols and rows', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'table');
    handlers.handleTable();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    // inputs[0] = cols, inputs[1] = rows (defaults are '3', '3')
    inputs[0].value = '4';
    inputs[1].value = '5';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.table).toHaveBeenCalledWith(4, 5, 'top');
  });

  it('submit with empty inputs falls back to default 3x3', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'table');
    handlers.handleTable();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = '';
    inputs[1].value = '';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.table).toHaveBeenCalledWith(3, 3, 'top');
  });

  it('submit calls focus()', () => {
    const { handlers, focus } = makeDeps();
    handlers.handleTable();

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(focus).toHaveBeenCalled();
  });
});

// ── handleColor ──────────────────────────────────────────────────

describe('DialogHandlers — handleColor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the color dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleColor();
    expect(dialogManager.isOpen('color')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleColor();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.color);
  });

  it('renders color swatches inside the dialog', () => {
    const { handlers } = makeDeps();
    handlers.handleColor();
    const swatches = document.querySelectorAll('.te-color-swatch');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('clicking a swatch calls formatter.colorModifier() with the color', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'colorModifier');
    handlers.handleColor();

    const firstSwatch = document.querySelector<HTMLButtonElement>('.te-color-swatch')!;
    const color = firstSwatch.getAttribute('data-color')!;
    firstSwatch.click();

    expect(formatter.colorModifier).toHaveBeenCalledWith(color);
  });

  it('clicking a swatch closes the color dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleColor();
    expect(dialogManager.isOpen('color')).toBe(true);

    const firstSwatch = document.querySelector<HTMLButtonElement>('.te-color-swatch')!;
    firstSwatch.click();

    expect(dialogManager.isOpen('color')).toBe(false);
  });

  it('clicking a swatch calls focus()', () => {
    const { handlers, focus } = makeDeps();
    handlers.handleColor();

    const firstSwatch = document.querySelector<HTMLButtonElement>('.te-color-swatch')!;
    firstSwatch.click();

    expect(focus).toHaveBeenCalled();
  });
});

// ── handleSymbol ─────────────────────────────────────────────────

describe('DialogHandlers — handleSymbol', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the symbol dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleSymbol();
    expect(dialogManager.isOpen('symbol')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleSymbol();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.symbol);
  });

  it('renders symbol buttons inside the dialog', () => {
    const { handlers } = makeDeps();
    handlers.handleSymbol();
    const btns = document.querySelectorAll('.te-symbol-btn');
    expect(btns.length).toBeGreaterThan(0);
  });

  it('clicking a symbol calls formatter.insertSymbol() with the symbol', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'insertSymbol');
    handlers.handleSymbol();

    const firstBtn = document.querySelector<HTMLButtonElement>('.te-symbol-btn')!;
    const symbol = firstBtn.textContent!;
    firstBtn.click();

    expect(formatter.insertSymbol).toHaveBeenCalledWith(symbol);
  });

  it('clicking a symbol closes the symbol dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleSymbol();

    const firstBtn = document.querySelector<HTMLButtonElement>('.te-symbol-btn')!;
    firstBtn.click();

    expect(dialogManager.isOpen('symbol')).toBe(false);
  });

  it('clicking a symbol calls focus()', () => {
    const { handlers, focus } = makeDeps();
    handlers.handleSymbol();

    const firstBtn = document.querySelector<HTMLButtonElement>('.te-symbol-btn')!;
    firstBtn.click();

    expect(focus).toHaveBeenCalled();
  });
});

// ── handleFootnote ───────────────────────────────────────────────

describe('DialogHandlers — handleFootnote', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the footnote dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleFootnote();
    expect(dialogManager.isOpen('footnote')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleFootnote();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.footnote);
  });

  it('submit calls formatter.footnote() with id and text', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'footnote');
    handlers.handleFootnote();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = '2';
    inputs[1].value = 'This is a footnote';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.footnote).toHaveBeenCalledWith('2', 'This is a footnote');
  });

  it('submit calls focus()', () => {
    const { handlers, focus } = makeDeps();
    handlers.handleFootnote();

    const inputs = document.querySelectorAll<HTMLInputElement>('dialog input');
    inputs[0].value = '1';
    inputs[1].value = 'Note text';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(focus).toHaveBeenCalled();
  });

  it('submit does not call formatter.footnote() when validateRequired returns false', () => {
    const { handlers, formatter, validateRequired } = makeDeps();
    validateRequired.mockReturnValue(false);
    vi.spyOn(formatter, 'footnote');
    handlers.handleFootnote();

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.footnote).not.toHaveBeenCalled();
  });
});

// ── handleAcronym ────────────────────────────────────────────────

describe('DialogHandlers — handleAcronym', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the acronym dialog', () => {
    const { handlers, dialogManager } = makeDeps();
    handlers.handleAcronym();
    expect(dialogManager.isOpen('acronym')).toBe(true);
  });

  it('dialog has the correct title', () => {
    const { handlers } = makeDeps();
    handlers.handleAcronym();
    const title = document.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe(en.acronym);
  });

  it('submit calls formatter.acronym() with the title value', () => {
    const { handlers, formatter } = makeDeps();
    vi.spyOn(formatter, 'acronym');
    handlers.handleAcronym();

    const titleInput = document.querySelector<HTMLInputElement>('dialog input')!;
    titleInput.value = 'HyperText Markup Language';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.acronym).toHaveBeenCalledWith('HyperText Markup Language');
  });

  it('submit calls focus()', () => {
    const { handlers, focus } = makeDeps();
    handlers.handleAcronym();

    const titleInput = document.querySelector<HTMLInputElement>('dialog input')!;
    titleInput.value = 'World Wide Web';

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(focus).toHaveBeenCalled();
  });

  it('submit does not call formatter.acronym() when validateRequired returns false', () => {
    const { handlers, formatter, validateRequired } = makeDeps();
    validateRequired.mockReturnValue(false);
    vi.spyOn(formatter, 'acronym');
    handlers.handleAcronym();

    const submitBtn = document.querySelector<HTMLButtonElement>('.te-dialog-submit')!;
    submitBtn.click();

    expect(formatter.acronym).not.toHaveBeenCalled();
  });
});

// ── handleUpload ─────────────────────────────────────────────────

describe('DialogHandlers — handleUpload', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does nothing when no uploadHandler is configured', () => {
    const { handlers } = makeDeps({ options: {} });
    // Should not throw and no file input should be appended
    expect(() => handlers.handleUpload()).not.toThrow();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('creates a hidden file input when uploadHandler is set', () => {
    const uploadFn = vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/file.jpg' });
    const { handlers } = makeDeps({
      options: { uploadHandler: { upload: uploadFn } },
    });

    // Prevent actual click on the file input
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    handlers.handleUpload();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    expect(fileInput!.style.display).toBe('none');
    clickSpy.mockRestore();
  });

  it('applies accept attribute when uploadHandler.accept is set', () => {
    const uploadFn = vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/img.png' });
    const { handlers } = makeDeps({
      options: { uploadHandler: { upload: uploadFn, accept: 'image/*' } },
    });

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    handlers.handleUpload();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(fileInput.accept).toBe('image/*');
    clickSpy.mockRestore();
  });

  it('emits upload:error when file exceeds maxSize', async () => {
    const uploadFn = vi.fn();
    const { handlers, events } = makeDeps({
      options: {
        uploadHandler: {
          upload: uploadFn,
          maxSize: 100, // 100 bytes max
        },
      },
    });

    const errorHandler = vi.fn();
    events.on('upload:error', errorHandler);

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    handlers.handleUpload();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;

    // Simulate a large file selection
    const largeFile = new File(['x'.repeat(200)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: { 0: largeFile, length: 1, item: () => largeFile },
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change'));

    // Wait for the async handler
    await new Promise((r) => setTimeout(r, 0));

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(uploadFn).not.toHaveBeenCalled();

    clickSpy.mockRestore();
  });

  it('emits upload:start and upload:complete on successful upload', async () => {
    const uploadFn = vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/file.txt' });
    const { handlers, events } = makeDeps({
      options: { uploadHandler: { upload: uploadFn } },
    });

    const startHandler = vi.fn();
    const completeHandler = vi.fn();
    events.on('upload:start', startHandler);
    events.on('upload:complete', completeHandler);

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    handlers.handleUpload();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: { 0: file, length: 1, item: () => file },
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change'));

    await new Promise((r) => setTimeout(r, 0));

    expect(startHandler).toHaveBeenCalledWith({ file });
    expect(completeHandler).toHaveBeenCalledWith({ url: 'https://cdn.example.com/file.txt', file });

    clickSpy.mockRestore();
  });

  it('emits upload:error when upload() rejects', async () => {
    const uploadFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const { handlers, events } = makeDeps({
      options: { uploadHandler: { upload: uploadFn } },
    });

    const errorHandler = vi.fn();
    events.on('upload:error', errorHandler);

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    handlers.handleUpload();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['data'], 'fail.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: { 0: file, length: 1, item: () => file },
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change'));

    await new Promise((r) => setTimeout(r, 0));

    expect(errorHandler).toHaveBeenCalledOnce();
    const payload = errorHandler.mock.calls[0][0] as { message: string };
    expect(payload.message).toBe('Network error');

    clickSpy.mockRestore();
  });
});
