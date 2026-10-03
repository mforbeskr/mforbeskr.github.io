(function () {
  "use strict";

  var root = document.documentElement;
  var PAGES = ["index", "resume", "portfolio", "hobbies"];
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
        e.viewTransition.skipTransition();
        return;
      }
      root.dataset.dir = dir;
      e.viewTransition.finished.finally(function () {
        delete root.dataset.dir;
      });
    });
  } else if (!reduceMotion) {
    var from = store("sessionStorage", "fromPage");
    store("sessionStorage", "fromPage", null);
    var enterDir = directionFrom(from === null ? -1 : Number(from));
    if (enterDir) {
      root.classList.add("fallback-enter-" + enterDir);
      setTimeout(function () {
        root.classList.remove("fallback-enter-" + enterDir);
      }, 600);
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

  // A word as a row of letter spans, each knowing its position from the left (--n) and right (--r).
  function fillWord(word) {
    var wrap = document.createElement("span");
    wrap.className = "fill-word";
    word.split("").forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "letter";
      span.textContent = ch;
      span.style.setProperty("--n", i);
      span.style.setProperty("--r", word.length - 1 - i);
      wrap.appendChild(span);
    });
    return wrap;
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
    }

    // Cursor spotlight on cards
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".spotlight");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });

    // Resume: split the card headings into letters so the dark-mode hover can fill them one at a
    // time. Screen readers get the original heading; the letters are hidden from them.
    document.querySelectorAll(".paper h3").forEach(function (el) {
      var label = document.createElement("span");
      label.className = "sr-only";
      label.textContent = el.textContent;
      var visual = fillWord(el.textContent);
      visual.setAttribute("aria-hidden", "true");
      el.replaceChildren(label, visual);
    });

    // Resume papers: grab one with the mouse, fling it around, and it springs back to its spot.
    document.querySelectorAll(".paper").forEach(function (paper) {
      var drag = null;

      paper.addEventListener("pointerdown", function (e) {
        // Dark mode shows the sheets as fixed glass cards.
        if (e.pointerType === "touch" || e.button !== 0 || currentTheme() === "dark") return;
        e.preventDefault();
        paper.setPointerCapture(e.pointerId);
        paper.classList.remove("is-returning");
        paper.classList.add("is-dragging");
        drag = { x: e.clientX, y: e.clientY, lastX: e.clientX, spin: 0 };
      });

      paper.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var vx = e.clientX - drag.lastX;
        drag.lastX = e.clientX;
        // Swing like paper held at the top: tilt follows horizontal speed, eased so it doesn't jitter.
        drag.spin += (Math.max(-10, Math.min(10, vx * 0.9)) - drag.spin) * 0.25;
        paper.style.transform =
          "translate(" + (e.clientX - drag.x) + "px, " + (e.clientY - drag.y) + "px) rotate(" + drag.spin.toFixed(2) + "deg) scale(1.02)";
      });

      function release() {
        if (!drag) return;
        drag = null;
        paper.classList.remove("is-dragging");
        paper.classList.add("is-returning");
        paper.style.transform = "";
      }

      paper.addEventListener("pointerup", release);
      paper.addEventListener("pointercancel", release);
      paper.addEventListener("transitionend", function (e) {
        if (e.propertyName === "transform" && !drag) paper.classList.remove("is-returning");
      });
    });

    // Portfolio filters: they sort the main project grid only; "More on GitHub" always shows everything
    var filters = document.querySelectorAll(".filter");
    function allProjects() {
      return document.querySelectorAll("[data-projects] .project[data-tags]");
    }
    function applyFilter(btn) {
      var tag = btn.dataset.filter;
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      allProjects().forEach(function (p) {
        p.hidden = tag !== "all" && p.dataset.tags.split(" ").indexOf(tag) === -1;
      });
    }

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
