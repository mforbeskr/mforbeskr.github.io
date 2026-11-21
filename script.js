(function () {
  "use strict";

  var root = document.documentElement;
  var PAGES = ["index", "resume"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nativeTransitions = "onpagereveal" in window;

  function store(kind, key, value) {
    try {
      if (value === undefined) return window[kind].getItem(key);
      if (value === null) window[kind].removeItem(key);
      else window[kind].setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  function pageIndex(href) {
    var url = new URL(href, location.href);
    if (url.origin !== location.origin) return -1;
    var name = url.pathname.split("/").pop().replace(/\.html$/, "") || "index";
    return PAGES.indexOf(name);
  }

  var here = pageIndex(location.href);

  // A saved choice wins; first-time visitors always start in light mode.
  var savedTheme = store("localStorage", "colorTheme");
  root.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  var t = window.I18N ? window.I18N.t : function (key, english) {
    return english;
  };

  function currentTheme() {
    return root.dataset.theme;
  }

  // Heavy effects (the scenery's animation, the WebGL portrait) wait until the page has loaded and
  // any page-to-page slide has finished, so they don't compete with it. Scripts call
  // whenSettled(fn) to start then.
  var waiting = 1, settled = false, onSettle = [];
  function release() {
    if (--waiting > 0 || settled) return;
    settled = true;
    onSettle.forEach(function (fn) {
      fn();
    });
  }
  function holdUntil(done) {
    waiting++;
    done(release);
  }
  window.whenSettled = function (fn) {
    if (settled) fn();
    else onSettle.push(fn);
  };
  window.addEventListener("load", function () {
    setTimeout(release, 150);
  });

  function directionFrom(from) {
    if (from < 0 || here < 0 || from === here) return null;
    return from < here ? "forward" : "back";
  }

  if (nativeTransitions) {
    window.addEventListener("pageswap", function () {
      store("sessionStorage", "fromPage", String(here));
    });

    window.addEventListener("pagereveal", function (e) {
      if (!e.viewTransition) return;
      var raw = store("sessionStorage", "fromPage");
      store("sessionStorage", "fromPage", null);
      var dir = directionFrom(raw === null ? -1 : Number(raw));
      if (!dir) {
        // Skipping rejects the transition's "ready" promise; that's expected, so don't report it.
        e.viewTransition.ready.catch(function () {});
        e.viewTransition.skipTransition();
        return;
      }
      root.dataset.dir = dir;
      holdUntil(function (done) {
        e.viewTransition.finished.finally(function () {
          delete root.dataset.dir;
          done();
        });
      });
    });
  } else if (!reduceMotion) {
    var from = store("sessionStorage", "fromPage");
    store("sessionStorage", "fromPage", null);
    var enterDir = directionFrom(from === null ? -1 : Number(from));
    if (enterDir) {
      root.classList.add("fallback-enter-" + enterDir);
      holdUntil(function (done) {
        setTimeout(function () {
          root.classList.remove("fallback-enter-" + enterDir);
          done();
        }, 600);
      });
    }

    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("a[href]");
      if (!link || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
      var to = pageIndex(link.href);
      if (to < 0 || to === here) return;
      e.preventDefault();
      store("sessionStorage", "fromPage", String(here));
      root.classList.add("fallback-leave-" + (to > here ? "forward" : "back"));
      setTimeout(function () {
        location.href = link.href;
      }, 280);
    });

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) root.classList.remove("fallback-leave-forward", "fallback-leave-back");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      var labelToggle = function () {
        toggle.setAttribute("aria-label", currentTheme() === "dark"
          ? t("theme.toLight", "Switch to light mode")
          : t("theme.toDark", "Switch to dark mode"));
      };
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        store("localStorage", "colorTheme", next);
        labelToggle();
      });
      labelToggle();
    }

    // Language toggle: it shows the language you'd switch to
    var langToggle = document.querySelector(".lang-toggle");
    if (langToggle && window.I18N) {
      langToggle.addEventListener("click", function () {
        window.I18N.set(window.I18N.lang === "da" ? "en" : "da");
      });
    }

    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
        else io.observe(el);
      });
      root.classList.add("reveal-ready");

      // Safety net: anything in view or already scrolled past is shown, even if the observer
      // missed it (fast scrolls, nav jumps, a tab that was in the background).
      var sweep = function () {
        reveals.forEach(function (el) {
          if (!el.classList.contains("in") && el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      };
      window.addEventListener("scroll", sweep, { passive: true });
      window.addEventListener("hashchange", sweep);
      window.addEventListener("load", sweep);
    }

    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".spotlight");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });

    // Portfolio filters (tagged GitHub repos are added to the same grid later, see render.js)
    var filters = document.querySelectorAll(".filter");
    var grid = document.querySelector("[data-projects].is-collapsed");
    var showAll = document.querySelector("[data-show-all]");
    var expanded = false;
    function allProjects() {
      return document.querySelectorAll("[data-projects] .project[data-tags]");
    }
    // The grid starts with the featured projects; a filter or "Show all" opens it up.
    function setCollapsed(filtering) {
      if (!grid || !showAll) return;
      var more = grid.children.length - grid.querySelectorAll("[data-featured]").length;
      grid.classList.toggle("is-collapsed", !expanded && !filtering && more > 0);
      showAll.parentElement.hidden = filtering || more === 0;
      showAll.setAttribute("aria-expanded", String(expanded));
      showAll.textContent = expanded
        ? t("showFewer", "Show fewer")
        : t("showAll", "Show all {n} projects").replace("{n}", grid.children.length);
      layoutProjects(filtering);
    }
    // Mixed card sizes on a 24-column grid (style.css: --span on wide screens, data-wide/data-fill on
    // two-column screens). With "All", the featured cards keep fixed slots in priority order: 1st biggest
    // with the 2nd beside it, then 3rd (bottom left), 4th, and the 5th and 6th as an equal pair.
    // Everything else gets mixed rows of 3 or 4. No card is narrower than 5/24 of the row.
    var FEATURED_SLOTS = [14, 10, 8, 6, 5, 5];
    var ROWS = [[6, 6, 6, 6], [8, 5, 5, 6], [10, 7, 7], [5, 7, 6, 6], [8, 8, 8], [6, 5, 5, 8], [7, 7, 10]];
    var EVEN = [[24], [12, 12], [8, 8, 8], [6, 6, 6, 6]];
    function layoutProjects(filtering) {
      if (!grid) return;
      var collapsed = grid.classList.contains("is-collapsed");
      var cards = Array.prototype.filter.call(grid.children, function (p) {
        p.removeAttribute("data-span");
        p.removeAttribute("data-wide");
        p.removeAttribute("data-fill");
        p.style.removeProperty("--span");
        return !p.hidden && (!collapsed || p.hasAttribute("data-featured"));
      });
      var spans = [];
      var i = 0;
      if (!filtering) {
        while (i < cards.length && i < FEATURED_SLOTS.length && cards[i].hasAttribute("data-featured")) spans.push(FEATURED_SLOTS[i++]);
        // Fewer featured cards than slots (e.g. one was unfeatured): mixed rows for all of them instead
        if (i < FEATURED_SLOTS.length && i < cards.length) {
          spans = [];
          i = 0;
        }
      }
      for (var row = 0; i < cards.length; row++) {
        var left = cards.length - i;
        var pattern = left <= 4 ? EVEN[left - 1] : ROWS[row % ROWS.length];
        if (left - pattern.length === 1) pattern = EVEN[2]; // never leave one card alone on the last row
        spans = spans.concat(pattern);
        i += pattern.length;
      }
      spans.forEach(function (span, k) {
        var p = cards[k];
        p.dataset.span = span;
        p.style.setProperty("--span", span);
        if (span >= 14) p.dataset.wide = "";
      });
      // Two-column screens: a lone half-width card at the end of the grid takes the whole row
      var halves = cards.filter(function (p) {
        return !p.hasAttribute("data-wide");
      });
      if (halves.length % 2) halves[halves.length - 1].dataset.fill = "";
    }
    function applyFilter(btn) {
      var tag = btn.dataset.filter;
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      allProjects().forEach(function (p) {
        p.hidden = tag !== "all" && p.dataset.tags.split(" ").indexOf(tag) === -1;
      });
      currentFilter = btn;
      setCollapsed(tag !== "all");
    }
    var currentFilter = null;
    // GitHub repos arrive after the page has loaded: filter them and update the count.
    document.addEventListener("projects:added", function () {
      if (currentFilter) applyFilter(currentFilter);
      else setCollapsed(false);
    });
    setCollapsed(false);
    if (showAll) {
      showAll.addEventListener("click", function () {
        var before = showAll.getBoundingClientRect().top;
        expanded = !expanded;
        setCollapsed(false);
        // "Show fewer": the page shrinks above the button, so scroll with it. The button stays under
        // the pointer, right below the closed-up grid, instead of leaving you far down the page.
        if (!expanded) {
          window.scrollBy({ top: showAll.getBoundingClientRect().top - before, behavior: "instant" });
        }
      });
    }
    // Links elsewhere on the page (like the quick-facts cards) can jump to the portfolio pre-filtered.
    document.querySelectorAll("[data-filter-link]").forEach(function (link) {
      link.addEventListener("click", function () {
        var btn = document.querySelector('.filter[data-filter="' + link.dataset.filterLink + '"]');
        if (btn) btn.click();
      });
    });

    var initialFilter = new URLSearchParams(location.search).get("filter");
    filters.forEach(function (btn) {
      if (btn.dataset.filter === initialFilter) applyFilter(btn);
      btn.addEventListener("click", function () {
        var url = new URL(location.href);
        if (btn.dataset.filter === "all") url.searchParams.delete("filter");
        else url.searchParams.set("filter", btn.dataset.filter);
        history.replaceState(null, "", url);
        var apply = function () {
          applyFilter(btn);
        };
        if (!document.startViewTransition || reduceMotion) return apply();
        var projects = allProjects();
        projects.forEach(function (p, i) {
          p.style.viewTransitionName = "project-" + i;
        });
        document.startViewTransition(apply).finished.finally(function () {
          projects.forEach(function (p) {
            p.style.viewTransitionName = "";
          });
        });
      });
    });

    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
