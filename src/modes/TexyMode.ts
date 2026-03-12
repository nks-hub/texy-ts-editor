import type { SyntaxMode } from './SyntaxMode';

/**
 * Texy syntax implementation of SyntaxMode.
 *
 * Heading levels use Texy's inverted convention where more characters
 * indicate a higher (more important) heading:
 *   level 1 → ###### (6 chars, maps to <h1>)
 *   level 2 → #####  (5 chars, maps to <h2>)
 *   level 3 → ####   (4 chars, maps to <h3>)
 *   level 4 → ###    (3 chars, maps to <h4>)
 */
export class TexyMode implements SyntaxMode {
  readonly name = 'texy';

  bold(text: string): string {
    return `**${text}**`;
  }

  italic(text: string): string {
    return `*${text}*`;
  }

  deleted(text: string): string {
    return `--${text}--`;
  }

  inserted(text: string): string {
    return `++${text}++`;
  }

  superscript(text: string): string {
    return `^^${text}^^`;
  }

  subscript(text: string): string {
    return `__${text}__`;
  }

  heading(text: string, level: number): string {
    // Texy inverted hashing: level 1 gets the most # characters
    // Minimum 3 chars per Texy spec; add extra to differentiate levels
    const charCount = Math.max(3, 7 - level);
    const underline = '#'.repeat(charCount);
    return `${text}\n${underline}`;
  }

  link(text: string, url: string): string {
    return `"${text}":${url}`;
  }

  image(alt: string, url: string): string {
    if (alt) {
      return `[* ${url} .( ${alt}) *]`;
    }
    return `[* ${url} *]`;
  }

  code(text: string): string {
    return `\`${text}\``;
  }

  codeBlock(code: string, lang?: string): string {
    const langPart = lang ? ` ${lang}` : '';
    return `/--code${langPart}\n${code}\n\\--`;
  }

  unorderedList(items: string[]): string {
    return items.map((item) => `- ${item}`).join('\n');
  }

  orderedList(items: string[]): string {
    return items.map((item, i) => `${i + 1}) ${item}`).join('\n');
  }

  blockquote(text: string): string {
    return text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  horizontalRule(): string {
    return '-------------------';
  }

  table(rows: string[][], header = false): string {
    if (rows.length === 0) return '';

    const lines: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (header && i === 0) {
        lines.push('|' + row.map((c) => `* ${c} `).join('|') + '|');
        // Separator after header row
        lines.push('|' + row.map(() => '--------').join('') + '|');
      } else {
        lines.push('|' + row.map((c) => ` ${c} `).join('|') + '|');
      }
    }

    return lines.join('\n');
  }
}
