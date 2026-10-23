import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), vue()],
  build: {
    outDir: 'demo-dist',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        vanilla: fileURLToPath(new URL('./demo/vanilla.html', import.meta.url)),
        react: fileURLToPath(new URL('./demo/react.html', import.meta.url)),
        vue: fileURLToPath(new URL('./demo/vue.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      'js-gesture': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
});
