/**
 * Public API type definitions for @nks-hub/texy-editor
 */

import type { SyntaxMode } from './modes/SyntaxMode';

// ── Editor Options ──────────────────────────────────────────────

export interface TexyEditorOptions {
  /** Syntax dialect used by the editor toolbar and live preview */
  syntaxMode?: 'texy' | 'markdown' | SyntaxMode;
  /** Language code for i18n strings */
  language?: string;
  /** Toolbar button configuration */
  toolbar?: ToolbarConfig;
  /** Bottom-left toolbar buttons */
  bottomLeftToolbar?: string[];
  /** Bottom-right toolbar buttons (edit mode) */
  bottomRightEditToolbar?: string[];
  /** Bottom-right toolbar buttons (preview mode) */
  bottomRightPreviewToolbar?: string[];
  /** Editor width (CSS value) */
  width?: string;
  /** Initial view mode */
  defaultView?: ViewMode;
  /** Server-side preview endpoint URL */
  previewPath?: string | null;
  /** Texy config string sent with preview AJAX */
  texyCfg?: string;
  /** Enable client-side live preview */
  livePreview?: boolean;
  /** Live preview debounce delay in ms */
  livePreviewDelay?: number;
  /** Theme preset name or custom CSS class */
  theme?: 'light' | 'dark' | string;
  /** Enable split view (editor + preview side by side) */
  splitView?: boolean;
  /** Enable fullscreen toggle */
  fullscreen?: boolean;
  /** Enable auto-resize textarea */
  autoResize?: boolean;
  /** Max undo history steps */
  maxUndoSteps?: number;
  /** Keyboard shortcuts map override */
  shortcuts?: Record<string, string>;
  /** File upload handler */
  uploadHandler?: UploadHandler | null;
  /** Mention autocomplete data source */
  mentionSource?: MentionSource | null;
  /** Custom CSS variables override */
  cssVars?: Record<string, string>;
  /** Plugins to load */
  plugins?: TexyPlugin[];
  /** ARIA label for the editor */
  ariaLabel?: string;
  /** Auto-fill image link with image URL (makes images clickable) */
  imageLinkAutoFill?: boolean;
}

// ── Toolbar ─────────────────────────────────────────────────────

export type ToolbarItem = string | null | ToolbarGroup | ToolbarCustomButton;

export type ToolbarConfig = ToolbarItem[];

export interface ToolbarGroup {
  type: 'group';
  label?: string;
  items: string[];
}

export interface ToolbarCustomButton {
  type: 'button';
  name: string;
  icon?: string;
  label: string;
  action: (editor: TexyEditorAPI) => void;
}

// ── View ────────────────────────────────────────────────────────

export type ViewMode = 'edit' | 'preview' | 'split';

// ── Events ──────────────────────────────────────────────────────

export interface TexyEditorEvents {
  'change': { value: string };
  'view:change': { mode: ViewMode };
  'toolbar:action': { button: string };
  'preview:render': { html: string };
  'upload:start': { file: File };
  'upload:complete': { url: string; file: File };
  'upload:error': { error: Error; file: File; message: string };
  'fullscreen:toggle': { active: boolean };
  'undo': void;
  'redo': void;
  'focus': void;
  'blur': void;
  'mention:query': { query: string };
  'plugin:init': { name: string };
  'destroy': void;
}

export type TexyEventHandler<T> = (data: T) => void;

// ── Plugin System ───────────────────────────────────────────────

export interface TexyPlugin {
  name: string;
  init(editor: TexyEditorAPI): void;
  destroy?(): void;
}

export interface TexyPluginWindowConfig {
  name: string;
  title: string;
  width?: number;
  height?: number;
  createContent(editor: TexyEditorAPI): HTMLElement;
  onSubmit(editor: TexyEditorAPI, content: HTMLElement): void;
}

// ── Upload ──────────────────────────────────────────────────────

export interface UploadHandler {
  upload(file: File): Promise<UploadResult>;
  accept?: string;
  maxSize?: number;
}

