import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { rmSync } from 'fs';

export default defineConfig({
  // Use relative base so the site works on both custom domains and GitHub Pages
  base: './',
  plugins: [
    tailwindcss(),
    {
      name: 'remove-unused-legacy-logo',
      closeBundle() {
        rmSync(resolve(__dirname, 'dist/assets/icons/logo.png'), { force: true });
      },
    },
  ],
  // Tailwind runs as the Vite plugin above. An inline (empty) PostCSS config stops Vite from
  // using a postcss.config.* found in a parent folder, such as the main checkout of a worktree.
  css: { postcss: {} },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        'exterior-painting': resolve(__dirname, 'exterior-painting.html'),
        'custom-trim': resolve(__dirname, 'carpentry.html'),
        'interior-painting': resolve(__dirname, 'interior-painting.html'),
        'request-estimate': resolve(__dirname, 'request-estimate.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp', '**/*.svg', '**/*.gif'],
});
