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
    { id: '1', className: 'theme-dot-1', title: 'Classic Dark Brown' },
    { id: '2', className: 'theme-dot-2', title: 'White & Forest Green' },
    { id: '3', className: 'theme-dot-3', title: 'Slate & Gold' },
    { id: '4', className: 'theme-dot-4', title: 'Nordic Light Blue' },
    { id: '5', className: 'theme-dot-5', title: 'Classy Factory Burgundy' },
    { id: '6', className: 'theme-dot-6', title: 'Robust Workshop Rust' },
    { id: '7', className: 'theme-dot-7', title: 'Nordic Local Craft' },
    { id: '8', className: 'theme-dot-8', title: 'Simple Navy White' },
    { id: '9', className: 'theme-dot-9', title: 'Factory Stamp' },
    { id: '10', className: 'theme-dot-10', title: 'Dark Navy White' }
  ];
  const PRIMARY_LINKS = [
    { key: 'home', label: 'Hem', href: 'index.html' },
    { key: 'catalog', label: 'Sortiment', href: '#', dropdown: true },
    { key: 'about', label: 'Om oss', href: 'about.html' },
    { key: 'guide', label: 'Guide', href: 'guide.html' },
    { key: 'contact', label: 'Kontakt', href: 'contact.html' }
  ];
  const CATALOG_LINKS = [
    { key: 'portion', label: 'Portionssnus', href: 'portion.html' },
    { key: 'los', label: 'Lössnus', href: 'los.html' },
    { key: 'vitt-snus', label: 'Vitt snus', href: 'vitt-snus.html' },
    { key: 'gor-eget', label: 'Gör Eget', href: 'gor-eget.html' },
    { key: 'tillbehor', label: 'Tillbehör', href: 'tillbehor.html' }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function loadStylesheet(href) {
    if ($(`link[href="${href}"]`)) return;
    const element = document.createElement('link');
    element.rel = 'stylesheet';
    element.href = href;
    document.head.appendChild(element);
  }
  function loadSharedStyles() {
    ['expanded-themes.css', 'advanced-themes.css', 'product-family-pages.css'].forEach(loadStylesheet);
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
  function currentPageKey() {
    const explicit = document.body.dataset.page;
    if (explicit) return explicit;
    const file = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    const map = { index: 'home', product: 'catalog', cart: 'cart', account: 'account', customer: 'account', bookmarks: 'bookmarks', about: 'about', guide: 'guide', contact: 'contact', portion: 'portion', los: 'los', 'vitt-snus': 'vitt-snus', 'gor-eget': 'gor-eget', tillbehor: 'tillbehor', order: 'account' };
    return map[file] || file;
  }
  function isCatalogPage(key) { return CATALOG_LINKS.some(link => link.key === key) || key === 'catalog'; }
  function activeClass(condition) { return condition ? ' class="active"' : ''; }
  function dropdownMarkup() {
    return `<ul class="sub-dropdown">${CATALOG_LINKS.map(link => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}</ul>`;
  }
  function primaryNavMarkup(key) {
    return `<nav class="subheader" aria-label="Huvudnavigation"><ul class="subheader-inner">${PRIMARY_LINKS.map(link => {
      const active = link.key === 'catalog' ? isCatalogPage(key) : key === link.key;
      if (link.dropdown) return `<li class="has-dropdown"><a href="${link.href}"${activeClass(active)}>Sortiment ${CHEVRON}</a>${dropdownMarkup()}</li>`;
      return `<li><a href="${link.href}"${activeClass(active)}>${link.label}</a></li>`;
    }).join('')}</ul></nav>`;
  }
  function categoryNavMarkup(key) {
    return `<nav class="subnav" aria-label="Produktkategorier"><div class="subnav-inner">${CATALOG_LINKS.map(link => `<a href="${link.href}"${activeClass(key === link.key)}>${link.label}</a>`).join('')}</div></nav>`;
  }
  function headerMarkup() {
    const key = currentPageKey();
    return `<div class="header-topbar"><a href="index.html" class="site-logo">Swedsnus<span>Tillverkare · Hemsjö, Sverige</span></a><div class="header-search"><input type="search" placeholder="Sök produkt eller smak..." aria-label="Sök" /></div><div class="header-icons"><a href="bookmarks.html" class="header-icon-btn" title="Sparade produkter" aria-label="Sparade produkter">${BOOKMARK_ICON}<span class="saved-badge saved-count" hidden></span></a><a href="account.html" class="header-icon-btn" title="Mitt konto" aria-label="Mitt konto">${ACCOUNT_ICON}</a><div class="cart-wrapper"><a href="cart.html" class="header-icon-btn" title="Kundvagn" aria-label="Kundvagn">${CART_ICON}<span class="cart-badge cart-count">0</span></a><div class="cart-panel" role="dialog" aria-label="Kundvagn"><div class="cart-panel-header"><span>Kundvagn</span><span class="cart-panel-count">0 artiklar</span></div><div class="cart-panel-empty">Din kundvagn är tom.</div><div class="cart-panel-footer"><span class="cart-total">0 kr</span><a href="cart.html" class="cart-goto">Till kassan</a></div></div></div><button class="nav-toggle" aria-label="Öppna meny"><span></span><span></span><span></span></button></div></div>${primaryNavMarkup(key)}${categoryNavMarkup(key)}`;
  }
  function footerMarkup() {
    return `<div class="footer-inner"><div class="footer-grid"><div class="footer-brand"><div class="site-logo">Swedsnus.nu</div><p>Tillverkare av portionssnus och lössnus. Hemsjö, Sverige.</p></div><div class="footer-col"><h4>Produkter</h4><ul>${CATALOG_LINKS.map(link => `<li><a href="${link.href}">${link.label}</a></li>`).join('')}</ul></div><div class="footer-col"><h4>Information</h4><ul><li><a href="about.html">Om oss</a></li><li><a href="guide.html">Guide</a></li><li><a href="#">Villkor</a></li><li><a href="#">Integritetspolicy</a></li></ul></div><div class="footer-col"><h4>Kundservice</h4><ul><li><a href="contact.html">Kontakt</a></li><li><a href="#">Leveransinfo</a></li><li><a href="#">Returer</a></li><li><a href="contact.html">FAQ</a></li></ul></div></div><div class="footer-bottom"><span>© 2024 Swedsnus AB · Hemsjö, Sverige · Regleras av Lag (2018:2088) om tobak och liknande produkter · Åldersgräns 18 år</span><div class="payment-icons"><span class="payment-icon">Visa</span><span class="payment-icon">Mastercard</span><span class="payment-icon">Klarna</span><span class="payment-icon">Swish</span></div></div></div>`;
  }
  function ensureElement(selector, tag, className, before) {
    const existing = $(selector);
    if (existing) return existing;
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (before) before.insertAdjacentElement('beforebegin', element);
    else document.body.prepend(element);
    return element;
  }
  function renderShell() {
    const firstContent = $('main, .page-title-bar, .hero') || document.body.firstElementChild;
    const banner = ensureElement('.age-banner', 'div', 'age-banner', firstContent);
    banner.textContent = 'Tobaksförsäljning — åldersgräns 18 år · Legitimation kan krävas';
    const header = ensureElement('.site-header', 'header', 'site-header', firstContent);
    header.innerHTML = headerMarkup();
    const footer = ensureElement('.site-footer', 'footer', 'site-footer', null);
    footer.innerHTML = footerMarkup();
    let switcher = $('.theme-switcher');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.className = 'theme-switcher';
      document.body.appendChild(switcher);
    }
    renderThemeSwitcher(switcher);
    syncCounters();
    initMenu();
    initHomepageBannerCollapse();
    document.dispatchEvent(new CustomEvent('swedsnus:layout-rendered'));
  }
  function parsePrice(value) {
    const match = String(value || '').replace(/\s/g, '').match(/[0-9]+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  function syncCounters() {
    const cart = readStore(CART_KEY);
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
    const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * (parseInt(item.quantity, 10) || 1), 0);
    $$('.cart-count').forEach(item => item.textContent = count);
    $$('.cart-panel-count').forEach(item => item.textContent = `${count} ${count === 1 ? 'artikel' : 'artiklar'}`);
    $$('.cart-total').forEach(item => item.textContent = `${total.toLocaleString('sv-SE')} kr`);
    $$('.cart-panel-empty').forEach(item => item.hidden = count > 0);
    const savedCount = loggedIn() ? readStore(BOOKMARKS_KEY).length : 0;
    $$('.saved-count').forEach(item => {
      item.textContent = savedCount > 99 ? '99+' : String(savedCount);
      item.hidden = savedCount === 0;
    });
    $$('a[href="bookmarks.html"]').forEach(link => link.setAttribute('aria-label', savedCount > 0 ? `Sparade produkter, ${savedCount}` : 'Sparade produkter'));
  }
  function applyTheme(theme) {
    document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
    $$('.theme-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.theme === theme));
    localStorage.setItem('swedsnus-theme', theme);
  }
  function renderThemeSwitcher(switcher) {
    switcher.innerHTML = '<p>Tema</p>';
    const saved = localStorage.getItem('swedsnus-theme') || '1';
    THEME_OPTIONS.forEach(theme => {
      const button = document.createElement('button');
      button.className = `theme-dot ${theme.className}`;
      button.type = 'button';
      button.dataset.theme = theme.id;
      button.title = theme.title;
      button.setAttribute('aria-label', theme.title);
      button.classList.toggle('active', theme.id === saved);
      button.addEventListener('click', () => applyTheme(theme.id));
      switcher.appendChild(button);
    });
    applyTheme(saved);
  }
  const menuLink = (href, label, extraClass = '') => `<a class="hamburger-link ${extraClass}" href="${href}"><span>${label}</span><span class="hamburger-arrow" aria-hidden="true">›</span></a>`;
  function removeLegacyMenu() {
    $$('.mobile-menu-overlay, .mobile-menu-panel').forEach(element => element.remove());
    document.body.classList.remove('mobile-menu-open');
  }
  function createMenu() {
    removeLegacyMenu();
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
      drawer.innerHTML = `<header class="hamburger-header"><a href="index.html" class="hamburger-logo" aria-label="Swedsnus startsida">Swedsnus<span>Tillverkare · Hemsjö, Sverige</span></a><button class="hamburger-close" type="button" aria-label="Stäng meny">×</button></header><nav class="hamburger-nav" aria-label="Mobil meny"><div class="hamburger-main-links">${menuLink('index.html', 'Hem', 'hamburger-link-main')}<span class="hamburger-link hamburger-link-main hamburger-link-static">Sortiment</span><div class="hamburger-submenu" aria-label="Subsortiment">${CATALOG_LINKS.map(link => menuLink(link.href, link.label, 'hamburger-link-sub')).join('')}</div>${menuLink('about.html', 'Om oss', 'hamburger-link-main')}${menuLink('guide.html', 'Guide', 'hamburger-link-main')}</div><div class="hamburger-secondary-links">${menuLink('account.html', 'Mina sidor', 'hamburger-link-secondary')}${menuLink('contact.html', 'Kundservice', 'hamburger-link-secondary')}</div></nav>`;
      document.body.appendChild(drawer);
    }
    return { backdrop, drawer };
  }
  function initMenu() {
    const trigger = $('.nav-toggle');
    if (!trigger) return;
    const { backdrop, drawer } = createMenu();
    const closeButton = $('.hamburger-close', drawer);
    trigger.classList.add('hamburger-trigger');
    trigger.setAttribute('aria-controls', MENU_ID);
    trigger.setAttribute('aria-expanded', 'false');
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
    if (trigger.dataset.menuBound === 'true') return;
    trigger.dataset.menuBound = 'true';
    trigger.addEventListener('click', event => {
      event.preventDefault();
      drawer.classList.contains('is-open') ? close() : open();
    });
    closeButton?.addEventListener('click', close);
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
    const blocks = [...$$('.feature-strip-intro'), ...$$('.fullbleed-section .fullbleed-inner > div:first-child')];
    blocks.forEach(block => {
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
        if (!block.classList.contains('has-collapsible-copy')) return;
        if (collapse.scrollHeight <= collapse.clientHeight + 6) unwrapBannerCopy(block, collapse, paragraphs, button);
      });
    });
  }
  function bindCounterRefresh() {
    if (window.__swedsnusLayoutCountersBound) return;
    window.__swedsnusLayoutCountersBound = true;
    ['click', 'submit'].forEach(type => document.addEventListener(type, () => setTimeout(syncCounters, 60), true));
    window.addEventListener('storage', syncCounters);
    window.addEventListener('focus', syncCounters);
    document.addEventListener('swedsnus:products-rendered', () => setTimeout(syncCounters, 80));
  }
  function init() {
    loadSharedStyles();
    renderShell();
    bindCounterRefresh();
  }
  window.SwedsnusLayout = { render: renderShell, syncCounters };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();