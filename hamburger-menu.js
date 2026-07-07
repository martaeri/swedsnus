(() => {
  const MENU_ID = 'swedsnus-hamburger-menu';
  const TRIGGER_SELECTOR = '.nav-toggle';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const link = (href, label, extraClass = '') => `
    <a class="hamburger-link ${extraClass}" href="${href}">
      <span>${label}</span>
      <span class="hamburger-arrow" aria-hidden="true">›</span>
    </a>
  `;

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

  function initHomepageBannerCollapse() {
    $('.hero .hero-tabs')?.remove();

    const blocks = [
      ...$$('.feature-strip-intro'),
      ...$$('.fullbleed-section .fullbleed-inner > div:first-child')
    ];

    blocks.forEach(block => {
      if (block.dataset.bannerCollapse === 'true') return;
      const paragraphs = $$(':scope > p', block).filter(paragraph => !paragraph.classList.contains('tagline'));
      const text = paragraphs.map(paragraph => paragraph.textContent.trim()).join(' ');

      if (paragraphs.length === 0 || text.length < 95) return;

      const collapse = document.createElement('div');
      collapse.className = 'banner-copy-collapse';
      paragraphs[0].insertAdjacentElement('beforebegin', collapse);
      paragraphs.forEach(paragraph => collapse.appendChild(paragraph));

      const button = document.createElement('button');
      button.className = 'banner-copy-toggle';
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Se mer';
      collapse.insertAdjacentElement('afterend', button);

      button.addEventListener('click', () => {
        const expanded = block.classList.toggle('is-expanded');
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        button.textContent = expanded ? 'Visa mindre' : 'Se mer';
      });

      block.classList.add('has-collapsible-copy');
      block.dataset.bannerCollapse = 'true';
    });
  }

  function init() {
    initHamburgerMenu();
    initHomepageBannerCollapse();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
