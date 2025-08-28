const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '..', 'src', 'assets', 'gallery');
const outputPath = path.join(__dirname, '..', 'public', 'gallery.json');

function collectImagesByCategory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const categories = {};
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const category = entry.name;
      const files = fs.readdirSync(path.join(dir, category));
      const images = [];
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          images.push(`src/assets/gallery/${category}/${file}`);
        }
      }
      if (images.length > 0) categories[category] = images;
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
