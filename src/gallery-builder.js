// gallery-builder.js - Compile gallery images grouped by category folders.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery and
// falls back to public/gallery.json when not running through the Vite server.

const COVER_IMAGE_REGEX = /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i;
const ROOT_IMAGE_PREFIX = 'painting_';
const EXCLUDED_CATEGORY = 'Commercial';
const FALLBACK_GALLERY_JSON = 'gallery.json';

const CATEGORY_RENAMES = new Map([
  ['Carpentry', 'Custom Trim'],
]);

const createEmptyResult = () => ({
  categories: [],
  imagesByCategory: {},
  coverByCategory: {},
});

const normalizeCategoryName = (name) => {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed || trimmed === EXCLUDED_CATEGORY) return '';
  return CATEGORY_RENAMES.get(trimmed) || trimmed;
};

const slugifyCategory = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
  const categories = new Map();
  const coverCandidates = {};

  const ensureCategory = (categoryName) => {
    const displayName = normalizeCategoryName(categoryName);
    if (!displayName) return null;

    const slug = slugifyCategory(displayName);
    if (!slug) return null;

    if (!categories.has(slug)) {
      categories.set(slug, { slug, name: displayName, images: [] });
    }

    return categories.get(slug);
  };

  const registerImage = (categoryName, url, fileName = '') => {
    const category = ensureCategory(categoryName);
    if (!category) return;

    const normalizedUrl = typeof url === 'string' ? url.trim() : '';
    if (!normalizedUrl) return;

    category.images.push(normalizedUrl);

    if (
      !coverCandidates[category.slug] &&
      COVER_IMAGE_REGEX.test(typeof fileName === 'string' ? fileName : '')
    ) {
      coverCandidates[category.slug] = normalizedUrl;
    }
  };

  if (Object.keys(imageModules).length > 0) {
    for (const [path, url] of Object.entries(imageModules)) {
      const parts = path.split('/');
      const fileName = parts.pop();
      if (!fileName || fileName.startsWith(ROOT_IMAGE_PREFIX)) continue;

      const galleryIdx = parts.indexOf('gallery');
      if (galleryIdx === -1) continue;

      const categoryName = parts[galleryIdx + 1];
      if (!categoryName || categoryName.startsWith(ROOT_IMAGE_PREFIX)) continue;

      registerImage(categoryName, url, fileName);
    }
  } else {
    try {
      const res = await fetch(FALLBACK_GALLERY_JSON);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          for (const [categoryName, urls] of Object.entries(data)) {
            if (!Array.isArray(urls)) continue;

            for (const value of urls) {
              if (typeof value !== 'string') continue;
              const normalizedUrl = value.trim();
              if (!normalizedUrl) continue;

              const fileName = normalizedUrl.split('/').pop();
              registerImage(categoryName, normalizedUrl, fileName);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  if (categories.size === 0) {
    return createEmptyResult();
  }

  const sortedCategories = Array.from(categories.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const imagesByCategory = {};
  const coverByCategory = {};

  sortedCategories.forEach(({ slug, images }) => {
    const uniqueUrls = Array.from(
      new Set(
        images
          .map((imageUrl) =>
            typeof imageUrl === 'string' ? imageUrl.trim() : ''
          )
          .filter(Boolean)
      )
    );

    uniqueUrls.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = uniqueUrls;

    if (coverCandidates[slug]) {
      coverByCategory[slug] = coverCandidates[slug];
    }
  });

  return {
    categories: sortedCategories.map(({ slug, name }) => ({ name, slug })),
    imagesByCategory,
    coverByCategory,
  };
}
