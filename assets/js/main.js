/**
* Template Name: Omni
* Template URL: https://bootstrapmade.com/Omni-free-simple-bootstrap-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Smooth navigation redirect to each section with header offset & mobile nav handling
   */
  document.querySelectorAll('#navmenu a, .btn-getstarted').forEach(navLink => {
    navLink.addEventListener('click', function(e) {
      const hash = this.hash;
      if (!hash) return;

      const isSamePage = this.pathname === window.location.pathname || this.pathname === '' || this.getAttribute('href').startsWith('#');
      if (!isSamePage) return;

      let target = document.querySelector(hash);
      if (!target && (hash === '#contact' || hash === '#footer')) {
        target = document.querySelector('#contact') || document.querySelector('#footer');
      }

      if (target) {
        e.preventDefault();

        // Close mobile nav menu if open
        if (document.body.classList.contains('mobile-nav-active')) {
          document.body.classList.remove('mobile-nav-active');
          if (mobileNavToggleBtn) {
            mobileNavToggleBtn.classList.add('bi-list');
            mobileNavToggleBtn.classList.remove('bi-x');
          }
        }

        const header = document.querySelector('#header');
        const headerOffset = header ? header.offsetHeight : 70;
        const windowHeight = window.innerHeight;
        const availableHeight = windowHeight - headerOffset;

        let sectionElement = target;
        if (target.id === 'contact' && target.closest('footer')) {
          sectionElement = target.closest('footer');
        }

        let sectionTop = 0;
        let el = sectionElement;
        while (el) {
          sectionTop += el.offsetTop;
          el = el.offsetParent;
        }

        const sectionHeight = sectionElement.offsetHeight;
        let targetTop;

        if (hash === '#hero') {
          targetTop = 0;
        } else if (window.innerWidth < 992) {
          // On mobile & tablets, always align to top of section so title, badges and media are fully visible
          targetTop = sectionTop - headerOffset;
        } else if (sectionHeight <= availableHeight) {
          // On desktop, center compact sections within available height
          const extraSpace = availableHeight - sectionHeight;
          targetTop = sectionTop - headerOffset - Math.round(extraSpace / 2);
        } else {
          targetTop = sectionTop - headerOffset;
        }

        setTimeout(() => {
          window.scrollTo({
            top: Math.max(0, Math.round(targetTop)),
            behavior: 'smooth'
          });
        }, 50);

        if (history.pushState) {
          history.pushState(null, null, hash);
        }

        // Update active class
        document.querySelectorAll('#navmenu a.active').forEach(link => link.classList.remove('active'));
        if (this.closest('#navmenu')) {
          this.classList.add('active');
        }
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      const hash = window.location.hash;
      let target = document.querySelector(hash);
      if (!target && (hash === '#contact' || hash === '#footer')) {
        target = document.querySelector('#contact') || document.querySelector('#footer');
      }
      if (target) {
        setTimeout(() => {
          const header = document.querySelector('#header');
          const headerOffset = header ? header.offsetHeight : 70;
          const windowHeight = window.innerHeight;
          const availableHeight = windowHeight - headerOffset;

          let sectionElement = target;
          if (target.id === 'contact' && target.closest('footer')) {
            sectionElement = target.closest('footer');
          }

          let sectionTop = 0;
          let el = sectionElement;
          while (el) {
            sectionTop += el.offsetTop;
            el = el.offsetParent;
          }

          const sectionHeight = sectionElement.offsetHeight;
          let targetTop;

          if (hash === '#hero') {
            targetTop = 0;
          } else if (window.innerWidth < 992) {
            // On mobile & tablets, always align to top of section
            targetTop = sectionTop - headerOffset;
          } else if (sectionHeight <= availableHeight) {
            // On desktop, center compact sections
            const extraSpace = availableHeight - sectionHeight;
            targetTop = sectionTop - headerOffset - Math.round(extraSpace / 2);
          } else {
            targetTop = sectionTop - headerOffset;
          }

          window.scrollTo({
            top: Math.max(0, Math.round(targetTop)),
            behavior: 'smooth'
          });
        }, 150);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    let header = document.querySelector('#header');
    let headerOffset = header ? header.offsetHeight : 70;
    let scrollPosition = window.scrollY + headerOffset + 80;

    let isNearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 80);

    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section && (navmenulink.hash === '#contact' || navmenulink.hash === '#footer')) {
        section = document.querySelector('#contact') || document.querySelector('#footer');
      }
      if (!section) return;

      let sectionTop = section.offsetTop;
      let sectionBottom = sectionTop + section.offsetHeight;

      if (isNearBottom && (navmenulink.hash === '#contact' || navmenulink.hash === '#footer')) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else if (!isNearBottom && scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      }
    });
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();