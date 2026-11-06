(() => {
  // Keep short Russian words with the word they introduce, without changing markup.
  const leadWords = /(^|[\s(«„])((?:котор(?:ый|ая|ое|ые|ого|ому|ой|ую|ым|ыми|ых)|и|а|но|или|да|что|чтобы|если|как|не|ни|в|во|на|к|ко|с|со|о|об|обо|у|за|по|из|от|до|для|без|при|под|над|перед|про|через|он|она|оно|они|мы|вы|я|ты|его|её|их|нам|вам|мне|тебе|себя|свой|свои|свою|своё|это|этот|эта|эти|все|всё))([ \t]+)(?=[^\s])/giu;
  document.querySelectorAll('.vb-course-page h1, .vb-course-page h2, .vb-course-page h3, .vb-course-page p, .vb-course-page li').forEach(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      let value = node.nodeValue;
      for (let pass = 0; pass < 3; pass++) value = value.replace(leadWords, '$1$2\u00a0');
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  });

  const header = document.querySelector('#vb-site-header');
  const menuButton = header?.querySelector('.header__menu-toggle');
  const closeMenu = () => {
    header?.classList.remove('is-nav-open');
    document.body.classList.remove('vb-header-nav-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };
  menuButton?.addEventListener('click', () => {
    const open = !header.classList.contains('is-nav-open');
    header.classList.toggle('is-nav-open', open);
    document.body.classList.toggle('vb-header-nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  header?.querySelector('.header__backdrop')?.addEventListener('click', closeMenu);
  header?.querySelectorAll('.header-nav a').forEach(link => link.addEventListener('click', closeMenu));
  const mobileHeader = matchMedia('(max-width: 1200px)');
  mobileHeader.addEventListener('change', () => {
    if (!mobileHeader.matches) closeMenu();
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (link.hasAttribute('data-prototype-disabled') || href === '#' || /^(https?:|mailto:|tel:)/i.test(href)) event.preventDefault();
  });
  document.querySelectorAll('form[data-prototype-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      let status = form.querySelector('.prototype-form-status');
      if (!status) {
        status = document.createElement('p');
        status.className = 'prototype-form-status';
        form.append(status);
      }
      status.textContent = 'Это локальный прототип. Данные не отправляются.';
    });
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

  const timeline = document.querySelector('.vb-learning-timeline');
  const timelineRows = [...(timeline?.querySelectorAll('.vb-learning-timeline__row') || [])];
  if (timelineRows.length > 1) {
    const timelineList = timeline.querySelector('.vb-learning-timeline__list');
    const timelineTrack = timeline.querySelector('.vb-learning-timeline__track');
    const timelineProgress = timeline.querySelector('.vb-learning-timeline__progress');
    const timelineDots = timelineRows.map(row => row.querySelector('.vb-learning-timeline__dot'));
    const reducedTimelineMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let timelineFrame = 0;
    const updateTimeline = () => {
      timelineFrame = 0;
      const listTop = timelineList.getBoundingClientRect().top;
      const dotCenters = timelineDots.map(dot => dot.getBoundingClientRect().top + dot.offsetHeight / 2);
      const first = dotCenters[0];
      const last = dotCenters[dotCenters.length - 1];
      const lineLength = Math.max(last - first, 1);
      timelineTrack.style.top = `${first - listTop}px`;
      timelineTrack.style.height = `${lineLength}px`;

      const lineCursor = innerHeight * 0.58;
      const revealCursor = innerHeight * 0.84;
      const progress = Math.max(0, Math.min(1, (lineCursor - first) / lineLength));
      timelineProgress.style.transform = `scaleY(${progress.toFixed(4)})`;
      timelineRows.forEach((row, index) => {
        const reached = dotCenters[index] <= lineCursor;
        timelineDots[index].classList.toggle('is-active', reached);
        row.classList.toggle('is-revealed', reducedTimelineMotion.matches || dotCenters[index] <= revealCursor);
      });
      timeline.classList.add('is-ready');
    };
    const scheduleTimeline = () => {
      if (!timelineFrame) timelineFrame = requestAnimationFrame(updateTimeline);
    };
    addEventListener('scroll', scheduleTimeline, { passive: true });
    addEventListener('resize', scheduleTimeline);
    reducedTimelineMotion.addEventListener('change', scheduleTimeline);
    document.fonts?.ready.then(scheduleTimeline);
    scheduleTimeline();
  }

  const stepCards = [...document.querySelectorAll('.vb-course-steps__stack > .vb-course-step')];
  if (stepCards.length > 1) {
    const staticSteps = matchMedia('(prefers-reduced-motion: reduce)');
    let stepFrame = 0;
    const updateStepScale = () => {
      stepFrame = 0;
      if (staticSteps.matches) {
        stepCards.forEach(card => card.style.removeProperty('--vb-step-scale'));
        return;
      }
      const stickyTop = parseFloat(getComputedStyle(stepCards[0]).top) || 0;
      for (let index = 0; index < stepCards.length - 1; index++) {
        const card = stepCards[index];
        const cardHeight = card.offsetHeight;
        const nextTop = stepCards[index + 1].getBoundingClientRect().top;
        const pinned = card.getBoundingClientRect().top <= stickyTop + 1;
        const overlap = pinned ? Math.max(0, Math.min(1, (stickyTop + cardHeight - nextTop) / cardHeight)) : 0;
        card.style.setProperty('--vb-step-scale', (1 - overlap * 0.032).toFixed(4));
      }
    };
    const scheduleStepScale = () => {
      if (!stepFrame) stepFrame = requestAnimationFrame(updateStepScale);
    };
    addEventListener('scroll', scheduleStepScale, { passive: true });
    addEventListener('resize', scheduleStepScale);
    staticSteps.addEventListener('change', scheduleStepScale);
    scheduleStepScale();
  }

  const teachers = document.querySelector('.vb-course-section--teachers .vb-course-teachers-grid');
  const teachersPrev = document.querySelector('[data-teachers-prev]');
  const teachersNext = document.querySelector('[data-teachers-next]');
  if (teachers && teachersPrev && teachersNext) {
    const cardStep = () => {
      const cards = teachers.querySelectorAll('.vb-course-teacher-card');
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : teachers.clientWidth;
    };
    const updateTeacherButtons = () => {
      const maxScroll = teachers.scrollWidth - teachers.clientWidth;
      teachersPrev.disabled = teachers.scrollLeft < 2;
      teachersNext.disabled = teachers.scrollLeft >= maxScroll - 2;
    };
    teachersPrev.addEventListener('click', () => teachers.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
    teachersNext.addEventListener('click', () => teachers.scrollBy({ left: cardStep(), behavior: 'smooth' }));
    teachers.addEventListener('scroll', updateTeacherButtons, { passive: true });
    addEventListener('resize', updateTeacherButtons);
    updateTeacherButtons();
  }

  const promo = document.querySelector('#vb-tariff-promo-dialog');
  document.querySelector('[data-vb-tariff-promo-open]')?.addEventListener('click', () => promo?.showModal());
  promo?.querySelector('[data-vb-tariff-promo-close]')?.addEventListener('click', () => promo.close());
  promo?.addEventListener('click', event => { if (event.target === promo) promo.close(); });

  const signup = document.createElement('dialog');
  signup.className = 'prototype-signup';
  signup.innerHTML = `
    <form class="prototype-signup__card" method="dialog">
      <button class="prototype-signup__close" type="button" aria-label="Закрыть">×</button>
      <h2>Оставить заявку</h2>
      <p class="prototype-signup__tariff"></p>
      <label>Ваше имя<input name="name" autocomplete="name" required></label>
      <label>Электронная почта<input name="email" type="email" autocomplete="email" required></label>
      <label>Телефон<input name="phone" type="tel" autocomplete="tel" placeholder="+7 999 000-00-00"></label>
      <button class="prototype-signup__submit" type="submit">Продолжить</button>
      <p class="prototype-signup__status" role="status" hidden></p>
    </form>`;
  document.body.append(signup);
  signup.querySelector('.prototype-signup__close').addEventListener('click', () => signup.close());
  signup.addEventListener('click', event => { if (event.target === signup) signup.close(); });
  signup.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const status = signup.querySelector('.prototype-signup__status');
    status.textContent = 'Заявка показана только в прототипе. Данные не отправлены.';
    status.hidden = false;
  });
  document.querySelectorAll('.vb-course-tariff-cta--signup').forEach(button => {
    button.addEventListener('click', () => {
      signup.querySelector('.prototype-signup__tariff').textContent = button.closest('.vb-course-tariff-card')?.querySelector('.vb-course-tariff-name')?.textContent?.trim() || '';
      signup.querySelector('.prototype-signup__status').hidden = true;
      signup.showModal();
    });
  });
  promo?.querySelector('.vb-tariff-promo-modal__cta')?.addEventListener('click', event => {
    event.preventDefault();
    promo.close();
    signup.querySelector('.prototype-signup__tariff').textContent = 'Скидка 15% для выпускников';
    signup.querySelector('.prototype-signup__status').hidden = true;
    signup.showModal();
  });

  const scrollButton = document.querySelector('#vb-scroll-top');
  const updateScrollButton = () => {
    if (!scrollButton) return;
    const visible = scrollY > 500;
    scrollButton.classList.toggle('vb-scroll-top--visible', visible);
    scrollButton.setAttribute('aria-hidden', String(!visible));
    scrollButton.tabIndex = visible ? 0 : -1;
  };
  scrollButton?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  addEventListener('scroll', updateScrollButton, { passive: true });
  updateScrollButton();
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
})();
