/**
 * Custom plugin — create your own Texy syntax extension
 */
import { TexyParser } from '@nks-hub/texy-editor';
import type { TexyParserPlugin } from '@nks-hub/texy-editor';

// Custom plugin: convert @username mentions to profile links
const mentionPlugin: TexyParserPlugin = {
  name: 'mentions',

  processInline(text, placeholder) {
    return text.replace(/@([a-zA-Z0-9_]+)/g, (_m, username) => {
      return placeholder(`<a href="/profile/${username}" class="mention">@${username}</a>`);
    });
  },
};

// Custom plugin: convert #hashtags to search links
const hashtagPlugin: TexyParserPlugin = {
  name: 'hashtags',

  processInline(text, placeholder) {
    return text.replace(/#([a-zA-Z0-9_]+)/g, (_m, tag) => {
      return placeholder(`<a href="/search?tag=${tag}" class="hashtag">#${tag}</a>`);
    });
  },
};

// Custom plugin: wrap output in a container
const wrapperPlugin: TexyParserPlugin = {
  name: 'wrapper',

  postprocess(html) {
    return `<div class="texy-content">${html}</div>`;
  },
};

// Custom plugin: preprocess shortcodes before parsing
const shortcodePlugin: TexyParserPlugin = {
  name: 'shortcodes',

  preprocess(text) {
    // Convert [!note] ... [/note] to Texy blockquote
    return text.replace(
      /\[!note\]\s*([\s\S]*?)\s*\[\/note\]/g,
      (_m, content) => `> ${content.replace(/\n/g, '\n> ')}`,
    );
  },
};

// Use all custom plugins together
const parser = new TexyParser({
  plugins: [mentionPlugin, hashtagPlugin, wrapperPlugin, shortcodePlugin],
});

const html = parser.parse(`
Hello @john, check out #typescript!

[!note]
This is a custom note block.
[/note]
`);

console.log(html);
