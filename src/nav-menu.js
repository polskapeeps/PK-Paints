// Configuration constants
const OBSERVER_THRESHOLD = 0.1;
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';

// Module-level shared observer
let sharedServiceCardObserver = null;

// HTML escape utility to prevent XSS attacks
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Reusable function to initialize desktop dropdown menus with ARIA support
const initDesktopDropdown = (buttonElement, menuElement) => {
  if (!buttonElement || !menuElement) return;

  const dropdownParent = buttonElement.closest('.dropdown');
  if (!dropdownParent) return;

  const setOpen = (isOpen) => {
    dropdownParent.classList.toggle('is-open', isOpen);
    buttonElement.setAttribute('aria-expanded', String(isOpen));
  };

  dropdownParent.addEventListener('mouseenter', () => {
    setOpen(true);
  });

  dropdownParent.addEventListener('mouseleave', () => {
    if (!dropdownParent.contains(document.activeElement)) setOpen(false);
  });

  buttonElement.addEventListener('focus', () => {
    setOpen(true);
  });

  buttonElement.addEventListener('click', () => {
    setOpen(buttonElement.getAttribute('aria-expanded') !== 'true');
  });

  const menuItems = menuElement.querySelectorAll('a');
  const lastMenuItem = menuItems[menuItems.length - 1];

  if (lastMenuItem) {
    lastMenuItem.addEventListener('blur', (event) => {
      if (
        !menuElement.contains(event.relatedTarget) &&
        event.relatedTarget !== buttonElement
      ) {
        setOpen(false);
      }
    });
  }

  dropdownParent.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      buttonElement.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!dropdownParent.contains(event.target)) setOpen(false);
  });
};

/**
 * Initializes the navigation menu with mobile/desktop dropdowns and gallery categories.
 * Sets up event listeners, ARIA attributes, and intersection observers for animations.
 * @param {Object} galleryData - Gallery data containing categories, images, and covers
 * @param {Array} galleryData.categories - Array of category objects with name and slug
 * @param {Object} galleryData.imagesByCategory - Map of category slugs to image arrays
 * @param {Object} galleryData.coverByCategory - Map of category slugs to cover images
 * @returns {void}
 */
