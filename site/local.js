(() => {
  const header = document.querySelector('#vb-site-header');
  const menuButton = header?.querySelector('.header__menu-toggle');
  const menuBackdrop = header?.querySelector('.header__backdrop');
  const closeMenu = () => {
    header?.classList.remove('is-nav-open');
    document.body.classList.remove('vb-header-nav-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Открыть меню');
  };
  menuButton?.addEventListener('click', () => {
    const open = !header.classList.contains('is-nav-open');
    header.classList.toggle('is-nav-open', open);
    document.body.classList.toggle('vb-header-nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  menuBackdrop?.addEventListener('click', closeMenu);
  header?.querySelectorAll('.header-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const tabs = [...document.querySelectorAll('.home-catalog-tab[data-tab]')];
  const cards = [...document.querySelectorAll('.home-course-card[data-course-kind]')];
  const tabShell = document.querySelector('.home-catalog-tabs-shell');
  const thumb = tabShell?.querySelector('.home-catalog-tabs-thumb');
  const updateThumb = () => {
    const active = tabs.find(tab => tab.classList.contains('is-active'));
    if (!active || !thumb || !tabShell) return;
    const shell = tabShell.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    thumb.style.width = `${rect.width}px`;
    thumb.style.height = `${rect.height}px`;
    thumb.style.transform = `translate(${rect.left - shell.left}px, ${rect.top - shell.top}px)`;
    tabShell.classList.add('is-thumb-ready');
  };
  const selectTab = kind => {
    tabs.forEach(tab => {
      const active = tab.dataset.tab === kind;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    cards.forEach(card => { card.hidden = card.dataset.courseKind !== kind; });
    updateThumb();
  };
  tabs.forEach(tab => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));
  const requestedTab = new URLSearchParams(location.search).get('tab');
  if (tabs.some(tab => tab.dataset.tab === requestedTab)) selectTab(requestedTab);
  document.querySelectorAll('[data-prototype-tab]').forEach(link => {
    link.addEventListener('click', () => selectTab(link.dataset.prototypeTab));
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.hasAttribute('data-prototype-disabled') || link.getAttribute('href') === '#' || /^(https?:|mailto:|tel:)/i.test(link.getAttribute('href'))) {
      event.preventDefault();
    }
  });
  window.addEventListener('resize', updateThumb);
  updateThumb();

  const chipRows = [...document.querySelectorAll('.home-course-card__chips')];
  if (chipRows.length) {
    const hiddenChips = new WeakMap();
    const moreButtons = new WeakMap();
    const tooltip = document.createElement('div');
    tooltip.className = 'home-course-chip-tooltip';
    tooltip.id = 'home-course-chip-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.append(tooltip);
    let activeRow = null;

    const hideTooltip = () => {
      if (activeRow) {
        const button = moreButtons.get(activeRow);
        button.setAttribute('aria-expanded', 'false');
        button.removeAttribute('aria-describedby');
      }
      activeRow = null;
      tooltip.hidden = true;
    };
    const updateRow = row => {
      const chips = [...row.querySelectorAll('.home-course-card__chip')];
      const button = moreButtons.get(row);
      chips.forEach(chip => { chip.hidden = false; });
      button.hidden = true;
      row.style.minHeight = '';
      const rowRect = row.getBoundingClientRect();
      if (!rowRect.width) {
        hiddenChips.set(row, []);
        if (activeRow === row) hideTooltip();
        return;
      }
      const widths = chips.map(chip => chip.getBoundingClientRect().width);
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, chips.length - 1);
      if (totalWidth <= rowRect.width + 1) {
        hiddenChips.set(row, []);
        if (activeRow === row) hideTooltip();
        return;
      }

      row.style.minHeight = `${Math.ceil(Math.max(...chips.map(chip => chip.getBoundingClientRect().height)))}px`;
      button.hidden = false;
      button.style.visibility = 'hidden';
      let visibleCount = 0;
      let visibleWidth = 0;
      for (let count = chips.length - 1; count >= 0; count--) {
        button.textContent = `+${chips.length - count}`;
        const chipWidth = widths.slice(0, count).reduce((sum, width) => sum + width, 0);
        const neededWidth = chipWidth + gap * count + button.getBoundingClientRect().width;
        if (neededWidth <= rowRect.width + 1) {
          visibleCount = count;
          visibleWidth = chipWidth + gap * count;
          break;
        }
      }

      const rest = chips.slice(visibleCount).map(chip => chip.textContent.trim());
      chips.forEach((chip, index) => { chip.hidden = index >= visibleCount; });
      button.textContent = `+${rest.length}`;
      button.setAttribute('aria-label', `Показать ещё ${rest.length} параметров курса`);
      const cardRect = row.closest('.home-course-card').getBoundingClientRect();
      button.style.left = `${rowRect.left - cardRect.left + visibleWidth}px`;
      button.style.top = `${rowRect.top - cardRect.top}px`;
      button.style.visibility = '';
      hiddenChips.set(row, rest);
      if (activeRow === row) hideTooltip();
    };
    const positionTooltip = button => {
      const rect = button.getBoundingClientRect();
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - tooltip.offsetWidth - 12));
      const below = rect.bottom + 8;
      const above = rect.top - tooltip.offsetHeight - 8;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${below + tooltip.offsetHeight <= window.innerHeight - 12 ? below : Math.max(12, above)}px`;
    };
    const showTooltip = row => {
      const rest = hiddenChips.get(row);
      if (!rest?.length) return;
      hideTooltip();
      const button = moreButtons.get(row);
      tooltip.textContent = rest.join(' · ');
      activeRow = row;
      tooltip.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-describedby', tooltip.id);
      positionTooltip(button);
    };
    const updateAllRows = () => chipRows.forEach(updateRow);

    chipRows.forEach(row => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'home-course-card__more';
      button.setAttribute('aria-controls', tooltip.id);
      button.setAttribute('aria-expanded', 'false');
      button.hidden = true;
      row.closest('.home-course-card').append(button);
      moreButtons.set(row, button);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (activeRow === row) hideTooltip();
        else showTooltip(row);
      });
    });
    tabs.forEach(tab => tab.addEventListener('click', () => requestAnimationFrame(updateAllRows)));
    window.addEventListener('resize', () => {
      hideTooltip();
      updateAllRows();
    });
    window.addEventListener('scroll', hideTooltip, { passive: true });
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('.home-course-card__more')) hideTooltip();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTooltip();
    });
    document.fonts?.ready.then(updateAllRows);
    requestAnimationFrame(updateAllRows);
  }

  const scrollTop = document.querySelector('.vb-scroll-top');
  const updateScrollTop = () => scrollTop?.classList.toggle('vb-scroll-top--visible', window.scrollY > 400);
  window.addEventListener('scroll', updateScrollTop, { passive: true });
  scrollTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  updateScrollTop();

  const a11yButton = document.querySelector('.header__accessibility-toggle');
  const a11yPanel = document.querySelector('#vb-a11y-panel');
  a11yButton?.addEventListener('click', () => {
    const open = a11yButton.getAttribute('aria-expanded') !== 'true';
    a11yButton.setAttribute('aria-expanded', String(open));
    a11yButton.setAttribute('aria-pressed', String(open));
    document.documentElement.classList.toggle('vb-a11y-toolbar-open', open);
    document.documentElement.classList.toggle('vb-a11y', open);
  });
  a11yPanel?.querySelectorAll('[data-vb-a11y-field]').forEach(input => {
    input.addEventListener('change', () => {
      const html = document.documentElement;
      [...html.classList].filter(name => name.startsWith('vb-a11y--')).forEach(name => html.classList.remove(name));
      const values = Object.fromEntries([...a11yPanel.querySelectorAll('[data-vb-a11y-field]')]
        .filter(field => field.checked).map(field => [field.dataset.vbA11yField, field.value]));
      if (values.fontScale === 'large') html.classList.add('vb-a11y--font-lg');
      if (values.fontScale === 'xlarge') html.classList.add('vb-a11y--font-xl');
      if (values.theme) html.classList.add(`vb-a11y--theme-${values.theme}`);
      if (values.fontFamily === 'serif') html.classList.add('vb-a11y--font-serif');
      if (values.spacing === 'wide') html.classList.add('vb-a11y--spacing-wide');
      if (values.images === 'off') html.classList.add('vb-a11y--images-off');
      a11yPanel.querySelectorAll('label').forEach(label => label.classList.toggle('is-active', !!label.querySelector('input:checked')));
    });
  });
  a11yPanel?.querySelector('[data-vb-a11y-reset]')?.addEventListener('click', () => {
    [...document.documentElement.classList].filter(name => name === 'vb-a11y' || name === 'vb-a11y-toolbar-open' || name.startsWith('vb-a11y--')).forEach(name => document.documentElement.classList.remove(name));
    a11yButton?.setAttribute('aria-expanded', 'false');
    a11yButton?.setAttribute('aria-pressed', 'false');
  });

  const reviewDialog = document.createElement('dialog');
  reviewDialog.className = 'home-review-dialog';
  reviewDialog.id = 'home-review-dialog';
  reviewDialog.setAttribute('aria-labelledby', 'home-review-dialog-name');
  reviewDialog.innerHTML = '<button class="home-review-dialog__close" type="button" aria-label="Закрыть отзыв">×</button><h3 class="home-review-dialog__name" id="home-review-dialog-name"></h3><p class="home-review-dialog__text"></p>';
  document.body.append(reviewDialog);
  reviewDialog.querySelector('.home-review-dialog__close').addEventListener('click', () => reviewDialog.close());
  reviewDialog.addEventListener('click', event => {
    if (event.target === reviewDialog) reviewDialog.close();
  });

  const reviews = [...document.querySelectorAll('#home-reviews .home-review-card__text-wrap[data-vb-review-text-wrap]')]
    .map((wrap, index) => {
      const text = wrap.querySelector('.home-review-card__text');
      const clip = wrap.querySelector('.home-review-card__text-clip');
      const oldMore = wrap.querySelector('[data-vb-review-more]');
      if (!text || !clip || !oldMore) return null;
      const more = document.createElement('button');
      more.type = 'button';
      more.className = oldMore.className;
      more.innerHTML = oldMore.innerHTML;
      more.hidden = true;
      text.id = `home-review-text-${index + 1}`;
      more.setAttribute('aria-controls', reviewDialog.id);
      more.setAttribute('aria-haspopup', 'dialog');
      oldMore.replaceWith(more);
      clip.style.removeProperty('max-height');
      wrap.classList.remove('is-truncated', 'is-expanded');
      const card = wrap.closest('.home-review-card');
      more.addEventListener('click', () => {
        reviewDialog.querySelector('.home-review-dialog__name').textContent = card?.querySelector('.home-review-card__name')?.textContent || 'Отзыв';
        reviewDialog.querySelector('.home-review-dialog__text').textContent = text.textContent;
        reviewDialog.showModal();
      });
      return { text, more };
    }).filter(Boolean);

  const refreshReviews = () => reviews.forEach(({ text, more }) => {
    text.classList.remove('is-clamped');
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    const needsCollapse = text.getBoundingClientRect().height > lineHeight * 5 + 1;
    text.classList.toggle('is-clamped', needsCollapse);
    more.hidden = !needsCollapse;
  });
  let reviewRefreshFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(reviewRefreshFrame);
    reviewRefreshFrame = requestAnimationFrame(refreshReviews);
  });
  document.fonts?.ready.then(refreshReviews);
  requestAnimationFrame(refreshReviews);

  const subscribeForm = document.querySelector('.footer-subscribe-form');
  subscribeForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!subscribeForm.reportValidity()) return;
    let message = subscribeForm.querySelector('.local-form-note');
    if (!message) {
      message = document.createElement('p');
      message.className = 'local-form-note';
      message.style.cssText = 'margin:12px 0 0;font-size:14px;line-height:1.4';
      subscribeForm.append(message);
    }
    message.textContent = 'Это локальный прототип. Подписка не отправлена.';
  });

  const feedbackForm = document.querySelector('[data-local-feedback]');
  if (feedbackForm) {
    const contactFields = {
      email: feedbackForm.querySelector('[name="email"]'),
      telegram: feedbackForm.querySelector('[name="telegram"]'),
      phone: feedbackForm.querySelector('[name="phone"]')
    };
    const status = feedbackForm.querySelector('[data-local-feedback-status]');
    const updatePreferredContact = () => {
      const preferred = feedbackForm.querySelector('[name="preferred_contact"]:checked')?.value;
      Object.entries(contactFields).forEach(([channel, field]) => {
        field.required = channel === preferred;
      });
      status.hidden = true;
    };
    feedbackForm.querySelectorAll('[name="preferred_contact"]').forEach(radio => {
      radio.addEventListener('change', updatePreferredContact);
    });
    feedbackForm.addEventListener('input', () => { status.hidden = true; });
    feedbackForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!feedbackForm.reportValidity()) return;
      status.textContent = 'Форма заполнена. В локальном прототипе заявка не отправляется.';
      status.hidden = false;
    });
    updatePreferredContact();
  }
})();
