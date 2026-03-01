import type { TexyEditorStrings } from '../types';

export interface DialogConfig {
  title: string;
  width?: number;
  content: HTMLElement;
  onSubmit: () => void;
  onCancel?: () => void;
}

/**
 * Native <dialog> based modal window manager.
 * Replaces jQuery UI Dialog with zero dependencies.
 */
export class DialogManager {
  private openDialogs = new Map<string, HTMLDialogElement>();

  constructor(
    private container: HTMLElement,
    private strings: TexyEditorStrings,
  ) {}

  open(name: string, config: DialogConfig): HTMLDialogElement {
    // Close existing dialog with same name
    this.close(name);

    const dialog = document.createElement('dialog');
    dialog.className = 'te-dialog';
    if (config.width) {
      dialog.style.width = config.width + 'px';
    }

    // Header
    const header = document.createElement('div');
    header.className = 'te-dialog-header';

    const title = document.createElement('h3');
    title.className = 'te-dialog-title';
    title.textContent = config.title;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'te-dialog-close';
    closeBtn.setAttribute('aria-label', this.strings.close);
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close(name));
    header.appendChild(closeBtn);

    dialog.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'te-dialog-body';
    body.appendChild(config.content);
    dialog.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'te-dialog-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'te-btn te-dialog-cancel';
    cancelBtn.textContent = this.strings.cancel;
    cancelBtn.addEventListener('click', () => {
      config.onCancel?.();
      this.close(name);
    });
    footer.appendChild(cancelBtn);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'te-btn te-dialog-submit';
    submitBtn.textContent = this.strings.ok;
    submitBtn.addEventListener('click', () => {
      config.onSubmit();
      this.close(name);
    });
    footer.appendChild(submitBtn);

    dialog.appendChild(footer);

    // Esc key handler
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      config.onCancel?.();
      this.close(name);
    });

    document.body.appendChild(dialog);
    this.openDialogs.set(name, dialog);
    dialog.showModal();

    // Focus first input
    const firstInput = dialog.querySelector<HTMLInputElement>('input, select, textarea');
    firstInput?.focus();

    return dialog;
  }

  close(name: string): void {
    const dialog = this.openDialogs.get(name);
    if (dialog) {
      dialog.close();
      dialog.remove();
      this.openDialogs.delete(name);
    }
  }

  closeAll(): void {
    for (const [name] of this.openDialogs) {
      this.close(name);
    }
  }

  isOpen(name: string): boolean {
    return this.openDialogs.has(name);
  }
}
