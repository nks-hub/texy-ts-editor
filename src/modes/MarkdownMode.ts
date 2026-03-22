import type { SyntaxMode } from './SyntaxMode';

/**
 * Markdown / GFM syntax implementation of SyntaxMode.
 */
export class MarkdownMode implements SyntaxMode {
  readonly name = 'markdown';

  readonly markers = {
    bold: '**',
    italic: '*',
    deleted: '~~',
    inserted: '++',
    superscript: '^',
    subscript: '~',
    code: '`',
    highlight: '==',
  } as const;

  // ── Inline ────────────────────────────────────────────────────

  bold(text: string): string { return `**${text}**`; }
  italic(text: string): string { return `*${text}*`; }
  deleted(text: string): string { return `~~${text}~~`; }
  inserted(text: string): string { return `++${text}++`; }
  superscript(text: string): string { return `^${text}^`; }
  subscript(text: string): string { return `~${text}~`; }
  code(text: string): string { return `\`${text}\``; }
  highlight(text: string): string { return `==${text}==`; }

  // ── Links ─────────────────────────────────────────────────────

  link(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  linkEmpty(url: string): string {
    return `[](${url})`;
  }

  linkCursorOffset(): number {
    return 1; // cursor inside brackets: [|](url)
  }

  linkPhrasePrefix(): string {
    return '[';
  }

  linkPhraseSuffix(url: string): string {
    return `](${url})`;
  }

  // ── Images ────────────────────────────────────────────────────

  image(alt: string, url: string): string {
    return `![${alt}](${url})`;
  }

  imageWithOptions(
    src: string,
    alt?: string,
    _align?: '<' | '>' | '<>' | '*',
    options?: { width?: number; height?: number; caption?: string; link?: string },
  ): string {
    let markup = `![${alt || ''}](${src})`;
    if (options?.link) {
      markup = `[${markup}](${options.link})`;
    }
    return markup;
  }

  // ── Headings ──────────────────────────────────────────────────

  heading(text: string, level: number): string {
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${text}`;
  }

  // ── Code blocks ───────────────────────────────────────────────

  codeBlock(code: string, lang?: string): string {
    const fence = '```';
    const langPart = lang ?? '';
    return `${fence}${langPart}\n${code}\n${fence}`;
  }

  codeBlockWrap(lang?: string): { open: string; close: string } {
    const langPart = lang ?? '';
    return { open: `\`\`\`${langPart}\n`, close: `\n\`\`\`` };
  }

  // ── Lists ─────────────────────────────────────────────────────

  unorderedList(items: string[]): string {
    return items.map((item) => `- ${item}`).join('\n');
  }

  orderedList(items: string[]): string {
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  }

  orderedBullet(index: number): string {
    return `${index}.`;
  }

  // ── Block elements ────────────────────────────────────────────

  blockquote(text: string): string {
    return text.split('\n').map((line) => `> ${line}`).join('\n');
  }

  horizontalRule(): string {
    return '---';
  }

  // ── Tables ────────────────────────────────────────────────────

  table(rows: string[][], header = false): string {
    if (rows.length === 0) return '';

    const colCount = rows[0].length;
    const lines: string[] = [];

    const formatRow = (cells: string[]): string =>
      '| ' + cells.join(' | ') + ' |';

    if (header) {
      lines.push(formatRow(rows[0]));
      lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      for (let i = 1; i < rows.length; i++) {
        lines.push(formatRow(rows[i]));
      }
    } else {
      for (const row of rows) {
        lines.push(formatRow(row));
      }
    }

    return lines.join('\n');
  }

  tableGrid(cols: number, rows: number, header?: 'none' | 'top' | 'left'): string {
    let markup = '';

    for (let i = 0; i < rows; i++) {
      markup += '|';
      for (let j = 0; j < cols; j++) {
        markup += ` ${header === 'top' && i === 0 ? 'Header' : '  '} |`;
      }
      markup += '\n';
      if (header === 'top' && i === 0) {
        markup += '|';
        for (let j = 0; j < cols; j++) {
          markup += ' --- |';
        }
        markup += '\n';
      }
    }

    return markup;
  }

  // ── Markdown-specific ─────────────────────────────────────────

  taskListItem(text: string, checked: boolean): string {
    return `- [${checked ? 'x' : ' '}] ${text}`;
  }

  footnoteRef(id: string): string {
    return `[^${id}]`;
  }

  footnoteDefinition(id: string, text: string): string {
    return `[^${id}]: ${text}`;
  }

  // ── Syntax-specific (no-op for Markdown) ──────────────────────

  acronym(_text: string, _title: string): string {
    return '';
  }

  colorModifier(text: string, _color: string): string {
    return text;
  }

  classModifier(text: string, _className: string): string {
    return text;
  }

  alignmentPrefix(_type: string): string {
    return '';
  }

  supportsModifiers(): boolean {
    return false;
  }

  noProcess(): { prefix: string; suffix: string } {
    return { prefix: '`', suffix: '`' };
  }

  quotedInline(): { prefix: string; suffix: string } {
    return { prefix: '> ', suffix: '' };
  }

  htmlBlockWrapper(): { prefix: string; suffix: string } {
    return { prefix: '```html\n', suffix: '\n```' };
  }

  commentBlockWrapper(): { prefix: string; suffix: string } {
    return { prefix: '<!-- ', suffix: ' -->' };
  }
}
