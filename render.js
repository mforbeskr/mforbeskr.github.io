(function () {
  "use strict";

  var i18n = window.I18N || { lang: "en", apply: function () {}, t: function (key, english) { return english; } };
  var t = i18n.t;
  // Swap in the Danish copy before anything below (or story.js, rail.js) reads the page.
  i18n.apply();

  var site = window.SITE;
  if (!site) return;

  // Content entries can carry a da: { ... } with the Danish versions of their fields.
  function localized(entry) {
    if (i18n.lang !== "da" || !entry.da) return entry;
    var out = Object.assign({}, entry, entry.da);
    if (entry.media && entry.da.media) out.media = Object.assign({}, entry.media, entry.da.media);
    return out;
  }

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
    if (i18n.lang === "da") return n + ".";
    var suffixes = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  function media(m) {
    if (m.type === "image") {
      return (
        '<div class="project-media"><img' + (m.contain ? ' class="contain"' : "") +
        ' src="' + esc(m.src) + '" alt="' + esc(m.alt) + '" width="' + (m.width || 640) + '" height="' + (m.height || 400) + '" loading="lazy" decoding="async" /></div>'
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
    // No url (e.g. a private repo): same card, just not a link and no arrow.
    var tag = p.url ? "a" : "div";
    var delay = index % 3 ? ' style="--delay: ' + (index % 3) * 0.05 + 's"' : "";
    var chips = p.chips.map(function (c) {
      return '<li class="chip">' + esc(c) + "</li>";
    }).join("");
    return (
      "<" + tag + ' class="' + classes + '" data-tags="' + esc(p.tags.join(" ")) + '"' + (p.featured ? " data-featured" : "") + delay +
      (p.url ? ' href="' + esc(p.url) + '" target="_blank" rel="noopener"' : "") + ">" +
      media(p.media) +
      '<div class="project-body">' +
      (p.badge ? '<p class="project-badge">' + esc(p.badge) + "</p>" : "") +
      "<h3>" + esc(p.title) + "</h3>" +
      "<p>" + esc(p.desc) + "</p>" +
      '<div class="project-foot"><ul class="chips">' + chips + "</ul>" +
      (p.link ? '<span class="project-link">' + esc(t("link." + p.link, p.link)) + (p.url ? " " + ARROW : "") + "</span>" : "") + "</div>" +
      "</div></" + tag + ">"
    );
  }

  document.querySelectorAll("[data-projects]").forEach(function (grid) {
    grid.innerHTML = site.projects.map(function (p, i) {
      return card(localized(p), i, true);
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
  var CACHE_KEY = "githubReposFallback";

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
      desc: repo.description || t("github.noDesc", "No description yet."),
      chips: chips,
      link: site ? "Visit" : "GitHub",
      media: {
        type: "tile",
        name: repo.name.replace(/[-_]+/g, " "),
        sub: t("github.updated", "Updated") + " " +
          new Date(repo.pushed_at).toLocaleDateString(i18n.lang === "da" ? "da-DK" : "en-GB", { month: "short", year: "numeric" }),
        colors: LANGUAGE_COLORS[repo.language] || DEFAULT_COLORS,
        icon: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
      },
    };
  }

  // Always ask GitHub for the current list, so newly tagged repos show up right away.
  // The last good list is kept only as a fallback for when GitHub can't be reached or rate-limits us.
  function loadRepos(user) {
    return fetch("https://api.github.com/users/" + encodeURIComponent(user) + "/repos?per_page=100&sort=pushed")
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub responded " + res.status);
        return res.json();
      })
      .then(function (repos) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(repos));
        } catch (e) {}
        return repos;
      })
      .catch(function (err) {
        var cached = null;
        try {
          cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
        } catch (e) {}
        if (Array.isArray(cached)) return cached;
        throw err;
      });
  }

  // Tagged repos join the main project grid (after the handmade cards) and work with the filters.
  var projectGrid = document.querySelector("[data-projects]");
  if (projectGrid && site.github) {
    var known = {};
    site.projects.forEach(function (p) {
      if (p.url) known[normalizeUrl(p.url)] = true;
    });

    loadRepos(site.github.user)
      .then(function (repos) {
        var extra = repos.filter(function (repo) {
          if (repo.fork || repo.archived || (repo.topics || []).indexOf(site.github.topic) === -1) return false;
          var pagesUrl = "https://" + repo.owner.login + ".github.io/" + repo.name;
          return !known[normalizeUrl(repo.html_url)] && !known[normalizeUrl(repo.homepage)] && !known[normalizeUrl(pagesUrl)];
        });
        if (!extra.length) return;
        var offset = projectGrid.children.length;
        projectGrid.insertAdjacentHTML("beforeend", extra.map(function (repo, i) {
          return card(repoToProject(repo), offset + i, false).replace(" reveal", "");
        }).join(""));
        document.dispatchEvent(new CustomEvent("projects:added"));
      })
      .catch(function (err) {
        console.warn("Couldn't load tagged GitHub repos:", err);
      });
  }

  var semester = currentSemester();
  var studying = localized(site.studying[semester] || site.studyingFallback);

  document.querySelectorAll("[data-semester]").forEach(function (el) {
    el.textContent = el.dataset.semester === "ordinal" ? ordinal(semester) : semester;
  });

  document.querySelectorAll("[data-studying]").forEach(function (el) {
    el.textContent = studying[el.dataset.studying];
  });

  // Hovering a brand word (Hos Qilej, Tackly, LearnHub) "loads" a small dark preview of that site
  // for 0.44-0.74 s, then shows its picture, name and tagline. Mouse/trackpad and keyboard focus only.
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    var peek = null;
    var peekLink = null;
    var peekTimer = 0;

    var findProject = function (href) {
      var key = normalizeUrl(href);
      for (var i = 0; i < site.projects.length; i++) {
        if (site.projects[i].url && normalizeUrl(site.projects[i].url) === key) return localized(site.projects[i]);
      }
      return null;
    };

    var hidePeek = function () {
      clearTimeout(peekTimer);
      peekLink = null;
      if (peek) peek.classList.remove("is-open", "is-loaded");
    };

    var placePeek = function (link) {
      var r = link.getBoundingClientRect();
      var w = peek.offsetWidth;
      var h = peek.offsetHeight;
      var x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
      var y = r.top - h - 12;
      if (y < 8) y = r.bottom + 12;
      peek.style.left = Math.round(x) + "px";
      peek.style.top = Math.round(y) + "px";
    };

    // App Store / Google Play links get a smaller card: the store's icon, what it opens, and where.
    var STORE_ICONS = {
      apple:
        '<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="peek-as" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1ec0ff"/><stop offset="1" stop-color="#0a6cf0"/></linearGradient></defs>' +
        '<rect width="40" height="40" rx="9" fill="url(#peek-as)"/><g stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M17.6 10.5 9.8 27M22.4 10.5 30.2 27M12.5 21.5h15"/><path d="M9 30.5h5M26 30.5h5" stroke-width="2.2"/></g></svg>',
      google:
        '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="#14121c"/>' +
        '<path d="M12 9.5v21l11-10.5z" fill="#34a853"/><path d="M12 9.5l14.5 8.2L23 20.5z" fill="#4285f4"/>' +
        '<path d="M12 30.5l14.5-8.2L23 20.5z" fill="#ea4335"/><path d="M26.5 17.7l4 2.3-0.1.1-3.9 2.2-3.5-1.8z" fill="#fbbc04"/></svg>',
    };
    var storeOf = function (link) {
      if (/(^|\.)apps\.apple\.com$/.test(link.hostname)) return "apple";
      if (/(^|\.)play\.google\.com$/.test(link.hostname)) return "google";
      return null;
    };
    var storeCard = function (link) {
      var da = i18n.lang === "da";
      var store = storeOf(link);
      var title = store === "apple" ? "Tackly" : "4bestudio";
      var sub = store === "apple"
        ? (da ? "Hent den i App Store" : "Get it on the App Store")
        : (da ? "Udvikler på Google Play" : "Developer on Google Play");
      return '<div class="peek-store">' + STORE_ICONS[store] +
        '<div class="peek-text"><strong>' + esc(title) + "</strong><p>" + esc(sub) + "</p></div></div>";
    };

    var showPeek = function (link) {
      var store = storeOf(link);
      var p = store ? null : findProject(link.href);
      if ((!p && !store) || link === peekLink) return;
      hidePeek();
      peekLink = link;
      if (!peek) {
        peek = document.createElement("div");
        peek.className = "peek";
        peek.setAttribute("aria-hidden", "true");
        document.body.appendChild(peek);
      }
      var host = link.hostname.replace(/^www\./, "") + (store ? "" : link.pathname.length > 1 ? link.pathname : "");
      peek.classList.toggle("peek-small", !!store);
      peek.innerHTML =
        '<div class="peek-bar"><span class="peek-dots"><i></i><i></i><i></i></span><span class="peek-url">' + esc(host) + "</span></div>" +
        '<div class="peek-progress"></div>' +
        '<div class="peek-view">' +
        (store
          ? storeCard(link)
          : media(p.media) + '<div class="peek-text"><strong>' + esc(p.title) + "</strong>" + (p.badge ? "<p>" + esc(p.badge) + "</p>" : "") + "</div>") +
        '<div class="peek-skeleton"><span></span><span></span><span></span></div></div>';
      var ms = Math.round(440 + Math.random() * 300);
      peek.style.setProperty("--load", ms + "ms");
      placePeek(link);
      void peek.offsetWidth; // start the loading line from empty
      peek.classList.add("is-open");
      peekTimer = setTimeout(function () {
        peek.classList.add("is-loaded");
      }, ms);
    };

    var brandLink = function (e) {
      return e.target && e.target.closest
        ? e.target.closest('a.brand-word[href], .prose a[href*="apps.apple.com"], .prose a[href*="play.google.com"]')
        : null;
    };
    document.addEventListener("mouseover", function (e) {
      var link = brandLink(e);
      if (link) showPeek(link);
    });
    document.addEventListener("mouseout", function (e) {
      var link = brandLink(e);
      if (link && !link.contains(e.relatedTarget)) hidePeek();
    });
    document.addEventListener("focusin", function (e) {
      var link = brandLink(e);
      if (link) showPeek(link);
    });
    document.addEventListener("focusout", hidePeek);
    window.addEventListener("scroll", hidePeek, { passive: true });
  }
})();
