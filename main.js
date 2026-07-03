(function () {
  document.querySelectorAll('a[href="portion.html#gor-eget"]').forEach(link => {
    link.setAttribute('href', 'gor-eget.html');
  });
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  if (currentFile === 'portion.html' && window.location.hash === '#gor-eget') {
    window.location.replace('gor-eget.html');
  }
})();

(function () {
  const saved = localStorage.getItem('swedsnus-theme') || '1';
  if (saved !== '1') document.documentElement.className = `theme-${saved}`;
  document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === saved);
    dot.addEventListener('click', () => {
      const theme = dot.dataset.theme;
      document.documentElement.className = theme === '1' ? '' : `theme-${theme}`;
      document.querySelectorAll('.theme-dot').forEach(item => item.classList.toggle('active', item === dot));
      localStorage.setItem('swedsnus-theme', theme);
    });
  });
})();

const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    document.querySelector('.subheader')?.classList.toggle('mobile-open');
    document.querySelector('.main-nav')?.classList.toggle('mobile-open');
  });
}

(function () {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.subheader-inner a, .subnav-inner a, .main-nav a').forEach(link => {
    const href = (link.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (href && href === current) link.classList.add('active');
  });
})();

document.querySelectorAll('.filter-bar').forEach(bar => {
  bar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

document.querySelectorAll('.filter-sidebar li').forEach(item => {
  item.addEventListener('click', () => {
    item.closest('.filter-sidebar')?.querySelectorAll('li').forEach(link => link.classList.remove('active'));
    item.classList.add('active');
  });
});

(function () {
  document.querySelectorAll('[data-catalog-filter]').forEach(catalog => {
    const buttons = catalog.querySelectorAll('.filter-pill[data-series]');
    const cards = catalog.querySelectorAll('.product-card[data-series]');
    const count = catalog.querySelector('.catalog-count');
    const empty = catalog.querySelector('.catalog-empty');

    function update(selected) {
      let visible = 0;
      cards.forEach(card => {
        const match = !selected || card.dataset.series === selected;
        card.classList.toggle('is-hidden', !match);
        if (match) visible += 1;
      });
      if (count) count.textContent = `${visible} produkter`;
      if (empty) empty.classList.toggle('show', visible === 0);
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const alreadyActive = button.classList.contains('active');
        buttons.forEach(item => item.classList.remove('active'));
        if (alreadyActive) {
          update(null);
        } else {
          button.classList.add('active');
          update(button.dataset.series);
        }
      });
    });

    update(null);
  });
})();

document.querySelectorAll('.sub-tabs').forEach(group => {
  group.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.sub-tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      if (target) {
        const container = group.closest('section') || document.body;
        container.querySelectorAll('[data-panel]').forEach(panel => {
          panel.style.display = panel.dataset.panel === target ? '' : 'none';
        });
      }
    });
  });
});

(function () {
  const sections = document.querySelectorAll('.guide-section[data-section]');
  if (!sections.length) return;
  sections.forEach((section, index) => { section.style.display = index === 0 ? '' : 'none'; });
  const firstTab = document.querySelector('.guide-tabs .sub-tab');
  if (firstTab) firstTab.classList.add('active');
  document.querySelectorAll('.guide-tabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      sections.forEach(section => { section.style.display = section.dataset.section === target ? '' : 'none'; });
    });
  });
})();

document.querySelectorAll('.hero-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.hero-tab').forEach(item => item.classList.remove('active'));
    tab.classList.add('active');
    const href = tab.dataset.href;
    if (href) window.location.href = href;
  });
});

