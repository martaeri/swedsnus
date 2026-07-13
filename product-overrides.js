(() => {
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const AUTH_KEY = 'swedsnus-demo-session';
  const OVERRIDES_URL = 'data/product-overrides.json';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let applied = false;

  function loggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function visible(row) { return String(row.visible_on_site || 'Yes').toLowerCase() !== 'no'; }
  function unique(values) { return [...new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean))]; }
  function page() { return location.pathname.split('/').pop() || 'index.html'; }
  function readBookmarks() {
    try {
      const value = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }
  function updateSavedBadges() {
    const count = loggedIn() ? readBookmarks().length : 0;
    $$('a[href="bookmarks.html"]').forEach(link => {
      link.style.position = link.style.position || 'relative';
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
  function rowKey(row) { return window.SwedsnusProducts?.rowKey ? window.SwedsnusProducts.rowKey(row) : `${row.product_id}__${row.variant_id || row.sku_draft || row.generated_name}`; }
  function rowUrl(row) { return window.SwedsnusProducts?.urlFor ? window.SwedsnusProducts.urlFor(row) : `product.html?id=${encodeURIComponent(rowKey(row))}`; }
  function rowSeries(row) {
    const value = String(row.compatible_with || '').toLowerCase();
    if (value.includes('portion')) return 'portion';
    if (value.includes('lös') || value.includes('los')) return 'lossnus';
    return 'general';
  }
  function cleanRows(rows) { return rows.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== ''); }
  function mm(value) { return value !== null && value !== undefined && String(value).trim() !== '' ? `${value} mm` : ''; }

  async function loadOverrides() {
    const api = window.SwedsnusProducts;
    if (!api?.rows?.length || applied) return;
    applied = true;
    let overrides = [];
    try {
      const response = await fetch(OVERRIDES_URL, { cache: 'no-cache' });
      if (response.ok) overrides = (await response.json()).overrides || [];
    } catch (error) {
      overrides = [];
    }
    if (!overrides.length) return;
    const byProduct = new Map(overrides.map(row => [String(row.product_id), row]));
    const byArticle = new Map(overrides.map(row => [String(row.article_number), row]));
    api.rows.forEach(row => {
      const override = byProduct.get(String(row.product_id)) || byArticle.get(String(row.article_number));
      if (override) Object.assign(row, override);
    });
    rebuildAccessories();
    updateAccessoryCards();
    renderAccessoryDetail();
    api.syncExistingProductLinks?.();
    updateSavedBadges();
  }

  function updateAccessoryCards() {
    $$('.product-card').forEach(card => {
      const api = window.SwedsnusProducts;
      const row = api?.findRow?.({
        id: card.dataset.productId,
        href: card.dataset.href,
        name: $('.product-card-name', card)?.textContent?.trim()
      });
      if (!row || row.product_family !== 'Tillbehör') return;
      const href = rowUrl(row);
      card.dataset.href = href;
      card.dataset.productId = rowKey(row);
      card.dataset.series = rowSeries(row);
      card.dataset.type = row.accessory_type || '';
      card.dataset.color = row.filter_color || row.design_color || '';
      card.dataset.material = row.material || '';
      $('.product-card-main-link', card)?.setAttribute('href', href);
      const name = $('.product-card-name', card);
      if (name) name.textContent = row.generated_name || row.accessory_name || row.accessory_type || 'Tillbehör';
      const badge = $('.product-card-badge', card);
      if (badge) badge.textContent = row.accessory_type || 'Tillbehör';
      $$('.bookmark-toggle', card).forEach(button => { button.dataset.productId = rowKey(row); });
    });
  }

  function filterBlock(title, key, values) {
    return values.length ? `<div class="sidebar-group" data-accessory-filter="${escapeHtml(key)}"><h4>${escapeHtml(title)}</h4>${values.map(value => `<label class="sidebar-check"><input type="checkbox" value="${escapeHtml(value)}" />${escapeHtml(value)}</label>`).join('')}</div>` : '';
  }

  function rebuildAccessories() {
    if (page() !== 'tillbehor.html') return;
    const api = window.SwedsnusProducts;
    const grid = $('.catalog-page .product-grid');
    if (!api?.rows?.length || !grid || !api.productCard) return;
    const rows = api.rows.filter(row => row.product_family === 'Tillbehör' && visible(row));
    grid.innerHTML = rows.map(row => api.productCard(row)).join('');
    updateAccessoryCards();
    const sidebar = $('.filter-sidebar');
    if (sidebar) {
      sidebar.innerHTML =
        filterBlock('Typ', 'type', unique(rows.map(row => row.accessory_type)).sort()) +
        filterBlock('Färg', 'color', unique(rows.map(row => row.filter_color || row.design_color)).sort()) +
        filterBlock('Material', 'material', unique(rows.map(row => row.material)).sort());
      bindAccessoryFilters(grid);
    }
    updateCount(rows.length);
  }

  function updateCount(count) {
    const element = $('.catalog-count');
    if (element) element.textContent = `${count} ${count === 1 ? 'produkt' : 'produkter'}`;
    $('.catalog-empty')?.classList.toggle('show', count === 0);
  }

  function bindAccessoryFilters(grid) {
    const groups = $$('[data-accessory-filter]');
    groups.forEach(group => {
      $$('input', group).forEach(input => input.addEventListener('change', () => {
        const selected = Object.fromEntries(groups.map(item => [item.dataset.accessoryFilter, new Set($$('input:checked', item).map(box => box.value))]));
        let shown = 0;
        $$('.product-card', grid).forEach(card => {
          const ok = Object.entries(selected).every(([key, values]) => !values.size || values.has(card.dataset[key] || ''));
          card.classList.toggle('is-hidden', !ok);
          if (ok) shown += 1;
        });
        updateCount(shown);
      }));
    });
  }

  function renderAccessoryDetail() {
    if (page() !== 'product.html') return;
    const api = window.SwedsnusProducts;
    const id = new URLSearchParams(location.search).get('id') || '';
    const row = api?.rows?.find(item => rowKey(item) === id);
    if (!row || row.product_family !== 'Tillbehör') return;
    const detail = $('.product-detail');
    if (!detail) return;
    const name = row.generated_name || row.accessory_name || 'Tillbehör';
    const group = api.rows.filter(item => item.product_family === 'Tillbehör' && item.accessory_name && item.accessory_name === row.accessory_name && visible(item));
    const title = $('[data-product-title]', detail) || $('h1', detail);
    if (title) title.textContent = name;
    const breadcrumb = $('[data-product-breadcrumb]');
    if (breadcrumb) breadcrumb.textContent = name;
    document.title = `${name} — Swedsnus`;
    const metaRows = cleanRows([
      ['Typ', row.accessory_type],
      ['Färg', row.design_color || row.filter_color],
      ['Material', row.material],
      ['Diameter', mm(row.diameter)],
      ['Höjd', mm(row.height)]
    ]);
    const meta = $('.product-detail-meta', detail);
    if (meta) meta.innerHTML = metaRows.map(([label, value]) => `<div class="product-detail-meta-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
    const spec = $('.product-spec-table tbody', detail);
    if (spec) spec.innerHTML = metaRows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
    const panel = $('.product-choice-panel', detail);
    const designRows = group.filter(item => item.design_color);
    if (panel) {
      panel.innerHTML = designRows.length ? `<p class="product-choice-panel-title">Produktval</p><div class="product-choice-grid"><div class="product-choice-field"><label>Design</label><select data-accessory-design>${designRows.map(item => `<option value="${escapeHtml(rowKey(item))}"${rowKey(item) === rowKey(row) ? ' selected' : ''}>${escapeHtml(item.design_color)}</option>`).join('')}</select></div></div>` : '';
      $('[data-accessory-design]', panel)?.addEventListener('change', event => {
        const target = api.rows.find(item => rowKey(item) === event.target.value);
        if (target) location.href = rowUrl(target);
      });
    }
    const desc = $('.product-desc', detail);
    if (desc && !desc.textContent.trim()) desc.remove();
  }

  function run() {
    updateSavedBadges();
    loadOverrides();
  }

  document.addEventListener('swedsnus:products-rendered', () => setTimeout(run, 0));
  document.addEventListener('click', event => {
    if (event.target.closest('.bookmark-toggle, .add-to-cart-btn, [data-cart-action], [data-auth-form], [data-logout]')) setTimeout(updateSavedBadges, 80);
  });
  window.addEventListener('storage', updateSavedBadges);
  window.addEventListener('focus', updateSavedBadges);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
})();
