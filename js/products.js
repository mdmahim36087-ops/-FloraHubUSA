/* ============================================
   FloraHub USA — Product Loading & Catalog Logic
   ============================================ */

let productsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  productsData = await fetchProducts();
  
  if (productsData.length === 0) {
    // Show error on homepage if best sellers track exists
    const bsTrack = document.getElementById('best-sellers-track');
    if (bsTrack) {
      bsTrack.innerHTML = '<p style="text-align:center;color:var(--color-gray-500);padding:var(--space-8);grid-column:1/-1;">Unable to load products. Please refresh the page.</p>';
    }
    // Show error on catalog page
    const catGrid = document.getElementById('catalog-products-grid');
    if (catGrid) {
      catGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:var(--space-12) 0;color:var(--color-gray-500);"><i class="fa fa-exclamation-triangle" style="font-size:48px;margin-bottom:var(--space-4);display:block;"></i><h3>Could not load products</h3><p>Please refresh the page or try again later.</p></div>';
    }
    return;
  }

  // Initialize features based on current page
  if (document.getElementById('catalog-products-grid')) {
    initCatalogPage();
  }
  
  if (document.getElementById('product-detail-container')) {
    initDetailPage();
  }
  
  if (document.getElementById('best-sellers-track')) {
    initHomepageFeatured();
    const bestSellersElement = document.querySelector('#best-sellers-carousel');
    if (bestSellersElement && typeof FloraCarousel !== 'undefined') {
      new FloraCarousel(bestSellersElement, {
        itemsVisible: 4,
        responsive: {
          0: 1,
          600: 2,
          1024: 3,
          1400: 4
        }
      });
    }
  }

  initGlobalSearch();
});

/**
 * Fetch product catalog data — works both via server and file:// protocol
 */
async function fetchProducts() {
  // Use embedded data if available (works with file:// protocol)
  if (window.__PRODUCTS_DATA__ && Array.isArray(window.__PRODUCTS_DATA__)) {
    return window.__PRODUCTS_DATA__;
  }
  // Fallback: fetch from JSON file (requires server)
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Failed to load products data:', e);
    return [];
  }
}

/**
 * Init Global Search bar in header
 */
function initGlobalSearch() {
  const form = document.querySelector('.header__search-form');
  const input = document.querySelector('.header__search-input');
  
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
  });
}

/**
 * Render standard product card
 */
