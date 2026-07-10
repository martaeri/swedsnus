(() => {
  const DATA_URL = 'data/products.json';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = { rows: [], groups: new Map(), series: null, filters: {} };
  const routes = {
    'portion.html': { title: 'Alla portionsprodukter', filter: row => row.product_family === 'Portionssnus' && row.site_section === 'Portionssnus' && row.tobacco_type !== 'Tobaksfri', pills: [['white', 'White Portion', 'Färdigt portionssnus'], ['instant', 'Instant Portion', 'Färdig att snusa'], ['superdry', 'Super Dry', 'Osmaksatt bas']] },
    'los.html': { title: 'Alla lössnusprodukter', filter: row => row.site_section === 'Lössnus' || row.aroma_type === 'Expressarom', pills: [['instant', 'Instant', 'Färdig att snusa'], ['express', 'Express', 'Snussats'], ['aromer', 'Expressaromer', 'Smaksättning']] },
    'gor-eget.html': { title: 'Alla produkter för Gör Eget', filter: row => row.site_section === 'Gör eget' || row.aroma_type === 'Super Dry Arom', pills: [['instant', 'Instant Portion', 'Färdig att snusa'], ['superdry', 'Super Dry', 'Osmaksatt bas'], ['aromer', 'Super Dry Aromer', 'Smaksättning']] },
    'vitt-snus.html': { title: 'Alla tobaksfria produkter', filter: row => row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus', pills: [['rebell', 'Rebell', 'Tobaksfri portion'], ['rx-slim', 'RX Slim', 'Tobaksfri slim'], ['compact-mini', 'Compact & Mini', 'Tobaksfria mindre format']] },
    'tillbehor.html': { title: 'Alla tillbehör', filter: row => row.product_family === 'Tillbehör', pills: [['portion', 'Portionssnus', 'Tillbehör till portionssnus'], ['lossnus', 'Lössnus', 'Tillbehör till lössnus'], ['general', 'Övrigt', 'Övriga tillbehör']] }
  };
  const productPages = new Set(['product-portion.html', 'product-los.html', 'product-arom.html', 'product-tillbehor.html']);

  function page() { return window.location.pathname.split('/').pop() || 'index.html'; }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function slugify(value) { return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produkt'; }
  function split(value) { return String(value || '').split(',').map(item => item.trim()).filter(Boolean); }
  function unique(values) { return [...new Set(values.filter(Boolean).map(value => String(value).trim()))]; }
  function yes(value) { return String(value || '').toLowerCase() !== 'no'; }
  function price(row) { return row.price_sek ? `${Number(row.price_sek).toLocaleString('sv-SE')} kr` : ''; }
  function amount(row) { return row.amount_dosor ? `${row.amount_dosor} dosor` : row.package_quantity ? `${row.package_quantity}-pack` : '1-pack'; }
  function portions(row) { return row.portions_total ? `${row.amount_dosor} dosor (${row.portions_total} portioner)` : amount(row); }
  function name(row) { return row.generated_name || [row.taste_name, row.product_line, row.strength !== 'Normal' ? row.strength : '', row.format, row.grind !== 'Standard' ? row.grind : '', row.amount_dosor ? `${row.amount_dosor} dosor` : ''].filter(Boolean).join(' '); }
  function dots(row) { if (!row.strength) return ''; const level = row.strength === 'Extra Strong' ? 4 : row.strength === 'Strong' ? 3 : 2; return `<div class="strength-bar">${[1, 2, 3, 4].map(index => `<span${index <= level ? ' class="filled"' : ''}></span>`).join('')}</div>`; }

  function groupRows(rows) {
    const groups = new Map();
    rows.filter(row => row.product_id && yes(row.visible_on_site)).forEach(row => {
      if (!groups.has(row.product_id)) groups.set(row.product_id, []);
      groups.get(row.product_id).push(row);
    });
    return groups;
  }

  function representative(group) {
    return group.slice().sort((a, b) => name(a).localeCompare(name(b), 'sv'))[0];
  }

  function series(row) {
    const line = String(row.product_line || '').toLowerCase();
    const family = String(row.product_family || '').toLowerCase();
    const aroma = String(row.aroma_type || '').toLowerCase();
    const format = slugify(row.format || '');
    const text = slugify(`${row.generated_name || ''} ${row.accessory_type || ''}`);
    if (row.tobacco_type === 'Tobaksfri') return format === 'rx-slim' ? 'rx-slim' : ['compact', 'mini'].includes(format) ? 'compact-mini' : format || 'rebell';
    if (family === 'aromer' || aroma.includes('arom')) return 'aromer';
    if (line.includes('super dry')) return 'superdry';
    if (line.includes('instant')) return 'instant';
    if (line.includes('express')) return 'express';
    if (line.includes('white')) return 'white';
    if (family === 'tillbehör' || family === 'tillbehor') return text.includes('los') || text.includes('lossnus') ? 'lossnus' : text.includes('portion') ? 'portion' : 'general';
    return 'product';
  }

  function pageFor(row) {
    if (row.product_family === 'Lössnus') return 'product-los.html';
    if (row.product_family === 'Aromer') return 'product-arom.html';
    if (row.product_family === 'Tillbehör') return 'product-tillbehor.html';
    return 'product-portion.html';
  }

  function meta(row) {
    return [['Typ', row.product_line || row.aroma_type || row.accessory_type], ['Smak', row.taste_display], ['Format', row.format], ['Malningsgrad', row.grind], ['Tobak', row.tobacco_type === 'Tobaksfri' ? 'Tobaksfri' : '']].filter(item => item[1]).slice(0, 3).map(([label, value]) => `<p class="product-card-meta">${escapeHtml(label)}: <span>${escapeHtml(value)}</span></p>`).join('');
  }

  function card(row, group) {
    const href = `${pageFor(row)}?product=${encodeURIComponent(row.product_id)}`;
    return `<div class="product-card" data-product-source="json" data-experience-enhanced="true" data-product-id="${escapeHtml(row.product_id)}" data-series="${escapeHtml(series(row))}" data-taste="${escapeHtml(split(row.taste_variables).join('|'))}" data-type="${escapeHtml(row.product_line || row.aroma_type || row.accessory_type || '')}" data-format="${escapeHtml(row.format || row.grind || row.aroma_type || row.accessory_type || '')}" data-strength="${escapeHtml(row.strength || '')}" data-amount="${escapeHtml(amount(row))}" data-href="${escapeHtml(href)}"><button class="bookmark-toggle requires-login" data-product-id="${escapeHtml(row.product_id)}" type="button" aria-label="Spara produkt" aria-pressed="false">${BOOKMARK_ICON}</button><div class="img-placeholder product">Produktbild</div><div class="product-card-body"><span class="product-card-badge">${escapeHtml(row.format || row.product_line || row.aroma_type || row.accessory_type || 'Produkt')}</span><p class="product-card-name">${escapeHtml(name(row))}</p>${meta(row)}${dots(row)}<div class="product-card-actions"><select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(price(row))}" data-pack="1-pack">1-pack — ${escapeHtml(price(row))}</option></select></div><div class="product-card-bottom"><p class="product-card-price"><span class="unit-price">${escapeHtml(price(row))}</span><small>${group.length > 1 ? `${group.length} varianter` : 'per produkt'}</small></p><button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button></div></div></div>`;
  }

  function buildPills(route) {
    const wrap = $('.category-pills');
    if (!wrap) return;
    wrap.innerHTML = route.pills.map(([value, title, subtitle]) => `<button class="filter-pill" data-series="${escapeHtml(value)}" type="button"><span class="filter-pill-icon"></span><span class="filter-pill-copy"><span class="filter-pill-title">${escapeHtml(title)}</span><span class="filter-pill-subtitle">${escapeHtml(subtitle)}</span></span><span class="filter-pill-close">×</span></button>`).join('');
  }

  function filterGroup(title, key, values) {
    return values.length ? `<div class="sidebar-group" data-filter-group="${escapeHtml(key)}"><h4>${escapeHtml(title)}</h4>${values.map(value => `<label class="sidebar-check"><input type="checkbox" value="${escapeHtml(value)}" />${escapeHtml(value)}</label>`).join('')}</div>` : '';
  }

  function renderSidebar(groups) {
    const values = { taste: [], type: [], format: [], strength: [], amount: [] };
    groups.forEach(group => group.forEach(row => {
      values.taste.push(...split(row.taste_variables));
      values.type.push(row.product_line || row.aroma_type || row.accessory_type);
      values.format.push(row.format || row.grind || row.aroma_type || row.accessory_type);
      values.strength.push(row.strength);
      values.amount.push(amount(row));
    }));
    const sidebar = $('.filter-sidebar');
    if (sidebar) sidebar.innerHTML = filterGroup('Smak', 'taste', unique(values.taste).sort()) + filterGroup('Typ', 'type', unique(values.type).sort()) + filterGroup('Format', 'format', unique(values.format).sort()) + filterGroup('Styrka', 'strength', unique(values.strength).sort()) + filterGroup('Mängd', 'amount', unique(values.amount).sort());
  }

  function applyFilters() {
    const cards = $$('.catalog-page .product-card');
    const count = $('.catalog-count');
    const empty = $('.catalog-empty');
    let visible = 0;
    cards.forEach(card => {
      const seriesMatch = !state.series || card.dataset.series === state.series;
      const filterMatch = Object.entries(state.filters).every(([key, selected]) => {
        if (!selected.size) return true;
        const value = card.dataset[key] || '';
        return key === 'taste' ? [...selected].some(item => value.split('|').includes(item)) : selected.has(value);
      });
      const show = seriesMatch && filterMatch;
      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? 'produkt' : 'produkter'}`;
    if (empty) empty.classList.toggle('show', visible === 0);
  }

  function bindFilters() {
    $$('.filter-pill[data-series]').forEach(button => button.addEventListener('click', () => {
      state.series = state.series === button.dataset.series ? null : button.dataset.series;
      $$('.filter-pill[data-series]').forEach(item => item.classList.toggle('active', state.series === item.dataset.series));
      applyFilters();
    }));
    $$('.filter-sidebar [data-filter-group]').forEach(group => {
      const key = group.dataset.filterGroup;
      state.filters[key] = new Set();
      $$('input', group).forEach(input => input.addEventListener('change', () => {
        state.filters[key] = new Set($$('input:checked', group).map(item => item.value));
        applyFilters();
      }));
    });
  }

  function renderCatalog() {
    const route = routes[page()];
    const grid = $('.catalog-page .product-grid');
    if (!route || !grid) return;
    const groups = groupRows(state.rows.filter(route.filter));
    buildPills(route);
    renderSidebar(groups);
    grid.innerHTML = [...groups.values()].map(group => card(representative(group), group)).join('');
    const header = $('.catalog-results-header span:first-child');
    if (header) header.innerHTML = `<strong>${escapeHtml(route.title)}</strong>`;
    state.series = null;
    state.filters = {};
    bindFilters();
    applyFilters();
  }

  function fields(row) {
    if (row.product_family === 'Lössnus') return [['amount', 'Mängd'], ['grind', 'Malningsgrad'], ['strength', 'Styrka']];
    if (row.product_family === 'Aromer') return [['aroma_type', 'Typ']];
    if (row.product_family === 'Tillbehör') return [];
    return [['format', 'Format'], ['amount', 'Portioner'], ['strength', 'Styrka']];
  }

  function value(row, field) { return field === 'amount' ? amount(row) : row[field] || ''; }
  function match(group, selected) { return group.find(row => Object.entries(selected).every(([key, val]) => !val || value(row, key) === val)) || group[0]; }

  function renderDetail(row) {
    const detail = $('.product-detail');
    if (!detail || !row) return;
    const title = $('[data-product-title]', detail) || $('h1', detail);
    if (title) title.textContent = name(row);
    document.title = `${name(row)} — Swedsnus`;
    const breadcrumb = $('[data-product-breadcrumb]');
    if (breadcrumb) breadcrumb.textContent = name(row);
    const badge = $('.product-detail-badge', detail);
    if (badge) badge.innerHTML = `<span class="product-card-badge">${escapeHtml(row.format || row.product_line || row.aroma_type || row.accessory_type || row.product_family)}</span>${row.tobacco_type === 'Tobaksfri' ? '<span class="product-card-badge" style="background:var(--color-accent);">Tobaksfri</span>' : ''}`;
    const priceEl = $('.product-detail-price', detail);
    if (priceEl) priceEl.innerHTML = `${escapeHtml(price(row))} <small>1-pack</small>`;
    const desc = $('.product-desc', detail);
    if (desc) desc.textContent = row.short_description || `${name(row)} visas från produktdatan.`;
    const metaRows = [['Typ', row.product_line || row.aroma_type || row.accessory_type || row.product_family], ['Smak', row.taste_display], ['Format', row.format], ['Malningsgrad', row.grind], ['Styrka', row.strength], ['Tobak', row.tobacco_type === 'Tobaksfri' ? 'Tobaksfri' : ''], ['Tillverkning', row.manufacturing_location]];
    const metaEl = $('.product-detail-meta', detail);
    if (metaEl) metaEl.innerHTML = metaRows.filter(item => item[1]).slice(0, 5).map(([label, val]) => `<div class="product-detail-meta-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(val)}</dd></div>`).join('');
    const specRows = [['Produktlinje', row.product_line], ['Aromtyp', row.aroma_type], ['Tillbehörstyp', row.accessory_type], ['Tobakstyp', row.tobacco_type && row.tobacco_type !== 'Ej tillämpligt' ? row.tobacco_type : ''], ['Format', [row.format, row.format_dimensions].filter(Boolean).join(', ')], ['Fyllnad', row.fill_level], ['Smak', row.taste_display], ['Malningsgrad', row.grind], ['Styrka', [row.strength, row.strength_mg_g].filter(Boolean).join(', ')], ['Nikotinhalt', row.nicotine_per_portion], ['Förpackningsstorlek', row.portions_total ? portions(row) : row.amount_dosor ? amount(row) : ''], ['Hållbarhet', row.shelf_life], ['Tillverkningsort', row.manufacturing_location]];
    const spec = $('.product-spec-table tbody', detail);
    if (spec) spec.innerHTML = specRows.filter(item => item[1]).map(([label, val]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(val)}</td></tr>`).join('');
    const pack = $('.pack-picker-options', detail);
    if (pack) pack.innerHTML = `<label class="pack-option selected" data-price="${escapeHtml(price(row))}" data-pack="1-pack"><input type="radio" name="pack" value="1" checked /><span class="pack-option-label">1-pack</span><span class="pack-option-price">${escapeHtml(price(row))}</span><span class="pack-option-per">${escapeHtml(price(row))}/st</span></label>`;
  }

  function renderProductPage() {
    if (!productPages.has(page())) return;
    const productId = new URLSearchParams(window.location.search).get('product');
    const fallback = page() === 'product-los.html' ? row => row.product_family === 'Lössnus' : page() === 'product-arom.html' ? row => row.product_family === 'Aromer' : page() === 'product-tillbehor.html' ? row => row.product_family === 'Tillbehör' : row => row.product_family === 'Portionssnus';
    const group = productId ? state.groups.get(productId) : [...state.groups.values()].find(items => items.some(fallback));
    if (!group?.length) return;
    const detail = $('.product-detail');
    const productFields = fields(group[0]);
    let panel = $('.product-choice-panel', detail);
    const selected = {};
    if (productFields.length) {
      if (!panel) { panel = document.createElement('section'); panel.className = 'product-choice-panel'; $('.pack-picker-label', detail)?.insertAdjacentElement('beforebegin', panel); }
      panel.innerHTML = `<p class="product-choice-panel-title">Produktval</p><div class="product-choice-grid">${productFields.map(([key, label]) => `<div class="product-choice-field"><label>${escapeHtml(label)}</label><select data-data-field="${escapeHtml(key)}"></select></div>`).join('')}</div>`;
      const update = changed => {
        productFields.forEach(([key]) => { const select = $(`[data-data-field="${key}"]`, panel); if (select && changed === key) selected[key] = select.value; });
        productFields.forEach(([key]) => {
          const select = $(`[data-data-field="${key}"]`, panel);
          const options = unique(group.filter(row => Object.entries(selected).every(([field, val]) => field === key || !val || value(row, field) === val)).map(row => value(row, key)));
          const previous = select.value;
          select.innerHTML = options.map(option => `<option${option === previous ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('');
          if (!options.includes(previous)) select.value = options[0] || '';
          selected[key] = select.value;
        });
        renderDetail(match(group, selected));
      };
      productFields.forEach(([key]) => $(`[data-data-field="${key}"]`, panel)?.addEventListener('change', () => update(key)));
      update(null);
    } else {
      panel?.remove();
      renderDetail(group[0]);
    }
  }

  function renderIndex() {
    if (page() !== 'index.html') return;
    const groups = [...state.groups.values()];
    const track = $('.carousel-track');
    if (track) track.innerHTML = groups.slice(0, 8).map(group => card(representative(group), group)).join('');
    const showcase = $('.vitt-showcase-track');
    if (showcase) showcase.innerHTML = groups.filter(group => group.some(row => row.tobacco_type === 'Tobaksfri')).slice(0, 3).map(group => card(representative(group), group)).join('');
  }

  async function init() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });
      state.rows = await response.json();
      state.groups = groupRows(state.rows);
      window.SwedsnusProducts = { rows: state.rows, groups: state.groups };
      renderCatalog();
      renderProductPage();
      renderIndex();
      document.dispatchEvent(new CustomEvent('swedsnus:products-rendered'));
    } catch (error) {
      document.documentElement.classList.add('product-data-load-failed');
      console.error(error);
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
