let lightboxInitialized = false;

const initGalleryEnhancements = () => {
  // Lazy loading for gallery images
  const galleryImages = document.querySelectorAll('.gallery-item img');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  galleryImages.forEach((img) => {
    imageObserver.observe(img);
  });

  // Preload critical gallery images
  const preloadImages = [
    'assets/gallery/showers_35.jpg',
    'assets/gallery/shower-2.jpg',
    'assets/gallery/doors_03.jpg',
    'assets/gallery/railing_04.jpg',
  ];

  preloadImages.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  // Gallery item hover effects
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'scale(1.02) translateY(-2px)';
      item.style.transition = 'transform 0.3s ease';
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'scale(1) translateY(0)';
    });
  });

  // Performance optimization for large galleries
  const optimizeForPerformance = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    if (prefersReducedMotion.matches) {
      const style = document.createElement('style');
      style.textContent = `
        .gallery-item,
        .gallery-filter,
        .lightbox-content {
          transition: none !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  optimizeForPerformance();
};

const initGalleryUI = () => {
  let galleryItems = Array.from(
    document.querySelectorAll('.gallery-grid .gallery-item')
  );
  const getGalleryItems = () =>
    Array.from(document.querySelectorAll('.gallery-grid .gallery-item'));

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let currentImageIndex = 0;

  function openLightbox(index) {
    galleryItems = getGalleryItems();
    currentImageIndex = index;
    const img = galleryItems[currentImageIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  function nextImage() {
    galleryItems = getGalleryItems();
    currentImageIndex = (currentImageIndex + 1) % galleryItems.length;
    const img = galleryItems[currentImageIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
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

export function initGallery(galleryData) {
  const {
    categories = [],
    imagesByCategory = {},
    coverByCategory = {},
  } = galleryData || {};
  if (!window.location.pathname.includes('gallery')) return;
  const grid = document.querySelector('.gallery-grid');
  const select = document.getElementById('gallery-select');
  const heroEl = document.querySelector('.service-hero');

  const setHeroForCategory = (slug) => {
    if (!heroEl) return;
    const imgs = imagesByCategory[slug] || [];
    const cover = coverByCategory[slug];
    const heroUrl = cover || imgs[0];
    if (heroUrl) {
      heroEl.style.backgroundImage = `url('${heroUrl}')`;
    }
  };

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
    setHeroForCategory(slug);
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
