import type { TexyParserOptions, TexyParserPlugin } from '../types';

/**
 * Client-side Texy markup parser.
 * Converts Texy source text to HTML for live preview.
 * Supports plugin system for custom syntax extensions.
 */
export class TexyParser {
  private options: Required<TexyParserOptions>;
  private plugins: TexyParserPlugin[];

  constructor(options: TexyParserOptions = {}) {
    this.options = {
      rules: options.rules ?? [],
      plugins: options.plugins ?? [],
      enableTypography: options.enableTypography ?? true,
      enableAutolinks: options.enableAutolinks ?? true,
    };
    this.plugins = this.options.plugins;
  }

  /** Add a plugin at runtime */
  addPlugin(plugin: TexyParserPlugin): void {
    this.plugins.push(plugin);
  }

  /** Remove a plugin by name */
  removePlugin(name: string): void {
    this.plugins = this.plugins.filter((p) => p.name !== name);
  }

  /** Get registered plugins */
  getPlugins(): readonly TexyParserPlugin[] {
    return this.plugins;
  }

  parse(input: string): string {
    if (!input.trim()) return '';

    // Normalize line endings
    let text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Run plugin preprocessors
    for (const plugin of this.plugins) {
      if (plugin.preprocess) {
        text = plugin.preprocess(text);
      }
    }

    // Apply custom block rules (lowest priority number first)
    const blockRules = this.options.rules
      .filter((r) => r.block)
      .sort((a, b) => a.priority - b.priority);
    for (const rule of blockRules) {
      text = rule.block!(text);
    }

    // Process blocks
    let html = this.parseBlocks(text);

    // Run plugin postprocessors
    for (const plugin of this.plugins) {
      if (plugin.postprocess) {
        html = plugin.postprocess(html);
      }
    }

    return html;
  }

  // ── Block-level parsing ──────────────────────────────────

  private parseBlocks(text: string): string {
    const blocks: string[] = [];

    // Split into raw blocks by double newlines, but preserve special block structures
    const segments = this.splitBlockSegments(text);

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;

      const parsed =
        this.tryCommentBlock(trimmed) ??
        this.tryCodeBlock(trimmed) ??
        this.tryHtmlBlock(trimmed) ??
        this.tryDivBlock(trimmed) ??
        this.tryTextBlock(trimmed) ??
        this.tryTable(trimmed) ??
        this.tryHeading(trimmed) ??
        this.tryHorizontalRule(trimmed) ??
        this.tryBlockquote(trimmed) ??
        this.tryList(trimmed) ??
        this.tryParagraph(trimmed);

      if (parsed) blocks.push(parsed);
    }

