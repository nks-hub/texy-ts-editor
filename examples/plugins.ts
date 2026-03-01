/**
 * Plugin usage — extend parser with custom syntax
 */
import { TexyParser, youtubePlugin, smileyPlugin, bbcodePlugin, linkRedirectPlugin, imageEmbedPlugin } from '@nks-hub/texy-editor';

// Create parser with plugins
const parser = new TexyParser({
  plugins: [
    // YouTube embeds: [* youtube:VIDEO_ID *]
    youtubePlugin({ width: 560, height: 315 }),

    // Smiley images: *123*
    smileyPlugin({
      baseUrl: 'https://example.com/smileys',
      format: 'gif',
      ariaLabels: { '1': 'smile', '2': 'laugh', '3': 'wink' },
    }),

    // BBCode tags: [b], [i], [u], [s], [url=], [color=]
    bbcodePlugin(),

    // Linked images: "[* img *]":URL
    imageEmbedPlugin({ maxWidth: '400px' }),

    // Redirect external links through a proxy
    linkRedirectPlugin({
      redirectUrl: 'https://example.com/redirect',
      excludeDomains: ['example.com'],
    }),
  ],
});

// Parse Texy markup with all plugins active
const html = parser.parse(`
**Bold text** and *italic*

[* youtube:dQw4w9WgXcQ *]

*1* Hello! *2*

[b]BBCode bold[/b] and [color=red]red text[/color]

"Visit us":https://external-site.com
`);

console.log(html);
