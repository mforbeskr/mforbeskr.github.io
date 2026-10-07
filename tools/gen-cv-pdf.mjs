// Prints resume.html (using its print styles) to the PDF that the resume's download button serves.
// Run after changing the resume: node tools/gen-cv-pdf.mjs
// Needs Edge or Chrome; set BROWSER=/path/to/browser if neither is found in the usual place.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "assets/Magnus-Forbes-Kjaer-Rasmussen-CV.pdf");

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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cv-pdf-"));
try {
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    `--user-data-dir=${profile}`,
    "--no-pdf-header-footer",
    "--virtual-time-budget=5000",
    `--print-to-pdf=${OUT}`,
    pathToFileURL(path.join(REPO, "resume.html")).href,
  ], { stdio: "ignore" });
} finally {
  fs.rmSync(profile, { recursive: true, force: true });
}
console.log(path.relative(REPO, OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
