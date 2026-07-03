(() => {
  const CART_KEY = 'swedsnus-cart';
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

  function loadInteractionCss() {
    if (!document.querySelector('link[href="interaction-fixes.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'interaction-fixes.css';
      document.head.appendChild(link);
    }
  }

  function readStore(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
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

  function priceNumber(value) {
    const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function getSelectedOption(card) {
    return card?.querySelector?.('.pack-select option:checked') || null;
  }

  function getSelectedPack(card) {
    const option = getSelectedOption(card);
    if (option) return option.dataset.pack || option.textContent.split('—')[0].trim() || '1-pack';
    const selectedPack = document.querySelector('.pack-option.selected');
    return selectedPack?.dataset.pack || '1-pack';
  }

  function getSelectedPrice(card) {
    const option = getSelectedOption(card);
    if (option?.dataset.price) return option.dataset.price;
    const selectedPack = document.querySelector('.pack-option.selected');
    if (selectedPack?.dataset.price) return selectedPack.dataset.price;
    const cardPrice = card?.querySelector?.('.product-card-price');
    const pagePrice = document.querySelector('.product-detail-price');
    return (cardPrice?.childNodes?.[0]?.textContent || cardPrice?.textContent || pagePrice?.childNodes?.[0]?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function productMetaFromCard(card) {
    return Array.from(card.querySelectorAll('.product-card-meta'))
      .map(item => item.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function productFromCard(card) {
    const name = card.querySelector('.product-card-name')?.textContent?.trim() || 'Produkt';
    return {
      id: card.dataset.productId || slugify(name),
      name,
      badge: card.querySelector('.product-card-badge')?.textContent?.trim() || '',
      meta: productMetaFromCard(card),
      price: getSelectedPrice(card),
      pack: getSelectedPack(card),
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
      pack: getSelectedPack(document),
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

  function saveBookmark(product, shouldSave) {
    const bookmarks = readStore(BOOKMARKS_KEY).filter(item => item.id !== product.id);
    if (shouldSave) bookmarks.unshift(product);
    writeStore(BOOKMARKS_KEY, bookmarks);
    renderBookmarksPage();
    ensureProductControls();
  }

  function syncBookmarkButtons() {
    document.querySelectorAll('.bookmark-toggle[data-product-id]').forEach(button => {
      const active = isBookmarked(button.dataset.productId);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('title', active ? 'Ta bort från sparade produkter' : 'Spara produkt');
    });
  }

  function ensureProductControls() {
    document.querySelectorAll('.product-card').forEach(card => {
      const product = productFromCard(card);
      card.dataset.productId = product.id;
      if (!card.dataset.href) card.dataset.href = product.href || 'product.html';

      let bookmark = card.querySelector('.bookmark-toggle');
      if (!bookmark) {
        bookmark = document.createElement('button');
        bookmark.type = 'button';
        bookmark.className = 'bookmark-toggle';
        bookmark.setAttribute('aria-label', 'Spara produkt');
        bookmark.innerHTML = BOOKMARK_ICON;
        card.appendChild(bookmark);
      }
      bookmark.dataset.productId = product.id;

      card.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.type = 'button';
        if (!button.querySelector('svg')) button.innerHTML = CART_ICON;
      });
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

  function addCartItem(product, quantity = 1) {
    const cart = readStore(CART_KEY);
    const existing = cart.find(item => item.id === product.id && item.pack === product.pack && item.price === product.price);
    if (existing) existing.quantity += quantity;
    else cart.unshift({ ...product, quantity });
    writeStore(CART_KEY, cart);
    updateCartPanel();
    renderCartPage();
  }

  function cartTotal(cart) {
    return cart.reduce((sum, item) => sum + priceNumber(item.price) * (item.quantity || 1), 0);
  }

  function updateCartPanel() {
    const cart = readStore(CART_KEY);
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(item => item.textContent = count);
    document.querySelectorAll('.cart-panel-count').forEach(item => item.textContent = `${count} ${count === 1 ? 'artikel' : 'artiklar'}`);
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
      list.innerHTML = cart.slice(0, 4).map(item => `
        <a href="${escapeHtml(item.href || 'product.html')}" class="cart-panel-item">
          <span class="cart-panel-item-img"></span>
          <span class="cart-panel-item-main"><span class="cart-panel-item-name">${escapeHtml(item.name)}</span><span class="cart-panel-item-meta">${item.quantity || 1} × ${escapeHtml(item.pack || '1-pack')}</span></span>
          <span class="cart-panel-item-price">${escapeHtml(item.price || '')}</span>
        </a>
      `).join('');
    });
  }

  function renderProductCard(product) {
    return `
      <div class="product-card" data-product-id="${escapeHtml(product.id)}" data-href="${escapeHtml(product.href || 'product.html')}">
        <button class="bookmark-toggle active" data-product-id="${escapeHtml(product.id)}" type="button" aria-label="Spara produkt" aria-pressed="true">${BOOKMARK_ICON}</button>
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
    const count = document.querySelector('[data-bookmark-count]');
    if (count) count.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'produkt' : 'produkter'}`;
    list.classList.add('product-grid', 'bookmarks-product-grid');
    list.innerHTML = bookmarks.length
      ? bookmarks.map(renderProductCard).join('')
      : '<div class="bookmarks-empty">Du har inga sparade produkter än. Spara en produkt med bokmärkesikonen på ett produktkort eller en produktsida.</div>';
  }

  function renderCartPage() {
    const page = document.querySelector('[data-cart-page]');
    if (!page) return;
    const cart = readStore(CART_KEY);
    const list = page.querySelector('[data-cart-items]');
    const summaryCount = page.querySelector('[data-cart-summary-count]');
    const summaryTotal = page.querySelector('[data-cart-summary-total]');
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (summaryCount) summaryCount.textContent = `${totalQty} ${totalQty === 1 ? 'artikel' : 'artiklar'}`;
    if (summaryTotal) summaryTotal.textContent = `${cartTotal(cart).toLocaleString('sv-SE')} kr`;
    if (!list) return;
    list.innerHTML = cart.length ? cart.map((item, index) => `
      <article class="cart-page-item">
        <a href="${escapeHtml(item.href || 'product.html')}" class="cart-page-img">Produktbild</a>
        <div class="cart-page-main">
          ${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}
          <h3><a href="${escapeHtml(item.href || 'product.html')}">${escapeHtml(item.name)}</a></h3>
          ${metaMarkup(item.meta)}
          <p class="cart-page-pack">${escapeHtml(item.pack || '1-pack')}</p>
        </div>
        <div class="cart-page-qty"><button type="button" data-cart-action="decrease" data-index="${index}">−</button><span>${item.quantity || 1}</span><button type="button" data-cart-action="increase" data-index="${index}">+</button></div>
        <strong class="cart-page-price">${escapeHtml(item.price || '')}</strong>
        <button class="cart-page-remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Ta bort produkt">×</button>
      </article>
    `).join('') : '<div class="cart-empty-page">Din kundvagn är tom.</div>';
  }

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

  function initThemeSwitcher() {
    const saved = localStorage.getItem('swedsnus-theme') || '1';
    document.documentElement.className = saved === '1' ? '' : `theme-${saved}`;
    document.querySelectorAll('.theme-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.theme === saved);
      dot.addEventListener('click', () => {
        const theme = dot.dataset.theme;
        document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
        document.querySelectorAll('.theme-dot').forEach(item => item.classList.toggle('active', item === dot));
        localStorage.setItem('swedsnus-theme', theme);
      });
    });
  }

  function initNavigation() {
    document.querySelectorAll('a[href="portion.html#gor-eget"], a[href="index.html#gor-eget"], a[href$="#gor-eget"]').forEach(link => link.href = 'gor-eget.html');
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if ((currentFile === 'portion.html' || currentFile === 'index.html') && window.location.hash === '#gor-eget') window.location.replace('gor-eget.html');
    document.querySelector('.nav-toggle')?.addEventListener('click', () => {
      document.querySelector('.subheader')?.classList.toggle('mobile-open');
      document.querySelector('.main-nav')?.classList.toggle('mobile-open');
    });
    document.querySelectorAll('.subheader-inner a, .subnav-inner a, .main-nav a').forEach(link => {
      const href = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (href && href === currentFile) link.classList.add('active');
    });
  }

  function initFilters() {
    document.querySelectorAll('.filter-bar').forEach(bar => {
      bar.addEventListener('click', event => {
        const chip = event.target.closest('.filter-chip');
        if (!chip) return;
        bar.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
        chip.classList.add('active');
      });
    });

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
      buttons.forEach(button => button.addEventListener('click', () => {
        const active = button.classList.contains('active');
        buttons.forEach(item => item.classList.remove('active'));
        if (active) update(null);
        else {
          button.classList.add('active');
          update(button.dataset.series);
        }
      }));
      update(null);
    });
  }

  function initProductPageControls() {
    const qty = document.querySelector('.qty-display');
    document.querySelector('.qty-minus')?.addEventListener('click', () => { if (qty) qty.value = Math.max(1, parseInt(qty.value || '1', 10) - 1); });
    document.querySelector('.qty-plus')?.addEventListener('click', () => { if (qty) qty.value = parseInt(qty.value || '1', 10) + 1; });
    document.querySelectorAll('.pack-option').forEach(option => option.addEventListener('click', () => {
      document.querySelectorAll('.pack-option').forEach(item => item.classList.remove('selected'));
      option.classList.add('selected');
      const radio = option.querySelector('input[type=radio]');
      if (radio) radio.checked = true;
      const price = option.dataset.price;
      const priceEl = document.querySelector('.product-detail-price');
      if (price && priceEl) priceEl.innerHTML = `${price} <small>${option.dataset.pack || '1-pack'}</small>`;
    }));
    document.querySelector('.add-to-cart-main .btn-primary')?.addEventListener('click', event => {
      event.preventDefault();
      addCartItem(productFromPage(), parseInt(qty?.value || '1', 10) || 1);
      showToast('Tillagd i kundvagnen');
    });
  }

  function initCarousels() {
    document.querySelectorAll('.carousel-header').forEach(header => {
      const heading = header.querySelector('.section-heading');
      if (heading && heading.textContent.trim().toLowerCase() === 'nyheter') header.querySelector('.see-all')?.remove();
    });

    document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
      const track = wrapper.querySelector('.carousel-track');
      const outer = wrapper.querySelector('.carousel-track-outer');
      const prev = wrapper.querySelector('.carousel-btn-prev');
      const next = wrapper.querySelector('.carousel-btn-next');
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
      function cardWidth() { return (outer.offsetWidth - gapSize() * (visibleCount() - 1)) / visibleCount(); }
      function maxIndex() { return Math.max(0, track.querySelectorAll('.product-card').length - visibleCount()); }
      function go(index) {
        current = Math.max(0, Math.min(index, maxIndex()));
        track.style.transform = `translateX(-${current * (cardWidth() + gapSize())}px)`;
        if (prev) prev.disabled = current === 0;
        if (next) next.disabled = current >= maxIndex();
      }
      function size() {
        const width = cardWidth();
        track.style.gap = `${gapSize()}px`;
        track.querySelectorAll('.product-card').forEach(card => {
          card.style.flex = `0 0 ${width}px`;
          card.style.width = `${width}px`;
        });
        go(current);
      }
      size();
      window.addEventListener('resize', size);
      prev?.addEventListener('click', () => go(current - 1));
      next?.addEventListener('click', () => go(current + 1));
    });
  }

  function handleClicks() {
    document.addEventListener('click', event => {
      const bookmark = event.target.closest('.bookmark-toggle');
      if (bookmark) {
        event.preventDefault();
        event.stopPropagation();
        const card = bookmark.closest('.product-card');
        const product = card ? productFromCard(card) : productFromPage();
        const shouldSave = !isBookmarked(product.id);
        saveBookmark(product, shouldSave);
        showToast(shouldSave ? 'Sparad produkt' : 'Borttagen från sparade produkter');
        return;
      }

      const addButton = event.target.closest('.add-to-cart-btn');
      if (addButton) {
        event.preventDefault();
        event.stopPropagation();
        const card = addButton.closest('.product-card');
        if (card) addCartItem(productFromCard(card));
        addButton.classList.add('added');
        setTimeout(() => addButton.classList.remove('added'), 900);
        showToast('Tillagd i kundvagnen');
        return;
      }

      const cartAction = event.target.closest('[data-cart-action]');
      if (cartAction) {
        event.preventDefault();
        const index = parseInt(cartAction.dataset.index, 10);
        const cart = readStore(CART_KEY);
        if (!cart[index]) return;
        if (cartAction.dataset.cartAction === 'increase') cart[index].quantity = (cart[index].quantity || 1) + 1;
        if (cartAction.dataset.cartAction === 'decrease') cart[index].quantity = Math.max(1, (cart[index].quantity || 1) - 1);
        if (cartAction.dataset.cartAction === 'remove') cart.splice(index, 1);
        writeStore(CART_KEY, cart);
        updateCartPanel();
        renderCartPage();
        return;
      }

      const card = event.target.closest('.product-card');
      if (card && !event.target.closest('.pack-select')) {
        window.location.href = card.dataset.href || 'product.html';
      }
    });
  }

  function init() {
    loadInteractionCss();
    initThemeSwitcher();
    initNavigation();
    initFilters();
    initCarousels();
    renderBookmarksPage();
    ensureProductControls();
    initProductPageControls();
    updateCartPanel();
    renderCartPage();
    handleClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
