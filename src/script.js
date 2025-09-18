import './style.css';
import { buildGallery } from './gallery-builder.js';
import { initGallery } from './gallery.js';
import heroImage1 from './assets/hero/[21] interior_04-2021.jpeg';
import heroImage2 from './assets/hero/[67] interior_11-2022.jpeg';
import exterior from './assets/exterior.png';
import dine from './assets/dine.png';
import dine2 from './assets/dine2.png';

// Preload hero and gallery images to ensure they are bundled and ready
const preloadedImages = [heroImage1, heroImage2, exterior, dine, dine2];
if (typeof window !== 'undefined') {
  preloadedImages.forEach((src) => {
    if (!src) return;
    const img = new Image();
    img.src = src;
  });
}

// Initialize site features when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const heroExists = document.querySelector('.hero-slide');
  const navExists =
    document.getElementById('mobile-menu-button') ||
    document.getElementById('desktop-services-button') ||
    document.getElementById('desktop-gallery-button');
  const galleryPage =
    window.location.pathname.includes('gallery') ||
    document.querySelector('.gallery-grid');

  let galleryData;
  if (navExists || galleryPage) {
    galleryData = await buildGallery();
  }

  if (heroExists) {
    const { initHeroSlideshow } = await import('./hero-slideshow.js');
    initHeroSlideshow();
  }

  if (navExists) {
    const { initNavMenu } = await import('./nav-menu.js');
    initNavMenu(galleryData);
  }

  if (galleryPage) {
    initGallery(galleryData);
  }

  // Reorder homepage sections: place Services above About (neatly)
  const aboutSection = document.getElementById('about');
  const servicesSection = document.getElementById('services');
  if (aboutSection && servicesSection) {
    const parent = aboutSection.parentNode;
    if (parent) {
      // Always ensure Services appears before About
      parent.insertBefore(servicesSection, aboutSection);
    }
  }
});

