(function () {
  "use strict";

  var site = window.SITE;
  if (!site) return;

  var ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>';

  function esc(value) {
    return String(value).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function currentSemester() {
    var start = new Date(site.studyStart);
    var now = new Date();
    var months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    return Math.min(Math.max(Math.floor(months / 6) + 1, 1), site.semesters);
  }

  function ordinal(n) {
    var suffixes = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  function media(m) {
    if (m.type === "image") {
      return (
        '<div class="project-media"><img' + (m.contain ? ' class="contain"' : "") +
        ' src="' + esc(m.src) + '" alt="' + esc(m.alt) + '" width="640" height="400" loading="lazy" decoding="async" /></div>'
      );
    }
    if (m.type === "logo") {
      return (
        '<div class="project-media logo-tile ' + esc(m.className || "") + '">' +
        '<img src="' + esc(m.src) + '" alt="' + esc(m.alt) + '" width="320" height="320" loading="lazy" decoding="async" />' +
        (m.name ? '<span class="tile-name">' + esc(m.name) + "</span>" : "") +
        "</div>"
      );
    }
    if (m.type === "tile") {
      var style = m.colors ? ' style="--t1: ' + esc(m.colors[0]) + "; --t2: " + esc(m.colors[1]) + '"' : "";
      var icon = m.icon
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + m.icon + "</svg>"
        : "";
      return (
        '<div class="project-media code-tile ' + esc(m.className || "") + '" aria-hidden="true"' + style + ">" +
        icon + '<span class="tile-name">' + esc(m.name) + '</span><span class="tile-sub">' + esc(m.sub || "") + "</span></div>"
      );
    }
    return '<div class="project-media placeholder" aria-hidden="true">&lt;/&gt;</div>';
  }

  function card(p, index, allowWide) {
    var classes = "card project spotlight reveal" + (allowWide && p.wide ? " project-featured" : "");
    var delay = index % 3 ? ' style="--delay: ' + (index % 3) * 0.05 + 's"' : "";
    var chips = p.chips.map(function (c) {
      return '<li class="chip">' + esc(c) + "</li>";
    }).join("");
    return (
      '<a class="' + classes + '" data-tags="' + esc(p.tags.join(" ")) + '"' + delay +
      ' href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
      media(p.media) +
      '<div class="project-body">' +
      (p.badge ? '<p class="project-badge">' + esc(p.badge) + "</p>" : "") +
      "<h3>" + esc(p.title) + "</h3>" +
      "<p>" + esc(p.desc) + "</p>" +
      '<div class="project-foot"><ul class="chips">' + chips + "</ul>" +
      '<span class="project-link">' + esc(p.link) + " " + ARROW + "</span></div>" +
      "</div></a>"
    );
  }

  document.querySelectorAll("[data-projects]").forEach(function (grid) {
    var featuredOnly = grid.dataset.projects === "featured";
    var list = site.projects.filter(function (p) {
      return !featuredOnly || p.featured;
    });
    grid.innerHTML = list.map(function (p, i) {
      return card(p, i, !featuredOnly);
    }).join("");
  });

  var semester = currentSemester();
  var studying = site.studying[semester] || site.studyingFallback;

  document.querySelectorAll("[data-semester]").forEach(function (el) {
    el.textContent = el.dataset.semester === "ordinal" ? ordinal(semester) : semester;
  });

  document.querySelectorAll("[data-studying]").forEach(function (el) {
    el.textContent = studying[el.dataset.studying];
  });
})();
