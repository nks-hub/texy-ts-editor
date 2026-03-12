import type { SyntaxMode } from './SyntaxMode';

/**
 * Texy syntax implementation of SyntaxMode.
 */
export class TexyMode implements SyntaxMode {
  readonly name = 'texy';

  readonly markers = {
    bold: '**',
    italic: '*',
    deleted: '--',
    inserted: '++',
    superscript: '^^',
    subscript: '__',
    code: '`',
    highlight: '**',
  } as const;

  // ── Inline ────────────────────────────────────────────────────

  bold(text: string): string { return `**${text}**`; }
  italic(text: string): string { return `*${text}*`; }
  deleted(text: string): string { return `--${text}--`; }
  inserted(text: string): string { return `++${text}++`; }
  superscript(text: string): string { return `^^${text}^^`; }
  subscript(text: string): string { return `__${text}__`; }
  code(text: string): string { return `\`${text}\``; }
  highlight(text: string): string { return `**${text}**`; }

  // ── Links ─────────────────────────────────────────────────────

  link(text: string, url: string): string {
    return `"${text}":${url}`;
  }

  linkEmpty(url: string): string {
    return `"":${url}`;
  }

  linkCursorOffset(): number {
    return 1; // cursor inside first quote: ""|:url
  }

  linkPhrasePrefix(): string {
    return '"';
  }

  linkPhraseSuffix(url: string): string {
    return `":${url}`;
  }

  // ── Images ────────────────────────────────────────────────────

  image(alt: string, url: string): string {
    if (alt) {
      return `[* ${url} .( ${alt}) *]`;
    }
    return `[* ${url} *]`;
  }

  imageWithOptions(
    src: string,
    alt?: string,
    align?: '<' | '>' | '<>' | '*',
    options?: { width?: number; height?: number; caption?: string; link?: string },
  ): string {
    let markup = '';
    let effectiveAlign = align;

    if (effectiveAlign === '<>') {
      markup += '\n.<>\n';
      effectiveAlign = '*';
    }

    markup += '[* ' + src;

    if (options?.width && options?.height) {
      markup += ' ' + options.width + 'x' + options.height;
    } else if (options?.width) {
      markup += ' ' + options.width;
    } else if (options?.height) {
      markup += ' ?x' + options.height;
    }

    markup += ' ';
    if (alt) markup += `.( ${alt}) `;
    markup += (effectiveAlign || '*') + ']';

    if (options?.link) markup += ':' + options.link;
    if (options?.caption) markup += ' *** ' + options.caption;

    return markup;
  }

  // ── Headings ──────────────────────────────────────────────────

  heading(text: string, level: number): string {
    const underlineChars: Record<number, string> = { 1: '#', 2: '*', 3: '=', 4: '-' };
    const char = underlineChars[Math.min(Math.max(level, 1), 4)] || '-';
    const underline = char.repeat(Math.max(3, text.length));
    return `${text}\n${underline}`;
  }

  // ── Code blocks ───────────────────────────────────────────────

  codeBlock(code: string, lang?: string): string {
    const langPart = lang ? ` ${lang}` : '';
    return `/--code${langPart}\n${code}\n\\--`;
  }

  codeBlockWrap(lang?: string): { open: string; close: string } {
    const langPart = lang ? ' ' + lang : '';
    return { open: `/--code${langPart}\n`, close: `\n\\--` };
  }

  // ── Lists ─────────────────────────────────────────────────────

  unorderedList(items: string[]): string {
    return items.map((item) => `- ${item}`).join('\n');
  }

  orderedList(items: string[]): string {
    return items.map((item, i) => `${i + 1}) ${item}`).join('\n');
  }

  orderedBullet(index: number): string {
    return `${index})`;
  }

  // ── Block elements ────────────────────────────────────────────

  blockquote(text: string): string {
    return text.split('\n').map((line) => `> ${line}`).join('\n');
  }

  horizontalRule(): string {
    return '-------------------';
  }

  // ── Tables ────────────────────────────────────────────────────

  table(rows: string[][], header = false): string {
    if (rows.length === 0) return '';
    const lines: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (header && i === 0) {
        lines.push('|' + row.map((c) => `* ${c} `).join('|') + '|');
        lines.push('|' + row.map(() => '--------').join('') + '|');
      } else {
        lines.push('|' + row.map((c) => ` ${c} `).join('|') + '|');
      }
    }

    return lines.join('\n');
  }

  tableGrid(cols: number, rows: number, header?: 'none' | 'top' | 'left'): string {
    let markup = '';

    for (let i = 0; i < rows; i++) {
      if (header === 'top' && i === 1) {
        markup += '|';
        for (let j = 0; j < cols; j++) markup += '--------';
        markup += '\n';
      }
      for (let j = 0; j < cols; j++) {
        if (header === 'left' && j === 0) {
          markup += '|* \t';
        } else {
          markup += '| \t';
        }
      }
      markup += '|\n';
    }

    return markup;
  }

  // ── Task list / Footnotes (Texy fallbacks) ───────────────────

  taskListItem(text: string, _checked: boolean): string {
    return `- ${text}`;
  }

  footnoteRef(id: string): string {
    return `((${id}))`;
  }

  footnoteDefinition(_id: string, _text: string): string {
    return '';
  }

  // ── Syntax-specific ───────────────────────────────────────────

  acronym(text: string, title: string): string {
    if (text.match(/^[\p{L}\p{N}]{2,}$/u)) {
      return `${text}((${title}))`;
    }
    return `"${text}"((${title}))`;
  }

  colorModifier(text: string, color: string): string {
    return `"${text}" .{color: ${color}}`;
  }

  classModifier(text: string, className: string): string {
    return `"${text}" .[${className}]`;
  }

  alignmentPrefix(type: string): string {
    return `.${type}\n`;
  }

  supportsModifiers(): boolean {
    return true;
  }
}
