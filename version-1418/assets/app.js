(function () {
    function qs(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function qsa(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function normalize(text) {
        return String(text || "").toLowerCase().trim();
    }

    function buildSearchUrl(form) {
        var input = qs('input[name="q"], input[type="search"]', form);
        var query = input ? input.value.trim() : "";
        if (query) {
            window.location.href = "./search.html?q=" + encodeURIComponent(query);
        }
    }

    qsa("[data-search-form]").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            buildSearchUrl(form);
        });
    });

    var menuButton = qs("[data-menu-button]");
    var mobileMenu = qs("[data-mobile-menu]");
    if (menuButton && mobileMenu) {
        menuButton.addEventListener("click", function () {
            mobileMenu.classList.toggle("is-open");
        });
    }

    qsa("[data-local-filter]").forEach(function (form) {
        var input = qs("input", form);
        form.addEventListener("submit", function (event) {
            event.preventDefault();
        });
        if (!input) {
            return;
        }
        input.addEventListener("input", function () {
            var value = normalize(input.value);
            qsa("[data-card]").forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-year"),
                    card.textContent
                ].join(" "));
                card.classList.toggle("is-hidden-card", value && haystack.indexOf(value) === -1);
            });
        });
    });

    qsa("[data-hero]").forEach(function (hero) {
        var slides = qsa("[data-hero-slide]", hero);
        var dots = qsa("[data-hero-dot]", hero);
        var prev = qs("[data-hero-prev]", hero);
        var next = qs("[data-hero-next]", hero);
        var index = 0;
        var timer;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 6200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                show(dotIndex);
                start();
            });
        });

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

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    });

    function renderSearchPage() {
        var results = qs("#searchResults");
        if (!results || !window.SITE_SEARCH_INDEX) {
            return;
        }
        var form = qs("[data-search-page-form]");
        var input = form ? qs('input[name="q"]', form) : null;
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        if (input) {
            input.value = query;
        }
        var normalized = normalize(query);
        var items = window.SITE_SEARCH_INDEX.filter(function (item) {
            if (!normalized) {
                return true;
            }
            return normalize([
                item.title,
                item.region,
                item.type,
                item.year,
                item.genre,
                item.tags,
                item.intro
            ].join(" ")).indexOf(normalized) !== -1;
        }).slice(0, 240);
        if (!items.length) {
            results.innerHTML = '<div class="search-empty">没有找到匹配内容</div>';
            return;
        }
        results.innerHTML = items.map(function (item) {
            var tags = item.tags.slice(0, 3).map(function (tag) {
                return '<span>' + escapeHtml(tag) + '</span>';
            }).join("");
            return '<article class="movie-card" data-card>' +
                '<a class="movie-poster" href="./' + item.link + '" aria-label="观看' + escapeHtml(item.title) + '">' +
                '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '海报" loading="lazy">' +
                '<span class="poster-shade"></span>' +
                '<span class="poster-badge">' + escapeHtml(item.year) + '</span>' +
                '<span class="poster-play">▶</span>' +
                '</a>' +
                '<div class="movie-card-body">' +
                '<div class="movie-meta-line"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
                '<h3><a href="./' + item.link + '">' + escapeHtml(item.title) + '</a></h3>' +
                '<p>' + escapeHtml(item.intro) + '</p>' +
                '<div class="tag-row">' + tags + '</div>' +
                '</div>' +
                '</article>';
        }).join("");
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"]/g, function (mark) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;"
            }[mark];
        });
    }

    window.setupPlayer = function (streamUrl) {
        var video = qs("#movieVideo");
        var cover = qs("#playCover");
        var attached = false;
        var hlsInstance = null;

        if (!video || !streamUrl) {
            return;
        }

        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add("is-hidden");
            }
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {
                    if (cover) {
                        cover.classList.remove("is-hidden");
                    }
                });
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });

        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });

        video.addEventListener("ended", function () {
            if (cover) {
                cover.classList.remove("is-hidden");
            }
        });

        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    renderSearchPage();
})();
