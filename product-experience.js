(() => {
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function readBookmarks() {
    try {
      const value = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }
  function loadStylesheet(href) {
    if ($(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  function loadScript(src) {
    if ($(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
  }
  function loadAssets() {
    loadStylesheet('mobile-sticky-menu-footer.css');
    loadStylesheet('index-carousel.css');
    loadScript('hamburger-menu.js');
  }

  function updateSavedBadge() {
    const count = loggedIn() ? readBookmarks().length : 0;
    $$('a[href="bookmarks.html"]').forEach(link => {
      let badge = $('.saved-badge', link);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'saved-badge saved-count';
        link.appendChild(badge);
      }
      badge.textContent = count;
      badge.hidden = count === 0;
    });
  }

  function createImageOverlay(source) {
    const overlay = document.createElement('div');
    overlay.className = 'product-image-overlay';
    overlay.innerHTML = `<button class="product-image-close" type="button" aria-label="Stäng">×</button><div class="product-image-stage"><div class="product-image-zoom-target">${source.outerHTML}</div></div><div class="product-image-tools"><button type="button" data-zoom="out">−</button><span data-zoom-label>100%</span><button type="button" data-zoom="in">+</button></div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('product-image-open');
    let zoom = 1;
    const target = $('.product-image-zoom-target', overlay);
    const label = $('[data-zoom-label]', overlay);
    const applyZoom = () => {
      target.style.transform = `scale(${zoom})`;
      label.textContent = `${Math.round(zoom * 100)}%`;
    };
    const close = () => {
      overlay.remove();
      document.body.classList.remove('product-image-open');
      document.removeEventListener('keydown', esc);
    };
    const esc = event => { if (event.key === 'Escape') close(); };
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.product-image-close')) close();
      const action = event.target.closest('[data-zoom]')?.dataset.zoom;
      if (action === 'in') {
        zoom = Math.min(2.5, zoom + .25);
        applyZoom();
      }
      if (action === 'out') {
        zoom = Math.max(1, zoom - .25);
        applyZoom();
      }
    });
    document.addEventListener('keydown', esc);
    applyZoom();
  }

  function enhanceProductPage() {
    const gallery = $('.product-gallery');
    const image = $('.product-gallery .main-img');
    if (!gallery || !image || gallery.dataset.productExperience === 'true') return;
    gallery.dataset.productExperience = 'true';
    gallery.classList.add('product-gallery-enhanced');
    let bookmark = $('.product-page-bookmark') || $('.bookmark-toggle[data-product-id]');
    if (!bookmark) {
      bookmark = document.createElement('button');
      bookmark.type = 'button';
      bookmark.className = 'bookmark-toggle product-page-bookmark';
      bookmark.innerHTML = BOOKMARK_ICON;
      bookmark.setAttribute('aria-label', 'Spara produkt');
    }
    bookmark.classList.add('product-image-bookmark');
    gallery.appendChild(bookmark);
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', 'Öppna produktbild större');
    image.addEventListener('click', () => createImageOverlay(image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        createImageOverlay(image);
      }
    });
  }

  function repairAuthTabs() {
    document.addEventListener('click', event => {
      const tab = event.target.closest('[data-auth-tab]');
      if (!tab) return;
      setTimeout(() => {
        const wrap = tab.closest('.auth-modal, .auth-page-card');
        if (!wrap) return;
        $$('[data-auth-tab]', wrap).forEach(item => item.classList.toggle('active', item === tab));
        $$('[data-auth-panel]', wrap).forEach(panel => panel.classList.toggle('is-hidden', panel.dataset.authPanel !== tab.dataset.authTab));
      }, 0);
    });
  }

  function syncStickyHeaderOffset() {
    const header = $('.site-header');
    if (!header) return;
    const setOffset = () => document.documentElement.style.setProperty('--mobile-sticky-header-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    setOffset();
    window.addEventListener('resize', setOffset);
    if ('ResizeObserver' in window) new ResizeObserver(setOffset).observe(header);
  }

  function px(value) { return Number(String(value || '').replace('px', '')) || 0; }
  function elementGap(track) { return px(getComputedStyle(track).columnGap || getComputedStyle(track).gap); }
  function cardStep(scroller, track) {
    const card = $('.product-card', track || scroller);
    if (!card) return Math.max(scroller.clientWidth * .8, 160);
    return card.getBoundingClientRect().width + elementGap(track || scroller);
  }
  function scrollStep(scroller, track, direction) {
    scroller.scrollBy({ left: cardStep(scroller, track) * direction, behavior: 'smooth' });
  }
  function syncCarouselTrack(wrapper) {
    const outer = $('.carousel-track-outer', wrapper);
    const track = $('.carousel-track', wrapper);
    if (!outer || !track) return;
    track.style.transform = 'none';
    track.style.transition = 'none';
    const gap = elementGap(track) || 16;
    const cardWidth = outer.clientWidth < 720
      ? Math.min(Math.max(outer.clientWidth * .72, 160), 260)
      : Math.max((outer.clientWidth - gap * 4) / 4.35, 180);
    $$('.product-card', track).forEach(card => {
      card.style.flex = `0 0 ${cardWidth}px`;
      card.style.width = `${cardWidth}px`;
    });
  }

  function enhanceFluidCarousels() {
    $$('.carousel-wrapper').forEach(wrapper => {
      const outer = $('.carousel-track-outer', wrapper);
      const track = $('.carousel-track', wrapper);
      const prev = $('.carousel-btn-prev', wrapper);
      const next = $('.carousel-btn-next', wrapper);
      if (!outer || !track) return;
      wrapper.classList.add('carousel-fluid-scroll');
      syncCarouselTrack(wrapper);
      if (wrapper.dataset.fluidCarousel !== 'true') {
        wrapper.dataset.fluidCarousel = 'true';
        prev?.addEventListener('click', event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          scrollStep(outer, track, -1);
        }, true);
        next?.addEventListener('click', event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          scrollStep(outer, track, 1);
        }, true);
        outer.addEventListener('scroll', () => { track.style.transform = 'none'; }, { passive: true });
      }
    });
  }

  function enhanceVittShowcaseControls() {
    const wrap = $('.vitt-showcase-track-wrap');
    const track = $('.vitt-showcase-track', wrap);
    if (!wrap || !track) return;
    wrap.classList.add('vitt-showcase-enhanced-wrap');
    if (wrap.dataset.vittControls === 'true') return;
    wrap.dataset.vittControls = 'true';
    const prev = document.createElement('button');
    const next = document.createElement('button');
    prev.type = 'button';
    next.type = 'button';
    prev.className = 'vitt-showcase-btn vitt-showcase-btn-prev';
    next.className = 'vitt-showcase-btn vitt-showcase-btn-next';
    prev.setAttribute('aria-label', 'Föregående produkter');
    next.setAttribute('aria-label', 'Nästa produkter');
    prev.innerHTML = ARROW_LEFT;
    next.innerHTML = ARROW_RIGHT;
    wrap.append(prev, next);
    prev.addEventListener('click', () => scrollStep(track, track, -1));
    next.addEventListener('click', () => scrollStep(track, track, 1));
  }

  function rerunEnhancements() {
    enhanceProductPage();
    enhanceFluidCarousels();
    enhanceVittShowcaseControls();
    updateSavedBadge();
  }

  function init() {
    loadAssets();
    repairAuthTabs();
    syncStickyHeaderOffset();
    rerunEnhancements();
    document.addEventListener('swedsnus:products-rendered', () => {
      setTimeout(rerunEnhancements, 0);
      setTimeout(rerunEnhancements, 120);
    });
    window.addEventListener('resize', () => requestAnimationFrame(rerunEnhancements));
    window.addEventListener('storage', updateSavedBadge);
    window.addEventListener('focus', updateSavedBadge);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
