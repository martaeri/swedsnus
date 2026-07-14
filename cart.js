(() => {
  if (window.SwedsnusCart) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before cart.js');

  const { $, $$, keys, readStore, writeStore, escapeHtml, parsePrice } = Core;

  function normalizeProduct(product = {}) {
    const href = window.SwedsnusProducts?.normalizeProductHref?.(product) || product.href || 'portion.html';
    return { ...product, href };
  }

  function items() {
    return readStore(keys.cart).map(normalizeProduct);
  }

  function total(cart = items()) {
    return cart.reduce((sum, item) => sum + parsePrice(item.price) * (item.quantity || 1), 0);
  }

  function metaMarkup(meta) {
    return (meta || []).slice(0, 3).map(item => {
      const parts = String(item).split(':');
      if (parts.length > 1) return `<p class="product-card-meta">${escapeHtml(parts.shift().trim())}: <span>${escapeHtml(parts.join(':').trim())}</span></p>`;
      return `<p class="product-card-meta">${escapeHtml(item)}</p>`;
    }).join('');
  }

  function updatePanel() {
    const cart = items();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    $$('.cart-count').forEach(item => { item.textContent = count; });
    $$('.cart-panel-count').forEach(item => { item.textContent = `${count} ${count === 1 ? 'artikel' : 'artiklar'}`; });
    $$('.cart-total').forEach(item => { item.textContent = `${total(cart).toLocaleString('sv-SE')} kr`; });
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

  function renderPage() {
    const page = $('[data-cart-page]');
    if (!page) return;
    const cart = items();
    const quantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const summaryCount = $('[data-cart-summary-count]', page);
    const summaryTotal = $('[data-cart-summary-total]', page);
    if (summaryCount) summaryCount.textContent = `${quantity} ${quantity === 1 ? 'artikel' : 'artiklar'}`;
    if (summaryTotal) summaryTotal.textContent = `${total(cart).toLocaleString('sv-SE')} kr`;
    const list = $('[data-cart-items]', page);
    if (!list) return;
    list.innerHTML = cart.length ? cart.map((item, index) => `<article class="cart-page-item"><a href="${escapeHtml(item.href)}" class="cart-page-img">Produktbild</a><div class="cart-page-main">${item.badge ? `<span class="product-card-badge">${escapeHtml(item.badge)}</span>` : ''}<h3><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a></h3>${metaMarkup(item.meta)}<p class="cart-page-pack">${escapeHtml(item.pack || '1-pack')}</p></div><div class="cart-page-qty"><button type="button" data-cart-action="decrease" data-index="${index}">−</button><span>${item.quantity || 1}</span><button type="button" data-cart-action="increase" data-index="${index}">+</button></div><strong class="cart-page-price">${escapeHtml(item.price || '')}</strong><button class="cart-page-remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Ta bort produkt">×</button></article>`).join('') : '<div class="cart-empty-page">Din kundvagn är tom.</div>';
  }

  function refresh() {
    updatePanel();
    renderPage();
    window.SwedsnusLayout?.syncCounters?.();
    document.dispatchEvent(new CustomEvent('swedsnus:cart-changed', { detail: { items: items() } }));
  }

  function add(product, quantity = 1) {
    const item = normalizeProduct(product);
    const cart = items();
    const existing = cart.find(row => row.id === item.id && row.pack === item.pack && row.price === item.price);
    if (existing) existing.quantity = (existing.quantity || 1) + quantity;
    else cart.unshift({ ...item, quantity });
    writeStore(keys.cart, cart);
    refresh();
  }

  function handleAction(action) {
    const index = parseInt(action?.dataset.index, 10);
    const cart = items();
    if (!cart[index]) return false;
    if (action.dataset.cartAction === 'increase') cart[index].quantity = (cart[index].quantity || 1) + 1;
    if (action.dataset.cartAction === 'decrease') cart[index].quantity = Math.max(1, (cart[index].quantity || 1) - 1);
    if (action.dataset.cartAction === 'remove') cart.splice(index, 1);
    writeStore(keys.cart, cart);
    refresh();
    return true;
  }

  function init() {
    refresh();
    window.addEventListener('storage', event => {
      if (event.key === keys.cart) refresh();
    });
  }

  window.SwedsnusCart = { add, handleAction, items, total, updatePanel, renderPage, refresh, init };
})();
