(() => {
  if (window.__swedsnusAppLoaded) return;
  window.__swedsnusAppLoaded = true;

  const loaded = new Map();

  function ensureStylesheet(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    if (loaded.has(src)) return loaded.get(src);

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const ready = Promise.resolve();
      loaded.set(src, ready);
      return ready;
    }

    const task = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Kunde inte ladda ${src}`));
      document.body.appendChild(script);
    });

    loaded.set(src, task);
    return task;
  }

  async function start() {
    ensureStylesheet('commerce.css');

    await loadScript('commerce-core.js');
    await loadScript('ui-popovers.js');
    await loadScript('layout.js');
    await loadScript('product-data.js');
    await loadScript('product-experience.js');

    if (document.querySelector('.catalog-page[data-catalog-filter]')) {
      await loadScript('catalog-filters.js');
    }

    await loadScript('cart.js');
    await loadScript('bookmarks.js');
    await loadScript('main.js');
    document.dispatchEvent(new CustomEvent('swedsnus:app-ready'));
  }

  start().catch(error => console.error('[Swedsnus bootstrap]', error));
})();