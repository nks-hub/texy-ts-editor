import type { SyntaxMode } from './SyntaxMode';

/**
 * Markdown / GFM syntax implementation of SyntaxMode.
 *
 * Uses standard CommonMark / GitHub Flavored Markdown conventions.
 * Non-standard extensions (inserted, superscript, subscript) use widely
 * supported but unofficial markers.
 */
export class MarkdownMode implements SyntaxMode {
  readonly name = 'markdown';

  bold(text: string): string {
    return `**${text}**`;
  }

  italic(text: string): string {
    return `*${text}*`;
  }

  /** GFM strikethrough */
  deleted(text: string): string {
    return `~~${text}~~`;
  }

  /** Common extension — not part of CommonMark */
  inserted(text: string): string {
    return `++${text}++`;
  }

  /** Common extension — not part of CommonMark */
  superscript(text: string): string {
    return `^${text}^`;
  }

  /** Common extension — not part of CommonMark */
  subscript(text: string): string {
    return `~${text}~`;
  }

  heading(text: string, level: number): string {
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
    return `${hashes} ${text}`;
  }

  link(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  image(alt: string, url: string): string {
    return `![${alt}](${url})`;
  }

  code(text: string): string {
    return `\`${text}\``;
  }

  codeBlock(code: string, lang?: string): string {
    const fence = '```';
    const langPart = lang ?? '';
    return `${fence}${langPart}\n${code}\n${fence}`;
  }

  unorderedList(items: string[]): string {
    return items.map((item) => `- ${item}`).join('\n');
  }

  orderedList(items: string[]): string {
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  }

  blockquote(text: string): string {
    return text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  horizontalRule(): string {
    return '---';
  }

  table(rows: string[][], header = false): string {
    if (rows.length === 0) return '';

    const colCount = rows[0].length;
    const lines: string[] = [];

    const formatRow = (cells: string[]): string =>
      '| ' + cells.join(' | ') + ' |';

    if (header) {
      // First row is the header
      lines.push(formatRow(rows[0]));
      // Separator
      lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      // Remaining rows
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
}
