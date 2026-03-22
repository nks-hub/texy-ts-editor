import type { TexyEditorOptions, TexyEditorStrings } from '../types';
import type { SyntaxMode } from '../modes/SyntaxMode';
import type { TexyEditorEvents } from '../types';
import type { TexyFormatter } from './TexyFormatter';
import type { Selection } from './Selection';
import type { DialogManager } from './DialogManager';
import type { EventBus } from './EventBus';

const COLORS = [
  'red', 'blue', 'green', 'orange', 'purple',
  'brown', 'navy', 'teal', 'gray', 'black',
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#95a5a6', '#34495e', '#d35400',
];

const SYMBOLS = [
  '&', '@', '§', '©', '®', '™', '°', '±', '×', '÷',
  '€', '£', '¥', '¢', '‰', '†', '‡', '¶', '•', '…',
  '←', '→', '↑', '↓', '↔', '⇒', '⇐', '⇔', '≈', '≠',
  '≤', '≥', '∞', '∑', '∏', '∫', '√', '∂', '∆', '∇',
  'α', 'β', 'γ', 'δ', 'ε', 'π', 'σ', 'τ', 'φ', 'ω',
  '♠', '♣', '♥', '♦', '★', '☆', '✓', '✗', '♪', '♫',
];

export interface DialogHandlersDeps {
  formatter: TexyFormatter;
  selection: Selection;
  dialogManager: DialogManager;
  mode: SyntaxMode;
  strings: TexyEditorStrings;
  createFormField: (container: HTMLElement, label: string, type: string, defaultValue: string) => HTMLInputElement;
  validateRequired: (...inputs: HTMLInputElement[]) => boolean;
  focus: () => void;
  options: TexyEditorOptions;
  events: EventBus<TexyEditorEvents>;
}

export class DialogHandlers {
  constructor(private deps: DialogHandlersDeps) {}

  handleLink(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const urlInput = this.deps.createFormField(content, this.deps.strings.linkUrl, 'url', 'https://');
    const textInput = this.deps.createFormField(content, this.deps.strings.linkText, 'text', this.deps.selection.text());

    this.deps.dialogManager.open('link', {
      title: this.deps.strings.link,
      width: 400,
      content,
      onSubmit: () => {
        if (!this.deps.validateRequired(urlInput)) return false;
        this.deps.formatter.link(urlInput.value, textInput.value || undefined);
        this.deps.focus();
      },
    });
  }

  handleImage(): void {
    if (this.deps.mode.getImageDialogFields() === 'simple') {
      this.handleImageMarkdown();
      return;
    }
    this.handleImageTexy();
  }

  handleImageTexy(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const urlInput = this.deps.createFormField(content, this.deps.strings.imageUrl, 'url', '');
    const altInput = this.deps.createFormField(content, this.deps.strings.imageAlt, 'text', '');

    const dimRow = document.createElement('div');
    dimRow.className = 'te-form-row';
    const widthInput = this.deps.createFormField(dimRow, this.deps.strings.imageWidth, 'number', '');
    widthInput.min = '0';
    const heightInput = this.deps.createFormField(dimRow, this.deps.strings.imageHeight, 'number', '');
    heightInput.min = '0';
    content.appendChild(dimRow);

    const alignLabel = document.createElement('label');
    alignLabel.className = 'te-form-label';
    alignLabel.textContent = this.deps.strings.imageAlign;
    content.appendChild(alignLabel);

    const alignSelect = document.createElement('select');
    alignSelect.className = 'te-form-input';
    for (const [value, label] of [['*', '---'], ['<', '← ' + this.deps.strings.alignLeft], ['>', this.deps.strings.alignRight + ' →'], ['<>', '↔ ' + this.deps.strings.alignCenter]]) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      alignSelect.appendChild(opt);
    }
    content.appendChild(alignSelect);

    const linkInput = this.deps.createFormField(content, this.deps.strings.imageLink, 'url', '');
    const captionInput = this.deps.createFormField(content, this.deps.strings.imageCaption, 'text', '');

    if (this.deps.options.imageLinkAutoFill) {
      urlInput.addEventListener('input', () => {
        if (!linkInput.value || linkInput.value === linkInput.dataset.autoFilled) {
          linkInput.value = urlInput.value;
          linkInput.dataset.autoFilled = urlInput.value;
        }
      });
    }

