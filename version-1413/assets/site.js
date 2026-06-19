(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var menuButton = document.querySelector(".mobile-menu-button");
        var mobileNav = document.querySelector(".mobile-nav");
        if (menuButton && mobileNav) {
            menuButton.addEventListener("click", function () {
                var opened = mobileNav.classList.toggle("is-open");
                menuButton.setAttribute("aria-expanded", opened ? "true" : "false");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        if (slides.length > 1) {
            var current = 0;
            var showSlide = function (index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle("active", i === current);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("active", i === current);
                });
            };
            dots.forEach(function (dot, i) {
                dot.addEventListener("click", function () {
                    showSlide(i);
                });
            });
            setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }

        var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
        panels.forEach(function (panel) {
            var scope = panel.parentElement.querySelector(".filter-scope");
            if (!scope) {
                scope = document.querySelector(".filter-scope");
            }
            if (!scope) {
                return;
            }
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
            var searchInput = panel.querySelector(".movie-search");
            var selects = Array.prototype.slice.call(panel.querySelectorAll(".filter-select"));
            var apply = function () {
                var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
                var filters = {};
                selects.forEach(function (select) {
                    if (select.value) {
                        filters[select.getAttribute("data-filter")] = select.value;
                    }
                });
                cards.forEach(function (card) {
                    var bag = [
                        card.getAttribute("data-title"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-category"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-tags")
                    ].join(" ").toLowerCase();
                    var matched = !query || bag.indexOf(query) !== -1;
                    Object.keys(filters).forEach(function (key) {
                        if ((card.getAttribute("data-" + key) || "") !== filters[key]) {
                            matched = false;
                        }
                    });
                    card.classList.toggle("is-hidden", !matched);
                });
            };
            if (searchInput) {
                searchInput.addEventListener("input", apply);
            }
            selects.forEach(function (select) {
                select.addEventListener("change", apply);
            });
        });
    });
})();

function initMoviePlayer(streamUrl) {
    var video = document.getElementById("movie-player");
    var overlay = document.getElementById("play-overlay");
    if (!video || !streamUrl) {
        return;
    }
    var attached = false;
    var bind = function () {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
    };
    var start = function () {
        bind();
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
                if (overlay) {
                    overlay.classList.remove("is-hidden");
                }
            });
        }
    };
    if (overlay) {
        overlay.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
        if (video.paused) {
            start();
        }
    });
    video.addEventListener("play", function () {
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
    });
}
