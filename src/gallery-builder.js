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

const normalizeCategoryName = (name) => {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim();
  return trimmed === 'Carpentry' ? 'Custom Installs' : trimmed;
};

const slugifyCategory = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isCoverImage = (fileName) =>
  /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i.test(fileName || '');

export async function buildGallery() {
  const imagesByCategory = {};
  const coverByCategory = {};
  const categoriesBySlug = new Map();

  const ensureCategory = (categoryName) => {
    if (!categoryName || categoryName === 'Commercial') {
      return null;
    }

    const displayName = normalizeCategoryName(categoryName);
    if (!displayName) {
      return null;
    }

    const slug = slugifyCategory(displayName);
    if (!slug) {
      return null;
    }

    if (!imagesByCategory[slug]) {
      imagesByCategory[slug] = [];
    }

    categoriesBySlug.set(slug, displayName);
    return { slug, displayName };
  };

  const registerImage = (categoryName, url, fileName) => {
    const category = ensureCategory(categoryName);
    if (!category || typeof url !== 'string' || url.length === 0) {
      return;
    }

    imagesByCategory[category.slug].push(url);
    if (!coverByCategory[category.slug] && isCoverImage(fileName)) {
      coverByCategory[category.slug] = url;
    }
  };

  if (Object.keys(imageModules).length > 0) {
    for (const [path, url] of Object.entries(imageModules)) {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      if (!fileName || fileName.startsWith('painting_')) continue;

      const galleryIdx = parts.indexOf('gallery');
      if (galleryIdx === -1) continue;

      const categoryName = parts[galleryIdx + 1];
      if (!categoryName || categoryName.startsWith('painting_')) continue;

      registerImage(categoryName, url, fileName);
    }
  } else {
    // Fallback when not running through Vite
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          for (const [categoryName, urls] of Object.entries(data)) {
            const category = ensureCategory(categoryName);
            if (!category) continue;

            const validUrls = Array.isArray(urls)
              ? urls.filter((value) => typeof value === 'string' && value.length > 0)
              : [];

            for (const value of validUrls) {
              const fileName = value.split('/').pop();
              registerImage(categoryName, value, fileName);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  // Sort and deduplicate image URLs within each category to ensure predictable ordering
  for (const slug of Object.keys(imagesByCategory)) {
    const uniqueUrls = Array.from(new Set(imagesByCategory[slug]));
    uniqueUrls.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = uniqueUrls;
  }

  const categories = Array.from(categoriesBySlug.entries())
    .map(([slug, name]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { categories, imagesByCategory, coverByCategory };
}
