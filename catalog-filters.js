(() => {
  if (window.__swedsnusCatalogFiltersLoaded) return;
  window.__swedsnusCatalogFiltersLoaded = true;

  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];
  const savedFilters = {};
  const portaledSidebars = new WeakMap();
  let activeCatalog = null;

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
      .category-pills .filter-pill-close { position: relative; z-index: 3; flex: 0 0 18px; pointer-events: none; }
      .catalog-filter-close { width: 100%; min-height: 42px; margin-top: .85rem; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-footer-bg); color: #fff; font-family: var(--font-body); font-size: .78rem; font-weight: 800; }
      .catalog-filter-overlay.show { position: fixed; inset: 0; z-index: 3000 !important; background: rgba(18, 17, 14, .38); }
      @media (max-width: 720px) {
        body.catalog-filter-open { overflow: hidden; }
        .category-pills { gap: .45rem; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
        .category-pills::-webkit-scrollbar { display: none; }
        .category-pills .filter-pill { flex: 0 0 clamp(112px, 30vw, 136px); min-width: 0; min-height: 48px; grid-template-columns: 19px minmax(0, 1fr) 15px; gap: .32rem; padding: .42rem .44rem; }
        .category-pills .filter-pill-icon { width: 19px; height: 19px; }
        .category-pills .filter-pill-icon::before { inset: 4px; }
        .category-pills .filter-pill-icon::after { left: 5px; right: 5px; bottom: 5px; height: 6px; }
        .category-pills .filter-pill-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; white-space: normal; overflow: hidden; text-overflow: clip; overflow-wrap: anywhere; hyphens: auto; font-size: .64rem; line-height: 1.02; }
        .category-pills .filter-pill-subtitle { display: none; }
        .category-pills .filter-pill-close { width: 15px; height: 15px; font-size: .7rem; align-self: center; }
        .filter-sidebar.mobile-filter-open {
          position: fixed !important;
          box-sizing: border-box;
          left: max(.875rem, env(safe-area-inset-left)) !important;
          right: max(.875rem, env(safe-area-inset-right)) !important;
          top: 50dvh !important;
          bottom: auto !important;
          transform: translate3d(0, -50%, 0) !important;
          z-index: 3001 !important;
          display: flex !important;
          flex-direction: column;
          width: auto !important;
          max-width: none !important;
          max-height: min(76dvh, 620px);
          overflow: hidden;
          overscroll-behavior: contain;
          padding: .95rem;
          border: 1px solid var(--color-border);
          border-radius: 22px;
          background: var(--color-surface);
          box-shadow: 0 24px 70px rgba(34,31,25,.24);
          margin: 0 !important;
          pointer-events: auto;
        }
        .filter-sidebar.mobile-filter-open .catalog-filter-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding-right: .2rem;
          margin-right: -.2rem;
          overscroll-behavior: contain;
        }
        .filter-sidebar.mobile-filter-open .sidebar-group { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .2rem .6rem; margin: 0 0 .75rem; }
        .filter-sidebar.mobile-filter-open .sidebar-group h4 { grid-column: 1 / -1; margin: 0 0 .1rem; }
        .filter-sidebar.mobile-filter-open .sidebar-check { min-height: 30px; }
        .filter-sidebar.mobile-filter-open .catalog-filter-close {
          flex: 0 0 auto;
          align-self: flex-end;
          width: auto;
          min-width: 132px;
          min-height: 40px;
          margin: .75rem 0 0;
          padding: 0 1.05rem;
          border-radius: 999px;
          box-shadow: none;
        }
      }
      @supports not (height: 100dvh) {
        @media (max-width: 720px) {
          .filter-sidebar.mobile-filter-open {
            top: 50vh !important;
            max-height: min(76vh, 620px);
          }
        }
      }
      @media (max-width: 380px) {
        .category-pills .filter-pill { flex-basis: 108px; }
        .category-pills .filter-pill-title { font-size: .61rem; }
        .filter-sidebar.mobile-filter-open .sidebar-group { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function catalogKey(catalog) {
    return document.body.dataset.page || location.pathname.split('/').pop() || 'catalog';
  }

  function prepareCatalog(catalog) {
    const key = catalogKey(catalog);
    catalog.dataset.catalogFilterKey = key;
    return key;
  }

  function sidebarFor(catalog) {
    const key = catalog.dataset.catalogFilterKey || prepareCatalog(catalog);
    return $('.filter-sidebar', catalog) || $(`body > .filter-sidebar[data-catalog-filter-key="${key}"]`);
  }

  function normalizePillLabels(catalog) {
    $$('.filter-pill-title', catalog).forEach(title => {
      const text = title.textContent.trim();
      title.setAttribute('title', text);
      if (text === 'Expressaromer') title.innerHTML = 'Express-<br>aromer';
      if (text === 'Portionssnus') title.innerHTML = 'Portions-<br>snus';
    });
  }

  function readSidebarFilters(catalog) {
    const sidebar = sidebarFor(catalog);
    const filters = {};
    $$('.filter-sidebar [data-filter-group]', sidebar || catalog).forEach(group => {
      const selected = $$('input:checked', group).map(input => input.value);
      if (selected.length) filters[group.dataset.filterGroup] = selected;
    });
    return filters;
  }

  function saveSidebarFilters(catalog) {
    savedFilters[catalogKey(catalog)] = readSidebarFilters(catalog);
  }

  function restoreSidebarFilters(catalog) {
    const sidebar = sidebarFor(catalog);
    const filters = savedFilters[catalogKey(catalog)];
    if (!sidebar || !filters) return;
    $$('.filter-sidebar [data-filter-group]', sidebar).forEach(group => {
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

  function setLayering(sidebar, overlay) {
    if (overlay) overlay.style.zIndex = '3000';
    if (sidebar) sidebar.style.zIndex = '3001';
  }

  function clearLayering(sidebar, overlay) {
    if (overlay) overlay.style.removeProperty('z-index');
    if (sidebar) sidebar.style.removeProperty('z-index');
  }

  function portalSidebar(catalog) {
    const sidebar = sidebarFor(catalog);
    if (!sidebar) return null;
    const key = prepareCatalog(catalog);
    sidebar.dataset.catalogFilterKey = key;
    if (sidebar.parentNode === document.body) return sidebar;

    const placeholder = document.createComment('catalog filter sidebar');
    sidebar.parentNode.insertBefore(placeholder, sidebar);
    portaledSidebars.set(sidebar, { parent: placeholder.parentNode, placeholder });
    document.body.appendChild(sidebar);
    return sidebar;
  }

  function restoreSidebarPosition(catalog) {
    const sidebar = sidebarFor(catalog);
    const record = sidebar ? portaledSidebars.get(sidebar) : null;
    if (!sidebar || !record?.placeholder?.parentNode) return;
    record.parent.insertBefore(sidebar, record.placeholder);
    record.placeholder.remove();
    portaledSidebars.delete(sidebar);
  }

  function closeDrawer(catalog) {
    const sidebar = sidebarFor(catalog);
    const overlay = $('.catalog-filter-overlay');
    sidebar?.classList.remove('mobile-filter-open');
    overlay?.classList.remove('show');
    clearLayering(sidebar, overlay);
    document.body.classList.remove('catalog-filter-open');
    $('.catalog-filter-toggle', catalog)?.setAttribute('aria-expanded', 'false');
    restoreSidebarPosition(catalog);
    activeCatalog = null;
  }

  function openDrawer(catalog) {
    const sidebar = portalSidebar(catalog);
    if (!sidebar) return;
    const overlay = ensureOverlay();
    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);
    activeCatalog = catalog;
    restoreSidebarFilters(catalog);
    setLayering(sidebar, overlay);
    sidebar.classList.add('mobile-filter-open');
    overlay.classList.add('show');
    document.body.classList.add('catalog-filter-open');
    $('.catalog-filter-toggle', catalog)?.setAttribute('aria-expanded', 'true');
  }

  function toggleDrawer(catalog) {
    const sidebar = sidebarFor(catalog);
    if (!sidebar) return;
    if (sidebar.classList.contains('mobile-filter-open')) {
      saveSidebarFilters(catalog);
      closeDrawer(catalog);
      applyCatalogFilters(catalog);
    } else {
      openDrawer(catalog);
    }
  }

  function ensureOverlay() {
    let overlay = $('.catalog-filter-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'catalog-filter-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.zIndex = '3000';
    if (overlay.dataset.catalogFilterFixBound !== 'true') {
      overlay.dataset.catalogFilterFixBound = 'true';
      overlay.addEventListener('click', event => {
        event.preventDefault();
        const catalog = activeCatalog || $('.catalog-page[data-catalog-filter]');
        if (catalog) {
          saveSidebarFilters(catalog);
          closeDrawer(catalog);
          applyCatalogFilters(catalog);
        }
      }, true);
    }
    return overlay;
  }

  function ensureFilterScroll(sidebar, close) {
    let scroll = $('.catalog-filter-scroll', sidebar);
    if (!scroll) {
      scroll = document.createElement('div');
      scroll.className = 'catalog-filter-scroll';
      sidebar.insertBefore(scroll, close);
    }
    Array.from(sidebar.children).forEach(child => {
      if (child !== scroll && child !== close) scroll.appendChild(child);
    });
  }

  function ensureControls(catalog) {
    prepareCatalog(catalog);
    const tools = $('.catalog-tools', catalog);
    const sidebar = sidebarFor(catalog);
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
    ensureFilterScroll(sidebar, close);

    const toggle = $('.catalog-filter-toggle', controls);
    if (toggle && toggle.dataset.catalogFilterFixBound !== 'true') {
      toggle.dataset.catalogFilterFixBound = 'true';
      toggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleDrawer(catalog);
      }, true);
    }

    if (close.dataset.catalogFilterFixBound !== 'true') {
      close.dataset.catalogFilterFixBound = 'true';
      close.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        saveSidebarFilters(catalog);
        closeDrawer(catalog);
        applyCatalogFilters(catalog);
      }, true);
    }
  }

  function setupCatalog(catalog) {
    ensureStyles();
    ensureControls(catalog);
    normalizePillLabels(catalog);
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
    const catalog = input.closest('.catalog-page[data-catalog-filter]') || activeCatalog;
    if (!catalog) return;
    saveSidebarFilters(catalog);
    applyCatalogFilters(catalog);
  });

  document.addEventListener('swedsnus:products-rendered', () => requestAnimationFrame(setupAll));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', setupAll) : setupAll();
})();
