(() => {
  const desktop = matchMedia('(min-width: 1101px)');
  const changed = new Map();
  let frame = 0;

  const hasOwnText = element =>
    element.matches('input, textarea, select, button') ||
    [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());

  const update = () => {
    frame = 0;
    for (const [element, original] of changed) {
      if (!element.isConnected) continue;
      if (original.value) element.style.setProperty('font-size', original.value, original.priority);
      else element.style.removeProperty('font-size');
    }
    changed.clear();
    if (!desktop.matches) return;

    for (const element of document.body.querySelectorAll('*')) {
      if (!hasOwnText(element) || element.hasAttribute('data-desktop-type-keep') ||
          element.matches('.vb-course-hero-benefits .main-banner-grid-feature__title, .vb-course-section--audience .vb-course-audience-title, .vb-course-section--teachers .vb-course-teacher-name')) continue;
      const style = getComputedStyle(element);
      if (style.fontSize !== '24px' || !style.fontFamily.toLowerCase().includes('onest')) continue;
      changed.set(element, {
        value: element.style.getPropertyValue('font-size'),
        priority: element.style.getPropertyPriority('font-size')
      });
      element.style.setProperty('font-size', '20px', 'important');
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  addEventListener('resize', schedule);
  desktop.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  document.fonts?.ready.then(schedule);
  schedule();
})();
