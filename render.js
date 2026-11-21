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
    // Video: the card keeps its cropped poster; the play button opens the full 16:9 film in a dialog,
    // so nothing is downloaded until someone asks for it.
    if (m.type === "video") {
      return (
        '<div class="project-media has-video"><img src="' + esc(m.poster) + '" alt="' + esc(m.alt) + '" width="' + (m.width || 1280) + '" height="' + (m.height || 720) + '" loading="lazy" decoding="async" />' +
        '<button type="button" class="play-btn" data-video="' + esc(m.src) + '" data-poster="' + esc(m.poster) + '" data-label="' + esc(m.alt) + '" aria-label="' + esc(t("video.play", "Play video")) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></button></div>'
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
      (p.link ?'<span class="project-link">' + esc(t("link." + p.link, p.link)) + (p.url ? " " + ARROW : "") + "</span>" : "") + "</div>" +
      "</div></" + tag + ">"
    );
  }

  document.querySelectorAll("[data-projects]").forEach(function (grid) {
    grid.innerHTML = site.projects.map(function (p, i) {
      return card(localized(p), i, true);
    }).join("");
  });

  var videoDialog = null;
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".play-btn[data-video]");
    if (!btn) return;
    if (!videoDialog) {
      videoDialog = document.createElement("dialog");
      videoDialog.className = "video-dialog";
      videoDialog.innerHTML =
        '<button type="button" class="video-close" aria-label="' + esc(t("video.close", "Close")) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>' +
        '<video controls controlslist="nodownload" playsinline preload="none"></video>';
      document.body.appendChild(videoDialog);
      videoDialog.querySelector(".video-close").addEventListener("click", function () {
        videoDialog.close();
      });
      // A click on the dim backdrop (the dialog itself, outside the video) closes it too.
      videoDialog.addEventListener("click", function (ev) {
        if (ev.target === videoDialog) videoDialog.close();
      });
      videoDialog.addEventListener("close", function () {
        videoDialog.querySelector("video").pause();
      });
    }
    var video = videoDialog.querySelector("video");
    if (video.getAttribute("src") !== btn.dataset.video) {
      video.poster = btn.dataset.poster;
      video.src = btn.dataset.video;
    }
    video.setAttribute("aria-label", btn.dataset.label);
    video.currentTime = 0;
    videoDialog.showModal();
    var playing = video.play();
    if (playing && playing.catch) playing.catch(function () {});
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

    // App Store / Google Play links get a smaller card: what it opens, and the store's official badge.
    // Apple's and Google's rules: their marks only as the official badge artwork, unaltered, never a
    // home-drawn logo (assets/badges, downloaded from developer.apple.com and play.google.com).
    var STORE_BADGES = {
      apple: { src: "assets/badges/app-store.svg", alt: "Download on the App Store" },
      google: { src: "assets/badges/google-play.png", alt: "Get it on Google Play" },
    };
    // Load them up front so the badge is there the moment the card opens
    Object.keys(STORE_BADGES).forEach(function (k) {
      new Image().src = STORE_BADGES[k].src;
    });
    var storeOf = function (link) {
      if (/(^|\.)apps\.apple\.com$/.test(link.hostname)) return "apple";
      if (/(^|\.)play\.google\.com$/.test(link.hostname)) return "google";
      return null;
    };
    var storeCard = function (link) {
      var da = i18n.lang === "da";
      var store = storeOf(link);
      var sub = store === "apple"
        ? (da ? "Til iPhone og iPad" : "For iPhone and iPad")
        : (da ? "Til Android" : "For Android");
      var badge = STORE_BADGES[store];
      return '<div class="peek-store">' +
        '<div class="peek-text"><strong class="peek-brand-tackly">Tackly</strong><p>' + esc(sub) + "</p></div>" +
        '<img class="peek-badge peek-badge-' + store + '" src="' + badge.src + '" alt="' + badge.alt + '" /></div>';
    };

    // The card's title wears the same brand font as the word you hovered (store links open Tackly)
    var brandOf = function (link) {
      var m = /\bbrand-(qilej|tackly|learnhub)\b/.exec(link.className);
      return m ? m[1] : storeOf(link) ? "tackly" : null;
    };

    var showPeek = function (link) {
      var store = storeOf(link);
      var brand = brandOf(link);
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
          : media(p.media) + '<div class="peek-text"><strong' + (brand ? ' class="peek-brand-' + brand + '"' : "") + ">" + esc(p.title) + "</strong>" + (p.badge ? "<p>" + esc(p.badge) + "</p>" : "") + "</div>") +
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
