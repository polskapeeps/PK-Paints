// gallery-builder.js - Compile gallery images grouped by category folders.
// Uses Vite's import.meta.glob to gather all images in src/assets/gallery and
// falls back to public/gallery.json when not running through the Vite server.

const COVER_IMAGE_REGEX = /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i;
const ROOT_IMAGE_PREFIX = 'painting_';
const EXCLUDED_CATEGORY = 'Commercial';

const renameCategory = (name) =>
  name === 'Carpentry' ? 'Custom Installs' : name;

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

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

<<<<<<< ours
const createEmptyResult = () => ({
  categories: [],
  imagesByCategory: {},
  coverByCategory: {},
});

=======
>>>>>>> theirs
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
<<<<<<< ours

      if (fileName.startsWith(ROOT_IMAGE_PREFIX)) continue;
=======
>>>>>>> theirs
      if (!fileName || fileName.startsWith('painting_')) continue;

      const galleryIdx = parts.indexOf('gallery');
      if (galleryIdx === -1) continue;

      const categoryName = parts[galleryIdx + 1];
      if (!categoryName || categoryName.startsWith('painting_')) continue;

      registerImage(categoryName, url, fileName);
    }
  } else {
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        const data = await res.json();
<<<<<<< ours
        Object.entries(data).forEach(([categoryName, urls]) => {
          if (!Array.isArray(urls)) return;
          urls.forEach((url) => registerImage(categoryName, url));
        });
=======
>>>>>>> theirs
        if (data && typeof data === 'object') {
          for (const [categoryName, urls] of Object.entries(data)) {
            const category = ensureCategory(categoryName);
            if (!category) continue;

            const validUrls = Array.isArray(urls)
<<<<<<< ours
              ? urls.filter(
                  (value) => typeof value === 'string' && value.length > 0
                )
=======
              ? urls.filter((value) => typeof value === 'string' && value.length > 0)
>>>>>>> theirs
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

<<<<<<< ours
  if (categories.size === 0) {
    return createEmptyResult();
  }

  const imagesByCategory = {};
  const sortedCategories = Array.from(categories.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
=======
>>>>>>> theirs
  // Sort and deduplicate image URLs within each category to ensure predictable ordering
  for (const slug of Object.keys(imagesByCategory)) {
    const uniqueUrls = Array.from(new Set(imagesByCategory[slug]));
    uniqueUrls.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = uniqueUrls;
  }

<<<<<<< ours
  sortedCategories.forEach(({ slug, images }) => {
    images.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = images;
  });

  const coverResult = {};
  coverByCategory.forEach((url, slug) => {
    coverResult[slug] = url;
  });
=======
>>>>>>> theirs
  const categories = Array.from(categoriesBySlug.entries())
    .map(([slug, name]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories: sortedCategories.map(({ name, slug }) => ({ name, slug })),
    imagesByCategory,
    coverByCategory: coverResult,
  };
}
