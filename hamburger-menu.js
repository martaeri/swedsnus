(() => {
  const MENU_ID = 'swedsnus-hamburger-menu';
  const TRIGGER_SELECTOR = '.nav-toggle';
  const EXTRA_THEMES = [
    { id: '5', className: 'theme-dot-5', title: 'Classy Factory Burgundy' },
    { id: '6', className: 'theme-dot-6', title: 'Robust Workshop Rust' },
    { id: '7', className: 'theme-dot-7', title: 'Nordic Local Craft' }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const link = (href, label, extraClass = '') => `
    <a class="hamburger-link ${extraClass}" href="${href}">
      <span>${label}</span>
      <span class="hamburger-arrow" aria-hidden="true">›</span>
    </a>
  `;

  function loadExpandedThemeStyles() {
    if ($('link[href="expanded-themes.css"]')) return;
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'expanded-themes.css';
    document.head.appendChild(linkElement);
  }

  function applyTheme(theme) {
    document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
    $$('.theme-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.theme === theme));
    localStorage.setItem('swedsnus-theme', theme);
  }

  function initExpandedThemeSwitcher() {
    const switcher = $('.theme-switcher');
    if (!switcher) return;

    EXTRA_THEMES.forEach(theme => {
      if ($(`.theme-dot[data-theme="${theme.id}"]`, switcher)) return;
      const button = document.createElement('button');
      button.className = `theme-dot ${theme.className}`;
      button.type = 'button';
      button.dataset.theme = theme.id;
      button.title = theme.title;
      button.setAttribute('aria-label', theme.title);
      switcher.appendChild(button);
    });

    const saved = localStorage.getItem('swedsnus-theme') || '1';
    $$('.theme-dot', switcher).forEach(dot => {
      dot.classList.toggle('active', dot.dataset.theme === saved);
      if (dot.dataset.expandedThemeBound === 'true') return;
      dot.dataset.expandedThemeBound = 'true';
      dot.addEventListener('click', () => applyTheme(dot.dataset.theme || '1'));
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
    initHomepageBannerCollapse();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
