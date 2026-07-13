// Build gallery data from Vite-managed originals and generated lightweight thumbnails.

const COVER_IMAGE_REGEX = /(^|\/)cover\.(jpg|jpeg|png|webp)(\?|$)/i;
const ROOT_IMAGE_PREFIX = 'painting_';
const EXCLUDED_CATEGORY = 'Commercial';

const CATEGORY_RENAMES = new Map([['Carpentry', 'Custom Trim']]);

const CATEGORY_COPY = {
  'Custom Trim': {
    alt: 'Custom trim and millwork project',
    caption: 'Custom trim & millwork',
  },
  'Exterior Painting': {
    alt: 'Exterior painting project',
    caption: 'Exterior painting',
  },
  'Interior Painting': {
    alt: 'Interior painting project',
    caption: 'Interior painting',
  },
  'Kitchen Refinish': {
    alt: 'Cabinet and kitchen refinishing project',
    caption: 'Cabinet refinishing',
  },
  Remodeling: {
    alt: 'Home renovation project',
    caption: 'Renovation details',
  },
  Stain: {
    alt: 'Wood staining and restoration project',
    caption: 'Wood staining & restoration',
  },
};

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

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const thumbnailUrl = (categoryName, fileName) => {
  const base = import.meta.env.BASE_URL || './';
  return `${base}assets/gallery-thumbs/${slugify(categoryName)}/${slugify(fileName)}.webp`;
};

const imageModules = import.meta.glob('./assets/gallery/*/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * Builds gallery data from source images that Vite fingerprints for production.
 * @returns {Promise<Object>} Category metadata, image entries, and category covers.
 */
export async function buildGallery() {
  const categories = new Map();
  const coverCandidates = {};

  for (const [sourcePath, fullUrl] of Object.entries(imageModules)) {
    const parts = sourcePath.split('/');
    const fileName = parts.pop();
    if (!fileName || fileName.startsWith(ROOT_IMAGE_PREFIX)) continue;

    const galleryIndex = parts.indexOf('gallery');
    const sourceCategory = parts[galleryIndex + 1];
    const displayName = normalizeCategoryName(sourceCategory);
    if (!displayName) continue;

    const slug = slugify(displayName);
    if (!categories.has(slug)) {
      categories.set(slug, { slug, name: displayName, images: [] });
    }

    const entry = {
      full: typeof fullUrl === 'string' ? fullUrl.trim() : '',
      thumbnail: thumbnailUrl(sourceCategory, fileName),
      fileName,
    };
    if (!entry.full) continue;

    categories.get(slug).images.push(entry);
    if (!coverCandidates[slug] && COVER_IMAGE_REGEX.test(fileName)) {
      coverCandidates[slug] = entry;
    }
  }

  if (categories.size === 0) return createEmptyResult();

  const sortedCategories = Array.from(categories.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const imagesByCategory = {};
  const coverByCategory = {};

  sortedCategories.forEach(({ slug, name, images }) => {
    const seen = new Set();
    const uniqueImages = images
      .filter((entry) => {
        if (seen.has(entry.full)) return false;
        seen.add(entry.full);
        return true;
      })
      .sort((a, b) => a.fileName.localeCompare(b.fileName));

    const copy = CATEGORY_COPY[name] || {
      alt: `${name} project`,
      caption: name,
    };

    imagesByCategory[slug] = uniqueImages.map((entry, index) => ({
      full: entry.full,
      thumbnail: entry.thumbnail,
      alt: `${copy.alt}, photo ${index + 1}`,
      caption: copy.caption,
    }));

    const cover = coverCandidates[slug] || uniqueImages[0];
    if (cover) coverByCategory[slug] = cover.full;
  });

  return {
    categories: sortedCategories.map(({ slug, name }) => ({ name, slug })),
    imagesByCategory,
    coverByCategory,
  };
}
