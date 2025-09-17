import './style.css';
import { buildGallery } from './gallery-builder.js';
import { initGallery } from './gallery.js';
import heroImage1 from './assets/hero/[21] interior_04-2021.jpeg';
import heroImage2 from './assets/hero/[67] interior_11-2022.jpeg';
import exterior from './assets/exterior.png';
import dine from './assets/dine.png';
import dine2 from './assets/dine2.png';

// Preload hero and gallery images to ensure they are bundled
const preloadedImages = [heroImage1, heroImage2, exterior, dine, dine2];
preloadedImages.forEach(() => {});

const createQuickContactPanel = () => {
  if (document.querySelector('.quick-contact')) return;

  const quickContact = document.createElement('aside');
  quickContact.className = 'quick-contact';
  quickContact.setAttribute('aria-label', 'Quick contact options');

  const hasContactSection = Boolean(document.getElementById('contact'));

  const contactMarkup = `
    <a class="quick-contact__link quick-contact__link--call" href="tel:2156038009"
      aria-label="Call PK Paints and Renovations">
      <span class="quick-contact__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.308 1.154a11.06 11.06 0 006.086 6.086l1.154-2.308a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </span>
      <span class="quick-contact__label">
        <span class="quick-contact__title">Call</span>
        <span class="quick-contact__detail">(215) 603-8009</span>
      </span>
    </a>
    <a class="quick-contact__link quick-contact__link--email" href="mailto:peterkpaint@gmail.com"
      aria-label="Email PK Paints and Renovations">
      <span class="quick-contact__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </span>
      <span class="quick-contact__label">
        <span class="quick-contact__title">Email</span>
        <span class="quick-contact__detail">peterkpaint@gmail.com</span>
      </span>
    </a>
    <a class="quick-contact__link quick-contact__link--quote" href="${
      hasContactSection ? '#contact' : 'index.html#contact'
    }" ${hasContactSection ? 'data-scroll-target="#contact"' : ''}
      aria-label="Request a quote from PK Paints and Renovations">
      <span class="quick-contact__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1m-2.599 7v1m0-8V7m0 14c5.523 0 10-4.477 10-10S17.523 1 12 1 2 5.477 2 11s4.477 10 10 10z" />
        </svg>
      </span>
      <span class="quick-contact__label">
        <span class="quick-contact__title">Get a quote</span>
        <span class="quick-contact__detail">Response within 24 hrs</span>
      </span>
    </a>
  `;

  quickContact.innerHTML = contactMarkup;

  document.body.appendChild(quickContact);

  if (hasContactSection) {
    const quoteLink = quickContact.querySelector('[data-scroll-target]');
    if (quoteLink) {
      quoteLink.addEventListener('click', (event) => {
        event.preventDefault();
        const selector = quoteLink.getAttribute('data-scroll-target');
        if (!selector) return;
        const target = document.querySelector(selector);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }
};

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

  createQuickContactPanel();
});

