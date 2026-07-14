(() => {
  if (window.__swedsnusPopoversLoaded) return;
  window.__swedsnusPopoversLoaded = true;

  const $ = (selector, root = document) => root?.querySelector(selector) || null;
  let suppressClick = false;

  const popovers = [
    {
      isOpen: () => document.body.classList.contains('catalog-filter-open'),
      panel: () => $('.filter-sidebar.mobile-filter-open'),
      trigger: target => target.closest('.catalog-filter-toggle'),
      close: () => $('.filter-sidebar.mobile-filter-open .catalog-filter-close')?.click()
    },
    {
      isOpen: () => document.body.classList.contains('hamburger-is-open'),
      panel: () => $('.hamburger-drawer.is-open'),
      trigger: target => target.closest('.hamburger-trigger, .nav-toggle'),
      close: () => $('.hamburger-drawer.is-open .hamburger-close')?.click()
    }
  ];

  function activePopover() {
    return popovers.find(popover => popover.isOpen()) || null;
  }

  function dismissOutside(event) {
    const popover = activePopover();
    if (!popover) return;

    const panel = popover.panel();
    if (panel?.contains(event.target) || popover.trigger(event.target)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = true;
    popover.close();
  }

  function suppressDismissClick(event) {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  const pressEvent = 'PointerEvent' in window ? 'pointerdown' : 'touchstart';
  document.addEventListener(pressEvent, dismissOutside, true);
  document.addEventListener('click', suppressDismissClick, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    activePopover()?.close();
  }, true);
})();