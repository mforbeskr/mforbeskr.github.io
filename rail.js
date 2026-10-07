// Section rail: a stripe of ticks on the right edge, one per [data-rail] section on the page.
// The current section's tick stretches out and shows its number and name; clicking jumps there.
// On the one-page front page it also moves the top nav's underline: a section's data-nav says
// which nav link it belongs to (default: its own id).
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-rail][id]"));
    if (sections.length < 2) return;
    var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    var nav = document.createElement("nav");
    nav.className = "rail";
    nav.setAttribute("aria-label", "Sections on this page");
    var list = document.createElement("ol");
    var links = sections.map(function (section, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + section.id;
      a.innerHTML =
        '<span class="rail-text"><span class="rail-num">' + String(i + 1).padStart(2, "0") + "</span>" +
        '<span class="rail-label"></span></span><span class="rail-tick" aria-hidden="true"></span>';
      a.querySelector(".rail-label").textContent = section.dataset.rail;
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });
    nav.appendChild(list);
    document.body.appendChild(nav);

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
      var hash = sections[next].dataset.nav || "#" + sections[next].id;
      Array.prototype.forEach.call(navLinks, function (a) {
        if (a.getAttribute("href") === hash) a.setAttribute("aria-current", "page");
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
