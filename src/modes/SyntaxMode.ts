/**
 * Interface defining syntax-specific text formatting operations.
 * Implementations produce markup strings for a given syntax dialect.
 * The formatter delegates ALL syntax decisions to this interface.
 */
export interface SyntaxMode {
  /** Identifies the syntax dialect */
  readonly name: 'texy' | 'markdown' | (string & {});

  // ── Inline markers (used by formatter for toggle detection) ────

  readonly markers: {
    readonly bold: string;
    readonly italic: string;
    readonly deleted: string;
    readonly inserted: string;
    readonly superscript: string;
    readonly subscript: string;
    readonly code: string;
    readonly highlight: string;
  };

  // ── Inline wrap (produce complete markup from text) ────────────

  bold(text: string): string;
  italic(text: string): string;
  deleted(text: string): string;
  inserted(text: string): string;
  superscript(text: string): string;
  subscript(text: string): string;
  code(text: string): string;
  highlight(text: string): string;

  // ── Links ─────────────────────────────────────────────────────

  link(text: string, url: string): string;
  /** Empty link markup for cursor placement, e.g. "":url or [](url) */
  linkEmpty(url: string): string;
  /** Offset from start of linkEmpty() where cursor should be placed */
  linkCursorOffset(): number;
  /** Prefix/suffix for wrapping existing selection as link text */
  linkPhrasePrefix(): string;
  linkPhraseSuffix(url: string): string;

  // ── Images ────────────────────────────────────────────────────

  /** Returns image dialog field configuration for this mode */
  getImageDialogFields(): 'simple' | 'extended';
  image(alt: string, url: string): string;
  imageWithOptions(
    src: string,
    alt?: string,
    align?: '<' | '>' | '<>' | '*',
    options?: { width?: number; height?: number; caption?: string; link?: string },
  ): string;

  // ── Headings ──────────────────────────────────────────────────

  heading(text: string, level: number): string;

  // ── Code blocks ───────────────────────────────────────────────

  codeBlock(code: string, lang?: string): string;
  /** Returns open/close tags for wrapping selection as code block */
  codeBlockWrap(lang?: string): { open: string; close: string };

  // ── Lists ─────────────────────────────────────────────────────

  unorderedList(items: string[]): string;
  orderedList(items: string[]): string;
  /** Bullet string for ordered list at given 1-based index */
  orderedBullet(index: number): string;

  // ── Block elements ────────────────────────────────────────────

  blockquote(text: string): string;
  horizontalRule(): string;

  // ── Tables ────────────────────────────────────────────────────

  table(rows: string[][], header?: boolean): string;
  /** Generate table grid markup from dimensions */
  tableGrid(cols: number, rows: number, header?: 'none' | 'top' | 'left'): string;

  // ── Markdown-specific features (may be no-op in Texy) ─────────

  /** Task list item — GFM checkbox syntax */
  taskListItem(text: string, checked: boolean): string;
  /** Footnote reference — e.g. [^1] */
  footnoteRef(id: string): string;
  /** Footnote definition — e.g. [^1]: text */
  footnoteDefinition(id: string, text: string): string;

  // ── Syntax-specific features (may be no-op) ───────────────────

  /** Texy acronym — no-op in Markdown */
  acronym(text: string, title: string): string;
  /** Texy color modifier — no-op in Markdown */
  colorModifier(text: string, color: string): string;
  /** Texy class modifier — no-op in Markdown */
  classModifier(text: string, className: string): string;
  /** Texy alignment prefix — no-op in Markdown */
  alignmentPrefix(type: string): string;
  /** Whether alignment/modifier features are supported */
  supportsModifiers(): boolean;

  // ── Block wrappers ───────────────────────────────────────────

  /** Verbatim/no-process wrapper — Texy: ''text'', Markdown: `text` */
  noProcess(text: string): { prefix: string; suffix: string };
  /** Blockquote/quoted wrapper — Texy: >>text<<, Markdown: > text */
  quotedInline(text: string): { prefix: string; suffix: string };
  /** HTML block wrapper */
  htmlBlockWrapper(): { prefix: string; suffix: string };
  /** Comment block wrapper */
  commentBlockWrapper(): { prefix: string; suffix: string };
}
