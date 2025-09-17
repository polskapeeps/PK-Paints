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

  const { categories = [] } = galleryData || {};
  if (desktopGalleryMenu) {
    desktopGalleryMenu.innerHTML = categories
      .map(
        (c) =>
          `<a href="gallery.html?category=${c.slug}" class="block px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200 rounded-lg mx-2" role="menuitem">${c.name}</a>`
      )
      .join('');
  }
  if (mobileGalleryMenu) {
    mobileGalleryMenu.innerHTML = categories
      .map(
        (c) =>
          `<a href="gallery.html?category=${c.slug}" class="block py-3 px-4 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200">${c.name}</a>`
      )
      .join('');
  }

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isExpanded = mobileMenu.classList.toggle('hidden');
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);

      if (
        isExpanded &&
        mobileServicesMenu &&
        !mobileServicesMenu.classList.contains('hidden')
      ) {
        mobileServicesMenu.classList.add('hidden');
        if (mobileServicesButton) {
          mobileServicesButton.setAttribute('aria-expanded', 'false');
          if (mobileServicesButtonSvg)
            mobileServicesButtonSvg.style.transform = '';
        }
      }
      if (
        isExpanded &&
        mobileGalleryMenu &&
        !mobileGalleryMenu.classList.contains('hidden')
      ) {
        mobileGalleryMenu.classList.add('hidden');
        if (mobileGalleryButton) {
          mobileGalleryButton.setAttribute('aria-expanded', 'false');
          if (mobileGalleryButtonSvg)
            mobileGalleryButtonSvg.style.transform = '';
        }
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

  // Handle ARIA for desktop dropdown (visibility is CSS driven by :hover)
  if (desktopServicesButton && desktopServicesMenu) {
    const dropdownParent = desktopServicesButton.closest('.dropdown');

    if (dropdownParent) {
      dropdownParent.addEventListener('mouseenter', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'true');
      });

      dropdownParent.addEventListener('mouseleave', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'false');
      });

      desktopServicesButton.addEventListener('focus', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'true');
      });

      const menuItems = desktopServicesMenu.querySelectorAll('a[role="menuitem"]');
      const lastMenuItem = menuItems[menuItems.length - 1];

      if (lastMenuItem) {
        lastMenuItem.addEventListener('blur', (event) => {
          if (
            !desktopServicesMenu.contains(event.relatedTarget) &&
            event.relatedTarget !== desktopServicesButton
          ) {
            desktopServicesButton.setAttribute('aria-expanded', 'false');
          }
        });
      }
      dropdownParent.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          desktopServicesButton.setAttribute('aria-expanded', 'false');
          desktopServicesButton.focus();
        }
      });
    }
  }

  if (desktopGalleryButton && desktopGalleryMenu) {
    const dropdownParent = desktopGalleryButton.closest('.dropdown');

    if (dropdownParent) {
      dropdownParent.addEventListener('mouseenter', () => {
        desktopGalleryButton.setAttribute('aria-expanded', 'true');
      });

      dropdownParent.addEventListener('mouseleave', () => {
        desktopGalleryButton.setAttribute('aria-expanded', 'false');
      });

      desktopGalleryButton.addEventListener('focus', () => {
        desktopGalleryButton.setAttribute('aria-expanded', 'true');
      });

      const menuItems = desktopGalleryMenu.querySelectorAll('a[role="menuitem"]');
      const lastMenuItem = menuItems[menuItems.length - 1];

      if (lastMenuItem) {
        lastMenuItem.addEventListener('blur', (event) => {
          if (
            !desktopGalleryMenu.contains(event.relatedTarget) &&
            event.relatedTarget !== desktopGalleryButton
          ) {
            desktopGalleryButton.setAttribute('aria-expanded', 'false');
          }
        });
      }

      dropdownParent.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          desktopGalleryButton.setAttribute('aria-expanded', 'false');
          desktopGalleryButton.focus();
        }
      });
    }
  }

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
              mobileMenu.classList.add('hidden');
              mobileMenuButton.setAttribute('aria-expanded', 'false');
              if (
                mobileServicesMenu &&
                !mobileServicesMenu.classList.contains('hidden')
              ) {
                mobileServicesMenu.classList.add('hidden');
                if (mobileServicesButton)
                  mobileServicesButton.setAttribute('aria-expanded', 'false');
                if (mobileServicesButtonSvg)
                  mobileServicesButtonSvg.style.transform = '';
              }
              if (
                mobileGalleryMenu &&
                !mobileGalleryMenu.classList.contains('hidden')
              ) {
                mobileGalleryMenu.classList.add('hidden');
                if (mobileGalleryButton)
                  mobileGalleryButton.setAttribute('aria-expanded', 'false');
                if (mobileGalleryButtonSvg)
                  mobileGalleryButtonSvg.style.transform = '';
              }
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

  const header = document.querySelector('header');
  const headerAnchors = header
    ? header.querySelectorAll('a[href^="#"], a[href="#"]')
    : [];

  const anchorGroups = new Map();

  headerAnchors.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const key = href === '#' ? 'home' : href.slice(1);
    const existing = anchorGroups.get(key) || [];
    existing.push(link);
    anchorGroups.set(key, existing);
  });

  const clearActiveLinks = () => {
    anchorGroups.forEach((links) => {
      links.forEach((link) => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      });
    });
  };

  const setActiveLinks = (key) => {
    if (!anchorGroups.size) return;
    clearActiveLinks();
    const targetLinks = anchorGroups.get(key);
    if (targetLinks) {
      targetLinks.forEach((link) => {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      });
    }
  };

  if (anchorGroups.size) {
    let currentKey = 'home';
    setActiveLinks(currentKey);

    const observedSections = Array.from(
      document.querySelectorAll('main section[id]')
    ).filter((section) => anchorGroups.has(section.id));

    if (observedSections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              currentKey = entry.target.id;
              setActiveLinks(currentKey);
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: '-45% 0px -45% 0px',
        }
      );

      observedSections.forEach((section) => sectionObserver.observe(section));
    }

    const handleScrollTopState = () => {
      if (window.scrollY < 120 && currentKey !== 'home') {
        currentKey = 'home';
        setActiveLinks(currentKey);
      }
    };

    window.addEventListener('scroll', handleScrollTopState, {
      passive: true,
    });
    handleScrollTopState();
  }

  // Enhanced intersection observer for glass theme animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
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

  document.querySelectorAll('.service-card, .gallery-item').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition =
      'opacity 0.8s ease-out, transform 0.8s ease-out, box-shadow 0.8s ease-out';
    observer.observe(el);
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
