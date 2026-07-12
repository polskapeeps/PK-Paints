// Configuration constants
const GALLERY_PRELOAD_ATTRIBUTE = 'data-gallery-preload';
const SWIPE_THRESHOLD_PX = 100;
const OBSERVER_THRESHOLD = 0.1;
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';
const MAX_PRELOAD_IMAGES = 1;

// Module-level state
let lightboxInitialized = false;
let reducedMotionStylesApplied = false;
let reducedMotionListenerRegistered = false;
let sharedGalleryObserver = null;

const normalizeImageUrl = (url) => (typeof url === 'string' ? url.trim() : '');

const normalizeImageEntry = (value) => {
  if (typeof value === 'string') {
    const full = normalizeImageUrl(value);
    return full ? { full, thumbnail: full, alt: 'Project photo', caption: '' } : null;
  }

  if (!value || typeof value !== 'object') return null;
  const full = normalizeImageUrl(value.full);
  if (!full) return null;

  return {
    full,
    thumbnail: normalizeImageUrl(value.thumbnail) || full,
    alt: typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : 'Project photo',
    caption: typeof value.caption === 'string' ? value.caption.trim() : '',
  };
};

const normalizeImageList = (urls) => {
  if (!Array.isArray(urls)) return [];

  const seen = new Set();
  const normalized = [];

  for (const value of urls) {
    const entry = normalizeImageEntry(value);
    if (!entry || seen.has(entry.full)) continue;
    seen.add(entry.full);
    normalized.push(entry);
  }

  return normalized;
};

const updatePreloadLinks = (urls = []) => {
  if (typeof document === 'undefined') return;
  const head = document.head;
  if (!head) return;

  const selector = `link[${GALLERY_PRELOAD_ATTRIBUTE}]`;
  head.querySelectorAll(selector).forEach((link) => link.remove());

  urls.slice(0, MAX_PRELOAD_IMAGES).forEach((entry) => {
    const href = normalizeImageUrl(entry.thumbnail);
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

const createGalleryItem = (entry, gridElement) => {
  const wrapper = document.createElement('button');
  wrapper.type = 'button';
  wrapper.className = 'gallery-item overflow-hidden fade-in';
  wrapper.style.transition = 'transform 0.3s ease';
  wrapper.dataset.fullSrc = entry.full;
  wrapper.setAttribute('aria-label', `Open ${entry.alt} in the image viewer`);

  const img = document.createElement('img');
  img.alt = entry.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 720;
  img.height = 540;
  img.src = entry.thumbnail;

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
  if (entry.caption) {
    const caption = document.createElement('span');
    caption.className = 'gallery-caption';
    caption.textContent = entry.caption;
    wrapper.appendChild(caption);
  }
  return wrapper;
};

const hydrateGalleryGrid = (gridElement, urls = []) => {
  if (!gridElement) return [];

  const normalizedUrls = normalizeImageList(urls);
  const fragment = document.createDocumentFragment();

  normalizedUrls.forEach((entry) => {
    fragment.appendChild(createGalleryItem(entry, gridElement));
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
  const lightboxStatus = document.getElementById('lightbox-status');

  if (!lightbox || !lightboxImg || !lightboxClose || !lightboxPrev || !lightboxNext) {
    return;
  }

  const getGalleryItems = () =>
    Array.from(gridElement.querySelectorAll('.gallery-item'));

  let currentImageIndex = 0;
  let lastFocusedElement = null;

  const updateLightboxImage = (item, index, total) => {
    const img = item.querySelector('img');
    const src = item.dataset.fullSrc || img?.currentSrc || img?.src;
    if (!img || !src) return false;

    lightboxImg.src = src;
    lightboxImg.alt = img.alt || 'Project photo';
    const announcement = `${lightboxImg.alt}. Image ${index + 1} of ${total}.`;
    lightboxImg.setAttribute('aria-label', announcement);
    if (lightboxStatus) lightboxStatus.textContent = announcement;
    return true;
  };

  const openLightbox = (index, triggerElement = null) => {
    const items = getGalleryItems();
    if (items.length === 0) return;

    const boundedIndex = index >= 0 && index < items.length ? index : 0;
    const item = items[boundedIndex];
    if (!item) return;

    if (!updateLightboxImage(item, boundedIndex, items.length)) return;

    // Add ARIA attributes for accessibility
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image viewer');
    lastFocusedElement =
      triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');

    if (document.body) {
      document.body.style.overflow = 'hidden';
    }

    currentImageIndex = boundedIndex;

    // Focus the close button for keyboard users
    setTimeout(() => lightboxClose.focus(), 100);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    if (document.body) {
      document.body.style.overflow = 'auto';
    }
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  };

  const updateImageFromIndex = (index) => {
    const items = getGalleryItems();
    if (items.length === 0) return;

    const normalizedIndex = ((index % items.length) + items.length) % items.length;
    const item = items[normalizedIndex];
    if (!item) return;

    if (!updateLightboxImage(item, normalizedIndex, items.length)) return;
    currentImageIndex = normalizedIndex;
  };

  const nextImage = () => updateImageFromIndex(currentImageIndex + 1);
  const prevImage = () => updateImageFromIndex(currentImageIndex - 1);

  const galleryItems = getGalleryItems();

  galleryItems.forEach((item) => {
    const handleItemActivation = () => {
      const items = getGalleryItems();
      const index = items.indexOf(item);
      if (index !== -1) {
        openLightbox(index, item);
      }
    };

    item.addEventListener('click', handleItemActivation);
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
      } else if (event.key === 'Tab') {
        const controls = [lightboxClose, lightboxPrev, lightboxNext].filter(
          (control) => !control.disabled,
        );
        const currentIndex = controls.indexOf(document.activeElement);
        if (event.shiftKey && currentIndex <= 0) {
          event.preventDefault();
          controls[controls.length - 1].focus();
        } else if (!event.shiftKey && currentIndex === controls.length - 1) {
          event.preventDefault();
          controls[0].focus();
        }
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
    const heroUrl = cover || normalizeImageUrl(fallbackImages[0]?.full) || '';
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
