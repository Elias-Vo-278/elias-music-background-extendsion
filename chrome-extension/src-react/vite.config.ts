// chrome-extension/src-react/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // *** ADD THIS LINE ***
  base: './', 
  // *********************

  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '..', 'popup'), 
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'popup.js', 
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') {
            return 'popup.html';
          }
          if (assetInfo.name === 'style.css') {
            return 'popup.css'; 
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});