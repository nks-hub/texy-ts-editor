import type { TexyParserPlugin } from '../../types';

export interface SmileyPluginOptions {
  /** Base URL for smiley images (required) */
  baseUrl: string;
  /** Image format extension (default: 'gif') */
  format?: string;
  /** Optional ARIA labels map: smiley ID → label text */
  ariaLabels?: Record<string, string>;
  /** CSS class for smiley images */
  className?: string;
}

/**
 * Smiley/emoticon plugin for TexyParser.
 *
 * Converts *ID* syntax to smiley images:
 *   *123* → <img src="baseUrl/123.gif" alt="smiley" class="smiley">
 */
export function smileyPlugin(options: SmileyPluginOptions): TexyParserPlugin {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const format = options.format ?? 'gif';
  const ariaLabels = options.ariaLabels ?? {};
  const className = options.className ?? 'smiley';

  return {
    name: 'smiley',

    processInline(text: string, placeholder: (html: string) => string): string {
      // Match *ID* where ID is 1-6 digits, but NOT inside ** (bold markers)
      return text.replace(
        /(?<!\*)\*(\d{1,6})\*(?!\*)/g,
        (_m, id) => {
          const label = ariaLabels[id] ?? 'smiley';
          const img = `<img src="${baseUrl}/${id}.${format}" alt="${label}" class="${className}">`;
          return placeholder(img);
        },
      );
    },
  };
}
