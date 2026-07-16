(() => {
  if (window.__swedsnusLegalContentLoaded) return;
  window.__swedsnusLegalContentLoaded = true;

  const NICOTINE_WARNING = 'Denna produkt innehåller nikotin som är ett mycket beroendeframkallande ämne.';
  const TOBACCO_FREE = 'Tobaksfri';
  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];
  const warningSelector = context => `[data-nicotine-warning="${context}"]`;

  function warningElement(context) {
    const warning = document.createElement('aside');
    warning.className = 'nicotine-health-warning';
    warning.dataset.nicotineWarning = context;
    warning.setAttribute('role', 'note');
    warning.setAttribute('aria-label', 'Nikotinvarning');

    const text = document.createElement('p');
    text.className = 'nicotine-health-warning-text';
    text.textContent = NICOTINE_WARNING;
    warning.appendChild(text);
    return warning;
  }

  function existingWarning(context, root = document) {
    return $(warningSelector(context), root);
  }

  function ensureWarning(container, context, position = 'afterbegin') {
    if (!container) return null;
    const warning = existingWarning(context, container) || warningElement(context);
    if (!warning.isConnected || warning.parentElement !== container) container.insertAdjacentElement(position, warning);
    return warning;
  }

  function placeWarningBefore(target, context) {
    if (!target?.parentNode) return null;
    const warning = existingWarning(context) || warningElement(context);
    if (warning.nextElementSibling !== target || warning.parentElement !== target.parentElement) target.parentNode.insertBefore(warning, target);
    return warning;
  }

  function placeWarningAfter(target, context) {
    if (!target?.parentNode) return null;
    const warning = existingWarning(context) || warningElement(context);
    if (target.nextElementSibling !== warning) target.insertAdjacentElement('afterend', warning);
    return warning;
  }

  function removeWarning(container, context) {
    existingWarning(context, container)?.remove();
  }

  function productRow(product = {}) {
    return window.SwedsnusProducts?.findRow?.(product) || null;
  }

  function cardProduct(card) {
    return {
      id: card?.dataset.productId || card?.dataset.productGroup || '',
      href: card?.dataset.href || $('.product-card-main-link', card)?.getAttribute('href') || '',
      name: $('.product-card-name', card)?.textContent?.trim() || ''
    };
  }

  function isTobaccoFree(product = {}) {
    if (product.tobaccoType === TOBACCO_FREE || product.tobacco_type === TOBACCO_FREE) return true;
    return productRow(product)?.tobacco_type === TOBACCO_FREE;
  }

  function cardIsTobaccoFree(card) {
    return isTobaccoFree(cardProduct(card));
  }

  function storedItemsContainTobaccoFree(items = []) {
    return items.some(item => isTobaccoFree(item));
  }

  function updateSharedLegalCopy() {
    const ageBanner = $('.age-banner');
    if (ageBanner) ageBanner.textContent = '18-årsgräns: Tobaksprodukter och tobaksfria nikotinprodukter får inte säljas eller lämnas ut till personer under 18 år.';

    const footerCopy = $('.footer-bottom > span');
    if (footerCopy) footerCopy.textContent = '© 2026 Swedsnus AB · Hemsjö, Sverige · Tobaksprodukter omfattas bland annat av Lag (2018:2088) · Tobaksfria nikotinprodukter omfattas bland annat av Lag (2022:1257) · Åldersgräns 18 år';
  }

  function updateCartPanelWarnings() {
    const hasTobaccoFreeItem = storedItemsContainTobaccoFree(window.SwedsnusCart?.items?.() || []);
    $$('.cart-panel').forEach(panel => {
      const existing = existingWarning('cart-panel', panel);
      if (!hasTobaccoFreeItem) {
        existing?.remove();
        return;
      }
      const footer = $('.cart-panel-footer', panel);
      if (footer) placeWarningBefore(footer, 'cart-panel');
      else ensureWarning(panel, 'cart-panel', 'beforeend');
    });
  }

  function updateNicotineProductNotices() {
    const main = $('main');
    const whiteCatalog = document.body.dataset.page === 'vitt-snus' ? $('.catalog-page') : null;
    if (whiteCatalog) {
      const intro = $('.catalog-intro', whiteCatalog);
      if (intro) placeWarningAfter(intro, 'white-catalog');
    }

    const productDetail = $('.product-detail');
    if (productDetail) {
      const product = {
        id: productDetail.dataset.productId || '',
        href: productDetail.dataset.href || location.href,
        name: $('[data-product-title]', productDetail)?.textContent?.trim() || ''
      };
      const tobaccoFree = isTobaccoFree(product);
      const existing = existingWarning('product-detail', productDetail);
      if (tobaccoFree) {
        const choicePanel = $('.product-choice-panel', productDetail);
        if (choicePanel) placeWarningBefore(choicePanel, 'product-detail');
        else {
          const title = $('[data-product-title]', productDetail);
          if (title) placeWarningAfter(title, 'product-detail');
        }
      } else {
        existing?.remove();
      }
    }

    const uncoveredTobaccoFreeCard = main && $$('.product-card', main).some(card => {
      if (!cardIsTobaccoFree(card)) return false;
      if (card.closest('.vitt-showcase-section')) return false;
      if (whiteCatalog && card.closest('.catalog-page') === whiteCatalog) return false;
      return true;
    });
    const cartPageContainsTobaccoFree = document.body.dataset.page === 'cart' && storedItemsContainTobaccoFree(window.SwedsnusCart?.items?.() || []);
    const needsGlobalWarning = Boolean(uncoveredTobaccoFreeCard || cartPageContainsTobaccoFree);
    const globalWarning = existingWarning('mixed-products');
    if (needsGlobalWarning && main) ensureWarning(main, 'mixed-products');
    if (!needsGlobalWarning) globalWarning?.remove();

    const showcase = $('.vitt-showcase-section');
    if (showcase) placeWarningBefore(showcase, 'white-showcase');
    else existingWarning('white-showcase')?.remove();

    updateCartPanelWarnings();
  }

  function refresh() {
    updateSharedLegalCopy();
    updateNicotineProductNotices();
  }

  window.SwedsnusLegalContent = { refresh, warningElement };
  document.addEventListener('swedsnus:layout-rendered', refresh);
  document.addEventListener('swedsnus:products-rendered', refresh);
  document.addEventListener('swedsnus:bookmarks-rendered', refresh);
  document.addEventListener('swedsnus:bookmarks-changed', refresh);
  document.addEventListener('swedsnus:cart-changed', refresh);
  document.addEventListener('swedsnus:auth-changed', refresh);
  document.addEventListener('swedsnus:app-ready', refresh);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', refresh) : refresh();
})();