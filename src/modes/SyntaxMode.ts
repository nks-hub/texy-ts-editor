/**
 * Interface defining syntax-specific text formatting operations.
 * Implementations produce markup strings for a given syntax dialect
 * (Texy or Markdown).
 */
export interface SyntaxMode {
  /** Identifies the syntax dialect, e.g. 'texy' or 'markdown' */
  name: string;

  bold(text: string): string;
  italic(text: string): string;
  /** Strikethrough / deleted text */
  deleted(text: string): string;
  inserted(text: string): string;
  superscript(text: string): string;
  subscript(text: string): string;
  /** ATX-style heading; level 1 is the highest */
  heading(text: string, level: number): string;
  link(text: string, url: string): string;
  image(alt: string, url: string): string;
  /** Inline code span */
  code(text: string): string;
  codeBlock(code: string, lang?: string): string;
  unorderedList(items: string[]): string;
  orderedList(items: string[]): string;
  blockquote(text: string): string;
  horizontalRule(): string;
  table(rows: string[][], header?: boolean): string;
}
