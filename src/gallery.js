let lightboxInitialized = false;
let reducedMotionStylesApplied = false;
let reducedMotionListenerRegistered = false;

const GALLERY_PRELOAD_ATTRIBUTE = 'data-gallery-preload';

const normalizeImageUrl = (url) => (typeof url === 'string' ? url.trim() : '');

const normalizeImageList = (urls) => {
  if (!Array.isArray(urls)) return [];

  const seen = new Set();
  const normalized = [];

  for (const url of urls) {
    const trimmed = normalizeImageUrl(url);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
};

const updatePreloadLinks = (urls = []) => {
  if (typeof document === 'undefined') return;
  const head = document.head;
  if (!head) return;

  const selector = `link[${GALLERY_PRELOAD_ATTRIBUTE}]`;
  head.querySelectorAll(selector).forEach((link) => link.remove());

  urls.slice(0, 4).forEach((src) => {
    const href = normalizeImageUrl(src);
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute(GALLERY_PRELOAD_ATTRIBUTE, 'true');
    head.appendChild(link);
  });
};

const applyReducedMotionPreferences = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (reducedMotionStylesApplied) return;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const applyStyles = () => {
    if (!mediaQuery.matches || reducedMotionStylesApplied) return;

    const style = document.createElement('style');
    style.setAttribute('data-gallery-reduced-motion', 'true');
    style.textContent = `
      .gallery-item,
      .gallery-filter,
      .lightbox-content {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
    reducedMotionStylesApplied = true;
  };

  if (mediaQuery.matches) {
    applyStyles();
  } else if (!reducedMotionListenerRegistered) {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', applyStyles, { once: true });
    } else if (typeof mediaQuery.addListener === 'function') {
      const legacyListener = (event) => {
        if (event.matches) {
          applyStyles();
          mediaQuery.removeListener(legacyListener);
        }
      };
      mediaQuery.addListener(legacyListener);
    }
    reducedMotionListenerRegistered = true;
  }
};

const shouldEnableHoverEffects = () => {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const createGalleryItem = (url, gridElement) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-item overflow-hidden fade-in';
  wrapper.style.transition = 'transform 0.3s ease';

  const img = document.createElement('img');
  img.alt = 'Gallery image';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = url;

  img.addEventListener('error', () => {
    wrapper.remove();
    if (gridElement && gridElement.children.length === 0) {
      gridElement.classList.remove('visible');
    }
  });

  if (shouldEnableHoverEffects()) {
    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.transform = 'scale(1.02) translateY(-2px)';
    });

    wrapper.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'scale(1) translateY(0)';
    });
  }

  wrapper.appendChild(img);
  return wrapper;
};

const hydrateGalleryGrid = (gridElement, urls = []) => {
  if (!gridElement) return [];

  const normalizedUrls = normalizeImageList(urls);
  const fragment = document.createDocumentFragment();

  normalizedUrls.forEach((url) => {
    fragment.appendChild(createGalleryItem(url, gridElement));
  });

  gridElement.replaceChildren(fragment);
  gridElement.classList.toggle('visible', normalizedUrls.length > 0);

  updatePreloadLinks(normalizedUrls);
  applyReducedMotionPreferences();

  return normalizedUrls;
};

const initGalleryUI = (gridElement) => {
  if (!gridElement) return;

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  if (!lightbox || !lightboxImg || !lightboxClose || !lightboxPrev || !lightboxNext) {
    return;
  }

  const getGalleryItems = () =>
    Array.from(gridElement.querySelectorAll('.gallery-item'));

  let currentImageIndex = 0;

  const openLightbox = (index) => {
    const items = getGalleryItems();
    if (items.length === 0) return;

    const boundedIndex = index >= 0 && index < items.length ? index : 0;
    const item = items[boundedIndex];
    if (!item) return;

    const img = item.querySelector('img');
    if (!img) return;

    const src = img.currentSrc || img.src;
    if (!src) return;

    lightboxImg.src = src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('active');

    if (document.body) {
      document.body.style.overflow = 'hidden';
    }

    currentImageIndex = boundedIndex;
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    if (document.body) {
      document.body.style.overflow = 'auto';
    }
  };

  const updateImageFromIndex = (index) => {
    const items = getGalleryItems();
    if (items.length === 0) return;

    const normalizedIndex = ((index % items.length) + items.length) % items.length;
    const item = items[normalizedIndex];
    if (!item) return;

    const img = item.querySelector('img');
    if (!img) return;

    const src = img.currentSrc || img.src;
    if (!src) return;

    lightboxImg.src = src;
    lightboxImg.alt = img.alt || '';
    currentImageIndex = normalizedIndex;
  };

  const nextImage = () => updateImageFromIndex(currentImageIndex + 1);
  const prevImage = () => updateImageFromIndex(currentImageIndex - 1);

  const galleryItems = getGalleryItems();

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const items = getGalleryItems();
      const index = items.indexOf(item);
      if (index !== -1) {
        openLightbox(index);
      }
    });
  });

  if (!lightboxInitialized) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', nextImage);
    lightboxPrev.addEventListener('click', prevImage);

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('active')) return;

      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        nextImage();
      } else if (event.key === 'ArrowLeft') {
        prevImage();
      }
    });

    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (event) => {
      if (event.changedTouches.length > 0) {
        touchStartX = event.changedTouches[0].screenX;
      }
    });

    lightbox.addEventListener('touchend', (event) => {
      if (event.changedTouches.length > 0) {
        touchEndX = event.changedTouches[0].screenX;
        const swipeThreshold = 100;
        if (touchEndX < touchStartX - swipeThreshold) {
          nextImage();
        } else if (touchEndX > touchStartX + swipeThreshold) {
          prevImage();
        }
      }
    });

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

  gridElement.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
};

export function initGallery(galleryData) {
  const {
    categories = [],
    imagesByCategory = {},
    coverByCategory = {},
  } = galleryData || {};

  if (typeof window === 'undefined') return;
  if (!window.location.pathname.includes('gallery')) return;

  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const select = document.getElementById('gallery-select');
  const heroEl = document.querySelector('.service-hero');

  const setHeroForCategory = (slug, normalizedImages) => {
    if (!heroEl) return;

    const fallbackImages = Array.isArray(normalizedImages)
      ? normalizedImages
      : normalizeImageList(imagesByCategory[slug] || []);

    const cover = normalizeImageUrl(coverByCategory[slug]);
    const heroUrl = cover || fallbackImages[0] || '';
    heroEl.style.backgroundImage = heroUrl ? `url('${heroUrl}')` : '';
  };

  const renderCategory = (slug) => {
    if (!slug || !(slug in imagesByCategory)) return;

    const normalizedImages = hydrateGalleryGrid(grid, imagesByCategory[slug]);
    imagesByCategory[slug] = normalizedImages;
    initGalleryUI(grid);
    setHeroForCategory(slug, normalizedImages);
  };

  if (select) {
    select.innerHTML = categories
      .map((c) => `<option value="${c.slug}">${c.name}</option>`)
      .join('');

    select.addEventListener('change', () => {
      renderCategory(select.value);
    });
  }

  const getValidSlug = (slug) =>
    typeof slug === 'string' && slug in imagesByCategory ? slug : null;

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = getValidSlug(params.get('category'));

  const preferredSlugs = ['interior-painting', 'exterior-painting', 'custom-trim'];
  const fallbackSlug =
    preferredSlugs.map((slug) => getValidSlug(slug)).find(Boolean) ||
    (categories[0] ? getValidSlug(categories[0].slug) : null);

  const initialSlug = requestedSlug || fallbackSlug;

  if (initialSlug) {
    if (select) select.value = initialSlug;
    renderCategory(initialSlug);
  } else {
    hydrateGalleryGrid(grid, []);
  }
}

