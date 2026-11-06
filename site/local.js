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
  const compactHeader = matchMedia('(max-width: 1200px)');
  compactHeader.addEventListener('change', () => {
    if (!compactHeader.matches) closeMenu();
  });
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
    const priority = chip => {
      const label = chip.textContent.trim().toLowerCase();
      if (label === 'дпо') return 0;
      if (label.startsWith('скидка') || label.startsWith('старт') || label === 'бесплатный семинар') return 1;
      if (label === 'курс' || label === 'вебинар') return 2;
      return 3;
    };
    chipRows.forEach(row => {
      [...row.children].sort((a, b) => priority(a) - priority(b)).forEach(chip => row.append(chip));
    });
    const updateRow = row => {
      const chips = [...row.querySelectorAll('.home-course-card__chip')];
      chips.forEach(chip => { chip.hidden = false; });
      const rowRect = row.getBoundingClientRect();
      if (!rowRect.width) return;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      let used = 0;
      chips.forEach((chip, index) => {
        const width = chip.getBoundingClientRect().width;
        const next = used + (used ? gap : 0) + width;
        if (index > 0 && next > rowRect.width + 1) chip.hidden = true;
        else used = next;
      });
    };
    const updateAllRows = () => chipRows.forEach(updateRow);
    tabs.forEach(tab => tab.addEventListener('click', () => requestAnimationFrame(updateAllRows)));
    window.addEventListener('resize', updateAllRows);
    document.fonts?.ready.then(updateAllRows);
    requestAnimationFrame(updateAllRows);
  }

  const teachers = document.querySelector('.home-teachers__grid');
  const teachersPrev = document.querySelector('[data-home-teachers-prev]');
  const teachersNext = document.querySelector('[data-home-teachers-next]');
  if (teachers && teachersPrev && teachersNext) {
    const cardStep = () => {
      const teacherCards = teachers.querySelectorAll('.home-teacher-card');
      return teacherCards.length > 1 ? teacherCards[1].offsetLeft - teacherCards[0].offsetLeft : teachers.clientWidth;
    };
    const updateButtons = () => {
      const maxScroll = teachers.scrollWidth - teachers.clientWidth;
      teachersPrev.disabled = teachers.scrollLeft < 2;
      teachersNext.disabled = teachers.scrollLeft >= maxScroll - 2;
    };
    teachersPrev.addEventListener('click', () => teachers.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
    teachersNext.addEventListener('click', () => teachers.scrollBy({ left: cardStep(), behavior: 'smooth' }));
    teachers.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
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
