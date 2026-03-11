
js_content = '''/* ===================================================
   KUBRA Style Guide — script.js(v2)
   Improved search + Feedback system
    =================================================== * /

        (function () {
            'use strict';

            /* ---------- DOM refs ---------- */
            var searchInput = document.getElementById('searchInput');
            var searchMeta = document.getElementById('searchMeta');
            var sections = document.querySelectorAll('.section');
            var navLinks = document.querySelectorAll('.nav-link');
            var backToTop = document.getElementById('backToTop');
            var noResults = document.getElementById('noResults');

            /* ---------- Utility: debounce ---------- */
            function debounce(fn, delay) {
                var timer;
                return function () {
                    var ctx = this, args = arguments;
                    clearTimeout(timer);
                    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
                };
            }

            /* ========================================
               1. IMPROVED SEARCH
               ======================================== */

            /* Store original text content for each section so we can restore after highlight */
            var sectionOriginals = [];
            sections.forEach(function (sec) {
                sectionOriginals.push({ el: sec, html: sec.innerHTML });
            });

            function clearHighlights() {
                sectionOriginals.forEach(function (item) {
                    item.el.innerHTML = item.html;
                });
                /* Re-bind feedback widgets after restoring HTML */
                initFeedbackWidgets();
            }

            function highlightText(element, query) {
                if (!query) return 0;
                var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
                var textNodes = [];
                while (walker.nextNode()) textNodes.push(walker.currentNode);

                var count = 0;
                var regex = new RegExp('(' + query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\$&') + ')', 'gi');

                textNodes.forEach(function (node) {
                    if (node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) return;
                    if (node.parentElement && node.parentElement.classList && node.parentElement.classList.contains('search-highlight')) return;
                    var text = node.textContent;
                    if (regex.test(text)) {
                        var matches = text.match(regex);
                        count += matches ? matches.length : 0;
                        var span = document.createElement('span');
                        span.innerHTML = text.replace(regex, '<mark class="search-highlight">\$1</mark>');
                        node.parentNode.replaceChild(span, node);
                    }
                });
                return count;
            }

            function performSearch() {
                var query = searchInput.value.trim().toLowerCase();
                var totalMatches = 0;
                var visibleSections = 0;

                /* Restore original HTML first */
                clearHighlights();

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
                            var matchCount = highlightText(sec, query);
                            totalMatches += matchCount;

                            /* Add match count to sidebar nav */
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

                /* Update search meta info */
                if (query) {
                    searchMeta.textContent = totalMatches + ' match' + (totalMatches !== 1 ? 'es' : '') + ' in ' + visibleSections + ' section' + (visibleSections !== 1 ? 's' : '');
                } else {
                    searchMeta.textContent = '';
                }

                /* Update sidebar link visibility */
                navLinks.forEach(function (link) {
                    var target = document.getElementById(link.dataset.section);
                    if (target) {
                        link.style.display = (target.style.display === 'none') ? 'none' : '';
                    }
                });

                /* Scroll to first match if searching */
                if (query && visibleSections > 0) {
                    var firstMark = document.querySelector('mark.search-highlight');
                    if (firstMark) {
                        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }

            searchInput.addEventListener('input', debounce(performSearch, 250));

            /* Clear search on Escape */
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
                    if (link.dataset.section === id) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }

            var observerOpts = {
                root: null,
                rootMargin: '-80px 0px -60% 0px',
                threshold: 0
            };

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        setActiveNav(entry.target.id);
                    }
                });
            }, observerOpts);

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
                    !['H1', 'H2', 'H3', 'SECTION'].includes(sibling.tagName)) {
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

            /* ========================================
               5. FEEDBACK SYSTEM (localStorage-backed)
               ======================================== */
            var STORAGE_KEY = 'kubra_style_guide_feedback';

            function loadFeedbackData() {
                try {
                    var data = localStorage.getItem(STORAGE_KEY);
                    return data ? JSON.parse(data) : {};
                } catch (e) {
                    return {};
                }
            }

            function saveFeedbackData(data) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } catch (e) { /* silently fail */ }
            }

            function renderFeedbackWidget(widget) {
                var section = widget.dataset.section;
                var data = loadFeedbackData();
                var sectionData = data[section] || { likes: 0, dislikes: 0, userVote: null, comments: [] };

                /* Update counts */
                var likeCount = widget.querySelector('[data-count="like"]');
                var dislikeCount = widget.querySelector('[data-count="dislike"]');
                if (likeCount) likeCount.textContent = sectionData.likes;
                if (dislikeCount) dislikeCount.textContent = sectionData.dislikes;

                /* Update button states */
                var likeBtn = widget.querySelector('.feedback-btn--like');
                var dislikeBtn = widget.querySelector('.feedback-btn--dislike');
                if (likeBtn) {
                    likeBtn.classList.toggle('selected', sectionData.userVote === 'like');
                }
                if (dislikeBtn) {
                    dislikeBtn.classList.toggle('selected', sectionData.userVote === 'dislike');
                }

                /* Render comments */
                var commentsList = widget.querySelector('.feedback-comments-list');
                if (commentsList) {
                    commentsList.innerHTML = '';
                    (sectionData.comments || []).forEach(function (c) {
                        var div = document.createElement('div');
                        div.className = 'feedback-comment';
                        div.innerHTML = '<div class="comment-meta"><span class="comment-type ' + c.type + '">' + c.type + '</span>' + c.date + '</div><p>' + escapeHtml(c.text) + '</p>';
                        commentsList.appendChild(div);
                    });
                }
            }

            function escapeHtml(str) {
                var div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }

            function initFeedbackWidgets() {
                var widgets = document.querySelectorAll('.feedback-widget');
                widgets.forEach(function (widget) {
                    renderFeedbackWidget(widget);

                    /* Like / Dislike buttons */
                    var buttons = widget.querySelectorAll('.feedback-btn');
                    buttons.forEach(function (btn) {
                        /* Remove old listeners by cloning */
                        var newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);

                        newBtn.addEventListener('click', function () {
                            var type = this.dataset.type;
                            var section = widget.dataset.section;
                            var data = loadFeedbackData();
                            var sectionData = data[section] || { likes: 0, dislikes: 0, userVote: null, comments: [] };

                            /* Toggle vote */
                            if (sectionData.userVote === type) {
                                /* Un-vote */
                                if (type === 'like') sectionData.likes = Math.max(0, sectionData.likes - 1);
                                else sectionData.dislikes = Math.max(0, sectionData.dislikes - 1);
                                sectionData.userVote = null;
                                /* Hide comment area */
                                var commentArea = widget.querySelector('.feedback-comment-area');
                                if (commentArea) commentArea.classList.add('hidden');
                            } else {
                                /* Remove previous vote if switching */
                                if (sectionData.userVote === 'like') sectionData.likes = Math.max(0, sectionData.likes - 1);
                                if (sectionData.userVote === 'dislike') sectionData.dislikes = Math.max(0, sectionData.dislikes - 1);
                                /* Apply new vote */
                                if (type === 'like') sectionData.likes++;
                                else sectionData.dislikes++;
                                sectionData.userVote = type;
                                /* Show comment area */
                                var commentArea2 = widget.querySelector('.feedback-comment-area');
                                if (commentArea2) commentArea2.classList.remove('hidden');
                            }

                            data[section] = sectionData;
                            saveFeedbackData(data);
                            renderFeedbackWidget(widget);
                        });
                    });

                    /* Submit comment */
                    var submitBtn = widget.querySelector('.feedback-submit');
                    if (submitBtn) {
                        var newSubmit = submitBtn.cloneNode(true);
                        submitBtn.parentNode.replaceChild(newSubmit, submitBtn);

                        newSubmit.addEventListener('click', function () {
                            var textarea = widget.querySelector('.feedback-textarea');
                            var text = textarea ? textarea.value.trim() : '';
                            if (!text) return;

                            var section = widget.dataset.section;
                            var data = loadFeedbackData();
                            var sectionData = data[section] || { likes: 0, dislikes: 0, userVote: null, comments: [] };

                            sectionData.comments.push({
                                type: sectionData.userVote || 'like',
                                text: text,
                                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            });

                            data[section] = sectionData;
                            saveFeedbackData(data);

                            if (textarea) textarea.value = '';
                            var commentArea = widget.querySelector('.feedback-comment-area');
                            if (commentArea) commentArea.classList.add('hidden');

                            renderFeedbackWidget(widget);
                        });
                    }

                    /* Cancel comment */
                    var cancelBtn = widget.querySelector('.feedback-cancel');
                    if (cancelBtn) {
                        var newCancel = cancelBtn.cloneNode(true);
                        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

                        newCancel.addEventListener('click', function () {
                            var textarea = widget.querySelector('.feedback-textarea');
                            if (textarea) textarea.value = '';
                            var commentArea = widget.querySelector('.feedback-comment-area');
                            if (commentArea) commentArea.classList.add('hidden');
                        });
                    }
                });
            }

            /* Initialize feedback on page load */
            initFeedbackWidgets();

        })();
'''

with open('/mnt/data/script.js', 'w', encoding = 'utf-8') as f:
f.write(js_content)

print(f"script.js written successfully — {len(js_content)} bytes")