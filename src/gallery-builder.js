// gallery-builder.js - Compile gallery images without categories.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery.

const imageModules = import.meta.glob('/src/assets/gallery/**/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });

export function buildGallery() {
  let markup = '';
  for (const path in imageModules) {
    const imageUrl = imageModules[path];
    markup += `
      <div class="gallery-item glass-card rounded-xl overflow-hidden">
        <img src="${imageUrl}" loading="lazy" alt="gallery image" onerror="this.parentElement.style.display='none'" />
      </div>
    `;
  }
  return markup;
}

