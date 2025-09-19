// gallery-builder.js - Compile gallery images grouped by category folders.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery and
// falls back to public/gallery.json when not running through the Vite server.

const COVER_IMAGE_REGEX = /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i;
const ROOT_IMAGE_PREFIX = 'painting_';
const EXCLUDED_CATEGORY = 'Commercial';

const createEmptyResult = () => ({
  categories: [],
  imagesByCategory: {},
  coverByCategory: {},
});

const normalizeCategoryName = (name) => {
  if (typeof name !== 'string') return '';

  const trimmed = name.trim();
  if (
    trimmed.length === 0 ||
    trimmed === EXCLUDED_CATEGORY ||
    trimmed.startsWith(ROOT_IMAGE_PREFIX)
  ) {
    return '';
  }

  return trimmed === 'Carpentry' ? 'Custom Installs' : trimmed;
};

const slugifyCategory = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isCoverImage = (fileName = '') => COVER_IMAGE_REGEX.test(fileName);

const normalizeImageUrl = (url) =>
  typeof url === 'string' ? url.trim() : '';

let imageModules = {};
try {
  imageModules = import.meta.glob('./assets/gallery/*/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  });
} catch {
  imageModules = {};
}

export async function buildGallery() {
  const imagesByCategory = {};
  const coverByCategory = {};
  const categoriesBySlug = new Map();

  const ensureCategory = (categoryName) => {
    const displayName = normalizeCategoryName(categoryName);
    if (!displayName) return null;

    const slug = slugifyCategory(displayName);
    if (!slug) return null;

    if (!imagesByCategory[slug]) {
      imagesByCategory[slug] = [];
    }

    categoriesBySlug.set(slug, displayName);
    return { slug, name: displayName };
  };

  const registerImage = (categoryName, url, fileName = '') => {
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) return;

    const category = ensureCategory(categoryName);
    if (!category) return;

    imagesByCategory[category.slug].push(normalizedUrl);

    if (!coverByCategory[category.slug] && isCoverImage(fileName)) {
      coverByCategory[category.slug] = normalizedUrl;
    }
  };

  if (Object.keys(imageModules).length > 0) {
    for (const [path, url] of Object.entries(imageModules)) {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1] || '';

      if (!fileName || fileName.startsWith(ROOT_IMAGE_PREFIX)) continue;

      const galleryIdx = parts.indexOf('gallery');
      if (galleryIdx === -1) continue;

      const categoryName = parts[galleryIdx + 1];
      if (!categoryName) continue;

      registerImage(categoryName, url, fileName);
    }
  } else {
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          for (const [categoryName, urls] of Object.entries(data)) {
            if (!Array.isArray(urls)) continue;

            urls
              .map((value) => normalizeImageUrl(value))
              .filter((value) => value.length > 0)
              .forEach((value) => {
                const fileName = value.split('/').pop() || '';
                registerImage(categoryName, value, fileName);
              });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  if (categoriesBySlug.size === 0) {
    return createEmptyResult();
  }

  for (const [slug, urls] of Object.entries(imagesByCategory)) {
    const uniqueUrls = Array.from(new Set(urls));
    uniqueUrls.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = uniqueUrls;
  }

  const categories = Array.from(categoriesBySlug.entries())
    .map(([slug, name]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories,
    imagesByCategory,
    coverByCategory,
  };
}
