/*
Readable static interaction script for the generated movie site.
*/

(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function setupMobileMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');

        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHeroSlider() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
        var prev = document.querySelector('[data-hero-prev]');
        var next = document.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        if (!slides.length) {
            return;
        }

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
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
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        var slider = document.querySelector('.hero-slider');
        if (slider) {
            slider.addEventListener('mouseenter', stop);
            slider.addEventListener('mouseleave', start);
        }

        show(0);
        start();
    }

    function setupImageFallbacks() {
        var images = document.querySelectorAll('img');
        images.forEach(function (image) {
            image.addEventListener('error', function () {
                image.classList.add('is-missing');
                image.setAttribute('aria-hidden', 'true');
            }, { once: true });
        });
    }

    function setupCardFilters() {
        var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-search]'));
        var typeSelects = Array.prototype.slice.call(document.querySelectorAll('[data-card-type]'));
        var yearSelects = Array.prototype.slice.call(document.querySelectorAll('[data-card-year]'));
        var grid = document.querySelector('[data-filter-grid]') || document.querySelector('.movie-grid');
        var noResults = document.querySelector('[data-no-results]');

        if (!grid || (!searchInputs.length && !typeSelects.length && !yearSelects.length)) {
            return;
        }

        var items = Array.prototype.slice.call(grid.querySelectorAll('.movie-card, tr[data-title]'));

        function filter() {
            var query = normalize(searchInputs[0] ? searchInputs[0].value : '');
            var type = normalize(typeSelects[0] ? typeSelects[0].value : '');
            var year = normalize(yearSelects[0] ? yearSelects[0].value : '');
            var visibleCount = 0;

            items.forEach(function (item) {
                var haystack = normalize([
                    item.getAttribute('data-title'),
                    item.getAttribute('data-region'),
                    item.getAttribute('data-type'),
                    item.getAttribute('data-year'),
                    item.getAttribute('data-genre'),
                    item.textContent
                ].join(' '));
                var itemType = normalize(item.getAttribute('data-type'));
                var itemYear = normalize(item.getAttribute('data-year'));
                var matchesQuery = !query || haystack.indexOf(query) !== -1;
                var matchesType = !type || itemType.indexOf(type) !== -1;
                var matchesYear = !year || itemYear.indexOf(year) !== -1;
                var visible = matchesQuery && matchesType && matchesYear;

                item.hidden = !visible;
                if (visible) {
                    visibleCount += 1;
                }
            });

            if (noResults) {
                noResults.hidden = visibleCount !== 0;
            }
        }

        searchInputs.concat(typeSelects, yearSelects).forEach(function (control) {
            control.addEventListener('input', filter);
            control.addEventListener('change', filter);
        });

        var params = new URLSearchParams(window.location.search);
        var queryParam = params.get('q');
        if (queryParam && searchInputs[0]) {
            searchInputs[0].value = queryParam;
        }

        filter();
    }

    function setupGlobalSearchRedirect() {
        var panels = document.querySelectorAll('.search-panel');

        panels.forEach(function (panel) {
            var input = panel.querySelector('[data-card-search]');
            if (!input) {
                return;
            }

            input.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter') {
                    return;
                }

                var currentGrid = document.querySelector('[data-filter-grid]');
                var onSearchPage = window.location.pathname.indexOf('search.html') !== -1;

                if (!currentGrid && !onSearchPage && input.value.trim()) {
                    event.preventDefault();
                    window.location.href = 'search.html?q=' + encodeURIComponent(input.value.trim());
                }
            });
        });
    }

    function setupPlayers() {
        var shells = Array.prototype.slice.call(document.querySelectorAll('[data-video-shell]'));

        shells.forEach(function (shell) {
            var video = shell.querySelector('video[data-video-src]');
            var button = shell.querySelector('[data-video-play]');
            var note = document.querySelector('[data-player-note]');
            var hlsInstance = null;
            var initialized = false;

            if (!video || !button) {
                return;
            }

            function setNote(message) {
                if (note) {
                    note.textContent = message;
                }
            }

            function initializePlayer() {
                if (initialized) {
                    video.play().catch(function () {});
                    return;
                }

                initialized = true;
                var source = video.getAttribute('data-video-src');

                if (!source) {
                    setNote('当前影片暂未配置可用播放源。');
                    initialized = false;
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });

                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        shell.classList.add('is-playing');
                        setNote('播放源已加载，可以正常观看。');
                        video.play().catch(function () {
                            setNote('播放源已加载，请再次点击播放器开始播放。');
                        });
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setNote('播放源加载遇到网络或解码问题，请刷新后重试。');
                            if (hlsInstance) {
                                hlsInstance.destroy();
                                hlsInstance = null;
                            }
                            initialized = false;
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    shell.classList.add('is-playing');
                    setNote('正在使用浏览器原生 HLS 播放。');
                    video.play().catch(function () {
                        setNote('播放源已加载，请再次点击播放器开始播放。');
                    });
                } else {
                    video.src = source;
                    shell.classList.add('is-playing');
                    setNote('浏览器不支持 HLS.js 时会尝试直接播放该视频源。');
                    video.play().catch(function () {});
                }
            }

            button.addEventListener('click', initializePlayer);
            video.addEventListener('play', function () {
                shell.classList.add('is-playing');
            });
            video.addEventListener('pause', function () {
                if (video.currentTime === 0 || video.ended) {
                    shell.classList.remove('is-playing');
                }
            });
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        setupMobileMenu();
        setupHeroSlider();
        setupImageFallbacks();
        setupCardFilters();
        setupGlobalSearchRedirect();
        setupPlayers();
    });
})();
