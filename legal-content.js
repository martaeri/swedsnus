(() => {
  if (window.__swedsnusLegalContentLoaded) return;
  window.__swedsnusLegalContentLoaded = true;

  const NICOTINE_WARNING = 'Denna produkt innehåller nikotin som är ett mycket beroendeframkallande ämne.';
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

  function updateSharedLegalCopy() {
    const ageBanner = $('.age-banner');
    if (ageBanner) ageBanner.textContent = 'Försäljning av tobaks- och nikotinprodukter — åldersgräns 18 år · Legitimation kan krävas';

    const footerCopy = $('.footer-bottom > span');
    if (footerCopy) footerCopy.textContent = '© 2026 Swedsnus AB · Hemsjö, Sverige · Tobaksprodukter regleras av Lag (2018:2088) · Tobaksfria nikotinprodukter regleras av Lag (2022:1257) · Åldersgräns 18 år';
  }

  function updateNicotineProductNotices() {
    const whiteCatalog = document.body.dataset.page === 'vitt-snus' ? $('.catalog-page') : null;
    if (whiteCatalog) {
      const intro = $('.catalog-intro', whiteCatalog);
      if (intro && !whiteCatalog.querySelector('[data-nicotine-warning="white-catalog"]')) intro.insertAdjacentElement('afterend', warningElement('white-catalog'));
    }

    const showcaseCopy = $('.vitt-showcase-copy');
    if (showcaseCopy) ensureWarning(showcaseCopy, 'white-showcase', 'beforeend');

    const productDetail = $('.product-detail');
    if (productDetail) {
      const isTobaccoFree = $('.product-detail-badge', productDetail)?.textContent.includes('Tobaksfri');
      const existing = $('[data-nicotine-warning="product-detail"]', productDetail);
      if (isTobaccoFree && !existing) {
        const choicePanel = $('.product-choice-panel', productDetail);
        const warning = warningElement('product-detail');
        choicePanel ? choicePanel.insertAdjacentElement('beforebegin', warning) : $('[data-product-title]', productDetail)?.insertAdjacentElement('afterend', warning);
      } else if (!isTobaccoFree) {
        existing?.remove();
      }
    }

    const hasTobaccoFreeCards = $$('.product-card').some(card => card.textContent.includes('Tobaksfri'));
    const main = $('main');
    const globalWarning = $('[data-nicotine-warning="mixed-products"]');
    const dedicatedWarning = $('[data-nicotine-warning="white-catalog"], [data-nicotine-warning="white-showcase"], [data-nicotine-warning="product-detail"]');
    if (hasTobaccoFreeCards && main && !dedicatedWarning && !globalWarning) main.insertAdjacentElement('afterbegin', warningElement('mixed-products'));
    if ((!hasTobaccoFreeCards || dedicatedWarning) && globalWarning) globalWarning.remove();
  }

  function refresh() {
    updateSharedLegalCopy();
    updateNicotineProductNotices();
  }

  document.addEventListener('swedsnus:layout-rendered', refresh);
  document.addEventListener('swedsnus:products-rendered', refresh);
  document.addEventListener('swedsnus:bookmarks-rendered', refresh);
  document.addEventListener('swedsnus:app-ready', refresh);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', refresh) : refresh();
})();