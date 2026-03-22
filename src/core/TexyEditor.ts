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
import { DialogHandlers } from './DialogHandlers';
import { TexyParser } from '../parser';
import { getStrings } from '../i18n';
import type { SyntaxMode } from '../modes/SyntaxMode';
import { TexyMode } from '../modes/TexyMode';
import { MarkdownMode } from '../modes/MarkdownMode';
import { MarkdownPreview } from '../preview/MarkdownPreview';

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
  private dialogHandlers!: DialogHandlers;
  private strings!: TexyEditorStrings;

  private options!: TexyEditorOptions;
  private currentView: ViewMode = 'edit';
  private isFullscreen = false;
  private parser!: TexyParser;
  private mode!: SyntaxMode;
  private markdownPreview!: MarkdownPreview | null;
  private plugins: TexyPlugin[] = [];
  private previewDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPreviewedValue = '';
  private destroyed = false;
  private boundInputHandler: (() => void) | null = null;
  private boundResizeHandler: (() => void) | null = null;

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
    if (this.textarea.dataset.texyEditor) {
      throw new Error('TexyEditor: this textarea is already initialized. Call destroy() first.');
    }
    this.textarea.dataset.texyEditor = 'true';

    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.strings = getStrings(this.options.language ?? 'cs');

    // Core modules
    if (typeof options.syntaxMode === 'object') {
      this.mode = options.syntaxMode;
    } else {
      this.mode = options.syntaxMode === 'markdown' ? new MarkdownMode() : new TexyMode();
    }
    this.selection = new Selection(this.textarea);
    this.formatter = new TexyFormatter(this.selection, this.mode);
    this.events = new EventBus();
    this.undoManager = new UndoManager(this.options.maxUndoSteps);
    this.keyboard = new KeyboardManager(this.textarea, this.options.shortcuts);
    this.parser = new TexyParser();
    this.markdownPreview = options.syntaxMode === 'markdown' ? new MarkdownPreview() : null;

    // Dialog handlers (requires formatter, selection, mode, strings — initialized above)
    // dialogManager is not yet available here; it is created in buildDOM().
    // We initialize dialogHandlers lazily via a getter-style approach:
    // registerActions() is called after buildDOM() so dialogHandlers must be
    // initialized before registerActions(). We defer buildDOM() until after
    // dialogHandlers is set, but dialogHandlers needs dialogManager.
    // Solution: initialize dialogHandlers after buildDOM() but before registerActions().

    // Build toolbar builder first (needed by buildDOM)
    this.toolbarBuilder = new ToolbarBuilder(
      this.strings,
      (name) => this.execAction(name),
    );
    this.toolbarBuilder.setEditorApi(this);

    // Build DOM (creates dialogManager)
    this.buildDOM();

    // Now initialize dialogHandlers with all dependencies available
    this.dialogHandlers = new DialogHandlers({
      formatter: this.formatter,
      selection: this.selection,
      dialogManager: this.dialogManager,
      mode: this.mode,
      strings: this.strings,
      createFormField: this.createFormField.bind(this),
      validateRequired: this.validateRequired.bind(this),
      focus: this.focus.bind(this),
      options: this.options,
      events: this.events,
    });

    // Register built-in actions
    this.registerActions();

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
      this.textarea.focus();
      action();
      this.events.emit('toolbar:action', { button: name });
      // Re-render preview if visible
      if (this.currentView !== 'edit') {
        this.renderPreview();
      }
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
      this.events.emit('undo');
    }
  }

  redo(): void {
    const state = this.undoManager.redo();
    if (state) {
      this.textarea.value = state.value;
      this.selection.select(state.cursorStart, state.cursorEnd - state.cursorStart);
      this.events.emit('redo');
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

  getMode(): SyntaxMode {
    return this.mode;
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

    // Clear pending timers
    if (this.previewDebounceTimer) {
      clearTimeout(this.previewDebounceTimer);
      this.previewDebounceTimer = null;
    }

    // Remove textarea event listeners
    if (this.boundInputHandler) {
      this.textarea.removeEventListener('input', this.boundInputHandler);
      this.boundInputHandler = null;
    }
    if (this.boundResizeHandler) {
      this.textarea.removeEventListener('input', this.boundResizeHandler);
      this.boundResizeHandler = null;
    }

    // Destroy plugins
    for (const plugin of this.plugins) {
      plugin.destroy?.();
    }

    // Detach keyboard
    this.keyboard.detach();

    // Close dialogs
    this.dialogManager.closeAll();

    // Cleanup toolbar (removes document listeners)
    this.toolbarBuilder.destroy();

    // Remove container, restore textarea
    const parent = this.container.parentNode;
    if (parent) {
      parent.insertBefore(this.textarea, this.container);
      parent.removeChild(this.container);
    }

    // Cleanup
    delete this.textarea.dataset.texyEditor;
    this.events.emit('destroy');
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

    // Server-side preview (works regardless of mode)
    if (this.options.previewPath) {
      this.previewContent.innerHTML = `<p class="te-preview-loading">${this.strings.previewLoading}</p>`;
      this.fetchServerPreview(value);
    } else if (this.options.livePreview) {
      if (this.markdownPreview) {
        // Client-side Markdown renderer
        this.previewContent.innerHTML = `<div class="te-preview-rendered">${this.markdownPreview.render(value)}</div>`;
      } else {
        // Client-side Texy parser
        this.previewContent.innerHTML = `<div class="te-preview-rendered">${this.parser.parse(value)}</div>`;
      }
    }
  }

  private async fetchServerPreview(value: string): Promise<void> {
    try {
      const response = await fetch(this.options.previewPath!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'TexyEditor',
        },
        body: `texy=${encodeURIComponent(value)}&cfg=${encodeURIComponent(this.options.texyCfg ?? '')}`,
      });
      if (!response.ok) {
        this.previewContent.innerHTML = `<p class="te-preview-error">${this.strings.previewError}</p>`;
        return;
      }
      const html = await response.text();
      this.previewContent.innerHTML = this.sanitizePreviewHtml(html);
      this.events.emit('preview:render', { html });
    } catch {
      this.previewContent.innerHTML = `<p class="te-preview-error">${this.strings.previewError}</p>`;
    }
  }

  private sanitizePreviewHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,link[rel="import"],object,embed,iframe:not([src*="youtube.com/embed"]):not([src*="youtu.be"])').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('on') || (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      }
    });
    return doc.body.innerHTML;
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
      heading5: () => this.handleHeading(5),
      heading6: () => this.handleHeading(6),
      highlight: () => this.formatter.highlight(),
      taskList: () => this.formatter.taskList(),
      footnote: () => this.dialogHandlers.handleFootnote(),
      link: () => this.dialogHandlers.handleLink(),
      image: () => this.dialogHandlers.handleImage(),
      ul: () => this.formatter.unorderedList(),
      ol: () => this.formatter.orderedList(),
      blockquote: () => this.formatter.blockquote(),
      hr: () => this.formatter.horizontalRule(),
      table: () => this.dialogHandlers.handleTable(),
      color: () => this.dialogHandlers.handleColor(),
      symbol: () => this.dialogHandlers.handleSymbol(),
      acronym: () => this.dialogHandlers.handleAcronym(),
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
      upload: () => this.dialogHandlers.handleUpload(),
    };
  }

  private handleHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    if (this.selection.isCursor()) {
      const content = document.createElement('div');
      content.className = 'te-dialog-form';

      const textInput = this.createFormField(content, this.strings.headingPrompt, 'text', '');

      this.dialogManager.open('heading', {
        title: this.strings[`heading${level}` as keyof TexyEditorStrings] as string,
        width: 360,
        content,
        onSubmit: () => {
          if (!this.validateRequired(textInput)) return false;
          this.formatter.headingWithPrompt(level, textInput.value);
          this.focus();
        },
      });
    } else {
      this.formatter.heading(level);
    }
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

    this.boundInputHandler = () => {
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
    };
    this.textarea.addEventListener('input', this.boundInputHandler);
  }

  // ── Private: Auto Resize ──────────────────────────────────

  private setupAutoResize(): void {
    this.boundResizeHandler = () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = this.textarea.scrollHeight + 'px';
    };

    this.textarea.addEventListener('input', this.boundResizeHandler);
    // Initial resize
    requestAnimationFrame(this.boundResizeHandler);
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
    input.addEventListener('input', () => {
      input.classList.remove('te-form-input-error');
      const errorEl = wrapper.querySelector('.te-form-error');
      if (errorEl) errorEl.remove();
    });
    wrapper.appendChild(input);

    container.appendChild(wrapper);
    return input;
  }

  private validateRequired(...inputs: HTMLInputElement[]): boolean {
    let valid = true;
    for (const input of inputs) {
      const empty = !input.value.trim();
      input.classList.toggle('te-form-input-error', empty);
      const wrapper = input.closest('.te-form-group');
      if (wrapper) {
        const existing = wrapper.querySelector('.te-form-error');
        if (existing) existing.remove();
        if (empty) {
          const errorEl = document.createElement('span');
          errorEl.className = 'te-form-error';
          errorEl.textContent = this.strings.fieldRequired;
          wrapper.appendChild(errorEl);
        }
      }
      if (empty) {
        valid = false;
        input.focus();
      }
    }
    return valid;
  }
}
