// Configuration constants
const GALLERY_PRELOAD_ATTRIBUTE = 'data-gallery-preload';
const SWIPE_THRESHOLD_PX = 100;
const OBSERVER_THRESHOLD = 0.1;
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';
const MAX_PRELOAD_IMAGES = 4;

// Module-level state
let lightboxInitialized = false;
let reducedMotionStylesApplied = false;
let reducedMotionListenerRegistered = false;
let sharedGalleryObserver = null;

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

  urls.slice(0, MAX_PRELOAD_IMAGES).forEach((src) => {
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
    reducedMotionListenerRegistered = true;
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener(
        'change',
        (event) => {
          if (event.matches) applyStyles();
        },
        { once: true }
      );
    } else if (typeof mediaQuery.addListener === 'function') {
      // Legacy Safari fallback
      const legacyListener = (event) => {
        if (event.matches) {
          applyStyles();
          mediaQuery.removeListener(legacyListener);
        }
      };
      mediaQuery.addListener(legacyListener);
    }
  }
};

const shouldEnableHoverEffects = () => {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get or create a shared IntersectionObserver for gallery animations
const getGalleryObserver = () => {
  if (!sharedGalleryObserver) {
    const observerOptions = {
      threshold: OBSERVER_THRESHOLD,
      rootMargin: OBSERVER_ROOT_MARGIN,
    };
    sharedGalleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);
  }
  return sharedGalleryObserver;
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


const toggleSectionVisibility = (element, shouldShow) => {
  if (!element) return;

  if (shouldShow) {
    element.classList.remove('hidden');
    element.removeAttribute('hidden');
  } else {
    element.classList.add('hidden');
    element.setAttribute('hidden', '');
  }
};

const renderInlineGalleries = (imagesByCategory = {}) => {
  if (typeof document === 'undefined') return;

  const inlineGalleries = document.querySelectorAll('[data-gallery-slug]');

  inlineGalleries.forEach((gridElement) => {
    const slug = gridElement.getAttribute('data-gallery-slug');
    const parentSection = gridElement.closest('[data-gallery-section]');

    if (!slug || !(slug in imagesByCategory)) {
      gridElement.replaceChildren();
      toggleSectionVisibility(parentSection, false);
      return;
    }

    const limitAttr = Number.parseInt(
      gridElement.getAttribute('data-gallery-limit'),
      10,
    );
    const limit = Number.isFinite(limitAttr) && limitAttr > 0 ? limitAttr : null;

    const urls = imagesByCategory[slug] || [];
    const limitedUrls = limit ? urls.slice(0, limit) : urls;
    const normalized = hydrateGalleryGrid(gridElement, limitedUrls);

    if (normalized.length === 0) {
      toggleSectionVisibility(parentSection, false);
      return;
    }

    toggleSectionVisibility(parentSection, true);
    initGalleryUI(gridElement);
  });
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
    lightboxImg.alt = img.alt || 'Gallery image';

    // Add ARIA attributes for accessibility
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');
    lightboxImg.setAttribute(
      'aria-label',
      `Image ${boundedIndex + 1} of ${items.length}`
    );

    lightbox.classList.add('active');

    if (document.body) {
      document.body.style.overflow = 'hidden';
    }

    currentImageIndex = boundedIndex;

    // Focus the close button for keyboard users
    setTimeout(() => lightboxClose.focus(), 100);
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
    // Make gallery items keyboard-accessible
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'View image in lightbox');

    const handleItemActivation = () => {
      const items = getGalleryItems();
      const index = items.indexOf(item);
      if (index !== -1) {
        openLightbox(index);
      }
    };

    item.addEventListener('click', handleItemActivation);

    // Add keyboard support
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleItemActivation();
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
        if (touchEndX < touchStartX - SWIPE_THRESHOLD_PX) {
          nextImage();
        } else if (touchEndX > touchStartX + SWIPE_THRESHOLD_PX) {
          prevImage();
        }
      }
    });

    lightboxInitialized = true;
  }

  // Use shared observer for better performance
  const observer = getGalleryObserver();
  gridElement.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
};

/**
 * Initializes the gallery UI with category filtering and lightbox functionality.
 * Renders inline galleries on service pages and main gallery page with category dropdown.
 * @param {Object} galleryData - Gallery data containing categories, images, and covers
 * @param {Array} galleryData.categories - Array of category objects with name and slug
 * @param {Object} galleryData.imagesByCategory - Map of category slugs to image URL arrays
 * @param {Object} galleryData.coverByCategory - Map of category slugs to cover image URLs
 * @returns {void}
 */
export function initGallery(galleryData) {
  const {
    categories = [],
    imagesByCategory = {},
    coverByCategory = {},
  } = galleryData || {};

  if (typeof window === 'undefined') return;
  renderInlineGalleries(imagesByCategory);
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
      try {
        renderCategory(select.value);
      } catch (error) {
        console.error('Failed to render gallery category:', error);
        if (grid) {
          grid.innerHTML = '<div class="text-center text-gray-400 p-8">Unable to load gallery. Please refresh the page.</div>';
        }
      }
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
    try {
      renderCategory(initialSlug);
    } catch (error) {
      console.error('Failed to render initial gallery category:', error);
      hydrateGalleryGrid(grid, []);
    }
  } else {
    hydrateGalleryGrid(grid, []);
  }
}

