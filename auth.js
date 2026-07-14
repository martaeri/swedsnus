(() => {
  if (window.SwedsnusAuth) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before auth.js');

  const { $, $$, loggedIn, setLoggedIn } = Core;
  let pendingAction = null;

  function showToast(message) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function formMarkup(mode) {
    const register = mode === 'register';
    return `<form class="auth-form" data-auth-form="${mode}"><p>${register ? 'Skapar endast en tillfällig prototyp-session. Inga uppgifter sparas.' : 'Loggar in i prototypläge utan riktiga uppgifter.'}</p><button class="btn btn-primary" type="submit">${register ? 'Skapa testkonto' : 'Fortsätt som demokund'}</button></form>`;
  }

  function panelsMarkup() {
    return `<div class="auth-tabs"><button class="auth-tab active" type="button" data-auth-tab="login">Logga in</button><button class="auth-tab" type="button" data-auth-tab="register">Skapa konto</button></div><div class="auth-panel" data-auth-panel="login">${formMarkup('login')}</div><div class="auth-panel is-hidden" data-auth-panel="register">${formMarkup('register')}</div>`;
  }

  function modal() {
    let element = $('.auth-modal');
    if (element) return element;
    element = document.createElement('div');
    element.className = 'auth-modal';
    element.setAttribute('aria-hidden', 'true');
    element.innerHTML = `<div class="auth-modal-backdrop" data-auth-close></div><section class="auth-dialog" role="dialog" aria-modal="true"><button class="auth-close" type="button" data-auth-close aria-label="Stäng">×</button><span class="account-kicker">Mina sidor</span><h2>Logga in för att fortsätta</h2><p data-auth-message>Du behöver vara inloggad för att använda den här funktionen.</p>${panelsMarkup()}</section>`;
    document.body.appendChild(element);
    return element;
  }

  function open(message, action) {
    pendingAction = action || null;
    const element = modal();
    $('[data-auth-message]', element).textContent = message || 'Logga in eller skapa ett konto för att fortsätta.';
    element.classList.add('open');
    element.setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-modal-open');
  }

  function close() {
    $('.auth-modal')?.classList.remove('open');
    $('.auth-modal')?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('auth-modal-open');
  }

  function requireLogin(message, action) {
    if (loggedIn()) {
      action?.();
      return true;
    }
    open(message, action);
    return false;
  }

  function sync() {
    const active = loggedIn();
    document.body.classList.toggle('is-logged-in', active);
    document.body.classList.toggle('is-logged-out', !active);
    $$('a[href="login.html"], a[href="customer.html"], a[href="account.html"]').forEach(link => {
      link.href = 'account.html';
      link.title = active ? 'Mina sidor' : 'Logga in';
      link.setAttribute('aria-label', active ? 'Mina sidor' : 'Logga in');
    });
    window.SwedsnusBookmarks?.syncButtons?.();
  }

  function refreshLegacyView() {
    if (window.SwedsnusAccount) {
      window.SwedsnusAccount.renderAll();
      return;
    }
    if (document.querySelector('[data-login-page], [data-account-page], [data-order-page]')) location.reload();
  }

  function completeLogin() {
    setLoggedIn(true);
    close();
    const action = pendingAction;
    pendingAction = null;
    if (action) action();
    else {
      const redirect = new URLSearchParams(location.search).get('redirect');
      if (redirect) {
        location.href = redirect;
        return;
      }
    }
    sync();
    window.SwedsnusBookmarks?.renderPage?.();
    showToast('Du är inloggad');
    if (!action) refreshLegacyView();
  }

  function logout() {
    setLoggedIn(false);
    sync();
    window.SwedsnusBookmarks?.renderPage?.();
    showToast('Du är utloggad');
    refreshLegacyView();
  }

  function handleSubmit(event) {
    if (!event.target.closest('[data-auth-form]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    completeLogin();
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-auth-tab]');
    if (tab) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const root = tab.closest('.auth-modal, .auth-page-card');
      $$('[data-auth-tab]', root).forEach(item => item.classList.toggle('active', item === tab));
      $$('[data-auth-panel]', root).forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.authPanel !== tab.dataset.authTab));
      return;
    }

    if (event.target.closest('[data-auth-close]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      return;
    }

    if (event.target.closest('[data-logout]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      logout();
      return;
    }

    const bookmark = event.target.closest('.bookmark-toggle');
    if (bookmark && !loggedIn()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open('Logga in eller skapa ett konto för att spara produkter.');
      return;
    }

    const link = event.target.closest('a[href="bookmarks.html"], a[href="account.html"], a[href="customer.html"], a[href="login.html"], a[href^="order.html"]');
    if (!link || loggedIn()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const href = link.getAttribute('href');
    const message = href === 'bookmarks.html' ? 'Logga in för att se dina sparade produkter.' : href.startsWith('order.html') ? 'Logga in för att visa orderdetaljer.' : 'Logga in eller skapa ett konto för att gå till Mina sidor.';
    open(message, () => { location.href = href === 'customer.html' || href === 'login.html' ? 'account.html' : href; });
  }

  function init() {
    sync();
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('swedsnus:auth-changed', sync);
  }

  window.SwedsnusAuth = { close, loggedIn, logout, open, panelsMarkup, requireLogin, sync, showToast };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();