function renderProductCard(product) {
  const price = product.price;
  const salePrice = product.salePrice;
  const hasSale = salePrice !== null;
  const activePrice = hasSale ? salePrice : price;
  
  let badgeHTML = '';
  if (product.badge) {
    let badgeClass = 'badge--best-seller';
    if (product.badge.toLowerCase().includes('sale')) badgeClass = 'badge--sale';
    if (product.badge.toLowerCase().includes('new')) badgeClass = 'badge--new';
    
    badgeHTML = `<span class="badge ${badgeClass}">${product.badge}</span>`;
  } else if (hasSale) {
    badgeHTML = `<span class="badge badge--sale">Sale</span>`;
  }

  // Create stars representation
  const fullStars = Math.floor(product.rating);
  const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHTML = '';
  for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fa fa-star"></i>';
  if (halfStar) starsHTML += '<i class="fa fa-star-half-o"></i>';
  for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="fa fa-star-o"></i>';

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-card__image">
        ${badgeHTML}
        <a href="product-detail.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </a>
        <div class="product-card__actions">
          <button class="product-card__action-btn wishlist-btn" title="Add to Wishlist" data-id="${product.id}">
            <i class="fa fa-heart-o"></i>
          </button>
          <button class="product-card__action-btn quick-view-btn" title="Quick View" data-id="${product.id}">
            <i class="fa fa-eye"></i>
          </button>
        </div>
        <div class="product-card__quick-add">
          <button class="btn btn--primary btn--sm quick-add-cart" data-id="${product.id}">
            Add to Cart
          </button>
        </div>
      </div>
      <div class="product-card__info">
        <span class="product-card__category">${product.category.replace('-', ' ')}</span>
        <h4 class="product-card__name">
          <a href="product-detail.html?id=${product.id}">${product.name}</a>
        </h4>
        <div class="product-card__rating">
          <div class="stars">${starsHTML}</div>
          <span class="rating-text">(${product.reviewCount})</span>
        </div>
        <div class="product-card__price">
          <span class="product-card__price-current ${hasSale ? 'product-card__price-sale' : ''}">$${activePrice.toFixed(2)}</span>
          ${hasSale ? `<span class="product-card__price-original">$${price.toFixed(2)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle Homepage Featured Products
 */
function initHomepageFeatured() {
  const track = document.getElementById('best-sellers-track');
  if (!track) return;

  // Filter 8 best sellers or highest rated plants
  const bestSellers = productsData
    .filter(p => p.badge === 'Best Seller' || p.rating >= 4.8)
    .slice(0, 8);

  track.innerHTML = bestSellers.map(renderProductCard).join('');

  // Setup quick add clicks
  setupQuickAddListeners(track);
}

/**
 * Helper to setup Quick Add To Cart Click handlers
 */
function setupQuickAddListeners(parentContainer) {
  parentContainer.querySelectorAll('.quick-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = parseInt(btn.getAttribute('data-id'));
      const product = productsData.find(p => p.id === id);
      if (product) {
        // Add default size (usually first index of sizes array, or "6\" Pot" if sizes empty)
        const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Default';
        addToCart(product, size, 1);
      }
    });
  });

  // Demo Wishlist and Quickview alerts
  parentContainer.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.querySelector('i').className = 'fa fa-heart';
      btn.style.color = 'var(--color-sale)';
      showToast('Product added to Wishlist!');
    });
  });

  parentContainer.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = parseInt(btn.getAttribute('data-id'));
      const product = productsData.find(p => p.id === id);
      if (product) {
        alert(`Quick View Demo:\n\nName: ${product.name}\nPrice: $${product.price}\nCare Level: ${product.careLevel}\n\nFor full details, click the product name.`);
      }
    });
  });
}

/**
 * Handle Product Catalog Filtering, Sorting, and Search
 */
function initCatalogPage() {
  const grid = document.getElementById('catalog-products-grid');
  const countInfo = document.getElementById('catalog-count-info');
  const sortSelect = document.getElementById('catalog-sort-select');
  const sidebar = document.getElementById('catalog-sidebar');
  const mobileFilterBtn = document.getElementById('mobile-filter-btn');
  
  if (!grid) return;

  // Read URL Params for initial states (category, search, etc.)
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category');
  const initialSearch = urlParams.get('search');

  // Set checkbox values on startup based on URL params
  if (initialCategory) {
    const cb = document.querySelector(`.filter-checkbox[data-filter="category"][value="${initialCategory}"]`);
    if (cb) cb.checked = true;
  }
  
  // Set search text if searching
  if (initialSearch) {
    const searchHeader = document.createElement('div');
    searchHeader.style.gridColumn = '1 / -1';
    searchHeader.style.padding = 'var(--space-4)';
    searchHeader.style.background = 'var(--color-cream)';
    searchHeader.style.borderRadius = 'var(--radius-md)';
    searchHeader.style.marginBottom = 'var(--space-4)';
    searchHeader.innerHTML = `Showing results for: "<strong>${escapeHtml(initialSearch)}</strong>" <a href="products.html" style="color:var(--color-primary); margin-left:var(--space-2); text-decoration:underline;">Clear Search</a>`;
    grid.parentElement.insertBefore(searchHeader, grid);
  }

  // Active filters states
  let activeFilters = {
    category: initialCategory ? [initialCategory] : [],
    careLevel: [],
    light: [],
    petFriendly: false,
    priceMin: 0,
    priceMax: 200,
    search: initialSearch || ''
  };

  const applyFiltersAndRender = () => {
    let filtered = [...productsData];

    // Search query match
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeFilters.category.length > 0) {
      filtered = filtered.filter(p => activeFilters.category.includes(p.category));
    }

    // Care level filter
    if (activeFilters.careLevel.length > 0) {
      filtered = filtered.filter(p => p.careLevel && activeFilters.careLevel.includes(p.careLevel.toLowerCase()));
    }

    // Light level filter
    if (activeFilters.light.length > 0) {
      filtered = filtered.filter(p => p.light && activeFilters.light.includes(p.light.toLowerCase().replace(' ', '-')));
    }

    // Pet friendly filter
    if (activeFilters.petFriendly) {
      filtered = filtered.filter(p => p.petFriendly === true);
    }

    // Price range filters
    filtered = filtered.filter(p => {
      const activePrice = p.salePrice !== null ? p.salePrice : p.price;
      return activePrice >= activeFilters.priceMin && activePrice <= activeFilters.priceMax;
    });

    // Apply Sorting
    const sortBy = sortSelect ? sortSelect.value : 'best-selling';
    if (sortBy === 'price-low-high') {
      filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === 'price-high-low') {
      filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => b.id - a.id); // higher IDs are newer items
    } else {
      // default: best selling (places best seller badges first)
      filtered.sort((a, b) => {
        const aVal = a.badge === 'Best Seller' ? 2 : (a.rating >= 4.7 ? 1 : 0);
        const bVal = b.badge === 'Best Seller' ? 2 : (b.rating >= 4.7 ? 1 : 0);
        return bVal - aVal;
      });
    }

    // Render Grid
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12) 0; color: var(--color-gray-500);">
          <i class="fa fa-info-circle" style="font-size: 48px; color: var(--color-gray-300); margin-bottom: var(--space-4);"></i>
          <h3>No Products Found</h3>
          <p>Try clearing some filters or searching for something else.</p>
        </div>
      `;
      if (countInfo) countInfo.textContent = 'Showing 0 products';
      return;
    }

    grid.innerHTML = filtered.map(renderProductCard).join('');
    if (countInfo) countInfo.textContent = `Showing ${filtered.length} products`;

    setupQuickAddListeners(grid);
    
    // Trigger scroll reveal observer for new cards
    if (window.initScrollReveal) {
      setTimeout(window.initScrollReveal, 100);
    }
  };

  // Checkbox Event Listeners
  document.querySelectorAll('.filter-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const filterType = cb.getAttribute('data-filter');
      const val = cb.value;

      if (filterType === 'petFriendly') {
        activeFilters.petFriendly = cb.checked;
      } else {
        if (cb.checked) {
          activeFilters[filterType].push(val);
        } else {
          activeFilters[filterType] = activeFilters[filterType].filter(item => item !== val);
        }
      }
      applyFiltersAndRender();
    });
  });

  // Price inputs event listeners
  const priceMinInput = document.getElementById('price-min');
  const priceMaxInput = document.getElementById('price-max');
  
  const handlePriceChange = () => {
    const minVal = parseFloat(priceMinInput.value) || 0;
    const maxVal = parseFloat(priceMaxInput.value) || 200;
    activeFilters.priceMin = minVal;
    activeFilters.priceMax = maxVal;
    applyFiltersAndRender();
  };

  if (priceMinInput) priceMinInput.addEventListener('change', handlePriceChange);
  if (priceMaxInput) priceMaxInput.addEventListener('change', handlePriceChange);

  // Clear filters button
  const clearBtn = document.querySelector('.clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
      if (priceMinInput) priceMinInput.value = 0;
      if (priceMaxInput) priceMaxInput.value = 200;
      
      activeFilters = {
        category: [],
        careLevel: [],
        light: [],
        petFriendly: false,
        priceMin: 0,
        priceMax: 200,
        search: ''
      };
      applyFiltersAndRender();
    });
  }

  // Sorting change
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFiltersAndRender);
  }

  // Mobile Filters drawer toggle
  if (mobileFilterBtn && sidebar) {
    // Backdrop creator
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.inset = '0';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    backdrop.style.zIndex = '99';
    backdrop.style.opacity = '0';
    backdrop.style.visibility = 'hidden';
    backdrop.style.transition = 'all 0.3s ease';
    document.body.appendChild(backdrop);

    mobileFilterBtn.addEventListener('click', () => {
      sidebar.classList.add('is-open');
      backdrop.style.opacity = '1';
      backdrop.style.visibility = 'visible';
    });

    const closeFilters = () => {
      sidebar.classList.remove('is-open');
      backdrop.style.opacity = '0';
      backdrop.style.visibility = 'hidden';
    };

    backdrop.addEventListener('click', closeFilters);
  }

  // Initial render
  applyFiltersAndRender();
}

