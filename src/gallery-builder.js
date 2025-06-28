// gallery-builder.js - A more robust, bundler-friendly solution.
// This new approach assumes you are using a modern bundler like Vite.
// For this to work, make sure your images are located in `src/assets/gallery/`.

// Use Vite's `import.meta.glob` to automatically find all images.
// This is much more robust than generating filenames manually.
// It finds all .jpg, .jpeg, .png, and .webp files in the gallery directory.
// The `{ eager: true, as: 'url' }` options make it load all image URLs immediately.
const imageModules = import.meta.glob('/src/assets/gallery/**/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });

export function buildGallery() {
  const markup = {
    showers: '',
    doors: '',
    partitions: '',
    railings: ''
  };

  // A mapping from the filename prefix to the category key in the `markup` object.
  // This handles cases like 'partition_01.jpg' belonging to the 'partitions' category.
  const prefixToCategory = {
    'showers': 'showers',
    'doors': 'doors',
    'partition': 'partitions',
    'railing': 'railings'
  };

  // The keys of imageModules are paths like '/src/assets/gallery/showers_01.jpg'
  // The values are the processed URLs for the images.
  for (const path in imageModules) {
    const imageUrl = imageModules[path];

    // Extract prefix from the filename, e.g., "showers" from "showers_01.jpg"
    const filename = path.split('/').pop(); // e.g., "showers_01.jpg"
    const prefix = filename.split('_')[0];   // e.g., "showers"

    const category = prefixToCategory[prefix];

    // Check if the extracted category is one we expect
    if (category && markup.hasOwnProperty(category)) {
      markup[category] += `
        <div class="gallery-item glass-card rounded-xl overflow-hidden">
          <img src="${imageUrl}" loading="lazy" alt="${category} installation" onerror="this.parentElement.style.display='none'" />
        </div>
      `;
    }
  }

  return markup;
}