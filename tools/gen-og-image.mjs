// Draws the link-preview image (og:image) that LinkedIn, Slack and friends show for the site.
// Run after changing the portrait, title or wording below: node tools/gen-og-image.mjs
// Needs Edge or Chrome; set BROWSER=/path/to/browser if neither is found in the usual place.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "assets/og-image.png");
const WIDTH = 1200;
const HEIGHT = 627;

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
    display: flex; align-items: center; gap: 72px; padding: 0 88px 0 72px;
    background: radial-gradient(900px 500px at 85% 0%, #fff1e6, transparent 70%), #fbfaf6;
    color: #1c1a17; font-family: Inter, sans-serif;
  }
  img {
    flex-shrink: 0; width: 392px; height: 490px; object-fit: cover; border-radius: 28px;
    box-shadow: 0 2px 4px rgb(40 30 15 / 0.06), 0 30px 60px -24px rgb(40 30 15 / 0.35);
  }
  .eyebrow {
    display: flex; align-items: center; gap: 14px; margin-bottom: 26px;
    color: #c2410c; font-size: 20px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  }
  .eyebrow::before { content: ""; width: 40px; height: 3px; border-radius: 3px; background: #c2410c; }
  h1 { font-family: "Playfair Display", serif; font-weight: 800; font-size: 64px; line-height: 1.08; }
  p { margin-top: 26px; color: #625d55; font-size: 27px; font-weight: 500; line-height: 1.45; }
  .url { margin-top: 40px; color: #1c1a17; font-size: 21px; font-weight: 600; letter-spacing: 0.02em; }
</style></head>
<body>
  <img src="https://i.ibb.co/SXbLSw55/1000008802.jpg" alt=""/>
  <div>
    <div class="eyebrow">Software Engineering</div>
    <h1>Magnus Forbes<br/>Kjær-Rasmussen</h1>
    <p>Full-stack developer, VIA University College student and founder of Tackly.</p>
    <div class="url">mforbeskr.github.io</div>
  </div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-image-"));
try {
  const page = path.join(tmp, "og.html");
  fs.writeFileSync(page, html);
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--user-data-dir=${path.join(tmp, "profile")}`,
    "--force-device-scale-factor=1",
    `--window-size=${WIDTH},${HEIGHT}`,
    "--virtual-time-budget=8000",
    `--screenshot=${OUT}`,
    pathToFileURL(page).href,
  ], { stdio: "ignore" });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(path.relative(REPO, OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
