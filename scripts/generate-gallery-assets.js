const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const galleryDir = path.join(rootDir, 'src', 'assets', 'gallery');
const publicDir = path.join(rootDir, 'public');
const thumbnailDir = path.join(publicDir, 'assets', 'gallery-thumbs');
const largeDir = path.join(publicDir, 'assets', 'gallery-large');
const manifestPath = path.join(rootDir, 'src', 'generated', 'gallery-manifest.json');
const iconDir = path.join(publicDir, 'assets', 'icons');
const featuredDir = path.join(publicDir, 'assets', 'featured');
const contentDir = path.join(publicDir, 'assets', 'content');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Folder names under src/assets/gallery map to public categories here.
const EXCLUDED_CATEGORIES = new Set(['Commercial']);
const CATEGORY_RENAMES = new Map([['Carpentry', 'Custom Trim']]);
const EXCLUDED_FILE_PREFIX = 'painting_';
const COVER_FILE = /^cover\.(jpe?g|png|webp)$/i;
const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isFresh = (sourcePath, outputPath) => {
  try {
    return fs.statSync(outputPath).mtimeMs >= fs.statSync(sourcePath).mtimeMs;
  } catch {
    return false;
  }
};

const removeStaleFiles = (directory, expected) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      removeStaleFiles(fullPath, expected);
      if (fs.readdirSync(fullPath).length === 0) fs.rmdirSync(fullPath);
    } else if (!expected.has(fullPath)) {
      fs.rmSync(fullPath);
    }
  }
};

const runWithConcurrency = async (jobs, limit) => {
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) await jobs[next++]();
  };
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
};

// Writes a lightweight thumbnail and a screen-sized lightbox image for every public
// gallery photo, plus the manifest the browser uses. Original photos never ship.
async function createGalleryAssets() {
  const expectedPrefix = `${path.join(publicDir, 'assets')}${path.sep}`;
  if (!thumbnailDir.startsWith(expectedPrefix) || !largeDir.startsWith(expectedPrefix)) {
    throw new Error('Refusing to replace gallery assets outside the public assets directory.');
  }

  const expectedOutputs = new Set();
  const jobs = [];
  const categories = [];

  const directories = fs
    .readdirSync(galleryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !EXCLUDED_CATEGORIES.has(entry.name));

  for (const directory of directories) {
    const name = CATEGORY_RENAMES.get(directory.name) || directory.name;
    const folder = slugify(directory.name);
    const sourceDir = path.join(galleryDir, directory.name);
    const files = fs
      .readdirSync(sourceDir)
      .filter((file) => supportedExtensions.has(path.extname(file).toLowerCase()))
      .filter((file) => !file.startsWith(EXCLUDED_FILE_PREFIX))
      .sort(naturalOrder.compare);
    if (files.length === 0) continue;

    const category = { name, slug: slugify(name), cover: null, images: [] };
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const outputName = `${slugify(file)}.webp`;
      const thumbnailPath = path.join(thumbnailDir, folder, outputName);
      const largePath = path.join(largeDir, folder, outputName);
      expectedOutputs.add(thumbnailPath).add(largePath);

      const image = {
        thumbnail: `assets/gallery-thumbs/${folder}/${outputName}`,
        full: `assets/gallery-large/${folder}/${outputName}`,
      };
      category.images.push(image);
      if (!category.cover && COVER_FILE.test(file)) category.cover = image.full;

      if (!isFresh(sourcePath, thumbnailPath)) {
        jobs.push(async () => {
          fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });
          await sharp(sourcePath)
            .rotate()
            .resize({ width: 720, height: 540, fit: 'cover', position: 'attention' })
            .webp({ quality: 74, effort: 4 })
            .toFile(thumbnailPath);
        });
      }
      if (!isFresh(sourcePath, largePath)) {
        jobs.push(async () => {
          fs.mkdirSync(path.dirname(largePath), { recursive: true });
          await sharp(sourcePath)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 78, effort: 4 })
            .toFile(largePath);
        });
      }
    }
    category.cover ||= category.images[0].full;
    categories.push(category);
  }

  await runWithConcurrency(jobs, 4);
  removeStaleFiles(thumbnailDir, expectedOutputs);
  removeStaleFiles(largeDir, expectedOutputs);

  categories.sort((a, b) => naturalOrder.compare(a.name, b.name));
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify({ categories }, null, 2)}\n`);

  return categories.reduce((total, category) => total + category.images.length, 0);
}

async function createSiteIcons() {
  const faviconSource = path.join(iconDir, 'favicon-96x96.png');
  await Promise.all(
    [16, 32].map((size) =>
      sharp(faviconSource)
        .resize(size, size, { fit: 'cover' })
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(iconDir, `favicon-${size}x${size}.png`)),
    ),
  );

  await sharp(path.join(iconDir, 'header_logo.png'))
    .resize({ width: 720, withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(iconDir, 'header-logo.webp'));
}

async function createFeaturedImages() {
  const sources = [
    ['src/assets/exterior.png', 'home-exterior.webp'],
    ['src/assets/hero/[67] interior_11-2022.jpeg', 'home-interior-1.webp'],
    ['src/assets/hero/[21] interior_04-2021.jpeg', 'home-interior-2.webp'],
    ['src/assets/dine.png', 'home-detail-1.webp'],
    ['src/assets/dine2.png', 'home-detail-2.webp'],
    ['src/assets/wainscotwall.jpeg', 'painting-hero.webp'],
    ['src/assets/stain_door.png', 'trim-hero.webp'],
    ['src/assets/painting_162.png', 'gallery-hero.webp'],
  ];
  const contentSources = [
    ['src/assets/home/aboutus_2.jpeg', 'about'],
    ['src/assets/gallery/Interior Painting/[16]interior_04-2021.jpeg', 'painting'],
    ['src/assets/gallery/Carpentry/capentry_0052.jpeg', 'trim'],
  ];

  fs.rmSync(featuredDir, { recursive: true, force: true });
  fs.rmSync(contentDir, { recursive: true, force: true });
  fs.mkdirSync(featuredDir, { recursive: true });
  fs.mkdirSync(contentDir, { recursive: true });

  await Promise.all(
    sources.map(([source, output]) =>
      sharp(path.join(rootDir, source))
        .rotate()
        // Preserve the original composition. CSS performs the single viewport crop;
        // baking a second 16:10 crop here makes portrait project photos feel zoomed in.
        .resize({
          width: 2048,
          height: 2048,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 5 })
        .toFile(path.join(featuredDir, output)),
    ),
  );

  await Promise.all(
    contentSources.flatMap(([source, output]) =>
      [
        [640, 427],
        [1200, 800],
      ].map(([width, height]) =>
        sharp(path.join(rootDir, source))
          .rotate()
          .resize({ width, height, fit: 'cover', position: 'attention' })
          .webp({ quality: 78, effort: 5 })
          .toFile(path.join(contentDir, `${output}-${width}.webp`)),
      ),
    ),
  );
}

async function main() {
  const [imageCount] = await Promise.all([
    createGalleryAssets(),
    createSiteIcons(),
    createFeaturedImages(),
  ]);
  console.log(`Prepared ${imageCount} gallery photos (thumbnail + lightbox size) and responsive site icons.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
