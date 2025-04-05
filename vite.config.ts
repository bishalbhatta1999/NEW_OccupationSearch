import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        widget: path.resolve(__dirname, 'widget.html'),
      },
      output: {
        // Ensure widget files are built with predictable names
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'widget') {
            return 'js/[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
  preview: {
    port: 4173,
    open: true
  }
});