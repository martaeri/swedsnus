(() => {
  if (window.SwedsnusProductRecords) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before product-records.js');

  const { $, $$, escapeHtml, slugify } = Core;

  function normalize(product = {}) {
    const href = window.SwedsnusProducts?.normalizeProductHref?.(product) || product.href || 'portion.html';
    return { ...product, href };
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
    const price = $('.product-card-price', root) || $('.product-detail-price', root) || $('.product-detail-price');
    return (price?.childNodes?.[0]?.textContent || price?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function metaFromCard(card) {
    return $$('.product-card-meta', card).map(item => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  function metaFromPage() {
    return $$('.product-detail-meta-row').map(row => `${$('dt', row)?.textContent?.trim() || ''}: ${$('dd', row)?.textContent?.replace(/\s+/g, ' ')?.trim() || ''}`).filter(item => item.length > 2).slice(0, 3);
  }

  function fromCard(card) {
    const name = $('.product-card-name', card)?.textContent?.trim() || 'Produkt';
    return normalize({
      id: card?.dataset.productId || slugify(name),
      name,
      badge: $('.product-card-badge', card)?.textContent?.trim() || '',
      meta: metaFromCard(card),
      price: selectedPrice(card),
      pack: selectedPack(card),
      href: card?.dataset.href || $('.product-card-main-link', card)?.getAttribute('href')
    });
  }

  function fromPage() {
    const detail = $('.product-detail');
    const name = $('.product-detail h1')?.textContent?.trim() || document.title.split('—')[0].trim() || 'Produkt';
    return normalize({
      id: detail?.dataset.productId || new URLSearchParams(location.search).get('id') || slugify(name),
      name,
      badge: $('.product-card-badge')?.textContent?.trim() || '',
      meta: metaFromPage(),
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

  window.SwedsnusProductRecords = { fromCard, fromPage, metaMarkup, normalize, selectedOption, selectedPack, selectedPrice };
})();