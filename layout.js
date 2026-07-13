(() => {
  const CART_KEY = 'swedsnus-cart';
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const MENU_ID = 'swedsnus-hamburger-menu';
  const CART_ICON = '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const ACCOUNT_ICON = '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const CHEVRON = '<svg class="chevron" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  const THEME_OPTIONS = [
    ['1', 'theme-dot-1', 'Classic Dark Brown'],
    ['2', 'theme-dot-2', 'White & Forest Green'],
    ['3', 'theme-dot-3', 'Slate & Gold'],
    ['4', 'theme-dot-4', 'Nordic Light Blue'],
    ['5', 'theme-dot-5', 'Classy Factory Burgundy'],
    ['6', 'theme-dot-6', 'Robust Workshop Rust'],
    ['7', 'theme-dot-7', 'Nordic Local Craft'],
    ['8', 'theme-dot-8', 'Simple Navy White'],
    ['9', 'theme-dot-9', 'Factory Stamp'],
    ['10', 'theme-dot-10', 'Dark Navy White']
  ];
  const CATALOG_LINKS = [
    ['portion', 'Portionssnus', 'portion.html'],
    ['los', 'Lössnus', 'los.html'],
    ['vitt-snus', 'Vitt snus', 'vitt-snus.html'],
    ['gor-eget', 'Gör Eget', 'gor-eget.html'],
    ['tillbehor', 'Tillbehör', 'tillbehor.html']
  ];
  const MAIN_LINKS = [
    ['home', 'Hem', 'index.html'],
    ['catalog', 'Sortiment', '#'],
    ['about', 'Om oss', 'about.html'],
    ['guide', 'Guide', 'guide.html'],
    ['contact', 'Kontakt', 'contact.html']
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const html = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function loadStylesheet(href) {
    if ($(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  function readStore(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }
  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function parsePrice(value) {
    const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  function pageKey() {
    if (document.body.dataset.page) return document.body.dataset.page;
    const file = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    return { index: 'home', product: 'catalog', account: 'account', customer: 'account', order: 'account', bookmarks: 'bookmarks' }[file] || file;
  }
  function isCatalog(key) { return key === 'catalog' || CATALOG_LINKS.some(([id]) => id === key); }
  function active(condition) { return condition ? ' class="active"' : ''; }
  function catalogDropdown() {
    return `<ul class="sub-dropdown">${CATALOG_LINKS.map(([, label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>`;
  }
  function primaryNav(key) {
    return `<nav class="subheader" aria-label="Huvudnavigation"><ul class="subheader-inner">${MAIN_LINKS.map(([id, label, href]) => {
      const isActive = id === 'catalog' ? isCatalog(key) : id === key;
      return id === 'catalog' ? `<li class="has-dropdown"><a href="#"${active(isActive)}>${label} ${CHEVRON}</a>${catalogDropdown()}</li>` : `<li><a href="${href}"${active(isActive)}>${label}</a></li>`;
    }).join('')}</ul></nav>`;
  }
  function categoryNav(key) {
    return `<nav class="subnav" aria-label="Produktkategorier"><div class="subnav-inner">${CATALOG_LINKS.map(([id, label, href]) => `<a href="${href}"${active(id === key)}>${label}</a>`).join('')}</div></nav>`;
  }
  function headerMarkup() {
    const key = pageKey();
    return `<div class="header-topbar"><a href="index.html" class="site-logo">Swedsnus<span>Tillverkare · Hemsjö, Sverige</span></a><div class="header-search"><input type="search" placeholder="Sök produkt eller smak..." aria-label="Sök" /></div><div class="header-icons"><a href="bookmarks.html" class="header-icon-btn" title="Sparade produkter" aria-label="Sparade produkter">${BOOKMARK_ICON}<span class="saved-badge saved-count" hidden></span></a><a href="account.html" class="header-icon-btn" title="Mitt konto" aria-label="Mitt konto">${ACCOUNT_ICON}</a><div class="cart-wrapper"><a href="cart.html" class="header-icon-btn" title="Kundvagn" aria-label="Kundvagn">${CART_ICON}<span class="cart-badge cart-count">0</span></a><div class="cart-panel" role="dialog" aria-label="Kundvagn"><div class="cart-panel-header"><span>Kundvagn</span><span class="cart-panel-count">0 artiklar</span></div><div class="cart-panel-empty">Din kundvagn är tom.</div><div class="cart-panel-footer"><span class="cart-total">0 kr</span><a href="cart.html" class="cart-goto">Till kassan</a></div></div></div><button class="nav-toggle" aria-label="Öppna meny"><span></span><span></span><span></span></button></div></div>${primaryNav(key)}${categoryNav(key)}`;
  }
  function footerMarkup() {
    return `<div class="footer-inner"><div class="footer-grid"><div class="footer-brand"><div class="site-logo">Swedsnus.nu</div><p>Tillverkare av portionssnus och lössnus. Hemsjö, Sverige.</p></div><div class="footer-col"><h4>Produkter</h4><ul>${CATALOG_LINKS.map(([, label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div><div class="footer-col"><h4>Information</h4><ul><li><a href="about.html">Om oss</a></li><li><a href="guide.html">Guide</a></li><li><a href="#">Villkor</a></li><li><a href="#">Integritetspolicy</a></li></ul></div><div class="footer-col"><h4>Kundservice</h4><ul><li><a href="contact.html">Kontakt</a></li><li><a href="#">Leveransinfo</a></li><li><a href="#">Returer</a></li><li><a href="contact.html">FAQ</a></li></ul></div></div><div class="footer-bottom"><span>© 2024 Swedsnus AB · Hemsjö, Sverige · Regleras av Lag (2018:2088) om tobak och liknande produkter · Åldersgräns 18 år</span><div class="payment-icons"><span class="payment-icon">Visa</span><span class="payment-icon">Mastercard</span><span class="payment-icon">Klarna</span><span class="payment-icon">Swish</span></div></div></div>`;
  }
  function ensureBefore(selector, tag, className, before) {
    const existing = $(selector);
    if (existing) return existing;
    const element = document.createElement(tag);
    element.className = className;
    (before || document.body.firstElementChild)?.insertAdjacentElement('beforebegin', element);
    return element;
  }
  function ensureFooter() {
    const existing = $('.site-footer');
    if (existing) return existing;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    const firstScript = $('script');
    firstScript ? firstScript.insertAdjacentElement('beforebegin', footer) : document.body.appendChild(footer);
    return footer;
  }
  function applyTheme(theme) {
    document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
    $$('.theme-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.theme === theme));
    localStorage.setItem('swedsnus-theme', theme);
  }
  function renderThemeSwitcher() {
    let switcher = $('.theme-switcher');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.className = 'theme-switcher';
      const firstScript = $('script');
      firstScript ? firstScript.insertAdjacentElement('beforebegin', switcher) : document.body.appendChild(switcher);
    }
    const saved = localStorage.getItem('swedsnus-theme') || '1';
    switcher.innerHTML = `<p>Tema</p>${THEME_OPTIONS.map(([id, className, title]) => `<button class="theme-dot ${className}" type="button" data-theme="${id}" title="${html(title)}" aria-label="${html(title)}"></button>`).join('')}`;
    $$('.theme-dot', switcher).forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
    applyTheme(saved);
  }
  function syncCounters() {
    const cart = readStore(CART_KEY);
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
    const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * (parseInt(item.quantity, 10) || 1), 0);
    $$('.cart-count').forEach(item => item.textContent = count);
    $$('.cart-panel-count').forEach(item => item.textContent = `${count} ${count === 1 ? 'artikel' : 'artiklar'}`);
    $$('.cart-total').forEach(item => item.textContent = `${total.toLocaleString('sv-SE')} kr`);
    $$('.cart-panel-empty').forEach(item => item.hidden = count > 0);
    const saved = loggedIn() ? readStore(BOOKMARKS_KEY).length : 0;
    $$('.saved-count').forEach(item => {
      item.textContent = saved > 99 ? '99+' : String(saved);
      item.hidden = saved === 0;
    });
    $$('a[href="bookmarks.html"]').forEach(link => link.setAttribute('aria-label', saved > 0 ? `Sparade produkter, ${saved}` : 'Sparade produkter'));
  }
  function menuLink(href, label, extra = '') {
    return `<a class="hamburger-link ${extra}" href="${href}"><span>${label}</span><span class="hamburger-arrow" aria-hidden="true">›</span></a>`;
  }
  function createMenu() {
    $$('.mobile-menu-overlay, .mobile-menu-panel').forEach(element => element.remove());
    document.body.classList.remove('mobile-menu-open');
    let backdrop = $('.hamburger-backdrop');
    let drawer = $('.hamburger-drawer');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'hamburger-backdrop';
      document.body.appendChild(backdrop);
    }
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'hamburger-drawer';
      drawer.id = MENU_ID;
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `<header class="hamburger-header"><a href="index.html" class="hamburger-logo" aria-label="Swedsnus startsida">Swedsnus<span>Tillverkare · Hemsjö, Sverige</span></a><button class="hamburger-close" type="button" aria-label="Stäng meny">×</button></header><nav class="hamburger-nav" aria-label="Mobil meny"><div class="hamburger-main-links">${menuLink('index.html', 'Hem', 'hamburger-link-main')}<span class="hamburger-link hamburger-link-main hamburger-link-static">Sortiment</span><div class="hamburger-submenu" aria-label="Subsortiment">${CATALOG_LINKS.map(([, label, href]) => menuLink(href, label, 'hamburger-link-sub')).join('')}</div>${menuLink('about.html', 'Om oss', 'hamburger-link-main')}${menuLink('guide.html', 'Guide', 'hamburger-link-main')}</div><div class="hamburger-secondary-links">${menuLink('account.html', 'Mina sidor', 'hamburger-link-secondary')}${menuLink('contact.html', 'Kundservice', 'hamburger-link-secondary')}</div></nav>`;
      document.body.appendChild(drawer);
    }
    return { backdrop, drawer };
  }
  function initMenu() {
    const trigger = $('.nav-toggle');
    if (!trigger) return;
    const { backdrop, drawer } = createMenu();
    const close = () => {
      backdrop.classList.remove('is-visible');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('hamburger-is-open');
    };
    const open = () => {
      backdrop.classList.add('is-visible');
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('hamburger-is-open');
    };
    trigger.classList.add('hamburger-trigger');
    trigger.setAttribute('aria-controls', MENU_ID);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      drawer.classList.contains('is-open') ? close() : open();
    });
    $('.hamburger-close', drawer)?.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    $$('.hamburger-link[href]', drawer).forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
  }
  function unwrapBannerCopy(block, collapse, paragraphs, button) {
    paragraphs.forEach(paragraph => collapse.insertAdjacentElement('beforebegin', paragraph));
    button.remove();
    collapse.remove();
    block.classList.remove('has-collapsible-copy', 'is-expanded');
    block.dataset.bannerCollapse = 'skipped';
  }
  function initHomepageBannerCollapse() {
    $('.hero .hero-tabs')?.remove();
    [...$$('.feature-strip-intro'), ...$$('.fullbleed-section .fullbleed-inner > div:first-child')].forEach(block => {
      if (block.dataset.bannerCollapse) return;
      const paragraphs = $$(':scope > p', block).filter(paragraph => !paragraph.classList.contains('tagline'));
      const text = paragraphs.map(paragraph => paragraph.textContent.trim()).join(' ');
      if (!paragraphs.length || text.length < 140) {
        block.dataset.bannerCollapse = 'skipped';
        return;
      }
      const collapse = document.createElement('div');
      collapse.className = 'banner-copy-collapse';
      paragraphs[0].insertAdjacentElement('beforebegin', collapse);
      paragraphs.forEach(paragraph => collapse.appendChild(paragraph));
      const button = document.createElement('button');
      button.className = 'banner-copy-toggle';
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<span>Visa mer</span><span class="banner-toggle-icon" aria-hidden="true">⌄</span>';
      collapse.appendChild(button);
      button.addEventListener('click', () => {
        const expanded = block.classList.toggle('is-expanded');
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        $('.banner-copy-toggle span:first-child', collapse).textContent = expanded ? 'Visa mindre' : 'Visa mer';
      });
      block.classList.add('has-collapsible-copy');
      block.dataset.bannerCollapse = 'true';
      requestAnimationFrame(() => {
        if (collapse.scrollHeight <= collapse.clientHeight + 6) unwrapBannerCopy(block, collapse, paragraphs, button);
      });
    });
  }
  function renderShell() {
    ['themes.css', 'product-components.css'].forEach(loadStylesheet);
    const firstContent = $('main, .page-title-bar, .hero') || document.body.firstElementChild;
    const banner = ensureBefore('.age-banner', 'div', 'age-banner', firstContent);
    banner.textContent = 'Tobaksförsäljning — åldersgräns 18 år · Legitimation kan krävas';
    const header = ensureBefore('.site-header', 'header', 'site-header', firstContent);
    header.innerHTML = headerMarkup();
    ensureFooter().innerHTML = footerMarkup();
    renderThemeSwitcher();
    syncCounters();
    initMenu();
    initHomepageBannerCollapse();
    document.dispatchEvent(new CustomEvent('swedsnus:layout-rendered'));
  }
  function bindRefresh() {
    if (window.__swedsnusLayoutBound) return;
    window.__swedsnusLayoutBound = true;
    ['click', 'submit', 'change'].forEach(type => document.addEventListener(type, () => setTimeout(syncCounters, 80), true));
    window.addEventListener('storage', syncCounters);
    window.addEventListener('focus', syncCounters);
    document.addEventListener('swedsnus:products-rendered', () => setTimeout(syncCounters, 80));
  }
  function init() {
    renderShell();
    bindRefresh();
  }
  window.SwedsnusLayout = { render: renderShell, syncCounters };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();