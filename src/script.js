import './style.css';
import { buildGallery } from './gallery-builder.js';
import { initGallery } from './gallery.js';

const initPersistentActions = () => {
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    document.body.prepend(skipLink);
  }

  if (document.querySelector('.mobile-action-bar')) return;
  const actionBar = document.createElement('nav');
  actionBar.className = 'mobile-action-bar';
  actionBar.setAttribute('aria-label', 'Quick contact actions');
  actionBar.innerHTML = `
    <a href="tel:+12156038009">Call</a>
    <a href="sms:+12156038009">Text</a>
    <a href="request-estimate.html">Request Estimate</a>
  `;
  document.body.appendChild(actionBar);
};

// Initialize site features when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  initPersistentActions();
  const heroExists = document.querySelector('.hero-slide');
  const navExists =
    document.getElementById('mobile-menu-button') ||
    document.getElementById('desktop-services-button') ||
    document.getElementById('desktop-gallery-button');
  const galleryPage =
    window.location.pathname.includes('gallery') ||
    document.querySelector('.gallery-grid');

  let galleryData = {
    categories: [],
    imagesByCategory: {},
    coverByCategory: {},
  };
  if (navExists || galleryPage) {
    try {
      galleryData = await buildGallery();
    } catch (error) {
      console.error('Failed to load gallery data', error);
    }
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
