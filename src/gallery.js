const PLACEHOLDER_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

let lightboxInitialized = false;
let gridListenerBound = false;
let lazyImageObserver;
let fadeInObserver;
let reducedMotionStylesApplied = false;

const ensureReducedMotionStyles = () => {
  if (reducedMotionStylesApplied) return;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
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
  }

  reducedMotionStylesApplied = true;
};

const ensureLazyImageObserver = () => {
  if (lazyImageObserver) return lazyImageObserver;
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  lazyImageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      });
    },
    { rootMargin: '0px 0px 200px 0px', threshold: 0.1 }
  );

  return lazyImageObserver;
};

const observeLazyImage = (img) => {
  const observer = ensureLazyImageObserver();
  if (observer) {
    observer.observe(img);
  } else if (img.dataset.src) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  }
};

const ensureFadeInObserver = () => {
  if (fadeInObserver) return fadeInObserver;
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  fadeInObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  return fadeInObserver;
};

const observeFadeIn = (element) => {
  const observer = ensureFadeInObserver();
  if (observer) {
    observer.observe(element);
  } else {
    element.classList.add('visible');
  }
};

const enhanceGalleryItem = (item) => {
  const img = item.querySelector('img');
  if (img) {
    observeLazyImage(img);
    img.addEventListener('error', () => {
      item.style.display = 'none';
    });
  }

  item.style.transition = 'transform 0.3s ease';
  item.addEventListener('mouseenter', () => {
    item.style.transform = 'scale(1.02) translateY(-2px)';
  });
  item.addEventListener('mouseleave', () => {
    item.style.transform = 'scale(1) translateY(0)';
  });

  observeFadeIn(item);
};

const initGalleryUI = (grid) => {
  if (!grid) return;

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  if (!lightbox || !lightboxImg || !lightboxClose || !lightboxPrev || !lightboxNext) {
    return;
  }

  const getGalleryItems = () =>
    Array.from(grid.querySelectorAll('.gallery-item'));

  const resolveImageSource = (img) => {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    return img.src;
  };

  let currentImageIndex = 0;

  const showImageAtIndex = (index) => {
    const items = getGalleryItems();
    if (items.length === 0) return false;

    const safeIndex = (index + items.length) % items.length;
    currentImageIndex = safeIndex;

    const img = items[safeIndex].querySelector('img');
    if (!img) return false;

    const src = resolveImageSource(img);
    lightboxImg.src = src;
    lightboxImg.alt = img.alt || 'Gallery image';
    return true;
  };

  const openLightbox = (index) => {
    if (!showImageAtIndex(index)) return;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => {
    showImageAtIndex(currentImageIndex + 1);
  };

  const prevImage = () => {
    showImageAtIndex(currentImageIndex - 1);
  };

  if (!gridListenerBound) {
    grid.addEventListener('click', (event) => {
      const targetItem = event.target.closest('.gallery-item');
      if (!targetItem || !grid.contains(targetItem)) return;

      event.preventDefault();
      const items = getGalleryItems();
      const index = items.indexOf(targetItem);
      if (index !== -1) {
        openLightbox(index);
      }
    });
    gridListenerBound = true;
  }

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
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    });

    let touchStartX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    lightbox.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const swipeThreshold = 100;

      if (touchEndX < touchStartX - swipeThreshold) {
        nextImage();
      } else if (touchEndX > touchStartX + swipeThreshold) {
        prevImage();
      }
    });

    lightboxInitialized = true;
  }
};

const renderEmptyState = (grid) => {
  grid.classList.remove('visible');
  grid.innerHTML =
    '<p class="col-span-full py-12 text-center text-sm text-gray-400">No images available for this category at the moment.</p>';
  grid.classList.add('visible');
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

  if (!grid) return;

  ensureReducedMotionStyles();
  initGalleryUI(grid);

  const setHeroForCategory = (slug) => {
    if (!heroEl) return;
    const images = Array.isArray(imagesByCategory[slug])
      ? imagesByCategory[slug]
      : [];
    const cover = coverByCategory[slug];
    const heroUrl = cover || images[0];

    if (heroUrl) {
      heroEl.style.backgroundImage = `url('${heroUrl}')`;
    } else {
      heroEl.style.removeProperty('background-image');
    }
  };

  const renderCategory = (slug) => {
    if (!slug) return;

    if (lazyImageObserver) lazyImageObserver.disconnect();
    if (fadeInObserver) fadeInObserver.disconnect();

    const images = Array.isArray(imagesByCategory[slug])
      ? imagesByCategory[slug]
      : [];

    if (images.length === 0) {
      renderEmptyState(grid);
      setHeroForCategory(slug);
      return;
    }

    grid.classList.remove('visible');
    grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    images.forEach((url) => {
      const item = document.createElement('div');
      item.className = 'gallery-item overflow-hidden fade-in';

      const img = document.createElement('img');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('alt', 'Gallery image');
      img.dataset.src = url;
      img.src = PLACEHOLDER_IMAGE;

      item.appendChild(img);
      fragment.appendChild(item);
    });

    grid.appendChild(fragment);

    grid.querySelectorAll('.gallery-item').forEach((item) => {
      enhanceGalleryItem(item);
    });

    setHeroForCategory(slug);
    grid.classList.add('visible');
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
  } else {
    renderEmptyState(grid);
  }
}
