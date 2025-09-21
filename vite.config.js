import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Use relative base so the site works on both custom domains and GitHub Pages
  base: './',
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
      },
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.svg', '**/*.gif'],
});
