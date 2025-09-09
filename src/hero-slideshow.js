export function initHeroSlideshow() {
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
}
