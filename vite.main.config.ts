import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'better-sqlite3'],
    },
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.cjs',
    },
    outDir: '.vite/build',
    emptyOutDir: true, 
  }
});
