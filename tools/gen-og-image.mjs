// Draws the link-preview image (og:image) that LinkedIn, Slack and friends show for the site.
// Run after changing the portrait, title or wording below: node tools/gen-og-image.mjs
// LinkedIn shows it as small as ~360px wide and recompresses anything it has to resize, so it keeps
// to a few large elements and is delivered at exactly the 1200x627 they ask for: drawn at twice that
// size, then scaled down smoothly and saved as a high-quality JPEG.
// Needs Edge or Chrome; set BROWSER=/path/to/browser if neither is found in the usual place.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "assets/og-image.jpg");
const WIDTH = 1200;
const HEIGHT = 627;
const SCALE = 2;

const candidates = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const browser = candidates.find((p) => p && fs.existsSync(p));
if (!browser) throw new Error("No Edge or Chrome found; set BROWSER=/path/to/browser");

// Same palette and fonts as the site's light theme.
const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Playfair+Display:wght@800&display=block"/>
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    display: flex; align-items: center; gap: 64px; padding: 0 64px 0 64px;
    background: radial-gradient(900px 500px at 85% 0%, #fff1e6, transparent 70%), #fbfaf6;
    color: #1c1a17; font-family: Inter, sans-serif;
  }
  img {
    flex-shrink: 0; width: 420px; height: 525px; object-fit: cover; border-radius: 30px;
    box-shadow: 0 2px 4px rgb(40 30 15 / 0.06), 0 30px 60px -24px rgb(40 30 15 / 0.35);
  }
  h1 { font-family: "Playfair Display", serif; font-weight: 800; font-size: 74px; line-height: 1.08; white-space: nowrap; }
  p { margin-top: 30px; color: #c2410c; font-size: 38px; font-weight: 600; line-height: 1.25; }
</style></head>
<body>
  <img src="https://i.ibb.co/SXbLSw55/1000008802.jpg" alt=""/>
  <div>
    <h1>Magnus Forbes<br/>Kjær-Rasmussen</h1>
    <p>Software Engineering</p>
  </div>
</body></html>`;

// Second pass: scale the big screenshot down on a canvas and print it back as a JPEG data URL.
const shrink = (src) => `<!DOCTYPE html><body><script>
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = ${WIDTH}; c.height = ${HEIGHT};
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, ${WIDTH}, ${HEIGHT});
    const out = document.createElement("pre");
    out.id = "out";
    out.textContent = c.toDataURL("image/jpeg", 0.95);
    document.body.appendChild(out);
  };
  img.src = ${JSON.stringify(src)};
</script></body>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-image-"));
try {
  const page = path.join(tmp, "og.html");
  const big = path.join(tmp, "og-big.png");
  fs.writeFileSync(page, html);
  const run = (args) => execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--user-data-dir=${path.join(tmp, "profile")}`,
    "--virtual-time-budget=8000",
    ...args,
  ], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  run([`--force-device-scale-factor=${SCALE}`, `--window-size=${WIDTH},${HEIGHT}`, `--screenshot=${big}`, pathToFileURL(page).href]);
  const shrinkPage = path.join(tmp, "shrink.html");
  fs.writeFileSync(shrinkPage, shrink(pathToFileURL(big).href));
  const dom = run(["--dump-dom", pathToFileURL(shrinkPage).href]).toString();
  const data = /data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/.exec(dom);
  if (!data) throw new Error("Couldn't scale the image down");
  fs.writeFileSync(OUT, Buffer.from(data[1], "base64"));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(path.relative(REPO, OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
