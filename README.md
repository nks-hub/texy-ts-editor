# @nks-hub/texy-editor

[![Build Status](https://github.com/nks-hub/texy-ts-editor/actions/workflows/build.yml/badge.svg)](https://github.com/nks-hub/texy-ts-editor/actions)
[![npm version](https://img.shields.io/npm/v/@nks-hub/texy-editor.svg)](https://www.npmjs.com/package/@nks-hub/texy-editor)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-677%20passed-brightgreen.svg)](https://github.com/nks-hub/texy-ts-editor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Browser editor for the Texy markup language, written in TypeScript: configurable toolbar, client-side parser, live preview, themes and plugins, no jQuery. Successor to [Texyla](https://github.com/janmarek/Texyla).

[Texy](https://texy.info) is a markup language by [David Grudl](https://davidgrudl.com/). Compared to Markdown it adds underline headings, an extended image syntax, modifiers and typography rules. Jan Marek's [Texyla editor](https://github.com/janmarek/Texyla) was the jQuery frontend for Texy and has not been maintained for years.

This package is a rewrite with no runtime dependencies. All options have exported types, the parser renders the preview without a server round-trip, and the build ships tree-shakeable ESM and CJS. Plugins add custom syntax such as YouTube embeds, smileys or BBCode, and themes are CSS custom properties.

Try the interactive playground: **[nks-hub.github.io/texy-ts-editor](https://nks-hub.github.io/texy-ts-editor/)**

## Features

- 📝 **Texy syntax** - Bold, italic, headings, lists, tables, code blocks, images, links, blockquotes, modifiers
- ✒️ **Typography** - Converts dashes, ellipsis, arrows and symbols, inserts Czech non-breaking spaces
- 👁️ **Live preview** - Renders in the browser with a configurable debounce
- 🧰 **Toolbar** - Configurable button groups, custom buttons, keyboard shortcuts
- ⌨️ **Keyboard shortcuts** - Ctrl+B, Ctrl+I, Tab indent, F11 fullscreen, all remappable
- ↩️ **Undo/redo** - History with a configurable step limit
- 🌍 **i18n** - English and Czech included, other languages can be added
- 🎨 **Themes** - Light and dark presets built on CSS custom properties
- 🧩 **Plugin system** - Preprocess, inline, and postprocess hooks with placeholder protection
- 🪟 **Split view** - Editor and preview side by side
- 🖥️ **Fullscreen** - Editor fills the browser window

## Requirements

- **Node.js**: 18+ recommended
- **TypeScript**: 5.0+ (for TypeScript projects)
- **Browsers**: ES6 support

## Installation

```bash
npm install @nks-hub/texy-editor
```

## Usage

### Attach to a textarea

```typescript
import { TexyEditor } from '@nks-hub/texy-editor';
import '@nks-hub/texy-editor/css';

const editor = new TexyEditor('#my-textarea', {
  language: 'en',
  theme: 'light',
  livePreview: true,
});
```

### Standalone parser (no UI)

```typescript
import { TexyParser } from '@nks-hub/texy-editor';

const parser = new TexyParser();
const html = parser.parse('**bold** and *italic*');
// <p><strong>bold</strong> and <em>italic</em></p>
```

## Editor options

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

## Supported Texy syntax

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

## Plugins

Extend the parser with built-in or custom plugins.

### Built-in plugins

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
| `linkRedirectPlugin` | none (postprocess) | Rewrite external links through redirect service |

### Custom plugin

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

## Build outputs

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `dist/texy-editor.js` | ESM | ~66 KB | Bundlers (Vite, webpack, Rollup) |
| `dist/texy-editor.cjs` | CJS | ~47 KB | Node.js / `require()` |
| `dist/texy-editor.css` | CSS | ~10 KB | Base stylesheet with theme support |
| `dist/types/` | `.d.ts` | n/a | TypeScript type declarations |

## Development

```bash
# Install dependencies
npm install

# Dev server with playground
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Production build
npm run build

# Watch mode
npm run test:watch
```

## Contributing

Contributions are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: description'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📧 **Email:** dev@nks-hub.cz
- 🐛 **Bug reports:** [GitHub Issues](https://github.com/nks-hub/texy-ts-editor/issues)
- 📖 **Texy syntax:** [texy.nette.org](https://texy.nette.org/cs/syntax)
- 🎮 **Live demo:** [nks-hub.github.io/texy-ts-editor](https://nks-hub.github.io/texy-ts-editor/)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/nks-hub">NKS Hub</a>
</p>
