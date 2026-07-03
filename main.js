(function () {
  if (!document.querySelector('link[href="interaction-fixes.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'interaction-fixes.css';
    document.head.appendChild(link);
  }

  document.querySelectorAll('a[href="portion.html#gor-eget"], a[href="index.html#gor-eget"], a[href$="#gor-eget"]').forEach(link => {
    link.setAttribute('href', 'gor-eget.html');
  });

  document.querySelectorAll('.carousel-header').forEach(header => {
    const heading = header.querySelector('.section-heading');
    if (heading && heading.textContent.trim().toLowerCase() === 'nyheter') {
      header.querySelector('.see-all')?.remove();
    }
  });

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  if ((currentFile === 'portion.html' || currentFile === 'index.html') && window.location.hash === '#gor-eget') {
    window.location.replace('gor-eget.html');
  }
})();

const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
const BOOKMARKS_KEY = 'swedsnus-bookmarks';
const CART_KEY = 'swedsnus-cart';

function readStore(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'produkt';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCleanPrice(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getSelectedPackText(container) {
  const selectedOption = container?.querySelector?.('.pack-select option:checked');
  if (selectedOption) return selectedOption.dataset.pack || selectedOption.textContent.split('—')[0].trim() || '1-pack';
  const selectedPack = document.querySelector('.pack-option.selected');
  if (selectedPack) return selectedPack.dataset.pack || '1-pack';
  return '1-pack';
}

function getSelectedPrice(container) {
  const selectedOption = container?.querySelector?.('.pack-select option:checked');
  if (selectedOption?.dataset.price) return selectedOption.dataset.price;
  const cardPrice = container?.querySelector?.('.product-card-price');
  const price = cardPrice?.childNodes?.[0]?.textContent || cardPrice?.textContent;
  const pagePack = document.querySelector('.pack-option.selected');
  if (pagePack?.dataset.price) return pagePack.dataset.price;
  const pagePrice = document.querySelector('.product-detail-price')?.childNodes?.[0]?.textContent;
  return getCleanPrice(price || pagePrice || '');
}

function metaFromCard(card) {
  return Array.from(card.querySelectorAll('.product-card-meta'))
    .map(item => item.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function productFromCard(card) {
  const name = card.querySelector('.product-card-name')?.textContent?.trim() || 'Produkt';
  const badge = card.querySelector('.product-card-badge')?.textContent?.trim() || '';
  return {
    id: card.dataset.productId || slugify(name),
    name,
    badge,
    meta: metaFromCard(card),
    price: getSelectedPrice(card),
    pack: getSelectedPackText(card),
    href: card.dataset.href || 'product.html'
  };
}

function productFromPage() {
  const name = document.querySelector('.product-detail h1')?.textContent?.trim() || document.title.split('—')[0].trim() || 'Produkt';
  const badges = Array.from(document.querySelectorAll('.product-detail-badge .product-card-badge')).map(item => item.textContent.trim()).filter(Boolean);
  const meta = Array.from(document.querySelectorAll('.product-detail-meta-row')).map(row => {
    const key = row.querySelector('dt')?.textContent?.trim();
    const value = row.querySelector('dd')?.textContent?.replace(/\s+/g, ' ')?.trim();
    return key && value ? `${key}: ${value}` : '';
  }).filter(Boolean).slice(0, 3);
  return {
    id: slugify(name),
    name,
    badge: badges[0] || '',
    meta,
    price: getSelectedPrice(document),
    pack: getSelectedPackText(document),
    href: 'product.html'
  };
}

function metaMarkup(meta) {
  return (meta || []).slice(0, 3).map(item => {
    const parts = String(item).split(':');
    if (parts.length > 1) {
      const key = parts.shift().trim();
      const value = parts.join(':').trim();
      return `<p class="product-card-meta">${escapeHtml(key)}: <span>${escapeHtml(value)}</span></p>`;
    }
    return `<p class="product-card-meta">${escapeHtml(item)}</p>`;
  }).join('');
}

function isBookmarked(id) {
  return readStore(BOOKMARKS_KEY).some(item => item.id === id);
}

function setBookmark(product, save) {
  const bookmarks = readStore(BOOKMARKS_KEY).filter(item => item.id !== product.id);
  if (save) bookmarks.unshift(product);
  writeStore(BOOKMARKS_KEY, bookmarks);
  renderBookmarksPage();
  addBookmarkButtons();
  syncBookmarkButtons();
}

function syncBookmarkButtons() {
  document.querySelectorAll('.bookmark-toggle[data-product-id]').forEach(button => {
    const active = isBookmarked(button.dataset.productId);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.setAttribute('title', active ? 'Ta bort från sparade produkter' : 'Spara produkt');
  });
}

function addBookmarkButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    const product = productFromCard(card);
    card.dataset.productId = product.id;
    if (card.querySelector('.bookmark-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bookmark-toggle';
    button.dataset.productId = product.id;
    button.setAttribute('aria-label', 'Spara produkt');
    button.innerHTML = BOOKMARK_ICON;
    card.appendChild(button);
  });

  const detail = document.querySelector('.product-detail');
  const heading = detail?.querySelector('h1');
  if (detail && heading && !detail.querySelector('.product-page-bookmark')) {
    const product = productFromPage();
    const wrap = document.createElement('div');
    wrap.className = 'product-detail-actions';
    heading.parentNode.insertBefore(wrap, heading);
    wrap.appendChild(heading);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bookmark-toggle product-page-bookmark';
    button.dataset.productId = product.id;
    button.setAttribute('aria-label', 'Spara produkt');
    button.innerHTML = BOOKMARK_ICON;
    wrap.appendChild(button);
  }

  syncBookmarkButtons();
}

function renderProductCard(product, options = {}) {
  const activeBookmark = options.activeBookmark ? ' active' : '';
  return `
    <div class="product-card" data-product-id="${escapeHtml(product.id)}" data-href="${escapeHtml(product.href || 'product.html')}">
      <button class="bookmark-toggle${activeBookmark}" data-product-id="${escapeHtml(product.id)}" type="button" aria-label="Spara produkt" aria-pressed="${options.activeBookmark ? 'true' : 'false'}">${BOOKMARK_ICON}</button>
      <div class="img-placeholder product">Produktbild</div>
      <div class="product-card-body">
        ${product.badge ? `<span class="product-card-badge">${escapeHtml(product.badge)}</span>` : ''}
        <p class="product-card-name">${escapeHtml(product.name)}</p>
        ${metaMarkup(product.meta)}
        <div class="product-card-actions">
          <select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(product.price || '')}" data-pack="${escapeHtml(product.pack || '1-pack')}">${escapeHtml(product.pack || '1-pack')} — ${escapeHtml(product.price || '')}</option></select>
          <button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button>
        </div>
        <p class="product-card-price">${escapeHtml(product.price || '')} <small>${escapeHtml(product.pack || '')}</small></p>
      </div>
    </div>
  `;
}

function renderBookmarksPage() {
  const list = document.querySelector('[data-bookmarks-list]') || (document.body.classList.contains('bookmarks-page') ? document.querySelector('.bookmarks-list') : null);
  if (!list) return;
  const bookmarks = readStore(BOOKMARKS_KEY);
  const countEl = document.querySelector('[data-bookmark-count]');
  if (countEl) countEl.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'produkt' : 'produkter'}`;
  list.classList.add('product-grid', 'bookmarks-product-grid');
  if (!bookmarks.length) {
    list.innerHTML = '<div class="bookmarks-empty">Du har inga sparade produkter än. Spara en produkt med bokmärkesikonen på en produktkort eller produktsida.</div>';
    return;
  }
  list.innerHTML = bookmarks.map(product => renderProductCard(product, { activeBookmark: true })).join('');
  enhanceCartButtons();
  syncBookmarkButtons();
}

function normalizeCartItem(product, quantity = 1) {
  return {
    id: product.id,
    name: product.name,
    badge: product.badge || '',
    meta: product.meta || [],
    price: product.price || '',
    pack: product.pack || '1-pack',
    href: product.href || 'product.html',
    quantity
  };
}

function addCartItem(product, quantity = 1) {
  const cart = readStore(CART_KEY);
  const item = normalizeCartItem(product, quantity);
  const existing = cart.find(entry => entry.id === item.id && entry.pack === item.pack && entry.price === item.price);
  if (existing) existing.quantity += quantity;
  else cart.unshift(item);
  writeStore(CART_KEY, cart);
  updateCartPanel();
  renderCartPage();
}

function setCartItemQuantity(index, quantity) {
  const cart = readStore(CART_KEY);
  if (!cart[index]) return;
  cart[index].quantity = Math.max(1, quantity);
  writeStore(CART_KEY, cart);
  updateCartPanel();
  renderCartPage();
}

function removeCartItem(index) {
  const cart = readStore(CART_KEY);
  cart.splice(index, 1);
  writeStore(CART_KEY, cart);
  updateCartPanel();
  renderCartPage();
}

function priceNumber(value) {
  const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
  return match ? parseInt(match[0], 10) : 0;
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + priceNumber(item.price) * (item.quantity || 1), 0);
}

function updateCartPanel() {
  const cart = readStore(CART_KEY);
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  document.querySelectorAll('.cart-count').forEach(item => item.textContent = totalQty);
  document.querySelectorAll('.cart-panel-count').forEach(item => item.textContent = `${totalQty} ${totalQty === 1 ? 'artikel' : 'artiklar'}`);
  document.querySelectorAll('.cart-total').forEach(item => item.textContent = `${cartTotal(cart).toLocaleString('sv-SE')} kr`);

  document.querySelectorAll('.cart-panel').forEach(panel => {
    let list = panel.querySelector('.cart-panel-items');
    if (!list) {
      list = document.createElement('div');
      list.className = 'cart-panel-items';
      const empty = panel.querySelector('.cart-panel-empty');
      if (empty) empty.insertAdjacentElement('afterend', list);
      else panel.insertBefore(list, panel.querySelector('.cart-panel-footer'));
    }
    const empty = panel.querySelector('.cart-panel-empty');
    if (empty) empty.classList.toggle('is-hidden', cart.length > 0);
    list.innerHTML = '';
    cart.slice(0, 4).forEach(item => {
      const row = document.createElement('a');
      row.href = item.href || 'product.html';
      row.className = 'cart-panel-item';
      row.innerHTML = `<span class="cart-panel-item-img"></span><span class="cart-panel-item-main"><span class="cart-panel-item-name">${escapeHtml(item.name)}</span><span class="cart-panel-item-meta">${item.quantity || 1} × ${escapeHtml(item.pack || '1-pack')}</span></span><span class="cart-panel-item-price">${escapeHtml(item.price || '')}</span>`;
      list.appendChild(row);
    });
    if (cart.length > 4) {
      const more = document.createElement('div');
      more.className = 'cart-panel-item-meta';
      more.style.padding = '.55rem .9rem';
      more.textContent = `+ ${cart.length - 4} fler produkter`;
      list.appendChild(more);
    }
  });
}

function renderCartPage() {
  const page = document.querySelector('[data-cart-page]');
  if (!page) return;
  const list = page.querySelector('[data-cart-items]');
  const summaryCount = page.querySelector('[data-cart-summary-count]');
  const summaryTotal = page.querySelector('[data-cart-summary-total]');
  const cart = readStore(CART_KEY);
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (summaryCount) summaryCount.textContent = `${totalQty} ${totalQty === 1 ? 'artikel' : 'artiklar'}`;
  if (summaryTotal) summaryTotal.textContent = `${cartTotal(cart).toLocaleString('sv-SE')} kr`;
  if (!list) return;
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty-page">Din kundvagn är tom.</div>';
    return;
  }
  list.innerHTML = cart.map((item, index) => `
    <article class="cart-page-item">
      <a href="${escapeHtml(item.href || 'product.html')}" class="cart-page-img">Produktbild</a>
      <div class="cart-page-main">
        ${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}
        <h3><a href="${escapeHtml(item.href || 'product.html')}">${escapeHtml(item.name)}</a></h3>
        ${metaMarkup(item.meta)}
        <p class="cart-page-pack">${escapeHtml(item.pack || '1-pack')}</p>
      </div>
      <div class="cart-page-qty" aria-label="Antal">
        <button type="button" data-cart-action="decrease" data-cart-index="${index}">−</button>
        <span>${item.quantity || 1}</span>
        <button type="button" data-cart-action="increase" data-cart-index="${index}">+</button>
      </div>
      <strong class="cart-page-price">${escapeHtml(item.price || '')}</strong>
      <button class="cart-page-remove" type="button" data-cart-action="remove" data-cart-index="${index}" aria-label="Ta bort produkt">×</button>
    </article>
  `).join('');
}

function enhanceCartButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    if (!button.querySelector('svg')) button.innerHTML = CART_ICON;
    if (!button.getAttribute('type')) button.setAttribute('type', 'button');
  });
}

(function () {
  const saved = localStorage.getItem('swedsnus-theme') || '1';
  if (saved !== '1') document.documentElement.className = `theme-${saved}`;
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === saved);
    dot.addEventListener('click', () => {
      const theme = dot.dataset.theme;
      document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
      document.querySelectorAll('.theme-dot').forEach(item => item.classList.toggle('active', item === dot));
      localStorage.setItem('swedsnus-theme', theme);
    });
  });
})();

const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    document.querySelector('.subheader')?.classList.toggle('mobile-open');
    document.querySelector('.main-nav')?.classList.toggle('mobile-open');
  });
}

(function () {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.subheader-inner a, .subnav-inner a, .main-nav a').forEach(link => {
    const href = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (href && href === current) link.classList.add('active');
  });
})();

document.querySelectorAll('.filter-bar').forEach(bar => {
  bar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

document.querySelectorAll('.filter-sidebar li').forEach(item => {
  item.addEventListener('click', () => {
    item.closest('.filter-sidebar')?.querySelectorAll('li').forEach(link => link.classList.remove('active'));
    item.classList.add('active');
  });
});

(function () {
  document.querySelectorAll('[data-catalog-filter]').forEach(catalog => {
    const buttons = catalog.querySelectorAll('.filter-pill[data-series]');
    const cards = catalog.querySelectorAll('.product-card[data-series]');
    const count = catalog.querySelector('.catalog-count');
    const empty = catalog.querySelector('.catalog-empty');

    function update(selected) {
      let visible = 0;
      cards.forEach(card => {
        const match = !selected || card.dataset.series === selected;
        card.classList.toggle('is-hidden', !match);
        if (match) visible += 1;
      });
      if (count) count.textContent = `${visible} produkter`;
      if (empty) empty.classList.toggle('show', visible === 0);
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const alreadyActive = button.classList.contains('active');
        buttons.forEach(item => item.classList.remove('active'));
        if (alreadyActive) update(null);
        else {
          button.classList.add('active');
          update(button.dataset.series);
        }
      });
    });

    update(null);
  });
})();

document.querySelectorAll('.sub-tabs').forEach(group => {
  group.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.sub-tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      if (target) {
        const container = group.closest('section') || document.body;
        container.querySelectorAll('[data-panel]').forEach(panel => {
          panel.style.display = panel.dataset.panel === target ? '' : 'none';
        });
      }
    });
  });
});

(function () {
  const sections = document.querySelectorAll('.guide-section[data-section]');
  if (!sections.length) return;
  sections.forEach((section, index) => { section.style.display = index === 0 ? '' : 'none'; });
  const firstTab = document.querySelector('.guide-tabs .sub-tab');
  if (firstTab) firstTab.classList.add('active');
  document.querySelectorAll('.guide-tabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      sections.forEach(section => { section.style.display = section.dataset.section === target ? '' : 'none'; });
    });
  });
})();

document.querySelectorAll('.hero-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.hero-tab').forEach(item => item.classList.remove('active'));
    tab.classList.add('active');
    const href = tab.dataset.href;
    if (href) window.location.href = href;
  });
});

document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.carousel-track');
  const outer = wrapper.querySelector('.carousel-track-outer');
  const btnPrev = wrapper.querySelector('.carousel-btn-prev');
  const btnNext = wrapper.querySelector('.carousel-btn-next');
  if (!track || !outer) return;
  let current = 0;

  function visibleCount() {
    const width = outer.offsetWidth;
    if (width < 440) return 1;
    if (width < 680) return 2;
    if (width < 920) return 4;
    return 6;
  }

  function gapSize() { return window.innerWidth <= 720 ? 10 : 12; }
  function cardWidth() {
    const cards = track.querySelectorAll('.product-card');
    if (!cards.length) return 0;
    const gap = gapSize();
    const visible = visibleCount();
    return (outer.offsetWidth - gap * (visible - 1)) / visible;
  }
  function totalCards() { return track.querySelectorAll('.product-card').length; }
  function maxIndex() { return Math.max(0, totalCards() - visibleCount()); }
  function go(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    const width = cardWidth();
    const gap = gapSize();
    track.style.transform = `translateX(-${current * (width + gap)}px)`;
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current >= maxIndex();
  }
  function sizeCards() {
    const width = cardWidth();
    track.style.gap = `${gapSize()}px`;
    track.querySelectorAll('.product-card').forEach(card => {
      card.style.flex = `0 0 ${width}px`;
      card.style.width = `${width}px`;
    });
    go(current);
  }

  window.addEventListener('resize', sizeCards);
  sizeCards();
  if (btnPrev) btnPrev.addEventListener('click', () => go(current - 1));
  if (btnNext) btnNext.addEventListener('click', () => go(current + 1));

  let startX = 0;
  let startY = 0;
  let dragging = false;
  track.addEventListener('pointerdown', event => {
    startX = event.clientX;
    startY = event.clientY;
    dragging = true;
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) event.preventDefault();
  }, { passive: false });
  track.addEventListener('pointerup', event => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
  });
  track.addEventListener('pointercancel', () => { dragging = false; });
});

document.querySelectorAll('.pack-select').forEach(select => {
  select.addEventListener('change', () => {
    const card = select.closest('.product-card');
    if (!card) return;
    const option = select.options[select.selectedIndex];
    const price = card.querySelector('.product-card-price');
    if (price && option.dataset.price) price.innerHTML = `${option.dataset.price} <small>${option.dataset.pack || ''}</small>`;
  });
});

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

enhanceCartButtons();
renderBookmarksPage();
addBookmarkButtons();
renderCartPage();
updateCartPanel();

document.addEventListener('click', event => {
  const bookmarkButton = event.target.closest('.bookmark-toggle');
  if (bookmarkButton) {
    event.preventDefault();
    event.stopPropagation();
    const card = bookmarkButton.closest('.product-card');
    const product = card ? productFromCard(card) : productFromPage();
    const shouldSave = !isBookmarked(product.id);
    setBookmark(product, shouldSave);
    showToast(shouldSave ? 'Sparad produkt' : 'Borttagen från sparade produkter');
    return;
  }

  const cartButton = event.target.closest('.add-to-cart-btn');
  if (cartButton) {
    event.preventDefault();
    event.stopPropagation();
    const card = cartButton.closest('.product-card');
    if (card) addCartItem(productFromCard(card));
    cartButton.classList.add('added');
    setTimeout(() => cartButton.classList.remove('added'), 1000);
    showToast('Tillagd i kundvagnen');
    return;
  }

  const cartAction = event.target.closest('[data-cart-action]');
  if (cartAction) {
    event.preventDefault();
    const index = parseInt(cartAction.dataset.cartIndex, 10);
    const cart = readStore(CART_KEY);
    const current = cart[index]?.quantity || 1;
    if (cartAction.dataset.cartAction === 'increase') setCartItemQuantity(index, current + 1);
    if (cartAction.dataset.cartAction === 'decrease') setCartItemQuantity(index, Math.max(1, current - 1));
    if (cartAction.dataset.cartAction === 'remove') removeCartItem(index);
    return;
  }

  const card = event.target.closest('.product-card');
  if (card && !event.target.closest('.pack-select')) {
    const href = card.dataset.href || 'product.html';
    window.location.href = href;
  }
});

const mainCartBtn = document.querySelector('.add-to-cart-main .btn-primary');
if (mainCartBtn) {
  mainCartBtn.addEventListener('click', event => {
    event.preventDefault();
    const quantity = parseInt(document.querySelector('.qty-display')?.value || '1', 10) || 1;
    addCartItem(productFromPage(), quantity);
    showToast('Tillagd i kundvagnen');
  });
}

const qtyDisplay = document.querySelector('.qty-display');
if (qtyDisplay) {
  document.querySelector('.qty-minus')?.addEventListener('click', () => {
    const value = Math.max(1, parseInt(qtyDisplay.value || qtyDisplay.textContent, 10) - 1);
    qtyDisplay.value !== undefined ? (qtyDisplay.value = value) : (qtyDisplay.textContent = value);
  });
  document.querySelector('.qty-plus')?.addEventListener('click', () => {
    const value = parseInt(qtyDisplay.value || qtyDisplay.textContent, 10) + 1;
    qtyDisplay.value !== undefined ? (qtyDisplay.value = value) : (qtyDisplay.textContent = value);
  });
}

document.querySelectorAll('.pack-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.pack-option').forEach(item => item.classList.remove('selected'));
    option.classList.add('selected');
    const radio = option.querySelector('input[type=radio]');
    if (radio) radio.checked = true;
    const price = option.dataset.price;
    const priceEl = document.querySelector('.product-detail-price');
    if (price && priceEl) priceEl.innerHTML = `${price} <small>${option.dataset.pack || '1-pack'}</small>`;
  });
});
