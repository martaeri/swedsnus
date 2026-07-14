(() => {
  if (window.SwedsnusUI) return;

  const Core = window.SwedsnusCore;
  if (!Core) throw new Error('SwedsnusCore must load before ui-feedback.js');

  const { $ } = Core;

  function toast(message, duration = 2200) {
    let element = $('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      document.body.appendChild(element);
    }

    element.textContent = message;
    element.classList.add('show');
    clearTimeout(element._timer);
    element._timer = setTimeout(() => element.classList.remove('show'), duration);
  }

  window.SwedsnusUI = { toast };
})();
