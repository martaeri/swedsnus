(() => {
  const MENU_ID = 'swedsnus-hamburger-menu';
  const TRIGGER_SELECTOR = '.nav-toggle';
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
  const PORTION_COUNTS = { '300': '15 dosor', '400': '20 dosor', '500': '25 dosor' };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const link = (href, label, extraClass = '') => `
    <a class="hamburger-link ${extraClass}" href="${href}">
      <span>${label}</span>
      <span class="hamburger-arrow" aria-hidden="true">›</span>
    </a>
  `;

  function loadStylesheet(href) {
    if ($(`link[href="${href}"]`)) return;
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = href;
    document.head.appendChild(linkElement);
  }

  function loadExpandedThemeStyles() {
    loadStylesheet('expanded-themes.css');
    loadStylesheet('advanced-themes.css');
    loadStylesheet('product-family-pages.css');
  }

  function applyTheme(theme) {
    document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
    $$('.theme-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.theme === theme));
    localStorage.setItem('swedsnus-theme', theme);
  }

  function initExpandedThemeSwitcher() {
    const switcher = $('.theme-switcher');
    if (!switcher) return;

    const label = $('p', switcher) || document.createElement('p');
    label.textContent = 'Tema';
    switcher.innerHTML = '';
    switcher.appendChild(label);

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
  }

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
      drawer.innerHTML = `
        <header class="hamburger-header">
          <a href="index.html" class="hamburger-logo" aria-label="Swedsnus startsida">
            Swedsnus
            <span>Tillverkare · Hemsjö, Sverige</span>
          </a>
          <button class="hamburger-close" type="button" aria-label="Stäng meny">×</button>
        </header>

        <nav class="hamburger-nav" aria-label="Mobil meny">
          <div class="hamburger-main-links">
            ${link('index.html', 'Hem', 'hamburger-link-main')}
            <span class="hamburger-link hamburger-link-main hamburger-link-static">Sortiment</span>
            <div class="hamburger-submenu" aria-label="Subsortiment">
              ${link('portion.html', 'Portionssnus', 'hamburger-link-sub')}
              ${link('los.html', 'Lössnus', 'hamburger-link-sub')}
              ${link('vitt-snus.html', 'Vitt snus', 'hamburger-link-sub')}
              ${link('gor-eget.html', 'Gör eget', 'hamburger-link-sub')}
              ${link('tillbehor.html', 'Tillbehör', 'hamburger-link-sub')}
            </div>
            ${link('about.html', 'Om oss', 'hamburger-link-main')}
            ${link('guide.html', 'Guide', 'hamburger-link-main')}
          </div>

          <div class="hamburger-secondary-links">
            ${link('account.html', 'Mina sidor', 'hamburger-link-secondary')}
            ${link('contact.html', 'Kundservice', 'hamburger-link-secondary')}
          </div>
        </nav>
      `;
      document.body.appendChild(drawer);
    }

    return { backdrop, drawer };
  }

  function initHamburgerMenu() {
    const trigger = $(TRIGGER_SELECTOR);
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

    trigger.addEventListener('click', event => {
      event.preventDefault();
      drawer.classList.contains('is-open') ? close() : open();
    });

    closeButton?.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    $$('.hamburger-link[href]', drawer).forEach(menuLink => {
      menuLink.addEventListener('click', close);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
  }

  function normalizePortionCountTitle(name) {
    return String(name || '').replace(/\b(300|400|500)\b(?!\s*dosor)/g, match => PORTION_COUNTS[match] || match);
  }

  function currentFile() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function classifyProductCard(card) {
    const file = currentFile();
    const name = $('.product-card-name', card)?.textContent || '';
    const badge = $('.product-card-badge', card)?.textContent || '';
    const meta = $$('.product-card-meta', card).map(item => item.textContent).join(' ');
    const text = `${file} ${name} ${badge} ${meta} ${card.dataset.series || ''}`.toLowerCase();

    if (text.includes('expressarom') || text.includes('super dry arom') || /\barom\b/.test(text)) return 'arom';
    if (file === 'tillbehor.html' || text.includes('tillbehör') || text.includes('tillbehor')) return 'tillbehor';
    if (file === 'los.html' || text.includes('lössnus') || text.includes('lossnus') || ((text.includes('instant') || text.includes('express')) && !text.includes('portion'))) return 'los';
    return 'portion';
  }

  function hrefForFamily(family) {
    if (family === 'los') return 'product-los.html';
    if (family === 'arom') return 'product-arom.html';
    if (family === 'tillbehor') return 'product-tillbehor.html';
    return 'product-portion.html';
  }

  function updateProductCards() {
    $$('.product-card').forEach(card => {
      const name = $('.product-card-name', card);
      if (name) {
        const next = normalizePortionCountTitle(name.textContent);
        if (name.textContent !== next) name.textContent = next;
      }

      const family = classifyProductCard(card);
      card.dataset.productFamily = family;
      card.dataset.href = hrefForFamily(family);
    });
  }

  function initProductFamilyRouting() {
    updateProductCards();
    const observer = new MutationObserver(() => updateProductCards());
    observer.observe(document.body, { childList: true, subtree: true });
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

    const blocks = [
      ...$$('.feature-strip-intro'),
      ...$$('.fullbleed-section .fullbleed-inner > div:first-child')
    ];

    blocks.forEach(block => {
      if (block.dataset.bannerCollapse) return;
      const paragraphs = $$(':scope > p', block).filter(paragraph => !paragraph.classList.contains('tagline'));
      const text = paragraphs.map(paragraph => paragraph.textContent.trim()).join(' ');

      if (paragraphs.length === 0 || text.length < 140) {
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
        if (collapse.scrollHeight <= collapse.clientHeight + 6) {
          unwrapBannerCopy(block, collapse, paragraphs, button);
        }
      });
    });
  }

  function init() {
    loadExpandedThemeStyles();
    initExpandedThemeSwitcher();
    initHamburgerMenu();
    initProductFamilyRouting();
    initHomepageBannerCollapse();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
