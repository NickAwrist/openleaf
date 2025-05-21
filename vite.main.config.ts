import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            external: ['electron', 'better-sqlite3'],
            output: {
                format: 'cjs',
                entryFileNames: 'main.cjs'
            }
        },
        minify: false,
        outDir: '.vite/build/main',
        emptyOutDir: true,
        // Ensure main is built as CJS
        lib: {
            entry: 'src/main.ts',
            formats: ['cjs'],
            fileName: () => 'main.cjs',
        },
    },
    resolve: {
        // Force CJS for the main process
        conditions: ['node']
    }
});
