const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '..', 'src', 'assets', 'gallery');
const outputPath = path.join(__dirname, '..', 'public', 'gallery.json');

function collectImagesByCategory(dir) {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = {};
  for (const entry of entries) {
    const folderName = entry.name;
    const category = folderName === 'Carpentry' ? 'Custom Trim' : folderName;
    const files = fs
      .readdirSync(path.join(dir, folderName))
      .filter((file) => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase()))
      .sort();

    if (files.length > 0) {
      categories[category] = files.map((file) => `src/assets/gallery/${folderName}/${file}`);
    }
  }
  return categories;
}

const imagesByCategory = collectImagesByCategory(galleryDir);
fs.writeFileSync(outputPath, JSON.stringify(imagesByCategory, null, 2));
const total = Object.values(imagesByCategory).reduce((sum, arr) => sum + arr.length, 0);
console.log(
  `Wrote ${total} images across ${Object.keys(imagesByCategory).length} categories to ${outputPath}`
);
