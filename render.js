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

  var LANGUAGE_COLORS = {
    Java: ["#e07a2f", "#8a3d12"],
    "C#": ["#7c4dff", "#512bd4"],
    JavaScript: ["#d9b92f", "#7a6410"],
    TypeScript: ["#3b82f6", "#1e3a8a"],
    Python: ["#3776ab", "#1d3f5e"],
    Kotlin: ["#a855f7", "#5b21b6"],
    HTML: ["#e34c26", "#7c2410"],
    CSS: ["#6d4ad6", "#2f1f73"],
  };
  var DEFAULT_COLORS = ["#4b5563", "#1f2937"];
  var CACHE_KEY = "githubRepos";
  var CACHE_MINUTES = 10;

  function normalizeUrl(url) {
    return String(url || "").toLowerCase().replace(/\/+$/, "");
  }

  function tagsFor(repo) {
    var tags = repo.topics.filter(function (t) {
      return t === "school" || t === "personal" || t === "app";
    });
    var lang = repo.language;
    if (lang === "Java") tags.push("java");
    if (lang === "C#") tags.push("csharp");
    if (["HTML", "CSS", "JavaScript", "TypeScript"].indexOf(lang) !== -1 || repo.has_pages) tags.push("web");
    return tags;
  }

  function repoToProject(repo) {
    var site = repo.homepage || (repo.has_pages ? "https://" + repo.owner.login + ".github.io/" + repo.name + "/" : "");
    var chips = [repo.language].concat(
      repo.topics.filter(function (t) {
        return ["portfolio", "school", "personal", "app"].indexOf(t) === -1;
      })
    ).filter(Boolean).slice(0, 3);
    return {
      title: repo.name.replace(/[-_]+/g, " "),
      url: site || repo.html_url,
      tags: tagsFor(repo),
      desc: repo.description || "No description yet.",
      chips: chips,
      link: site ? "Visit" : "GitHub",
      media: {
        type: "tile",
        name: repo.name.replace(/[-_]+/g, " "),
        sub: "Updated " + new Date(repo.pushed_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        colors: LANGUAGE_COLORS[repo.language] || DEFAULT_COLORS,
        icon: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
      },
    };
  }

  function loadRepos(user) {
    try {
      var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.time < CACHE_MINUTES * 60000) return Promise.resolve(cached.repos);
    } catch (e) {}
    return fetch("https://api.github.com/users/" + encodeURIComponent(user) + "/repos?per_page=100&sort=pushed")
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub " + res.status);
        return res.json();
      })
      .then(function (repos) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), repos: repos }));
        } catch (e) {}
        return repos;
      });
  }

  var githubSection = document.querySelector("[data-github-section]");
  if (githubSection && site.github) {
    var known = {};
    site.projects.forEach(function (p) {
      known[normalizeUrl(p.url)] = true;
    });

    loadRepos(site.github.user)
      .then(function (repos) {
        var extra = repos.filter(function (repo) {
          if (repo.fork || repo.archived || (repo.topics || []).indexOf(site.github.topic) === -1) return false;
          var pagesUrl = "https://" + repo.owner.login + ".github.io/" + repo.name;
          return !known[normalizeUrl(repo.html_url)] && !known[normalizeUrl(repo.homepage)] && !known[normalizeUrl(pagesUrl)];
        });
        if (!extra.length) return;
        githubSection.querySelector("[data-github-grid]").innerHTML = extra.map(function (repo, i) {
          return card(repoToProject(repo), i, false).replace(" reveal", "");
        }).join("");
        githubSection.hidden = false;
        document.dispatchEvent(new CustomEvent("projects:added"));
      })
      .catch(function () {});
  }

  var semester = currentSemester();
  var studying = site.studying[semester] || site.studyingFallback;

  document.querySelectorAll("[data-semester]").forEach(function (el) {
    el.textContent = el.dataset.semester === "ordinal" ? ordinal(semester) : semester;
  });

  document.querySelectorAll("[data-studying]").forEach(function (el) {
    el.textContent = studying[el.dataset.studying];
  });
})();
