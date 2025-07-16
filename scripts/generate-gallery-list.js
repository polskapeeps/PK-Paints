const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../src/assets/gallery');
const outputFile = path.join(__dirname, '../src/gallery-list.js');

const exts = ['.jpg', '.jpeg', '.png', '.webp'];

function walk(dir) {
  const files = fs.readdirSync(dir);
  let images = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      images = images.concat(walk(full));
    } else {
      if (exts.includes(path.extname(full).toLowerCase())) {
        images.push(path.relative(path.join(__dirname, '../src'), full).replace(/\\/g, '/'));
      }
    }
  }
  return images;
}

const images = walk(galleryDir);
const content = `export default ${JSON.stringify(images, null, 2)};\n`;
fs.writeFileSync(outputFile, content);
console.log(`Generated ${outputFile} with ${images.length} images.`);
