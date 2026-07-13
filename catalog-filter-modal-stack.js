(() => {
  if (window.__swedsnusCatalogControlGuard) return;
  window.__swedsnusCatalogControlGuard = true;

  const MODAL_Z = '2147483647';
  const OVERLAY_Z = '2147483646';
  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

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

  function parsePrice(card) {
    const text = $('.product-card-price', card)?.textContent || '';
    return parseInt(text.replace(/\s/g, '').match(/[0-9]+/)?.[0] || '0', 10);
  }

  function sortGrid(grid, mode) {
    const cards = $$('.product-card', grid);
    cards.forEach((card, index) => {
      if (!card.dataset.originalIndex) card.dataset.originalIndex = index;
    });
    cards.sort((a, b) => {
      const an = $('.product-card-name', a)?.textContent?.trim() || '';
      const bn = $('.product-card-name', b)?.textContent?.trim() || '';
      if (mode === 'price-asc') return parsePrice(a) - parsePrice(b);
      if (mode === 'price-desc') return parsePrice(b) - parsePrice(a);
      if (mode === 'alpha') return an.localeCompare(bn, 'sv');
      if (mode === 'alpha-desc') return bn.localeCompare(an, 'sv');
      if (mode === 'newest') return Number(b.dataset.originalIndex) - Number(a.dataset.originalIndex);
      return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    }).forEach(card => grid.appendChild(card));
  }

  function bindSortControls(root = document) {
    $$('.catalog-sort-select', root).forEach(select => {
      if (select.dataset.catalogSortBound === 'true') return;
      select.dataset.catalogSortBound = 'true';
      select.addEventListener('change', () => {
        const catalog = select.closest('.catalog-page[data-catalog-filter]');
        const grid = $('.product-grid', catalog);
        if (grid) sortGrid(grid, select.value);
      });
    });
  }

  function forceStacking() {
    ensureStyle();
    $$('.catalog-filter-overlay.show').forEach(overlay => {
      overlay.style.setProperty('position', 'fixed', 'important');
      overlay.style.setProperty('inset', '0', 'important');
      overlay.style.setProperty('z-index', OVERLAY_Z, 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    });
    $$('.filter-sidebar.mobile-filter-open').forEach(sidebar => {
      if (sidebar.parentNode !== document.body) document.body.appendChild(sidebar);
      sidebar.style.setProperty('position', 'fixed', 'important');
      sidebar.style.setProperty('z-index', MODAL_Z, 'important');
      sidebar.style.setProperty('pointer-events', 'auto', 'important');
      sidebar.style.setProperty('opacity', '1', 'important');
      sidebar.style.setProperty('visibility', 'visible', 'important');
      sidebar.style.setProperty('isolation', 'isolate', 'important');
    });
  }

  function closeOpenFilter() {
    $('.filter-sidebar.mobile-filter-open .catalog-filter-close')?.click();
  }

  function init() {
    ensureStyle();
    bindSortControls();
    new MutationObserver(() => {
      bindSortControls();
      if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  document.addEventListener('click', event => {
    if (!document.body.classList.contains('catalog-filter-open')) return;
    const sidebar = $('.filter-sidebar.mobile-filter-open');
    if (!sidebar || sidebar.contains(event.target) || event.target.closest('.catalog-filter-toggle')) return;
    event.preventDefault();
    event.stopPropagation();
    closeOpenFilter();
  }, true);

  document.addEventListener('touchstart', () => {
    if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
  }, { passive: true, capture: true });
  document.addEventListener('swedsnus:products-rendered', () => setTimeout(bindSortControls, 0));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
