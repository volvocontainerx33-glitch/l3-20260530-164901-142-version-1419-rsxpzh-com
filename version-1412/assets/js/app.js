(function () {
  const menuButton = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (menuButton && mainNav) {
    menuButton.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  let activeSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    activeSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, currentIndex) {
      slide.classList.toggle('is-active', currentIndex === activeSlide);
    });

    dots.forEach(function (dot, currentIndex) {
      dot.classList.toggle('is-active', currentIndex === activeSlide);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(activeSlide + 1);
    }, 5200);
  }

  const searchForms = Array.from(document.querySelectorAll('[data-filter-scope]'));

  searchForms.forEach(function (scope) {
    const searchInput = scope.querySelector('[data-search-input]');
    const yearSelect = scope.querySelector('[data-year-select]');
    const regionSelect = scope.querySelector('[data-region-select]');
    const cards = Array.from(scope.querySelectorAll('.movie-card'));
    const noResult = scope.querySelector('.no-result');

    function filterCards() {
      const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const year = yearSelect ? yearSelect.value : '';
      const region = regionSelect ? regionSelect.value : '';
      let visible = 0;

      cards.forEach(function (card) {
        const source = (card.getAttribute('data-search') || '').toLowerCase();
        const cardYear = card.getAttribute('data-year') || '';
        const cardRegion = card.getAttribute('data-region') || '';
        const matchedKeyword = !keyword || source.indexOf(keyword) !== -1;
        const matchedYear = !year || cardYear === year;
        const matchedRegion = !region || cardRegion === region;
        const matched = matchedKeyword && matchedYear && matchedRegion;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });

      if (noResult) {
        noResult.style.display = visible ? 'none' : 'block';
      }
    }

    [searchInput, yearSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', filterCards);
        control.addEventListener('change', filterCards);
      }
    });
  });
})();
