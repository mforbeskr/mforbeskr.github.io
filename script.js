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

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        store("localStorage", "colorTheme", next);
        toggle.setAttribute("aria-label", "Switch to " + (next === "dark" ? "light" : "dark") + " mode");
      });
      toggle.setAttribute("aria-label", "Switch to " + (currentTheme() === "dark" ? "light" : "dark") + " mode");
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
    }

    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".spotlight");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });

    // Split skill words (and the words in the strengths text) into letters so hover can fill
    // them one at a time, left to right. Screen readers get the original text; the letters are hidden.
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

    function splitWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) return splitWords(child);
        if (child.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          frag.appendChild(/\s/.test(part) ? document.createTextNode(part) : fillWord(part));
        });
        node.replaceChild(frag, child);
      });
    }

    document.querySelectorAll(".skill-words li, .paper p").forEach(function (el) {
      var label = document.createElement("span");
      label.className = "sr-only";
      label.innerHTML = el.innerHTML;
      var visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      visual.innerHTML = el.innerHTML;
      if (el.tagName === "LI") visual.replaceChildren(fillWord(el.textContent));
      else splitWords(visual);
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

    var filters = document.querySelectorAll(".filter");
    function allProjects() {
      return document.querySelectorAll(".project[data-tags]");
    }
    function applyFilter(btn) {
      var tag = btn.dataset.filter;
      filters.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      allProjects().forEach(function (p) {
        p.hidden = tag !== "all" && p.dataset.tags.split(" ").indexOf(tag) === -1;
      });
      document.querySelectorAll("[data-github-section]").forEach(function (section) {
        section.classList.toggle("is-filtered-out", !section.querySelector(".project:not([hidden])"));
      });
    }

    document.addEventListener("projects:added", function () {
      var pressed = document.querySelector('.filter[aria-pressed="true"]');
      if (pressed) applyFilter(pressed);
    });

    var initialFilter = new URLSearchParams(location.search).get("filter");
    filters.forEach(function (btn) {
      if (btn.dataset.filter === initialFilter) applyFilter(btn);
    });

    filters.forEach(function (btn) {
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
