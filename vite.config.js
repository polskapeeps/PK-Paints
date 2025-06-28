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
        'glass-doors': resolve(__dirname, 'glass-doors.html'),
        partitions: resolve(__dirname, 'partitions.html'),
        railings: resolve(__dirname, 'railings.html'),
        'shower-enclosures': resolve(__dirname, 'shower-enclosures.html'),
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
