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

  var savedTheme = store("localStorage", "colorTheme");
  if (savedTheme === "light" || savedTheme === "dark") root.dataset.theme = savedTheme;

  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
