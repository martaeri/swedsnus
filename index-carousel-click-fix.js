(() => {
  const carouselOuters = document.querySelectorAll('.carousel-track-outer');
  if (!carouselOuters.length) return;

  function triggerRealTarget(event) {
    if (!event.target.classList?.contains('carousel-track-outer') && !event.target.classList?.contains('carousel-track')) return;

    const realTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (!realTarget || !realTarget.closest('.carousel-wrapper')) return;

    const interactive = realTarget.closest('.bookmark-toggle, .add-to-cart-btn, .pack-select');
    const card = realTarget.closest('.product-card');

    if (!interactive && !card) return;

    event.preventDefault();
    event.stopPropagation();

    if (interactive) {
      interactive.click();
      return;
    }

    window.location.href = card.dataset.href || 'product.html';
  }

  carouselOuters.forEach(outer => {
    outer.addEventListener('click', triggerRealTarget, true);
  });
})();
