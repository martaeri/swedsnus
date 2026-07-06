(() => {
  const CART_KEY = 'swedsnus-cart';
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

  function loadStyles() {
    ['interaction-fixes.css', 'product-card-cleanup.css', 'mobile-catalog-tools.css', 'mobile-polish.css'].forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
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
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produkt';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function parsePrice(value) {
    const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function selectedOption(card) {
    return card?.querySelector?.('.pack-select option:checked') || null;
  }

  function selectedPack(card) {
    const option = selectedOption(card);
    if (option) return option.dataset.pack || option.textContent.split('—')[0].trim() || '1-pack';
    const pagePack = document.querySelector('.pack-option.selected');
    return pagePack?.dataset.pack || '1-pack';
  }

  function selectedPrice(card) {
    const option = selectedOption(card);
    if (option?.dataset.price) return option.dataset.price;
    const pagePack = document.querySelector('.pack-option.selected');
    if (pagePack?.dataset.price) return pagePack.dataset.price;
    const cardPrice = card?.querySelector?.('.product-card-price');
    const pagePrice = document.querySelector('.product-detail-price');
    return (cardPrice?.childNodes?.[0]?.textContent || cardPrice?.textContent || pagePrice?.childNodes?.[0]?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function unitPrice(option) {
    if (!option) return '';
    if (option.dataset.per) return option.dataset.per;
    const price = parsePrice(option.dataset.price || option.textContent);
    const pack = option.dataset.pack || option.textContent;
    const amount = parseInt((pack.match(/[0-9]+/) || ['1'])[0], 10) || 1;
    return price ? `${Math.round(price / amount).toLocaleString('sv-SE')} kr/st` : '';
  }

  function productMetaFromCard(card) {
    return Array.from(card.querySelectorAll('.product-card-meta')).map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  function metaValue(card, label) {
    const row = Array.from(card.querySelectorAll('.product-card-meta')).find(item => item.textContent.toLowerCase().startsWith(label.toLowerCase()));
    const span = row?.querySelector('span');
    if (span) return span.textContent.trim();
    return row ? row.textContent.split(':').slice(1).join(':').trim() : '';
  }

  function productFromCard(card) {
    const name = card.querySelector('.product-card-name')?.textContent?.trim() || 'Produkt';
    return {
      id: card.dataset.productId || slugify(name),
      name,
      badge: card.querySelector('.product-card-badge')?.textContent?.trim() || '',
      meta: productMetaFromCard(card),
      price: selectedPrice(card),
      pack: selectedPack(card),
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
    return { id: slugify(name), name, badge: badges[0] || '', meta, price: selectedPrice(document), pack: selectedPack(document), href: 'product.html' };
  }

  function isAroma(card) {
    return card.textContent.toLowerCase().includes('arom');
  }

  function isAccessory(card) {
    const path = window.location.pathname.split('/').pop();
    const text = card.textContent.toLowerCase();
    return path === 'tillbehor.html' || text.includes('tillbehör') || text.includes('material:');
  }

  function isPortionLike(card) {
    if (isAccessory(card) || isAroma(card)) return false;
    const text = card.textContent.toLowerCase();
    return ['portion', 'white', 'premium', 'rebell', 'rx slim', 'mini', 'instant', 'super dry', 'notch', 'fat boy', 'compact', 'large'].some(term => text.includes(term));
  }

  function isSnusProduct(card) {
    if (isAccessory(card) || isAroma(card)) return false;
    const text = card.textContent.toLowerCase();
    return ['snus', 'portion', 'white', 'premium', 'rebell', 'rx slim', 'mini', 'instant', 'super dry', 'notch', 'fat boy', 'lös'].some(term => text.includes(term));
  }

  function inferSize(card) {
    const text = card.textContent.toLowerCase();
    if (text.includes('rx slim')) return 'RX Slim';
    if (text.includes('mini')) return 'Mini';
    if (text.includes('compact')) return 'Compact';
    if (text.includes('rebell')) return 'Rebell';
    if (text.includes('premium')) return 'Premium';
    if (text.includes('instant')) return 'Instant';
    if (text.includes('large') || text.includes('fat boy') || text.includes('notch') || text.includes('super dry')) return 'Large';
    return card.querySelector('.product-card-badge')?.textContent?.trim() || 'Premium';
  }

  function inferStrength(card) {
    const text = card.textContent.toLowerCase();
    if (text.includes('extra strong') || text.includes('extra stark') || text.includes('rebell')) return 4;
    if (text.includes('rx slim') || text.includes('strong') || text.includes('stark')) return 3;
    return 2;
  }

  function normalizePortionName(card) {
    if (!isPortionLike(card)) return;
    const name = card.querySelector('.product-card-name');
    if (!name || name.textContent.includes('dosor')) return;
    const text = name.textContent.trim();
    const match = text.match(/\b(300|400|500)\b/);
    if (!match) return;
    const dosor = parseInt(match[1], 10) / 20;
    name.textContent = `${text.replace(/\s*\b(300|400|500)\b\s*/g, ' ').replace(/\s+/g, ' ').trim()} ${dosor} dosor`;
    card.dataset.productId = slugify(name.textContent);
  }

  function normalizeMeta(card) {
    if (!isPortionLike(card)) return;
    const flavor = metaValue(card, 'Smak') || 'Neutral';
    card.querySelectorAll('.product-card-meta').forEach(item => item.remove());
    const name = card.querySelector('.product-card-name');
    if (!name) return;
    name.insertAdjacentHTML('afterend', `<p class="product-card-meta">Portionsstorlek: <span>${escapeHtml(inferSize(card))}</span></p><p class="product-card-meta">Smak: <span>${escapeHtml(flavor)}</span></p>`);
  }

  function ensureStrength(card) {
    if (!isSnusProduct(card) || card.querySelector('.strength-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'strength-bar';
    const level = inferStrength(card);
    for (let i = 1; i <= 5; i += 1) {
      const span = document.createElement('span');
      if (i <= level) span.className = 'filled';
      bar.appendChild(span);
    }
    const insertAfter = Array.from(card.querySelectorAll('.product-card-meta')).pop() || card.querySelector('.product-card-name');
    insertAfter?.insertAdjacentElement('afterend', bar);
  }

  function normalizePackOptions(card) {
    card.querySelectorAll('.pack-select option').forEach(option => {
      const pack = option.dataset.pack || option.textContent.split('—')[0].trim() || '1-pack';
      const price = option.dataset.price || option.textContent.split('—').slice(1).join('—').replace(/\([^)]*\)/g, '').trim();
      if (pack) option.dataset.pack = pack;
      if (price) option.dataset.price = price;
      option.textContent = `${pack} — ${price}`;
    });
  }

  function normalizeProductCardLayout(card) {
    normalizePortionName(card);
    normalizeMeta(card);
    ensureStrength(card);
    normalizePackOptions(card);
    const actions = card.querySelector('.product-card-actions');
    const price = card.querySelector('.product-card-price');
    const button = card.querySelector('.add-to-cart-btn');
    if (!actions || !price || !button) return;
    let bottom = card.querySelector('.product-card-bottom');
    if (!bottom) {
      bottom = document.createElement('div');
      bottom.className = 'product-card-bottom';
      actions.insertAdjacentElement('afterend', bottom);
    }
    bottom.appendChild(price);
    bottom.appendChild(button);
    button.type = 'button';
    if (!button.querySelector('svg')) button.innerHTML = CART_ICON;
    const per = unitPrice(selectedOption(card));
    price.innerHTML = `<span class="unit-price">${escapeHtml(per || selectedPrice(card))}</span><small>per produkt</small>`;
  }

  function normalizeAllProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      normalizeProductCardLayout(card);
      const product = productFromCard(card);
      card.dataset.productId = product.id;
      if (!card.dataset.href) card.dataset.href = 'product.html';
      if (!card.querySelector('.bookmark-toggle')) {
        const bookmark = document.createElement('button');
        bookmark.type = 'button';
        bookmark.className = 'bookmark-toggle';
        bookmark.setAttribute('aria-label', 'Spara produkt');
        bookmark.innerHTML = BOOKMARK_ICON;
        card.appendChild(bookmark);
      }
      card.querySelector('.bookmark-toggle').dataset.productId = card.dataset.productId;
    });
    syncBookmarkButtons();
  }

  function isBookmarked(id) {
    return readStore(BOOKMARKS_KEY).some(item => item.id === id);
  }

  function syncBookmarkButtons() {
    document.querySelectorAll('.bookmark-toggle[data-product-id]').forEach(button => {
      const active = isBookmarked(button.dataset.productId);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
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

  function renderProductCard(product) {
    return `<div class="product-card" data-product-id="${escapeHtml(product.id)}" data-href="${escapeHtml(product.href || 'product.html')}"><button class="bookmark-toggle active" data-product-id="${escapeHtml(product.id)}" type="button" aria-label="Spara produkt" aria-pressed="true">${BOOKMARK_ICON}</button><div class="img-placeholder product">Produktbild</div><div class="product-card-body">${product.badge ? `<span class="product-card-badge">${escapeHtml(product.badge)}</span>` : ''}<p class="product-card-name">${escapeHtml(product.name)}</p>${metaMarkup(product.meta)}<div class="product-card-actions"><select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(product.price || '')}" data-pack="${escapeHtml(product.pack || '1-pack')}">${escapeHtml(product.pack || '1-pack')} — ${escapeHtml(product.price || '')}</option></select></div><div class="product-card-bottom"><p class="product-card-price"><span class="unit-price">${escapeHtml(product.price || '')}</span><small>per produkt</small></p><button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button></div></div></div>`;
  }

  function renderBookmarksPage() {
    const list = document.querySelector('[data-bookmarks-list]') || (document.body.classList.contains('bookmarks-page') ? document.querySelector('.bookmarks-list') : null);
    if (!list) return;
    const bookmarks = readStore(BOOKMARKS_KEY);
    const count = document.querySelector('[data-bookmark-count]');
    if (count) count.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'produkt' : 'produkter'}`;
    list.classList.add('product-grid', 'bookmarks-product-grid');
    list.innerHTML = bookmarks.length ? bookmarks.map(renderProductCard).join('') : '<div class="bookmarks-empty">Du har inga sparade produkter än.</div>';
  }

  function saveBookmark(product, shouldSave) {
    const bookmarks = readStore(BOOKMARKS_KEY).filter(item => item.id !== product.id);
    if (shouldSave) bookmarks.unshift(product);
    writeStore(BOOKMARKS_KEY, bookmarks);
    renderBookmarksPage();
    normalizeAllProductCards();
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
    return cart.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);
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
      list.innerHTML = cart.slice(0, 4).map(item => `<a href="${escapeHtml(item.href || 'product.html')}" class="cart-panel-item"><span class="cart-panel-item-img"></span><span class="cart-panel-item-main"><span class="cart-panel-item-name">${escapeHtml(item.name)}</span><span class="cart-panel-item-meta">${item.quantity || 1} × ${escapeHtml(item.pack || '1-pack')}</span></span><span class="cart-panel-item-price">${escapeHtml(item.price || '')}</span></a>`).join('');
    });
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
    list.innerHTML = cart.length ? cart.map((item, index) => `<article class="cart-page-item"><a href="${escapeHtml(item.href || 'product.html')}" class="cart-page-img">Produktbild</a><div class="cart-page-main">${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}<h3><a href="${escapeHtml(item.href || 'product.html')}">${escapeHtml(item.name)}</a></h3>${metaMarkup(item.meta)}<p class="cart-page-pack">${escapeHtml(item.pack || '1-pack')}</p></div><div class="cart-page-qty"><button type="button" data-cart-action="decrease" data-index="${index}">−</button><span>${item.quantity || 1}</span><button type="button" data-cart-action="increase" data-index="${index}">+</button></div><strong class="cart-page-price">${escapeHtml(item.price || '')}</strong><button class="cart-page-remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Ta bort produkt">×</button></article>`).join('') : '<div class="cart-empty-page">Din kundvagn är tom.</div>';
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

  function uniqueLinks(links) {
    const seen = new Set();
    return links.filter(link => {
      const href = link.href || '#';
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });
  }

  function initMobileMenu() {
    if (document.querySelector('.mobile-menu-panel')) return;
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    const panel = document.createElement('aside');
    panel.className = 'mobile-menu-panel';
    panel.setAttribute('aria-hidden', 'true');
    const categoryLinks = uniqueLinks(Array.from(document.querySelectorAll('.subnav-inner a, .sub-dropdown a')).map(a => ({ href: a.getAttribute('href') || '#', text: a.textContent.trim() })).filter(item => item.text));
    const pageLinks = uniqueLinks(Array.from(document.querySelectorAll('.subheader-inner > li > a, .main-nav > li > a')).map(a => ({ href: a.getAttribute('href') || '#', text: a.childNodes[0]?.textContent?.trim() || a.textContent.trim() })).filter(item => item.text && item.href !== '#'));
    const primary = uniqueLinks([...categoryLinks, ...pageLinks]);
    panel.innerHTML = `
      <div class="mobile-menu-header"><span class="mobile-menu-title">Meny</span><button class="mobile-menu-close" type="button" aria-label="Stäng meny">×</button></div>
      <div class="mobile-menu-content">
        <nav class="mobile-menu-section">${primary.map(item => `<a class="mobile-menu-link" href="${escapeHtml(item.href)}">${escapeHtml(item.text)}</a>`).join('')}</nav>
        <nav class="mobile-menu-section"><a class="mobile-menu-link secondary" href="login.html">Mitt konto / logga in</a><a class="mobile-menu-link secondary" href="#">Kundservice</a></nav>
      </div>`;
    document.body.append(overlay, panel);
    const toggle = document.querySelector('.nav-toggle');
    const close = () => {
      panel.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('mobile-menu-open');
      panel.setAttribute('aria-hidden', 'true');
      toggle?.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      panel.classList.add('open');
      overlay.classList.add('show');
      document.body.classList.add('mobile-menu-open');
      panel.setAttribute('aria-hidden', 'false');
      toggle?.setAttribute('aria-expanded', 'true');
    };
    toggle?.addEventListener('click', event => {
      event.preventDefault();
      panel.classList.contains('open') ? close() : open();
    });
    panel.querySelector('.mobile-menu-close')?.addEventListener('click', close);
    overlay.addEventListener('click', close);
    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }

  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;
    function update() {
      const y = window.scrollY;
      if (window.innerWidth <= 720) {
        if (y > 80 && y > lastY + 4 && !document.body.classList.contains('mobile-menu-open')) header.classList.add('mobile-condensed');
        if (y < lastY - 4 || y < 40) header.classList.remove('mobile-condensed');
      } else {
        header.classList.remove('mobile-condensed');
      }
      lastY = y;
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function initNavigation() {
    document.querySelectorAll('a[href="portion.html#gor-eget"], a[href="index.html#gor-eget"], a[href$="#gor-eget"]').forEach(link => link.href = 'gor-eget.html');
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if ((currentFile === 'portion.html' || currentFile === 'index.html') && window.location.hash === '#gor-eget') window.location.replace('gor-eget.html');
    document.querySelectorAll('.subheader-inner a, .subnav-inner a, .main-nav a').forEach(link => {
      const href = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
      if (href && href === currentFile) link.classList.add('active');
    });
    initMobileMenu();
    initStickyHeader();
  }

  function sortGrid(grid, mode) {
    const cards = Array.from(grid.querySelectorAll('.product-card'));
    cards.forEach((card, index) => { if (!card.dataset.originalIndex) card.dataset.originalIndex = index; });
    const sorted = cards.slice().sort((a, b) => {
      const nameA = a.querySelector('.product-card-name')?.textContent?.trim() || '';
      const nameB = b.querySelector('.product-card-name')?.textContent?.trim() || '';
      const priceA = parsePrice(selectedPrice(a));
      const priceB = parsePrice(selectedPrice(b));
      if (mode === 'price-asc') return priceA - priceB;
      if (mode === 'price-desc') return priceB - priceA;
      if (mode === 'alpha') return nameA.localeCompare(nameB, 'sv');
      if (mode === 'alpha-desc') return nameB.localeCompare(nameA, 'sv');
      if (mode === 'newest') return Number(b.dataset.originalIndex) - Number(a.dataset.originalIndex);
      return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    });
    sorted.forEach(card => grid.appendChild(card));
  }

  function initCatalogControls() {
    document.querySelectorAll('.catalog-page[data-catalog-filter]').forEach(catalog => {
      if (catalog.querySelector('.catalog-mobile-tools')) return;
      const tools = catalog.querySelector('.catalog-tools');
      const sidebar = catalog.querySelector('.filter-sidebar');
      const grid = catalog.querySelector('.product-grid');
      if (!tools || !sidebar || !grid) return;
      const controls = document.createElement('div');
      controls.className = 'catalog-mobile-tools';
      controls.innerHTML = `<button class="catalog-filter-toggle" type="button" aria-expanded="false">Filter</button><select class="catalog-sort-select" aria-label="Sortera produkter"><option value="relevance">Relevans</option><option value="price-asc">Pris: lägst först</option><option value="price-desc">Pris: högst först</option><option value="alpha">A–Ö</option><option value="alpha-desc">Ö–A</option><option value="newest">Nyast först</option></select>`;
      tools.insertAdjacentElement('beforebegin', controls);
      const overlay = document.createElement('div');
      overlay.className = 'catalog-filter-overlay';
      document.body.appendChild(overlay);
      if (!sidebar.querySelector('.catalog-filter-close')) {
        const close = document.createElement('button');
        close.className = 'catalog-filter-close';
        close.type = 'button';
        close.textContent = 'Visa produkter';
        sidebar.appendChild(close);
      }
      const toggle = controls.querySelector('.catalog-filter-toggle');
      const sort = controls.querySelector('.catalog-sort-select');
      function setFilterOpen(open) {
        sidebar.classList.toggle('mobile-filter-open', open);
        overlay.classList.toggle('show', open);
        toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('catalog-filter-open', open);
      }
      toggle?.addEventListener('click', () => setFilterOpen(!sidebar.classList.contains('mobile-filter-open')));
      overlay.addEventListener('click', () => setFilterOpen(false));
      sidebar.querySelector('.catalog-filter-close')?.addEventListener('click', () => setFilterOpen(false));
      sort?.addEventListener('change', () => sortGrid(grid, sort.value));
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
        else { button.classList.add('active'); update(button.dataset.series); }
      }));
      update(null);
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
      let startX = 0;
      let startY = 0;
      let dragging = false;
      let swiped = false;
      function visibleCount() {
        const width = outer.offsetWidth;
        if (width < 720) return 2;
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
      outer.addEventListener('pointerdown', event => {
        startX = event.clientX;
        startY = event.clientY;
        dragging = true;
        swiped = false;
      });
      outer.addEventListener('pointermove', event => {
        if (!dragging) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) event.preventDefault();
      }, { passive: false });
      outer.addEventListener('pointerup', event => {
        if (!dragging) return;
        dragging = false;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > 36) {
          swiped = true;
          go(current + (dx < 0 ? 1 : -1));
          setTimeout(() => { swiped = false; }, 120);
        }
      });
      outer.addEventListener('pointercancel', () => {
        dragging = false;
      });
      outer.addEventListener('click', event => {
        if (swiped) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      size();
      window.addEventListener('resize', size);
      prev?.addEventListener('click', () => go(current - 1));
      next?.addEventListener('click', () => go(current + 1));
    });
  }

  function initProductPageControls() {
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
    syncBookmarkButtons();
  }

  function handleClicks() {
    document.addEventListener('change', event => {
      const select = event.target.closest('.pack-select');
      if (!select) return;
      const card = select.closest('.product-card');
      if (card) normalizeProductCardLayout(card);
    });
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
      if (card && !event.target.closest('.pack-select')) window.location.href = card.dataset.href || 'product.html';
    });
  }

  function init() {
    loadStyles();
    initThemeSwitcher();
    initNavigation();
    initFilters();
    initCatalogControls();
    initCarousels();
    renderBookmarksPage();
    normalizeAllProductCards();
    initProductPageControls();
    updateCartPanel();
    renderCartPage();
    handleClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
