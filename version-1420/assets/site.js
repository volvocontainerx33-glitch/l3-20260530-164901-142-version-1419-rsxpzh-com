const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-main-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

function initHero() {
  const hero = $('[data-hero]');
  if (!hero) return;
  const slides = $$('[data-hero-slide]', hero);
  const dots = $$('[data-hero-dot]', hero);
  if (slides.length < 2) return;
  let active = 0;
  let timer = null;

  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
  };

  const start = () => {
    timer = window.setInterval(() => show(active + 1), 5200);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      window.clearInterval(timer);
      show(index);
      start();
    });
  });

  start();
}

function initFilters() {
  const grid = $('.filter-grid');
  if (!grid) return;
  const cards = $$('.movie-card', grid);
  const searchInput = $('.movie-search');
  const selects = $$('.filter-select');
  const sortSelect = $('.sort-select');
  const status = $('[data-result-status]');

  const normalize = (value) => String(value || '').toLowerCase().trim();

  const apply = () => {
    const query = normalize(searchInput ? searchInput.value : '');
    const filters = selects.map((select) => ({
      field: select.dataset.filterField,
      value: normalize(select.value)
    }));

    let visibleCount = 0;
    cards.forEach((card) => {
      const keywords = normalize(card.dataset.keywords);
      const matchedQuery = !query || keywords.includes(query);
      const matchedFilters = filters.every((filter) => {
        if (!filter.value) return true;
        return normalize(card.dataset[filter.field]).includes(filter.value);
      });
      const visible = matchedQuery && matchedFilters;
      card.classList.toggle('is-hidden', !visible);
      if (visible) visibleCount += 1;
    });

    if (status) {
      status.textContent = visibleCount ? '已筛选出匹配内容' : '没有匹配内容';
    }
  };

  const sortCards = () => {
    if (!sortSelect) return;
    const mode = sortSelect.value;
    const sorted = cards.slice().sort((a, b) => {
      if (mode === 'hot-desc') {
        return Number(b.dataset.hot) - Number(a.dataset.hot);
      }
      if (mode === 'title-asc') {
        return String(a.dataset.title).localeCompare(String(b.dataset.title), 'zh-Hans-CN');
      }
      return Number(b.dataset.year) - Number(a.dataset.year);
    });
    sorted.forEach((card) => grid.appendChild(card));
    apply();
  };

  if (searchInput) {
    searchInput.addEventListener('input', apply);
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) searchInput.value = q;
  }
  selects.forEach((select) => select.addEventListener('change', apply));
  if (sortSelect) sortSelect.addEventListener('change', sortCards);
  sortCards();
  apply();
}

const playerState = new WeakMap();

async function attachSource(video) {
  const src = video.dataset.src;
  if (!src) return;
  if (playerState.get(video)) return;
  playerState.set(video, true);

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
    return;
  }

  try {
    const module = await import('./hls-dru42stk.js');
    const Hls = module.H;
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      video._hls = hls;
      return;
    }
  } catch (error) {
    playerState.delete(video);
  }

  video.src = src;
}

function initPlayers() {
  const boxes = $$('[data-video-box]');
  boxes.forEach((box) => {
    const video = $('.video-player', box);
    const button = $('[data-play-button]', box);
    if (!video || !button) return;

    const play = async () => {
      await attachSource(video);
      box.classList.add('is-playing');
      try {
        await video.play();
      } catch (error) {
        box.classList.remove('is-playing');
      }
    };

    button.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) play();
    });
    video.addEventListener('play', () => box.classList.add('is-playing'));
    video.addEventListener('pause', () => {
      if (!video.seeking && video.currentTime === 0) {
        box.classList.remove('is-playing');
      }
    });
  });
}

initMenu();
initHero();
initFilters();
initPlayers();
