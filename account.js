(() => {
  if (window.SwedsnusAccount) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before account.js');

  const { $, $$, escapeHtml, loggedIn } = Core;
  const orders = [
    { id: 'SW-10504', date: '2026-07-05', status: 'På väg', current: true, total: '989 kr', items: ['Lössnus Grov Express 40 Dosor'], eta: 'Beräknad leverans: 2026-07-08', tracking: 'PN-735904-SW' },
    { id: 'SW-10482', date: '2026-06-28', status: 'Levererad', current: false, total: '867 kr', items: ['Spacemint Premium 15 dosor', 'Robust 40 dosor'], eta: 'Levererad 2026-07-01', tracking: 'PN-732884-SW' },
    { id: 'SW-10361', date: '2026-05-17', status: 'Levererad', current: false, total: '549 kr', items: ['Spacemint Rebell 2-pack'], eta: 'Levererad 2026-05-20', tracking: 'PN-712409-SW' },
    { id: 'SW-10224', date: '2026-04-03', status: 'Returnerad', current: false, total: '289 kr', items: ['White RX Slim 15 dosor'], eta: 'Retur hanterad 2026-04-12', tracking: 'PN-690122-SW' }
  ];

  function requireMarkup(message) {
    return `<div class="account-locked"><span class="account-kicker">Inloggning krävs</span><h2>Logga in för att fortsätta</h2><p>${escapeHtml(message)}</p><div class="account-action-row"><a class="btn btn-primary" href="account.html">Logga in eller skapa konto</a><a class="btn btn-outline" href="index.html">Till startsidan</a></div></div>`;
  }

  function orderItemsText(order) {
    return Array.isArray(order.items) ? order.items.join(', ') : order.items;
  }

  function orderMarkup(order, compact = false) {
    return `<article class="order-card"><div><span class="order-id">${escapeHtml(order.id)}</span><h3>${escapeHtml(order.status)}</h3><p>${escapeHtml(orderItemsText(order))}</p><small>${escapeHtml(order.date)} · ${escapeHtml(order.total)}</small></div><div class="order-actions"><a class="btn btn-outline btn-small" href="order.html?id=${encodeURIComponent(order.id)}">Visa order</a>${order.current ? `<a class="btn btn-outline btn-small" href="order.html?id=${encodeURIComponent(order.id)}">Spåra</a>` : compact ? '' : `<a class="btn btn-outline btn-small" href="order.html?id=${encodeURIComponent(order.id)}">Hantera retur</a>`}</div></article>`;
  }

  function renderLoginPage() {
    const page = $('[data-login-page]');
    if (!page) return;
    page.innerHTML = loggedIn()
      ? '<div class="auth-page-card"><span class="account-kicker">Du är inloggad</span><h1>Välkommen tillbaka</h1><p>Du kan nu spara produkter och gå till Mina sidor.</p><div class="account-action-row"><a class="btn btn-primary" href="account.html">Till Mina sidor</a><button class="btn btn-outline" type="button" data-logout>Logga ut</button></div></div>'
      : `<div class="auth-page-card"><span class="account-kicker">Mina sidor</span><h1>Logga in eller skapa konto</h1><p>Det här är en prototyp. Du kan fortsätta utan riktiga uppgifter för att testa sparade produkter och Mina sidor.</p>${window.SwedsnusAuth?.panelsMarkup?.() || ''}</div>`;
  }

  function renderAccountPage() {
    const page = $('[data-account-page]');
    if (!page) return;
    if (!loggedIn()) {
      page.innerHTML = requireMarkup('Mina sidor visas först när du är inloggad.');
      return;
    }

    const bookmarks = window.SwedsnusBookmarks?.items?.() || [];
    const cartQuantity = (window.SwedsnusCart?.items?.() || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    const currentOrders = orders.filter(order => order.current);
    const pastOrders = orders.filter(order => !order.current);
    const savedMarkup = bookmarks.length
      ? bookmarks.map(product => window.SwedsnusBookmarks?.cardMarkup?.(product) || '').join('')
      : '<div class="bookmarks-empty">Du har inga sparade produkter än.</div>';

    page.innerHTML = `<div class="account-layout"><aside class="account-sidebar"><span class="account-kicker">Mina sidor</span><h2>Hej!</h2><p>Du är inloggad i prototypläge.</p><button class="account-tab active" type="button" data-account-tab="overview">Översikt</button><button class="account-tab" type="button" data-account-tab="orders">Orderhistorik</button><button class="account-tab" type="button" data-account-tab="saved">Sparade produkter</button><button class="account-tab" type="button" data-account-tab="settings">Inställningar</button><button class="btn btn-outline account-logout" type="button" data-logout>Logga ut</button></aside><section class="account-main"><div class="account-panel" data-account-panel="overview"><h1>Översikt</h1><div class="account-stat-grid"><div class="account-stat"><span>Sparade produkter</span><strong>${bookmarks.length}</strong></div><div class="account-stat"><span>Produkter i kundvagn</span><strong>${cartQuantity}</strong></div><div class="account-stat"><span>Aktuell order</span><strong>${currentOrders[0]?.id || '—'}</strong></div></div><div class="account-section"><h2>Aktuella beställningar</h2>${currentOrders.map(order => orderMarkup(order, true)).join('') || '<p>Du har inga aktuella beställningar.</p>'}</div><div class="account-section"><h2>Senaste tidigare order</h2>${pastOrders.slice(0, 2).map(order => orderMarkup(order, true)).join('')}</div></div><div class="account-panel is-hidden" data-account-panel="orders"><h1>Beställningar</h1><div class="account-section"><h2>Aktuella order</h2>${currentOrders.map(order => orderMarkup(order)).join('') || '<p>Inga aktuella order.</p>'}</div><div class="account-section"><h2>Tidigare order</h2>${pastOrders.map(order => orderMarkup(order)).join('')}</div></div><div class="account-panel is-hidden" data-account-panel="saved"><h1>Sparade produkter</h1><div class="account-saved-grid">${savedMarkup}</div></div><div class="account-panel is-hidden" data-account-panel="settings"><h1>Inställningar</h1><div class="settings-grid"><div class="settings-card"><h2>Personuppgifter</h2><p>Här kan kunden senare uppdatera namn, e-post och adress.</p><button class="btn btn-primary" type="button" data-demo-action="settings">Spara ändringar</button></div><div class="settings-card danger-zone"><h2>Radera konto</h2><p>Visuell prototyp för kontoradering.</p><button class="btn btn-outline" type="button" data-demo-action="delete">Radera konto</button></div></div></div></section></div>`;
    window.SwedsnusBookmarks?.syncButtons?.();
  }

  function renderOrderPage() {
    const page = $('[data-order-page]');
    if (!page) return;
    if (!loggedIn()) {
      page.innerHTML = requireMarkup('Logga in för att visa orderdetaljer.');
      return;
    }

    const id = new URLSearchParams(location.search).get('id') || orders[0].id;
    const order = orders.find(item => item.id === id) || orders[0];
    page.innerHTML = `<div class="order-detail-layout"><section><article class="order-detail-card"><span class="order-status-pill">${escapeHtml(order.status)}</span><h1>Order ${escapeHtml(order.id)}</h1><p>${escapeHtml(order.eta)}</p><div class="order-detail-actions">${order.current ? '<button class="btn btn-primary" type="button" data-demo-action="track">Spåra order</button>' : '<button class="btn btn-primary" type="button" data-demo-action="return">Hantera retur</button><button class="btn btn-outline" type="button" data-demo-action="reorder">Beställ igen</button>'}<a class="btn btn-outline" href="account.html">Till Mina sidor</a></div></article><section class="order-timeline"><h2>${order.current ? 'Spårning' : 'Orderstatus'}</h2><ol><li>Order mottagen</li><li>Order behandlad</li><li>${order.current ? 'På väg till kund' : 'Levererad'}</li>${order.current ? '<li>Väntar på leverans</li>' : '<li>Retur/reklamation kan startas från denna vy</li>'}</ol></section><section class="order-items-panel"><h2>Produkter</h2>${order.items.map(item => `<div class="order-item-row"><span>${escapeHtml(item)}</span><strong>${escapeHtml(order.total)}</strong></div>`).join('')}</section></section><aside class="order-summary-panel"><h2>Sammanfattning</h2><p><strong>Datum:</strong> ${escapeHtml(order.date)}</p><p><strong>Totalt:</strong> ${escapeHtml(order.total)}</p><p><strong>Spårningsnr:</strong> ${escapeHtml(order.tracking)}</p></aside></div>`;
  }

  function renderAll() {
    renderLoginPage();
    renderAccountPage();
    renderOrderPage();
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-account-tab]');
    if (!tab) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const root = tab.closest('[data-account-page]');
    $$('[data-account-tab]', root).forEach(item => item.classList.toggle('active', item === tab));
    $$('[data-account-panel]', root).forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.accountPanel !== tab.dataset.accountTab));
  }

  function init() {
    renderAll();
    document.addEventListener('click', handleClick, true);
    document.addEventListener('swedsnus:auth-changed', renderAll);
    document.addEventListener('swedsnus:bookmarks-changed', renderAccountPage);
    document.addEventListener('swedsnus:cart-changed', renderAccountPage);
  }

  window.SwedsnusAccount = { orders, renderAccountPage, renderAll, renderLoginPage, renderOrderPage };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();