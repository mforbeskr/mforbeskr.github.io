// Reading effects: headlines rise in word by word, the pull quote lights up as it scrolls past,
// list items arrive one after another, and résumé timelines fill in as you read down them.
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Wrap each word in a mask so it can slide up; the spaces stay as text, so it reads normally.
  function splitWords(el, cls) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var outer = document.createElement("span");
      outer.className = cls;
      outer.style.setProperty("--i", i);
      var inner = document.createElement("span");
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return el.querySelectorAll("." + cls);
  }

  document.querySelectorAll("[data-split]").forEach(function (el) {
    splitWords(el, "word");
  });

  var quote = document.querySelector("[data-scrub] p");
  var quoteWords = quote ? splitWords(quote, "qw") : [];

  // Give list items their place in line so CSS can stagger them.
  document.querySelectorAll(".skill-words, .check-list, .dots").forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (item, i) {
      item.style.setProperty("--i", i);
    });
  });

  var timelines = Array.prototype.slice.call(document.querySelectorAll(".timeline"));

  if (reduceMotion) return;
  root.classList.add("story-ready");

  function update() {
    var vh = window.innerHeight;

    if (quoteWords.length) {
      // Words light up as the quote travels from the bottom 85% to 40% of the screen.
      var q = quote.getBoundingClientRect();
      var t = Math.min(1, Math.max(0, (vh * 0.85 - (q.top + q.height / 2)) / (vh * 0.45)));
      var lit = Math.round(t * quoteWords.length);
      for (var w = 0; w < quoteWords.length; w++) quoteWords[w].classList.toggle("is-lit", w < lit);
    }

    // A timeline fills down to the reading line; each entry's dot lights up once the line passes it.
    // (rail.js leaves enough room at the end of the page for the last entries to reach the line.)
    var line = vh * 0.5;
    timelines.forEach(function (tl) {
      var r = tl.getBoundingClientRect();
      tl.style.setProperty("--fill", Math.min(1, Math.max(0, (line - r.top) / r.height)).toFixed(3));
      Array.prototype.forEach.call(tl.children, function (li) {
        li.classList.toggle("is-passed", li.getBoundingClientRect().top + 8 < line);
      });
    });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    // Coalesce scroll bursts, but don't depend on animation frames alone (they pause in hidden tabs).
    setTimeout(function () {
      queued = false;
      update();
    }, 16);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
