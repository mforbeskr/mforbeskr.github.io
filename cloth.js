// Cloth images: pictures marked [data-cloth] are redrawn with WebGL on a rippling mesh that hangs
// from its top edge like a sheet on a line, lit so the folds catch light and shadow.
// At rest the wave is calmer in dark mode, where the fireflies are the thing that should move;
// on hover both themes get the same gentle swell, plus a ripple under the cursor.
// The original <img> stays in place (invisible) for layout, screen readers and as the fallback.
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var VERTEX = [
    "attribute vec2 a_uv;",
    "uniform float u_time, u_amp, u_aspect, u_inner;",
    "uniform vec3 u_poke;",
    "varying vec2 v_uv;",
    "varying float v_light;",
    "float pinned(vec2 uv) {",
    "  return pow(uv.y, 1.15);",
    "}",
    "float wave(vec2 uv) {",
    "  float t = u_time;",
    "  float z = sin(uv.x * 5.0 + t * 1.7 + uv.y * 1.5) * 0.55",
    "          + sin(uv.x * 11.0 - t * 2.3 + uv.y * 5.0) * 0.25",
    "          + sin(uv.y * 6.0 + t * 1.2) * 0.3;",
    "  vec2 d = uv - u_poke.xy;",
    "  d.x *= u_aspect;",
    "  float r = length(d);",
    "  z += u_poke.z * exp(-r * r * 14.0) * sin(r * 24.0 - t * 6.0) * 1.4;",
    "  return z * pinned(uv) * u_amp;",
    "}",
    "void main() {",
    "  v_uv = a_uv;",
    "  float z = wave(a_uv);",
    "  float e = 0.01;",
    "  vec3 n = normalize(vec3(-(wave(a_uv + vec2(e, 0.0)) - z) / e * 0.5, (wave(a_uv + vec2(0.0, e)) - z) / e * 0.5, 1.0));",
    "  vec3 l = normalize(vec3(-0.45, 0.55, 1.0));",
    "  v_light = 1.0 + (dot(n, l) - l.z) * 2.2;",
    "  vec2 p = vec2(a_uv.x * 2.0 - 1.0, 1.0 - a_uv.y * 2.0);",
    "  p.x += pinned(a_uv) * u_amp * 0.35 * sin(u_time * 0.9 + a_uv.y * 2.0);",
    "  gl_Position = vec4(p * u_inner, 0.0, 1.0 - z * 0.8);",
    "}",
  ].join("\n");

  var FRAGMENT = [
    "precision mediump float;",
    "uniform sampler2D u_tex;",
    "uniform vec4 u_crop;",
    "uniform vec2 u_size;",
    "uniform float u_radius;",
    "varying vec2 v_uv;",
    "varying float v_light;",
    "void main() {",
    "  vec4 c = texture2D(u_tex, u_crop.xy + v_uv * u_crop.zw);",
    "  vec2 q = abs(v_uv * u_size - u_size * 0.5) - (u_size * 0.5 - u_radius);",
    "  float alpha = clamp(0.5 - (length(max(q, 0.0)) - u_radius), 0.0, 1.0);",
    "  vec3 rgb = c.rgb * v_light + max(v_light - 1.0, 0.0) * 0.25;",
    "  gl_FragColor = vec4(rgb, 1.0) * c.a * alpha;",
    "}",
  ].join("\n");

  var GRID = 48;
  var cloths = [];

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  function Cloth(img) {
    var canvas = document.createElement("canvas");
    canvas.className = "cloth-canvas";
    canvas.setAttribute("aria-hidden", "true");
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return;

    var program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    var uvs = [], indices = [];
    for (var y = 0; y <= GRID; y++) for (var x = 0; x <= GRID; x++) uvs.push(x / GRID, y / GRID);
    for (y = 0; y < GRID; y++) {
      for (x = 0; x < GRID; x++) {
        var i = y * (GRID + 1) + x;
        indices.push(i, i + 1, i + GRID + 1, i + 1, i + GRID + 2, i + GRID + 1);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var u = {};
    ["u_time", "u_amp", "u_aspect", "u_inner", "u_poke", "u_crop", "u_size", "u_radius"].forEach(function (name) {
      u[name] = gl.getUniformLocation(program, name);
    });

    var self = {
      img: img, gl: gl, canvas: canvas, u: u, ready: false, visible: true,
      amp: 0, targetAmp: 0, idle: [0.05, 0.022], hover: [0.05, 0.05], // [light, dark]
      poke: [0.5, 0.5, 0], pokeTarget: 0, count: indices.length,
    };

    var source = new Image();
    source.crossOrigin = "anonymous";
    source.onload = function () {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      } catch (e) {
        return; // No CORS access to this image: keep the plain <img>.
      }
      self.natural = [source.naturalWidth, source.naturalHeight];
      img.insertAdjacentElement("afterend", canvas);
      layout(self);
      self.ready = true;
      draw(self, cloths.indexOf(self), performance.now());
      img.classList.add("cloth-hidden");
    };
    source.src = img.currentSrc || img.src;

    // Pointer: the cloth livens up on hover and ripples where the cursor is.
    var host = img.parentElement;
    host.addEventListener("pointermove", function (e) {
      var r = img.getBoundingClientRect();
      self.poke[0] = (e.clientX - r.left) / r.width;
      self.poke[1] = (e.clientY - r.top) / r.height;
      self.pokeTarget = 1;
      self.hovered = true;
    });
    host.addEventListener("pointerleave", function () {
      self.pokeTarget = 0;
      self.hovered = false;
    });

    cloths.push(self);
  }

  function layout(c) {
    var img = c.img, w = img.offsetWidth, h = img.offsetHeight;
    if (!w || !h) return;
    // The sheet swings past its edges, so its canvas gets some room around the picture.
    var pad = 0.1;
    var cw = w * (1 + pad * 2), ch = h * (1 + pad * 2);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.canvas.width = Math.round(cw * dpr);
    c.canvas.height = Math.round(ch * dpr);
    var s = c.canvas.style;
    s.width = cw + "px";
    s.height = ch + "px";
    s.left = img.offsetLeft - w * pad + "px";
    s.top = img.offsetTop - h * pad + "px";
    c.gl.viewport(0, 0, c.canvas.width, c.canvas.height);

    // object-fit: cover
    var box = w / h, pic = c.natural[0] / c.natural[1];
    var crop = pic > box ? [(1 - box / pic) / 2, 0, box / pic, 1] : [0, (1 - pic / box) / 2, 1, pic / box];
    c.gl.uniform4f(c.u.u_crop, crop[0], crop[1], crop[2], crop[3]);
    c.gl.uniform2f(c.u.u_size, w, h);
    c.gl.uniform1f(c.u.u_radius, parseFloat(getComputedStyle(img).borderTopLeftRadius) || 0);
    c.gl.uniform1f(c.u.u_aspect, box);
    c.gl.uniform1f(c.u.u_inner, 1 / (1 + pad * 2));
  }

  function draw(c, i, t) {
    var dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
    c.targetAmp = (c.hovered ? c.hover : c.idle)[dark];
    c.amp += (c.targetAmp - c.amp) * 0.05;
    c.poke[2] += (c.pokeTarget - c.poke[2]) * 0.06;
    var gl = c.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(c.u.u_time, t / 1000 + i * 1.7);
    gl.uniform1f(c.u.u_amp, c.amp);
    gl.uniform3f(c.u.u_poke, c.poke[0], c.poke[1], c.poke[2]);
    gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_SHORT, 0);
  }

  function frame(t) {
    requestAnimationFrame(frame);
    for (var i = 0; i < cloths.length; i++) {
      var c = cloths[i];
      if (c.ready && c.visible && !document.hidden) draw(c, i, t);
    }
  }

  document.querySelectorAll("img[data-cloth]").forEach(function (img) {
    try {
      Cloth(img);
    } catch (e) {
      console.warn("Cloth effect skipped:", e);
    }
  });
  if (!cloths.length) return;

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        cloths.forEach(function (c) {
          if (c.img === entry.target) c.visible = entry.isIntersecting;
        });
      });
    }, { rootMargin: "100px" });
    cloths.forEach(function (c) {
      io.observe(c.img);
    });
  }

  window.addEventListener("resize", function () {
    cloths.forEach(function (c) {
      if (c.ready) layout(c);
    });
  });
  requestAnimationFrame(frame);
})();
