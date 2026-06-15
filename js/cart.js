/* ============================================
   FloraHub USA — LocalStorage Shopping Cart
   ============================================ */

const CART_KEY = 'florahub_cart';

document.addEventListener('DOMContentLoaded', () => {
  initCartDrawer();
  updateHeaderCartBadge();
  
  // If on the cart page, render it
  if (document.getElementById('cart-page-container')) {
    renderCartPage();
  }
});

/**
 * Get Cart items from localStorage
 */
function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading cart from localStorage', e);
    return [];
  }
}

/**
 * Save Cart items to localStorage
 */
function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateHeaderCartBadge();
    renderCartDrawerContent();
    
    // Dispatch custom event for page synchronization
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  } catch (e) {
    console.error('Error saving cart to localStorage', e);
  }
}

/**
 * Add an item to the cart
 */
function addToCart(product, size = 'Default', quantity = 1) {
  let cart = getCart();
  
  // Check if item already exists with the same size
  const existingItemIdx = cart.findIndex(item => item.id === product.id && item.size === size);
  
  if (existingItemIdx > -1) {
    cart[existingItemIdx].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.image,
      size: size,
      quantity: quantity
    });
  }
  
  saveCart(cart);
  openCartDrawer();
  showToast(`Added ${product.name} to cart!`);
}

/**
 * Remove an item from the cart
 */
function removeFromCart(productId, size) {
  let cart = getCart();
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  saveCart(cart);
}

/**
 * Update quantity of an item
 */
function updateQuantity(productId, size, newQty) {
  if (newQty < 1) {
    removeFromCart(productId, size);
    return;
  }
  
  let cart = getCart();
  const itemIdx = cart.findIndex(item => item.id === productId && item.size === size);
  if (itemIdx > -1) {
    cart[itemIdx].quantity = newQty;
    saveCart(cart);
  }
}

/**
 * Get total number of items in the cart
 */
function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get subtotal price of all items
 */
function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const price = item.salePrice ? item.salePrice : item.price;
    return total + (price * item.quantity);
  }, 0);
}

/**
 * Update header cart badge counter
 */
function updateHeaderCartBadge() {
  const badge = document.querySelector('.header__action-btn .cart-count');
  if (!badge) return;
  
  const count = getCartCount();
  badge.textContent = count;
  
  if (count > 0) {
    badge.classList.add('has-items');
  } else {
    badge.classList.remove('has-items');
  }
}

/**
 * Initialize Cart Drawer Markup & Events
 */
