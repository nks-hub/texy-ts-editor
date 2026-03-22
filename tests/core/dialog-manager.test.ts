import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DialogManager } from '../../src/core/DialogManager';
import type { TexyEditorStrings } from '../../src/types';
import { en } from '../../src/i18n/en';

// jsdom does not implement HTMLDialogElement.showModal() or .close().
// Polyfill them on the prototype once so every dialog element created in
// subsequent tests already has working stubs.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
}
if (typeof HTMLDialogElement.prototype.close !== 'function' ||
    HTMLDialogElement.prototype.close.length === 0) {
  // jsdom may have a no-op close; replace with one that removes the attribute
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
}

const strings: TexyEditorStrings = en;

function makeContainer(): HTMLElement {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

function makeContent(text = 'dialog body'): HTMLElement {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

describe('DialogManager', () => {
  let container: HTMLElement;
  let manager: DialogManager;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = makeContainer();
    manager = new DialogManager(container, strings);
  });

  // 1. Construction
  it('creates instance without error', () => {
    expect(manager).toBeInstanceOf(DialogManager);
  });

  // 2. open() — creates dialog element in document.body
  it('open() appends a dialog element to document.body', () => {
    manager.open('test', {
      title: 'My Dialog',
      content: makeContent(),
      onSubmit: () => {},
    });
    const dialogs = document.body.querySelectorAll('dialog.te-dialog');
    expect(dialogs.length).toBe(1);
  });

  // 3. open() — dialog has correct title
  it('open() sets the dialog title', () => {
    manager.open('test', {
      title: 'My Title',
      content: makeContent(),
      onSubmit: () => {},
    });
    const title = document.body.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe('My Title');
  });

  // 4. open() — dialog contains the provided content element
  it('open() places content element inside the dialog body', () => {
    const content = makeContent('hello content');
    manager.open('test', {
      title: 'T',
      content,
      onSubmit: () => {},
    });
    const body = document.body.querySelector('.te-dialog-body');
    expect(body?.contains(content)).toBe(true);
  });

  // 5. open() — dialog has submit and cancel buttons with i18n strings
  it('open() renders submit button with ok string', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
    });
    const submit = document.body.querySelector<HTMLButtonElement>('.te-dialog-submit');
    expect(submit?.textContent).toBe(strings.ok);
  });

  it('open() renders cancel button with cancel string', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
    });
    const cancel = document.body.querySelector<HTMLButtonElement>('.te-dialog-cancel');
    expect(cancel?.textContent).toBe(strings.cancel);
  });

  // 6. isOpen() — returns true for open dialog, false for closed
  it('isOpen() returns true after open()', () => {
    manager.open('myDialog', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
    });
    expect(manager.isOpen('myDialog')).toBe(true);
  });

  it('isOpen() returns false for unknown dialog name', () => {
    expect(manager.isOpen('nonexistent')).toBe(false);
  });

  // 7. close() — removes dialog from DOM
  it('close() removes the dialog element from document.body', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
    });
    manager.close('test');
    const dialogs = document.body.querySelectorAll('dialog.te-dialog');
    expect(dialogs.length).toBe(0);
  });

  // 8. close() — isOpen returns false after close
  it('close() makes isOpen() return false', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
    });
    manager.close('test');
    expect(manager.isOpen('test')).toBe(false);
  });

  // 9. closeAll() — closes all open dialogs
  it('closeAll() removes all open dialogs', () => {
    manager.open('d1', { title: 'D1', content: makeContent(), onSubmit: () => {} });
    manager.open('d2', { title: 'D2', content: makeContent(), onSubmit: () => {} });
    manager.open('d3', { title: 'D3', content: makeContent(), onSubmit: () => {} });
    manager.closeAll();
    expect(manager.isOpen('d1')).toBe(false);
    expect(manager.isOpen('d2')).toBe(false);
    expect(manager.isOpen('d3')).toBe(false);
    expect(document.body.querySelectorAll('dialog.te-dialog').length).toBe(0);
  });

  // 10. open() twice with same name — closes first, opens second
  it('open() with the same name replaces the existing dialog', () => {
    manager.open('dup', { title: 'First', content: makeContent('first'), onSubmit: () => {} });
    manager.open('dup', { title: 'Second', content: makeContent('second'), onSubmit: () => {} });

    const dialogs = document.body.querySelectorAll('dialog.te-dialog');
    expect(dialogs.length).toBe(1);

    const title = document.body.querySelector('.te-dialog-title');
    expect(title?.textContent).toBe('Second');
  });

  // 11. open() multiple dialogs with different names
  it('open() keeps multiple dialogs with different names open simultaneously', () => {
    manager.open('a', { title: 'A', content: makeContent(), onSubmit: () => {} });
    manager.open('b', { title: 'B', content: makeContent(), onSubmit: () => {} });

    expect(manager.isOpen('a')).toBe(true);
    expect(manager.isOpen('b')).toBe(true);
    expect(document.body.querySelectorAll('dialog.te-dialog').length).toBe(2);
  });

  // 12. Submit button click — calls onSubmit callback
  it('submit button click calls onSubmit', () => {
    const onSubmit = vi.fn(() => {});
    manager.open('test', { title: 'T', content: makeContent(), onSubmit });
    const submitBtn = document.body.querySelector<HTMLButtonElement>('.te-dialog-submit');
    submitBtn?.click();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  // 13. Cancel button click — calls onCancel callback
  it('cancel button click calls onCancel', () => {
    const onCancel = vi.fn();
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
      onCancel,
    });
    const cancelBtn = document.body.querySelector<HTMLButtonElement>('.te-dialog-cancel');
    cancelBtn?.click();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  // 14. onSubmit returning false — dialog stays open
  it('dialog stays open when onSubmit returns false', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => false,
    });
    const submitBtn = document.body.querySelector<HTMLButtonElement>('.te-dialog-submit');
    submitBtn?.click();
    expect(manager.isOpen('test')).toBe(true);
    expect(document.body.querySelectorAll('dialog.te-dialog').length).toBe(1);
  });

  // 15. Escape key — closes dialog (via native 'cancel' event on <dialog>)
  it('Escape key closes the dialog via cancel event', () => {
    const onCancel = vi.fn();
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
      onCancel,
    });

    const dialog = document.body.querySelector('dialog.te-dialog')!;
    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(manager.isOpen('test')).toBe(false);
  });

  // Additional: close button (×) in header closes the dialog
  it('close button in header closes the dialog', () => {
    manager.open('test', { title: 'T', content: makeContent(), onSubmit: () => {} });
    const closeBtn = document.body.querySelector<HTMLButtonElement>('.te-dialog-close');
    closeBtn?.click();
    expect(manager.isOpen('test')).toBe(false);
  });

  // Additional: width option sets inline style
  it('open() applies width style when config.width is set', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
      width: 480,
    });
    const dialog = document.body.querySelector<HTMLDialogElement>('dialog.te-dialog')!;
    expect(dialog.style.width).toBe('480px');
  });

  // Additional: theme class is copied from container to dialog
  it('open() copies te-theme-* classes from container to dialog', () => {
    container.classList.add('te-theme-dark');
    manager.open('test', { title: 'T', content: makeContent(), onSubmit: () => {} });
    const dialog = document.body.querySelector('dialog.te-dialog')!;
    expect(dialog.classList.contains('te-theme-dark')).toBe(true);
  });

  // Additional: cancel button also closes the dialog
  it('cancel button click closes the dialog', () => {
    manager.open('test', {
      title: 'T',
      content: makeContent(),
      onSubmit: () => {},
      onCancel: () => {},
    });
    const cancelBtn = document.body.querySelector<HTMLButtonElement>('.te-dialog-cancel');
    cancelBtn?.click();
    expect(manager.isOpen('test')).toBe(false);
  });

  // Additional: close() is idempotent for unknown name
  it('close() on unknown name does not throw', () => {
    expect(() => manager.close('does-not-exist')).not.toThrow();
  });
});
