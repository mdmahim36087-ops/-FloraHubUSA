/* ============================================
   FloraHub USA — Lightweight Custom Carousel
   ============================================ */

class FloraCarousel {
  constructor(element, options = {}) {
    if (!element) return;
    this.carousel = element;
    this.track = element.querySelector('.product-carousel__track') || element.querySelector('.testimonial-carousel__track');
    this.slides = Array.from(this.track ? this.track.children : []);
    
    // Default options
    this.options = {
      autoplay: false,
      autoplayInterval: 5000,
      itemsVisible: 4,
      responsive: {
        0: 1,
        600: 2,
        1024: 3,
        1400: 4
      },
      ...options
    };

    if (this.slides.length === 0) return;

    this.currentIndex = 0;
    this.initControls();
    this.updateLayout();
    this.bindEvents();

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  }

  initControls() {
    // Buttons
    this.prevBtn = this.carousel.parentElement.querySelector('.carousel-btn--prev');
    this.nextBtn = this.carousel.parentElement.querySelector('.carousel-btn--next');

    this.updateControlsState();
  }

  updateLayout() {
    this.width = this.carousel.getBoundingClientRect().width;
    
    // Determine visible items based on screen width
    const screenWidth = window.innerWidth;
    let itemsVisible = this.options.itemsVisible;

    if (this.options.responsive) {
      const breakPoints = Object.keys(this.options.responsive).map(Number).sort((a, b) => b - a);
      for (const bp of breakPoints) {
        if (screenWidth >= bp) {
          itemsVisible = this.options.responsive[bp];
          break;
        }
      }
    }

    this.itemsVisible = itemsVisible;
    this.maxIndex = Math.max(0, this.slides.length - this.itemsVisible);

    // Style slides width
    const gap = parseFloat(window.getComputedStyle(this.track).gap) || 0;
    const totalGapsWidth = gap * (this.itemsVisible - 1);
    const slideWidth = (this.width - totalGapsWidth) / this.itemsVisible;

    this.slideWidthWithGap = slideWidth + gap;

    this.slides.forEach(slide => {
      slide.style.width = `${slideWidth}px`;
    });

    this.goToIndex(this.currentIndex, false);
  }

  goToIndex(index, animate = true) {
    this.currentIndex = Math.max(0, Math.min(index, this.maxIndex));

    if (animate) {
      this.track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      this.track.style.transition = 'none';
    }

    const translateOffset = -this.currentIndex * this.slideWidthWithGap;
    this.track.style.transform = `translateX(${translateOffset}px)`;

    this.updateControlsState();
  }

  next() {
    if (this.currentIndex < this.maxIndex) {
      this.goToIndex(this.currentIndex + 1);
    } else if (this.options.autoplay) {
      this.goToIndex(0); // loop back
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goToIndex(this.currentIndex - 1);
    }
  }

  updateControlsState() {
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex >= this.maxIndex;
    }
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.stopAutoplay();
        this.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.stopAutoplay();
        this.next();
      });
    }

    // Window resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateLayout();
      }, 150);
    });

    // Touch/Drag events
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationRef;

    const getPositionX = (event) => {
      return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    };

    const dragStart = (event) => {
      this.stopAutoplay();
      isDragging = true;
      startPos = getPositionX(event);
      this.track.style.transition = 'none';
      
      const matrix = new DOMMatrix(window.getComputedStyle(this.track).transform);
      prevTranslate = matrix.m41;
    };

    const dragAction = (event) => {
      if (!isDragging) return;
      const currentPosition = getPositionX(event);
      const diff = currentPosition - startPos;
      currentTranslate = prevTranslate + diff;
      
      // Limit dragging beyond edges
      const maxTranslate = 0;
      const minTranslate = -this.maxIndex * this.slideWidthWithGap;
      
      if (currentTranslate > 0) currentTranslate = diff * 0.2;
      if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate + (currentTranslate - minTranslate) * 0.2;
      }

      this.track.style.transform = `translateX(${currentTranslate}px)`;
    };

    const dragEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      // Calculate how many slides we moved
      const movedBy = (currentTranslate - prevTranslate) / this.slideWidthWithGap;

      if (movedBy < -0.3) {
        this.goToIndex(this.currentIndex + 1);
      } else if (movedBy > 0.3) {
        this.goToIndex(this.currentIndex - 1);
      } else {
        this.goToIndex(this.currentIndex);
      }
    };

    // Bind touch/mouse
    this.track.addEventListener('touchstart', dragStart, { passive: true });
    this.track.addEventListener('touchmove', dragAction, { passive: true });
    this.track.addEventListener('touchend', dragEnd);

    this.track.addEventListener('mousedown', dragStart);
    this.track.addEventListener('mousemove', dragAction);
    this.track.addEventListener('mouseup', dragEnd);
    this.track.addEventListener('mouseleave', dragEnd);
  }

  startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, this.options.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
    }
  }
}

/**
 * Simple Hero Slider implementation
 */
function initHeroSlider() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll('.hero__slide'));
  const dotsContainer = hero.querySelector('.hero__dots');
  const prevBtn = hero.querySelector('.hero__arrow--prev');
  const nextBtn = hero.querySelector('.hero__arrow--next');
  
  if (slides.length === 0) return;

  let activeIdx = 0;
  let sliderInterval;

  // Create dot indicators
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `hero__dot ${idx === 0 ? 'is-active' : ''}`;
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetInterval();
    });
    if (dotsContainer) dotsContainer.appendChild(dot);
  });

  const dots = Array.from(hero.querySelectorAll('.hero__dot'));

  const goToSlide = (index) => {
    slides[activeIdx].classList.remove('is-active');
    if (dots[activeIdx]) dots[activeIdx].classList.remove('is-active');
    
    activeIdx = (index + slides.length) % slides.length;
    
    slides[activeIdx].classList.add('is-active');
    if (dots[activeIdx]) dots[activeIdx].classList.add('is-active');
  };

  const nextSlide = () => {
    goToSlide(activeIdx + 1);
  };

  const prevSlide = () => {
    goToSlide(activeIdx - 1);
  };

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetInterval();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetInterval();
    });
  }

  const startInterval = () => {
    sliderInterval = setInterval(nextSlide, 7000);
  };

  const resetInterval = () => {
    clearInterval(sliderInterval);
    startInterval();
  };

  startInterval();
}

// Initialise carousels on load
document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();

  // Initialize testimonials carousel
  const testimonialsElement = document.querySelector('#testimonials-carousel');
  if (testimonialsElement) {
    new FloraCarousel(testimonialsElement, {
      itemsVisible: 3,
      autoplay: true,
      autoplayInterval: 6000,
      responsive: {
        0: 1,
        768: 2,
        1024: 3
      }
    });
  }
});
