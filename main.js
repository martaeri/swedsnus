(() => {
  const CART_KEY = 'swedsnus-cart';
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const PRODUCT_PAGE = 'product.html';
  const DEFAULT_PRODUCT_HREF = 'portion.html';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const orders = [
    { id: 'SW-10504', date: '2026-07-05', status: 'På väg', current: true, total: '989 kr', items: ['Lössnus Grov Express 40 Dosor'], eta: 'Beräknad leverans: 2026-07-08', tracking: 'PN-735904-SW' },
    { id: 'SW-10482', date: '2026-06-28', status: 'Levererad', current: false, total: '867 kr', items: ['Spacemint Premium 15 dosor', 'Robust 40 dosor'], eta: 'Levererad 2026-07-01', tracking: 'PN-732884-SW' },
    { id: 'SW-10361', date: '2026-05-17', status: 'Levererad', current: false, total: '549 kr', items: ['Spacemint Rebell 2-pack'], eta: 'Levererad 2026-05-20', tracking: 'PN-712409-SW' },
    { id: 'SW-10224', date: '2026-04-03', status: 'Returnerad', current: false, total: '289 kr', items: ['White RX Slim 15 dosor'], eta: 'Retur hanterad 2026-04-12', tracking: 'PN-690122-SW' }
  ];

  let pendingLoginAction = null;
  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

  function readStore(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
  function writeStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function setLoggedIn(value) { value ? sessionStorage.setItem(AUTH_KEY, 'true') : sessionStorage.removeItem(AUTH_KEY); syncAccountState(); }
  function escapeHtml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function slugify(value) { return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produkt'; }
  function parsePrice(value) { const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/); return match ? parseInt(match[0], 10) : 0; }
  function productIdFromHref(href) { try { return new URL(href || '', location.href).searchParams.get('id') || ''; } catch { return ''; } }
  function selectedOption(card) { return card?.querySelector?.('.pack-select option:checked') || null; }
  function selectedPack(card) { const option = selectedOption(card); return option?.dataset.pack || option?.textContent?.split('—')[0]?.trim() || $('.pack-option.selected')?.dataset.pack || '1-pack'; }
  function selectedPrice(card) {
    const option = selectedOption(card);
    if (option?.dataset.price) return option.dataset.price;
    const pack = $('.pack-option.selected');
    if (pack?.dataset.price) return pack.dataset.price;
    const price = card?.querySelector?.('.product-card-price') || $('.product-detail-price');
    return (price?.childNodes?.[0]?.textContent || price?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function unitPrice(option) {
    if (!option) return '';
    if (option.dataset.per) return option.dataset.per;
    const price = parsePrice(option.dataset.price || option.textContent);
    const pack = option.dataset.pack || option.textContent;
    const amount = parseInt((pack.match(/[0-9]+/) || ['1'])[0], 10) || 1;
    return price ? `${Math.round(price / amount).toLocaleString('sv-SE')} kr/st` : '';
  }
  function cardMeta(card) { return $$('.product-card-meta', card).map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean); }
  function productHref(product = {}) {
    const normalized = window.SwedsnusProducts?.normalizeProductHref?.(product);
    if (normalized) return normalized;
    const id = product.id || productIdFromHref(product.href);
    return id ? `${PRODUCT_PAGE}?id=${encodeURIComponent(id)}` : DEFAULT_PRODUCT_HREF;
  }
  function normalizeProductRecord(product) { return { ...product, href: productHref(product) }; }
  function migrateProductStores() {
    [BOOKMARKS_KEY, CART_KEY].forEach(key => {
      const items = readStore(key);
      let changed = false;
      const normalized = items.map(item => {
        const next = normalizeProductRecord(item);
        if (next.href !== item.href) changed = true;
        return next;
      });
      if (changed) writeStore(key, normalized);
    });
  }
  function productFromCard(card) {
    const name = $('.product-card-name', card)?.textContent?.trim() || 'Produkt';
    const id = card.dataset.productId || slugify(name);
    return normalizeProductRecord({ id, name, badge: $('.product-card-badge', card)?.textContent?.trim() || '', meta: cardMeta(card), price: selectedPrice(card), pack: selectedPack(card), href: card.dataset.href || $('.product-card-main-link', card)?.getAttribute('href') });
  }
  function productFromPage() {
    const detail = $('.product-detail');
    const name = $('.product-detail h1')?.textContent?.trim() || document.title.split('—')[0].trim() || 'Produkt';
    const id = detail?.dataset.productId || new URLSearchParams(location.search).get('id') || slugify(name);
    const meta = $$('.product-detail-meta-row').map(row => `${$('dt', row)?.textContent?.trim() || ''}: ${$('dd', row)?.textContent?.replace(/\s+/g, ' ')?.trim() || ''}`).filter(item => item.length > 2).slice(0, 3);
    return normalizeProductRecord({ id, name, badge: $('.product-card-badge')?.textContent?.trim() || '', meta, price: selectedPrice(document), pack: selectedPack(document) });
  }
  function isBookmarked(id) { return readStore(BOOKMARKS_KEY).some(item => item.id === id); }
  function updateBookmarkCount(bookmarks = readStore(BOOKMARKS_KEY)) {
    const count = $('[data-bookmark-count]');
    if (count) count.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'produkt' : 'produkter'}`;
  }
  function saveBookmark(product, shouldSave) {
    const item = normalizeProductRecord(product);
    const bookmarks = readStore(BOOKMARKS_KEY).filter(saved => saved.id !== item.id);
    if (shouldSave) bookmarks.unshift(item);
    writeStore(BOOKMARKS_KEY, bookmarks);
    if (document.body.classList.contains('bookmarks-page')) updateBookmarkCount(bookmarks);
    else renderBookmarksPage();
    syncBookmarkButtons();
  }
  function normalizeProductCard(card) {
    if (!card || card.dataset.normalized === 'true') return;
    const product = productFromCard(card);
    card.dataset.href = product.href;
    card.dataset.productId = product.id;
    $$('.pack-select option', card).forEach(option => {
      const pack = option.dataset.pack || option.textContent.split('—')[0].trim() || '1-pack';
      const price = option.dataset.price || option.textContent.split('—').slice(1).join('—').replace(/\([^)]*\)/g, '').trim();
      option.dataset.pack = pack;
      if (price) option.dataset.price = price;
      option.textContent = `${pack} — ${price}`;
    });
    const actions = $('.product-card-actions', card);
    const price = $('.product-card-price', card);
    const button = $('.add-to-cart-btn', card);
    if (actions && price && button) {
      let bottom = $('.product-card-bottom', card);
      if (!bottom) {
        bottom = document.createElement('div');
        bottom.className = 'product-card-bottom';
        actions.insertAdjacentElement('afterend', bottom);
      }
      bottom.append(price, button);
      button.type = 'button';
      if (!button.querySelector('svg')) button.innerHTML = CART_ICON;
      price.innerHTML = `<span class="unit-price">${escapeHtml(unitPrice(selectedOption(card)) || selectedPrice(card))}</span><small>per produkt</small>`;
    }
    if (!$('.bookmark-toggle', card)) {
      const bookmark = document.createElement('button');
      bookmark.type = 'button';
      bookmark.className = 'bookmark-toggle';
      bookmark.dataset.productId = product.id;
      bookmark.setAttribute('aria-label', 'Spara produkt');
      bookmark.innerHTML = BOOKMARK_ICON;
      card.appendChild(bookmark);
    }
    $('.bookmark-toggle', card).dataset.productId = product.id;
    const link = $('.product-card-main-link', card);
    if (link) link.href = product.href;
    card.dataset.normalized = 'true';
  }
  function normalizeCards() { $$('.product-card').forEach(normalizeProductCard); syncBookmarkButtons(); }
  function syncBookmarkButtons() {
    $$('.bookmark-toggle[data-product-id]').forEach(button => {
      const active = loggedIn() && isBookmarked(button.dataset.productId);
      button.classList.toggle('active', active);
      button.classList.toggle('requires-login', !loggedIn());
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('title', loggedIn() ? (active ? 'Ta bort sparad produkt' : 'Spara produkt') : 'Logga in för att spara');
    });
  }
  function metaMarkup(meta) {
    return (meta || []).slice(0, 3).map(item => {
      const parts = String(item).split(':');
      if (parts.length > 1) return `<p class="product-card-meta">${escapeHtml(parts.shift().trim())}: <span>${escapeHtml(parts.join(':').trim())}</span></p>`;
      return `<p class="product-card-meta">${escapeHtml(item)}</p>`;
    }).join('');
  }
  function productCardMarkup(product) {
    const item = normalizeProductRecord(product);
    return `<div class="product-card" data-product-id="${escapeHtml(item.id)}" data-href="${escapeHtml(item.href)}"><button class="bookmark-toggle active" data-product-id="${escapeHtml(item.id)}" type="button" aria-label="Spara produkt" aria-pressed="true">${BOOKMARK_ICON}</button><a class="product-card-main-link" href="${escapeHtml(item.href)}" aria-label="Visa ${escapeHtml(item.name)}"><div class="img-placeholder product">Produktbild</div><div class="product-card-body">${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}<p class="product-card-name">${escapeHtml(item.name)}</p>${metaMarkup(item.meta)}</div></a><div class="product-card-actions"><select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(item.price || '')}" data-pack="${escapeHtml(item.pack || '1-pack')}">${escapeHtml(item.pack || '1-pack')} — ${escapeHtml(item.price || '')}</option></select></div><div class="product-card-bottom"><p class="product-card-price"><span class="unit-price">${escapeHtml(item.price || '')}</span><small>per produkt</small></p><button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button></div></div>`;
  }
  function requireMarkup(message, redirect = 'account.html') { return `<div class="account-locked"><span class="account-kicker">Inloggning krävs</span><h2>Logga in för att fortsätta</h2><p>${escapeHtml(message)}</p><div class="account-action-row"><a class="btn btn-primary" href="${redirect}">Logga in eller skapa konto</a><a class="btn btn-outline" href="index.html">Till startsidan</a></div></div>`; }
  function renderBookmarksPage() {
    const list = $('[data-bookmarks-list]') || (document.body.classList.contains('bookmarks-page') ? $('.bookmarks-list') : null);
    if (!list) return;
    if (!loggedIn()) {
      const count = $('[data-bookmark-count]');
      if (count) count.textContent = 'Logga in krävs';
      list.classList.remove('product-grid', 'bookmarks-product-grid');
      list.innerHTML = requireMarkup('Logga in för att se och hantera dina sparade produkter.', 'account.html');
      return;
    }
    const bookmarks = readStore(BOOKMARKS_KEY).map(normalizeProductRecord);
    updateBookmarkCount(bookmarks);
    list.classList.add('product-grid', 'bookmarks-product-grid');
    list.innerHTML = bookmarks.length ? bookmarks.map(productCardMarkup).join('') : '<div class="bookmarks-empty">Du har inga sparade produkter än.</div>';
    normalizeCards();
  }
  function addCartItem(product, quantity = 1) {
    const item = normalizeProductRecord(product);
    const cart = readStore(CART_KEY).map(normalizeProductRecord);
    const existing = cart.find(row => row.id === item.id && row.pack === item.pack && row.price === item.price);
    if (existing) existing.quantity += quantity;
    else cart.unshift({ ...item, quantity });
    writeStore(CART_KEY, cart);
    updateCartPanel();
    renderCartPage();
  }
  function cartTotal(cart) { return cart.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0); }
  function updateCartPanel() {
    const cart = readStore(CART_KEY).map(normalizeProductRecord);
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    $$('.cart-count').forEach(item => item.textContent = count);
    $$('.cart-panel-count').forEach(item => item.textContent = `${count} ${count === 1 ? 'artikel' : 'artiklar'}`);
    $$('.cart-total').forEach(item => item.textContent = `${cartTotal(cart).toLocaleString('sv-SE')} kr`);
    $$('.cart-panel').forEach(panel => {
      let list = $('.cart-panel-items', panel);
      if (!list) {
        list = document.createElement('div');
        list.className = 'cart-panel-items';
        ($('.cart-panel-empty', panel) || panel).insertAdjacentElement('afterend', list);
      }
      $('.cart-panel-empty', panel)?.classList.toggle('is-hidden', cart.length > 0);
      list.innerHTML = cart.slice(0, 4).map(item => `<a href="${escapeHtml(item.href)}" class="cart-panel-item"><span class="cart-panel-item-img"></span><span class="cart-panel-item-main"><span class="cart-panel-item-name">${escapeHtml(item.name)}</span><span class="cart-panel-item-meta">${item.quantity || 1} × ${escapeHtml(item.pack || '1-pack')}</span></span><span class="cart-panel-item-price">${escapeHtml(item.price || '')}</span></a>`).join('');
    });
  }
  function renderCartPage() {
    const page = $('[data-cart-page]');
    if (!page) return;
    const cart = readStore(CART_KEY).map(normalizeProductRecord);
    const qty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const summaryCount = $('[data-cart-summary-count]', page);
    const summaryTotal = $('[data-cart-summary-total]', page);
    if (summaryCount) summaryCount.textContent = `${qty} ${qty === 1 ? 'artikel' : 'artiklar'}`;
    if (summaryTotal) summaryTotal.textContent = `${cartTotal(cart).toLocaleString('sv-SE')} kr`;
    const list = $('[data-cart-items]', page);
    if (!list) return;
    list.innerHTML = cart.length ? cart.map((item, index) => `<article class="cart-page-item"><a href="${escapeHtml(item.href)}" class="cart-page-img">Produktbild</a><div class="cart-page-main">${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}<h3><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a></h3>${metaMarkup(item.meta)}<p class="cart-page-pack">${escapeHtml(item.pack || '1-pack')}</p></div><div class="cart-page-qty"><button type="button" data-cart-action="decrease" data-index="${index}">−</button><span>${item.quantity || 1}</span><button type="button" data-cart-action="increase" data-index="${index}">+</button></div><strong class="cart-page-price">${escapeHtml(item.price || '')}</strong><button class="cart-page-remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Ta bort produkt">×</button></article>`).join('') : '<div class="cart-empty-page">Din kundvagn är tom.</div>';
  }
  function showToast(message) {
    let toast = $('.toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function authButtons(mode) {
    const text = mode === 'register' ? 'Skapa testkonto' : 'Fortsätt som demokund';
    const help = mode === 'register' ? 'Skapar endast en tillfällig prototyp-session. Inga uppgifter sparas.' : 'Loggar in i prototypläge utan riktiga uppgifter.';
    return `<form class="auth-form" data-auth-form="${mode}"><p>${help}</p><button class="btn btn-primary" type="submit">${text}</button></form>`;
  }
  function authPanels() { return `<div class="auth-tabs"><button class="auth-tab active" type="button" data-auth-tab="login">Logga in</button><button class="auth-tab" type="button" data-auth-tab="register">Skapa konto</button></div><div class="auth-panel" data-auth-panel="login">${authButtons('login')}</div><div class="auth-panel is-hidden" data-auth-panel="register">${authButtons('register')}</div>`; }
  function createAuthModal() {
    let modal = $('.auth-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `<div class="auth-modal-backdrop" data-auth-close></div><section class="auth-dialog" role="dialog" aria-modal="true"><button class="auth-close" type="button" data-auth-close aria-label="Stäng">×</button><span class="account-kicker">Mina sidor</span><h2>Logga in för att fortsätta</h2><p data-auth-message>Du behöver vara inloggad för att använda den här funktionen.</p>${authPanels()}</section>`;
    document.body.appendChild(modal);
    bindAuth(modal);
    return modal;
  }
  function openAuth(message, action) { pendingLoginAction = action || null; const modal = createAuthModal(); $('[data-auth-message]', modal).textContent = message || 'Logga in eller skapa ett konto för att fortsätta.'; modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('auth-modal-open'); }
  function closeAuth() { $('.auth-modal')?.classList.remove('open'); document.body.classList.remove('auth-modal-open'); }
  function requireLogin(message, action) { if (loggedIn()) { action?.(); return true; } openAuth(message, action); return false; }
  function bindAuth(root = document) {
    $$('[data-auth-form]', root).forEach(form => {
      if (form.dataset.bound) return;
      form.dataset.bound = 'true';
      form.addEventListener('submit', event => {
        event.preventDefault();
        setLoggedIn(true);
        closeAuth();
        const action = pendingLoginAction;
        pendingLoginAction = null;
        if (action) action();
        else {
          const redirect = new URLSearchParams(location.search).get('redirect');
          if (redirect) location.href = redirect;
        }
        showToast('Du är inloggad');
        renderLoginPage(); renderAccountPage(); renderBookmarksPage(); renderOrderPage();
      });
    });
    $$('[data-auth-tab]', root).forEach(tab => {
      if (tab.dataset.bound) return;
      tab.dataset.bound = 'true';
      tab.addEventListener('click', () => {
        const wrap = tab.closest('.auth-modal, .auth-page-card');
        $$('[data-auth-tab]', wrap).forEach(item => item.classList.toggle('active', item === tab));
        $$('[data-auth-panel]', wrap).forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.authPanel !== tab.dataset.authTab));
      });
    });
    $$('[data-auth-close]', root).forEach(button => button.addEventListener('click', closeAuth));
  }
  function syncAccountState() {
    const active = loggedIn();
    document.body.classList.toggle('is-logged-in', active);
    document.body.classList.toggle('is-logged-out', !active);
    $$('a[href="login.html"], a[href="customer.html"], a[href="account.html"]').forEach(link => {
      link.href = 'account.html';
      link.title = active ? 'Mina sidor' : 'Logga in';
      link.setAttribute('aria-label', active ? 'Mina sidor' : 'Logga in');
    });
    syncBookmarkButtons();
  }
  function renderLoginPage() {
    const page = $('[data-login-page]');
    if (!page) return;
    page.innerHTML = loggedIn()
      ? `<div class="auth-page-card"><span class="account-kicker">Du är inloggad</span><h1>Välkommen tillbaka</h1><p>Du kan nu spara produkter och gå till Mina sidor.</p><div class="account-action-row"><a class="btn btn-primary" href="account.html">Till Mina sidor</a><button class="btn btn-outline" type="button" data-logout>Logga ut</button></div></div>`
      : `<div class="auth-page-card"><span class="account-kicker">Mina sidor</span><h1>Logga in eller skapa konto</h1><p>Det här är en prototyp. Du kan fortsätta utan riktiga uppgifter för att testa sparade produkter och Mina sidor.</p>${authPanels()}</div>`;
    bindAuth(page); bindLogout(page);
  }
  function orderItemsText(order) { return Array.isArray(order.items) ? order.items.join(', ') : order.items; }
  function orderMarkup(order, compact = false) { return `<article class="order-card"><div><span class="order-id">${escapeHtml(order.id)}</span><h3>${escapeHtml(order.status)}</h3><p>${escapeHtml(orderItemsText(order))}</p><small>${escapeHtml(order.date)} · ${escapeHtml(order.total)}</small></div><div class="order-actions"><a class="btn btn-outline btn-small" href="order.html?id=${encodeURIComponent(order.id)}">Visa order</a>${order.current ? '<a class="btn btn-outline btn-small" href="order.html?id=' + encodeURIComponent(order.id) + '">Spåra</a>' : compact ? '' : '<a class="btn btn-outline btn-small" href="order.html?id=' + encodeURIComponent(order.id) + '">Hantera retur</a>'}</div></article>`; }
  function renderAccountPage() {
    const page = $('[data-account-page]');
    if (!page) return;
    if (!loggedIn()) { page.innerHTML = requireMarkup('Mina sidor visas först när du är inloggad.', 'account.html'); return; }
    const bookmarks = readStore(BOOKMARKS_KEY).map(normalizeProductRecord);
    const cartQty = readStore(CART_KEY).reduce((sum, item) => sum + (item.quantity || 1), 0);
    const currentOrders = orders.filter(order => order.current);
    const pastOrders = orders.filter(order => !order.current);
    page.innerHTML = `<div class="account-layout"><aside class="account-sidebar"><span class="account-kicker">Mina sidor</span><h2>Hej!</h2><p>Du är inloggad i prototypläge.</p><button class="account-tab active" type="button" data-account-tab="overview">Översikt</button><button class="account-tab" type="button" data-account-tab="orders">Orderhistorik</button><button class="account-tab" type="button" data-account-tab="saved">Sparade produkter</button><button class="account-tab" type="button" data-account-tab="settings">Inställningar</button><button class="btn btn-outline account-logout" type="button" data-logout>Logga ut</button></aside><section class="account-main"><div class="account-panel" data-account-panel="overview"><h1>Översikt</h1><div class="account-stat-grid"><div class="account-stat"><span>Sparade produkter</span><strong>${bookmarks.length}</strong></div><div class="account-stat"><span>Produkter i kundvagn</span><strong>${cartQty}</strong></div><div class="account-stat"><span>Aktuell order</span><strong>${currentOrders[0]?.id || '—'}</strong></div></div><div class="account-section"><h2>Aktuella beställningar</h2>${currentOrders.map(order => orderMarkup(order, true)).join('') || '<p>Du har inga aktuella beställningar.</p>'}</div><div class="account-section"><h2>Senaste tidigare order</h2>${pastOrders.slice(0, 2).map(order => orderMarkup(order, true)).join('')}</div></div><div class="account-panel is-hidden" data-account-panel="orders"><h1>Beställningar</h1><div class="account-section"><h2>Aktuella order</h2>${currentOrders.map(order => orderMarkup(order)).join('') || '<p>Inga aktuella order.</p>'}</div><div class="account-section"><h2>Tidigare order</h2>${pastOrders.map(orderMarkup).join('')}</div></div><div class="account-panel is-hidden" data-account-panel="saved"><h1>Sparade produkter</h1><div class="account-saved-grid">${bookmarks.length ? bookmarks.map(productCardMarkup).join('') : '<div class="bookmarks-empty">Du har inga sparade produkter än.</div>'}</div></div><div class="account-panel is-hidden" data-account-panel="settings"><h1>Inställningar</h1><div class="settings-grid"><div class="settings-card"><h2>Personuppgifter</h2><p>Här kan kunden senare uppdatera namn, e-post och adress.</p><button class="btn btn-primary" type="button" data-demo-action="settings">Spara ändringar</button></div><div class="settings-card danger-zone"><h2>Radera konto</h2><p>Visuell prototyp för kontoradering.</p><button class="btn btn-outline" type="button" data-demo-action="delete">Radera konto</button></div></div></div></section></div>`;
    bindAccountTabs(page); bindLogout(page); normalizeCards();
  }
  function renderOrderPage() {
    const page = $('[data-order-page]');
    if (!page) return;
    if (!loggedIn()) { page.innerHTML = requireMarkup('Logga in för att visa orderdetaljer.', 'account.html'); return; }
    const id = new URLSearchParams(location.search).get('id') || orders[0].id;
    const order = orders.find(item => item.id === id) || orders[0];
    page.innerHTML = `<div class="order-detail-layout"><section><article class="order-detail-card"><span class="order-status-pill">${escapeHtml(order.status)}</span><h1>Order ${escapeHtml(order.id)}</h1><p>${escapeHtml(order.eta)}</p><div class="order-detail-actions">${order.current ? '<button class="btn btn-primary" type="button" data-demo-action="track">Spåra order</button>' : '<button class="btn btn-primary" type="button" data-demo-action="return">Hantera retur</button><button class="btn btn-outline" type="button" data-demo-action="reorder">Beställ igen</button>'}<a class="btn btn-outline" href="account.html">Till Mina sidor</a></div></article><section class="order-timeline"><h2>${order.current ? 'Spårning' : 'Orderstatus'}</h2><ol><li>Order mottagen</li><li>Order behandlad</li><li>${order.current ? 'På väg till kund' : 'Levererad'}</li>${order.current ? '<li>Väntar på leverans</li>' : '<li>Retur/reklamation kan startas från denna vy</li>'}</ol></section><section class="order-items-panel"><h2>Produkter</h2>${order.items.map(item => `<div class="order-item-row"><span>${escapeHtml(item)}</span><strong>${escapeHtml(order.total)}</strong></div>`).join('')}</section></section><aside class="order-summary-panel"><h2>Sammanfattning</h2><p><strong>Datum:</strong> ${escapeHtml(order.date)}</p><p><strong>Totalt:</strong> ${escapeHtml(order.total)}</p><p><strong>Spårningsnr:</strong> ${escapeHtml(order.tracking)}</p></aside></div>`;
  }
  function bindAccountTabs(root) { $$('[data-account-tab]', root).forEach(tab => tab.addEventListener('click', () => { $$('[data-account-tab]', root).forEach(item => item.classList.toggle('active', item === tab)); $$('[data-account-panel]', root).forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.accountPanel !== tab.dataset.accountTab)); })); }
  function bindLogout(root = document) { $$('[data-logout]', root).forEach(button => { if (button.dataset.bound) return; button.dataset.bound = 'true'; button.addEventListener('click', () => { setLoggedIn(false); showToast('Du är utloggad'); renderLoginPage(); renderAccountPage(); renderBookmarksPage(); renderOrderPage(); }); }); }
  function insertAfter(reference, node) { reference?.parentNode?.insertBefore(node, reference.nextSibling); }
  function initNavigation() { $$('a[href="#"]').forEach(link => { if (link.textContent.trim().toLowerCase() === 'kontakt') link.href = 'contact.html'; }); $$('a[href="portion.html#gor-eget"], a[href="index.html#gor-eget"], a[href$="#gor-eget"]').forEach(link => link.href = 'gor-eget.html'); }
  function initVittShowcase() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file !== 'index.html' || $('.vitt-showcase-section')) return;
    const feature = $('.feature-strip-fullbleed');
    if (!feature) return;
    const section = document.createElement('section');
    section.className = 'vitt-showcase-section';
    section.innerHTML = '<div class="vitt-showcase-shell"><div class="vitt-showcase-copy"><span class="vitt-showcase-kicker">Ny produktgrupp</span><h2>Vitt snus</h2><p>En egen yta för kommande tobaksfria produkter.</p><div class="vitt-tag-row"><span>Normal</span><span>Slim</span><span>Mini</span><span>Compact</span><span>Large</span></div><div class="btn-row"><a class="btn btn-primary" href="vitt-snus.html">Se vitt snus</a></div></div><div class="vitt-showcase-track-wrap"><div class="vitt-showcase-track"></div></div></div>';
    insertAfter(feature, section);
  }
  function initFilters() { $$('.filter-bar').forEach(bar => bar.addEventListener('click', event => { const chip = event.target.closest('.filter-chip'); if (!chip) return; $$('.filter-chip', bar).forEach(item => item.classList.remove('active')); chip.classList.add('active'); })); }
  function initCarousels() {
    $$('.carousel-header').forEach(header => { if ($('.section-heading', header)?.textContent.trim().toLowerCase() === 'nyheter') $('.see-all', header)?.remove(); });
    $$('.carousel-wrapper').forEach(wrapper => {
      const track = $('.carousel-track', wrapper), outer = $('.carousel-track-outer', wrapper);
      if (!track || !outer) return;
      const prev = $('.carousel-btn-prev', wrapper), next = $('.carousel-btn-next', wrapper);
      let index = 0, startX = 0, startY = 0, moved = false;
      function visible() { const w = outer.offsetWidth; return w < 720 ? 2.28 : w < 920 ? 4 : 6; }
      function gap() { return innerWidth <= 720 ? 10 : 12; }
      function width() { return (outer.offsetWidth - gap() * (visible() - 1)) / visible(); }
      function max() { return Math.max(0, Math.ceil($$('.product-card', track).length - visible())); }
      function go(value) { index = Math.max(0, Math.min(value, max())); track.style.transition = 'transform .24s ease'; track.style.transform = `translateX(-${index * (width() + gap())}px)`; if (prev) prev.disabled = index === 0; if (next) next.disabled = index >= max(); }
      function size() { const w = width(); track.style.gap = `${gap()}px`; $$('.product-card', track).forEach(card => { card.style.flex = `0 0 ${w}px`; card.style.width = `${w}px`; }); go(index); }
      if (wrapper.dataset.mainCarouselBound !== 'true') {
        prev?.addEventListener('click', () => go(index - 1)); next?.addEventListener('click', () => go(index + 1));
        outer.addEventListener('touchstart', event => { if (!event.touches.length) return; startX = event.touches[0].clientX; startY = event.touches[0].clientY; moved = false; }, { passive: true });
        outer.addEventListener('touchmove', event => { if (!event.touches.length) return; const dx = event.touches[0].clientX - startX; const dy = event.touches[0].clientY - startY; if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) moved = true; }, { passive: true });
        outer.addEventListener('touchend', event => { if (!moved) return; const dx = event.changedTouches[0].clientX - startX; if (Math.abs(dx) > 38) go(index + (dx < 0 ? 1 : -1)); });
        addEventListener('resize', size);
        wrapper.dataset.mainCarouselBound = 'true';
      }
      size();
    });
  }
  function initProductPage() {
    const qty = $('.qty-display');
    $('.qty-minus')?.addEventListener('click', () => { if (qty) qty.value = Math.max(1, parseInt(qty.value || '1', 10) - 1); });
    $('.qty-plus')?.addEventListener('click', () => { if (qty) qty.value = parseInt(qty.value || '1', 10) + 1; });
    $$('.pack-option').forEach(option => option.addEventListener('click', () => { $$('.pack-option').forEach(item => item.classList.remove('selected')); option.classList.add('selected'); const radio = $('input[type=radio]', option); if (radio) radio.checked = true; const price = $('.product-detail-price'); if (price && option.dataset.price) price.innerHTML = `${option.dataset.price} <small>${option.dataset.pack || '1-pack'}</small>`; }));
    $('.add-to-cart-main .btn-primary')?.addEventListener('click', event => { event.preventDefault(); addCartItem(productFromPage(), parseInt(qty?.value || '1', 10) || 1); showToast('Tillagd i kundvagnen'); });
  }
  function bindSupportForm() { $$('[data-support-form]').forEach(form => { if (form.dataset.bound) return; form.dataset.bound = 'true'; form.addEventListener('submit', event => { event.preventDefault(); showToast('Kundserviceärende markerat i prototypen'); form.reset(); }); }); }
  function handleClicks() {
    document.addEventListener('change', event => { const select = event.target.closest('.pack-select'); if (select) { const card = select.closest('.product-card'); if (card) { delete card.dataset.normalized; normalizeProductCard(card); } } });
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href="bookmarks.html"], a[href="account.html"], a[href="customer.html"], a[href="login.html"], a[href="order.html"]');
      if (link && link.getAttribute('href') === 'bookmarks.html' && !loggedIn()) { event.preventDefault(); requireLogin('Logga in för att se dina sparade produkter.', () => { location.href = 'bookmarks.html'; }); return; }
      if (link && ['account.html', 'customer.html', 'login.html'].includes(link.getAttribute('href')) && !loggedIn()) { event.preventDefault(); requireLogin('Logga in eller skapa ett konto för att gå till Mina sidor.', () => { location.href = 'account.html'; }); return; }
      if (link && link.getAttribute('href') === 'order.html' && !loggedIn()) { event.preventDefault(); requireLogin('Logga in för att visa orderdetaljer.', () => { location.href = 'order.html'; }); return; }
      const bookmark = event.target.closest('.bookmark-toggle');
      if (bookmark) { event.preventDefault(); event.stopPropagation(); const card = bookmark.closest('.product-card'); const product = card ? productFromCard(card) : productFromPage(); requireLogin('Logga in eller skapa ett konto för att spara produkter.', () => { const shouldSave = !isBookmarked(product.id); saveBookmark(product, shouldSave); showToast(shouldSave ? 'Sparad produkt' : 'Borttagen från sparade produkter'); }); return; }
      const add = event.target.closest('.add-to-cart-btn');
      if (add) { event.preventDefault(); event.stopPropagation(); const card = add.closest('.product-card'); if (card) addCartItem(productFromCard(card)); add.classList.add('added'); setTimeout(() => add.classList.remove('added'), 900); showToast('Tillagd i kundvagnen'); return; }
      const action = event.target.closest('[data-cart-action]');
      if (action) { event.preventDefault(); const index = parseInt(action.dataset.index, 10); const cart = readStore(CART_KEY).map(normalizeProductRecord); if (!cart[index]) return; if (action.dataset.cartAction === 'increase') cart[index].quantity = (cart[index].quantity || 1) + 1; if (action.dataset.cartAction === 'decrease') cart[index].quantity = Math.max(1, (cart[index].quantity || 1) - 1); if (action.dataset.cartAction === 'remove') cart.splice(index, 1); writeStore(CART_KEY, cart); updateCartPanel(); renderCartPage(); return; }
      if (event.target.closest('[data-demo-action]')) { event.preventDefault(); showToast('Funktionen är markerad i prototypen'); return; }
      const card = event.target.closest('.product-card');
      if (card && !event.target.closest('a, button, input, select, textarea, label, .pack-select')) location.href = productFromCard(card).href;
    });
  }
  function refreshProductLinks() { migrateProductStores(); renderBookmarksPage(); updateCartPanel(); renderCartPage(); normalizeCards(); }
  function init() { syncAccountState(); initNavigation(); initVittShowcase(); initFilters(); initCarousels(); renderLoginPage(); renderAccountPage(); renderOrderPage(); renderBookmarksPage(); normalizeCards(); initProductPage(); updateCartPanel(); renderCartPage(); bindAuth(); bindLogout(); bindSupportForm(); handleClicks(); document.addEventListener('swedsnus:products-rendered', refreshProductLinks); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
