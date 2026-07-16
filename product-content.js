(() => {
  if (window.__swedsnusProductContentLoaded) return;
  window.__swedsnusProductContentLoaded = true;

  const CONTENT = {
    portion: {
      label: 'Portionssnus',
      sections: [
        {
          title: 'Om produkten',
          guide: 'Här kan en längre, saklig produktbeskrivning ligga, till exempel om portionsformat, material och hur produkten är uppbyggd.'
        },
        {
          title: 'Smak, styrka och format',
          guide: 'Här kan smakprofil, styrka, fukthalt och portionsstorlek beskrivas mer utförligt.'
        }
      ]
    },
    loose: {
      label: 'Lössnus',
      sections: [
        {
          title: 'Om lössnuset',
          guide: 'Här kan malningsgrad, konsistens, förpackningsstorlek och produktens övriga egenskaper beskrivas.'
        },
        {
          title: 'Beredning och förvaring',
          guide: 'Här kan relevant information om beredning, mognadstid och förvaring sammanfattas.'
        }
      ]
    },
    makeOwn: {
      label: 'Gör Eget',
      sections: [
        {
          title: 'Om produkten',
          guide: 'Här kan det förklaras vad produkten innehåller före beredning och vilka val kunden behöver göra.'
        },
        {
          title: 'Beredning och användning',
          guide: 'Här kan information om vatten, arom, vilotid och förvaring sammanfattas på ett tydligt sätt.'
        }
      ]
    },
    white: {
      label: 'Vitt snus',
      sections: [
        {
          title: 'Om nikotinpåsarna',
          guide: 'Här kan format, portionsmaterial och produktens tobaksfria kategori beskrivas mer utförligt.'
        },
        {
          title: 'Smak, styrka och portionsstorlek',
          guide: 'Här kan smakprofil, nikotinstyrka och portionsstorlek beskrivas sakligt och tydligt.'
        }
      ]
    }
  };

  const LOREM = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere, justo sed fermentum tincidunt, arcu velit malesuada nunc, vitae facilisis lectus sem vel lorem.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Praesent commodo, nibh vitae faucibus dictum, libero neque tincidunt erat, sed consequat nisl lorem vitae erat.'
  ];

  function pageName() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function currentProduct() {
    const id = new URLSearchParams(location.search).get('id') || '';
    return window.SwedsnusProducts?.findRow?.({ id, href: location.href }) || null;
  }

  function contentKey(row) {
    if (!row || row.product_family === 'Tillbehör') return null;
    if (row.tobacco_type === 'Tobaksfri' || row.site_section === 'Vitt snus') return 'white';
    if (row.site_section === 'Gör eget' || row.aroma_type === 'Super Dry Arom') return 'makeOwn';
    if (row.product_family === 'Lössnus' || row.aroma_type === 'Expressarom') return 'loose';
    if (row.product_family === 'Portionssnus') return 'portion';
    return null;
  }

  function textBlock(section) {
    return `<article class="product-information-card"><p class="product-information-kicker">Fördjupad produktinformation</p><h2>${section.title}</h2><p class="product-information-guide">${section.guide}</p><div class="product-information-body"><p>${LOREM[0]}</p><p>${LOREM[1]}</p></div></article>`;
  }

  function template(config) {
    return `<div class="product-information-grid">${config.sections.map(textBlock).join('')}</div><aside class="product-ingredients-card" aria-labelledby="product-ingredients-title"><div><p class="product-information-kicker">${config.label}</p><h2 id="product-ingredients-title">Innehållsförteckning</h2></div><div class="product-information-body"><p class="product-information-guide">Här kan den fullständiga innehållsförteckningen anges i fallande viktordning.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p></div></aside>`;
  }

  function render() {
    if (!['product.html', 'product'].includes(pageName())) return;
    const layout = document.querySelector('.product-layout');
    if (!layout) return;

    const row = currentProduct();
    const key = contentKey(row);
    let content = document.querySelector('[data-product-information]');

    if (!key) {
      content?.remove();
      return;
    }

    if (!content) {
      content = document.createElement('section');
      content.className = 'product-information';
      content.dataset.productInformation = '';
      layout.insertAdjacentElement('afterend', content);
    }

    content.dataset.productContentType = key;
    content.innerHTML = template(CONTENT[key]);
  }

  window.SwedsnusProductContent = { render };
  document.addEventListener('swedsnus:products-rendered', render);
  document.addEventListener('swedsnus:app-ready', render);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', render) : render();
})();