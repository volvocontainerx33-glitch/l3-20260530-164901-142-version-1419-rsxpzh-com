(function () {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMobileMenu() {
    var button = $("[data-mobile-menu-button]");
    var menu = $("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("open");
      button.textContent = menu.classList.contains("open") ? "×" : "☰";
    });
  }

  function initHeroCarousel() {
    var carousel = $("[data-hero-carousel]");
    if (!carousel) {
      return;
    }

    var slides = $all("[data-hero-slide]", carousel);
    var dots = $all("[data-hero-dot]", carousel);
    var prev = $("[data-hero-prev]", carousel);
    var next = $("[data-hero-next]", carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5500);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var panels = $all("[data-filter-panel]");
    panels.forEach(function (panel) {
      var input = $("[data-search-input]", panel);
      var region = $("[data-region-filter]", panel);
      var year = $("[data-year-filter]", panel);
      var type = $("[data-type-filter]", panel);
      var category = $("[data-category-filter]", panel);
      var targetSelector = panel.getAttribute("data-filter-target") || "[data-card]";
      var cards = $all(targetSelector);
      var count = $("[data-result-count]");
      var empty = $("[data-empty-message]");

      function valueOf(control) {
        return control ? String(control.value || "").toLowerCase().trim() : "";
      }

      function apply() {
        var keyword = valueOf(input);
        var regionValue = valueOf(region);
        var yearValue = valueOf(year);
        var typeValue = valueOf(type);
        var categoryValue = valueOf(category);
        var shown = 0;

        cards.forEach(function (card) {
          var text = String(card.getAttribute("data-search") || "").toLowerCase();
          var ok = true;

          if (keyword && text.indexOf(keyword) === -1) {
            ok = false;
          }
          if (regionValue && String(card.getAttribute("data-region") || "").toLowerCase() !== regionValue) {
            ok = false;
          }
          if (yearValue && String(card.getAttribute("data-year") || "").toLowerCase() !== yearValue) {
            ok = false;
          }
          if (typeValue && String(card.getAttribute("data-type") || "").toLowerCase() !== typeValue) {
            ok = false;
          }
          if (categoryValue && String(card.getAttribute("data-category") || "").toLowerCase() !== categoryValue) {
            ok = false;
          }

          card.style.display = ok ? "" : "none";
          if (ok) {
            shown += 1;
          }
        });

        if (count) {
          count.textContent = String(shown);
        }
        if (empty) {
          empty.classList.toggle("show", shown === 0);
        }
      }

      [input, region, year, type, category].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  function initPlayers() {
    $all("[data-player]").forEach(function (player) {
      var button = $("[data-play-button]", player);
      var cover = $("[data-player-cover]", player);
      var video = $("video", player);
      var status = $("[data-player-status]", player);
      var src = player.getAttribute("data-video-src");
      var started = false;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function playVideo() {
        if (!video || !src) {
          setStatus("播放源暂不可用");
          return;
        }

        if (!started) {
          started = true;
          if (cover) {
            cover.classList.add("hidden");
          }

          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
          } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setStatus("播放器遇到网络或解码错误，请刷新后重试。");
              }
            });
          } else {
            video.src = src;
          }
        }

        video.setAttribute("controls", "controls");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            setStatus("已加载播放源，请再次点击播放或使用播放器控制栏开始播放。");
          });
        }
      }

      if (button) {
        button.addEventListener("click", playVideo);
      }
      if (cover) {
        cover.addEventListener("click", playVideo);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroCarousel();
    initFilters();
    initPlayers();
  });
})();
