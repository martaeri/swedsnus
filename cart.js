(() => {
  if (window.SwedsnusCart) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before cart.js');

  const { $, $$, keys, readStore, writeStore, escapeHtml, parsePrice, slugify } = Core;

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

  function selectedOption(root) {
    return $('.pack-select option:checked', root);
  }

  function selectedPack(root) {
    const option = selectedOption(root);
    return option?.dataset.pack || option?.textContent?.split('—')[0]?.trim() || $('.pack-option.selected', root)?.dataset.pack || '1-pack';
  }

  function selectedPrice(root) {
    const option = selectedOption(root);
    if (option?.dataset.price) return option.dataset.price;
    const pack = $('.pack-option.selected', root);
    if (pack?.dataset.price) return pack.dataset.price;
    const price = $('.product-card-price', root) || $('.product-detail-price');
    return (price?.childNodes?.[0]?.textContent || price?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function productFromCard(card) {
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

  function productFromPage() {
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

  function toast(message) {
    let element = $('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(element._timer);
    element._timer = setTimeout(() => element.classList.remove('show'), 2200);
  }

  function bindInteractions() {
    document.addEventListener('click', event => {
      const action = event.target.closest('[data-cart-action]');
      const cardButton = event.target.closest('.add-to-cart-btn');
      const pageButton = event.target.closest('.add-to-cart-main .btn-primary');
      if (!action && !cardButton && !pageButton) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (action) {
        handleAction(action);
        return;
      }

      if (cardButton) {
        const card = cardButton.closest('.product-card');
        if (card) add(productFromCard(card));
        cardButton.classList.add('added');
        setTimeout(() => cardButton.classList.remove('added'), 900);
      } else {
        const quantity = parseInt($('.qty-display')?.value || '1', 10) || 1;
        add(productFromPage(), quantity);
      }
      toast('Tillagd i kundvagnen');
    }, true);
  }

  function init() {
    refresh();
    bindInteractions();
    window.addEventListener('storage', event => {
      if (event.key === keys.cart) refresh();
    });
    document.addEventListener('swedsnus:products-rendered', refresh);
  }

  window.SwedsnusCart = { add, handleAction, items, total, updatePanel, renderPage, refresh, init };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();