import { SERVICE_GALLERY_CATEGORIES, SERVICE_GALLERY_PAGE_SECTIONS } from './gallery-manifest.js';

const LIGHTBOX_ID = 'service-lightbox';
const LIGHTBOX_ACTIVE_CLASS = 'service-lightbox--active';
const LIGHTBOX_NAV_PREV = -1;
const LIGHTBOX_NAV_NEXT = 1;

const serviceLightboxState = {
  overlay: null,
  dialog: null,
  image: null,
  caption: null,
  prev: null,
  next: null,
  close: null,
  urls: [],
  alts: [],
  currentIndex: 0,
  previousOverflow: '',
  lastFocused: null,
};

let lightboxKeyListenerAttached = false;

const stripFingerprint = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/(?:-|\.)[a-f0-9]{8,}(?=\.[^.]+$)/gi, '');
};

const getFileNameFromUrl = (url) => {
  if (typeof url !== 'string') return '';
  const [base] = url.split('?');
  if (!base) return '';
  const segments = base.split('/');
  const fileName = segments.pop() || '';
  return stripFingerprint(fileName);
};

const findManifestEntry = (slug) => {
  if (!slug) return null;
  return (SERVICE_GALLERY_CATEGORIES || []).find((entry) => {
    if (!entry) return false;
    if (entry.slug && entry.slug === slug) return true;
    if (entry.sourceCategory) {
      const normalized = stripFingerprint(entry.sourceCategory)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (normalized === slug) return true;
    }
    return false;
  });
};

const getPageSlug = () => {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname || '';
  const file = path.split('/').pop() || '';
  const slug = file.replace(/\.html$/, '');
  return slug || '';
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const resolveServiceUrls = (manifestEntry, urls) => {
  const availableUrls = Array.isArray(urls) ? urls : [];
  if (!manifestEntry) return availableUrls;

  const fileMap = new Map(
    availableUrls
      .map((url) => [getFileNameFromUrl(url), url])
      .filter(([fileName]) => Boolean(fileName))
  );

  const curated = Array.isArray(manifestEntry.images)
    ? manifestEntry.images
        .map((file) => (typeof file === 'string' ? file.trim() : ''))
        .map((file) => fileMap.get(file))
        .filter(Boolean)
    : [];

  if (curated.length) {
    return curated;
  }

  return availableUrls;
};

const buildAltText = (config, index) => {
  if (
    config &&
    typeof config.altPrefix === 'string' &&
    config.altPrefix.trim()
  ) {
    return `${config.altPrefix.trim()} ${index + 1}`;
  }

  if (config && typeof config.heading === 'string' && config.heading.trim()) {
    return `${config.heading.trim()} ${index + 1}`;
  }

  return `Project image ${index + 1}`;
};

function ensureServiceLightbox() {
  if (typeof document === 'undefined') return serviceLightboxState;
  if (serviceLightboxState.overlay) return serviceLightboxState;

  const overlay = document.createElement('div');
  overlay.id = LIGHTBOX_ID;
  overlay.className = 'service-lightbox';
  overlay.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'service-lightbox-content';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  overlay.appendChild(dialog);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'service-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close gallery');
  closeBtn.innerHTML = '&times;';
  dialog.appendChild(closeBtn);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'service-lightbox-nav service-lightbox-nav--prev';
  prevBtn.setAttribute('aria-label', 'Previous image');
  prevBtn.innerHTML = '&#10094;';
  dialog.appendChild(prevBtn);

  const figure = document.createElement('figure');
  figure.className = 'service-lightbox-figure';

  const img = document.createElement('img');
  img.className = 'service-lightbox-image';
  img.alt = '';
  figure.appendChild(img);

  const caption = document.createElement('figcaption');
  caption.className = 'service-lightbox-caption';
  figure.appendChild(caption);

  dialog.appendChild(figure);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'service-lightbox-nav service-lightbox-nav--next';
  nextBtn.setAttribute('aria-label', 'Next image');
  nextBtn.innerHTML = '&#10095;';
  dialog.appendChild(nextBtn);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeServiceLightbox();
    }
  });

  closeBtn.addEventListener('click', () => {
    closeServiceLightbox();
  });

  prevBtn.addEventListener('click', () => {
    changeLightboxImage(LIGHTBOX_NAV_PREV);
  });

  nextBtn.addEventListener('click', () => {
    changeLightboxImage(LIGHTBOX_NAV_NEXT);
  });

  document.body.appendChild(overlay);

  serviceLightboxState.overlay = overlay;
  serviceLightboxState.dialog = dialog;
  serviceLightboxState.image = img;
  serviceLightboxState.caption = caption;
  serviceLightboxState.prev = prevBtn;
  serviceLightboxState.next = nextBtn;
  serviceLightboxState.close = closeBtn;

  return serviceLightboxState;
}

