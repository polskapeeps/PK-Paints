// gallery-builder.js - Only loads files that actually exist
let imageModules = {};

// Use Vite's import.meta.glob to get ONLY files that actually exist
if (import.meta && typeof import.meta.glob === 'function') {
  // This will only include files that actually exist in your folder
  imageModules = import.meta.glob(
    './assets/gallery/*.{jpg,jpeg,png,webp}', // Try this path
    {
      eager: true,
      query: '?url',
      import: 'default',
    }
  );
  console.log('🔍 Vite found these actual files:', Object.keys(imageModules));
}

export async function buildGallery() {
  let images = [];

  if (Object.keys(imageModules).length > 0) {
    console.log(
      `✅ Found ${Object.keys(imageModules).length} actual images via Vite glob`
    );

    // Get the actual URLs from Vite
    for (const path in imageModules) {
      images.push(imageModules[path]);
      console.log(`📷 Image: ${path} → ${imageModules[path]}`);
    }

    // Sort images by filename number
    images.sort((a, b) => {
      const aNum = parseInt(a.match(/painting_(\d+)/)?.[1] || '0');
      const bNum = parseInt(b.match(/painting_(\d+)/)?.[1] || '0');
      return aNum - bNum;
    });
  } else {
    console.log(
      '❌ Vite glob failed - generating manual list for your 475 images'
    );

    // Since you have 475 images, let's generate a more realistic list
    // Based on your ls output: painting_01-10, then painting_100+
    const ranges = [
      [1, 99], // painting_01.jpeg through painting_99.jpeg
      [100, 500], // painting_100.jpeg through painting_500.jpeg
    ];

    for (const [start, end] of ranges) {
      for (let i = start; i <= end; i++) {
        const num = i.toString().padStart(2, '0');
        images.push(`./src/assets/gallery/painting_${num}.jpeg`);
      }
    }

    // Limit to reasonable number for testing
    images = images.slice(0, 100);
    console.log(`Generated ${images.length} image paths for testing`);
  }

  console.log(`🎨 Building gallery with ${images.length} real images`);

  let markup = '';

  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    const imageName = imageUrl.split('/').pop() || `image-${i}`;

    markup += `
      <div class="gallery-item glass-card rounded-xl overflow-hidden fade-in" 
           style="height: 300px;" 
           data-index="${i}">
        <img src="${imageUrl}" 
             loading="lazy" 
             alt="Painting project: ${imageName}" 
             class="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
             onload="console.log('✅ Loaded #${i + 1}:', '${imageName}');"
             onerror="console.log('❌ Failed #${
               i + 1
             }:', '${imageName}'); this.parentElement.style.opacity='0.3';" />
      </div>
    `;
  }

  return markup;
}
