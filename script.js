/* ===================================================
   KUBRA Writing Style Guide — script.js (v4)
   Improved Search + PDF Export + Scroll-spy + Feedback
   =================================================== */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  var searchInput = document.getElementById('searchInput');
  var searchMeta  = document.getElementById('searchMeta');
  var searchClear = document.getElementById('searchClear');
  var sections    = document.querySelectorAll('.section');
  var navLinks    = document.querySelectorAll('.nav-link');
  var backToTop   = document.getElementById('backToTop');
  var noResults   = document.getElementById('noResults');
  var exportBtn   = document.getElementById('exportPdf');

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
     1. IMPROVED SEARCH
     ======================================== */
  var allMarks = [];
  var currentIdx = -1;

  function removeHighlights() {
    var marks = document.querySelectorAll('mark.search-highlight');
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
    allMarks = [];
    currentIdx = -1;
  }

  function highlightInElement(element, words) {
    if (!words.length) return 0;
    var count = 0;
    var pattern = words.map(escapeRegex).join('|');
    var regex = new RegExp('(' + pattern + ')', 'gi');
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(function (node) {
      var parent = node.parentElement;
      if (!parent) return;
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
      if (parent.closest && parent.closest('.feedback-widget')) return;
      if (parent.closest && parent.closest('.print-header')) return;
      if (parent.classList && parent.classList.contains('search-highlight')) return;

      var text = node.textContent;
      if (regex.test(text)) {
        regex.lastIndex = 0;
        var matches = text.match(regex);
        count += matches ? matches.length : 0;
        var span = document.createElement('span');
        span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        node.parentNode.replaceChild(span, node);
      }
    });
    return count;
  }

  function collectMarks() {
    allMarks = Array.prototype.slice.call(document.querySelectorAll('mark.search-highlight'));
    currentIdx = allMarks.length > 0 ? 0 : -1;
    if (currentIdx >= 0) {
      allMarks[0].classList.add('current');
    }
  }

  function goToMatch(idx) {
    if (!allMarks.length) return;
    if (currentIdx >= 0 && currentIdx < allMarks.length) {
      allMarks[currentIdx].classList.remove('current');
    }
    currentIdx = ((idx % allMarks.length) + allMarks.length) % allMarks.length;
    allMarks[currentIdx].classList.add('current');
    allMarks[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateMetaText();
  }

  function updateMetaText() {
    if (!searchMeta) return;
    var query = searchInput ? searchInput.value.trim() : '';
    if (!query) {
      searchMeta.innerHTML = '';
      return;
    }
    if (allMarks.length === 0) {
      searchMeta.innerHTML = 'No matches found';
      return;
    }
    searchMeta.innerHTML =
      '<span>' + (currentIdx + 1) + ' of ' + allMarks.length + ' match' + (allMarks.length !== 1 ? 'es' : '') + '</span>' +
      '<span class="search-nav-btns">' +
        '<button class="search-nav-btn" id="searchPrev" title="Previous (Shift+Enter)">&uarr;</button>' +
        '<button class="search-nav-btn" id="searchNext" title="Next (Enter)">&darr;</button>' +
      '</span>' +
      '<span class="search-kbd">Ctrl+K</span>';

    document.getElementById('searchPrev').addEventListener('click', function () {
      goToMatch(currentIdx - 1);
    });
    document.getElementById('searchNext').addEventListener('click', function () {
      goToMatch(currentIdx + 1);
    });
  }

  function tokenize(query) {
    return query.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
  }

  function performSearch() {
    if (!searchInput) return;
    var raw = searchInput.value.trim();
    var words = tokenize(raw);
    var hasQuery = words.length > 0;
    var visibleSections = 0;

    removeHighlights();

    navLinks.forEach(function (link) {
      var badge = link.querySelector('.nav-match-count');
      if (badge) badge.remove();
    });

    if (searchClear) {
      searchClear.classList.toggle('visible', raw.length > 0);
    }

    sections.forEach(function (sec) {
      var text = sec.textContent.toLowerCase();
      var allMatch = !hasQuery || words.every(function (w) {
        return text.indexOf(w) !== -1;
      });

      if (allMatch) {
        sec.style.display = '';
        visibleSections++;

        if (hasQuery) {
          var matchCount = highlightInElement(sec, words);

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

    if (noResults) {
      if (visibleSections === 0 && hasQuery) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
      }
    }

    navLinks.forEach(function (link) {
      var target = document.getElementById(link.dataset.section);
      if (target) {
        link.style.display = (target.style.display === 'none') ? 'none' : '';
      }
    });

    if (hasQuery) {
      collectMarks();
      if (allMarks.length > 0) {
        allMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      updateMetaText();
    } else {
      if (searchMeta) searchMeta.innerHTML = '';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(performSearch, 200));

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        performSearch();
        searchInput.blur();
        return;
      }
      if (e.key === 'Enter' && allMarks.length > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          goToMatch(currentIdx - 1);
        } else {
          goToMatch(currentIdx + 1);
        }
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      performSearch();
      searchInput.focus();
    });
  }

  /* Ctrl+K / Cmd+K to focus search */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
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

  if (sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    sections.forEach(function (sec) { observer.observe(sec); });
  }

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
     3. ROLE TABS (for combined page if used)
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
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ========================================
     5. EXPORT TO PDF
     ======================================== */
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      window.print();
    });
  }

  /* ========================================
     6. FEEDBACK SYSTEM (localStorage-backed)
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

    var likeCount = widget.querySelector('[data-count="like"]');
    var dislikeCount = widget.querySelector('[data-count="dislike"]');
    if (likeCount) likeCount.textContent = sd.likes;
    if (dislikeCount) dislikeCount.textContent = sd.dislikes;

    var likeBtn = widget.querySelector('.feedback-btn--like');
    var dislikeBtn = widget.querySelector('.feedback-btn--dislike');
    if (likeBtn) likeBtn.classList.toggle('selected', sd.userVote === 'like');
    if (dislikeBtn) dislikeBtn.classList.toggle('selected', sd.userVote === 'dislike');

    renderComments(widget, sd);
  }

  function setupWidget(widget) {
    var section = widget.getAttribute('data-section');
    renderWidget(widget);

    widget.addEventListener('click', function (e) {
      var target = e.target.closest('button');
      if (!target) return;

      if (target.classList.contains('feedback-btn')) {
        var type = target.getAttribute('data-type');
        var sd = getSectionData(section);
        var commentArea = widget.querySelector('.feedback-comment-area');

        if (sd.userVote === type) {
          if (type === 'like') sd.likes = Math.max(0, sd.likes - 1);
          else sd.dislikes = Math.max(0, sd.dislikes - 1);
          sd.userVote = null;
          if (commentArea) commentArea.classList.add('hidden');
        } else {
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

      if (target.classList.contains('feedback-cancel')) {
        var textarea = widget.querySelector('.feedback-textarea');
        if (textarea) textarea.value = '';
        var commentArea = widget.querySelector('.feedback-comment-area');
        if (commentArea) commentArea.classList.add('hidden');
        return;
      }
    });
  }

  var widgets = document.querySelectorAll('.feedback-widget');
  widgets.forEach(function (w) { setupWidget(w); });

  /* ========================================
     7. DEEP LINK on load
     ======================================== */
  if (window.location.hash) {
    var target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

})();