function setLightboxImage(index) {
  const total = serviceLightboxState.urls.length;
  if (!total || !serviceLightboxState.image) return;

  const normalizedIndex = ((index % total) + total) % total;
  serviceLightboxState.currentIndex = normalizedIndex;

  const src = serviceLightboxState.urls[normalizedIndex];
  const alt = serviceLightboxState.alts[normalizedIndex] || '';

  serviceLightboxState.image.src = src;
  serviceLightboxState.image.alt = alt;

  if (serviceLightboxState.caption) {
    serviceLightboxState.caption.textContent = `${alt} (${normalizedIndex + 1} of ${total})`;
  }
}

function changeLightboxImage(step) {
  if (!serviceLightboxState.overlay?.classList.contains(LIGHTBOX_ACTIVE_CLASS)) {
    return;
  }

  const nextIndex = serviceLightboxState.currentIndex + step;
  setLightboxImage(nextIndex);
}

function handleLightboxKeydown(event) {
  if (!serviceLightboxState.overlay?.classList.contains(LIGHTBOX_ACTIVE_CLASS)) {
    return;
  }

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeServiceLightbox();
      break;
    case 'ArrowRight':
      event.preventDefault();
      changeLightboxImage(LIGHTBOX_NAV_NEXT);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      changeLightboxImage(LIGHTBOX_NAV_PREV);
      break;
    default:
      break;
  }
}

function addLightboxKeyListener() {
  if (lightboxKeyListenerAttached || typeof document === 'undefined') return;
  document.addEventListener('keydown', handleLightboxKeydown);
  lightboxKeyListenerAttached = true;
}

function removeLightboxKeyListener() {
  if (!lightboxKeyListenerAttached || typeof document === 'undefined') return;
  document.removeEventListener('keydown', handleLightboxKeydown);
  lightboxKeyListenerAttached = false;
}

function closeServiceLightbox() {
  if (!serviceLightboxState.overlay) return;

  serviceLightboxState.overlay.classList.remove(LIGHTBOX_ACTIVE_CLASS);
  serviceLightboxState.overlay.setAttribute('aria-hidden', 'true');

  if (serviceLightboxState.image) {
    serviceLightboxState.image.src = '';
    serviceLightboxState.image.alt = '';
  }

  if (typeof document !== 'undefined' && document.body) {
    if (serviceLightboxState.previousOverflow) {
      document.body.style.overflow = serviceLightboxState.previousOverflow;
    } else {
      document.body.style.removeProperty('overflow');
    }
  }

  removeLightboxKeyListener();

  if (serviceLightboxState.lastFocused && typeof serviceLightboxState.lastFocused.focus === 'function') {
    try {
      serviceLightboxState.lastFocused.focus();
    } catch (error) {
      // Ignore focus restoration errors.
    }
  }

  serviceLightboxState.urls = [];
  serviceLightboxState.alts = [];
  serviceLightboxState.previousOverflow = '';
  serviceLightboxState.lastFocused = null;
}

