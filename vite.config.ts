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
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'TexyEditor',
        formats: ['es', 'cjs'],
        fileName: (format) => `texy-editor.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'texy-editor.css';
            return assetInfo.name ?? 'asset';
          },
        },
      },
      sourcemap: true,
      minify: 'esbuild',
    },
  };
});
