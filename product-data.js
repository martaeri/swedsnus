(() => {
  if (window.__swedsnusProductDataLoaded) return;
  window.__swedsnusProductDataLoaded = true;

  const DATA_URL = 'data/products.json';
  const CART_KEY = 'swedsnus-cart';
  const BOOKMARKS_KEY = 'swedsnus-bookmarks';
  const PRODUCT_PAGE = 'product.html';
  const CART_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const BOOKMARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];
  const state = { rows: [], groups: new Map(), series: null, filters: {} };

  const routes = {
    'portion.html': { title: 'Alla portionsprodukter', filter: row => row.product_family === 'Portionssnus' && row.site_section === 'Portionssnus' && row.tobacco_type !== 'Tobaksfri', pills: [['white', 'White Portion', 'Färdigt portionssnus'], ['instant', 'Instant Portion', 'Färdig att snusa'], ['superdry', 'Super Dry', 'Osmaksatt bas']] },
    'los.html': { title: 'Alla lössnusprodukter', filter: row => row.product_family === 'Lössnus' || row.aroma_type === 'Expressarom', pills: [['instant', 'Instant', 'Färdig att snusa'], ['express', 'Express', 'Snussats'], ['aromer', 'Expressaromer', 'Smaksättning']] },
    'gor-eget.html': { title: 'Alla produkter för Gör Eget', filter: row => row.site_section === 'Gör eget' || row.aroma_type === 'Super Dry Arom', pills: [['instant', 'Instant Portion', 'Färdig att snusa'], ['superdry', 'Super Dry', 'Osmaksatt bas'], ['aromer', 'Super Dry Aromer', 'Smaksättning']] },
    'vitt-snus.html': { title: 'Alla tobaksfria produkter', filter: row => row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus', pills: [['rebell', 'Rebell', 'Tobaksfri portion'], ['rx-slim', 'RX Slim', 'Tobaksfri slim'], ['compact-mini', 'Compact & Mini', 'Tobaksfria mindre format']] },
    'tillbehor.html': { title: 'Alla tillbehör', filter: row => row.product_family === 'Tillbehör', pills: [['portion', 'Portionssnus', 'Tillbehör till portionssnus'], ['lossnus', 'Lössnus', 'Tillbehör till lössnus'], ['general', 'Övrigt', 'Övriga tillbehör']] }
  };

  const page = () => {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file.includes('.')) return file;

    const aliases = {
        '': 'index.html',
        index: 'index.html',
        portion: 'portion.html',
        los: 'los.html',
        'gor-eget': 'gor-eget.html',
        'vitt-snus': 'vitt-snus.html',
        tillbehor: 'tillbehor.html',
        product: 'product.html'
    };

  return aliases[file] || `${file}.html`;
  };
  const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const slugify = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produkt';
  const splitList = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  const unique = values => [...new Set(values.filter(value => value !== null && value !== undefined && value !== '').map(value => String(value).trim()))];
  const visible = row => row.product_id && String(row.visible_on_site || 'Yes').toLowerCase() !== 'no';
  const amount = row => row.amount_dosor ? `${row.amount_dosor} dosor` : row.package_quantity ? `${row.package_quantity}-pack` : '';
  const price = row => row.price_sek ? `${Number(row.price_sek).toLocaleString('sv-SE')} kr` : '';
  const mm = value => value !== null && value !== undefined && String(value).trim() !== '' ? `${value} mm` : '';
  const cleanRows = rows => rows.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');

  function name(row) {
    if (row.product_family === 'Tillbehör' && row.accessory_name) return [row.accessory_name, row.design_color].filter(Boolean).join(' - ');
    return row.generated_name || [row.taste_name, row.product_line, row.strength !== 'Normal' ? row.strength : '', row.format, row.grind && row.grind !== 'Standard' ? row.grind : '', amount(row)].filter(Boolean).join(' ');
  }

  function rowKey(row) { return `${row.product_id}__${row.variant_id || row.sku_draft || slugify(name(row))}`; }
  function urlFor(row) { return `${PRODUCT_PAGE}?id=${encodeURIComponent(rowKey(row))}`; }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  function decodeValue(value, dict) {
    if (value === '') return null;
    if (String(value).startsWith('~')) return dict[Number(String(value).slice(1))] ?? null;
    const decoded = decodeURIComponent(String(value));
    return /^-?\d+(\.\d+)?$/.test(decoded) ? Number(decoded) : decoded;
  }

  function parseTsv(tsv) {
    const lines = String(tsv || '').trim().split('\n').filter(Boolean);
    if (!lines.length) return [];
    const headers = lines.shift().split('\t');
    return lines.map(line => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index] || null])));
  }

  function expandData(data) {
    if (Array.isArray(data)) return data;
    if (data?.tsv) return parseTsv(data.tsv);
    if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) return data.rows.map(row => Object.fromEntries(data.headers.map((header, index) => [header, row[index] ?? null])));
    if (Array.isArray(data?.cols) && typeof data.rows === 'string') return data.rows.split('\n').filter(Boolean).map(line => Object.fromEntries(data.cols.map((header, index) => [header, decodeValue(line.split('|')[index] ?? '', data.dict || [])])));
    return [];
  }

  async function loadProducts() {
    const payload = await fetchJson(DATA_URL);
    if (Array.isArray(payload?.parts)) {
      const parts = await Promise.all(payload.parts.map(fetchJson));
      return parts.flatMap(expandData);
    }
    return expandData(payload);
  }

  function groupRows(rows) {
    const groups = new Map();
    rows.filter(visible).forEach(row => {
      if (!groups.has(row.product_id)) groups.set(row.product_id, []);
      groups.get(row.product_id).push(row);
    });
    return groups;
  }

  function series(row) {
    const family = String(row.product_family || '').toLowerCase();
    const line = String(row.product_line || '').toLowerCase();
    const aroma = String(row.aroma_type || '').toLowerCase();
    const format = slugify(row.format || '');
    const compatible = String(row.compatible_with || '').toLowerCase();
    if (family === 'tillbehör' || family === 'tillbehor') return compatible.includes('portion') ? 'portion' : compatible.includes('lös') || compatible.includes('los') ? 'lossnus' : 'general';
    if (row.tobacco_type === 'Tobaksfri') return format === 'rx-slim' ? 'rx-slim' : ['compact', 'mini'].includes(format) ? 'compact-mini' : format || 'rebell';
    if (family === 'aromer' || aroma.includes('arom')) return 'aromer';
    if (line.includes('super dry')) return 'superdry';
    if (line.includes('instant')) return 'instant';
    if (line.includes('express')) return 'express';
    if (line.includes('white')) return 'white';
    return 'product';
  }

  function categoryUrl(row) {
    if (row.product_family === 'Lössnus') return 'los.html';
    if (row.product_family === 'Aromer') return row.aroma_type === 'Expressarom' ? 'los.html' : 'gor-eget.html';
    if (row.product_family === 'Tillbehör') return 'tillbehor.html';
    if (row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus') return 'vitt-snus.html';
    if (row.site_section === 'Gör eget') return 'gor-eget.html';
    return 'portion.html';
  }

  function categoryLabel(row) {
    if (row.product_family === 'Lössnus') return 'Lössnus';
    if (row.product_family === 'Aromer') return row.aroma_type === 'Expressarom' ? 'Lössnus' : 'Gör Eget';
    if (row.product_family === 'Tillbehör') return 'Tillbehör';
    if (row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus') return 'Vitt snus';
    if (row.site_section === 'Gör eget') return 'Gör Eget';
    return 'Portionssnus';
  }

  function strengthDots(row) {
    if (!row.strength || row.product_family === 'Aromer' || row.product_family === 'Tillbehör') return '';
    const level = row.strength === 'Extra Strong' ? 4 : row.strength === 'Strong' ? 3 : 2;
    return `<div class="strength-bar">${[1, 2, 3, 4].map(index => `<span${index <= level ? ' class="filled"' : ''}></span>`).join('')}</div>`;
  }

  function cardMeta(row) {
    const rows = row.product_family === 'Tillbehör'
      ? [['Typ', row.accessory_type], ['Färg', row.design_color || row.filter_color], ['Material', row.material]]
      : [['Typ', row.product_line || row.aroma_type], ['Smak', row.taste_display], ['Format', row.format], ['Malningsgrad', row.grind], ['Tobak', row.tobacco_type === 'Tobaksfri' ? 'Tobaksfri' : '']];
    return cleanRows(rows).slice(0, 3).map(([label, value]) => `<p class="product-card-meta">${escapeHtml(label)}: <span>${escapeHtml(value)}</span></p>`).join('');
  }

  function productCard(row) {
    const href = urlFor(row);
    const id = rowKey(row);
    return `<div class="product-card" role="link" tabindex="0" data-product-source="json" data-experience-enhanced="true" data-product-id="${escapeHtml(id)}" data-product-group="${escapeHtml(row.product_id)}" data-variant-id="${escapeHtml(row.variant_id || '')}" data-series="${escapeHtml(series(row))}" data-taste="${escapeHtml(splitList(row.taste_variables).join('|'))}" data-type="${escapeHtml(row.product_line || row.aroma_type || row.accessory_type || '')}" data-format="${escapeHtml(row.format || row.grind || row.aroma_type || row.accessory_type || '')}" data-color="${escapeHtml(row.filter_color || row.design_color || '')}" data-material="${escapeHtml(row.material || '')}" data-strength="${escapeHtml(row.strength || '')}" data-amount="${escapeHtml(amount(row))}" data-href="${escapeHtml(href)}"><button class="bookmark-toggle requires-login" data-product-id="${escapeHtml(id)}" type="button" aria-label="Spara produkt" aria-pressed="false">${BOOKMARK_ICON}</button><a class="product-card-main-link" href="${escapeHtml(href)}" aria-label="Visa ${escapeHtml(name(row))}"><div class="img-placeholder product">Produktbild</div><div class="product-card-body"><span class="product-card-badge">${escapeHtml(row.format || row.product_line || row.aroma_type || row.accessory_type || 'Produkt')}</span><p class="product-card-name">${escapeHtml(name(row))}</p>${cardMeta(row)}${strengthDots(row)}</div></a><div class="product-card-actions"><select class="pack-select" aria-label="Välj antal"><option data-price="${escapeHtml(price(row))}" data-pack="1-pack">1-pack — ${escapeHtml(price(row))}</option></select></div><div class="product-card-bottom"><p class="product-card-price"><span class="unit-price">${escapeHtml(price(row))}</span><small>per produkt</small></p><button class="add-to-cart-btn" type="button" aria-label="Lägg i kundvagn">${CART_ICON}</button></div></div>`;
  }

  function filterGroup(title, key, values) {
    return values.length ? `<div class="sidebar-group" data-filter-group="${escapeHtml(key)}"><h4>${escapeHtml(title)}</h4>${values.map(value => `<label class="sidebar-check"><input type="checkbox" value="${escapeHtml(value)}" />${escapeHtml(value)}</label>`).join('')}</div>` : '';
  }

  function buildSidebar(rows) {
    const values = { taste: [], type: [], format: [], strength: [], amount: [], color: [], material: [] };
    rows.forEach(row => {
      values.taste.push(...splitList(row.taste_variables));
      values.type.push(row.product_line || row.aroma_type || row.accessory_type);
      values.format.push(row.format || row.grind || row.aroma_type || row.accessory_type);
      values.strength.push(row.strength);
      values.amount.push(amount(row));
      values.color.push(row.filter_color || row.design_color);
      values.material.push(row.material);
    });
    const sidebar = $('.filter-sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = page() === 'tillbehor.html'
      ? filterGroup('Typ', 'type', unique(values.type).sort()) + filterGroup('Färg', 'color', unique(values.color).sort()) + filterGroup('Material', 'material', unique(values.material).sort())
      : filterGroup('Smak', 'taste', unique(values.taste).sort()) + filterGroup('Typ', 'type', unique(values.type).sort()) + filterGroup('Format', 'format', unique(values.format).sort()) + filterGroup('Styrka', 'strength', unique(values.strength).sort()) + filterGroup('Mängd', 'amount', unique(values.amount).sort());
  }

  function applyFilters() {
    const cards = $$('.catalog-page .product-card');
    const count = $('.catalog-count');
    const empty = $('.catalog-empty');
    let visibleCount = 0;
    cards.forEach(card => {
      const ok = (!state.series || card.dataset.series === state.series) && Object.entries(state.filters).every(([key, selected]) => {
        if (!selected.size) return true;
        const value = card.dataset[key] || '';
        return key === 'taste' ? [...selected].some(item => value.split('|').includes(item)) : selected.has(value);
      });
      card.classList.toggle('is-hidden', !ok);
      if (ok) visibleCount += 1;
    });
    if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? 'produkt' : 'produkter'}`;
    if (empty) empty.classList.toggle('show', visibleCount === 0);
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
    const rows = state.rows.filter(row => visible(row) && route.filter(row));
    const pills = $('.category-pills');
    if (pills) pills.innerHTML = route.pills.map(([value, title, subtitle]) => `<button class="filter-pill" data-series="${escapeHtml(value)}" type="button"><span class="filter-pill-icon"></span><span class="filter-pill-copy"><span class="filter-pill-title">${escapeHtml(title)}</span><span class="filter-pill-subtitle">${escapeHtml(subtitle)}</span></span><span class="filter-pill-close">×</span></button>`).join('');
    buildSidebar(rows);
    grid.innerHTML = rows.map(productCard).join('');
    const header = $('.catalog-results-header span:first-child');
    if (header) header.innerHTML = `<strong>${escapeHtml(route.title)}</strong>`;
    state.series = null;
    state.filters = {};
    bindFilters();
    applyFilters();
  }

  function productFields(row, group) {
    if (row.product_family === 'Tillbehör') return [['design_color', 'Design']];
    if (row.product_family === 'Lössnus') return [['amount', 'Mängd'], ['grind', 'Malningsgrad'], ['strength', 'Styrka']];
    if (row.product_family === 'Aromer') return [['amount', 'Mängd'], ['aroma_type', 'Aromtyp']];
    return [['format', 'Format'], ['amount', 'Portioner'], ['strength', 'Styrka']];
  }

  function fieldValue(row, field) {
    if (field === 'amount') return amount(row);
    if (field === 'package_quantity') return row.package_quantity ? `${row.package_quantity}-pack` : '';
    return row[field] || '';
  }

  function findRow(product = {}) {
    const id = String(product.id || '').trim();
    const href = String(product.href || '').trim();
    const hrefId = href ? new URL(href, location.href).searchParams.get('id') || '' : '';
    const nameValue = String(product.name || '').trim();
    const nameSlug = slugify(nameValue);
    return state.rows.find(row => [rowKey(row), row.product_id, row.variant_id, row.sku_draft, row.article_number, name(row), row.generated_name].filter(Boolean).some(key => String(key) === id || String(key) === hrefId || slugify(key) === id || slugify(key) === nameSlug)) || null;
  }

  function currentRow() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return null;

    return findRow({ id, href: location.href });
  }

  function detailMetaRows(row) {
    if (row.product_family === 'Tillbehör') return cleanRows([['Typ', row.accessory_type], ['Färg', row.design_color || row.filter_color], ['Material', row.material], ['Diameter', mm(row.diameter)], ['Höjd', mm(row.height)]]);
    return cleanRows([['Typ', row.product_line || row.aroma_type || row.product_family], ['Smak', row.taste_display], ['Format', row.format], ['Malningsgrad', row.grind], ['Styrka', row.strength], ['Tobak', row.tobacco_type === 'Tobaksfri' ? 'Tobaksfri' : ''], ['Tillverkning', row.manufacturing_location]]).slice(0, 5);
  }

  function specRows(row) {
    if (row.product_family === 'Tillbehör') return detailMetaRows(row);
    return cleanRows([['Produktfamilj', row.product_family], ['Produktlinje', row.product_line || row.aroma_type], ['Tobakstyp', row.tobacco_type && row.tobacco_type !== 'Ej tillämpligt' ? row.tobacco_type : ''], ['Format', [row.format, row.format_dimensions].filter(Boolean).join(', ')], ['Fyllnad', row.fill_level], ['Smak', row.taste_display], ['Malningsgrad', row.grind], ['Styrka', [row.strength, row.strength_mg_g].filter(Boolean).join(', ')], ['Nikotinhalt', row.nicotine_per_portion], ['Förpackningsstorlek', row.portions_total ? `${row.amount_dosor} dosor (${row.portions_total} portioner)` : amount(row)], ['Hållbarhet', row.shelf_life], ['Tillverkningsort', row.manufacturing_location]]);
  }

  function renderDetail(row) {
    const detail = $('.product-detail');
    if (!detail || !row) return;
    detail.dataset.productId = rowKey(row);
    detail.dataset.href = urlFor(row);
    const title = $('[data-product-title]', detail) || $('h1', detail);
    if (title) title.textContent = name(row);
    document.title = `${name(row)} — Swedsnus`;
    const breadcrumb = $('[data-product-breadcrumb]');
    if (breadcrumb) breadcrumb.textContent = name(row);
    const categoryLink = $('[data-product-category-link]');
    if (categoryLink) { categoryLink.href = categoryUrl(row); categoryLink.textContent = categoryLabel(row); }
    const badge = $('.product-detail-badge', detail);
    if (badge) badge.innerHTML = `<span class="product-card-badge">${escapeHtml(row.format || row.product_line || row.aroma_type || row.accessory_type || row.product_family)}</span>${row.tobacco_type === 'Tobaksfri' ? '<span class="product-card-badge" style="background:var(--color-accent);">Tobaksfri</span>' : ''}`;
    const priceEl = $('.product-detail-price', detail);
    if (priceEl) priceEl.innerHTML = `${escapeHtml(price(row))} <small>1-pack</small>`;
    const desc = $('.product-desc', detail);
    if (desc) desc.textContent = row.short_description || `${name(row)} visas från produktdatan.`;
    const meta = detailMetaRows(row);
    const metaEl = $('.product-detail-meta', detail);
    if (metaEl) metaEl.innerHTML = meta.map(([label, value]) => `<div class="product-detail-meta-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
    const spec = $('.product-spec-table tbody', detail);
    if (spec) spec.innerHTML = specRows(row).map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
    const pack = $('.pack-picker-options', detail);
    if (pack) pack.innerHTML = `<label class="pack-option selected" data-price="${escapeHtml(price(row))}" data-pack="1-pack"><input type="radio" name="pack" value="1" checked /><span class="pack-option-label">1-pack</span><span class="pack-option-price">${escapeHtml(price(row))}</span><span class="pack-option-per">${escapeHtml(price(row))}/st</span></label>`;
    $$('.bookmark-toggle', detail).forEach(button => { button.dataset.productId = rowKey(row); });
  }

  function renderMissingProduct() {
    const detail = $('.product-detail');
    if (!detail) return;
    document.title = 'Produkt hittades inte — Swedsnus';
    detail.innerHTML = '<div class="product-detail-badge"><span class="product-card-badge">Produktdata saknas</span></div><h1>Produkt hittades inte</h1><p class="product-desc">Produktlänken kunde inte matchas mot data/products.json.</p><div class="btn-row"><a href="portion.html" class="btn btn-primary">Till sortimentet</a></div>';
    $('.product-gallery')?.classList.add('is-hidden');
  }

  function matchingVariant(group, selected, changed, current) {
    return group.find(row => Object.entries(selected).every(([field, value]) => !value || fieldValue(row, field) === value)) || group.find(row => changed && fieldValue(row, changed) === selected[changed]) || current;
  }

  function renderProductPage() {
    if (page() !== PRODUCT_PAGE) return;
    const row = currentRow();
    if (!row) return renderMissingProduct();
    const group = row.product_family === 'Tillbehör' && row.accessory_name ? state.rows.filter(item => item.product_family === 'Tillbehör' && item.accessory_name === row.accessory_name && visible(item)) : state.groups.get(row.product_id) || [row];
    const detail = $('.product-detail');
    if (!detail) return;
    const fields = productFields(row, group).filter(([field]) => unique(group.map(item => fieldValue(item, field))).length > 0);
    let panel = $('.product-choice-panel', detail);
    if (fields.length) {
      if (!panel) { panel = document.createElement('section'); panel.className = 'product-choice-panel'; $('.pack-picker-label', detail)?.insertAdjacentElement('beforebegin', panel); }
      panel.innerHTML = `<p class="product-choice-panel-title">Produktval</p><div class="product-choice-grid">${fields.map(([field, label]) => `<div class="product-choice-field"><label>${escapeHtml(label)}</label><select data-data-field="${escapeHtml(field)}">${unique(group.map(item => fieldValue(item, field))).map(option => `<option${option === fieldValue(row, field) ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`).join('')}</div>`;
      fields.forEach(([field]) => $('[data-data-field="' + field + '"]', panel)?.addEventListener('change', () => {
        const selected = Object.fromEntries(fields.map(([itemField]) => [itemField, $('[data-data-field="' + itemField + '"]', panel)?.value || '']));
        const target = matchingVariant(group, selected, field, row);
        if (rowKey(target) !== rowKey(row)) location.href = urlFor(target);
      }));
    } else if (panel) panel.remove();
    renderDetail(row);
  }

  function rowsForCarousel(title) {
    const text = String(title || '').toLowerCase();
    const rows = state.rows.filter(visible);
    if (text.includes('portion')) return rows.filter(row => row.product_family === 'Portionssnus' && row.site_section === 'Portionssnus' && row.tobacco_type !== 'Tobaksfri').slice(0, 12);
    if (text.includes('lössnus') || text.includes('lossnus')) return rows.filter(row => row.product_family === 'Lössnus').slice(0, 12);
    if (text.includes('gör eget') || text.includes('gor eget')) return rows.filter(row => row.site_section === 'Gör eget' || row.aroma_type === 'Super Dry Arom').slice(0, 12);
    if (text.includes('tillbehör') || text.includes('tillbehor')) return rows.filter(row => row.product_family === 'Tillbehör').slice(0, 12);
    if (text.includes('vitt')) return rows.filter(row => row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus').slice(0, 12);
    return rows.slice(0, 12);
  }

  function renderIndex() {
    if (page() !== 'index.html') return;
    $$('.carousel-section').forEach(section => {
      const track = $('.carousel-track', section);
      if (track) track.innerHTML = rowsForCarousel($('.section-heading', section)?.textContent || '').map(productCard).join('');
    });
    const showcase = $('.vitt-showcase-track');
    if (showcase) showcase.innerHTML = state.rows.filter(row => visible(row) && (row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus')).slice(0, 6).map(productCard).join('');
  }

  function productFromElement(element) { return { id: element.dataset.productId || element.dataset.productGroup || '', name: $('.product-card-name', element)?.textContent?.trim() || '', href: element.dataset.href || $('.product-card-main-link', element)?.getAttribute('href') || '' }; }
  function syncProductCard(card) {
    const row = findRow(productFromElement(card));
    if (!row) return;
    const href = urlFor(row), id = rowKey(row);
    card.dataset.href = href;
    card.dataset.productId = id;
    $('.product-card-main-link', card)?.setAttribute('href', href);
    $$('.bookmark-toggle', card).forEach(button => { button.dataset.productId = id; });
  }
  function normalizeProductHref(product = {}) { const row = findRow(product); return row ? urlFor(row) : product.href || ''; }
  function migrateStore(key) {
    try {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(items)) return;
      let changed = false;
      const next = items.map(item => { const href = normalizeProductHref(item); if (href && href !== item.href) { changed = true; return { ...item, href }; } return item; });
      if (changed) localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {}
  }
  function syncExistingProductLinks() { migrateStore(BOOKMARKS_KEY); migrateStore(CART_KEY); $$('.product-card').forEach(syncProductCard); }

  function bindProductCardNavigation() {
    if (window.__swedsnusProductCardNavigationBound) return;
    window.__swedsnusProductCardNavigationBound = true;
    const interactive = 'a, button, input, select, textarea, label, .pack-select, .bookmark-toggle, .add-to-cart-btn, [data-cart-action], [data-demo-action]';
    document.addEventListener('click', event => {
      const card = event.target.closest('.product-card[data-href]');
      if (!card || event.target.closest(interactive)) return;
      const href = card.dataset.href || $('.product-card-main-link', card)?.getAttribute('href');
      if (!href) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.href = href;
    }, true);
  }

  async function init() {
    bindProductCardNavigation();
    try {
      state.rows = (await loadProducts()).filter(visible);
      state.groups = groupRows(state.rows);
      window.SwedsnusProducts = { rows: state.rows, groups: state.groups, rowKey, urlFor, productCard, findRow, syncExistingProductLinks, normalizeProductHref };
      renderCatalog();
      renderProductPage();
      renderIndex();
      syncExistingProductLinks();
      document.dispatchEvent(new CustomEvent('swedsnus:products-rendered'));
      setTimeout(syncExistingProductLinks, 120);
    } catch (error) {
      document.documentElement.classList.add('product-data-load-failed');
      console.error(error);
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
