// Configuration constants
const GALLERY_PRELOAD_ATTRIBUTE = 'data-gallery-preload';
const SWIPE_THRESHOLD_PX = 60;
const OBSERVER_THRESHOLD = 0.1;
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';
const PREFERRED_SLUGS = ['interior-painting', 'exterior-painting', 'custom-trim'];

// Module-level state
let sharedGalleryObserver = null;
let lightboxController = null;

const normalizeImageUrl = (url) => (typeof url === 'string' ? url.trim() : '');

const normalizeImageEntry = (value) => {
  if (typeof value === 'string') {
    const full = normalizeImageUrl(value);
    return full ? { full, thumbnail: full, alt: 'Project photo' } : null;
  }

  if (!value || typeof value !== 'object') return null;
  const full = normalizeImageUrl(value.full);
  if (!full) return null;

  return {
    full,
    thumbnail: normalizeImageUrl(value.thumbnail) || full,
    alt: typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : 'Project photo',
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

const updatePreloadLinks = (entries = []) => {
  const head = document.head;
  if (!head) return;

  head.querySelectorAll(`link[${GALLERY_PRELOAD_ATTRIBUTE}]`).forEach((link) => link.remove());

  const href = normalizeImageUrl(entries[0]?.thumbnail);
  if (!href) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.setAttribute(GALLERY_PRELOAD_ATTRIBUTE, 'true');
  head.appendChild(link);
};

// Shared IntersectionObserver that fades gallery tiles in as they scroll into view.
const observeTiles = (gridElement) => {
  const tiles = gridElement.querySelectorAll('.fade-in');
  if (!('IntersectionObserver' in window)) {
    tiles.forEach((tile) => tile.classList.add('visible'));
    return;
  }
  if (!sharedGalleryObserver) {
    sharedGalleryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          sharedGalleryObserver.unobserve(entry.target);
        });
      },
      { threshold: OBSERVER_THRESHOLD, rootMargin: OBSERVER_ROOT_MARGIN },
    );
  }
  tiles.forEach((tile) => sharedGalleryObserver.observe(tile));
};

const createGalleryItem = (entry, gridElement) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gallery-item fade-in';
  button.dataset.fullSrc = entry.full;
  button.setAttribute('aria-label', `Open ${entry.alt} in the image viewer`);

  const img = document.createElement('img');
  img.alt = entry.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 720;
  img.height = 540;
  img.src = entry.thumbnail;

  img.addEventListener('error', () => {
    button.remove();
    if (gridElement.children.length === 0) gridElement.classList.remove('visible');
  });

  button.appendChild(img);
  return button;
};

const hydrateGalleryGrid = (gridElement, urls = []) => {
  if (!gridElement) return [];

  const normalizedUrls = normalizeImageList(urls);
  const fragment = document.createDocumentFragment();
  normalizedUrls.forEach((entry) => fragment.appendChild(createGalleryItem(entry, gridElement)));

  gridElement.replaceChildren(fragment);
  gridElement.classList.toggle('visible', normalizedUrls.length > 0);
  observeTiles(gridElement);

  return normalizedUrls;
};

/**
 * One lightbox per page, shared by every gallery grid on it. Navigation always walks
 * the grid that opened it, so pages with several grids (or a re-rendered grid) stay in sync.
 */
const getLightbox = () => {
  if (lightboxController) return lightboxController;

  const root = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  const closeButton = root?.querySelector('.lightbox-close');
  const prevButton = root?.querySelector('.lightbox-prev');
  const nextButton = root?.querySelector('.lightbox-next');
  const status = document.getElementById('lightbox-status');
  if (!root || !image || !closeButton || !prevButton || !nextButton) return null;

  let items = [];
  let index = 0;
  let returnFocusTo = null;

  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Image viewer');

  const counter = document.createElement('p');
  counter.className = 'lightbox-counter';
  counter.setAttribute('aria-hidden', 'true');
  root.appendChild(counter);

  const preload = (position) => {
    const item = items[(position + items.length) % items.length];
    if (item?.dataset.fullSrc) new Image().src = item.dataset.fullSrc;
  };

  const show = (position) => {
    if (items.length === 0) return;
    index = ((position % items.length) + items.length) % items.length;
    const item = items[index];
    const thumbnail = item.querySelector('img');
    image.src = item.dataset.fullSrc || thumbnail?.currentSrc || thumbnail?.src || '';
    image.alt = thumbnail?.alt || 'Project photo';
    if (status) status.textContent = `${image.alt}. Image ${index + 1} of ${items.length}.`;
    counter.textContent = `${index + 1} / ${items.length}`;

    const single = items.length < 2;
    prevButton.hidden = single;
    nextButton.hidden = single;
    if (!single) {
      preload(index + 1);
      preload(index - 1);
    }
  };

  const isOpen = () => root.classList.contains('active');

  const close = () => {
    if (!isOpen()) return;
    root.classList.remove('active');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    image.removeAttribute('src');
    if (returnFocusTo?.isConnected) returnFocusTo.focus();
  };

  const open = (gridItems, startIndex, trigger) => {
    items = gridItems;
    returnFocusTo = trigger;
    show(startIndex);
    root.classList.add('active');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  closeButton.addEventListener('click', close);
  prevButton.addEventListener('click', () => show(index - 1));
  nextButton.addEventListener('click', () => show(index + 1));
  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowRight') show(index + 1);
    else if (event.key === 'ArrowLeft') show(index - 1);
    else if (event.key === 'Tab') {
      const controls = [closeButton, prevButton, nextButton].filter((control) => !control.hidden);
      const current = controls.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && current === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
    }
  });

  let touchStartX = 0;
  root.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0]?.screenX ?? 0;
  }, { passive: true });
  root.addEventListener('touchend', (event) => {
    const delta = (event.changedTouches[0]?.screenX ?? touchStartX) - touchStartX;
    if (delta < -SWIPE_THRESHOLD_PX) show(index + 1);
    else if (delta > SWIPE_THRESHOLD_PX) show(index - 1);
  });

  lightboxController = { open };
  return lightboxController;
};

