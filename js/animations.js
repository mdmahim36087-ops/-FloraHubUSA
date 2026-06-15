/* ============================================
   FloraHub USA — Scroll Reveal Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
});

/**
 * Uses Intersection Observer to fade in/slide up elements as they enter viewport
 */
function initScrollReveal() {
  // Add CSS styles for animation directly
  const animStyles = document.createElement('style');
  animStyles.textContent = `
    .reveal-item {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .reveal-item.reveal-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .reveal-stagger-container {
      /* helper container wrapper */
    }
  `;
  document.head.appendChild(animStyles);

  const revealItems = document.querySelectorAll('.reveal-item, .product-card, .category-card, .promise-card, .blog-card');
  
  // Create Observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -80px 0px', // trigger slightly before entering view
    threshold: 0.15 // 15% visibility
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Handle stagger inside parent grids
        const element = entry.target;
        const parent = element.parentElement;
        
        if (parent && parent.classList.contains('products-grid') || parent && parent.classList.contains('blog-grid') || parent && parent.classList.contains('promise-grid')) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(element);
          
          element.style.transitionDelay = `${index * 80}ms`;
        }
        
        // Add default layout classes and activate
        element.classList.add('reveal-visible');
        
        // Remove class styles once animated to avoid layout lock issues
        setTimeout(() => {
          element.style.transitionDelay = '';
        }, 1000);

        obs.unobserve(element); // only animate once
      }
    });
  }, observerOptions);

  // Observe items
  revealItems.forEach(item => {
    // Prep item inline styles
    item.classList.add('reveal-item');
    observer.observe(item);
  });
}
