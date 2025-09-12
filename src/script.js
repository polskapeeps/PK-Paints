import './style.css';
import { buildGallery } from './gallery-builder.js';
import { initGallery } from './gallery.js';

// Wait for the DOM to be fully loaded before running scripts
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
    initGallery(galleryData);
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
});
