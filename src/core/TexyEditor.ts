import type {
  TexyEditorOptions,
  TexyEditorAPI,
  TexyEditorEvents,
  TexyEditorStrings,
  TexyEventHandler,
  TexyPlugin,
  ViewMode,
  ToolbarConfig,
} from '../types';
import { Selection } from './Selection';
import { TexyFormatter } from './TexyFormatter';
import { EventBus } from './EventBus';
import { UndoManager } from './UndoManager';
import { KeyboardManager } from './KeyboardManager';
import { ToolbarBuilder } from './ToolbarBuilder';
import { DialogManager } from './DialogManager';
import { TexyParser } from '../parser';
import { getStrings } from '../i18n';

const DEFAULT_TOOLBAR: ToolbarConfig = [
  'bold', 'italic', null,
  'ul', 'ol', null,
  'link', 'image', null,
  'blockquote', 'code', 'codeBlock', null,
  'heading1', 'heading2', 'heading3', null,
  'hr', 'table', null,
  'color', 'symbol',
];

const DEFAULT_OPTIONS: Required<Pick<TexyEditorOptions,
  'language' | 'defaultView' | 'width' | 'livePreview' | 'livePreviewDelay' |
  'theme' | 'splitView' | 'fullscreen' | 'autoResize' | 'maxUndoSteps' |
  'texyCfg'
>> = {
  language: 'cs',
  defaultView: 'edit',
  width: '100%',
  livePreview: true,
  livePreviewDelay: 400,
  theme: 'light',
  splitView: false,
  fullscreen: false,
  autoResize: true,
  maxUndoSteps: 100,
  texyCfg: '',
};

export class TexyEditor implements TexyEditorAPI {
  private container!: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private editDiv!: HTMLElement;
  private previewDiv!: HTMLElement;
  private previewContent!: HTMLElement;

  private selection!: Selection;
  private formatter!: TexyFormatter;
  private events!: EventBus;
  private undoManager!: UndoManager;
  private keyboard!: KeyboardManager;
  private toolbarBuilder!: ToolbarBuilder;
  private dialogManager!: DialogManager;
  private strings!: TexyEditorStrings;

  private options!: TexyEditorOptions;
  private currentView: ViewMode = 'edit';
  private isFullscreen = false;
  private parser!: TexyParser;
  private plugins: TexyPlugin[] = [];
  private previewDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPreviewedValue = '';
  private destroyed = false;

  // Built-in button actions
  private actions: Record<string, () => void> = {};

  constructor(
    textareaOrSelector: HTMLTextAreaElement | string,
    options: TexyEditorOptions = {},
  ) {
    // Resolve textarea element
    if (typeof textareaOrSelector === 'string') {
      const el = document.querySelector<HTMLTextAreaElement>(textareaOrSelector);
      if (!el) throw new Error(`TexyEditor: textarea "${textareaOrSelector}" not found`);
      this.textarea = el;
    } else {
      this.textarea = textareaOrSelector;
    }

    // Guard against double-init
    if (this.textarea.dataset.texyEditor) return;
    this.textarea.dataset.texyEditor = 'true';

    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.strings = getStrings(this.options.language ?? 'cs');

    // Core modules
    this.selection = new Selection(this.textarea);
    this.formatter = new TexyFormatter(this.selection);
    this.events = new EventBus();
    this.undoManager = new UndoManager(this.options.maxUndoSteps);
    this.keyboard = new KeyboardManager(this.textarea, this.options.shortcuts);
    this.parser = new TexyParser();

    // Register built-in actions
    this.registerActions();

    // Build toolbar
    this.toolbarBuilder = new ToolbarBuilder(
      this.strings,
      (name) => this.execAction(name),
    );

    // Build DOM
    this.buildDOM();

    // Apply theme
    this.applyTheme();

    // Apply CSS var overrides
    if (this.options.cssVars) {
      for (const [key, value] of Object.entries(this.options.cssVars)) {
        this.container.style.setProperty(key, value);
      }
    }

    // Setup keyboard shortcuts
    this.setupKeyboard();

    // Setup auto-resize
    if (this.options.autoResize) {
      this.setupAutoResize();
    }

    // Setup undo tracking
    this.setupUndoTracking();

    // Set initial view
    this.currentView = this.options.defaultView ?? 'edit';

    // Init plugins
    if (this.options.plugins) {
      for (const plugin of this.options.plugins) {
        this.loadPlugin(plugin);
      }
    }

    // Save initial undo state
    this.undoManager.push({
      value: this.textarea.value,
      cursorStart: 0,
      cursorEnd: 0,
    });
  }

