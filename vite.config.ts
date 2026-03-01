import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'playground') {
    return {
      root: 'playground',
      resolve: {
        alias: { '@': resolve(__dirname, 'src') },
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
