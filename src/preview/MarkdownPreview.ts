import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import markdownItMark from 'markdown-it-mark';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTaskLists from 'markdown-it-task-lists';

/**
 * Client-side Markdown preview renderer.
 * Uses markdown-it with highlight.js for syntax-highlighted code blocks.
 * Includes GFM task lists, highlight (==mark==), and footnotes.
 */
export class MarkdownPreview {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch {
            // fall through to default escaping
          }
        }
        return '';
      },
    });

    this.md.use(markdownItMark);
    this.md.use(markdownItFootnote);
    this.md.use(markdownItTaskLists, { enabled: true, label: true });
  }

  render(content: string): string {
    return this.md.render(content);
  }
}
