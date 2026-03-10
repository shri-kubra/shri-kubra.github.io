/* ===================================================
   KUBRA Style Guide — script.js
   =================================================== */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const searchInput  = document.getElementById('searchInput');
  const sections     = document.querySelectorAll('.section');
  const navLinks     = document.querySelectorAll('.nav-link');
  const backToTop    = document.getElementById('backToTop');
  const noResults    = document.getElementById('noResults');
  const contentArea  = document.getElementById('content');

  /* ========================================
     1. SEARCH — real-time text filter
     ======================================== */
  searchInput.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    let matchCount = 0;

    sections.forEach(function (sec) {
      const text = sec.textContent.toLowerCase();
      if (!query || text.includes(query)) {
        sec.style.display = '';
        matchCount++;
      } else {
        sec.style.display = 'none';
      }
    });

    /* Show / hide "no results" message */
    if (matchCount === 0 && query) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
    }

    /* Update sidebar active states when filtering */
    navLinks.forEach(function (link) {
      const target = document.getElementById(link.dataset.section);
      if (target) {
        link.style.display = (target.style.display === 'none') ? 'none' : '';
      }
    });
  });

  /* ========================================
     2. SIDEBAR — scroll-spy + click
     ======================================== */
  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      if (link.dataset.section === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* Intersection Observer for scroll-spy */
  const observerOpts = {
    root: null,
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, observerOpts);

  sections.forEach(function (sec) { observer.observe(sec); });

  /* Smooth-scroll on nav click */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById(this.dataset.section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveNav(this.dataset.section);
      }
    });
  });

  /* ========================================
     3. ROLE TABS
     ======================================== */
  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('role-tab')) return;

    const btn       = e.target;
    const tabGroup  = btn.parentElement;
    const roleId    = btn.dataset.role;

    /* Deactivate siblings */
    tabGroup.querySelectorAll('.role-tab').forEach(function (t) {
      t.classList.remove('active');
    });
    btn.classList.add('active');

    /* Find the matching role-content panels that are siblings of this tab group */
    let sibling = tabGroup.nextElementSibling;
    while (sibling && !sibling.classList.contains('role-tabs') &&
           !['H1','H2','H3','SECTION'].includes(sibling.tagName)) {
      if (sibling.classList.contains('role-content')) {
        if (sibling.id === roleId) {
          sibling.classList.remove('hidden');
        } else {
          sibling.classList.add('hidden');
        }
      }
      sibling = sibling.nextElementSibling;
    }
  });

  /* ========================================
     4. BACK-TO-TOP BUTTON
     ======================================== */
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }, { passive: true });

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

})();
