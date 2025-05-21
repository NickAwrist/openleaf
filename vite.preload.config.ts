import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        lib: {
            entry: 'src/preload.ts',
            formats: ['cjs'],
            fileName: () => 'preload.cjs',
        },
        outDir: '.vite/build',
        emptyOutDir: false,
        rollupOptions: {
            external: ['electron'],
        },
    },
});
