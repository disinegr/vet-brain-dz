(() => {
  const scriptBase = new URL('.', document.currentScript.src);
  const icons = Object.fromEntries(
    ['player-play', 'player-pause', 'volume', 'volume-off', 'maximize', 'minimize']
      .map(name => [name, new URL(`./assets/tabler/${name}.svg`, scriptBase).href])
  );

  document.querySelectorAll('.vb-course-video').forEach(section => {
    const frame = section.querySelector('[data-video-frame]');
    const trigger = section.querySelector('.vb-course-video__trigger');
    const label = section.querySelector('.vb-course-video__label');
    const provider = section.dataset.videoProvider?.trim().toLowerCase();
    const source = section.dataset.videoSrc?.trim();
    if (!frame || !trigger || !source) return;

    let url;
    try { url = new URL(source, document.baseURI); } catch { return; }
    const kind = videoKind(provider, url);
    if (!kind) return;

    trigger.disabled = false;
    trigger.setAttribute('aria-label', 'Смотреть фрагмент курса');
    if (label) label.textContent = 'Смотреть фрагмент курса';
    trigger.addEventListener('click', () => {
      if (kind === 'file') mountFilePlayer(frame, url, icons);
      else mountEmbed(frame, kind, url);
    }, { once: true });
  });

  function videoKind(provider, url) {
    if (provider === 'file') {
      return ['file:', 'http:', 'https:'].includes(url.protocol) && /\.(mp4|webm|ogg)$/i.test(url.pathname) ? 'file' : null;
    }
    if (provider === 'vk') {
      return url.protocol === 'https:' &&
        ['vkvideo.ru', 'www.vkvideo.ru', 'vk.com', 'www.vk.com'].includes(url.hostname.toLowerCase()) &&
        url.pathname === '/video_ext.php' && url.searchParams.has('oid') && url.searchParams.has('id') ? 'vk' : null;
    }
    if (provider === 'youtube') {
      const host = url.hostname.toLowerCase();
      const id = host === 'youtu.be' ? url.pathname.slice(1) :
        ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) ?
          url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] : '';
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? 'youtube' : null;
    }
    return null;
  }

  function mountEmbed(frame, kind, url) {
    const iframe = document.createElement('iframe');
    if (kind === 'vk') {
      url.searchParams.set('autoplay', '1');
      iframe.src = url.href;
    } else {
      const id = url.hostname.toLowerCase() === 'youtu.be' ? url.pathname.slice(1) :
        url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    }
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.title = kind === 'vk' ? 'Фрагмент курса — VK Видео' : 'Фрагмент курса — YouTube';
    frame.replaceChildren(iframe);
  }

  function mountFilePlayer(frame, url, icons) {
    const poster = frame.querySelector('.vb-course-video__poster')?.src;
    const video = document.createElement('video');
    video.src = url.href;
    video.playsInline = true;
    video.preload = 'metadata';
    video.tabIndex = 0;
    video.setAttribute('aria-label', 'Фрагмент курса');
    if (poster) video.poster = poster;

    const controls = document.createElement('div');
    controls.className = 'vb-course-video__controls';
    const play = iconButton('Воспроизвести', icons['player-play'], 'vb-course-video__control--play');
    const seek = range('Положение видео', 0, 1000, 1, 0, 'vb-course-video__seek');
    const time = document.createElement('span');
    time.className = 'vb-course-video__time';
    time.textContent = '0:00 / 0:00';
    const mute = iconButton('Выключить звук', icons.volume, 'vb-course-video__control--mute');
    const volume = range('Громкость', 0, 1, .05, 1, 'vb-course-video__volume');
    const fullscreen = iconButton('Полный экран', icons.maximize, 'vb-course-video__control--fullscreen');
    controls.append(play, seek, time, mute, volume, fullscreen);
    const error = document.createElement('p');
    error.className = 'vb-course-video__error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    error.textContent = 'Не удалось загрузить видео.';
    frame.replaceChildren(video, error, controls);
    frame.classList.add('vb-course-video__frame--file');

    const toggle = () => video.paused ? video.play().catch(() => {}) : video.pause();
    const sync = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const progress = duration ? Math.min(100, video.currentTime / duration * 100) : 0;
      seek.value = String(Math.round(progress * 10));
      seek.style.setProperty('--vb-video-progress', `${progress}%`);
      time.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
      play.setAttribute('aria-label', video.paused ? 'Воспроизвести' : 'Пауза');
      play.querySelector('img').src = icons[video.paused ? 'player-play' : 'player-pause'];
      mute.setAttribute('aria-label', video.muted || video.volume === 0 ? 'Включить звук' : 'Выключить звук');
      mute.querySelector('img').src = icons[video.muted || video.volume === 0 ? 'volume-off' : 'volume'];
      volume.value = String(video.muted ? 0 : video.volume);
      volume.style.setProperty('--vb-video-progress', `${Number(volume.value) * 100}%`);
      frame.classList.toggle('vb-course-video__frame--paused', video.paused);
    };
    const syncFullscreen = () => {
      const active = document.fullscreenElement === frame;
      fullscreen.setAttribute('aria-label', active ? 'Выйти из полного экрана' : 'Полный экран');
      fullscreen.querySelector('img').src = icons[active ? 'minimize' : 'maximize'];
    };
    function showError() {
      error.hidden = false;
      video.pause();
    }

    play.addEventListener('click', toggle);
    video.addEventListener('click', toggle);
    video.addEventListener('keydown', event => {
      if (event.code === 'Space' || event.key.toLowerCase() === 'k') { event.preventDefault(); toggle(); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
      }
      if (event.key.toLowerCase() === 'm') video.muted = !video.muted;
    });
    seek.addEventListener('input', () => {
      if (Number.isFinite(video.duration)) video.currentTime = video.duration * Number(seek.value) / 1000;
    });
    mute.addEventListener('click', () => { video.muted = !video.muted; });
    volume.addEventListener('input', () => {
      video.volume = Number(volume.value);
      video.muted = video.volume === 0;
    });
    fullscreen.addEventListener('click', () => {
      if (document.fullscreenElement === frame) document.exitFullscreen?.();
      else frame.requestFullscreen?.();
    });
    document.addEventListener('fullscreenchange', syncFullscreen);
    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'volumechange'].forEach(name => video.addEventListener(name, sync));
    video.addEventListener('error', showError);
    sync();
    video.play().catch(() => {});
  }

  function iconButton(name, src, extraClass) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `vb-course-video__control ${extraClass}`;
    button.setAttribute('aria-label', name);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    button.append(img);
    return button;
  }

  function range(name, min, max, step, value, className) {
    const input = document.createElement('input');
    input.type = 'range';
    input.className = className;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute('aria-label', name);
    return input;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = String(total % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
  }
})();
