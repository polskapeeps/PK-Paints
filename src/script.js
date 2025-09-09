import './style.css';
import { buildGallery } from './gallery-builder.js';
import heroImage1 from './assets/hero/[21] interior_04-2021.jpeg';
import heroImage2 from './assets/hero/[67] interior_11-2022.jpeg';
import exterior from './assets/exterior.png';
import dine from './assets/dine.png';
import dine2 from './assets/dine2.png';

const galleryDataPromise = buildGallery();
let lightboxInitialized = false;

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

  function prevImage() {
    galleryItems = getGalleryItems();
    currentImageIndex =
      (currentImageIndex - 1 + galleryItems.length) % galleryItems.length;
    const img = galleryItems[currentImageIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const items = getGalleryItems();
      const index = items.indexOf(item);
      openLightbox(index);
    });
  });

  if (!lightboxInitialized) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        }
      }
    });

    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleGesture();
    });

    function handleGesture() {
      const swipeThreshold = 100;
      if (touchEndX < touchStartX - swipeThreshold) {
        const nextBtn = document.querySelector('.lightbox-next');
        if (nextBtn) nextBtn.click();
      }

      if (touchEndX > touchStartX + swipeThreshold) {
        const prevBtn = document.querySelector('.lightbox-prev');
        if (prevBtn) prevBtn.click();
      }
    }

    lightboxInitialized = true;
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
};

// Initialize gallery enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname.includes('gallery')) {
    const grid = document.querySelector('.gallery-grid');
    const select = document.getElementById('gallery-select');
    const { categories, imagesByCategory } = await galleryDataPromise;

    const renderCategory = (slug) => {
      if (!grid) return;
      const images = imagesByCategory[slug] || [];
      grid.innerHTML = images
        .map(
          (url) =>
            `<div class="gallery-item overflow-hidden fade-in"><img src="${url}" loading="lazy" alt="Gallery image" onerror="this.parentElement.style.display='none'" /></div>`
        )
        .join('');
      grid.classList.add('visible');
      initGalleryEnhancements();
      initGalleryUI();
    };

    if (select) {
      select.innerHTML = categories
        .map((c) => `<option value="${c.slug}">${c.name}</option>`)
        .join('');
      select.addEventListener('change', () => {
        renderCategory(select.value);
      });
    }

    const params = new URLSearchParams(window.location.search);
    const initial =
      params.get('category') || (categories[0] ? categories[0].slug : null);
    if (initial) {
      if (select) select.value = initial;
      renderCategory(initial);
    }
  }
});
