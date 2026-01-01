// Configuration constants
const SLIDESHOW_INTERVAL_MS = 8000;
const SLIDESHOW_RESUME_DELAY_MS = 8000;
const PARALLAX_RATE = -0.2;
const PARALLAX_MIN_WIDTH = 768;
const PARALLAX_THROTTLE_MS = 16; // ~60fps

// Throttle utility to limit function execution frequency
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Initializes the hero slideshow with automatic rotation and user controls.
 * Handles slide transitions, indicator clicks, visibility changes, and parallax effects.
 * @returns {void}
 */
export function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.indicator');
  if (slides.length === 0) {
    return; // Skip initialization when slideshow elements are absent
  }
  let currentSlide = 0;
  let slideInterval;
  let resumeTimeout;

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
    slideInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL_MS);
  };

  // Function to stop automatic slideshow
  const stopSlideshow = () => {
    clearInterval(slideInterval);
  };

  // Add click and keyboard listeners to indicators
  indicators.forEach((indicator, index) => {
    // Make indicators keyboard-focusable and accessible
    indicator.setAttribute('tabindex', '0');
    indicator.setAttribute('role', 'button');
    indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);

    const handleIndicatorActivation = () => {
      showSlide(index);
      stopSlideshow(); // Stop auto-play when user manually selects
      clearTimeout(resumeTimeout); // Clear any pending resume
      resumeTimeout = setTimeout(startSlideshow, SLIDESHOW_RESUME_DELAY_MS);
    };

    indicator.addEventListener('click', handleIndicatorActivation);

    // Add keyboard support
    indicator.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleIndicatorActivation();
      }
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

  // Enhanced parallax effect for glass theme
  const heroSection = document.querySelector('.hero-bg');
  if (heroSection) {
    const handleParallax = throttle(() => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * PARALLAX_RATE;

      // Only apply on larger screens to avoid performance issues on mobile
      if (window.innerWidth > PARALLAX_MIN_WIDTH) {
        heroSection.style.transform = `translateY(${rate}px)`;
      }
    }, PARALLAX_THROTTLE_MS);

    window.addEventListener('scroll', handleParallax);
  }
}
