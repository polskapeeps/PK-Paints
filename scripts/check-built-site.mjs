import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const failures = [];

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });

const builtFiles = walk(root);
const htmlFiles = builtFiles.filter((file) => file.endsWith('.html'));
if (builtFiles.length > 20_000) failures.push('Cloudflare Free allows up to 20,000 static files.');
for (const file of builtFiles) {
  if (fs.statSync(file).size > 25 * 1024 * 1024) {
    failures.push(`${path.relative(root, file)} exceeds the Cloudflare 25 MiB per-file limit.`);
  }
}
const htmlByPath = new Map(
  htmlFiles.map((file) => [path.normalize(file), fs.readFileSync(file, 'utf8')]),
);

const forbiddenPatterns = [
  ['Tailwind CDN runtime', /cdn\.tailwindcss\.com/i],
  ['old domain', /(?:www\.)?pkpaints\.com/i],
  ['placeholder address', /123 Main Street/i],
  ['unverified hours', /OpeningHoursSpecification/i],
  ['inconsistent name', /PK Paints n['’] Renovations|PK Renovations/i],
  ['known spelling error', /finshes|luxary|prestine|basboards/i],
  ['development asset path', /src[\\/]assets/i],
  ['placeholder link', /href=["']#["']/i],
];

const isExternal = (value) =>
  /^(?:https?:|mailto:|tel:|sms:|data:|javascript:)/i.test(value);

for (const file of htmlFiles) {
  const html = htmlByPath.get(path.normalize(file));
  const relativeFile = path.relative(root, file);

  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(html)) failures.push(`${relativeFile}: contains ${label}`);
  }

  if (!/http-equiv=["']refresh["']/i.test(html) && !/rel=["']canonical["']/i.test(html)) {
    failures.push(`${relativeFile}: missing canonical link`);
  }

  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const rawTarget = match[1].trim();
    if (!rawTarget || isExternal(rawTarget)) continue;

    const [targetWithoutHash, fragment] = rawTarget.split('#', 2);
    const targetWithoutQuery = targetWithoutHash.split('?', 1)[0];
    let targetFile = file;

    if (targetWithoutQuery) {
      const decoded = decodeURIComponent(targetWithoutQuery);
      const relativeTarget = decoded.startsWith('/') ? decoded.slice(1) : decoded;
      targetFile = decoded.startsWith('/')
        ? path.join(root, relativeTarget)
        : path.resolve(path.dirname(file), relativeTarget);

      if (!path.extname(targetFile)) {
        const htmlCandidate = `${targetFile}.html`;
        const indexCandidate = path.join(targetFile, 'index.html');
        if (fs.existsSync(htmlCandidate)) targetFile = htmlCandidate;
        else if (fs.existsSync(indexCandidate)) targetFile = indexCandidate;
      }

      if (!fs.existsSync(targetFile)) {
        failures.push(`${relativeFile}: missing local target ${rawTarget}`);
        continue;
      }
    }

    if (fragment && targetFile.endsWith('.html')) {
      const targetHtml = htmlByPath.get(path.normalize(targetFile));
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (targetHtml && !new RegExp(`id=["']${escaped}["']`).test(targetHtml)) {
        failures.push(`${relativeFile}: missing anchor ${rawTarget}`);
      }
    }
  }

  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      failures.push(`${relativeFile}: invalid JSON-LD (${error.message})`);
    }
  }
}

for (const expected of ['robots.txt', 'sitemap.xml', 'og.png', '_headers', '_redirects']) {
  if (!fs.existsSync(path.join(root, expected))) failures.push(`missing dist/${expected}`);
}

// Gallery images are referenced from JavaScript, so the HTML link scan above cannot see them.
const manifest = JSON.parse(fs.readFileSync(path.resolve('src/generated/gallery-manifest.json'), 'utf8'));
let galleryImages = 0;
for (const category of manifest.categories) {
  if (category.images.length === 0) failures.push(`gallery category ${category.slug} is empty`);
  for (const image of category.images) {
    for (const assetPath of [image.thumbnail, image.full]) {
      galleryImages += 1;
      if (!fs.existsSync(path.join(root, assetPath))) failures.push(`missing gallery image dist/${assetPath}`);
    }
  }
}
// Vite writes bundled (hashed) files straight into dist/assets; originals there mean an import regressed.
const shippedOriginals = builtFiles.filter(
  (file) => path.dirname(file) === path.join(root, 'assets') && /-[\w-]{8}\.(?:jpe?g|png)$/i.test(file),
);
if (shippedOriginals.length > 0) {
  failures.push(`${shippedOriginals.length} unoptimized gallery originals were bundled; serve generated WebP instead.`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML files and ${galleryImages} gallery images: links, assets, metadata, and JSON-LD passed.`);
}