// Delegated so re-rendering a grid's tiles never stacks duplicate listeners.
const bindGridToLightbox = (gridElement) => {
  if (gridElement.dataset.lightboxBound) return;
  gridElement.dataset.lightboxBound = 'true';
  gridElement.addEventListener('click', (event) => {
    const item = event.target.closest('.gallery-item');
    const lightbox = getLightbox();
    if (!item || !lightbox) return;
    const items = Array.from(gridElement.querySelectorAll('.gallery-item'));
    lightbox.open(items, items.indexOf(item), item);
  });
};

const toggleSectionVisibility = (element, shouldShow) => {
  if (!element) return;
  element.classList.toggle('hidden', !shouldShow);
  element.toggleAttribute('hidden', !shouldShow);
};

const renderInlineGalleries = (imagesByCategory = {}) => {
  document.querySelectorAll('[data-gallery-slug]').forEach((gridElement) => {
    const slug = gridElement.getAttribute('data-gallery-slug');
    const parentSection = gridElement.closest('[data-gallery-section]');
    const limitAttr = Number.parseInt(gridElement.getAttribute('data-gallery-limit'), 10);
    const limit = Number.isFinite(limitAttr) && limitAttr > 0 ? limitAttr : undefined;

    const urls = slug in imagesByCategory ? imagesByCategory[slug].slice(0, limit) : [];
    const normalized = hydrateGalleryGrid(gridElement, urls);
    toggleSectionVisibility(parentSection, normalized.length > 0);
    if (normalized.length > 0) bindGridToLightbox(gridElement);
  });
};

/**
 * Initializes inline galleries on service pages and, on the gallery page, the category
 * filter chips, hero image, and full grid. Every grid opens the shared lightbox.
 * @param {Object} galleryData - Gallery data containing categories, images, and covers
 * @param {Array} galleryData.categories - Array of category objects with name and slug
 * @param {Object} galleryData.imagesByCategory - Map of category slugs to image arrays
 * @param {Object} galleryData.coverByCategory - Map of category slugs to cover image URLs
 * @returns {void}
 */
export function initGallery(galleryData) {
  const { categories = [], imagesByCategory = {}, coverByCategory = {} } = galleryData || {};

  renderInlineGalleries(imagesByCategory);

  const grid = document.querySelector('.gallery-page-grid');
  if (!grid) return;
  bindGridToLightbox(grid);

  const filters = document.querySelector('.gallery-filters');
  const heroEl = document.querySelector('.service-hero');
  const getValidSlug = (slug) => (typeof slug === 'string' && slug in imagesByCategory ? slug : null);

  const renderCategory = (slug) => {
    const images = hydrateGalleryGrid(grid, imagesByCategory[slug]);
    updatePreloadLinks(images);

    const heroUrl = normalizeImageUrl(coverByCategory[slug]) || images[0]?.full;
    if (heroEl && heroUrl) heroEl.style.backgroundImage = `url('${heroUrl}')`;

    filters?.querySelectorAll('.gallery-chip').forEach((chip) => {
      const active = chip.dataset.slug === slug;
      chip.setAttribute('aria-pressed', String(active));
      // Keep the active chip visible when the row scrolls sideways on phones.
      if (active && filters.scrollWidth > filters.clientWidth) {
        filters.scrollLeft = chip.offsetLeft - (filters.clientWidth - chip.offsetWidth) / 2;
      }
    });
  };

  if (filters) {
    const fragment = document.createDocumentFragment();
    categories.forEach(({ name, slug }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gallery-chip';
      chip.dataset.slug = slug;
      chip.setAttribute('aria-pressed', 'false');
      chip.textContent = name;
      const count = document.createElement('span');
      count.className = 'gallery-chip-count';
      count.textContent = String(imagesByCategory[slug]?.length || 0);
      count.setAttribute('aria-label', `${count.textContent} photos`);
      chip.appendChild(count);
      fragment.appendChild(chip);
    });
    filters.replaceChildren(fragment);

    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.gallery-chip');
      const slug = getValidSlug(chip?.dataset.slug);
      if (!slug) return;
      renderCategory(slug);
      const url = new URL(window.location.href);
      url.searchParams.set('category', slug);
      window.history.replaceState(null, '', url);
    });
  }

  const requestedSlug = getValidSlug(new URLSearchParams(window.location.search).get('category'));
  const initialSlug =
    requestedSlug ||
    PREFERRED_SLUGS.map(getValidSlug).find(Boolean) ||
    getValidSlug(categories[0]?.slug);

  if (initialSlug) renderCategory(initialSlug);
  else hydrateGalleryGrid(grid, []);
}
