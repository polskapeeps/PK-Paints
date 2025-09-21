import { SERVICE_GALLERY_PAGE_SECTIONS } from './gallery-manifest.js';

const getPageSlug = () => {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname || '';
  const file = path.split('/').pop() || '';
  const slug = file.replace(/\.html$/, '');
  return slug || '';
};

const asArray = (value) => (Array.isArray(value) ? value : []);

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

    if (!urls.length) {
      grid.innerHTML =
        '<p class="text-sm text-gray-400">Gallery coming soon.</p>';
      container.classList.add('service-gallery-empty');
      return;
    }

    const maxItems =
      typeof config.limit === 'number' && config.limit > 0
        ? config.limit
        : urls.length;

    const fragment = document.createDocumentFragment();

    urls.slice(0, maxItems).forEach((url, index) => {
      if (typeof url !== 'string' || !url.trim()) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'service-gallery-thumb';

      const img = document.createElement('img');
      img.src = url;
      img.alt = buildAltText(config, index);
      img.loading = 'lazy';
      img.decoding = 'async';

      wrapper.appendChild(img);
      fragment.appendChild(wrapper);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
    grid.classList.add('service-gallery-grid--loaded');
    container.classList.add('service-gallery-ready');
  });
}