  // ── Public API ──────────────────────────────────────────────

  getValue(): string {
    return this.textarea.value;
  }

  setValue(value: string): void {
    this.textarea.value = value;
    this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  getSelection(): string {
    return this.selection.text();
  }

  replaceSelection(text: string): void {
    this.selection.replace(text);
  }

  wrapSelection(prefix: string, suffix: string): void {
    this.selection.tag(prefix, suffix);
  }

  insertAtCursor(text: string): void {
    if (this.selection.isCursor()) {
      this.selection.tag(text, '');
    } else {
      this.selection.replace(text);
    }
  }

  focus(): void {
    this.textarea.focus();
  }

  setView(mode: ViewMode): void {
    this.currentView = mode;
    this.updateView();
    this.events.emit('view:change', { mode });
  }

  getView(): ViewMode {
    return this.currentView;
  }

  execAction(name: string): void {
    const action = this.actions[name];
    if (action) {
      action();
      this.events.emit('toolbar:action', { button: name });
    }
  }

  on<K extends keyof TexyEditorEvents>(event: K, handler: TexyEventHandler<TexyEditorEvents[K]>): void {
    this.events.on(event, handler);
  }

  off<K extends keyof TexyEditorEvents>(event: K, handler: TexyEventHandler<TexyEditorEvents[K]>): void {
    this.events.off(event, handler);
  }

  undo(): void {
    const state = this.undoManager.undo();
    if (state) {
      this.textarea.value = state.value;
      this.selection.select(state.cursorStart, state.cursorEnd - state.cursorStart);
      this.events.emit('undo', undefined as never);
    }
  }

  redo(): void {
    const state = this.undoManager.redo();
    if (state) {
      this.textarea.value = state.value;
      this.selection.select(state.cursorStart, state.cursorEnd - state.cursorStart);
      this.events.emit('redo', undefined as never);
    }
  }

  openWindow(_name: string): void {
    // Plugin windows are handled via dialog manager
    // This is the public API hook for plugins
  }

  closeWindow(name: string): void {
    this.dialogManager.close(name);
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.container.classList.toggle('te-fullscreen', this.isFullscreen);
    this.events.emit('fullscreen:toggle', { active: this.isFullscreen });
  }

  getTextarea(): HTMLTextAreaElement {
    return this.textarea;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  getStrings(): TexyEditorStrings {
    return this.strings;
  }

  getDialogManager(): DialogManager {
    return this.dialogManager;
  }

  getFormatter(): TexyFormatter {
    return this.formatter;
  }

  getSelectionManager(): Selection {
    return this.selection;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    // Destroy plugins
    for (const plugin of this.plugins) {
      plugin.destroy?.();
    }

    // Detach keyboard
    this.keyboard.detach();

    // Close dialogs
    this.dialogManager.closeAll();

    // Remove container, restore textarea
    const parent = this.container.parentNode;
    if (parent) {
      parent.insertBefore(this.textarea, this.container);
      parent.removeChild(this.container);
    }

    // Cleanup
    delete this.textarea.dataset.texyEditor;
    this.events.emit('destroy', undefined as never);
    this.events.removeAll();
  }

  // ── Private: DOM Building ─────────────────────────────────

  private buildDOM(): void {
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'te-editor';
    if (this.options.width) {
      this.container.style.width = this.options.width;
    }
    if (this.options.ariaLabel) {
      this.container.setAttribute('aria-label', this.options.ariaLabel);
    }

    // Top toolbar
    const toolbar = this.options.toolbar ?? DEFAULT_TOOLBAR;
    const toolbarEl = this.toolbarBuilder.build(toolbar);
    this.container.appendChild(toolbarEl);

    // Edit area
    this.editDiv = document.createElement('div');
    this.editDiv.className = 'te-edit-area';
    this.container.appendChild(this.editDiv);

    // Preview area
    this.previewDiv = document.createElement('div');
    this.previewDiv.className = 'te-preview-area';
    this.previewDiv.style.display = 'none';
    this.previewContent = document.createElement('div');
    this.previewContent.className = 'te-preview-content';
    this.previewDiv.appendChild(this.previewContent);
    this.container.appendChild(this.previewDiv);

    // Bottom toolbar
    const bottomBar = this.toolbarBuilder.buildBottomBar(
      this.options.bottomLeftToolbar ?? ['edit', 'preview', 'splitView'],
      this.options.bottomRightEditToolbar ?? ['undo', 'redo'],
      this.options.bottomRightPreviewToolbar ?? [],
    );
    this.container.appendChild(bottomBar);

    // Dialog manager
    this.dialogManager = new DialogManager(this.container, this.strings);

    // Insert container into DOM, move textarea inside
    this.textarea.parentNode?.insertBefore(this.container, this.textarea);
    this.editDiv.appendChild(this.textarea);

    // Add te-textarea class
    this.textarea.classList.add('te-textarea');
  }

  private applyTheme(): void {
    const theme = this.options.theme ?? 'light';
    this.container.classList.add(`te-theme-${theme}`);
    this.container.setAttribute('data-te-theme', theme);
  }

  private updateView(): void {
    const isEdit = this.currentView === 'edit';
    const isPreview = this.currentView === 'preview';
    const isSplit = this.currentView === 'split';

    this.editDiv.style.display = (isEdit || isSplit) ? '' : 'none';
    this.previewDiv.style.display = (isPreview || isSplit) ? '' : 'none';

    this.container.classList.toggle('te-view-edit', isEdit);
    this.container.classList.toggle('te-view-preview', isPreview);
    this.container.classList.toggle('te-view-split', isSplit);

    // Update active tab in bottom bar
    this.container.querySelectorAll('.te-bottom-left .te-btn').forEach((btn) => {
      const action = (btn as HTMLElement).dataset.action;
      btn.classList.toggle('te-btn-active', action === this.currentView);
    });

    // Trigger preview render if needed
    if (!isEdit) {
      this.renderPreview();
    }
  }

  // ── Private: Preview ──────────────────────────────────────

  private renderPreview(): void {
    const value = this.textarea.value;

    if (!value.trim()) {
      this.previewContent.innerHTML = `<p class="te-preview-empty">${this.strings.previewEmpty}</p>`;
      return;
    }

    if (value === this.lastPreviewedValue) return;
    this.lastPreviewedValue = value;

    // Server-side preview
    if (this.options.previewPath) {
      this.previewContent.innerHTML = `<p class="te-preview-loading">${this.strings.previewLoading}</p>`;
      this.fetchServerPreview(value);
    } else if (this.options.livePreview) {
      // Client-side Texy parser
      this.previewContent.innerHTML = `<div class="te-preview-rendered">${this.parser.parse(value)}</div>`;
    }
  }

  private async fetchServerPreview(value: string): Promise<void> {
    try {
      const response = await fetch(this.options.previewPath!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `texy=${encodeURIComponent(value)}&cfg=${encodeURIComponent(this.options.texyCfg ?? '')}`,
      });
      const html = await response.text();
      this.previewContent.innerHTML = html;
      this.events.emit('preview:render', { html });
    } catch {
      this.previewContent.innerHTML = '<p class="te-preview-error">Preview loading failed.</p>';
    }
  }

  // ── Private: Actions ──────────────────────────────────────

  private registerActions(): void {
    this.actions = {
      bold: () => this.formatter.bold(),
      italic: () => this.formatter.italic(),
      deleted: () => this.formatter.deleted(),
      inserted: () => this.formatter.inserted(),
      superscript: () => this.formatter.superscript(),
      subscript: () => this.formatter.subscript(),
      code: () => this.formatter.inlineCode(),
      codeBlock: () => this.formatter.codeBlock(),
      heading1: () => this.handleHeading(1),
      heading2: () => this.handleHeading(2),
      heading3: () => this.handleHeading(3),
      heading4: () => this.handleHeading(4),
      link: () => this.handleLink(),
      image: () => this.handleImage(),
      ul: () => this.formatter.unorderedList(),
      ol: () => this.formatter.orderedList(),
      blockquote: () => this.formatter.blockquote(),
      hr: () => this.formatter.horizontalRule(),
      table: () => this.handleTable(),
      color: () => this.handleColor(),
      symbol: () => this.handleSymbol(),
      acronym: () => this.handleAcronym(),
      alignLeft: () => this.formatter.alignLeft(),
      alignRight: () => this.formatter.alignRight(),
      alignCenter: () => this.formatter.alignCenter(),
      alignJustify: () => this.formatter.alignJustify(),
      indent: () => this.formatter.indent(),
      unindent: () => this.formatter.unindent(),
      undo: () => this.undo(),
      redo: () => this.redo(),
      fullscreen: () => this.toggleFullscreen(),
      edit: () => this.setView('edit'),
      preview: () => this.setView('preview'),
      splitView: () => this.setView('split'),
    };
  }

  private handleHeading(level: 1 | 2 | 3 | 4): void {
    if (this.selection.isCursor()) {
      const text = prompt(this.strings.headingPrompt, '');
      if (text) this.formatter.headingWithPrompt(level, text);
    } else {
      this.formatter.heading(level);
    }
  }

  private handleLink(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const urlInput = this.createFormField(content, this.strings.linkUrl, 'url', 'https://');
    const textInput = this.createFormField(content, this.strings.linkText, 'text', this.selection.text());

    this.dialogManager.open('link', {
      title: this.strings.link,
      width: 400,
      content,
      onSubmit: () => {
        this.formatter.link(urlInput.value, textInput.value || undefined);
        this.focus();
      },
    });
  }

  private handleImage(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const urlInput = this.createFormField(content, this.strings.imageUrl, 'url', '');
    const altInput = this.createFormField(content, this.strings.imageAlt, 'text', '');

    // Dimensions row
    const dimRow = document.createElement('div');
    dimRow.className = 'te-form-row';
    const widthInput = this.createFormField(dimRow, this.strings.imageWidth, 'number', '');
    widthInput.min = '0';
    const heightInput = this.createFormField(dimRow, this.strings.imageHeight, 'number', '');
    heightInput.min = '0';
    content.appendChild(dimRow);

    // Alignment
    const alignLabel = document.createElement('label');
    alignLabel.className = 'te-form-label';
    alignLabel.textContent = this.strings.imageAlign;
    content.appendChild(alignLabel);

    const alignSelect = document.createElement('select');
    alignSelect.className = 'te-form-input';
    for (const [value, label] of [['*', '---'], ['<', '← ' + this.strings.alignLeft], ['>', this.strings.alignRight + ' →'], ['<>', '↔ ' + this.strings.alignCenter]]) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      alignSelect.appendChild(opt);
    }
    content.appendChild(alignSelect);

    const linkInput = this.createFormField(content, this.strings.imageLink, 'url', '');
    const captionInput = this.createFormField(content, this.strings.imageCaption, 'text', '');

    // Auto-fill link from image URL when option is enabled
    if (this.options.imageLinkAutoFill) {
      urlInput.addEventListener('input', () => {
        if (!linkInput.value || linkInput.value === linkInput.dataset.autoFilled) {
          linkInput.value = urlInput.value;
          linkInput.dataset.autoFilled = urlInput.value;
        }
      });
    }

    this.dialogManager.open('image', {
      title: this.strings.image,
      width: 460,
      content,
      onSubmit: () => {
        const align = alignSelect.value as '<' | '>' | '<>' | '*';
        const w = parseInt(widthInput.value) || undefined;
        const h = parseInt(heightInput.value) || undefined;
        this.formatter.image(urlInput.value, altInput.value || undefined, align, {
          width: w,
          height: h,
          link: linkInput.value || undefined,
          caption: captionInput.value || undefined,
        });
        this.focus();
      },
    });
  }

