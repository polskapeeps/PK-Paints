import './style.css';
import { buildGallery } from './gallery-builder.js';

// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
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

  // Mobile products dropdown toggle
  const mobileProductsButton = document.getElementById(
    'mobile-products-button'
  );
  const mobileProductsMenu = document.getElementById('mobile-products-menu');
  const mobileProductsButtonSvg = mobileProductsButton
    ? mobileProductsButton.querySelector('svg')
    : null;

  // Desktop products dropdown toggle (for aria attributes, actual visibility is CSS driven)
  const desktopProductsButton = document.getElementById(
    'desktop-products-button'
  );
  const desktopProductsMenu = document.getElementById('desktop-products-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      const isExpanded = mobileMenu.classList.toggle('hidden');
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded); // True if menu is NOT hidden (visible)

      // If mobile menu is closed, also ensure product submenu is closed and its button aria is updated
      if (
        isExpanded &&
        mobileProductsMenu &&
        !mobileProductsMenu.classList.contains('hidden')
      ) {
        mobileProductsMenu.classList.add('hidden');
        if (mobileProductsButton) {
          mobileProductsButton.setAttribute('aria-expanded', 'false');
          if (mobileProductsButtonSvg)
            mobileProductsButtonSvg.style.transform = ''; // Reset arrow
        }
      }
    });
  }

  if (mobileProductsButton && mobileProductsMenu) {
    mobileProductsButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent page jump if it's an anchor
      const isExpanded = mobileProductsMenu.classList.toggle('hidden');
      mobileProductsButton.setAttribute('aria-expanded', !isExpanded); // True if menu is NOT hidden
      if (mobileProductsButtonSvg) {
        // Rotate arrow icon
        mobileProductsButtonSvg.style.transform = !isExpanded
          ? 'rotate(180deg)'
          : '';
      }
    });
  }

  // Handle ARIA for desktop dropdown (visibility is CSS driven by :hover)
  if (desktopProductsButton && desktopProductsMenu) {
    const dropdownParent = desktopProductsButton.closest('.dropdown'); // Get the parent .dropdown element

    if (dropdownParent) {
      dropdownParent.addEventListener('mouseenter', () => {
        desktopProductsButton.setAttribute('aria-expanded', 'true');
      });

      dropdownParent.addEventListener('mouseleave', () => {
        desktopProductsButton.setAttribute('aria-expanded', 'false');
      });

      // For keyboard accessibility
      desktopProductsButton.addEventListener('focus', () => {
        desktopProductsButton.setAttribute('aria-expanded', 'true');
      });

      // Need to handle focusout carefully to not close when focusing on menu items
      const menuItems =
        desktopProductsMenu.querySelectorAll('a[role="menuitem"]');
      const lastMenuItem = menuItems[menuItems.length - 1];

      if (lastMenuItem) {
        lastMenuItem.addEventListener('blur', (event) => {
          // If focus moves outside the dropdown menu, close it
          if (
            !desktopProductsMenu.contains(event.relatedTarget) &&
            event.relatedTarget !== desktopProductsButton
          ) {
            desktopProductsButton.setAttribute('aria-expanded', 'false');
          }
        });
      }
      // Close dropdown if Escape key is pressed
      dropdownParent.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          desktopProductsButton.setAttribute('aria-expanded', 'false');
          desktopProductsButton.focus(); // Return focus to the button
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
                mobileProductsMenu &&
                !mobileProductsMenu.classList.contains('hidden')
              ) {
                mobileProductsMenu.classList.add('hidden');
                if (mobileProductsButton)
                  mobileProductsButton.setAttribute('aria-expanded', 'false');
                if (mobileProductsButtonSvg)
                  mobileProductsButtonSvg.style.transform = '';
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

  // Glass theme enhancements - Dynamic glass effects
  const addDynamicGlassEffects = () => {
    // Enhanced hover effects for glass cards
    document
      .querySelectorAll('.glass-card, .glass-card-strong')
      .forEach((card) => {
        card.addEventListener('mouseenter', () => {
          card.style.background = 'rgba(255, 255, 255, 0.1)';
          card.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        });

        card.addEventListener('mouseleave', () => {
          // Reset to original glass styling
          if (card.classList.contains('glass-card-strong')) {
            card.style.background = 'rgba(255, 255, 255, 0.08)';
          } else {
            card.style.background = 'rgba(255, 255, 255, 0.05)';
          }
          card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
      });
  }; // Added closing brace here
  // Initialize dynamic glass effects
  // addDynamicGlassEffects();

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
  const preloadImages = [
    'assets/gallery/showers_35.jpg',
    'assets/gallery/shower-2.jpg',
    'assets/gallery/doors_03.jpg',
    'assets/gallery/railing_04.jpg',
  ];

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

  // Smooth category transitions
  const categoryFilters = document.querySelectorAll('.gallery-filter');

  categoryFilters.forEach((filter) => {
    filter.addEventListener('click', () => {
      // Add loading animation
      const loader = document.createElement('div');
      loader.innerHTML =
        '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto my-4"></div>';
      loader.className = 'gallery-loader';

      const gallery = document.querySelector('.gallery-grid');
      if (gallery) {
        gallery.appendChild(loader);

        // Remove loader after transition
        setTimeout(() => {
          if (loader.parentNode) {
            loader.remove();
          }
        }, 600);
      }
    });
  });

  // Keyboard navigation for lightbox
  let touchStartX = 0;
  let touchEndX = 0;

  // Touch gestures for mobile lightbox navigation
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
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
        // Swipe left - next image
        const nextBtn = document.querySelector('.lightbox-next');
        if (nextBtn) nextBtn.click();
      }

      if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right - previous image
        const prevBtn = document.querySelector('.lightbox-prev');
        if (prevBtn) prevBtn.click();
      }
    }
  }

  // Gallery statistics counter
  const updateGalleryStats = () => {
    const totalImages = document.querySelectorAll('.gallery-item').length;
    const categoryStats = {};

    document.querySelectorAll('[data-category]').forEach((section) => {
      const category = section.getAttribute('data-category');
      const count = section.querySelectorAll('.gallery-item').length;
      categoryStats[category] = count;
    });

    // You can display these stats somewhere if needed
    console.log('Gallery Stats:', { total: totalImages, ...categoryStats });
  };

  updateGalleryStats();

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
  const filterButtons = document.querySelectorAll('.gallery-filter');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const categorySections = document.querySelectorAll('[data-category]');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');

      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      categorySections.forEach((section) => {
        const category = section.getAttribute('data-category');
        if (filter === 'all' || filter === category) {
          section.style.display = 'block';
          setTimeout(() => {
            section.classList.add('visible');
          }, 100);
        } else {
          section.classList.remove('visible');
          setTimeout(() => {
            section.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  let currentImageIndex = 0;
  let visibleImages = [];

  function updateVisibleImages() {
    visibleImages = Array.from(
      document.querySelectorAll('.gallery-item img')
    ).filter((img) => {
      return img.closest('[data-category]').style.display !== 'none';
    });
  }

  function openLightbox(index) {
    updateVisibleImages();
    currentImageIndex = index;
    lightboxImg.src = visibleImages[currentImageIndex].src;
    lightboxImg.alt = visibleImages[currentImageIndex].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  function nextImage() {
    updateVisibleImages();
    currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
    lightboxImg.src = visibleImages[currentImageIndex].src;
    lightboxImg.alt = visibleImages[currentImageIndex].alt;
  }

  function prevImage() {
    updateVisibleImages();
    currentImageIndex =
      (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
    lightboxImg.src = visibleImages[currentImageIndex].src;
    lightboxImg.alt = visibleImages[currentImageIndex].alt;
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      updateVisibleImages();
      const img = item.querySelector('img');
      const imageIndex = visibleImages.indexOf(img);
      openLightbox(imageIndex);
    });
  });

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

  categorySections.forEach((section) => {
    section.classList.add('visible');
  });

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
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('gallery')) {
    // 1. build the gallery grid
    const grids = document.querySelectorAll('[data-category] .gallery-grid');
    const markup = buildGallery();
    grids.forEach((grid) => {
      const section = grid.closest('[data-category]');
      const category = section ? section.getAttribute('data-category') : '';
      grid.innerHTML = markup[category] || '';
    });

    // 2. then wire up your enhancements
    initGalleryEnhancements();
    initGalleryUI();
  }
});

// Add this CSS for the loading animation (add to your style.css)
const galleryStyles = `
.gallery-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  opacity: 0.7;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`;

// Inject styles if on gallery page
if (window.location.pathname.includes('gallery')) {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = galleryStyles;
  document.head.appendChild(styleSheet);
}
