/**
 * Standalone parser — use TexyParser without the editor UI
 */
import { TexyParser } from '@nks-hub/texy-editor';

const parser = new TexyParser({
  enableTypography: true,
  enableAutolinks: true,
});

// Parse Texy markup to HTML
const html = parser.parse(`
Heading
=======

This is a paragraph with **bold**, *italic*, and \`inline code\`.

- First item
- Second item
- Third item

/--code javascript
function hello() {
  return 'world';
}
\\--

"Link text":https://example.com

[* https://example.com/image.jpg .(Alt text) *]

| Name   | Role      |
|--------|-----------|
| Alice  | Developer |
| Bob    | Designer  |
`);

console.log(html);

// Parse inline content only (no block wrapping)
const inline = parser.parseInline('**bold** and *italic*');
console.log(inline); // <strong>bold</strong> and <em>italic</em>
