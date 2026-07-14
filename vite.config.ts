import { defineConfig } from 'vite';
import { resolve } from 'path';
import { execSync } from 'child_process';

function gitCommitShort(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig(({ mode }) => {
  if (mode === 'playground') {
    return {
      root: 'playground',
      resolve: {
        alias: { '@': resolve(__dirname, 'src') },
      },
    };
  }

  if (mode === 'demo') {
    return {
      root: 'playground',
      base: '/texy-ts-editor/',
      resolve: {
        alias: { '@': resolve(__dirname, 'src') },
      },
      define: {
        __GIT_COMMIT__: JSON.stringify(gitCommitShort()),
      },
      build: {
        outDir: resolve(__dirname, 'demo-dist'),
        emptyOutDir: true,
      },
    };
  }

  return {
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    build: {
      lib: {
        entry: {
          'texy-editor': resolve(__dirname, 'src/index.ts'),
          markdown: resolve(__dirname, 'src/markdown.ts'),
        },
        formats: ['es', 'cjs'],
        fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        // markdown-it (+ its plugins) is bundled INTO the markdown entry so the
        // '/markdown' chunk is self-contained — consumers' own chunk splitting
        // can't sever the markdown-it reference. highlight.js stays external:
        // it's large, shared, and consumers dedupe it in their own vendor chunk.
        external: [
          'highlight.js',
          'highlight.js/lib/core',
        ],
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'texy-editor.css';
            return assetInfo.name ?? 'asset';
          },
          globals: {
            'highlight.js': 'hljs',
          },
        },
      },
      sourcemap: true,
      minify: 'esbuild',
    },
  };
});
