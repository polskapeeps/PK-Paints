// Build gallery data from the manifest written by scripts/generate-gallery-assets.js.
// Only the generated thumbnails and lightbox-sized WebP images ship; originals stay in src/.
import manifest from './generated/gallery-manifest.json';

const CATEGORY_ALT = {
  'Custom Trim': 'Custom trim and millwork project',
  'Exterior Painting': 'Exterior painting project',
  'Interior Painting': 'Interior painting project',
  'Kitchen Refinish': 'Cabinet and kitchen refinishing project',
  Remodeling: 'Home renovation project',
  Stain: 'Wood staining and restoration project',
};

const withBase = (assetPath) => `${import.meta.env.BASE_URL || './'}${assetPath}`;

/**
 * Builds gallery data for the navigation menus, inline galleries, and gallery page.
 * @returns {Promise<Object>} Category metadata, image entries, and category covers.
 */
export async function buildGallery() {
  const categories = Array.isArray(manifest?.categories) ? manifest.categories : [];
  const imagesByCategory = {};
  const coverByCategory = {};

  categories.forEach(({ name, slug, cover, images }) => {
    const alt = CATEGORY_ALT[name] || `${name} project`;
    imagesByCategory[slug] = images.map((image, index) => ({
      full: withBase(image.full),
      thumbnail: withBase(image.thumbnail),
      alt: `${alt}, photo ${index + 1}`,
    }));
    if (cover) coverByCategory[slug] = withBase(cover);
  });

  return {
    categories: categories.map(({ name, slug }) => ({ name, slug })),
    imagesByCategory,
    coverByCategory,
  };
}
