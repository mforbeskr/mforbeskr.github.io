// Front-page scenery. The landscape stays pinned behind the whole page and changes as you scroll:
// each [data-scene] marker hands over to the next scene, which wipes in over the previous one.
// Within a scene, scrolling flies the camera slowly forward (near layers grow more than far ones).
// A veil in the page colour keeps text readable: it follows how much of the screen is taken up by
// content, so text always sits on a calm background, while the hero and each .scene-break
// (where there is no text) show the landscape in full.
// The canvas adds the "air" for each scene: fireflies, snow, pollen and swallows, or desert dust.
(function () {
  "use strict";

  var root = document.documentElement;
  var scene = document.querySelector(".scene");
  if (!scene) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var chapters = Array.prototype.map.call(scene.querySelectorAll(".scene-chapter"), function (el) {
    return {
      el: el,
      loaded: el.classList.contains("is-shown"),
      layers: Array.prototype.map.call(el.querySelectorAll(".scene-layer"), function (layer) {
        return { el: layer, depth: 1 - (parseFloat(layer.dataset.speed) || 0) };
      }),
    };
  });
  var markers = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
  var content = Array.prototype.slice.call(document.querySelectorAll("main > section:not(.hero):not(.facts), .site-footer"));
  var canvas = scene.querySelector(".scene-fx");
  var ctx = canvas && canvas.getContext("2d");

  var active = 1;
  var pointer = { x: 0, tx: 0 };

  function load(chapter) {
    if (!chapter || chapter.loaded) return;
    chapter.loaded = true;
    chapter.el.querySelectorAll("image[data-href]").forEach(function (img) {
      img.setAttribute("href", img.getAttribute("data-href"));
    });
  }

  function markerTop(i) {
    return markers[i].getBoundingClientRect().top + window.scrollY;
  }

  // ---------- Scroll: which scene, how far into it, how much veil ----------
  function place() {
    var vh = window.innerHeight;
    var y = window.scrollY;

    var next = 1;
    markers.forEach(function (m) {
      var top = m.getBoundingClientRect().top;
      if (top < vh * 0.7) next = Number(m.dataset.scene);
      if (top < vh * 2.5) load(chapters[Number(m.dataset.scene) - 1]);
    });
    if (next !== active) {
      active = next;
      chapters.forEach(function (c, i) {
        c.el.classList.toggle("is-shown", i < active);
        c.el.classList.toggle("is-covered", i < active - 1);
      });
    }

    if (!reduceMotion) {
      var end = document.documentElement.scrollHeight - vh;
      markers.forEach(function (m, i) {
        var n = Number(m.dataset.scene), c = chapters[n - 1];
        if (!c || Math.abs(n - active) > 1) return;
        var start = i === 0 ? 0 : markerTop(i) - vh;
        var stop = i + 1 < markers.length ? markerTop(i + 1) : end;
        var p = Math.min(1, Math.max(0, (y - start) / Math.max(1, stop - start)));
        for (var k = 0; k < c.layers.length; k++) {
          var l = c.layers[k];
          var scale = 1 + p * l.depth * 0.32;
          var dy = (i === 0 ? -Math.min(1, y / vh) * l.depth * 36 : 0) + p * l.depth * 60;
          var dx = -pointer.x * l.depth * 24;
          l.el.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) scale(" + scale.toFixed(4) + ")";
        }
      });
    }

    var covered = 0;
    content.forEach(function (el) {
      var r = el.getBoundingClientRect();
      covered += Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    });
    // Fully veiled once text fills half the screen.
    scene.style.setProperty("--dim", Math.min(1, (covered / vh) * 2).toFixed(3));
    scene.style.setProperty("--scrim", (1 - Math.min(1, y / vh)).toFixed(3));
  }

  // ---------- Air ----------
  var W = 0, H = 0, motes = [], comet = null, birds = [], nextComet = 0, nextBirds = 0;

  function mode() {
    return (root.dataset.theme === "light" ? "day" : "night") + active;
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = scene.offsetWidth;
    H = scene.offsetHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    resetAir();
  }

  function resetAir() {
    var m = mode();
    var count = m === "night3" ? 90 : m === "night2" ? 12 : 34;
    motes = [];
    for (var i = 0; i < Math.round(count * Math.min(1, W / 1400)); i++) motes.push(newMote(true));
    birds = [];
  }

  function newMote(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? H * Math.random() : -10,
      vx: (Math.random() - 0.5) * 0.25,
      vy: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      size: 0.8 + Math.random() * 1.6,
      hue: Math.random() < 0.7 ? 0 : 1,
    };
  }

  function dot(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
  }

  function fireflies(t) {
    motes.forEach(function (m) {
      m.x += m.vx + Math.sin(t / 1400 + m.phase) * 0.25;
      m.y += Math.sin(t / 1900 + m.phase) * 0.18;
      if (m.y < H * 0.5) m.y = H * (0.55 + Math.random() * 0.4);
      if (m.x < -10) m.x = W + 10;
      if (m.x > W + 10) m.x = -10;
      var glow = 0.5 + 0.5 * Math.sin(t / 600 + m.phase * 3);
      var color = m.hue ? "201,163,255," : "220,255,150,";
      dot(m.x, m.y, m.size * 4, "rgba(" + color + (0.12 * glow).toFixed(3) + ")");
      dot(m.x, m.y, m.size, "rgba(" + color + (0.35 + 0.65 * glow).toFixed(3) + ")");
    });
  }

  function snow(t) {
    motes.forEach(function (m, i) {
      m.y += m.vy * 0.8;
      m.x += Math.sin(t / 1300 + m.phase) * 0.35 + 0.1;
      if (m.y > H + 5) motes[i] = newMote(false);
      dot(m.x, m.y, m.size * 0.9, "rgba(240,236,255," + (0.35 + m.size * 0.25).toFixed(3) + ")");
    });
  }

  function shootingStars(t) {
    if (!comet && t > nextComet) {
      comet = { x: W * (0.35 + Math.random() * 0.6), y: H * Math.random() * 0.25, life: 0 };
      nextComet = t + 7000 + Math.random() * 9000;
    }
    if (!comet) return;
    comet.life += 1;
    var p = comet.life / 55, hx = comet.x - p * 260, hy = comet.y + p * 110, a = Math.sin(p * Math.PI);
    var grad = ctx.createLinearGradient(hx, hy, hx + 90, hy - 38);
    grad.addColorStop(0, "rgba(255,255,255," + (0.9 * a).toFixed(3) + ")");
    grad.addColorStop(1, "rgba(200,170,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 90, hy - 38);
    ctx.stroke();
    if (p >= 1) comet = null;
  }

  // Warm specks: pollen rises gently in the garden; desert dust blows sideways.
  function specks(t, windy) {
    motes.forEach(function (m, i) {
      if (windy) {
        m.x += 0.6 + m.size * 0.3;
        m.y += Math.sin(t / 900 + m.phase) * 0.2;
        if (m.x > W + 10) { m.x = -10; m.y = H * (0.4 + Math.random() * 0.6); }
      } else {
        m.x += m.vx + Math.sin(t / 1700 + m.phase) * 0.2;
        m.y -= m.vy * 0.25;
        if (m.y < H * 0.25) { motes[i] = newMote(false); motes[i].y = H; }
      }
      var a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t / 900 + m.phase));
      dot(m.x, m.y, m.size * 0.9, (windy ? "rgba(214,160,110," : "rgba(255,226,150,") + a.toFixed(3) + ")");
    });
  }

  // Swallows over the garden and the olive groves: a few V-shapes crossing now and then.
  function flock(t) {
    if (!birds.length && t > nextBirds) {
      var dir = Math.random() < 0.5 ? 1 : -1, y0 = H * (0.1 + Math.random() * 0.2);
      for (var b = 0; b < 2 + Math.floor(Math.random() * 2); b++) {
        birds.push({ x: dir > 0 ? -40 - b * 50 : W + 40 + b * 50, y: y0 + b * 16 + Math.random() * 10, v: dir * 1.2, phase: Math.random() * 6 });
      }
      nextBirds = t + 10000 + Math.random() * 12000;
    }
    var span = 8;
    ctx.strokeStyle = "rgba(60,48,58,0.55)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    birds = birds.filter(function (bird) {
      bird.x += bird.v;
      bird.y += Math.sin(t / 500 + bird.phase) * 0.15;
      var flap = Math.sin(t / 110 + bird.phase) * span * 0.45;
      ctx.beginPath();
      ctx.moveTo(bird.x - span, bird.y - flap);
      ctx.quadraticCurveTo(bird.x - span * 0.4, bird.y - 2, bird.x, bird.y + 1);
      ctx.quadraticCurveTo(bird.x + span * 0.4, bird.y - 2, bird.x + span, bird.y - flap);
      ctx.stroke();
      return bird.x > -80 && bird.x < W + 80;
    });
  }

  var lastMode = "";
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (Math.abs(pointer.tx - pointer.x) > 0.001) {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      place();
    }
    var m = mode();
    if (m !== lastMode) {
      lastMode = m;
      resetAir();
    }
    ctx.clearRect(0, 0, W, H);
    if (m === "night1" || m === "night2") { fireflies(t); shootingStars(t); }
    else if (m === "night3") snow(t);
    else if (m === "day1" || m === "day2") { specks(t, false); flock(t); }
    else specks(t, true);
  }

  // ---------- Wiring ----------
  window.addEventListener("scroll", place, { passive: true });
  window.addEventListener("resize", place);
  window.addEventListener("pointermove", function (e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  }, { passive: true });
  // Fetch the later scenes once the page has settled, so they are ready before you reach them.
  window.addEventListener("load", function () {
    setTimeout(function () {
      chapters.forEach(load);
    }, 2500);
  });
  place();

  if (reduceMotion || !ctx) {
    if (canvas) canvas.remove();
    return;
  }
  // The animated "air" starts once the page has settled (see whenSettled in script.js).
  (window.whenSettled || function (fn) { fn(); })(function () {
    resize();
    new ResizeObserver(resize).observe(scene);
    requestAnimationFrame(frame);
  });
})();
