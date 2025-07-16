// gallery-builder.js - Compile gallery images without categories.
// Uses Vite's import.meta.glob at build time. Falls back to a static list when
// run directly in the browser without bundling.

import galleryList from './gallery-list.js';

let imageModules;
try {
  imageModules = import.meta.glob('/src/assets/gallery/**/*.{jpg,jpeg,png,webp}', {
    eager: true,
    as: 'url',
  });
} catch (e) {
  imageModules = null;
}

export function buildGallery() {
  let markup = '';
  if (imageModules && Object.keys(imageModules).length) {
    for (const path in imageModules) {
      const imageUrl = imageModules[path];
      markup += `
        <div class="gallery-item glass-card rounded-xl overflow-hidden">
          <img src="${imageUrl}" loading="lazy" alt="gallery image" onerror="this.parentElement.style.display='none'" />
        </div>
      `;
    }
  } else {
    for (const imageUrl of galleryList) {
      markup += `
        <div class="gallery-item glass-card rounded-xl overflow-hidden">
          <img src="${imageUrl}" loading="lazy" alt="gallery image" onerror="this.parentElement.style.display='none'" />
        </div>
      `;
    }
  }
  return markup;
}

