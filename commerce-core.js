(() => {
  if (window.SwedsnusCore) return;

  const keys = {
    cart: 'swedsnus-cart',
    bookmarks: 'swedsnus-bookmarks',
    auth: 'swedsnus-demo-session'
  };

  const $ = (selector, root = document) => root?.querySelector(selector) || null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

  function readStore(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loggedIn() {
    return sessionStorage.getItem(keys.auth) === 'true';
  }

  function setLoggedIn(value) {
    if (value) sessionStorage.setItem(keys.auth, 'true');
    else sessionStorage.removeItem(keys.auth);
    document.dispatchEvent(new CustomEvent('swedsnus:auth-changed', { detail: { loggedIn: value } }));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parsePrice(value) {
    const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'produkt';
  }

  window.SwedsnusCore = {
    keys,
    $,
    $$,
    readStore,
    writeStore,
    loggedIn,
    setLoggedIn,
    escapeHtml,
    parsePrice,
    slugify
  };
})();
