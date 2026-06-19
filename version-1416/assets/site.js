(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (window.__hlsLoading) {
      return window.__hlsLoading;
    }
    window.__hlsLoading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window.__hlsLoading;
  }

  function setupImages() {
    document.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("image-missing");
      });
    });
  }

  function setupMenus() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupSearchForms() {
    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        if (!query) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        window.location.href = "./search.html?q=" + encodeURIComponent(query);
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });

    show(0);
    if (slides.length > 1) {
      setInterval(function () {
        show(current + 1);
      }, 5200);
    }
  }

  function setupFilters() {
    var filterBox = document.querySelector("[data-filter-box]");
    if (!filterBox) {
      return;
    }
    var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
    var input = filterBox.querySelector("[data-filter-search]");
    var year = filterBox.querySelector("[data-filter-year]");
    var type = filterBox.querySelector("[data-filter-type]");
    var empty = document.querySelector("[data-empty-state]");

    function includes(value, query) {
      return String(value || "").toLowerCase().indexOf(query) !== -1;
    }

    function apply() {
      var q = input ? input.value.trim().toLowerCase() : "";
      var y = year ? year.value : "";
      var t = type ? type.value : "";
      var visible = 0;

      cards.forEach(function (card) {
        var text = [
          card.dataset.title,
          card.dataset.genre,
          card.dataset.region,
          card.dataset.type
        ].join(" ");
        var matchQuery = !q || includes(text, q);
        var matchYear = !y || card.dataset.year === y;
        var matchType = !t || card.dataset.type === t;
        var show = matchQuery && matchYear && matchType;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    [input, year, type].forEach(function (el) {
      if (el) {
        el.addEventListener("input", apply);
        el.addEventListener("change", apply);
      }
    });
    apply();
  }

  function setupSearchPage() {
    var form = document.querySelector("[data-search-page]");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");
    if (!form || !results || !window.SEARCH_INDEX) {
      return;
    }
    var input = form.querySelector("input[name='q']");

    function card(item) {
      return [
        '<a class="movie-card" href="./' + item.url + '" data-title="' + escapeHtml(item.title) + '">',
        '  <span class="poster-frame">',
        '    <img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '    <span class="poster-shade"></span>',
        '    <span class="card-badge">' + item.year + '</span>',
        '    <span class="play-dot">▶</span>',
        '  </span>',
        '  <span class="card-body">',
        '    <strong>' + escapeHtml(item.title) + '</strong>',
        '    <em>' + escapeHtml(item.region) + ' · ' + escapeHtml(item.type) + '</em>',
        '    <small>' + escapeHtml(item.oneLine) + '</small>',
        '    <span class="tag-row"><span>' + escapeHtml(item.genre) + '</span></span>',
        '  </span>',
        '</a>'
      ].join("");
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[ch];
      });
    }

    function run(query) {
      var q = String(query || "").trim().toLowerCase();
      input.value = q;
      if (!q) {
        results.innerHTML = "";
        if (empty) {
          empty.classList.add("is-visible");
        }
        return;
      }

      var matched = window.SEARCH_INDEX.filter(function (item) {
        return [
          item.title,
          item.region,
          item.type,
          item.year,
          item.genre,
          item.tags,
          item.oneLine
        ].join(" ").toLowerCase().indexOf(q) !== -1;
      }).slice(0, 120);

      results.innerHTML = matched.map(card).join("");
      setupImages();
      if (empty) {
        empty.classList.toggle("is-visible", matched.length === 0);
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      run(input.value);
    });

    var params = new URLSearchParams(window.location.search);
    run(params.get("q") || "");
  }

  function setupPlayers() {
    document.querySelectorAll(".player-card").forEach(function (card) {
      var video = card.querySelector("video[data-src]");
      var cover = card.querySelector(".player-cover");
      var button = card.querySelector(".play-button");
      if (!video || !cover || !button) {
        return;
      }

      function start() {
        var source = video.dataset.src;
        if (!source) {
          return;
        }

        function playNow() {
          card.classList.add("is-playing");
          var result = video.play();
          if (result && result.catch) {
            result.catch(function () {});
          }
        }

        if (video.dataset.ready === "true") {
          playNow();
          return;
        }

        video.dataset.ready = "true";
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          playNow();
          return;
        }

        loadHls().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, playNow);
            video.__hls = hls;
          } else {
            video.src = source;
            playNow();
          }
        }).catch(function () {
          video.src = source;
          playNow();
        });
      }

      cover.addEventListener("click", start);
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        start();
      });
    });
  }

  ready(function () {
    setupImages();
    setupMenus();
    setupSearchForms();
    setupHero();
    setupFilters();
    setupSearchPage();
    setupPlayers();
  });
})();