document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.carousel-track');
  const outer = wrapper.querySelector('.carousel-track-outer');
  const btnPrev = wrapper.querySelector('.carousel-btn-prev');
  const btnNext = wrapper.querySelector('.carousel-btn-next');
  if (!track || !outer) return;

  let current = 0;

  function visibleCount() {
    const width = outer.offsetWidth;
    if (width < 440) return 1;
    if (width < 680) return 2;
    if (width < 920) return 4;
    return 6;
  }

  function gapSize() {
    return window.innerWidth <= 720 ? 10 : 12;
  }

  function cardWidth() {
    const cards = track.querySelectorAll('.product-card');
    if (!cards.length) return 0;
    const gap = gapSize();
    const visible = visibleCount();
    return (outer.offsetWidth - gap * (visible - 1)) / visible;
  }

  function totalCards() {
    return track.querySelectorAll('.product-card').length;
  }

  function maxIndex() {
    return Math.max(0, totalCards() - visibleCount());
  }

  function go(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    const width = cardWidth();
    const gap = gapSize();
    track.style.transform = `translateX(-${current * (width + gap)}px)`;
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current >= maxIndex();
  }

  function sizeCards() {
    const width = cardWidth();
    track.style.gap = `${gapSize()}px`;
    track.querySelectorAll('.product-card').forEach(card => {
      card.style.flex = `0 0 ${width}px`;
      card.style.width = `${width}px`;
    });
    go(current);
  }

  window.addEventListener('resize', sizeCards);
  sizeCards();

  if (btnPrev) btnPrev.addEventListener('click', () => go(current - 1));
  if (btnNext) btnNext.addEventListener('click', () => go(current + 1));

  let startX = 0;
  let startY = 0;
  let dragging = false;

  track.addEventListener('pointerdown', event => {
    startX = event.clientX;
    startY = event.clientY;
    dragging = true;
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) event.preventDefault();
  }, { passive: false });

  track.addEventListener('pointerup', event => {
    if (!dragging) return;
    dragging = false;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
  });

  track.addEventListener('pointercancel', () => { dragging = false; });
});

document.querySelectorAll('.pack-select').forEach(select => {
  select.addEventListener('change', () => {
    const card = select.closest('.product-card');
    if (!card) return;
    const option = select.options[select.selectedIndex];
    const price = card.querySelector('.product-card-price');
    if (price && option.dataset.price) {
      price.innerHTML = `${option.dataset.price} <small>${option.dataset.pack || ''}</small>`;
    }
  });
});

const cartCountEl = document.querySelector('.cart-count');
let cartCount = 0;

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function addToCart(button) {
  cartCount += 1;
  if (cartCountEl) cartCountEl.textContent = cartCount;
  document.querySelectorAll('.cart-panel-count').forEach(item => item.textContent = `${cartCount} ${cartCount === 1 ? 'artikel' : 'artiklar'}`);
  button.classList.add('added');
  setTimeout(() => button.classList.remove('added'), 1000);
  showToast('Tillagd i kundvagnen');
}

document.querySelectorAll('.add-to-cart-btn').forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    addToCart(button);
  });
});

const mainCartBtn = document.querySelector('.add-to-cart-main .btn-primary');
if (mainCartBtn) {
  mainCartBtn.addEventListener('click', () => showToast('Tillagd i kundvagnen'));
}

const qtyDisplay = document.querySelector('.qty-display');
if (qtyDisplay) {
  document.querySelector('.qty-minus')?.addEventListener('click', () => {
    const value = Math.max(1, parseInt(qtyDisplay.value || qtyDisplay.textContent, 10) - 1);
    qtyDisplay.value !== undefined ? (qtyDisplay.value = value) : (qtyDisplay.textContent = value);
  });
  document.querySelector('.qty-plus')?.addEventListener('click', () => {
    const value = parseInt(qtyDisplay.value || qtyDisplay.textContent, 10) + 1;
    qtyDisplay.value !== undefined ? (qtyDisplay.value = value) : (qtyDisplay.textContent = value);
  });
}

document.querySelectorAll('.pack-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.pack-option').forEach(item => item.classList.remove('selected'));
    option.classList.add('selected');
    const radio = option.querySelector('input[type=radio]');
    if (radio) radio.checked = true;
    const price = option.dataset.price;
    const priceEl = document.querySelector('.product-detail-price');
    if (price && priceEl) priceEl.innerHTML = `${price} <small>${option.dataset.pack || '1-pack'}</small>`;
  });
});

document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', event => {
    if (event.target.closest('.pack-select') || event.target.closest('.add-to-cart-btn') || event.target.closest('.filter-pill')) return;
    const href = card.dataset.href || 'product.html';
    window.location.href = href;
  });
});
