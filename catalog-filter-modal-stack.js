(() => {
  if (window.__swedsnusCatalogFilterStackGuard) return;
  window.__swedsnusCatalogFilterStackGuard = true;

  const MODAL_Z = '2147483647';
  const OVERLAY_Z = '2147483646';

  function ensureStyle() {
    if (document.getElementById('catalog-filter-stack-guard')) return;
    const style = document.createElement('style');
    style.id = 'catalog-filter-stack-guard';
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
      body > .filter-sidebar.mobile-filter-open * {
        pointer-events: auto !important;
      }

      .catalog-filter-overlay.show {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483646 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function forceStacking() {
    ensureStyle();

    document.querySelectorAll('.catalog-filter-overlay.show').forEach(overlay => {
      overlay.style.setProperty('position', 'fixed', 'important');
      overlay.style.setProperty('inset', '0', 'important');
      overlay.style.setProperty('z-index', OVERLAY_Z, 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    });

    document.querySelectorAll('.filter-sidebar.mobile-filter-open').forEach(sidebar => {
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
    const close = document.querySelector('.filter-sidebar.mobile-filter-open .catalog-filter-close');
    if (close) close.click();
  }

  document.addEventListener('click', event => {
    if (!document.body.classList.contains('catalog-filter-open')) return;
    const sidebar = document.querySelector('.filter-sidebar.mobile-filter-open');
    if (!sidebar) return;
    if (sidebar.contains(event.target) || event.target.closest('.catalog-filter-toggle')) return;
    event.preventDefault();
    event.stopPropagation();
    closeOpenFilter();
  }, true);

  document.addEventListener('touchstart', () => {
    if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
  }, { passive: true, capture: true });

  const observer = new MutationObserver(() => {
    if (document.body.classList.contains('catalog-filter-open')) requestAnimationFrame(forceStacking);
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyle();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  });

  ensureStyle();
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
})();
