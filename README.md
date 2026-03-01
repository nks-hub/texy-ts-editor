# @nks-hub/texy-editor

[![Build Status](https://github.com/nks-hub/texy-ts-editor/actions/workflows/build.yml/badge.svg)](https://github.com/nks-hub/texy-ts-editor/actions)
[![npm version](https://img.shields.io/npm/v/@nks-hub/texy-editor.svg)](https://www.npmjs.com/package/@nks-hub/texy-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Modern TypeScript Texy markup editor with configurable toolbar, client-side parser, live preview, theming, and plugin system. Zero jQuery dependency. Spiritual successor to [Texyla](https://github.com/janmarek/Texyla).

---

## Why Texy Editor?

[Texy](https://texy.info) is a powerful markup language created by [David Grudl](https://davidgrudl.com/) that goes beyond Markdown with underline headings, advanced image syntax, modifiers, typography rules, and more. The original [Texyla editor](https://github.com/janmarek/Texyla) by Jan Marek provided a jQuery-based frontend for Texy, but hasn't been actively maintained for years.

This project is a **modern rewrite from scratch** — zero jQuery, pure TypeScript, with a client-side parser and extensible plugin system:

- **TypeScript-first** — Fully typed API, exported types for all options
- **Zero dependencies** — No jQuery, no external libraries
- **Client-side parser** — Live preview without server round-trips
- **Plugin system** — Extend with custom syntax (YouTube, smileys, BBCode, etc.)
- **Themeable** — Light/dark themes via CSS custom properties
- **Dual output** — ESM + CJS builds, tree-shakeable

---

## Live Demo

Try the interactive playground: **[nks-hub.github.io/texy-ts-editor](https://nks-hub.github.io/texy-ts-editor/)**

---

## Quick Start

### Installation

```bash
npm install @nks-hub/texy-editor
```

### Attach to a Textarea

```typescript
import { TexyEditor } from '@nks-hub/texy-editor';
import '@nks-hub/texy-editor/css';

const editor = new TexyEditor('#my-textarea', {
  language: 'en',
  theme: 'light',
  livePreview: true,
});
```

### Standalone Parser (No UI)

```typescript
import { TexyParser } from '@nks-hub/texy-editor';

const parser = new TexyParser();
const html = parser.parse('**bold** and *italic*');
// <p><strong>bold</strong> and <em>italic</em></p>
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Full Texy Syntax** | Bold, italic, headings, lists, tables, code blocks, images, links, blockquotes, modifiers |
| **Typography** | Smart dashes, ellipsis, arrows, symbols, Czech non-breaking spaces |
| **Live Preview** | Client-side rendering with configurable debounce |
| **Toolbar** | Configurable button groups, custom buttons, keyboard shortcuts |
| **Keyboard Shortcuts** | Ctrl+B, Ctrl+I, Tab indent, F11 fullscreen, customizable |
| **Undo/Redo** | Built-in history with configurable max steps |
| **i18n** | English and Czech built-in, extensible to any language |
| **Themes** | Light and dark presets, CSS custom properties for full control |
| **Plugin System** | Preprocess, inline, and postprocess hooks with placeholder protection |
| **Split View** | Side-by-side editor + preview mode |
| **Fullscreen** | Distraction-free editing mode |

---

## Supported Texy Syntax

### Inline

| Syntax | Output |
|--------|--------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | `code` |
| `--deleted--` | ~~deleted~~ |
| `++inserted++` | <u>inserted</u> |
| `^^super^^` | superscript |
| `__sub__` | subscript |
| `>>quoted<<` | quoted |
| `"text":https://url` | link |
| `[* image.jpg *]` | image |
| `word((title))` | abbreviation |
| `''noTexy zone''` | raw text |

### Block

| Syntax | Output |
|--------|--------|
| Underline heading (`===`) | `<h1>`–`<h4>` |
| Surrounded heading (`=== text ===`) | `<h1>`–`<h4>` |
| `- item` | unordered list |
| `1) item` | ordered list |
| `> quote` | blockquote |
| `/--code lang` ... `\--` | code block |
| `/--html` ... `\--` | raw HTML |
| `/--div .class` ... `\--` | div with modifier |
| `\| cell \| cell \|` | table |
| `---` or `***` | horizontal rule |

---

## Plugins

Extend the parser with built-in or custom plugins.

### Built-in Plugins

```typescript
import {
  TexyParser,
  youtubePlugin,
  smileyPlugin,
  bbcodePlugin,
  imageEmbedPlugin,
  linkRedirectPlugin,
} from '@nks-hub/texy-editor';

const parser = new TexyParser({
  plugins: [
    youtubePlugin({ width: 560, height: 315 }),
    smileyPlugin({ baseUrl: 'https://example.com/smileys' }),
    bbcodePlugin(),
    imageEmbedPlugin({ maxWidth: '400px' }),
    linkRedirectPlugin({
      redirectUrl: 'https://example.com/redirect',
      excludeDomains: ['example.com'],
    }),
  ],
});
```

| Plugin | Syntax | Description |
|--------|--------|-------------|
| `youtubePlugin` | `[* youtube:ID *]` | YouTube video embeds |
| `smileyPlugin` | `*123*` | Numeric smiley/emoticon images |
| `bbcodePlugin` | `[b]`, `[i]`, `[u]`, `[s]`, `[url=]`, `[color=]` | BBCode tag support |
| `imageEmbedPlugin` | `"[* img *]":URL` | Linked image embeds |
| `linkRedirectPlugin` | — (postprocess) | Rewrite external links through redirect service |

### Custom Plugin

```typescript
import type { TexyParserPlugin } from '@nks-hub/texy-editor';

const mentionPlugin: TexyParserPlugin = {
  name: 'mentions',
  processInline(text, placeholder) {
    return text.replace(/@([a-zA-Z0-9_]+)/g, (_m, user) =>
      placeholder(`<a href="/profile/${user}">@${user}</a>`)
    );
  },
};

const parser = new TexyParser({ plugins: [mentionPlugin] });
```

**Plugin hooks:**

| Hook | Stage | Use case |
|------|-------|----------|
| `preprocess(text)` | Before parsing | Convert custom syntax to Texy or placeholders |
| `processInline(text, ph)` | During inline pass | Generate HTML with placeholder protection |
| `postprocess(html)` | After parsing | Transform final HTML output |

---

## Editor Options

```typescript
const editor = new TexyEditor('#textarea', {
  language: 'en',              // 'en' | 'cs' | custom
  theme: 'light',              // 'light' | 'dark' | custom class
  livePreview: true,           // Client-side preview
  livePreviewDelay: 300,       // Debounce ms
  splitView: true,             // Side-by-side mode
  fullscreen: true,            // Enable F11 fullscreen
  autoResize: true,            // Auto-grow textarea
  maxUndoSteps: 50,            // Undo history limit
  previewPath: '/api/preview', // Server-side preview URL
  toolbar: ['bold', 'italic', null, 'link', 'image'],
  shortcuts: { bold: 'Ctrl+B' },
  plugins: [],
  cssVars: { '--texy-accent': '#0066cc' },
});
```

---

## Build Outputs

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `dist/texy-editor.js` | ESM | ~66 KB | Modern bundlers (Vite, webpack, Rollup) |
| `dist/texy-editor.cjs` | CJS | ~47 KB | Node.js / `require()` |
| `dist/texy-editor.css` | CSS | ~10 KB | Base stylesheet with theme support |
| `dist/types/` | `.d.ts` | — | TypeScript type declarations |

---

## Development

```bash
# Install dependencies
npm install

# Dev server with playground
npm run dev

# Run tests (229 tests)
npm test

# Type checking
npm run typecheck

# Production build
npm run build

# Watch mode
npm run test:watch
```

---

## Requirements

- **Node.js**: 18+ recommended
- **TypeScript**: 5.0+ (for TypeScript projects)
- **Browsers**: Modern browsers with ES6 support

---

## License

MIT License — see [LICENSE](LICENSE) file for details.

---

## Links

- [Texy Markup Language](https://texy.info) — The original Texy PHP library by David Grudl
- [Texyla](https://github.com/janmarek/Texyla) — The original jQuery-based Texy editor (archived)
- [Nette Framework](https://nette.org) — PHP framework commonly used with Texy
- [GitHub Repository](https://github.com/nks-hub/texy-ts-editor)
- [npm Package](https://www.npmjs.com/package/@nks-hub/texy-editor)
- [Issue Tracker](https://github.com/nks-hub/texy-ts-editor/issues)

---

**Built for Texy** — A modern successor to Texyla, built from scratch in TypeScript.
