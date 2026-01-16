import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
    return {
        appType: 'spa',
        base: command === 'build' ? '/static/' : '/', // serve files under '/static/' for deployed project
        root: path.resolve(__dirname), // ensure root is the frontend folder
        build: {
            outDir: path.resolve(__dirname, 'dist'), // compile to 'dist/' folder
            emptyOutDir: true, // clean output directory before every build
            rollupOptions: {
                input: path.resolve(__dirname, 'index.jsx'), // react entry file
                output: { // disable hashed filenames
                    entryFileNames: 'index.js',
                    chunkFileNames: 'assets/[hash]-[name].js', // with hash: "/[name]-[hash].js"
                    assetFileNames: '[name].[ext]'
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
    }
});