  private handleTable(): void {
    const content = document.createElement('div');
    content.className = 'te-dialog-form';

    const colsInput = this.createFormField(content, this.strings.tableCols, 'number', '3');
    const rowsInput = this.createFormField(content, this.strings.tableRows, 'number', '3');

    this.dialogManager.open('table', {
      title: this.strings.table,
      width: 320,
      content,
      onSubmit: () => {
        const cols = parseInt(colsInput.value) || 3;
        const rows = parseInt(rowsInput.value) || 3;
        this.formatter.table(cols, rows, 'top');
        this.focus();
      },
    });
  }

  private handleColor(): void {
    const COLORS = [
      'red', 'blue', 'green', 'orange', 'purple',
      'brown', 'navy', 'teal', 'gray', 'black',
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e67e22', '#95a5a6', '#34495e', '#d35400',
    ];

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
        this.formatter.colorModifier(color);
        this.dialogManager.close('color');
        this.focus();
      });
      content.appendChild(swatch);
    }

    this.dialogManager.open('color', {
      title: this.strings.color,
      width: 300,
      content,
      onSubmit: () => {},
    });
  }

  private handleSymbol(): void {
    const SYMBOLS = [
      '&', '@', '§', '©', '®', '™', '°', '±', '×', '÷',
      '€', '£', '¥', '¢', '‰', '†', '‡', '¶', '•', '…',
      '←', '→', '↑', '↓', '↔', '⇒', '⇐', '⇔', '≈', '≠',
      '≤', '≥', '∞', '∑', '∏', '∫', '√', '∂', '∆', '∇',
      'α', 'β', 'γ', 'δ', 'ε', 'π', 'σ', 'τ', 'φ', 'ω',
      '♠', '♣', '♥', '♦', '★', '☆', '✓', '✗', '♪', '♫',
    ];

    const content = document.createElement('div');
    content.className = 'te-symbol-grid';

    for (const symbol of SYMBOLS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'te-symbol-btn';
      btn.textContent = symbol;
      btn.setAttribute('title', symbol);
      btn.addEventListener('click', () => {
        this.formatter.insertSymbol(symbol);
        this.dialogManager.close('symbol');
        this.focus();
      });
      content.appendChild(btn);
    }

    this.dialogManager.open('symbol', {
      title: this.strings.symbol,
      width: 400,
      content,
      onSubmit: () => {},
    });
  }

  private handleAcronym(): void {
    const title = prompt(this.strings.acronymTitle, '');
    if (title) this.formatter.acronym(title);
  }

  // ── Private: Keyboard ─────────────────────────────────────

  private setupKeyboard(): void {
    this.keyboard.register('bold', () => this.execAction('bold'));
    this.keyboard.register('italic', () => this.execAction('italic'));
    this.keyboard.register('link', () => this.execAction('link'));
    this.keyboard.register('undo', () => this.undo());
    this.keyboard.register('redo', () => this.redo());
    this.keyboard.register('fullscreen', () => this.toggleFullscreen());
    this.keyboard.register('indent', () => this.formatter.indent());
    this.keyboard.register('unindent', () => this.formatter.unindent());
    this.keyboard.attach();
  }

  // ── Private: Undo ─────────────────────────────────────────

  private setupUndoTracking(): void {
    let debounce: ReturnType<typeof setTimeout> | null = null;

    this.textarea.addEventListener('input', () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.undoManager.push({
          value: this.textarea.value,
          cursorStart: this.textarea.selectionStart,
          cursorEnd: this.textarea.selectionEnd,
        });
      }, 300);

      this.events.emit('change', { value: this.textarea.value });

      // Debounced preview update
      if (this.currentView !== 'edit' && this.options.livePreview) {
        if (this.previewDebounceTimer) clearTimeout(this.previewDebounceTimer);
        this.previewDebounceTimer = setTimeout(
          () => this.renderPreview(),
          this.options.livePreviewDelay ?? 400,
        );
      }
    });
  }

  // ── Private: Auto Resize ──────────────────────────────────

  private setupAutoResize(): void {
    const resize = () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = this.textarea.scrollHeight + 'px';
    };

    this.textarea.addEventListener('input', resize);
    // Initial resize
    requestAnimationFrame(resize);
  }

  // ── Private: Plugins ──────────────────────────────────────

  private loadPlugin(plugin: TexyPlugin): void {
    plugin.init(this);
    this.plugins.push(plugin);
    this.events.emit('plugin:init', { name: plugin.name });
  }

  // ── Private: Helpers ──────────────────────────────────────

  private createFormField(
    container: HTMLElement,
    label: string,
    type: string,
    defaultValue: string,
  ): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'te-form-group';

    const labelEl = document.createElement('label');
    labelEl.className = 'te-form-label';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = type;
    input.className = 'te-form-input';
    input.value = defaultValue;
    wrapper.appendChild(input);

    container.appendChild(wrapper);
    return input;
  }
}