/**
 * Handle Product Detail Template Injection & Page Interactions
 */
function initDetailPage() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  // Parse ID from url params
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id'));

  if (isNaN(productId)) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <h2>Product Not Found</h2>
        <p style="color:var(--color-gray-500); margin: var(--space-4) 0;">We couldn't retrieve the specified product details.</p>
        <a href="products.html" class="btn btn--primary">Back to Catalog</a>
      </div>
    `;
    return;
  }

  const product = productsData.find(p => p.id === productId);

  if (!product) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <h2>Product Not Found</h2>
        <p style="color:var(--color-gray-500); margin: var(--space-4) 0;">The plant with ID ${productId} does not exist in our store.</p>
        <a href="products.html" class="btn btn--primary">Back to Catalog</a>
      </div>
    `;
    return;
  }

  // Update Page Title SEO
  document.title = `${product.name} | FloraHub USA`;

  // Calculate pricing
  const price = product.price;
  const salePrice = product.salePrice;
  const hasSale = salePrice !== null;
  const activePrice = hasSale ? salePrice : price;

  // Stars rating logic
  const fullStars = Math.floor(product.rating);
  const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHTML = '';
  for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fa fa-star"></i>';
  if (halfStar) starsHTML += '<i class="fa fa-star-half-o"></i>';
  for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="fa fa-star-o"></i>';

  // Breadcrumbs title
  const categoryLabel = product.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Size Options Pills
  const sizePillsHTML = product.sizes.map((size, idx) => `
    <button class="size-pill ${idx === 0 ? 'is-active' : ''}" data-size="${size}">${size}</button>
  `).join('');

  // Thumbnails (using base image + product subcategory placeholder for demo consistency)
  const thumbnails = [
    product.image,
    'assets/categories/accessories.png',
    'assets/categories/indoor.png'
  ];

  // Render product details structure
  const pageHTML = `
    <!-- Breadcrumb -->
    <div style="padding: var(--space-4) 0; font-size: var(--text-xs); color: var(--color-gray-500); margin-bottom: var(--space-8);">
      <a href="index.html" style="color: var(--color-gray-400);">Home</a> / 
      <a href="products.html?category=${product.category}" style="color: var(--color-gray-400);">${categoryLabel}</a> / 
      <span style="color: var(--color-gray-700); font-weight: var(--font-semibold);">${product.name}</span>
    </div>

    <div class="product-detail">
      
      <!-- Left: Galleries -->
      <div class="product-gallery">
        <div class="product-gallery__main">
          <img id="main-product-img" src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-gallery__thumbnails">
          ${thumbnails.map((thumb, idx) => `
            <div class="product-gallery__thumb ${idx === 0 ? 'is-active' : ''}" data-src="${thumb}">
              <img src="${thumb}" alt="${product.name} Thumbnail ${idx + 1}">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right: Purchase Panel -->
      <div class="product-info-panel">
        <div class="product-meta-header">
          ${product.badge ? `<span class="badge badge--best-seller" style="margin-bottom:var(--space-2);">${product.badge}</span>` : ''}
          <h1>${product.name}</h1>
          
          <div class="stars-container">
            <div class="stars">${starsHTML}</div>
            <span class="rating-text">${product.rating} / 5.0 (${product.reviewCount} customer reviews)</span>
          </div>

          <div class="product-price-box">
            <span class="product-price-current ${hasSale ? 'product-card__price-sale' : ''}">$${activePrice.toFixed(2)}</span>
            ${hasSale ? `
              <span class="product-price-original">$${price.toFixed(2)}</span>
              <span class="product-price-sale-tag">Save $${(price - salePrice).toFixed(2)}</span>
            ` : ''}
          </div>
        </div>

        <p style="color: var(--color-gray-600); line-height: var(--line-height-relaxed); font-size: var(--text-sm);">${product.shortDescription}</p>

        <!-- Care Guidelines -->
        ${product.careLevel ? `<div class="quick-care-grid">
          <div class="quick-care-item">
            <div class="quick-care-icon">
              <i class="fa fa-sun-o"></i>
            </div>
            <div class="quick-care-text">
              <h5>Light</h5>
              <p>${product.light || 'N/A'}</p>
            </div>
          </div>
          <div class="quick-care-item">
            <div class="quick-care-icon">
              <i class="fa fa-tint"></i>
            </div>
            <div class="quick-care-text">
              <h5>Water</h5>
              <p>${product.water || 'N/A'}</p>
            </div>
          </div>
          <div class="quick-care-item">
            <div class="quick-care-icon">
              <i class="fa fa-leaf"></i>
            </div>
            <div class="quick-care-text">
              <h5>Difficulty</h5>
              <p>${product.careLevel}</p>
            </div>
          </div>
        </div>` : ''}

        <!-- Size Options -->
        <div class="product-options-selector">
          <h4>Select Pot Size:</h4>
          <div class="size-pills">
            ${sizePillsHTML}
          </div>
        </div>

        <!-- Purchase Action -->
        <div class="purchase-row">
          <div class="quantity-selector">
            <button class="quantity-btn detail-minus">-</button>
            <input type="text" class="quantity-input detail-qty" value="1" readonly>
            <button class="quantity-btn detail-plus">+</button>
          </div>
          <button class="btn btn--primary add-to-cart-btn" id="add-to-cart-trigger">
            <i class="fa fa-shopping-cart"></i> Add to Cart
          </button>
        </div>

        <div style="font-size: var(--text-xs); color: var(--color-gray-500); display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-4);">
          <div><i class="fa fa-check-circle" style="color: var(--color-success); margin-right: 8px;"></i> 30-Day Guarantee: Arrives fresh & healthy, or we replace it!</div>
          ${product.petFriendly !== null ? `<div><i class="fa fa-paw" style="color: ${product.petFriendly ? 'var(--color-success)' : 'var(--color-warning)'}; margin-right: 8px;"></i> ${product.petFriendly ? 'Pet Friendly: Safe around dogs & cats.' : 'Pet Caution: Toxic to pets if ingested.'}</div>` : ''}
        </div>
      </div>

    </div>

    <!-- Tabs Details Section -->
    <div class="product-tabs">
      <div class="tabs-nav">
        <button class="tab-btn is-active" data-tab="tab-desc">Description</button>
        <button class="tab-btn" data-tab="tab-care">Care Guide</button>
        <button class="tab-btn" data-tab="tab-shipping">Shipping & Returns</button>
      </div>
      
      <div id="tab-desc" class="tab-content is-active">
        <p>${product.description || 'No description available for this item.'}</p>
      </div>
      
      <div id="tab-care" class="tab-content">
        ${product.careLevel ? `
        <h3>Care Directions for ${product.name}</h3>
        <p>Keeping your ${product.name} thriving is simple when adhering to these basic nursery guidelines:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: var(--space-4); text-align: left; border: 1px solid var(--color-gray-200);">
          <tr style="border-bottom:1px solid var(--color-gray-200); background:var(--color-cream); font-weight:var(--font-bold);">
            <th style="padding: var(--space-3);">Aspect</th>
            <th style="padding: var(--space-3);">Nursery Recommendations</th>
          </tr>
          <tr style="border-bottom:1px solid var(--color-gray-200);">
            <td style="padding: var(--space-3); font-weight:var(--font-bold); color:var(--color-primary);">Lighting</td>
            <td style="padding: var(--space-3);">${product.light}. Avoid exposing directly to hot mid-day rays which might scorch foliage.</td>
          </tr>
          <tr style="border-bottom:1px solid var(--color-gray-200);">
            <td style="padding: var(--space-3); font-weight:var(--font-bold); color:var(--color-primary);">Watering</td>
            <td style="padding: var(--space-3);">Typically requires watering ${product.water.toLowerCase()}. Let the top 2 inches of potting medium dry completely before watering again.</td>
          </tr>
          <tr style="border-bottom:1px solid var(--color-gray-200);">
            <td style="padding: var(--space-3); font-weight:var(--font-bold); color:var(--color-primary);">Nutrient Needs</td>
            <td style="padding: var(--space-3);">Apply balanced organic houseplant fertilizer once every month during spring and summer months. No feeding needed in winter.</td>
          </tr>
        </table>
        ` : `
        <h3>Product Information</h3>
        <p>This is a gardening accessory — no plant care guide needed. See the description tab for usage details.</p>
        `}
      </div>

      <div id="tab-shipping" class="tab-content">
        <h3>Premium Plant Shipping Guarantee</h3>
        <p>We pride ourselves in sending plants securely across the USA. Each plant is packed meticulously inside custom organic sleeves designed to maintain root warmth, moisture levels, and protect delicate leaves.</p>
        <ul>
          <li><strong>Processing:</strong> Orders process within 2-3 business days.</li>
          <li><strong>Shipping:</strong> Safe shipping averages 3-5 days. Free on orders above $75.</li>
          <li><strong>Guarantee:</strong> If your plant arrives damaged or dead, email a photo to support@florahubusa.com within 30 days and we will ship out a replacement immediately.</li>
        </ul>
      </div>
    </div>

    <!-- Related Products -->
    <div style="margin-top: var(--space-16); border-top: 1px solid var(--color-gray-200); padding-top: var(--space-12);">
      <h2 style="margin-bottom: var(--space-8); text-align: center;">You May Also Like</h2>
      <div class="products-grid" id="related-products-grid">
        <!-- 4 related items -->
      </div>
    </div>
  `;

  container.innerHTML = pageHTML;

  // ── Gallery click handlers ──
  const mainImg = document.getElementById('main-product-img');
  const thumbs = container.querySelectorAll('.product-gallery__thumb');
  
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      mainImg.src = thumb.getAttribute('data-src');
    });
  });

  // ── Size Pills click handlers ──
  let selectedSize = product.sizes[0];
  const pills = container.querySelectorAll('.size-pill');
  
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      selectedSize = pill.getAttribute('data-size');
    });
  });

  // ── Quantity counter adjustments ──
  const qtyInput = container.querySelector('.detail-qty');
  const minusBtn = container.querySelector('.detail-minus');
  const plusBtn = container.querySelector('.detail-plus');

  minusBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value);
    if (val > 1) {
      qtyInput.value = val - 1;
    }
  });

  plusBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value);
    qtyInput.value = val + 1;
  });

  // ── Tab click handlers ──
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('is-active'));
      tabContents.forEach(c => c.classList.remove('is-active'));

      btn.classList.add('is-active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('is-open', 'is-active');
    });
  });

  // ── Add To Cart handler ──
  const addToCartBtn = document.getElementById('add-to-cart-trigger');
  addToCartBtn.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value);
    addToCart(product, selectedSize, qty);
  });

  // ── Render Related Products ──
  const relatedGrid = document.getElementById('related-products-grid');
  if (relatedGrid) {
    const related = productsData
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    if (related.length > 0) {
      relatedGrid.innerHTML = related.map(renderProductCard).join('');
      setupQuickAddListeners(relatedGrid);
    } else {
      // Fallback
      relatedGrid.innerHTML = productsData.slice(0, 4).map(renderProductCard).join('');
      setupQuickAddListeners(relatedGrid);
    }
  }
}

/**
 * Escapes characters for HTML protection
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
