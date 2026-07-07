(() => {
  const AUTH_KEY = 'swedsnus-demo-session';

  function loggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function closeModal() {
    document.querySelector('.account-auth-helper-modal')?.remove();
    document.body.classList.remove('auth-modal-open');
  }

  function openModal() {
    if (document.querySelector('.account-auth-helper-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'auth-modal account-auth-helper-modal open';
    modal.setAttribute('aria-hidden', 'false');
    modal.innerHTML = `<div class="auth-modal-backdrop" data-account-auth-close></div><section class="auth-dialog" role="dialog" aria-modal="true"><button class="auth-close" type="button" data-account-auth-close aria-label="Stäng">×</button><span class="account-kicker">Mina sidor</span><h2>Logga in för att fortsätta</h2><p>Logga in eller skapa ett konto för att gå till Mina sidor.</p><div class="auth-tabs"><button class="auth-tab active" type="button" data-account-auth-tab="login">Logga in</button><button class="auth-tab" type="button" data-account-auth-tab="register">Skapa konto</button></div><div class="auth-panel" data-account-auth-panel="login"><form class="auth-form" data-account-auth-form><p>Loggar in i prototypläge utan riktiga uppgifter.</p><button class="btn btn-primary" type="submit">Fortsätt som demokund</button></form></div><div class="auth-panel is-hidden" data-account-auth-panel="register"><form class="auth-form" data-account-auth-form><p>Skapar endast en tillfällig prototyp-session. Inga uppgifter sparas.</p><button class="btn btn-primary" type="submit">Skapa testkonto</button></form></div></section>`;
    document.body.appendChild(modal);
    document.body.classList.add('auth-modal-open');
  }

  function syncOrderBreadcrumb() {
    const current = document.querySelector('[data-order-breadcrumb]');
    if (!current) return;
    const id = new URLSearchParams(window.location.search).get('id');
    current.textContent = id ? `Order ${id}` : 'Order';
  }

  document.addEventListener('DOMContentLoaded', syncOrderBreadcrumb);
  syncOrderBreadcrumb();

  document.addEventListener('click', event => {
    const logout = event.target.closest('[data-logout]');
    if (logout) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sessionStorage.removeItem(AUTH_KEY);
      window.location.href = 'index.html';
      return;
    }

    const close = event.target.closest('[data-account-auth-close]');
    if (close) {
      event.preventDefault();
      closeModal();
      return;
    }

    const tab = event.target.closest('[data-account-auth-tab]');
    if (tab) {
      event.preventDefault();
      const modal = tab.closest('.account-auth-helper-modal');
      modal.querySelectorAll('[data-account-auth-tab]').forEach(item => item.classList.toggle('active', item === tab));
      modal.querySelectorAll('[data-account-auth-panel]').forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.accountAuthPanel !== tab.dataset.accountAuthTab));
      return;
    }

    const submit = event.target.closest('[data-account-auth-form]');
    if (submit) {
      event.preventDefault();
      sessionStorage.setItem(AUTH_KEY, 'true');
      window.location.href = 'account.html';
      return;
    }

    const accountLink = event.target.closest('a[href="account.html"], a[href="customer.html"], a[href="login.html"]');
    if (accountLink && !loggedIn()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openModal();
    }
  }, true);
})();
