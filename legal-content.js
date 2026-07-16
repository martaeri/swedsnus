(() => {
  if (window.__swedsnusLegalContentLoaded) return;
  window.__swedsnusLegalContentLoaded = true;

  const NICOTINE_WARNING = 'Denna produkt innehåller nikotin som är ett mycket beroendeframkallande ämne.';
  const TOBACCO_FREE = 'Tobaksfri';
  const $ = (selector, root = document) => root ? root.querySelector(selector) : null;
  const $$ = (selector, root = document) => root ? Array.from(root.querySelectorAll(selector)) : [];

  function warningElement(context) {
    const warning = document.createElement('p');
    warning.className = 'nicotine-health-warning';
    warning.dataset.nicotineWarning = context;
    warning.textContent = NICOTINE_WARNING;
    return warning;
  }

  function ensureWarning(container, context, position = 'afterbegin') {
    if (!container || $(`[data-nicotine-warning="${context}"]`, container)) return;
    container.insertAdjacentElement(position, warningElement(context));
  }

  function removeWarning(container, context) {
    $(`[data-nicotine-warning="${context}"]`, container)?.remove();
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
      const existing = $('[data-nicotine-warning="cart-panel"]', panel);
      if (!hasTobaccoFreeItem) {
        existing?.remove();
        return;
      }
      if (existing) return;
      const footer = $('.cart-panel-footer', panel);
      footer ? footer.insertAdjacentElement('beforebegin', warningElement('cart-panel')) : ensureWarning(panel, 'cart-panel', 'beforeend');
    });
  }

  function updateNicotineProductNotices() {
    const main = $('main');
    const whiteCatalog = document.body.dataset.page === 'vitt-snus' ? $('.catalog-page') : null;
    if (whiteCatalog) {
      const intro = $('.catalog-intro', whiteCatalog);
      if (intro && !whiteCatalog.querySelector('[data-nicotine-warning="white-catalog"]')) intro.insertAdjacentElement('afterend', warningElement('white-catalog'));
    }

    const productDetail = $('.product-detail');
    if (productDetail) {
      const product = {
        id: productDetail.dataset.productId || '',
        href: productDetail.dataset.href || location.href,
        name: $('[data-product-title]', productDetail)?.textContent?.trim() || ''
      };
      const tobaccoFree = isTobaccoFree(product);
      const existing = $('[data-nicotine-warning="product-detail"]', productDetail);
      if (tobaccoFree && !existing) {
        const choicePanel = $('.product-choice-panel', productDetail);
        const warning = warningElement('product-detail');
        choicePanel ? choicePanel.insertAdjacentElement('beforebegin', warning) : $('[data-product-title]', productDetail)?.insertAdjacentElement('afterend', warning);
      } else if (!tobaccoFree) {
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
    const globalWarning = $('[data-nicotine-warning="mixed-products"]');
    if (needsGlobalWarning && main && !globalWarning) main.insertAdjacentElement('afterbegin', warningElement('mixed-products'));
    if (!needsGlobalWarning) globalWarning?.remove();

    const showcaseCopy = $('.vitt-showcase-copy');
    if (showcaseCopy) {
      if (needsGlobalWarning) removeWarning(showcaseCopy, 'white-showcase');
      else ensureWarning(showcaseCopy, 'white-showcase', 'beforeend');
    }

    updateCartPanelWarnings();
  }

  function refresh() {
    updateSharedLegalCopy();
    updateNicotineProductNotices();
  }

  document.addEventListener('swedsnus:layout-rendered', refresh);
  document.addEventListener('swedsnus:products-rendered', refresh);
  document.addEventListener('swedsnus:bookmarks-rendered', refresh);
  document.addEventListener('swedsnus:bookmarks-changed', refresh);
  document.addEventListener('swedsnus:cart-changed', refresh);
  document.addEventListener('swedsnus:auth-changed', refresh);
  document.addEventListener('swedsnus:app-ready', refresh);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', refresh) : refresh();
})();