const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '..', 'src', 'assets', 'gallery');
const outputPath = path.join(__dirname, '..', 'public', 'gallery.json');

function collectImages(dir) {
  const files = fs.readdirSync(dir);
  const images = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      // Use the source path so that the gallery works when serving the raw
      // files without running a build step.
      images.push('src/assets/gallery/' + file);
    }
  }
  return images;
}

const images = collectImages(galleryDir);
fs.writeFileSync(outputPath, JSON.stringify(images, null, 2));
console.log(`Wrote ${images.length} images to ${outputPath}`);
