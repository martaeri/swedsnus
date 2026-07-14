(() => {
  if (window.SwedsnusBookmarks) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before bookmarks.js');

  const { $, $$, keys, readStore, writeStore, loggedIn, escapeHtml, slugify } = Core;
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

  function normalizeProduct(product = {}) {
    const href = window.SwedsnusProducts?.normalizeProductHref?.(product) || product.href || 'portion.html';
    return { ...product, href };
  }

  function items() {
    return readStore(keys.bookmarks).map(normalizeProduct);
  }

  function has(id) {
    return items().some(item => item.id === id);
  }

  function selectedOption(card) {
    return card?.querySelector?.('.pack-select option:checked') || null;
  }

  function selectedPack(card) {
    const option = selectedOption(card);
    return option?.dataset.pack || option?.textContent?.split('—')[0]?.trim() || $('.pack-option.selected')?.dataset.pack || '1-pack';
  }

  function selectedPrice(card) {
    const option = selectedOption(card);
    if (option?.dataset.price) return option.dataset.price;
    const pack = $('.pack-option.selected');
    if (pack?.dataset.price) return pack.dataset.price;
    const price = card?.querySelector?.('.product-card-price') || $('.product-detail-price');
    return (price?.childNodes?.[0]?.textContent || price?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function fromCard(card) {
    const name = $('.product-card-name', card)?.textContent?.trim() || 'Produkt';
    return normalizeProduct({
      id: card.dataset.productId || slugify(name),
      name,
      badge: $('.product-card-badge', card)?.textContent?.trim() || '',
      meta: $$('.product-card-meta', card).map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean),
      price: selectedPrice(card),
      pack: selectedPack(card),
      href: card.dataset.href || $('.product-card-main-link', card)?.getAttribute('href')
    });
  }

  function fromPage() {
    const detail = $('.product-detail');
    const name = $('.product-detail h1')?.textContent?.trim() || document.title.split('—')[0].trim() || 'Produkt';
    return normalizeProduct({
      id: detail?.dataset.productId || new URLSearchParams(location.search).get('id') || slugify(name),
      name,
      badge: $('.product-card-badge')?.textContent?.trim() || '',
      meta: $$('.product-detail-meta-row').map(row => `${$('dt', row)?.textContent?.trim() || ''}: ${$('dd', row)?.textContent?.replace(/\s+/g, ' ')?.trim() || ''}`).filter(item => item.length > 2).slice(0, 3),
      price: selectedPrice(document),
      pack: selectedPack(document)
    });
  }

  function metaMarkup(meta) {
    return (meta || []).slice(0, 3).map(item => {
      const parts = String(item).split(':');
      if (parts.length > 1) return `<p class="product-card-meta">${escapeHtml(parts.shift().trim())}: <span>${escapeHtml(parts.join(':').trim())}</span></p>`;
      return `<p class="product-card-meta">${escapeHtml(item)}</p>`;
    }).join('');
  }

  function cardMarkup(product) {
    const item = normalizeProduct(product);
    return `<div class="product-card" data-normalized="true" data-product-id="${escapeHtml(item.id)}" data-href="${escapeHtml(item.href)}"><button class="bookmark-toggle active" data-product-id="${escapeHtml(item.id)}" type="button" aria-label="Ta bort sparad produkt" aria-pressed="true">${BOOKMARK_ICON}</button><a class="product-card-main-link" href="${escapeHtml(item.href)}" aria-label="Visa ${escapeHtml(item.name)}"><div class="img-placeholder product">Produktbild</div><div class="product-card-body">${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}<p class="product-card-name">${escapeHtml(item.name)}</p>${metaMarkup(item.meta)}</div></a><div class="product-card-actions"><select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(item.price || '')}" data-pack="${escapeHtml(item.pack || '1-pack')}">${escapeHtml(item.pack || '1-pack')} — ${escapeHtml(item.price || '')}</option></select></div><div class="product-card-bottom"><p class="product-card-price"><span class="unit-price">${escapeHtml(item.price || '')}</span><small>per produkt</small></p><button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button></div></div>`;
  }

  function updateCount(bookmarks = items()) {
    const count = $('[data-bookmark-count]');
    if (count) count.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'produkt' : 'produkter'}`;
  }

  function syncButtons() {
    const saved = new Set(items().map(item => item.id));
    $$('.bookmark-toggle[data-product-id]').forEach(button => {
      const active = loggedIn() && saved.has(button.dataset.productId);
      button.classList.toggle('active', active);
      button.classList.toggle('requires-login', !loggedIn());
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('aria-label', loggedIn() ? (active ? 'Ta bort sparad produkt' : 'Spara produkt') : 'Logga in för att spara');
      button.title = button.getAttribute('aria-label');
    });
  }

  function renderPage() {
    const list = $('[data-bookmarks-list]') || (document.body.classList.contains('bookmarks-page') ? $('.bookmarks-list') : null);
    if (!list || !loggedIn()) return;
    const bookmarks = items();
    updateCount(bookmarks);
    list.classList.add('product-grid', 'bookmarks-product-grid');
    list.innerHTML = bookmarks.length ? bookmarks.map(cardMarkup).join('') : '<div class="bookmarks-empty">Du har inga sparade produkter än.</div>';
    document.dispatchEvent(new CustomEvent('swedsnus:bookmarks-rendered'));
  }

  function save(product, shouldSave) {
    const item = normalizeProduct(product);
    const bookmarks = items().filter(saved => saved.id !== item.id);
    if (shouldSave) bookmarks.unshift(item);
    writeStore(keys.bookmarks, bookmarks);
    updateCount(bookmarks);
    if (!document.body.classList.contains('bookmarks-page') || shouldSave) renderPage();
    syncButtons();
    window.SwedsnusLayout?.syncCounters?.();
    document.dispatchEvent(new CustomEvent('swedsnus:bookmarks-changed', { detail: { items: bookmarks } }));
  }

  function showToast(message) {
    let toast = $('.toast');
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

  function handleClick(event) {
    const button = event.target.closest('.bookmark-toggle');
    if (!button || !loggedIn()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const card = button.closest('.product-card');
    const product = card ? fromCard(card) : fromPage();
    const shouldSave = !has(product.id);
    save(product, shouldSave);
    showToast(shouldSave ? 'Sparad produkt' : 'Borttagen från sparade produkter');
  }

  function init() {
    renderPage();
    syncButtons();
    document.addEventListener('click', handleClick, true);
    document.addEventListener('swedsnus:products-rendered', () => requestAnimationFrame(syncButtons));
    document.addEventListener('swedsnus:auth-changed', () => {
      renderPage();
      syncButtons();
    });
    window.addEventListener('storage', event => {
      if (event.key === keys.bookmarks) {
        renderPage();
        syncButtons();
      }
    });
  }

  window.SwedsnusBookmarks = { cardMarkup, items, has, save, renderPage, syncButtons, init };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();