    return blocks.join('\n');
  }

  /**
   * Split text into block segments.
   * Respects /--...\-- block boundaries.
   */
  private splitBlockSegments(text: string): string[] {
    const segments: string[] = [];
    const lines = text.split('\n');
    let current: string[] = [];
    let inBlock = false;

    for (const line of lines) {
      if (!inBlock && /^\/--/.test(line)) {
        // Start of a special block — flush current paragraph
        if (current.length > 0) {
          const joined = current.join('\n');
          // Split paragraph-level segments by double newlines
          segments.push(...this.splitParagraphs(joined));
          current = [];
        }
        inBlock = true;
        current.push(line);
      } else if (inBlock && /^\\--/.test(line)) {
        current.push(line);
        segments.push(current.join('\n'));
        current = [];
        inBlock = false;
      } else if (inBlock) {
        current.push(line);
      } else {
        current.push(line);
      }
    }

    // Flush remaining
    if (current.length > 0) {
      const joined = current.join('\n');
      if (inBlock) {
        // Unclosed block — treat as-is
        segments.push(joined);
      } else {
        segments.push(...this.splitParagraphs(joined));
      }
    }

    return segments;
  }

  private splitParagraphs(text: string): string[] {
    return text.split(/\n{2,}/).filter((s) => s.trim());
  }

  // ── Comment block: /--comment ... \-- ─────────────────────

  private tryCommentBlock(text: string): string | null {
    const match = text.match(/^\/--comment[ \t]*\n([\s\S]*?)(?:\n\\--|$)/);
    if (!match) return null;
    // Comments produce no output
    return '<!-- comment -->';
  }

  // ── Code block: /--code [lang] ... \-- ────────────────────

  private tryCodeBlock(text: string): string | null {
    const match = text.match(/^\/--code[ \t]*(\S*)[ \t]*\n([\s\S]*?)(?:\n\\--|$)/);
    if (!match) return null;

    const lang = match[1];
    const code = this.escapeHtml(match[2]);
    const langAttr = lang ? ` class="language-${this.escapeHtml(lang)}"` : '';
    return `<pre><code${langAttr}>${code}</code></pre>`;
  }

  // ── HTML block: /--html ... \-- ───────────────────────────

  private tryHtmlBlock(text: string): string | null {
    const match = text.match(/^\/--html[ \t]*\n([\s\S]*?)(?:\n\\--|$)/);
    if (!match) return null;
    return match[1]; // Pass HTML through as-is
  }

  // ── Div block: /--div [modifier] ... \-- ──────────────────

  private tryDivBlock(text: string): string | null {
    const match = text.match(/^\/--div[ \t]*(.*?)[ \t]*\n([\s\S]*?)(?:\n\\--|$)/);
    if (!match) return null;

    const modifier = match[1];
    const content = this.parseBlocks(match[2]);
    const attrs = modifier ? this.parseModifierAttrs(modifier) : '';
    return `<div${attrs}>\n${content}\n</div>`;
  }

  // ── Text block: /--text ... \-- ───────────────────────────

  private tryTextBlock(text: string): string | null {
    const match = text.match(/^\/--text[ \t]*\n([\s\S]*?)(?:\n\\--|$)/);
    if (!match) return null;
    return `<pre>${this.escapeHtml(match[1])}</pre>`;
  }

  // ── Table ─────────────────────────────────────────────────

  private tryTable(text: string): string | null {
    const lines = text.split('\n');
    if (!lines[0].match(/^\|/)) return null;

    // Verify all lines start with | or are separator rows
    const isTableLine = (line: string) =>
      /^\|/.test(line.trim()) || /^\|[-=]+/.test(line.trim());
    if (!lines.every((l) => !l.trim() || isTableLine(l))) return null;

    let html = '<table>\n';
    let inHead = false;
    let headClosed = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Separator row: |-------- or |========
      if (/^\|[-=]+/.test(trimmed)) {
        if (inHead && !headClosed) {
          html += '</thead>\n<tbody>\n';
          headClosed = true;
        }
        continue;
      }

      // Parse cells
      const cells = this.parseTableRow(trimmed);
      if (!cells) continue;

      // Check if any cell is a header cell (starts with *)
      const hasHeaderCells = cells.some((c) => c.isHeader);

      if (hasHeaderCells && !headClosed && !inHead) {
        html += '<thead>\n';
        inHead = true;
      }

      html += '<tr>';
      for (const cell of cells) {
        const tag = cell.isHeader ? 'th' : 'td';
        const content = this.parseInline(cell.content.trim());
        html += `<${tag}>${content}</${tag}>`;
      }
      html += '</tr>\n';
    }

    if (inHead && !headClosed) {
      html += '</thead>\n';
    }
    if (headClosed) {
      html += '</tbody>\n';
    }

    html += '</table>';
    return html;
  }

  private parseTableRow(line: string): { content: string; isHeader: boolean }[] | null {
    // Remove leading and trailing |
    let row = line.trim();
    if (!row.startsWith('|')) return null;
    row = row.substring(1);
    if (row.endsWith('|')) row = row.substring(0, row.length - 1);

    const cells = row.split('|');
    return cells.map((cell) => {
      const trimmed = cell.trim();
      if (trimmed.startsWith('*')) {
        return { content: trimmed.substring(1).trim(), isHeader: true };
      }
      return { content: trimmed, isHeader: false };
    });
  }

  // ── Heading (underline style) ─────────────────────────────

  private tryHeading(text: string): string | null {
    const lines = text.split('\n');
    const headingChars: Record<string, number> = { '#': 1, '*': 2, '=': 3, '-': 4 };

    // Check for "surrounded" heading style: === heading === (single line)
    const surroundMatch = lines[0].match(/^(#{3,}|\*{3,}|={3,}|-{3,})\s+(.+?)\s+\1\s*$/);
    if (surroundMatch) {
      const char = surroundMatch[1][0];
      const level = headingChars[char];
      if (level) {
        const content = this.parseInline(surroundMatch[2]);
        const remaining = lines.slice(1).join('\n').trim();
        let result = `<h${level}>${content}</h${level}>`;
        if (remaining) result += '\n' + this.parseBlocks(remaining);
        return result;
      }
    }

    // Standard underline heading (needs at least 2 lines)
    if (lines.length >= 2) {
      const headingText = lines[0];
      const underline = lines[1];

      const underlineMatch = underline.match(/^(#{3,}|\*{3,}|={3,}|-{3,})\s*$/);
      if (underlineMatch && headingText.trim()) {
        const char = underlineMatch[1][0];
        const level = headingChars[char];
        if (level) {
          const content = this.parseInline(headingText.trim());
          const remaining = lines.slice(2).join('\n').trim();
          let result = `<h${level}>${content}</h${level}>`;
          if (remaining) result += '\n' + this.parseBlocks(remaining);
          return result;
        }
      }
    }

    return null;
  }

  // ── Horizontal rule ───────────────────────────────────────

  private tryHorizontalRule(text: string): string | null {
    if (/^-{3,}\s*$/.test(text.trim()) && !text.includes('\n')) {
      return '<hr>';
    }
    if (/^\*{3,}\s*$/.test(text.trim()) && !text.includes('\n')) {
      return '<hr>';
    }
    return null;
  }

  // ── Blockquote ────────────────────────────────────────────

  private tryBlockquote(text: string): string | null {
    const lines = text.split('\n');
    if (!lines[0].match(/^>\s/)) return null;

    // All lines should start with >
    const allQuoted = lines.every((l) => /^>\s?/.test(l) || !l.trim());
    if (!allQuoted) return null;

    const inner = lines
      .map((l) => l.replace(/^>\s?/, ''))
      .join('\n');

    // Recursively parse inner content (nested blockquotes, paragraphs)
    const content = this.parseBlocks(inner);
    return `<blockquote>\n${content}\n</blockquote>`;
  }

  // ── Lists ─────────────────────────────────────────────────

  private tryList(text: string): string | null {
    const lines = text.split('\n');

    // Unordered list: - item, * item, + item
    if (/^[-*+]\s/.test(lines[0])) {
      return this.parseListItems(lines, /^[-*+]\s/, 'ul');
    }

    // Ordered list: 1) item, a) item, A) item, I) item, i) item
    if (/^(\d+[).]|[a-z][).]|[A-Z][).]|[IVXLCDM]+[).]|[ivxlcdm]+[).])\s/.test(lines[0])) {
      const firstItem = lines[0];
      let type = '';
      if (/^\d/.test(firstItem)) type = '';
      else if (/^[ivxlcdm]+\)/i.test(firstItem) && /^[IV]/.test(firstItem)) type = ' type="I"';
      else if (/^[ivxlcdm]+\)/.test(firstItem)) type = ' type="i"';
      else if (/^[A-Z]\)/.test(firstItem)) type = ' type="A"';
      else if (/^[a-z]\)/.test(firstItem)) type = ' type="a"';
      return this.parseListItems(lines, /^(?:\d+[).]|[a-zA-Z][).]|[IVXLCDM]+[).]|[ivxlcdm]+[).])\s/, 'ol', type);
    }

    return null;
  }

  private parseListItems(lines: string[], bulletPattern: RegExp, tag: string, attrs = ''): string {
    const items: string[] = [];
    let currentItem: string[] = [];

    for (const line of lines) {
      if (bulletPattern.test(line)) {
        if (currentItem.length > 0) {
          items.push(currentItem.join('\n'));
        }
        currentItem = [line.replace(bulletPattern, '')];
      } else if (/^\s+/.test(line) && currentItem.length > 0) {
        // Continuation line (indented)
        currentItem.push(line.replace(/^\s+/, ''));
      } else if (!line.trim() && currentItem.length > 0) {
        currentItem.push('');
      } else {
        currentItem.push(line);
      }
    }
    if (currentItem.length > 0) {
      items.push(currentItem.join('\n'));
    }

    let html = `<${tag}${attrs}>\n`;
    for (const item of items) {
      // Check for nested list
      const trimmed = item.trim();
      const nestedList = this.tryList(trimmed);
      if (nestedList && trimmed !== item.trim()) {
        html += `<li>${nestedList}</li>\n`;
      } else {
        html += `<li>${this.parseInline(trimmed)}</li>\n`;
      }
    }
    html += `</${tag}>`;
    return html;
  }

  // ── Paragraph ─────────────────────────────────────────────

  private tryParagraph(text: string): string {
    // Check for paragraph modifier: .<> or .< or .> or .=
    const modifierMatch = text.match(/^\.([\<\>\=]+)\n([\s\S]+)$/);
    if (modifierMatch) {
      const align = this.parseAlignModifier(modifierMatch[1]);
      const content = this.parseInline(modifierMatch[2].trim());
      return `<p${align}>${content}</p>`;
    }

    const inline = this.parseInline(text);
    return `<p>${inline}</p>`;
  }

  private parseAlignModifier(mod: string): string {
    switch (mod) {
      case '<': return ' style="text-align:left"';
      case '>': return ' style="text-align:right"';
      case '<>': return ' style="text-align:center"';
      case '=': return ' style="text-align:justify"';
      default: return '';
    }
  }

  // ── Inline parsing ────────────────────────────────────────

  parseInline(text: string): string {
    // Placeholder maps for protected content
    const placeholders = new Map<string, string>();
    let pIdx = 0;
    const ph = (content: string): string => {
      const key = `\x00PH${pIdx++}\x00`;
      placeholders.set(key, content);
      return key;
    };

    let src = text;

    // 1. NoTexy zones: ''text'' — extract first to protect content
    src = src.replace(/''(.+?)''/g, (_m, content) => ph(content));

    // 2. Inline code: `code` — extract to protect from further parsing
    src = src.replace(/`([^`]+)`/g, (_m, content) => ph(`<code>${this.escapeHtml(content)}</code>`));

    // 3. Images: [* src .(alt) align] — extract before italic (* conflicts)
    src = src.replace(
      /\[\*\s+(\S+?)(?:\s+\.\(([^)]*)\))?\s*([<>*]?)\s*\]/g,
      (_m, imgSrc, alt, align) => {
        let style = '';
        if (align === '<') style = ' style="float:left"';
        else if (align === '>') style = ' style="float:right"';
        const altAttr = alt ? ` alt="${this.escapeHtml(alt)}"` : ' alt=""';
        return ph(`<img src="${this.escapeHtml(imgSrc)}"${altAttr}${style}>`);
      },
    );

    // 4. Apply custom inline rules (on raw text)
    const inlineRules = this.options.rules
      .filter((r) => r.inline)
      .sort((a, b) => a.priority - b.priority);
    for (const rule of inlineRules) {
      src = rule.inline!(src);
    }

    // 4b. Run plugin inline processors (with access to placeholder function)
    for (const plugin of this.plugins) {
      if (plugin.processInline) {
        src = plugin.processInline(src, ph);
      }
    }

    // 5. Links: "text":URL — extract before HTML escaping (quotes are significant)
    src = src.replace(
      /"([^"]+?)":((?:https?:\/\/|ftp:\/\/|mailto:)\S+)/g,
      (_m, linkText, url) => ph(`<a href="${this.escapeHtml(url)}">${this.escapeHtml(linkText)}</a>`),
    );
    // Links with relative URLs: "text":path
    src = src.replace(
      /"([^"]+?)":(\S+)/g,
      (_m, linkText, url) => ph(`<a href="${this.escapeHtml(url)}">${this.escapeHtml(linkText)}</a>`),
    );

    // 6. Acronyms: word((title)) — extract before HTML escaping
    src = src.replace(
      /(\w+)\(\(([^)]+)\)\)/g,
      (_m, word, title) => ph(`<abbr title="${this.escapeHtml(title)}">${this.escapeHtml(word)}</abbr>`),
    );

    // 7. Phrase with modifier: "text" .{style}
    src = src.replace(
      /"(.+?)"\s*\.\{([^}]+)\}/g,
      (_m, content, style) => ph(`<span style="${this.escapeHtml(style)}">${this.escapeHtml(content)}</span>`),
    );
    // Phrase with class modifier: "text" .[class]
    src = src.replace(
      /"(.+?)"\s*\.\[([^\]]+)\]/g,
      (_m, content, cls) => ph(`<span class="${this.escapeHtml(cls)}">${this.escapeHtml(content)}</span>`),
    );

    // 8. Typography (apply to raw text before HTML escaping)
    if (this.options.enableTypography) {
      src = this.applyTypography(src);
    }

    // 9. Now escape remaining HTML
    src = this.escapeHtmlPreservingPlaceholders(src, placeholders);

    // 10. Inline phrases (on escaped text)
    // Bold: **text**
    src = src.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* (not inside **)
    src = src.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    // Deleted: --text--
    src = src.replace(/--(.+?)--/g, '<del>$1</del>');
    // Inserted: ++text++
    src = src.replace(/\+\+(.+?)\+\+/g, '<ins>$1</ins>');
    // Superscript: ^^text^^
    src = src.replace(/\^\^(.+?)\^\^/g, '<sup>$1</sup>');
    // Subscript: __text__
    src = src.replace(/__(.+?)__/g, '<sub>$1</sub>');
    // Quoted: >>text<<
    src = src.replace(/&gt;&gt;(.+?)&lt;&lt;/g, '<q>$1</q>');

    // 11. Auto-links (bare URLs, on escaped text)
    if (this.options.enableAutolinks) {
      src = src.replace(
        /(?<![&"=\/])(?:https?:\/\/|www\.)[^\s<>&]+/g,
        (url) => {
          const href = url.startsWith('www.') ? `https://${url}` : url;
          return `<a href="${href}">${url}</a>`;
        },
      );
    }

    // 12. Line breaks within paragraphs
    src = src.replace(/\n/g, '<br>\n');

    // 13. Restore all placeholders
    for (const [key, value] of placeholders) {
      src = src.replace(key, value);
    }

    return src;
  }

  private escapeHtmlPreservingPlaceholders(text: string, placeholders: Map<string, string>): string {
    // Split on placeholders, escape only non-placeholder parts
    const parts: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      const phStart = remaining.indexOf('\x00PH');
      if (phStart === -1) {
        parts.push(this.escapeHtml(remaining));
        break;
      }

      // Escape text before placeholder
      if (phStart > 0) {
        parts.push(this.escapeHtml(remaining.substring(0, phStart)));
      }

      // Find end of placeholder
      const phEnd = remaining.indexOf('\x00', phStart + 1);
      if (phEnd === -1) {
        parts.push(this.escapeHtml(remaining.substring(phStart)));
        break;
      }

      const phKey = remaining.substring(phStart, phEnd + 1);
      if (placeholders.has(phKey)) {
        parts.push(phKey); // Keep placeholder as-is
      } else {
        parts.push(this.escapeHtml(remaining.substring(phStart, phEnd + 1)));
      }
      remaining = remaining.substring(phEnd + 1);
    }

    return parts.join('');
  }


  // ── Typography ────────────────────────────────────────────

  private applyTypography(text: string): string {
    // Typography runs on raw text (before HTML escaping)
    // Order matters — longer patterns first

    // Arrows (raw chars, not entities)
    text = text.replace(/<->/g, '\u2194');  // <->
    text = text.replace(/<=>/g, '\u21D4');  // <=>
    text = text.replace(/-->/g, '\u2192');  // -->
    text = text.replace(/<--/g, '\u2190');  // <--
    text = text.replace(/==>/g, '\u21D2');  // ==>
    text = text.replace(/<== /g, '\u21D0 ');  // <==

    // Em dash: --- (must be before en dash)
    text = text.replace(/---/g, '\u2014');

    // En dash: -- (between words/numbers or with spaces)
    text = text.replace(/(\w)--(\w)/g, '$1\u2013$2');
    text = text.replace(/\s--\s/g, ' \u2013 ');

    // Ellipsis: ...
    text = text.replace(/\.\.\./g, '\u2026');

    // Symbols
    text = text.replace(/\(tm\)/gi, '\u2122');
    text = text.replace(/\(c\)/gi, '\u00A9');
    text = text.replace(/\(r\)/gi, '\u00AE');

    // Multiplication sign: 10x20 or 10 x 20
    text = text.replace(/(\d)\s*x\s*(\d)/g, '$1\u00D7$2');

    // Non-breaking space after single-char prepositions (Czech typography)
    text = text.replace(/\b([ksvzuoiaKSVZUOIA]) /g, '$1\u00A0');

    return text;
  }

  // ── Modifier parsing ──────────────────────────────────────

  private parseModifierAttrs(modifier: string): string {
    const attrs: string[] = [];

    // .{style} — inline CSS
    const styleMatch = modifier.match(/\{([^}]+)\}/);
    if (styleMatch) attrs.push(`style="${this.escapeHtml(styleMatch[1])}"`);

    // .[class] — CSS class
    const classMatch = modifier.match(/\[([^\]]+)\]/);
    if (classMatch) attrs.push(`class="${this.escapeHtml(classMatch[1])}"`);

    // .#id — element ID
    const idMatch = modifier.match(/#([a-zA-Z][\w-]*)/);
    if (idMatch) attrs.push(`id="${this.escapeHtml(idMatch[1])}"`);

    // .(title) — title attribute
    const titleMatch = modifier.match(/\(([^)]+)\)/);
    if (titleMatch) attrs.push(`title="${this.escapeHtml(titleMatch[1])}"`);

    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  }

  // ── Utilities ─────────────────────────────────────────────

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
