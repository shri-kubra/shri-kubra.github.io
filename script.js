/* ===================================================
   KUBRA Writing Style Guide — script.js (v3 — fixed)
   Search + Scroll-spy + Role Tabs + Feedback System
   =================================================== */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  var searchInput = document.getElementById('searchInput');
  var searchMeta  = document.getElementById('searchMeta');
  var sections    = document.querySelectorAll('.section');
  var navLinks    = document.querySelectorAll('.nav-link');
  var backToTop   = document.getElementById('backToTop');
  var noResults   = document.getElementById('noResults');

  /* ---------- Utility ---------- */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ========================================
     1. IMPROVED SEARCH (highlight + counts)
     ======================================== */

  /* Store original innerHTML per section (excluding feedback widgets) */
  /* We'll highlight only within non-feedback content to avoid breaking widgets */

  function removeHighlights() {
    var marks = document.querySelectorAll('mark.search-highlight');
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function highlightInElement(element, query) {
    if (!query) return 0;
    var count = 0;
    var regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function (node) {
      var parent = node.parentElement;
      if (!parent) return;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
      /* Skip feedback widgets to avoid breaking them */
      if (parent.closest && parent.closest('.feedback-widget')) return;
      if (parent.classList && parent.classList.contains('search-highlight')) return;

      var text = node.textContent;
      if (regex.test(text)) {
        var matches = text.match(new RegExp('(' + escapeRegex(query) + ')', 'gi'));
        count += matches ? matches.length : 0;
        var span = document.createElement('span');
        span.innerHTML = text.replace(new RegExp('(' + escapeRegex(query) + ')', 'gi'), '<mark class="search-highlight">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    });
    return count;
  }

  function performSearch() {
    var query = searchInput.value.trim().toLowerCase();
    var totalMatches = 0;
    var visibleSections = 0;

    /* Remove old highlights */
    removeHighlights();

    /* Remove old match count badges from nav */
    navLinks.forEach(function (link) {
      var badge = link.querySelector('.nav-match-count');
      if (badge) badge.remove();
    });

    sections.forEach(function (sec) {
      var text = sec.textContent.toLowerCase();
      if (!query || text.indexOf(query) !== -1) {
        sec.style.display = '';
        visibleSections++;

        if (query) {
          var matchCount = highlightInElement(sec, query);
          totalMatches += matchCount;

          /* Add match count badge to sidebar nav */
          navLinks.forEach(function (link) {
            if (link.dataset.section === sec.id && matchCount > 0) {
              var badge = document.createElement('span');
              badge.className = 'nav-match-count';
              badge.textContent = matchCount;
              link.appendChild(badge);
            }
          });
        }
      } else {
        sec.style.display = 'none';
      }
    });

    /* Show/hide no results */
    if (visibleSections === 0 && query) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
    }

    /* Update search meta */
    if (searchMeta) {
      if (query) {
        searchMeta.textContent = totalMatches + ' match' + (totalMatches !== 1 ? 'es' : '') + ' in ' + visibleSections + ' section' + (visibleSections !== 1 ? 's' : '');
      } else {
        searchMeta.textContent = '';
      }
    }

    /* Update sidebar link visibility */
    navLinks.forEach(function (link) {
      var target = document.getElementById(link.dataset.section);
      if (target) {
        link.style.display = (target.style.display === 'none') ? 'none' : '';
      }
    });

    /* Scroll to first match */
    if (query && visibleSections > 0) {
      var firstMark = document.querySelector('mark.search-highlight');
      if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  searchInput.addEventListener('input', debounce(performSearch, 250));

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      searchInput.value = '';
      performSearch();
      searchInput.blur();
    }
  });

  /* ========================================
     2. SIDEBAR — scroll-spy + click
     ======================================== */
  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.section === id);
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveNav(entry.target.id);
      }
    });
  }, { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 });

  sections.forEach(function (sec) { observer.observe(sec); });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById(this.dataset.section);
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
    var btn = e.target;
    var tabGroup = btn.parentElement;
    var roleId = btn.dataset.role;

    tabGroup.querySelectorAll('.role-tab').forEach(function (t) {
      t.classList.remove('active');
    });
    btn.classList.add('active');

    var sibling = tabGroup.nextElementSibling;
    while (sibling && !sibling.classList.contains('role-tabs') &&
           !['H1','H2','H3','SECTION'].includes(sibling.tagName)) {
      if (sibling.classList.contains('role-content')) {
        sibling.classList.toggle('hidden', sibling.id !== roleId);
      }
      sibling = sibling.nextElementSibling;
    }
  });

  /* ========================================
     4. BACK-TO-TOP BUTTON
     ======================================== */
  window.addEventListener('scroll', function () {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ========================================
     5. FEEDBACK SYSTEM (localStorage-backed)
     ======================================== */
  var STORAGE_KEY = 'kubra_sg_feedback';

  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { /* silent */ }
  }

  function getSectionData(section) {
    var data = loadData();
    return data[section] || { likes: 0, dislikes: 0, userVote: null, comments: [] };
  }

  function setSectionData(section, sectionData) {
    var data = loadData();
    data[section] = sectionData;
    saveData(data);
  }

  function renderComments(widget, sectionData) {
    var list = widget.querySelector('.feedback-comments-list');
    if (!list) return;
    list.innerHTML = '';
    (sectionData.comments || []).forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'feedback-comment';
      div.innerHTML =
        '<div class="comment-meta">' +
          '<span class="comment-type ' + c.type + '">' + c.type + '</span>' +
          c.date +
        '</div>' +
        '<p>' + escapeHtml(c.text) + '</p>';
      list.appendChild(div);
    });
  }

  function renderWidget(widget) {
    var section = widget.getAttribute('data-section');
    var sd = getSectionData(section);

    /* Counts */
    var likeCount = widget.querySelector('[data-count="like"]');
    var dislikeCount = widget.querySelector('[data-count="dislike"]');
    if (likeCount) likeCount.textContent = sd.likes;
    if (dislikeCount) dislikeCount.textContent = sd.dislikes;

    /* Button states */
    var likeBtn = widget.querySelector('.feedback-btn--like');
    var dislikeBtn = widget.querySelector('.feedback-btn--dislike');
    if (likeBtn) likeBtn.classList.toggle('selected', sd.userVote === 'like');
    if (dislikeBtn) dislikeBtn.classList.toggle('selected', sd.userVote === 'dislike');

    /* Comments */
    renderComments(widget, sd);
  }

  /* Use event delegation on each widget — attach once, never lost */
  function setupWidget(widget) {
    var section = widget.getAttribute('data-section');

    renderWidget(widget);

    widget.addEventListener('click', function (e) {
      var target = e.target.closest('button');
      if (!target) return;

      /* --- Like / Dislike --- */
      if (target.classList.contains('feedback-btn')) {
        var type = target.getAttribute('data-type');
        var sd = getSectionData(section);
        var commentArea = widget.querySelector('.feedback-comment-area');

        if (sd.userVote === type) {
          /* Un-vote */
          if (type === 'like') sd.likes = Math.max(0, sd.likes - 1);
          else sd.dislikes = Math.max(0, sd.dislikes - 1);
          sd.userVote = null;
          if (commentArea) commentArea.classList.add('hidden');
        } else {
          /* Switch or new vote */
          if (sd.userVote === 'like') sd.likes = Math.max(0, sd.likes - 1);
          if (sd.userVote === 'dislike') sd.dislikes = Math.max(0, sd.dislikes - 1);
          if (type === 'like') sd.likes++;
          else sd.dislikes++;
          sd.userVote = type;
          if (commentArea) commentArea.classList.remove('hidden');
        }

        setSectionData(section, sd);
        renderWidget(widget);
        return;
      }

      /* --- Submit comment --- */
      if (target.classList.contains('feedback-submit')) {
        var textarea = widget.querySelector('.feedback-textarea');
        var text = textarea ? textarea.value.trim() : '';
        if (!text) return;

        var sd = getSectionData(section);
        sd.comments.push({
          type: sd.userVote || 'like',
          text: text,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
        setSectionData(section, sd);

        if (textarea) textarea.value = '';
        var commentArea = widget.querySelector('.feedback-comment-area');
        if (commentArea) commentArea.classList.add('hidden');

        renderWidget(widget);
        return;
      }

      /* --- Cancel comment --- */
      if (target.classList.contains('feedback-cancel')) {
        var textarea = widget.querySelector('.feedback-textarea');
        if (textarea) textarea.value = '';
        var commentArea = widget.querySelector('.feedback-comment-area');
        if (commentArea) commentArea.classList.add('hidden');
        return;
      }
    });
  }

  /* Initialize all feedback widgets */
  var widgets = document.querySelectorAll('.feedback-widget');
  widgets.forEach(function (w) { setupWidget(w); });

})();
