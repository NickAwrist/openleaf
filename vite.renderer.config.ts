import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  root: path.resolve(__dirname, 'src/renderer'),
  publicDir: path.resolve(__dirname, 'src/renderer/public'),
  build: {
    outDir: path.resolve(__dirname, '.vite/renderer'),
    emptyOutDir: true
  }
});
