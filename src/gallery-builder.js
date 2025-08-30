// gallery-builder.js - Compile gallery images grouped by category folders.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery.

// Attempt to eagerly import gallery images via Vite's glob import.
// When running without Vite (e.g. viewing the raw HTML files) this call
// will throw, in which case we fall back to loading `gallery.json`.
let imageModules = {};
try {
  imageModules = import.meta.glob(
    './assets/gallery/*/*.{jpg,jpeg,png,webp}',
    {
      eager: true,
      // `as: 'url'` was deprecated in Vite 5+, use `query` with `import`.
      query: '?url',
      import: 'default',
    }
  );
} catch (_) {
  imageModules = {};
}

export async function buildGallery() {
  // Collect images keyed by their first-level folder name
  let imagesByCategory = {};

  if (Object.keys(imageModules).length > 0) {
    for (const path in imageModules) {
      const url = imageModules[path];
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      // Ignore root level painting_### images
      if (fileName.startsWith('painting_')) continue;

      const galleryIdx = parts.indexOf('gallery');
      const category = parts[galleryIdx + 1];
      if (!category || category.startsWith('painting_')) continue;

      if (!imagesByCategory[category]) imagesByCategory[category] = [];
      imagesByCategory[category].push(url);
    }
  } else {
    // Fallback when not running through Vite
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        imagesByCategory = await res.json();
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  const categories = Object.keys(imagesByCategory).sort();

  let markup = '';
  for (const category of categories) {
    const slug = category.toLowerCase().replace(/\s+/g, '-');
    markup += `
      <section id="${slug}" data-category="${slug}" class="mb-12">
        <h2 class="text-3xl font-semibold text-white mb-6 capitalize">${category}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4">
    `;
    for (const imageUrl of imagesByCategory[category]) {
      markup += `
          <div class="gallery-item overflow-hidden fade-in">
            <img src="${imageUrl}" loading="lazy" alt="${category} image" onerror="this.parentElement.style.display='none'" />
          </div>
      `;
    }
    markup += `
        </div>
      </section>
    `;
  }

  return { markup, categories };
}
