(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(text) {
    return (text || '').toString().toLowerCase().trim();
  }

  function setupHeader() {
    var header = qs('[data-header]');
    var toggle = qs('[data-menu-toggle]');

    if (!header) {
      return;
    }

    function updateHeader() {
      if (window.scrollY > 18) {
        header.classList.add('is-solid');
      } else {
        header.classList.remove('is-solid');
      }
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (toggle) {
      toggle.addEventListener('click', function () {
        header.classList.toggle('is-open');
        document.body.classList.toggle('no-scroll', header.classList.contains('is-open'));
      });
    }

    qsa('[data-close-menu]').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var active = 0;
    var timer = null;

    if (slides.length <= 1) {
      return;
    }

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
        dot.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    var filterRoot = qs('[data-filter-root]');
    if (!filterRoot) {
      return;
    }

    var input = qs('[data-filter-input]', filterRoot);
    var yearSelect = qs('[data-filter-year]', filterRoot);
    var typeSelect = qs('[data-filter-type]', filterRoot);
    var cards = qsa('[data-movie-card]');
    var count = qs('[data-result-count]');
    var empty = qs('[data-empty-result]');

    if (input) {
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q');
      if (query) {
        input.value = query;
      }
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : '');
      var year = yearSelect ? yearSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute('data-search'));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchYear = !year || card.getAttribute('data-year') === year;
        var matchType = !type || card.getAttribute('data-type') === type;
        var show = matchKeyword && matchYear && matchType;

        card.classList.toggle('is-hidden', !show);
        if (show) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部';
      }
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [input, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  function loadHlsLibrary(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    var existing = qs('script[data-hls-loader]');
    if (existing) {
      existing.addEventListener('load', callback, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.async = true;
    script.setAttribute('data-hls-loader', 'true');
    script.onload = callback;
    script.onerror = callback;
    document.head.appendChild(script);
  }

  function setupPlayer() {
    var playerBox = qs('[data-player-box]');
    if (!playerBox) {
      return;
    }

    var video = qs('[data-video]', playerBox);
    var button = qs('[data-player-button]', playerBox);
    var status = qs('[data-player-status]');
    var src = playerBox.getAttribute('data-src');
    var hlsInstance = null;

    if (!video || !button) {
      return;
    }

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function attachSource() {
      if (!src) {
        setStatus('当前影片暂未配置播放源。');
        return;
      }

      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.classList.add('is-ready');
          video.play().catch(function () {
            setStatus('播放源已加载，请点击播放器继续播放。');
          });
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus('播放源加载失败，请稍后重试。');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.classList.add('is-ready');
        video.play().catch(function () {
          setStatus('播放源已加载，请点击播放器继续播放。');
        });
      } else {
        video.src = src;
        video.classList.add('is-ready');
        setStatus('浏览器正在尝试直接打开播放源。');
        video.play().catch(function () {
          setStatus('当前浏览器需要 HLS 支持，请刷新或更换浏览器。');
        });
      }
    }

    button.addEventListener('click', function () {
      setStatus('正在加载高清播放源...');
      loadHlsLibrary(attachSource);
    });
  }

  function setupImageFallbacks() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-missing');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupHeader();
    setupHero();
    setupFilters();
    setupPlayer();
    setupImageFallbacks();
  });
})();
