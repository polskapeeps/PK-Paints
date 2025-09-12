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
} catch {
  imageModules = {};
}

export async function buildGallery() {
  // Collect images keyed by category slug
  const imagesByCategory = {};
  const coverByCategory = {};
  const categoriesSet = new Set();

  if (Object.keys(imageModules).length > 0) {
    for (const path in imageModules) {
      const url = imageModules[path];
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      // Ignore root level painting_### images
      if (fileName.startsWith('painting_')) continue;

        const galleryIdx = parts.indexOf('gallery');
        const categoryName = parts[galleryIdx + 1];
        if (!categoryName || categoryName.startsWith('painting_')) continue;

        const displayName = categoryName === 'Carpentry' ? 'Custom Installs' : categoryName;
        const slug = displayName.toLowerCase().replace(/\s+/g, '-');
        categoriesSet.add(JSON.stringify({ name: displayName, slug }));
        if (!imagesByCategory[slug]) imagesByCategory[slug] = [];
        imagesByCategory[slug].push(url);
      // Detect a cover image if file named like cover.* exists
      const isCover = /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i.test(fileName);
      if (isCover) coverByCategory[slug] = url;
    }
  } else {
    // Fallback when not running through Vite
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        const data = await res.json();
          for (const categoryName in data) {
            const displayName = categoryName === 'Carpentry' ? 'Custom Installs' : categoryName;
            const slug = displayName.toLowerCase().replace(/\s+/g, '-');
            categoriesSet.add(JSON.stringify({ name: displayName, slug }));
            imagesByCategory[slug] = data[categoryName];
          // If any file name within the list matches cover.* use it as cover
          const cover = (data[categoryName] || []).find((p) =>
            /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i.test(p)
          );
          if (cover) coverByCategory[slug] = cover;
        }
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  // Sort image URLs within each category to ensure predictable ordering
  for (const slug in imagesByCategory) {
    imagesByCategory[slug].sort((a, b) => a.localeCompare(b));
  }

  const categories = Array.from(categoriesSet)
    .map((c) => JSON.parse(c))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { categories, imagesByCategory, coverByCategory };
}
