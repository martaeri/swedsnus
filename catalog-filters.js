(() => {
  if (window.__swedsnusCatalogFiltersLoaded) return;
  window.__swedsnusCatalogFiltersLoaded = true;

  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];
  const savedFilters = {};

  function ensureStyles() {
    if ($('#catalog-filter-fixes')) return;
    const style = document.createElement('style');
    style.id = 'catalog-filter-fixes';
    style.textContent = `
      .catalog-page .product-card[hidden] { display: none !important; }
      .category-pills .filter-pill { position: relative; grid-template-columns: 34px minmax(0, 1fr) 20px; overflow: hidden; }
      .category-pills .filter-pill-copy { min-width: 0; overflow: hidden; }
      .category-pills .filter-pill-title,
      .category-pills .filter-pill-subtitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .category-pills .filter-pill-close { position: relative; z-index: 2; flex: 0 0 18px; pointer-events: none; }
      .catalog-filter-close { width: 100%; min-height: 42px; margin-top: .85rem; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-footer-bg); color: #fff; font-family: var(--font-body); font-size: .78rem; font-weight: 800; }
      @media (max-width: 640px) { .category-pills .filter-pill { min-width: 150px; grid-template-columns: 30px minmax(0, 1fr) 20px; } }
    `;
    document.head.appendChild(style);
  }

  function catalogKey(catalog) {
    return document.body.dataset.page || location.pathname.split('/').pop() || 'catalog';
  }

  function readSidebarFilters(catalog) {
    const filters = {};
    $$('.filter-sidebar [data-filter-group]', catalog).forEach(group => {
      const selected = $$('input:checked', group).map(input => input.value);
      if (selected.length) filters[group.dataset.filterGroup] = selected;
    });
    return filters;
  }

  function saveSidebarFilters(catalog) {
    savedFilters[catalogKey(catalog)] = readSidebarFilters(catalog);
  }

  function restoreSidebarFilters(catalog) {
    const filters = savedFilters[catalogKey(catalog)];
    if (!filters) return;
    $$('.filter-sidebar [data-filter-group]', catalog).forEach(group => {
      const selected = new Set(filters[group.dataset.filterGroup] || []);
      $$('input', group).forEach(input => { input.checked = selected.has(input.value); });
    });
  }

  function activeSeries(catalog) {
    return $('.filter-pill.active[data-series]', catalog)?.dataset.series || '';
  }

  function cardMatches(card, series, filters) {
    if (series && card.dataset.series !== series) return false;
    return Object.entries(filters).every(([key, selected]) => {
      if (!selected.length) return true;
      const value = card.dataset[key] || '';
      if (key === 'taste') return selected.some(item => value.split('|').includes(item));
      return selected.includes(value);
    });
  }

  function applyCatalogFilters(catalog) {
    restoreSidebarFilters(catalog);
    const filters = readSidebarFilters(catalog);
    const series = activeSeries(catalog);
    let visibleCount = 0;

    $$('.product-grid .product-card', catalog).forEach(card => {
      const visible = cardMatches(card, series, filters);
      card.classList.toggle('is-hidden', !visible);
      card.toggleAttribute('hidden', !visible);
      if (visible) visibleCount += 1;
    });

    const count = $('.catalog-count', catalog);
    if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? 'produkt' : 'produkter'}`;
    $('.catalog-empty', catalog)?.classList.toggle('show', visibleCount === 0);
  }

  function closeDrawer(catalog) {
    const sidebar = $('.filter-sidebar', catalog);
    const overlay = $('.catalog-filter-overlay');
    sidebar?.classList.remove('mobile-filter-open');
    overlay?.classList.remove('show');
    document.body.classList.remove('catalog-filter-open');
    $('.catalog-filter-toggle', catalog)?.setAttribute('aria-expanded', 'false');
  }

  function openDrawer(catalog) {
    const sidebar = $('.filter-sidebar', catalog);
    const overlay = ensureOverlay();
    restoreSidebarFilters(catalog);
    sidebar?.classList.add('mobile-filter-open');
    overlay.classList.add('show');
    document.body.classList.add('catalog-filter-open');
    $('.catalog-filter-toggle', catalog)?.setAttribute('aria-expanded', 'true');
  }

  function ensureOverlay() {
    let overlay = $('.catalog-filter-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'catalog-filter-overlay';
      document.body.appendChild(overlay);
    }
    if (overlay.dataset.catalogFilterFixBound !== 'true') {
      overlay.dataset.catalogFilterFixBound = 'true';
      overlay.addEventListener('click', () => {
        const catalog = $('.catalog-page[data-catalog-filter]');
        if (catalog) {
          saveSidebarFilters(catalog);
          closeDrawer(catalog);
          applyCatalogFilters(catalog);
        }
      });
    }
    return overlay;
  }

  function ensureControls(catalog) {
    const tools = $('.catalog-tools', catalog);
    const sidebar = $('.filter-sidebar', catalog);
    if (!tools || !sidebar) return;

    let controls = $('.catalog-mobile-tools', catalog);
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'catalog-mobile-tools';
      controls.innerHTML = '<button class="catalog-filter-toggle" type="button" aria-expanded="false">Filter</button><select class="catalog-sort-select" aria-label="Sortera produkter"><option value="relevance">Relevans</option><option value="price-asc">Pris: lägst först</option><option value="price-desc">Pris: högst först</option><option value="alpha">A–Ö</option><option value="alpha-desc">Ö–A</option><option value="newest">Nyast först</option></select>';
      tools.insertAdjacentElement('beforebegin', controls);
    }

    let close = $('.catalog-filter-close', sidebar);
    if (!close) {
      close = document.createElement('button');
      close.className = 'catalog-filter-close';
      close.type = 'button';
      close.textContent = 'Visa produkter';
      sidebar.appendChild(close);
    }

    const toggle = $('.catalog-filter-toggle', controls);
    if (toggle && toggle.dataset.catalogFilterFixBound !== 'true') {
      toggle.dataset.catalogFilterFixBound = 'true';
      toggle.addEventListener('click', event => {
        event.preventDefault();
        if (sidebar.classList.contains('mobile-filter-open')) {
          saveSidebarFilters(catalog);
          closeDrawer(catalog);
          applyCatalogFilters(catalog);
        } else {
          openDrawer(catalog);
        }
      });
    }

    if (close.dataset.catalogFilterFixBound !== 'true') {
      close.dataset.catalogFilterFixBound = 'true';
      close.addEventListener('click', event => {
        event.preventDefault();
        saveSidebarFilters(catalog);
        closeDrawer(catalog);
        applyCatalogFilters(catalog);
      });
    }
  }

  function setupCatalog(catalog) {
    ensureStyles();
    ensureControls(catalog);
    restoreSidebarFilters(catalog);
    applyCatalogFilters(catalog);
  }

  function setupAll() {
    $$('.catalog-page[data-catalog-filter]').forEach(setupCatalog);
  }

  document.addEventListener('click', event => {
    const pill = event.target.closest('.filter-pill[data-series]');
    if (!pill) return;
    const catalog = pill.closest('.catalog-page[data-catalog-filter]');
    if (!catalog) return;
    requestAnimationFrame(() => applyCatalogFilters(catalog));
  });

  document.addEventListener('change', event => {
    const input = event.target.closest('.filter-sidebar input');
    if (!input) return;
    const catalog = input.closest('.catalog-page[data-catalog-filter]');
    if (!catalog) return;
    saveSidebarFilters(catalog);
    applyCatalogFilters(catalog);
  });

  document.addEventListener('swedsnus:products-rendered', () => requestAnimationFrame(setupAll));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setupAll) : setupAll();
})();