function initCartDrawer() {
  // If drawer already exists, return
  if (document.getElementById('cart-drawer')) return;

  // Create drawer HTML and inject into body
  const drawerHTML = `
    <div id="cart-drawer-backdrop" class="cart-drawer-backdrop"></div>
    <div id="cart-drawer" class="cart-drawer">
      <div class="cart-drawer__header">
        <h3>Shopping Cart</h3>
        <button class="cart-drawer__close" aria-label="Close cart">&times;</button>
      </div>
      <div class="cart-drawer__body">
        <!-- Cart Items list loaded dynamically -->
      </div>
      <div class="cart-drawer__footer">
        <div class="cart-drawer__subtotal">
          <span>Subtotal:</span>
          <span class="cart-drawer__subtotal-val">$0.00</span>
        </div>
        <p class="cart-drawer__shipping-note">Shipping & taxes calculated at checkout.</p>
        <div class="cart-drawer__actions">
          <a href="cart.html" class="btn btn--outline">View Cart</a>
          <button class="btn btn--primary checkout-btn-demo">Checkout</button>
        </div>
      </div>
    </div>
  `;

  // Append styling for drawer directly to prevent CSS loading sync issues
  const drawerStyle = document.createElement('style');
  drawerStyle.textContent = `
    .cart-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s ease;
    }
    .cart-drawer-backdrop.is-open {
      opacity: 1;
      visibility: visible;
    }
    .cart-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 100%;
      max-width: 400px;
      height: 100vh;
      background: var(--color-white);
      box-shadow: var(--shadow-2xl);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @media (max-width: 480px) {
      .cart-drawer { max-width: 100%; right: -100%; }
    }
    .cart-drawer.is-open {
      right: 0;
    }
    .cart-drawer__header {
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-gray-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cart-drawer__header h3 {
      font-size: var(--text-md);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }
    .cart-drawer__close {
      background: none;
      border: none;
      font-size: 32px;
      line-height: 1;
      cursor: pointer;
      color: var(--color-gray-500);
      transition: color var(--transition-fast);
    }
    .cart-drawer__close:hover {
      color: var(--color-primary);
    }
    .cart-drawer__body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .cart-drawer__empty {
      text-align: center;
      margin: auto;
      color: var(--color-gray-400);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }
    .cart-drawer__empty i {
      font-size: 48px;
      color: var(--color-sage);
    }
    .cart-drawer__item {
      display: flex;
      gap: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-gray-100);
    }
    .cart-drawer__item-img {
      width: 70px;
      height: 70px;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--color-cream);
      flex-shrink: 0;
    }
    .cart-drawer__item-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .cart-drawer__item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cart-drawer__item-title {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--color-gray-800);
      margin-bottom: 2px;
    }
    .cart-drawer__item-size {
      font-size: 11px;
      color: var(--color-gray-400);
      text-transform: uppercase;
    }
    .cart-drawer__item-price {
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
      color: var(--color-gray-900);
    }
    .cart-drawer__item-qty-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--space-2);
    }
    .cart-drawer__qty-ctrl {
      display: flex;
      align-items: center;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      height: 28px;
    }
    .cart-drawer__qty-btn {
      width: 24px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      color: var(--color-gray-600);
    }
    .cart-drawer__qty-btn:hover {
      background: var(--color-gray-100);
    }
    .cart-drawer__qty-val {
      width: 30px;
      text-align: center;
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
    }
    .cart-drawer__item-remove {
      font-size: var(--text-xs);
      color: var(--color-gray-400);
      background: none;
      border: none;
      cursor: pointer;
    }
    .cart-drawer__item-remove:hover {
      color: var(--color-error);
      text-decoration: underline;
    }
    .cart-drawer__footer {
      padding: var(--space-6);
      border-top: 1px solid var(--color-gray-200);
      background: var(--color-cream);
    }
    .cart-drawer__subtotal {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-heading);
      font-size: var(--text-md);
      font-weight: var(--font-bold);
      color: var(--color-gray-900);
      margin-bottom: 2px;
    }
    .cart-drawer__shipping-note {
      font-size: var(--text-xs);
      color: var(--color-gray-500);
      margin-bottom: var(--space-4);
    }
    .cart-drawer__actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .cart-drawer__actions .btn {
      width: 100%;
    }
    
    /* ── Floating Toast Container ── */
    .toast-container {
      position: fixed;
      bottom: var(--space-6);
      left: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      z-index: 1100;
    }
    .toast {
      background: var(--color-charcoal);
      color: var(--color-white);
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      box-shadow: var(--shadow-xl);
      border-left: 4px solid var(--color-accent);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  `;

  document.head.appendChild(drawerStyle);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = drawerHTML;
  document.body.appendChild(tempDiv.querySelector('#cart-drawer-backdrop'));
  document.body.appendChild(tempDiv.querySelector('#cart-drawer'));

  // Attach Open drawer event to header cart icon
  const cartBtn = document.querySelector('.header__action-btn[href="#"], .header__action-btn:has(.cart-count)');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  // Close actions
  document.querySelector('.cart-drawer__close').addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-backdrop').addEventListener('click', closeCartDrawer);

  // Demo Checkout button click
  document.querySelector('.checkout-btn-demo').addEventListener('click', () => {
    alert('Thank you for your interest! This is a frontend prototype. Payment and order submission are disabled.');
  });

  // Render initial contents
  renderCartDrawerContent();

  // Toast Container
  const tc = document.createElement('div');
  tc.className = 'toast-container';
  document.body.appendChild(tc);
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('is-open');
  document.getElementById('cart-drawer-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('is-open');
  document.getElementById('cart-drawer-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
}

/**
 * Render items inside the slide-over cart drawer
 */
function renderCartDrawerContent() {
  const body = document.querySelector('.cart-drawer__body');
  const subtotalVal = document.querySelector('.cart-drawer__subtotal-val');
  if (!body) return;

  const cart = getCart();
  
  // Clear body
  body.innerHTML = '';

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer__empty">
        <i class="fa fa-shopping-basket"></i>
        <p>Your cart is empty.</p>
        <a href="products.html" class="btn btn--primary btn--sm close-drawer-link">Shop Plants</a>
      </div>
    `;
    subtotalVal.textContent = '$0.00';
    
    // Close drawer click handler for empty button
    const link = body.querySelector('.close-drawer-link');
    if (link) link.addEventListener('click', closeCartDrawer);
    return;
  }

  cart.forEach(item => {
    const itemHTML = `
      <div class="cart-drawer__item">
        <div class="cart-drawer__item-img">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-drawer__item-details">
          <div>
            <h4 class="cart-drawer__item-title">${item.name}</h4>
            <span class="cart-drawer__item-size">Size: ${item.size}</span>
          </div>
          <div class="cart-drawer__item-qty-row">
            <div class="cart-drawer__qty-ctrl">
              <button class="cart-drawer__qty-btn qty-minus" data-id="${item.id}" data-size="${item.size}">-</button>
              <span class="cart-drawer__qty-val">${item.quantity}</span>
              <button class="cart-drawer__qty-btn qty-plus" data-id="${item.id}" data-size="${item.size}">+</button>
            </div>
            <span class="cart-drawer__item-price">$${((item.salePrice || item.price) * item.quantity).toFixed(2)}</span>
            <button class="cart-drawer__item-remove" data-id="${item.id}" data-size="${item.size}">Remove</button>
          </div>
        </div>
      </div>
    `;
    body.insertAdjacentHTML('beforeend', itemHTML);
  });

  // Attach controls listeners
  body.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      const item = cart.find(i => i.id === id && i.size === size);
      if (item) updateQuantity(id, size, item.quantity - 1);
    });
  });

  body.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      const item = cart.find(i => i.id === id && i.size === size);
      if (item) updateQuantity(id, size, item.quantity + 1);
    });
  });

  body.querySelectorAll('.cart-drawer__item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      removeFromCart(id, size);
    });
  });

  // Update subtotal
  subtotalVal.textContent = `$${getCartSubtotal().toFixed(2)}`;
}

/**
 * Display a premium small toast feedback banner
 */
function showToast(message) {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa fa-check-circle" style="color: var(--color-accent); margin-right: 8px;"></i> ${message}`;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 50);

  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/**
 * Render complete Cart Page details inside cart.html
 */
function renderCartPage() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  const cart = getCart();

  // Clear loading state
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <i class="fa fa-shopping-cart" style="font-size: 64px; color: var(--color-sage); margin-bottom: var(--space-4); display: block;"></i>
        <h2 style="margin-bottom: var(--space-2);">Your Cart is Empty</h2>
        <p style="color: var(--color-gray-500); margin-bottom: var(--space-6);">Fill it up with beautiful, healthy plants from our premium catalog.</p>
        <a href="products.html" class="btn btn--primary">Browse Catalog</a>
      </div>
    `;
    return;
  }

  // Create layout
  const cartLayout = `
    <h1 style="margin-bottom: var(--space-8);">Your Shopping Cart</h1>
    <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: var(--space-10);">
      
      <!-- Cart Items Table -->
      <div>
        <div style="background: var(--color-white); border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: var(--color-cream); border-bottom: 1px solid var(--color-gray-200);">
                <th style="padding: var(--space-4) var(--space-6); font-size: var(--text-xs); text-transform: uppercase; color: var(--color-gray-600);">Product</th>
                <th style="padding: var(--space-4) var(--space-6); font-size: var(--text-xs); text-transform: uppercase; color: var(--color-gray-600); text-align: center;">Price</th>
                <th style="padding: var(--space-4) var(--space-6); font-size: var(--text-xs); text-transform: uppercase; color: var(--color-gray-600); text-align: center;">Quantity</th>
                <th style="padding: var(--space-4) var(--space-6); font-size: var(--text-xs); text-transform: uppercase; color: var(--color-gray-600); text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => {
                const itemPrice = item.salePrice || item.price;
                return `
                  <tr style="border-bottom: 1px solid var(--color-gray-100);">
                    <td style="padding: var(--space-5) var(--space-6); display: flex; gap: var(--space-4); align-items: center;">
                      <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-md); background: var(--color-cream); flex-shrink: 0;">
                      <div>
                        <h4 style="font-size: var(--text-base); font-weight: var(--font-semibold); margin-bottom: 4px; color: var(--color-gray-800);">${item.name}</h4>
                        <span style="font-size: 11px; text-transform: uppercase; color: var(--color-gray-400); display: block;">Size: ${item.size}</span>
                        <button class="page-remove-btn" data-id="${item.id}" data-size="${item.size}" style="background: none; border: none; font-size: var(--text-xs); color: var(--color-gray-400); cursor: pointer; padding: 4px 0; margin-top: 4px; text-align: left; display: block;">
                          <i class="fa fa-trash-o" style="margin-right: 4px;"></i> Remove
                        </button>
                      </div>
                    </td>
                    <td style="padding: var(--space-5) var(--space-6); text-align: center; font-weight: var(--font-semibold); color: var(--color-gray-800);">$${itemPrice.toFixed(2)}</td>
                    <td style="padding: var(--space-5) var(--space-6); text-align: center;">
                      <div class="cart-drawer__qty-ctrl" style="margin: 0 auto; width: 100px;">
                        <button class="cart-drawer__qty-btn page-minus-btn" data-id="${item.id}" data-size="${item.size}">-</button>
                        <span class="cart-drawer__qty-val">${item.quantity}</span>
                        <button class="cart-drawer__qty-btn page-plus-btn" data-id="${item.id}" data-size="${item.size}">+</button>
                      </div>
                    </td>
                    <td style="padding: var(--space-5) var(--space-6); text-align: right; font-weight: var(--font-bold); color: var(--color-gray-900); font-size: var(--text-md);">$${(itemPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top: var(--space-4); text-align: left;">
          <a href="products.html" style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-primary); display: inline-flex; align-items: center; gap: var(--space-2);">
            <i class="fa fa-long-arrow-left"></i> Continue Shopping
          </a>
        </div>
      </div>

      <!-- Order Summary Card -->
      <div>
        <div style="background: var(--color-cream); border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); padding: var(--space-6); position: sticky; top: 100px;">
          <h3 style="font-size: var(--text-lg); text-transform: uppercase; letter-spacing: var(--letter-spacing-wide); margin-bottom: var(--space-5); border-bottom: 2px solid var(--color-gray-200); padding-bottom: var(--space-3);">Order Summary</h3>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); font-size: var(--text-sm); color: var(--color-gray-600);">
            <span>Subtotal</span>
            <span style="font-weight: var(--font-semibold); color: var(--color-gray-800);">$${getCartSubtotal().toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); font-size: var(--text-sm); color: var(--color-gray-600);">
            <span>Shipping</span>
            <span style="font-weight: var(--font-semibold); color: var(--color-success);">${getCartSubtotal() >= 75 ? 'FREE' : '$12.99'}</span>
          </div>
          
          ${getCartSubtotal() < 75 ? `
            <div style="background: rgba(var(--color-primary-rgb), 0.05); border: 1px solid rgba(var(--color-primary-rgb), 0.15); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--text-xs); color: var(--color-primary-dark); margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2);">
              <i class="fa fa-info-circle"></i> Add <strong>$${(75 - getCartSubtotal()).toFixed(2)}</strong> more to unlock <strong>FREE SHIPPING!</strong>
            </div>
          ` : `
            <div style="background: rgba(5, 150, 105, 0.05); border: 1px solid rgba(5, 150, 105, 0.15); border-radius: var(--radius-md); padding: var(--space-3); font-size: var(--text-xs); color: var(--color-success); margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2);">
              <i class="fa fa-check-circle"></i> Congratulations! You've unlocked <strong>FREE SHIPPING!</strong>
            </div>
          `}
          
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--color-gray-300); padding-top: var(--space-4); margin-bottom: var(--space-6); font-family: var(--font-heading); font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-gray-900);">
            <span>Total</span>
            <span>$${(getCartSubtotal() + (getCartSubtotal() >= 75 ? 0 : 12.99)).toFixed(2)}</span>
          </div>

          <button class="btn btn--primary checkout-btn-demo" style="width: 100%; height: 48px; margin-bottom: var(--space-3);">Proceed to Checkout</button>
          
          <div style="display: flex; justify-content: center; gap: var(--space-4); color: var(--color-gray-400); font-size: var(--text-lg); margin-top: var(--space-4);">
            <i class="fa fa-cc-visa" title="Visa"></i>
            <i class="fa fa-cc-mastercard" title="Mastercard"></i>
            <i class="fa fa-cc-discover" title="Discover"></i>
            <i class="fa fa-cc-amex" title="American Express"></i>
            <i class="fa fa-cc-paypal" title="PayPal"></i>
          </div>
        </div>
      </div>

    </div>
  `;

  container.innerHTML = cartLayout;

  // Listeners for checkout
  container.querySelectorAll('.checkout-btn-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Thank you for your interest! This is a frontend prototype. Payment and order submission are disabled.');
    });
  });

  // Listeners for page adjustments
  container.querySelectorAll('.page-minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      const item = cart.find(i => i.id === id && i.size === size);
      if (item) {
        updateQuantity(id, size, item.quantity - 1);
        renderCartPage(); // Re-render page
      }
    });
  });

  container.querySelectorAll('.page-plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      const item = cart.find(i => i.id === id && i.size === size);
      if (item) {
        updateQuantity(id, size, item.quantity + 1);
        renderCartPage(); // Re-render page
      }
    });
  });

  container.querySelectorAll('.page-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const size = btn.getAttribute('data-size');
      removeFromCart(id, size);
      renderCartPage(); // Re-render page
    });
  });
}
