
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initScrollTop() {
    document.querySelectorAll('[data-scroll-top]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    document.querySelectorAll('[data-filter-form]').forEach(function (form) {
      var scope = form.closest('main') || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
      var empty = scope.querySelector('[data-empty]');
      var search = form.querySelector('[data-search]');
      var selects = Array.prototype.slice.call(form.querySelectorAll('[data-select]'));

      function apply() {
        var query = normalize(search && search.value);
        var filters = {};
        selects.forEach(function (select) {
          filters[select.getAttribute('data-select')] = normalize(select.value);
        });
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-tags')
          ].join(' '));
          var matched = true;
          if (query && text.indexOf(query) === -1) {
            matched = false;
          }
          Object.keys(filters).forEach(function (key) {
            var value = filters[key];
            if (!value) {
              return;
            }
            var cardValue = normalize(card.getAttribute('data-' + key));
            if (key === 'type') {
              if (cardValue.indexOf(value) === -1) {
                matched = false;
              }
            } else if (cardValue !== value) {
              matched = false;
            }
          });
          card.hidden = !matched;
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      if (search) {
        search.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      form.addEventListener('reset', function () {
        window.setTimeout(apply, 0);
      });
      apply();
    });
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play]');
      var source = player.getAttribute('data-src');
      var hlsInstance = null;
      var loaded = false;

      function playVideo() {
        if (!video || !source) {
          return;
        }
        if (button) {
          button.classList.add('is-hidden');
        }
        video.controls = true;
        if (!loaded) {
          loaded = true;
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', function () {
              video.play().catch(function () {});
            }, { once: true });
          } else {
            video.src = source;
            video.play().catch(function () {});
          }
        } else {
          video.play().catch(function () {});
        }
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            playVideo();
          }
        });
        video.addEventListener('error', function () {
          if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
          }
        });
      }
    });
  }

  ready(function () {
    initMenu();
    initScrollTop();
    initHero();
    initFilters();
    initPlayers();
  });
})();
