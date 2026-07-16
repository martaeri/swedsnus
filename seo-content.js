(() => {
  if (window.__swedsnusSeoContentLoaded) return;
  window.__swedsnusSeoContentLoaded = true;

  function ensureMetaDescription(content) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  function addGuideResources() {
    if (document.body.dataset.page !== 'guide') return;

    document.title = 'Beredningsguide för lössnus och Gör Eget — Swedsnus';
    ensureMetaDescription('Beredningsguide för Lössnus Instant, Lössnus Express, Instant Portion och Super Dry med vattenmängder, steg, förvaring och vanliga frågor.');

    if (document.querySelector('[data-guide-resources]')) return;
    const guideTips = document.querySelector('.guide-tips');
    const main = document.querySelector('main');
    if (!main) return;

    const section = document.createElement('section');
    section.className = 'guide-resource-section';
    section.dataset.guideResources = '';
    section.setAttribute('aria-labelledby', 'guide-resources-title');
    section.innerHTML = `
      <p class="seo-kicker">Fördjupning</p>
      <h2 id="guide-resources-title">Fler guider och vanliga frågor</h2>
      <p>Beredningsguiden beskriver de praktiska stegen för Instant, Express, Instant Portion och Super Dry. I de kompletterande sidorna finns mer information om produktkategorier, innehåll, förvaring och åldersgräns.</p>
      <div class="guide-resource-grid">
        <article class="guide-resource-card"><h3>Vanliga frågor</h3><p>Svar om produktkategorier, beredning, förvaring, priser och skillnaden mellan tobakssnus och tobaksfria nikotinpåsar.</p><a href="faq.html">Öppna vanliga frågor →</a></article>
        <article class="guide-resource-card"><h3>Portionssnus</h3><p>Läs om original portion, white portion, portionsformat och produkter som färdigställs med vatten.</p><a href="portion.html">Läs om portionssnus →</a></article>
        <article class="guide-resource-card"><h3>Lössnus och Gör Eget</h3><p>Jämför Instant, Express, Super Dry och tillhörande aromer innan du väljer rätt beredningsavsnitt.</p><a href="los.html">Läs om lössnus →</a></article>
      </div>`;

    if (guideTips) guideTips.insertAdjacentElement('afterend', section);
    else main.appendChild(section);
  }

  function connectFaqNavigation() {
    document.querySelectorAll('.site-footer a').forEach(link => {
      if (['faq', 'vanliga frågor'].includes(link.textContent.trim().toLowerCase())) {
        link.href = 'faq.html';
        link.textContent = 'Vanliga frågor';
      }
    });

    const secondaryLinks = document.querySelector('.hamburger-secondary-links');
    if (secondaryLinks && !secondaryLinks.querySelector('a[href="faq.html"]')) {
      const link = document.createElement('a');
      link.className = 'hamburger-link hamburger-link-secondary';
      link.href = 'faq.html';
      link.innerHTML = '<span>Vanliga frågor</span><span class="hamburger-arrow" aria-hidden="true">›</span>';
      secondaryLinks.appendChild(link);
    }
  }

  function refresh() {
    addGuideResources();
    connectFaqNavigation();
  }

  document.addEventListener('swedsnus:layout-rendered', refresh);
  document.addEventListener('swedsnus:app-ready', refresh);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', refresh) : refresh();
})();
