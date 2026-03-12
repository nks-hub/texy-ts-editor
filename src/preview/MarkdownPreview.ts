import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

/**
 * Client-side Markdown preview renderer.
 * Uses markdown-it with highlight.js for syntax-highlighted code blocks.
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
  }

  render(content: string): string {
    return this.md.render(content);
  }
}