export interface UploadResult {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// ── Mention ─────────────────────────────────────────────────────

export interface MentionSource {
  search(query: string): Promise<MentionItem[]>;
  template?: (item: MentionItem) => string;
}

export interface MentionItem {
  id: string;
  label: string;
  avatar?: string;
  description?: string;
}

// ── i18n ────────────────────────────────────────────────────────

export interface TexyEditorStrings {
  bold: string;
  italic: string;
  deleted: string;
  inserted: string;
  superscript: string;
  subscript: string;
  code: string;
  codeBlock: string;
  heading1: string;
  heading2: string;
  heading3: string;
  heading4: string;
  heading5: string;
  heading6: string;
  link: string;
  linkUrl: string;
  linkText: string;
  image: string;
  imageUrl: string;
  imageAlt: string;
  imageAlign: string;
  imageWidth: string;
  imageHeight: string;
  imageCaption: string;
  imageLink: string;
  unorderedList: string;
  orderedList: string;
  blockquote: string;
  horizontalRule: string;
  table: string;
  tableRows: string;
  tableCols: string;
  color: string;
  symbol: string;
  acronym: string;
  acronymTitle: string;
  highlight: string;
  taskList: string;
  footnote: string;
  footnoteId: string;
  footnoteText: string;
  alignLeft: string;
  alignRight: string;
  alignCenter: string;
  alignJustify: string;
  indent: string;
  unindent: string;
  fullscreen: string;
  preview: string;
  edit: string;
  splitView: string;
  undo: string;
  redo: string;
  upload: string;
  uploadDragDrop: string;
  previewEmpty: string;
  previewLoading: string;
  previewError: string;
  headingPrompt: string;
  ok: string;
  cancel: string;
  close: string;
  fieldRequired: string;
}

// ── Public API ──────────────────────────────────────────────────

export interface TexyEditorAPI {
  /** Get current textarea value */
  getValue(): string;
  /** Set textarea value */
  setValue(value: string): void;
  /** Get selected text */
  getSelection(): string;
  /** Replace selection with text */
  replaceSelection(text: string): void;
  /** Wrap selection with prefix/suffix */
  wrapSelection(prefix: string, suffix: string): void;
  /** Insert text at cursor */
  insertAtCursor(text: string): void;
  /** Focus the textarea */
  focus(): void;
  /** Switch view mode */
  setView(mode: ViewMode): void;
  /** Get current view mode */
  getView(): ViewMode;
  /** Execute a toolbar button action by name */
  execAction(name: string): void;
  /** Subscribe to editor event */
  on<K extends keyof TexyEditorEvents>(event: K, handler: TexyEventHandler<TexyEditorEvents[K]>): void;
  /** Unsubscribe from editor event */
  off<K extends keyof TexyEditorEvents>(event: K, handler: TexyEventHandler<TexyEditorEvents[K]>): void;
  /** Undo last change */
  undo(): void;
  /** Redo last undone change */
  redo(): void;
  /** Open a plugin dialog window */
  openWindow(name: string): void;
  /** Close a plugin dialog window */
  closeWindow(name: string): void;
  /** Toggle fullscreen */
  toggleFullscreen(): void;
  /** Get the underlying textarea element */
  getTextarea(): HTMLTextAreaElement;
  /** Get the editor container element */
  getContainer(): HTMLElement;
  /** Get the i18n strings */
  getStrings(): TexyEditorStrings;
  /** Get the current syntax mode */
  getMode(): SyntaxMode;
  /** Destroy the editor and restore original textarea */
  destroy(): void;
}

// ── Selection ───────────────────────────────────────────────────

export interface SelectionState {
  start: number;
  end: number;
  text: string;
  before: string;
  after: string;
}

// ── Parser ──────────────────────────────────────────────────────

export interface TexyParseRule {
  name: string;
  /** Priority (lower = runs first) */
  priority: number;
  /** Process block-level content */
  block?: (text: string) => string;
  /** Process inline content */
  inline?: (text: string) => string;
}

export interface TexyParserOptions {
  rules?: TexyParseRule[];
  plugins?: TexyParserPlugin[];
  enableTypography?: boolean;
  enableAutolinks?: boolean;
}

/**
 * Parser plugin interface for extending Texy syntax.
 * Plugins can hook into multiple stages of the parsing pipeline.
 */
export interface TexyParserPlugin {
  name: string;
  /**
   * Preprocess source text before any parsing (raw Texy input).
   * Useful for converting custom syntax to standard Texy or placeholders.
   */
  preprocess?: (text: string) => string;
  /**
   * Process inline content during inline parsing phase.
   * Receives text with placeholders already extracted (noTexy, code, images, links).
   * Use the provided placeholder function to protect generated HTML.
   */
  processInline?: (text: string, placeholder: (html: string) => string) => string;
  /**
   * Postprocess final HTML output.
   * Useful for expanding placeholders, adding wrappers, or final transformations.
   */
  postprocess?: (html: string) => string;
}
