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

  // A saved choice wins; first-time visitors get their device's mode.
  var savedTheme = store("localStorage", "colorTheme");
  if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;
  else root.dataset.theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

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
    // Theme toggle
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      var labelToggle = function () {
        toggle.setAttribute("aria-label", "Switch to " + (currentTheme() === "dark" ? "light" : "dark") + " mode");
      };
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        store("localStorage", "colorTheme", next);
        labelToggle();
      });
      labelToggle();
    }

    // Scroll reveal
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

    // Cursor spotlight on cards
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".spotlight");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });

    // Portfolio filters: they sort the main project grid only; "More on GitHub" always shows everything
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
      showAll.textContent = expanded ? "Show fewer" : "Show all " + grid.children.length + " projects";
    }
    function applyFilter(btn) {
      var tag = btn.dataset.filter;
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      allProjects().forEach(function (p) {
        p.hidden = tag !== "all" && p.dataset.tags.split(" ").indexOf(tag) === -1;
      });
      setCollapsed(tag !== "all");
    }
    setCollapsed(false);
    if (showAll) {
      showAll.addEventListener("click", function () {
        expanded = !expanded;
        setCollapsed(false);
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

    // Footer year
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
