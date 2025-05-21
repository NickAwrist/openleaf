import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            external: ['electron'],
            output: {
                format: 'cjs',
                entryFileNames: 'preload.cjs'
            }
        },
        minify: false,
        outDir: '.vite/build/preload',
        emptyOutDir: false,
        // Ensure preload is built as CJS
        lib: {
            entry: 'src/preload.ts',
            formats: ['cjs'],
            fileName: () => 'preload.cjs',
        },
    },
    resolve: {
        // Force CJS for the preload script
        conditions: ['node']
    }
});
