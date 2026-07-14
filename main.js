(() => {
  if (window.__swedsnusMainLoaded) return;
  window.__swedsnusMainLoaded = true;

  const Core = window.SwedsnusCore;
  const Records = window.SwedsnusProductRecords;
  const UI = window.SwedsnusUI;
  if (!Core || !Records || !UI) throw new Error('Core, product records and UI must load before main.js');

  const { $, $$, escapeHtml, parsePrice } = Core;
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

  function unitPrice(option) {
    if (!option) return '';
    if (option.dataset.per) return option.dataset.per;
    const price = parsePrice(option.dataset.price || option.textContent);
    const pack = option.dataset.pack || option.textContent;
    const amount = parseInt((pack.match(/[0-9]+/) || ['1'])[0], 10) || 1;
    return price ? `${Math.round(price / amount).toLocaleString('sv-SE')} kr/st` : '';
  }

  function normalizeCard(card) {
    if (!card || card.dataset.normalized === 'true') return;
    const product = Records.fromCard(card);
    card.dataset.href = product.href;
    card.dataset.productId = product.id;

    $$('.pack-select option', card).forEach(option => {
      const pack = option.dataset.pack || option.textContent.split('—')[0].trim() || '1-pack';
      const price = option.dataset.price || option.textContent.split('—').slice(1).join('—').replace(/\([^)]*\)/g, '').trim();
      option.dataset.pack = pack;
      if (price) option.dataset.price = price;
      option.textContent = `${pack} — ${price}`;
    });

    const actions = $('.product-card-actions', card);
    const price = $('.product-card-price', card);
    const add = $('.add-to-cart-btn', card);
    if (actions && price && add) {
      let bottom = $('.product-card-bottom', card);
      if (!bottom) {
        bottom = document.createElement('div');
        bottom.className = 'product-card-bottom';
        actions.insertAdjacentElement('afterend', bottom);
      }
      bottom.append(price, add);
      add.type = 'button';
      if (!add.querySelector('svg')) add.innerHTML = CART_ICON;
      price.innerHTML = `<span class="unit-price">${escapeHtml(unitPrice(Records.selectedOption(card)) || Records.selectedPrice(card))}</span><small>per produkt</small>`;
    }

    let bookmark = $('.bookmark-toggle', card);
    if (!bookmark) {
      bookmark = document.createElement('button');
      bookmark.type = 'button';
      bookmark.className = 'bookmark-toggle';
      bookmark.innerHTML = BOOKMARK_ICON;
      card.appendChild(bookmark);
    }
    bookmark.dataset.productId = product.id;
    bookmark.setAttribute('aria-label', 'Spara produkt');

    const link = $('.product-card-main-link', card);
    if (link) link.href = product.href;
    card.dataset.normalized = 'true';
  }

  function normalizeCards() {
    $$('.product-card').forEach(normalizeCard);
    window.SwedsnusBookmarks?.syncButtons?.();
  }

  function initNavigation() {
    $$('a[href="#"]').forEach(link => {
      if (link.textContent.trim().toLowerCase() === 'kontakt') link.href = 'contact.html';
    });
    $$('a[href="portion.html#gor-eget"], a[href="index.html#gor-eget"], a[href$="#gor-eget"]').forEach(link => {
      link.href = 'gor-eget.html';
    });
  }

  function initVittShowcase() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file !== 'index.html' || $('.vitt-showcase-section')) return;
    const feature = $('.feature-strip-fullbleed');
    if (!feature) return;
    const section = document.createElement('section');
    section.className = 'vitt-showcase-section';
    section.innerHTML = '<div class="vitt-showcase-shell"><div class="vitt-showcase-copy"><span class="vitt-showcase-kicker">Ny produktgrupp</span><h2>Vitt snus</h2><p>En egen yta för kommande tobaksfria produkter.</p><div class="vitt-tag-row"><span>Normal</span><span>Slim</span><span>Mini</span><span>Compact</span><span>Large</span></div><div class="btn-row"><a class="btn btn-primary" href="vitt-snus.html">Se vitt snus</a></div></div><div class="vitt-showcase-track-wrap"><div class="vitt-showcase-track"></div></div></div>';
    feature.parentNode?.insertBefore(section, feature.nextSibling);

    const products = window.SwedsnusProducts;
    const track = $('.vitt-showcase-track', section);
    if (track && products?.rows?.length && products.productCard) {
      track.innerHTML = products.rows
        .filter(row => row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus')
        .slice(0, 6)
        .map(products.productCard)
        .join('');
      requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('swedsnus:products-rendered')));
    }
  }

  function initFilterChips() {
    $$('.filter-bar').forEach(bar => {
      if (bar.dataset.bound === 'true') return;
      bar.dataset.bound = 'true';
      bar.addEventListener('click', event => {
        const chip = event.target.closest('.filter-chip');
        if (!chip) return;
        $$('.filter-chip', bar).forEach(item => item.classList.toggle('active', item === chip));
      });
    });
  }

  function initCarousels() {
    $$('.carousel-header').forEach(header => {
      if ($('.section-heading', header)?.textContent.trim().toLowerCase() === 'nyheter') $('.see-all', header)?.remove();
    });

    $$('.carousel-wrapper').forEach(wrapper => {
      const track = $('.carousel-track', wrapper);
      const outer = $('.carousel-track-outer', wrapper);
      if (!track || !outer) return;
      const prev = $('.carousel-btn-prev', wrapper);
      const next = $('.carousel-btn-next', wrapper);
      let index = Number(wrapper.dataset.carouselIndex || 0);
      let startX = 0;
      let startY = 0;
      let moved = false;
      const visible = () => outer.offsetWidth < 720 ? 2.28 : outer.offsetWidth < 920 ? 4 : 6;
      const gap = () => innerWidth <= 720 ? 10 : 12;
      const width = () => (outer.offsetWidth - gap() * (visible() - 1)) / visible();
      const max = () => Math.max(0, Math.ceil($$('.product-card', track).length - visible()));
      const go = value => {
        index = Math.max(0, Math.min(value, max()));
        wrapper.dataset.carouselIndex = index;
        track.style.transition = 'transform .24s ease';
        track.style.transform = `translateX(-${index * (width() + gap())}px)`;
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index >= max();
      };
      const size = () => {
        const cardWidth = width();
        track.style.gap = `${gap()}px`;
        $$('.product-card', track).forEach(card => {
          card.style.flex = `0 0 ${cardWidth}px`;
          card.style.width = `${cardWidth}px`;
        });
        go(index);
      };

      if (wrapper.dataset.mainCarouselBound !== 'true') {
        prev?.addEventListener('click', () => go(index - 1));
        next?.addEventListener('click', () => go(index + 1));
        outer.addEventListener('touchstart', event => {
          if (!event.touches.length) return;
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
          moved = false;
        }, { passive: true });
        outer.addEventListener('touchmove', event => {
          if (!event.touches.length) return;
          const dx = event.touches[0].clientX - startX;
          const dy = event.touches[0].clientY - startY;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) moved = true;
        }, { passive: true });
        outer.addEventListener('touchend', event => {
          if (!moved) return;
          const dx = event.changedTouches[0].clientX - startX;
          if (Math.abs(dx) > 38) go(index + (dx < 0 ? 1 : -1));
        });
        addEventListener('resize', size);
        wrapper.dataset.mainCarouselBound = 'true';
      }
      size();
    });
  }

  function initProductPage() {
    const quantity = $('.qty-display');
    $('.qty-minus')?.addEventListener('click', () => {
      if (quantity) quantity.value = Math.max(1, parseInt(quantity.value || '1', 10) - 1);
    });
    $('.qty-plus')?.addEventListener('click', () => {
      if (quantity) quantity.value = parseInt(quantity.value || '1', 10) + 1;
    });
    $$('.pack-option').forEach(option => option.addEventListener('click', () => {
      $$('.pack-option').forEach(item => item.classList.toggle('selected', item === option));
      const radio = $('input[type=radio]', option);
      if (radio) radio.checked = true;
      const price = $('.product-detail-price');
      if (price && option.dataset.price) price.innerHTML = `${option.dataset.price} <small>${option.dataset.pack || '1-pack'}</small>`;
    }));
  }

  function bindSupportForms() {
    $$('[data-support-form]').forEach(form => {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';
      form.addEventListener('submit', event => {
        event.preventDefault();
        UI.toast('Kundserviceärende markerat i prototypen');
        form.reset();
      });
    });
  }

  function bindGlobalInteractions() {
    document.addEventListener('change', event => {
      const select = event.target.closest('.pack-select');
      const card = select?.closest('.product-card');
      if (!card) return;
      delete card.dataset.normalized;
      normalizeCard(card);
    });

    document.addEventListener('click', event => {
      if (event.target.closest('[data-demo-action]')) {
        event.preventDefault();
        UI.toast('Funktionen är markerad i prototypen');
        return;
      }
      const card = event.target.closest('.product-card');
      if (card && !event.target.closest('a, button, input, select, textarea, label, .pack-select')) {
        location.href = Records.fromCard(card).href;
      }
    });
  }

  function refreshProducts() {
    normalizeCards();
    initCarousels();
  }

  function init() {
    initNavigation();
    initVittShowcase();
    initFilterChips();
    initCarousels();
    normalizeCards();
    initProductPage();
    bindSupportForms();
    bindGlobalInteractions();
    document.addEventListener('swedsnus:products-rendered', refreshProducts);
    document.addEventListener('swedsnus:bookmarks-rendered', normalizeCards);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();