    this.deps.dialogManager.open('image', {
      title: this.deps.strings.image,
      width: 460,
      content,
      onSubmit: () => {
        if (!this.deps.validateRequired(urlInput)) return false;
        const align = alignSelect.value as '<' | '>' | '<>' | '*';
        const w = parseInt(widthInput.value) || undefined;
        const h = parseInt(heightInput.value) || undefined;
        this.deps.formatter.image(urlInput.value, altInput.value || undefined, align, {
          width: w,
          height: h,
          link: linkInput.value || undefined,
          caption: captionInput.value || undefined,
        });
        this.deps.focus();
      },
    });
  }

  handleImageMarkdown(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const urlInput = this.deps.createFormField(content, this.deps.strings.imageUrl, 'url', '');
    const altInput = this.deps.createFormField(content, this.deps.strings.imageAlt, 'text', '');

    this.deps.dialogManager.open('image', {
      title: this.deps.strings.image,
      width: 400,
      content,
      onSubmit: () => {
        if (!this.deps.validateRequired(urlInput)) return false;
        this.deps.formatter.image(urlInput.value, altInput.value || undefined);
        this.deps.focus();
      },
    });
  }

  handleTable(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const colsInput = this.deps.createFormField(content, this.deps.strings.tableCols, 'number', '3');
    const rowsInput = this.deps.createFormField(content, this.deps.strings.tableRows, 'number', '3');

    this.deps.dialogManager.open('table', {
      title: this.deps.strings.table,
      width: 320,
      content,
      onSubmit: () => {
        const cols = parseInt(colsInput.value) || 3;
        const rows = parseInt(rowsInput.value) || 3;
        this.deps.formatter.table(cols, rows, 'top');
        this.deps.focus();
      },
    });
  }

  handleColor(): void {
    const content = document.createElement('div');
    content.className = 'te-color-grid';

    for (const color of COLORS) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'te-color-swatch';
      swatch.style.backgroundColor = color;
      swatch.setAttribute('data-color', color);
      swatch.setAttribute('title', color);
      swatch.addEventListener('click', () => {
        this.deps.formatter.colorModifier(color);
        this.deps.dialogManager.close('color');
        this.deps.focus();
      });
      content.appendChild(swatch);
    }

    this.deps.dialogManager.open('color', {
      title: this.deps.strings.color,
      width: 300,
      content,
      onSubmit: () => {},
    });
  }

  handleSymbol(): void {
    const content = document.createElement('div');
    content.className = 'te-symbol-grid';

    for (const symbol of SYMBOLS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'te-symbol-btn';
      btn.textContent = symbol;
      btn.setAttribute('title', symbol);
      btn.addEventListener('click', () => {
        this.deps.formatter.insertSymbol(symbol);
        this.deps.dialogManager.close('symbol');
        this.deps.focus();
      });
      content.appendChild(btn);
    }

    this.deps.dialogManager.open('symbol', {
      title: this.deps.strings.symbol,
      width: 400,
      content,
      onSubmit: () => {},
    });
  }

  handleFootnote(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const idInput = this.deps.createFormField(content, this.deps.strings.footnoteId, 'text', '1');
    const textInput = this.deps.createFormField(content, this.deps.strings.footnoteText, 'text', '');

    this.deps.dialogManager.open('footnote', {
      title: this.deps.strings.footnote,
      width: 400,
      content,
      onSubmit: () => {
        if (!this.deps.validateRequired(idInput, textInput)) return false;
        this.deps.formatter.footnote(idInput.value, textInput.value);
        this.deps.focus();
      },
    });
  }

  handleAcronym(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const titleInput = this.deps.createFormField(content, this.deps.strings.acronymTitle, 'text', '');

    this.deps.dialogManager.open('acronym', {
      title: this.deps.strings.acronym,
      width: 360,
      content,
      onSubmit: () => {
        if (!this.deps.validateRequired(titleInput)) return false;
        this.deps.formatter.acronym(titleInput.value);
        this.deps.focus();
      },
    });
  }

  handleUpload(): void {
    const handler = this.deps.options.uploadHandler;
    if (!handler) return;

    const input = document.createElement('input');
    input.type = 'file';
    if (handler.accept) input.accept = handler.accept;
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (handler.maxSize && file.size > handler.maxSize) {
        this.deps.events.emit('upload:error', {
          message: this.deps.strings.upload + ': ' + file.name + ' is too large',
          error: new Error(this.deps.strings.upload + ': ' + file.name + ' is too large'),
          file,
        });
        return;
      }

      this.deps.events.emit('upload:start', { file });

      try {
        const result = await handler.upload(file);
        this.deps.events.emit('upload:complete', { url: result.url, file });

        if (file.type.startsWith('image/')) {
          const alt = result.alt || file.name;
          if (this.deps.mode.name === 'markdown') {
            this.deps.formatter.image(result.url, alt);
          } else {
            const dims = result.width && result.height ? ` ${result.width}x${result.height}` : '';
            this.deps.selection.replace(`[* ${result.url}${dims} .>] *** ${alt}`);
          }
        } else {
          this.deps.formatter.link(result.url, file.name);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.deps.events.emit('upload:error', { error, file, message: error.message });
      }

      input.remove();
    });

    document.body.appendChild(input);
    input.click();
  }
}
