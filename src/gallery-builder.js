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

const createEmptyResult = () => ({
  categories: [],
  imagesByCategory: {},
  coverByCategory: {},
});

export async function buildGallery() {
  const categories = new Map(); // slug -> { name, slug, images: [] }
  const coverByCategory = new Map();

  const getOrCreateCategory = (categoryName) => {
    if (!categoryName || categoryName.startsWith(ROOT_IMAGE_PREFIX)) return null;
    if (categoryName === EXCLUDED_CATEGORY) return null;

    const displayName = renameCategory(categoryName);
    const slug = slugify(displayName);

    if (!categories.has(slug)) {
      categories.set(slug, { name: displayName, slug, images: [] });
    }

    return categories.get(slug);
  };

  const registerImage = (categoryName, url, { isCover = false } = {}) => {
    const category = getOrCreateCategory(categoryName);
    if (!category) return;

    category.images.push(url);

    if (!coverByCategory.has(category.slug)) {
      if (isCover || COVER_IMAGE_REGEX.test(url)) {
        coverByCategory.set(category.slug, url);
      }
    }
  };

  const hasEagerImports = Object.keys(imageModules).length > 0;

  if (hasEagerImports) {
    for (const [path, url] of Object.entries(imageModules)) {
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];

      if (fileName.startsWith(ROOT_IMAGE_PREFIX)) continue;

      const galleryIdx = parts.indexOf('gallery');
      const categoryName =
        galleryIdx >= 0 ? parts[galleryIdx + 1] : undefined;

      registerImage(categoryName, url, {
        isCover: COVER_IMAGE_REGEX.test(fileName),
      });
    }
  } else {
    try {
      const res = await fetch('gallery.json');
      if (res.ok) {
        const data = await res.json();
        Object.entries(data).forEach(([categoryName, urls]) => {
          if (!Array.isArray(urls)) return;
          urls.forEach((url) => registerImage(categoryName, url));
        });
      }
    } catch (err) {
      console.error('Failed to load gallery.json', err);
    }
  }

  if (categories.size === 0) {
    return createEmptyResult();
  }

  const imagesByCategory = {};
  const sortedCategories = Array.from(categories.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  sortedCategories.forEach(({ slug, images }) => {
    images.sort((a, b) => a.localeCompare(b));
    imagesByCategory[slug] = images;
  });

  const coverResult = {};
  coverByCategory.forEach((url, slug) => {
    coverResult[slug] = url;
  });

  return {
    categories: sortedCategories.map(({ name, slug }) => ({ name, slug })),
    imagesByCategory,
    coverByCategory: coverResult,
  };
}
