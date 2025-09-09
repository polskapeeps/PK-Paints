import './style.css';
import { buildGallery } from './gallery-builder.js';

document.addEventListener('DOMContentLoaded', async () => {
  const heroExists = document.querySelector('.hero-slide');
  const navExists =
    document.getElementById('mobile-menu-button') ||
    document.getElementById('desktop-services-button') ||
    document.getElementById('desktop-gallery-button');
  const galleryExists =
    window.location.pathname.includes('gallery') ||
    document.querySelector('.gallery-grid');

  let galleryData;
  if (navExists || galleryExists) {
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

  if (galleryExists) {
    const { initGallery } = await import('./gallery.js');
    initGallery(galleryData);
  }
});
