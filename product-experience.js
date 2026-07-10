(() => {
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  const ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function readBookmarks() { try { const value = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function slugify(value) { return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produkt'; }
  function loadStylesheet(href) { if ($(`link[href="${href}"]`)) return; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); }
  function loadScript(src) { if ($(`script[src="${src}"]`)) return; const script = document.createElement('script'); script.src = src; script.defer = true; document.body.appendChild(script); }
  function loadAssets() { loadStylesheet('mobile-sticky-menu-footer.css'); loadScript('hamburger-menu.js'); loadScript('product-data.js'); }

  function updateSavedBadge() {
    const count = loggedIn() ? readBookmarks().length : 0;
    $$('a[href="bookmarks.html"]').forEach(link => {
      let badge = $('.saved-badge', link);
      if (!badge) { badge = document.createElement('span'); badge.className = 'saved-badge saved-count'; link.appendChild(badge); }
      badge.textContent = count;
      badge.hidden = count === 0;
    });
  }

  function textFromMeta(card, label) {
    const needle = label.toLowerCase();
    const meta = $$('.product-card-meta', card).find(item => item.textContent.trim().toLowerCase().startsWith(needle));
    return $('span', meta)?.textContent.trim() || meta?.textContent.split(':').slice(1).join(':').trim() || '';
  }

  function inferTaste(name) {
    const text = name.toLowerCase();
    if (text.includes('salmiak')) return 'Salmiak';
    if (text.includes('mint')) return 'Mint';
    if (text.includes('citrus')) return 'Citrus';
    if (text.includes('paré') || text.includes('pare') || text.includes('blue')) return 'Göteborgsstil';
    if (text.includes('neutral') || text.includes('rx')) return 'Neutral';
    if (text.includes('notch') || text.includes('fat boy')) return 'Osmaksatt';
    if (text.includes('genuin') || text.includes('original')) return 'Bergamott';
    return 'Klassisk';
  }

  function inferStrength(card, name) {
    const old = $('.strength-bar, .strength-dots', card);
    if (old) { const filled = $$('.filled', old).length; if (filled >= 4) return 4; if (filled === 3) return 3; return 2; }
    const text = name.toLowerCase();
    if (text.includes('extra')) return 4;
    if (text.includes('strong') || text.includes('stark')) return 3;
    return 2;
  }

  function isSnusCard(card) {
    if (card.dataset.productSource === 'json') return false;
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (path === 'tillbehor.html') return false;
    const badge = $('.product-card-badge', card)?.textContent.toLowerCase() || '';
    const series = card.dataset.series || '';
    const name = $('.product-card-name', card)?.textContent.toLowerCase() || '';
    return !(badge.includes('arom') || series.includes('arom') || name.includes('arom'));
  }

  function strengthDots(count) { return `<div class="strength-dots" aria-label="Styrka ${count} av 4">${[1, 2, 3, 4].map(index => `<span${index <= count ? ' class="filled"' : ''}></span>`).join('')}</div>`; }

  function enhanceCards() {
    $$('.product-card').forEach(card => {
      if (card.dataset.experienceEnhanced === 'true' || !isSnusCard(card)) return;
      const nameEl = $('.product-card-name', card);
      if (!nameEl) return;
      const productName = nameEl.textContent.trim();
      const taste = textFromMeta(card, 'Smak') || inferTaste(productName);
      const format = textFromMeta(card, 'Format') || $('.product-card-badge', card)?.textContent.trim() || 'Produkt';
      const summary = document.createElement('div');
      summary.className = 'snus-card-summary';
      summary.innerHTML = `<p class="product-card-meta primary-meta">Smak: <span>${taste}</span></p><p class="product-card-meta primary-meta">Format: <span>${format}</span></p><div class="product-card-strength-row">${strengthDots(inferStrength(card, productName))}</div>`;
      nameEl.insertAdjacentElement('afterend', summary);
      card.classList.add('snus-card-enhanced');
      card.dataset.experienceEnhanced = 'true';
    });
  }

  function updateFilterPills() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const changes = {
      'portion.html': { 'White Portion': ['White Portion', 'Färdig att snusa'], 'Instant Portion': ['Instant Portion', 'Smaksatta snussatser'], 'Super Dry': ['Super Dry', 'Snussatser'] },
      'los.html': { 'Instant': ['Instant', 'Smaksatta snussatser'] },
      'vitt-snus.html': { 'Grupp 1': ['Normal', 'Produktgrupp'], 'Grupp 2': ['Compact', 'Produktgrupp'], 'Grupp 3': ['Large', 'Produktgrupp'] },
      'gor-eget.html': { 'Instant Portion': ['Instant Portion', 'Smaksatta snussatser'], 'Super Dry': ['Super Dry', 'Snussatser'] },
      'tillbehor.html': { 'Tillbehör lössnus': ['Lössnus', 'Tillbehör till lössnus'], 'Tillbehör portionssnus': ['Portionssnus', 'Tillbehör till portionssnus'] }
    }[path];
    if (!changes) return;
    $$('.filter-pill').forEach(pill => {
      const title = $('.filter-pill-title', pill);
      const subtitle = $('.filter-pill-subtitle', pill);
      const next = changes?.[title?.textContent.trim()];
      if (!title || !subtitle || !next) return;
      title.textContent = next[0];
      subtitle.textContent = next[1];
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
    const applyZoom = () => { target.style.transform = `scale(${zoom})`; label.textContent = `${Math.round(zoom * 100)}%`; };
    const close = () => { overlay.remove(); document.body.classList.remove('product-image-open'); document.removeEventListener('keydown', esc); };
    const esc = event => { if (event.key === 'Escape') close(); };
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.product-image-close')) close();
      const action = event.target.closest('[data-zoom]')?.dataset.zoom;
      if (action === 'in') { zoom = Math.min(2.5, zoom + .25); applyZoom(); }
      if (action === 'out') { zoom = Math.max(1, zoom - .25); applyZoom(); }
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
    if (!bookmark) { bookmark = document.createElement('button'); bookmark.type = 'button'; bookmark.className = 'bookmark-toggle product-page-bookmark'; bookmark.innerHTML = BOOKMARK_ICON; bookmark.setAttribute('aria-label', 'Spara produkt'); }
    bookmark.classList.add('product-image-bookmark');
    bookmark.dataset.productId = bookmark.dataset.productId || slugify($('.product-detail h1')?.textContent || document.title);
    gallery.appendChild(bookmark);
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', 'Öppna produktbild större');
    image.addEventListener('click', () => createImageOverlay(image));
    image.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); createImageOverlay(image); } });
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

  function enhanceFluidCarousels() {
    $$('.carousel-wrapper').forEach(wrapper => {
      if (wrapper.dataset.fluidCarousel === 'true') return;
      const outer = $('.carousel-track-outer', wrapper);
      const prev = $('.carousel-btn-prev', wrapper);
      const next = $('.carousel-btn-next', wrapper);
      if (!outer) return;
      wrapper.dataset.fluidCarousel = 'true';
      wrapper.classList.add('carousel-fluid-scroll');
      const scrollStep = () => Math.max(outer.clientWidth * .72, 150);
      prev?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); outer.scrollBy({ left: -scrollStep(), behavior: 'smooth' }); }, true);
      next?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); outer.scrollBy({ left: scrollStep(), behavior: 'smooth' }); }, true);
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
    prev.type = 'button';
    next.type = 'button';
    prev.className = 'vitt-showcase-btn vitt-showcase-btn-prev';
    next.className = 'vitt-showcase-btn vitt-showcase-btn-next';
    prev.setAttribute('aria-label', 'Föregående produkter');
    next.setAttribute('aria-label', 'Nästa produkter');
    prev.innerHTML = ARROW_LEFT;
    next.innerHTML = ARROW_RIGHT;
    wrap.append(prev, next);
    const step = () => Math.max(track.clientWidth * .68, 150);
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step, behavior: 'smooth' }));
  }

  function rerunEnhancements() { updateFilterPills(); enhanceCards(); enhanceProductPage(); enhanceFluidCarousels(); enhanceVittShowcaseControls(); updateSavedBadge(); }
  function init() { loadAssets(); repairAuthTabs(); syncStickyHeaderOffset(); rerunEnhancements(); document.addEventListener('swedsnus:products-rendered', () => setTimeout(rerunEnhancements, 0)); document.addEventListener('click', () => setTimeout(rerunEnhancements, 60)); window.addEventListener('storage', updateSavedBadge); window.addEventListener('focus', updateSavedBadge); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
