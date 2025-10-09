import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    appType: 'spa',
    build: {
        manifest: true,
        outDir: path.resolve(__dirname, '../backend/static'), // build to Flask's static folder
        emptyOutDir: true, // clean output directory before every build
        rollupOptions: {
            input: path.resolve(__dirname, 'index.jsx'), // react entry file
            output: { // disable hashed filenames
                entryFileNames: 'js/[name].js', // with hash: "/[name]-[hash].js"
                chunkFileNames: 'js/[name].js',
                assetFileNames: 'assets/[name].[ext]'
            },
        },
    },
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // your backend server
                changeOrigin: true,
                rewrite: path => path, // don't rewrite the path
            },
        },
    },
});