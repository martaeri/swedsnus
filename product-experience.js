(() => {
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const $ = (selector, root = document) => root?.querySelector(selector) || null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function readBookmarks() {
    try {
      const value = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
  function savedLinks() {
    return [...new Set($$('a[href="bookmarks.html"], .header-icons a[title="Sparade produkter"], .header-icons a[aria-label^="Sparade produkter"]'))];
  }
  function updateSavedBadge() {
    const count = loggedIn() ? readBookmarks().length : 0;
    savedLinks().forEach(link => {
      let badge = $('.saved-badge', link);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'saved-badge saved-count';
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = count === 0;
      link.classList.toggle('has-saved-badge', count > 0);
      link.setAttribute('aria-label', count ? `Sparade produkter, ${count}` : 'Sparade produkter');
    });
    window.SwedsnusLayout?.syncCounters?.();
  }
  function syncProductBookmark() {
    const button = $('.product-gallery .product-image-bookmark');
    if (!button) return;
    const id = button.dataset.productId;
    const active = Boolean(id && loggedIn() && readBookmarks().some(item => item.id === id));
    button.classList.toggle('active', active);
    button.classList.toggle('requires-login', !loggedIn());
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Ta bort sparad produkt' : 'Spara produkt');
    button.title = loggedIn() ? (active ? 'Ta bort sparad produkt' : 'Spara produkt') : 'Logga in för att spara';
  }
  function scheduleSavedUpdates() {
    [0, 80].forEach(delay => setTimeout(() => {
      updateSavedBadge();
      syncProductBookmark();
    }, delay));
  }
  function bindSavedUpdates() {
    if (window.__swedsnusSavedBadgeUpdatesBound) return;
    window.__swedsnusSavedBadgeUpdatesBound = true;
    document.addEventListener('click', event => {
      if (event.target.closest('.bookmark-toggle, [data-logout], a[href="bookmarks.html"]')) scheduleSavedUpdates();
    }, true);
    document.addEventListener('submit', event => {
      if (event.target.closest('[data-auth-form]')) scheduleSavedUpdates();
    }, true);
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
      document.removeEventListener('keydown', onKeydown);
    };
    const onKeydown = event => { if (event.key === 'Escape') close(); };
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.product-image-close')) close();
      const action = event.target.closest('[data-zoom]')?.dataset.zoom;
      if (action === 'in') zoom = Math.min(2.5, zoom + .25);
      if (action === 'out') zoom = Math.max(1, zoom - .25);
      if (action) applyZoom();
    });
    document.addEventListener('keydown', onKeydown);
    applyZoom();
  }

  function enhanceProductPage() {
    const gallery = $('.product-gallery');
    const image = $('.product-gallery .main-img');
    const detail = $('.product-detail');
    if (!gallery || !image || !detail) return;

    let bookmark = $('.product-image-bookmark', gallery);
    const detailButtons = $$('.bookmark-toggle, .product-page-bookmark', detail);
    if (!bookmark) bookmark = detailButtons.shift() || document.createElement('button');
    detailButtons.forEach(button => button.remove());
    $$('.product-page-bookmark, .bookmark-toggle', detail).forEach(button => button.remove());

    bookmark.type = 'button';
    bookmark.classList.add('bookmark-toggle', 'product-page-bookmark', 'product-image-bookmark');
    if (!bookmark.querySelector('svg')) bookmark.innerHTML = BOOKMARK_ICON;
    const id = detail.dataset.productId || new URLSearchParams(location.search).get('id') || '';
    if (id) bookmark.dataset.productId = id;
    gallery.appendChild(bookmark);
    syncProductBookmark();

    if (gallery.dataset.productExperience === 'true') return;
    gallery.dataset.productExperience = 'true';
    gallery.classList.add('product-gallery-enhanced');
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', 'Öppna produktbild större');
    image.addEventListener('click', () => createImageOverlay(image));
    image.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      createImageOverlay(image);
    });
  }

  function syncStickyHeaderOffset() {
    const header = $('.site-header');
    if (!header || header.dataset.offsetBound === 'true') return;
    header.dataset.offsetBound = 'true';
    const setOffset = () => document.documentElement.style.setProperty('--mobile-sticky-header-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    setOffset();
    window.addEventListener('resize', setOffset);
    if ('ResizeObserver' in window) new ResizeObserver(setOffset).observe(header);
  }

  function px(value) { return Number(String(value || '').replace('px', '')) || 0; }
  function elementGap(track) { return px(getComputedStyle(track).columnGap || getComputedStyle(track).gap); }
  function cardStep(scroller, track) {
    const card = $('.product-card', track || scroller);
    return card ? card.getBoundingClientRect().width + elementGap(track || scroller) : Math.max(scroller.clientWidth * .8, 160);
  }
  function scrollStep(scroller, track, direction) {
    scroller.scrollBy({ left: cardStep(scroller, track) * direction, behavior: 'smooth' });
  }
  function activateCarouselButton(button) {
    if (!button) return;
    button.disabled = false;
    button.removeAttribute('disabled');
    button.setAttribute('aria-disabled', 'false');
  }
  function syncCarouselTrack(wrapper) {
    const outer = $('.carousel-track-outer', wrapper);
    const track = $('.carousel-track', wrapper);
    if (!outer || !track) return;
    track.style.transform = 'none';
    track.style.transition = 'none';
    const gap = elementGap(track) || 16;
    const cardWidth = outer.clientWidth < 720 ? Math.min(Math.max(outer.clientWidth * .72, 160), 260) : Math.max((outer.clientWidth - gap * 4) / 4.35, 180);
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
      activateCarouselButton(prev);
      activateCarouselButton(next);
      syncCarouselTrack(wrapper);
      if (wrapper.dataset.fluidCarousel === 'true') return;
      wrapper.dataset.fluidCarousel = 'true';
      [[prev, -1], [next, 1]].forEach(([button, direction]) => button?.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        activateCarouselButton(prev);
        activateCarouselButton(next);
        scrollStep(outer, track, direction);
      }, true));
      outer.addEventListener('scroll', () => {
        track.style.transform = 'none';
        activateCarouselButton(prev);
        activateCarouselButton(next);
      }, { passive: true });
    });
  }

  function enhanceVittShowcaseControls() {
    const wrap = $('.vitt-showcase-track-wrap');
    const track = $('.vitt-showcase-track', wrap);
    if (!wrap || !track || wrap.dataset.vittControls === 'true') return;
    wrap.dataset.vittControls = 'true';
    wrap.classList.add('vitt-showcase-enhanced-wrap');
    const prev = document.createElement('button');
    const next = document.createElement('button');
    prev.type = next.type = 'button';
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
    bindSavedUpdates();
    syncStickyHeaderOffset();
    rerunEnhancements();
    document.addEventListener('swedsnus:layout-rendered', () => {
      syncStickyHeaderOffset();
      setTimeout(rerunEnhancements, 0);
    });
    document.addEventListener('swedsnus:products-rendered', () => {
      setTimeout(rerunEnhancements, 0);
      setTimeout(rerunEnhancements, 120);
    });
    window.addEventListener('resize', () => requestAnimationFrame(rerunEnhancements));
    window.addEventListener('storage', scheduleSavedUpdates);
    window.addEventListener('focus', scheduleSavedUpdates);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
