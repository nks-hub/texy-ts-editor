import type { TexyParserPlugin } from '../../types';
import { escapeHtml, sanitizeUrl } from '../../utils/escapeHtml';

/**
 * BBCode plugin for TexyParser.
 *
 * Converts common BBCode tags to HTML:
 *   [b]text[/b] → <strong>text</strong>
 *   [i]text[/i] → <em>text</em>
 *   [u]text[/u] → <u>text</u>
 *   [s]text[/s] → <del>text</del>
 *   [url=...]text[/url] → <a href="...">text</a>
 *   [color=...]text[/color] → <span style="color:...">text</span>
 *
 * Useful for forums and chat applications that support BBCode alongside Texy.
 */
export function bbcodePlugin(): TexyParserPlugin {
  return {
    name: 'bbcode',

    processInline(text: string, placeholder: (html: string) => string): string {
      // [b]text[/b]
      text = text.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, (_m, content) =>
        placeholder(`<strong>${content}</strong>`),
      );

      // [i]text[/i]
      text = text.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, (_m, content) =>
        placeholder(`<em>${content}</em>`),
      );

      // [u]text[/u]
      text = text.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, (_m, content) =>
        placeholder(`<u>${content}</u>`),
      );

      // [s]text[/s]
      text = text.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, (_m, content) =>
        placeholder(`<del>${content}</del>`),
      );

      // [url=URL]text[/url]
      text = text.replace(
        /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
        (_m, url, content) => {
          const safeUrl = sanitizeUrl(url);
          return placeholder(`<a href="${safeUrl}">${escapeHtml(content)}</a>`);
        },
      );

      // [color=COLOR]text[/color]
      text = text.replace(
        /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi,
        (_m, color, content) => {
          const safeColor = escapeHtml(color.replace(/[;"'{}()]/g, ''));
          return placeholder(`<span style="color:${safeColor}">${escapeHtml(content)}</span>`);
        },
      );

      return text;
    },
  };
}
