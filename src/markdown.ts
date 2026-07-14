// Markdown entry point — '@nks-hub/texy-editor/markdown'
//
// Pulls in markdown-it + highlight.js. Import from here ONLY when you need
// Markdown support; the core '@nks-hub/texy-editor' entry stays dependency-free.
//
//   import { MarkdownMode, MarkdownPreview } from '@nks-hub/texy-editor/markdown';
//   new TexyEditor(textarea, { syntaxMode: new MarkdownMode(), preview: new MarkdownPreview() });
export { MarkdownMode } from './modes/MarkdownMode';
export { MarkdownPreview } from './preview/MarkdownPreview';
