// gallery-builder.js - Compile gallery images without categories.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery.

let imageModules = {};
if (import.meta && typeof import.meta.glob === 'function') {
  imageModules = import.meta.glob('/src/assets/gallery/**/*.{jpg,jpeg,png,webp}', {
    eager: true,
    as: 'url',
  });
}

export async function buildGallery() {
  let images = [];
  if (Object.keys(imageModules).length > 0) {
    for (const path in imageModules) {
      images.push(imageModules[path]);
    }
  } else {
    // Fallback when not running through Vite
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        images = await res.json();
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  let markup = '';
  for (const imageUrl of images) {
    markup += `
      <div class="gallery-item glass-card rounded-xl overflow-hidden">
        <img src="${imageUrl}" loading="lazy" alt="gallery image" onerror="this.parentElement.style.display='none'" />
      </div>
    `;
  }
  return markup;
}