function openServiceLightbox(urls, alts, startIndex = 0, dialogLabel = '') {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const lightbox = ensureServiceLightbox();
  if (!lightbox.overlay || !lightbox.dialog) return;

  lightbox.urls = urls;
  lightbox.alts = alts;
  lightbox.currentIndex = 0;

  if (dialogLabel && lightbox.dialog) {
    lightbox.dialog.setAttribute('aria-label', dialogLabel);
  } else {
    lightbox.dialog.removeAttribute('aria-label');
  }

  if (typeof document !== 'undefined') {
    lightbox.lastFocused = document.activeElement;
    if (document.body) {
      lightbox.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  setLightboxImage(startIndex);

  lightbox.overlay.classList.add(LIGHTBOX_ACTIVE_CLASS);
  lightbox.overlay.setAttribute('aria-hidden', 'false');

  addLightboxKeyListener();

  if (lightbox.close) {
    lightbox.close.focus();
  }
}

function attachLightboxToGrid(grid, config, urls, alts) {
  if (!grid || !Array.isArray(urls) || urls.length === 0) return;

  const thumbs = Array.from(grid.querySelectorAll('.service-gallery-thumb'));
  if (!thumbs.length) return;

  const dialogLabel = config?.heading || 'Project gallery';

  thumbs.forEach((thumb, index) => {
    if (!thumb || thumb.dataset.lightboxBound === 'true') return;

    thumb.dataset.lightboxBound = 'true';
    thumb.dataset.lightboxIndex = String(index);
    if (!thumb.hasAttribute('tabindex')) {
      thumb.setAttribute('tabindex', '0');
    }
    thumb.setAttribute('role', 'button');

    const open = () => {
      openServiceLightbox(urls, alts, index, dialogLabel);
    };

    thumb.addEventListener('click', (event) => {
      event.preventDefault();
      open();
    });

    thumb.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

export function initServiceGalleries(galleryData) {
  if (typeof document === 'undefined') return;

  const pageSlug = getPageSlug();
  if (!pageSlug) return;

  const sectionsForPage = SERVICE_GALLERY_PAGE_SECTIONS[pageSlug];
  if (!Array.isArray(sectionsForPage) || sectionsForPage.length === 0) return;

  const sectionMap = new Map();
  sectionsForPage.forEach((section) => {
    if (section && section.slug) {
      sectionMap.set(section.slug, section);
    }
  });

  if (!sectionMap.size) return;

  const { imagesByCategory = {} } = galleryData || {};
  const containers = document.querySelectorAll('[data-service-gallery]');
  if (!containers.length) return;

  containers.forEach((container) => {
    const slug = container.getAttribute('data-service-gallery') || '';
    if (!slug || !sectionMap.has(slug)) return;

    const config = sectionMap.get(slug);
    if (config.anchor && !container.id) {
      container.id = config.anchor;
    }

    const headingEl = container.querySelector('[data-gallery-heading]');
    if (headingEl && config.heading) {
      headingEl.textContent = config.heading;
    }

    const copyEl = container.querySelector('[data-gallery-copy]');
    if (copyEl && config.copy) {
      copyEl.textContent = config.copy;
    }

    const grid = container.querySelector('[data-gallery-slug]');
    if (!grid) return;

    const gridSlug = grid.getAttribute('data-gallery-slug') || slug;
    const urls = asArray(imagesByCategory[gridSlug] || imagesByCategory[slug]);
    const manifestEntry = findManifestEntry(slug);
    const resolvedUrls = resolveServiceUrls(manifestEntry, urls);

    if (!resolvedUrls.length) {
      grid.innerHTML =
        '<p class="text-sm text-gray-400">Gallery coming soon.</p>';
      container.classList.add('service-gallery-empty');
      return;
    }

    const maxItems =
      typeof config.limit === 'number' && config.limit > 0
        ? Math.min(config.limit, resolvedUrls.length)
        : resolvedUrls.length;

    const fragment = document.createDocumentFragment();
    const displayedUrls = [];
    const displayedAlts = [];

    resolvedUrls.slice(0, maxItems).forEach((url, index) => {
      if (typeof url !== 'string' || !url.trim()) return;

      const normalizedUrl = url.trim();

      const wrapper = document.createElement('div');
      wrapper.className = 'service-gallery-thumb';

      const img = document.createElement('img');
      img.src = normalizedUrl;
      img.alt = buildAltText(config, index);
      img.loading = 'lazy';
      img.decoding = 'async';

      wrapper.appendChild(img);
      fragment.appendChild(wrapper);

      displayedUrls.push(normalizedUrl);
      displayedAlts.push(img.alt);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
    grid.classList.add('service-gallery-grid--loaded');
    container.classList.add('service-gallery-ready');

    attachLightboxToGrid(grid, config, displayedUrls, displayedAlts);
  });
}
