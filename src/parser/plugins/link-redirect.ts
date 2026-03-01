import type { TexyParserPlugin } from '../../types';

export interface LinkRedirectPluginOptions {
  /** Redirect service base URL (required) */
  redirectUrl: string;
  /** Domains to exclude from redirect (e.g., own domain) */
  excludeDomains?: string[];
  /** Add target="_blank" to external links (default: true) */
  targetBlank?: boolean;
  /** Add rel="noopener noreferrer" (default: true) */
  noopener?: boolean;
}

/**
 * Link redirect plugin for TexyParser.
 *
 * Rewrites external links to go through a redirect service,
 * useful for tracking and safety. Adds target="_blank" to external links.
 */
export function linkRedirectPlugin(options: LinkRedirectPluginOptions): TexyParserPlugin {
  const redirectUrl = options.redirectUrl;
  const excludeDomains = options.excludeDomains ?? [];
  const targetBlank = options.targetBlank !== false;
  const noopener = options.noopener !== false;

  return {
    name: 'link-redirect',

    postprocess(html: string): string {
      return html.replace(
        /<a\s+href="(https?:\/\/[^"]+)"/g,
        (_m, url) => {
          // Check if domain should be excluded
          try {
            const hostname = new URL(url).hostname;
            if (excludeDomains.some((d) => hostname === d || hostname.endsWith('.' + d))) {
              return _m;
            }
          } catch {
            return _m;
          }

          const encodedUrl = encodeURIComponent(url);
          const attrs: string[] = [`href="${redirectUrl}?url=${encodedUrl}"`];
          if (targetBlank) attrs.push('target="_blank"');
          if (noopener) attrs.push('rel="noopener noreferrer"');

          return `<a ${attrs.join(' ')}`;
        },
      );
    },
  };
}
