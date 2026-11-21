// The one place asset versions live. After changing a file, bump its number here; both pages
// pick it up, so index.html and resume.html never need touching for a cache refresh.
// This file itself has no version: GitHub Pages lets browsers keep it for 10 minutes at most.
(function () {
  var VERSIONS = {
    "style.css": 92,
    "lang.js": 17,
    "content.js": 26,
    "script.js": 27,
    "scene.js": 16,
    "rail.js": 12,
    "cloth.js": 8,
    "story.js": 8,
    "render.js": 18,
  };

  function url(file) {
    return file + "?v=" + VERSIONS[file];
  }

  // Written straight into the page while it is parsed, so stylesheets still block rendering
  // and scripts still run in order, exactly as plain tags would.
  function load(files, defer) {
    var html = "";
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      html += /\.css$/.test(file)
        ? '<link rel="stylesheet" href="' + url(file) + '">'
        : '<script src="' + url(file) + '"' + (defer ? " defer" : "") + "></scr" + "ipt>";
    }
    document.write(html);
  }

  window.loadAssets = function () {
    load(arguments, false);
  };
  window.loadAssets.defer = function () {
    load(arguments, true);
  };
})();
