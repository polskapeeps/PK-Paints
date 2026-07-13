const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const galleryDir = path.join(rootDir, 'src', 'assets', 'gallery');
const publicDir = path.join(rootDir, 'public');
const thumbnailDir = path.join(publicDir, 'assets', 'gallery-thumbs');
const iconDir = path.join(publicDir, 'assets', 'icons');
const featuredDir = path.join(publicDir, 'assets', 'featured');
const contentDir = path.join(publicDir, 'assets', 'content');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function createGalleryThumbnails() {
  const expectedPrefix = `${path.join(publicDir, 'assets')}${path.sep}`;
  if (!thumbnailDir.startsWith(expectedPrefix)) {
    throw new Error('Refusing to replace gallery assets outside the public assets directory.');
  }

  fs.rmSync(thumbnailDir, { recursive: true, force: true });
  fs.mkdirSync(thumbnailDir, { recursive: true });

  let total = 0;
  const categories = fs
    .readdirSync(galleryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const category of categories) {
    const sourceDir = path.join(galleryDir, category.name);
    const destinationDir = path.join(thumbnailDir, slugify(category.name));
    fs.mkdirSync(destinationDir, { recursive: true });

    const files = fs
      .readdirSync(sourceDir)
      .filter((file) => supportedExtensions.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const outputPath = path.join(destinationDir, `${slugify(file)}.webp`);
      await sharp(sourcePath)
        .rotate()
        .resize({ width: 720, height: 540, fit: 'cover', position: 'attention' })
        .webp({ quality: 74, effort: 4 })
        .toFile(outputPath);
      total += 1;
    }
  }

  return total;
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
  const [thumbnailCount] = await Promise.all([
    createGalleryThumbnails(),
    createSiteIcons(),
    createFeaturedImages(),
  ]);
  console.log(`Generated ${thumbnailCount} gallery thumbnails and responsive site icons.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
