import type { TexyParserPlugin } from '../../types';
import { escapeHtml, sanitizeUrl } from '../../utils/escapeHtml';

/**
 * Replaces every [tag]content[/tag] (or [tag=param]content[/tag]) pair, case-insensitively,
 * pairing each opening tag with the nearest closing one.
 *
 * Scans by index instead of /\[tag\]([\s\S]*?)\[\/tag\]/: that regex rescans the rest of
 * the input from every unclosed opening tag, which is quadratic on hostile input.
 */
function replacePairs(
  text: string,
  tag: string,
  withParam: boolean,
  render: (content: string, param: string) => string,
): string {
  const open = new RegExp(`\\[${tag}${withParam ? '=' : '\\]'}`, 'gi');
  const close = new RegExp(`\\[/${tag}\\]`, 'gi');
  let out = '';
  let done = 0;
  let match: RegExpExecArray | null;
  while ((match = open.exec(text))) {
    let contentStart = open.lastIndex;
    let param = '';
    if (withParam) {
      const paramEnd = text.indexOf(']', contentStart);
      if (paramEnd === -1) break;
      param = text.slice(contentStart, paramEnd);
      if (!param) continue;
      contentStart = paramEnd + 1;
    }
    close.lastIndex = contentStart;
    const end = close.exec(text);
    // No closing tag after this opening one means none after any later one either
    if (!end) break;
    out += text.slice(done, match.index) + render(text.slice(contentStart, end.index), param);
    done = open.lastIndex = close.lastIndex;
  }
  return out + text.slice(done);
}

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
      const simple: Array<[string, string]> = [['b', 'strong'], ['i', 'em'], ['u', 'u'], ['s', 'del']];
      for (const [tag, element] of simple) {
        text = replacePairs(text, tag, false, (content) =>
          placeholder(`<${element}>${escapeHtml(content)}</${element}>`),
        );
      }

      text = replacePairs(text, 'url', true, (content, url) =>
        placeholder(`<a href="${sanitizeUrl(url)}">${escapeHtml(content)}</a>`),
      );

      text = replacePairs(text, 'color', true, (content, color) => {
        const safeColor = escapeHtml(color.replace(/[;"'{}()]/g, ''));
        return placeholder(`<span style="color:${safeColor}">${escapeHtml(content)}</span>`);
      });

      return text;
    },
  };
}
