/* ============================================
   FloraHub USA — Core Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initSearchPlaceholderAnimation();
  initBackToTop();
});

/**
 * Sticky Header Shrink & Shadow on Scroll
 */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  // Run on load and scroll
  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

/**
 * Mobile Navigation Drawer Toggling
 */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.header__mobile-toggle');
  const closeBtn = document.querySelector('.mobile-nav__close');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (!toggleBtn || !mobileNav) return;

  // Backdrop overlay creator
  const backdrop = document.createElement('div');
  backdrop.style.position = 'fixed';
  backdrop.style.inset = '0';
  backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  backdrop.style.backdropFilter = 'blur(4px)';
  backdrop.style.zIndex = '199'; // just below mobile nav (200) but above content
  backdrop.style.opacity = '0';
  backdrop.style.visibility = 'hidden';
  backdrop.style.transition = 'all 0.4s ease';
  document.body.appendChild(backdrop);

  const openMenu = () => {
    mobileNav.classList.add('is-open');
    backdrop.style.opacity = '1';
    backdrop.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileNav.classList.remove('is-open');
    backdrop.style.opacity = '0';
    backdrop.style.visibility = 'hidden';
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  // Accordion submenus for mobile navigation
  const subMenuLinks = document.querySelectorAll('.mobile-nav__link--has-submenu');
  subMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = link.nextElementSibling;
      const chevron = link.querySelector('.fa-chevron-down');
      
      if (submenu && submenu.classList.contains('mobile-nav__submenu')) {
        const isOpen = submenu.classList.contains('is-open');
        
        // Close others
        document.querySelectorAll('.mobile-nav__submenu').forEach(sub => sub.classList.remove('is-open'));
        document.querySelectorAll('.mobile-nav__link--has-submenu .fa-chevron-down').forEach(c => c.style.transform = '');
        
        if (!isOpen) {
          submenu.classList.add('is-open');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      }
    });
  });
}

/**
 * Animated Search Placeholder text typing/cycling effect
 */
function initSearchPlaceholderAnimation() {
  const searchInput = document.querySelector('.header__search-input');
  if (!searchInput) return;

  const placeholders = [
    'Search for "Monstera Deliciosa"...',
    'Search for "Flowering Hydrangea"...',
    'Search for "Dwarf Java Fern"...',
    'Search for "Premium Potting Mix"...',
    'Search for "Watering Can"...'
  ];

  let currentIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 100;
  let text = '';

  const type = () => {
    const fullText = placeholders[currentIdx];
    
    if (isDeleting) {
      text = fullText.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 50;
    } else {
      text = fullText.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 100;
    }

    searchInput.setAttribute('placeholder', text);

    if (!isDeleting && text === fullText) {
      typingSpeed = 2000; // Hold full text
      isDeleting = true;
    } else if (isDeleting && text === '') {
      isDeleting = false;
      currentIdx = (currentIdx + 1) % placeholders.length;
      typingSpeed = 500; // pause before typing next
    }

    setTimeout(type, typingSpeed);
  };

  // Start the typing animation loop
  setTimeout(type, 1000);
}

/**
 * Back to Top button functionality
 */
function initBackToTop() {
  const btn = document.querySelector('.footer__back-to-top');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
