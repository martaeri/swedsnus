/* ============================================================
   SWEDSNUS — main.js
   ============================================================ */

/* ── Theme Switcher ── */
(function () {
  const saved = localStorage.getItem('swedsnus-theme') || '1';
  if (saved !== '1') document.documentElement.className = `theme-${saved}`;
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === saved);
    d.addEventListener('click', () => {
      const t = d.dataset.theme;
      document.documentElement.className = t === '1' ? '' : `theme-${t}`;
      document.querySelectorAll('.theme-dot').forEach(x => x.classList.toggle('active', x === d));
      localStorage.setItem('swedsnus-theme', t);
    });
  });
})();

/* ── Mobile Nav Toggle ── */
const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const sh = document.querySelector('.subheader');
    if (sh) sh.classList.toggle('mobile-open');
  });
}

/* ── Active nav highlighting ── */
(function () {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.subheader-inner a, .subnav-inner a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (href && href === current) a.classList.add('active');
  });
})();

/* ── Filter Chips ── */
document.querySelectorAll('.filter-bar').forEach(bar => {
  bar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

/* ── Filter Sidebar ── */
document.querySelectorAll('.filter-sidebar li').forEach(item => {
  item.addEventListener('click', () => {
    item.closest('.filter-sidebar').querySelectorAll('li').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ── Sub-Tabs ── */
document.querySelectorAll('.sub-tabs').forEach(group => {
  group.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      if (target) {
        const container = group.closest('section') || document.body;
        container.querySelectorAll('[data-panel]').forEach(p => {
          p.style.display = p.dataset.panel === target ? '' : 'none';
        });
      }
    });
  });
});

/* ── Guide Tabs ── */
(function () {
  const sections = document.querySelectorAll('.guide-section[data-section]');
  if (!sections.length) return;
  sections.forEach((s, i) => { s.style.display = i === 0 ? '' : 'none'; });
  const firstTab = document.querySelector('.guide-tabs .sub-tab');
  if (firstTab) firstTab.classList.add('active');
  document.querySelectorAll('.guide-tabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      sections.forEach(s => { s.style.display = s.dataset.section === target ? '' : 'none'; });
    });
  });
})();

/* ── Hero Tabs ── */
document.querySelectorAll('.hero-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.hero-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const href = tab.dataset.href;
    if (href) window.location.href = href;
  });
});

/* ============================================================
   CAROUSEL
   ============================================================ */
document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const track  = wrapper.querySelector('.carousel-track');
  const outer  = wrapper.querySelector('.carousel-track-outer');
  const btnPrev = wrapper.querySelector('.carousel-btn-prev');
  const btnNext = wrapper.querySelector('.carousel-btn-next');
  if (!track) return;

  let current = 0;

  function visibleCount() {
    const w = outer.offsetWidth;
    if (w < 480) return 1;
    if (w < 720) return 2;
    if (w < 1000) return 3;
    return 4;
  }

  function cardWidth() {
    const cards = track.querySelectorAll('.product-card');
    if (!cards.length) return 0;
    const gap = 16; // 1rem
    const vis = visibleCount();
    return (outer.offsetWidth - gap * (vis - 1)) / vis;
  }

  function totalCards() { return track.querySelectorAll('.product-card').length; }

  function maxIndex() { return Math.max(0, totalCards() - visibleCount()); }

  function go(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));
    const cw = cardWidth();
    const gap = 16;
    track.style.transform = `translateX(-${current * (cw + gap)}px)`;
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current >= maxIndex();
  }

  // Size cards explicitly so CSS flex % doesn't fight us
  function sizeCards() {
    const cw = cardWidth();
    track.querySelectorAll('.product-card').forEach(c => {
      c.style.flex = `0 0 ${cw}px`;
      c.style.width = `${cw}px`;
    });
    go(current); // re-clamp and repaint
  }

  window.addEventListener('resize', sizeCards);
  sizeCards();

  if (btnPrev) btnPrev.addEventListener('click', () => go(current - 1));
  if (btnNext) btnNext.addEventListener('click', () => go(current + 1));

  /* Touch / swipe */
  let startX = 0, startY = 0, dragging = false;
  track.addEventListener('pointerdown', e => {
    startX = e.clientX; startY = e.clientY; dragging = true;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    // Only hijack horizontal swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) e.preventDefault();
  }, { passive: false });
  track.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
  });
  track.addEventListener('pointercancel', () => { dragging = false; });
});

/* ============================================================
   PACK SELECT — update displayed price label on card
   ============================================================ */
document.querySelectorAll('.pack-select').forEach(sel => {
  sel.addEventListener('change', () => {
    const card = sel.closest('.product-card');
    if (!card) return;
    const opt = sel.options[sel.selectedIndex];
    const priceEl = card.querySelector('.product-card-price');
    if (priceEl && opt.dataset.price) {
      priceEl.innerHTML = `${opt.dataset.price} <small>${opt.dataset.pack}</small>`;
    }
  });
});

/* ============================================================
   ADD TO CART (demo)
   ============================================================ */
const cartCountEl = document.querySelector('.cart-count');
let cartCount = 0;

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function addToCart(btn) {
  cartCount++;
  if (cartCountEl) cartCountEl.textContent = cartCount;
  btn.classList.add('added');
  setTimeout(() => btn.classList.remove('added'), 1200);
  showToast('Tillagd i kundvagnen ✓');
}

document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation(); // don't navigate to product page
    addToCart(btn);
  });
});

/* Product page main add-to-cart */
const mainCartBtn = document.querySelector('.add-to-cart-main .btn-primary');
if (mainCartBtn) {
  mainCartBtn.addEventListener('click', () => showToast('Tillagd i kundvagnen ✓'));
}

/* ── Qty buttons on product page ── */
const qtyDisplay = document.querySelector('.qty-display');
if (qtyDisplay) {
  document.querySelector('.qty-minus')?.addEventListener('click', () => {
    const v = Math.max(1, parseInt(qtyDisplay.value || qtyDisplay.textContent) - 1);
    qtyDisplay.value !== undefined ? (qtyDisplay.value = v) : (qtyDisplay.textContent = v);
  });
  document.querySelector('.qty-plus')?.addEventListener('click', () => {
    const v = parseInt(qtyDisplay.value || qtyDisplay.textContent) + 1;
    qtyDisplay.value !== undefined ? (qtyDisplay.value = v) : (qtyDisplay.textContent = v);
  });
}

/* ── Pack options on product page ── */
document.querySelectorAll('.pack-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.pack-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    opt.querySelector('input[type=radio]').checked = true;
    // Update main price display
    const price = opt.dataset.price;
    const priceEl = document.querySelector('.product-detail-price');
    if (price && priceEl) {
      const pack = opt.dataset.pack || '1-pack';
      priceEl.innerHTML = `${price} <small>${pack}</small>`;
    }
  });
});

/* ── Navigate to product page on card click ── */
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', e => {
    // Don't navigate if user clicked the select or cart button
    if (e.target.closest('.pack-select') || e.target.closest('.add-to-cart-btn')) return;
    const href = card.dataset.href || 'product.html';
    window.location.href = href;
  });
});
