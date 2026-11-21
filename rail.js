// Section rail: a stripe of ticks on the right edge, one per [data-rail] section on the page.
// The current section's tick stretches out and shows its name; clicking jumps there.
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-rail][id]"));
    if (sections.length < 2) return;

    var nav = document.createElement("nav");
    nav.className = "rail";
    nav.setAttribute("aria-label", window.I18N ? window.I18N.t("rail.aria", "Sections on this page") : "Sections on this page");
    var list = document.createElement("ol");
    var links = sections.map(function (section, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + section.id;
      a.innerHTML =
        '<span class="rail-text"><span class="rail-label"></span></span><span class="rail-tick" aria-hidden="true"></span>';
      a.querySelector(".rail-label").textContent = section.dataset.rail;
      // Jump without putting #section in the address, so a copied URL is just the page.
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var far = Math.abs(section.getBoundingClientRect().top) > window.innerHeight * 1.5;
        if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
        if (smooth && far) {
          veilJump(section, i);
          return;
        }
        window.scrollTo({ top: landing(section, i), behavior: smooth ? "smooth" : "instant" });
        section.focus({ preventScroll: true });
      });
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });
    nav.appendChild(list);
    document.body.appendChild(nav);

    // Long jumps don't glide through the page (that plays every scene change, zoom, reveal and picture
    // on the way). The page fades to its background for a moment, jumps while hidden with all
    // transitions off so everything lands in its final state unseen, then fades back in.
    var root = document.documentElement;

    // Every section lands the same way: its first line of content sits a little below the top bar.
    // Measured from the layout (offsetTop), so a section that has not faded in yet, still shifted
    // down by its reveal animation, lands in the same spot as one that has.
    var GAP = 28;
    function landing(section, i) {
      if (i === 0) return 0;
      var y = 0;
      for (var el = section; el; el = el.offsetParent) y += el.offsetTop;
      y += parseFloat(getComputedStyle(section).paddingTop) || 0;
      var bar = document.querySelector(".site-nav");
      return Math.max(0, y - (bar ? bar.offsetHeight : 0) - GAP);
    }
    var veil = document.createElement("div");
    veil.className = "jump-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    var jumping = false;
    function veilJump(section, i) {
      if (jumping) return;
      jumping = true;
      root.classList.add("veil-on");
      setTimeout(function () {
        root.classList.add("is-jumping");
        window.scrollTo({ top: landing(section, i), behavior: "instant" });
        section.focus({ preventScroll: true });
        // Give the scroll-driven scripts (scenery, reveals, quote, rail) time to settle before showing it
        setTimeout(function () {
          root.classList.remove("is-jumping");
          root.classList.remove("veil-on");
          jumping = false;
        }, 120);
      }, 170);
    }

    // Leave room after the last section so it, and the end of it, can scroll up past the reading
    // line. Without it, the page bottoms out early: jumping to a late section (say Education) would
    // stop short and mark the section after it instead.
    var spacer = document.createElement("div");
    spacer.className = "rail-spacer";
    spacer.setAttribute("aria-hidden", "true");
    var footer = document.querySelector(".site-footer");
    if (footer) footer.parentNode.insertBefore(spacer, footer);
    else document.body.appendChild(spacer);

    function makeRoom() {
      spacer.style.height = "0px";
      var last = sections[sections.length - 1].getBoundingClientRect();
      var vh = window.innerHeight;
      var reach = Math.max(last.top - vh * 0.3, last.bottom - vh * 0.45) + window.scrollY;
      // ...and enough to land the last section like the others (see landing)
      reach = Math.max(reach, landing(sections[sections.length - 1], sections.length - 1));
      var maxScroll = document.documentElement.scrollHeight - vh;
      spacer.style.height = Math.max(0, Math.ceil(reach - maxScroll)) + "px";
    }
    makeRoom();
    window.addEventListener("load", makeRoom);
    window.addEventListener("resize", makeRoom);

    var current = -1;
    function update() {
      var line = window.innerHeight * 0.4, next = 0;
      sections.forEach(function (s, i) {
        if (s.getBoundingClientRect().top < line) next = i;
      });
      // At the very bottom, the last section wins even if it is too short to reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) next = sections.length - 1;
      if (next === current) return;
      current = next;
      links.forEach(function (a, i) {
        if (i === next) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    }

    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      setTimeout(function () {
        queued = false;
        update();
      }, 50);
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });
})();