export function initNavMenu(galleryData) {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  // Mobile services dropdown toggle
  const mobileServicesButton = document.getElementById('mobile-services-button');
  const mobileServicesMenu = document.getElementById('mobile-services-menu');
  const mobileServicesButtonSvg = mobileServicesButton
    ? mobileServicesButton.querySelector('svg')
    : null;

  // Mobile gallery dropdown toggle
  const mobileGalleryButton = document.getElementById('mobile-gallery-button');
  const mobileGalleryMenu = document.getElementById('mobile-gallery-menu');
  const mobileGalleryButtonSvg = mobileGalleryButton
    ? mobileGalleryButton.querySelector('svg')
    : null;

  // Desktop services dropdown toggle (for aria attributes, actual visibility is CSS driven)
  const desktopServicesButton = document.getElementById('desktop-services-button');
  const desktopServicesMenu = document.getElementById('desktop-services-menu');

  // Desktop gallery dropdown toggle (for aria attributes, actual visibility is CSS driven)
  const desktopGalleryButton = document.getElementById('desktop-gallery-button');
  const desktopGalleryMenu = document.getElementById('desktop-gallery-menu');

  const setMobileSubmenusClosed = () => {
    if (mobileServicesMenu) mobileServicesMenu.classList.add('hidden');
    if (mobileServicesButton) {
      mobileServicesButton.setAttribute('aria-expanded', 'false');
    }
    if (mobileServicesButtonSvg) mobileServicesButtonSvg.style.transform = '';

    if (mobileGalleryMenu) mobileGalleryMenu.classList.add('hidden');
    if (mobileGalleryButton) {
      mobileGalleryButton.setAttribute('aria-expanded', 'false');
    }
    if (mobileGalleryButtonSvg) mobileGalleryButtonSvg.style.transform = '';
  };

  const setMobileMenuOpen = (isOpen) => {
    if (!mobileMenuButton || !mobileMenu) return;
    mobileMenu.classList.toggle('hidden', !isOpen);
    mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
    const accessibleLabel = mobileMenuButton.querySelector('.sr-only');
    if (accessibleLabel) {
      accessibleLabel.textContent = isOpen ? 'Close main menu' : 'Open main menu';
    }
    if (!isOpen) setMobileSubmenusClosed();
  };

  const { categories = [] } = galleryData || {};
  if (desktopGalleryMenu) {
    desktopGalleryMenu.innerHTML = categories
      .map(
        (c) =>
          `<a href="gallery.html?category=${encodeURIComponent(c.slug)}" class="block px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200 rounded-lg mx-2">${escapeHtml(c.name)}</a>`
      )
      .join('');
  }
  if (mobileGalleryMenu) {
    mobileGalleryMenu.innerHTML = categories
      .map(
        (c) =>
          `<a href="gallery.html?category=${encodeURIComponent(c.slug)}" class="block py-3 px-4 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200">${escapeHtml(c.name)}</a>`
      )
      .join('');
  }

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      setMobileMenuOpen(mobileMenu.classList.contains('hidden'));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        setMobileMenuOpen(false);
        mobileMenuButton.focus();
      }
    });
  }

  if (mobileServicesButton && mobileServicesMenu) {
    mobileServicesButton.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = mobileServicesMenu.classList.toggle('hidden');
      mobileServicesButton.setAttribute('aria-expanded', !isExpanded);
      if (mobileServicesButtonSvg) {
        mobileServicesButtonSvg.style.transform = !isExpanded
          ? 'rotate(180deg)'
          : '';
      }
    });
  }

  if (mobileGalleryButton && mobileGalleryMenu) {
    mobileGalleryButton.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = mobileGalleryMenu.classList.toggle('hidden');
      mobileGalleryButton.setAttribute('aria-expanded', !isExpanded);
      if (mobileGalleryButtonSvg) {
        mobileGalleryButtonSvg.style.transform = !isExpanded
          ? 'rotate(180deg)'
          : '';
      }
    });
  }

  // Initialize desktop dropdown menus with ARIA support
  initDesktopDropdown(desktopServicesButton, desktopServicesMenu);
  initDesktopDropdown(desktopGalleryButton, desktopGalleryMenu);

  // Set current year in footer
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length > 1 && href.startsWith('#')) {
        try {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
            });

            if (
              mobileMenu &&
              !mobileMenu.classList.contains('hidden') &&
              mobileMenu.contains(this)
            ) {
              setMobileMenuOpen(false);
            }
          } else {
            console.warn(`Smooth scroll target not found: ${href}`);
          }
        } catch (error) {
          console.error(`Invalid selector for smooth scroll: ${href}`, error);
        }
      }
    });
  });

  // Get or create shared IntersectionObserver for service card animations
  if (!sharedServiceCardObserver) {
    const observerOptions = {
      threshold: OBSERVER_THRESHOLD,
      rootMargin: OBSERVER_ROOT_MARGIN,
    };

    sharedServiceCardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';

          if (entry.target.classList.contains('service-card')) {
            entry.target.style.boxShadow =
              '0 16px 48px rgba(59, 130, 246, 0.15)';
          }
        }
      });
    }, observerOptions);
  }

  document.querySelectorAll('.service-card, .gallery-item').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition =
      'opacity 0.8s ease-out, transform 0.8s ease-out, box-shadow 0.8s ease-out';
    sharedServiceCardObserver.observe(el);
  });

  // Background shape animation controls
  const controlBackgroundShapes = () => {
    const shapes = document.querySelectorAll('.bg-shape');

    document.addEventListener('visibilitychange', () => {
      shapes.forEach((shape) => {
        if (document.hidden) {
          shape.style.animationPlayState = 'paused';
        } else {
          shape.style.animationPlayState = 'running';
        }
      });
    });
  };

  controlBackgroundShapes();

  // Performance optimization - reduce motion for users who prefer it
  const respectReducedMotion = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    if (prefersReducedMotion.matches) {
      document
        .querySelectorAll('.float-1, .float-2, .float-3')
        .forEach((el) => {
          el.style.animation = 'none';
        });

      document.querySelectorAll('.bg-shape').forEach((shape) => {
        shape.style.animation = 'none';
      });
    }
  };

  respectReducedMotion();
}
