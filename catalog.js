(() => {
  if (window.__swedsnusCatalogLoaded) return;
  window.__swedsnusCatalogLoaded = true;

  const MODAL_Z = '2147483647';
  const OVERLAY_Z = '2147483646';
  const $ = (selector, root = document) => root?.querySelector(selector) || null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

  function loadScript(src) {
    const existing = $(`script[src="${src}"]`);
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Kunde inte ladda ${src}`));
      document.body.appendChild(script);
    });
  }

  function ensureStyle() {
    if ($('#catalog-control-guard')) return;
    const style = document.createElement('style');
    style.id = 'catalog-control-guard';
    style.textContent = `
      .filter-sidebar.mobile-filter-open,
      body > .filter-sidebar.mobile-filter-open {
        position: fixed !important;
        z-index: 2147483647 !important;
        isolation: isolate !important;
        pointer-events: auto !important;
        opacity: 1 !important;
        visibility: visible !important;
        mix-blend-mode: normal !important;
      }
      .filter-sidebar.mobile-filter-open *,
      body > .filter-sidebar.mobile-filter-open * { pointer-events: auto !important; }
      .catalog-filter-overlay.show {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483646 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function setImportant(element, styles) {
    Object.entries(styles).forEach(([property, value]) => element.style.setProperty(property, value, 'important'));
  }

  function priceOf(card) {
    const text = $('.product-card-price', card)?.textContent || '';
    return parseInt(text.replace(/\s/g, '').match(/[0-9]+/)?.[0] || '0', 10);
  }

  function sortGrid(grid, mode) {
    const cards = $$('.product-card', grid);
    cards.forEach((card, index) => {
      if (card.dataset.originalIndex === undefined) card.dataset.originalIndex = String(index);
    });
    cards.sort((a, b) => {
      const an = $('.product-card-name', a)?.textContent?.trim() || '';
      const bn = $('.product-card-name', b)?.textContent?.trim() || '';
      if (mode === 'price-asc') return priceOf(a) - priceOf(b);
      if (mode === 'price-desc') return priceOf(b) - priceOf(a);
      if (mode === 'alpha') return an.localeCompare(bn, 'sv');
      if (mode === 'alpha-desc') return bn.localeCompare(an, 'sv');
      if (mode === 'newest') return Number(b.dataset.originalIndex) - Number(a.dataset.originalIndex);
      return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    }).forEach(card => grid.appendChild(card));
  }

  function bindSortControls() {
    $$('.catalog-sort-select').forEach(select => {
      if (select.dataset.catalogSortBound === 'true') return;
      select.dataset.catalogSortBound = 'true';
      select.addEventListener('change', () => {
        const grid = $('.product-grid', select.closest('.catalog-page[data-catalog-filter]'));
        if (grid) sortGrid(grid, select.value);
      });
    });
  }

  function forceStacking() {
    $$('.catalog-filter-overlay.show').forEach(overlay => setImportant(overlay, {
      position: 'fixed',
      inset: '0',
      'z-index': OVERLAY_Z,
      'pointer-events': 'none'
    }));
    $$('.filter-sidebar.mobile-filter-open').forEach(sidebar => {
      if (sidebar.parentNode !== document.body) document.body.appendChild(sidebar);
      setImportant(sidebar, {
        position: 'fixed',
        'z-index': MODAL_Z,
        'pointer-events': 'auto',
        opacity: '1',
        visibility: 'visible',
        isolation: 'isolate'
      });
    });
  }

  function bindOutsideClose() {
    document.addEventListener('click', event => {
      if (!document.body.classList.contains('catalog-filter-open')) return;
      const sidebar = $('.filter-sidebar.mobile-filter-open');
      if (!sidebar || sidebar.contains(event.target) || event.target.closest('.catalog-filter-toggle')) return;
      event.preventDefault();
      event.stopPropagation();
      $('.catalog-filter-close', sidebar)?.click();
    }, true);
  }

  async function init() {
    ensureStyle();
    await loadScript('catalog-filters.js');
    bindSortControls();
    bindOutsideClose();
    new MutationObserver(() => {
      bindSortControls();
      if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('touchstart', () => {
      if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
    }, { passive: true, capture: true });
    document.addEventListener('swedsnus:products-rendered', () => setTimeout(bindSortControls, 0));
  }

  init().catch(error => console.error('[Swedsnus catalog]', error));
})();
