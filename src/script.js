import './style.css';
import { buildGallery } from './gallery-builder.js';
import heroImage1 from './assets/hero/[21] interior_04-2021.jpeg';
import heroImage2 from './assets/hero/[67] interior_11-2022.jpeg';
import exterior from './assets/exterior.png';
import dine from './assets/dine.png';
import dine2 from './assets/dine2.png';

let galleryDataPromise = null;
let lightboxInitialized = false;

// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', async () => {
  // Hero Slideshow Functionality
  const initHeroSlideshow = () => {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length === 0) {
      return; // Skip initialization when slideshow elements are absent
    }
    let currentSlide = 0;
    let slideInterval;

    // Function to show a specific slide
    const showSlide = (index) => {
      // Remove active class from all slides and indicators
      slides.forEach((slide) => slide.classList.remove('active'));
      indicators.forEach((indicator) => indicator.classList.remove('active'));

      // Add active class to current slide and indicator
      slides[index].classList.add('active');
      indicators[index].classList.add('active');

      currentSlide = index;
    };

    // Function to go to next slide
    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    };

    // Function to start automatic slideshow
    const startSlideshow = () => {
      slideInterval = setInterval(nextSlide, 8000); // Change slide every 8 seconds
    };

    // Function to stop automatic slideshow
    const stopSlideshow = () => {
      clearInterval(slideInterval);
    };

    // Add click listeners to indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        showSlide(index);
        stopSlideshow(); // Stop auto-play when user manually selects
        setTimeout(startSlideshow, 8000); // Resume auto-play after 8 seconds
      });
    });

    // Start the slideshow
    startSlideshow();

    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopSlideshow();
      } else {
        startSlideshow();
      }
    });
  };

  // Initialize slideshow when DOM is ready
  initHeroSlideshow();

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  // Mobile services dropdown toggle
  const mobileServicesButton = document.getElementById(
    'mobile-services-button'
  );
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
  const desktopServicesButton = document.getElementById(
    'desktop-services-button'
  );
  const desktopServicesMenu = document.getElementById('desktop-services-menu');

  // Desktop gallery dropdown toggle (for aria attributes, actual visibility is CSS driven)
  const desktopGalleryButton = document.getElementById(
    'desktop-gallery-button'
  );
  const desktopGalleryMenu = document.getElementById('desktop-gallery-menu');

  // Only build gallery data on pages that need it
  const servicePages = [
    'interior-painting',
    'exterior-painting',
    'carpentry',
    'remodeling',
  ];
  const isServicePage = servicePages.some((slug) =>
    window.location.pathname.includes(slug)
  );
  const galleryGrid = document.querySelector('.gallery-grid');

  if ((desktopGalleryMenu || mobileGalleryMenu) && (galleryGrid || isServicePage)) {
    galleryDataPromise = galleryDataPromise || buildGallery();
    const { categories } = await galleryDataPromise;

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
  }

  // Highlight current navigation link
  const currentPath =
    window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, #mobile-menu a').forEach((link) => {
    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }
    const linkPath = new URL(href, window.location.origin).pathname
      .split('/')
      .pop();
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });
  if (currentPath === 'gallery.html') {
    if (desktopGalleryButton) desktopGalleryButton.classList.add('active');
    if (mobileGalleryButton) mobileGalleryButton.classList.add('active');
  }

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isExpanded = mobileMenu.classList.toggle('hidden');
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded); // True if menu is NOT hidden (visible)

      // If mobile menu is closed, also ensure services submenu is closed and its button aria is updated
      if (
        isExpanded &&
        mobileServicesMenu &&
        !mobileServicesMenu.classList.contains('hidden')
      ) {
        mobileServicesMenu.classList.add('hidden');
        if (mobileServicesButton) {
          mobileServicesButton.setAttribute('aria-expanded', 'false');
          if (mobileServicesButtonSvg)
            mobileServicesButtonSvg.style.transform = ''; // Reset arrow
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
      e.preventDefault(); // Prevent page jump if it's an anchor
      const isExpanded = mobileServicesMenu.classList.toggle('hidden');
      mobileServicesButton.setAttribute('aria-expanded', !isExpanded); // True if menu is NOT hidden
      if (mobileServicesButtonSvg) {
        // Rotate arrow icon
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
    const dropdownParent = desktopServicesButton.closest('.dropdown'); // Get the parent .dropdown element

    if (dropdownParent) {
      dropdownParent.addEventListener('mouseenter', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'true');
      });

      dropdownParent.addEventListener('mouseleave', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'false');
      });

      // For keyboard accessibility
      desktopServicesButton.addEventListener('focus', () => {
        desktopServicesButton.setAttribute('aria-expanded', 'true');
      });

      // Need to handle focusout carefully to not close when focusing on menu items
      const menuItems =
        desktopServicesMenu.querySelectorAll('a[role="menuitem"]');
      const lastMenuItem = menuItems[menuItems.length - 1];

      if (lastMenuItem) {
        lastMenuItem.addEventListener('blur', (event) => {
          // If focus moves outside the dropdown menu, close it
          if (
            !desktopServicesMenu.contains(event.relatedTarget) &&
            event.relatedTarget !== desktopServicesButton
          ) {
            desktopServicesButton.setAttribute('aria-expanded', 'false');
          }
        });
      }
      // Close dropdown if Escape key is pressed
      dropdownParent.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          desktopServicesButton.setAttribute('aria-expanded', 'false');
          desktopServicesButton.focus(); // Return focus to the button
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
      // Ensure it's a valid ID selector and not just "#"
      if (href.length > 1 && href.startsWith('#')) {
        try {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            e.preventDefault(); // Only prevent default if we found an element to scroll to
            targetElement.scrollIntoView({
              behavior: 'smooth',
            });

            // If it's a mobile menu link, close the mobile menu
            if (
              mobileMenu &&
              !mobileMenu.classList.contains('hidden') &&
              mobileMenu.contains(this)
            ) {
              mobileMenu.classList.add('hidden');
              mobileMenuButton.setAttribute('aria-expanded', 'false');
              // Also close product submenu if open
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

  // Enhanced parallax effect for glass theme
  const heroSection = document.querySelector('.hero-bg');
  if (heroSection) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.2; // Reduced rate for subtlety

      // Only apply on larger screens to avoid performance issues on mobile
      if (window.innerWidth > 768) {
        heroSection.style.transform = `translateY(${rate}px)`;
      }
    });
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

        // Add glass glow effect on scroll into view
        if (entry.target.classList.contains('service-card')) {
          entry.target.style.boxShadow = '0 16px 48px rgba(59, 130, 246, 0.15)';
        }
      }
    });
  }, observerOptions);

  // Observe service cards and gallery items for enhanced fade-in effect
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

    // Pause animations when page is not visible for performance
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

  // Initialize background shape controls
  controlBackgroundShapes();

  // Performance optimization - reduce motion for users who prefer it
  const respectReducedMotion = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    if (prefersReducedMotion.matches) {
      // Disable floating animations
      document
        .querySelectorAll('.float-1, .float-2, .float-3')
        .forEach((el) => {
          el.style.animation = 'none';
        });

      // Reduce background shape animations
      document.querySelectorAll('.bg-shape').forEach((shape) => {
        shape.style.animation = 'none';
      });
    }
  };

  // Initialize reduced motion support
  respectReducedMotion();
});

// Enhanced Gallery Functionality
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
  const preloadImages = [heroImage1, heroImage2, exterior, dine, dine2];

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
    // Reduce motion for users who prefer it
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

// Setup filtering and lightbox interactions
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

// Initialize gallery enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.gallery-grid');
  if (grid) {
    galleryDataPromise = galleryDataPromise || buildGallery();
    const select = document.getElementById('gallery-select');
    const { categories, imagesByCategory } = await galleryDataPromise;

    const renderCategory = (slug) => {
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
});

