// Generates the layered scenery in assets/scene/ and the scene markup in index.html.
// Run from anywhere with: node tools/gen-scene.mjs   (every layer shares one 1600x900 canvas)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "assets/scene");
fs.mkdirSync(OUT, { recursive: true });

const W = 1600, H = 900;

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => +n.toFixed(1);
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function wave(r, y, amps, step = 10, x0 = -60, x1 = 1660) {
  const comps = amps.map(([a, wl]) => ({ a, k: (2 * Math.PI) / wl, p: r() * Math.PI * 2 }));
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    let yy = y;
    for (const c of comps) yy += c.a * Math.sin(c.k * x + c.p);
    pts.push([x, yy]);
  }
  return pts;
}

function displace(r, keys, rough = 0.13, depth = 6) {
  let pts = keys.slice();
  for (let d = 0; d < depth; d++) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      out.push([(ax + bx) / 2 + (r() - 0.5) * len * 0.05, (ay + by) / 2 + (r() - 0.5) * len * rough * 2]);
      out.push(pts[i]);
    }
    pts = out;
  }
  return pts;
}

const area = (pts, bottom = H + 20) =>
  `M${f(pts[0][0])},${bottom}` + pts.map((p) => `L${f(p[0])},${f(p[1])}`).join("") + `L${f(pts.at(-1)[0])},${bottom}Z`;
const line = (pts) => "M" + pts.map((p) => `${f(p[0])},${f(p[1])}`).join("L");

function yAt(pts, x) {
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] >= x) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      return ay + ((by - ay) * (x - ax)) / (bx - ax || 1);
    }
  }
  return pts.at(-1)[1];
}

function svgDoc(body, defs = "", style = "") {
  const css = style + "@media (prefers-reduced-motion:reduce){*{animation:none!important}}";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMax slice"><defs>${defs}</defs><style>${css}</style>${body}</svg>\n`;
}

function write(name, content) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log(name.padEnd(18), (content.length / 1024).toFixed(1) + " KB");
}

// ---------- Shared shapes ----------

// A pine with uneven, drooping tiers (each side grown separately, so no two trees match).
// Returns the outline, the moonlit right half (for a touch of volume) and per-tier snow caps.
function pineParts(x, base, h, w) {
  const r = rng(Math.round(x * 131 + h * 17 + base * 7));
  const T = h > 120 ? 7 : h > 40 ? 6 : 4;
  const apex = [x + (r() - 0.5) * w * 0.08, base - h];
  const tiers = [];
  const side = (s) => {
    const pts = [];
    for (let i = 1; i <= T; i++) {
      const t = i / T, yo = base - h + h * 0.9 * t + (r() - 0.5) * h * 0.02;
      const reach = w * t * (0.78 + r() * 0.4) * (i === T ? 0.92 : 1);
      pts.push([x + s * reach * 0.62, yo - h * 0.035]);
      pts.push([x + s * reach, yo + h * 0.012]);
      if (i < T) pts.push([x + s * reach * (0.28 + r() * 0.12), yo + h * 0.028]);
      tiers[i - 1] = tiers[i - 1] || { y: yo };
      tiers[i - 1][s > 0 ? "r" : "l"] = reach;
    }
    pts.push([x + s * w * 0.07, base - h * 0.06], [x + s * w * 0.07, base]);
    return pts;
  };
  const right = side(1), left = side(-1);
  const pt = (p) => `${f(p[0])},${f(p[1])}`;
  const outline = "M" + [apex, ...right, ...left.slice().reverse()].map(pt).join("L") + "Z";
  const lit = "M" + [apex, ...right, [x, base]].map(pt).join("L") + "Z";
  let snow = "";
  tiers.forEach((tier, i) => {
    const top = i === 0 ? apex[1] : tiers[i - 1].y + h * 0.02, y = tier.y;
    snow += "M" + [
      [x, top], [x + tier.r * 0.62, y - h * 0.035], [x + tier.r * 0.95, y], [x + tier.r * 0.5, y - h * 0.03],
      [x, y - h * 0.065], [x - tier.l * 0.5, y - h * 0.03], [x - tier.l * 0.95, y], [x - tier.l * 0.62, y - h * 0.035],
    ].map(pt).join("L") + "Z";
  });
  return { outline, lit, snow };
}

const pine = (x, base, h, w) => pineParts(x, base, h, w).outline;

function blade(x, base, h, w, bend) {
  return `M${f(x - w)},${f(base)}Q${f(x - w * 0.5 + bend * 0.5)},${f(base - h * 0.5)} ${f(x + bend)},${f(base - h)}Q${f(x + w * 0.5 + bend * 0.5)},${f(base - h * 0.5)} ${f(x + w)},${f(base)}Z`;
}

// Points along a chain of cubic beziers, with tangent.
function sampleBeziers(segs, n = 40) {
  const out = [];
  for (const [p0, p1, p2, p3] of segs) {
    for (let i = 0; i < n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
      const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
      const len = Math.hypot(dx, dy) || 1;
      out.push({ x, y, tx: dx / len, ty: dy / len });
    }
  }
  return out;
}

// ======================= NIGHT =======================

function curtain(r, id, x0, x1, base, arch, hBase, grad) {
  const top = [], bot = [];
  const p1 = r() * 6, p2 = r() * 6;
  for (let x = x0; x <= x1; x += 8) {
    const t = (x - x0) / (x1 - x0), env = Math.sin(t * Math.PI);
    const yb = base - arch * Math.sin(t * Math.PI) + 14 * Math.sin(x / 95 + p1) + 6 * Math.sin(x / 37 + p2);
    const h = (hBase + 50 * Math.sin(x / 160 + p2)) * (0.3 + 0.7 * env);
    bot.push([x, yb]); top.push([x, yb - h]);
  }
  const d = line(top) + "L" + bot.reverse().map((p) => `${f(p[0])},${f(p[1])}`).join("L") + "Z";
  let rays = "";
  for (let k = 0; k < 80; k++) {
    const x = x0 + r() * (x1 - x0);
    rays += `<rect x="${f(x)}" y="0" width="${f(1 + r() * 4)}" height="600" opacity="${(0.015 + r() * 0.07).toFixed(2)}"/>`;
  }
  return {
    defs: `<clipPath id="${id}"><path d="${d}"/></clipPath>`,
    body: `<path d="${d}" fill="url(#${grad})"/><g clip-path="url(#${id})" fill="#d4ffee">${rays}</g>`,
  };
}

// Aurora curtains are [x0, x1, base, arch, height]; the fjord gets a bigger, centred display.
function nightSky(file = "night-1-sky.svg", seed = 11, aurora = [[560, 1660, 300, 110, 170], [820, 1720, 225, 70, 120]], moon = true) {
  const r = rng(seed);
  let defs = `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030d"/><stop offset=".35" stop-color="#0c0823"/><stop offset=".58" stop-color="#1d1142"/><stop offset=".68" stop-color="#3b1e66"/><stop offset="1" stop-color="#26134a"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#9a52f0" stop-opacity=".5"/><stop offset="1" stop-color="#9a52f0" stop-opacity="0"/></radialGradient>
<radialGradient id="mw"><stop offset="0" stop-color="#c2b2ff" stop-opacity=".13"/><stop offset="1" stop-color="#c2b2ff" stop-opacity="0"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#e2d6ff" stop-opacity=".4"/><stop offset=".25" stop-color="#b9a0ff" stop-opacity=".14"/><stop offset="1" stop-color="#b9a0ff" stop-opacity="0"/></radialGradient>
<linearGradient id="aur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b566ff" stop-opacity="0"/><stop offset=".5" stop-color="#9a6bff" stop-opacity=".2"/><stop offset=".86" stop-color="#4dffb0" stop-opacity=".4"/><stop offset="1" stop-color="#4dffb0" stop-opacity=".06"/></linearGradient>
<linearGradient id="aur2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7ad9" stop-opacity="0"/><stop offset=".6" stop-color="#c46bff" stop-opacity=".22"/><stop offset="1" stop-color="#7f8bff" stop-opacity=".05"/></linearGradient>
<mask id="crescent"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="1446" cy="96" r="30" fill="#000"/></mask>`;
  let body = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  body += `<ellipse cx="800" cy="230" rx="950" ry="80" transform="rotate(12 800 230)" fill="url(#mw)"/>`;

  const colors = ["#ffffff", "#ece4ff", "#d8caff", "#fff1dc"];
  let stars = "", twinkles = "";
  for (let i = 0; i < 340; i++) {
    const x = r() * W, y = Math.pow(r(), 1.5) * 560;
    const s = r() < 0.9 ? 0.45 + r() * 0.8 : 1.3 + r() * 0.9;
    const op = Math.min(1, (0.35 + r() * 0.65) * (1.15 - y / 640));
    const c = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${pick(r, colors)}" opacity="${op.toFixed(2)}"`;
    if (i % 9 === 0) twinkles += c + ` class="tw" style="animation-delay:-${(r() * 4).toFixed(1)}s"/>`;
    else stars += c + "/>";
  }
  // Milky way dust along the band
  for (let i = 0; i < 260; i++) {
    const t = r(), x = -100 + t * 1800, yc = 230 + (x - 800) * Math.tan((12 * Math.PI) / 180);
    const g = (r() + r() + r() - 1.5) * 70;
    stars += `<circle cx="${f(x)}" cy="${f(yc + g)}" r="${f(0.3 + r() * 0.5)}" fill="#e6dcff" opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`;
  }
  body += stars + twinkles;

  const c1 = curtain(r, "c1", ...aurora[0], "aur");
  const c2 = curtain(r, "c2", ...aurora[1], "aur2");
  defs += c1.defs + c2.defs;
  body += `<g class="a2">${c2.body}</g><g class="a1">${c1.body}</g>`;

  if (moon) body += `<circle cx="1430" cy="104" r="190" fill="url(#halo)"/><circle cx="1430" cy="104" r="30" fill="#f3ecff" mask="url(#crescent)"/>`;
  body += `<ellipse cx="800" cy="600" rx="1050" ry="170" fill="url(#glow)"/>`;

  const style = `.tw{animation:tw 3.4s ease-in-out infinite alternate}@keyframes tw{to{opacity:.12}}.a1{animation:aur 12s ease-in-out infinite alternate}.a2{animation:aur 15s ease-in-out infinite alternate-reverse}@keyframes aur{from{opacity:.55;transform:translateX(0)}to{opacity:1;transform:translateX(-36px)}}`;
  write(file, svgDoc(body, defs, style));
}

function nightPeaks() {
  const r = rng(23);
  const back = displace(r, [[-60, 470], [140, 430], [330, 455], [520, 400], [700, 445], [880, 420], [1060, 450], [1240, 405], [1420, 440], [1660, 400]], 0.12, 6);
  const front = displace(r, [[-60, 500], [60, 450], [170, 470], [300, 415], [420, 455], [520, 430], [640, 480], [760, 462], [880, 495], [990, 440], [1100, 470], [1210, 380], [1300, 430], [1390, 345], [1480, 410], [1560, 360], [1660, 420]], 0.14, 6);
  const defs = `<linearGradient id="m" x1="0" y1="330" x2="0" y2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3d2e72"/><stop offset="1" stop-color="#1b1236"/></linearGradient>`;
  // Snow: a band hanging below the ridge wherever it rises above the snow line
  const snowTop = [], snowBot = [];
  for (const [x, y] of front) {
    const depth = Math.max(0, 440 - y) * 0.55 * (0.6 + r() * 0.5);
    snowTop.push([x, y]); snowBot.push([x, y + depth]);
  }
  const snow = line(snowTop) + "L" + snowBot.reverse().map((p) => `${f(p[0])},${f(p[1])}`).join("L") + "Z";
  const body =
    `<path d="${area(back)}" fill="#2a1d52"/>` +
    `<path d="${area(front)}" fill="url(#m)"/>` +
    `<path d="${snow}" fill="#6a5aa6" opacity=".55"/>`;
  write("night-1-peaks.svg", svgDoc(body, defs));
}

function nightForest() {
  const r = rng(37);
  const hill = wave(r, 574, [[10, 600], [5, 210]], 8);
  const p = r() * 6;
  let trees = "";
  for (let x = -40; x < 1640; x += 4 + r() * 8) {
    if (Math.sin(x / 130 + p) + Math.sin(x / 53) < -0.7) continue;
    const h = 14 + r() * 24 + 20 * Math.max(0, Math.sin(x / 210 + p));
    trees += pine(x, yAt(hill, x) + 3, h, h * 0.3);
  }
  const defs = `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6cc8" stop-opacity="0"/><stop offset=".5" stop-color="#8a6cc8" stop-opacity=".16"/><stop offset="1" stop-color="#8a6cc8" stop-opacity="0"/></linearGradient>`;
  const body = `<path d="${area(hill)}" fill="#170e2e"/><path d="${trees}" fill="#140c29"/><rect y="540" width="${W}" height="110" fill="url(#mist)"/>`;
  write("night-1-forest.svg", svgDoc(body, defs));
}

function nightMeadow() {
  const r = rng(53);
  const ground = wave(r, 598, [[3, 700], [2, 190]], 10);
  const shore = 680;
  const defs = `
<linearGradient id="g" x1="0" y1="598" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c1236"/><stop offset="1" stop-color="#0b0716"/></linearGradient>
<linearGradient id="w" x1="0" y1="598" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5a3a8e"/><stop offset=".3" stop-color="#2c1b50"/><stop offset="1" stop-color="#170e2c"/></linearGradient>
<linearGradient id="lake" x1="0" y1="${shore - 6}" x2="0" y2="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5d3d93"/><stop offset=".45" stop-color="#2f1d57"/><stop offset="1" stop-color="#1a1034"/></linearGradient>
<radialGradient id="sheen"><stop offset="0" stop-color="#c9a6ff" stop-opacity=".35"/><stop offset="1" stop-color="#c9a6ff" stop-opacity="0"/></radialGradient>
<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6cc8" stop-opacity="0"/><stop offset=".55" stop-color="#8a6cc8" stop-opacity=".14"/><stop offset="1" stop-color="#8a6cc8" stop-opacity="0"/></linearGradient>`;
  let body = `<path d="${area(ground)}" fill="url(#g)"/>`;

  // Danish hedgerows ("levende hegn") along the horizon
  let bushes = "";
  for (let k = 0; k < 9; k++) {
    let x = r() * W; const len = 60 + r() * 220;
    for (const end = x + len; x < end; x += 3 + r() * 5) {
      const rr = 2.5 + r() * 4;
      bushes += `<circle cx="${f(x)}" cy="${f(yAt(ground, x) - rr * 0.5 + 2)}" r="${f(rr)}"/>`;
    }
  }
  body += `<g fill="#0f0921">${bushes}</g>`;

  // The stream winds down from the horizon and runs into the lake
  const pts = sampleBeziers([
    [[905, 600], [880, 616], [990, 628], [968, 648]],
    [[968, 648], [945, 668], [860, 664], [872, shore + 6]],
  ]);
  const L = [], R = [];
  for (const p of pts) {
    const w = 1.5 + Math.max(0, p.y - 598) * 0.3;
    L.push([p.x - p.ty * w, p.y + p.tx * w]); R.push([p.x + p.ty * w, p.y - p.tx * w]);
  }
  body += `<path d="${line(L) + "L" + R.reverse().map((q) => `${f(q[0])},${f(q[1])}`).join("L") + "Z"}" fill="url(#w)"/>`;

  // Forest: rows of pines, small at the back and taller towards the viewer, on both sides of the lake
  const grove = (x0, x1, rows, seedShift) => {
    let back = "", front = "", lit = "";
    for (let row = 0; row < rows; row++) {
      const base = 628 + row * 13, tall = 34 + row * 20;
      for (let x = x0 + (row % 2) * 9 + seedShift; x < x1; x += 14 + r() * 24) {
        if (r() < 0.12) continue; // little gaps between the trees
        const h = tall * (0.6 + r() * 0.7) * (r() < 0.12 ? 1.45 : 1);
        const p = pineParts(x, base + r() * 6, h, h * (0.22 + r() * 0.14));
        if (row < rows - 2) back += p.outline; else { front += p.outline; lit += p.lit; }
      }
    }
    return { back, front, lit };
  };
  const right = grove(1010, 1660, 5, 0), left = grove(-60, 470, 4, 4);
  const trees = `<path d="${right.back + left.back}" fill="#1a1033"/><rect y="${shore - 60}" width="${W}" height="70" fill="url(#mist)"/><path d="${right.front + left.front}" fill="#0e0821"/><path d="${right.lit + left.lit}" fill="#9d86e6" opacity=".18"/>`;
  body += `<g id="trees">${trees}</g>` + `<rect y="${shore - 70}" width="${W}" height="110" fill="url(#mist)"/>`;

  // The lake, with the forest and sky mirrored in it
  const lake = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2, wob = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.04 * Math.sin(a * 7);
    lake.push([880 + Math.cos(a) * 250 * wob, shore + 34 + Math.sin(a) * 36 * wob]);
  }
  const lakeD = line(lake) + "Z";
  let glints = "";
  for (let i = 0; i < 46; i++) {
    const x = 660 + r() * 440, y = shore + 4 + r() * 62, len = 3 + r() * 16;
    glints += `<rect x="${f(x)}" y="${f(y)}" width="${f(len)}" height="1" opacity="${(0.12 + r() * 0.4).toFixed(2)}"/>`;
  }
  body +=
    `<clipPath id="lk"><path d="${lakeD}"/></clipPath>` +
    `<path d="${lakeD}" fill="url(#lake)"/>` +
    `<g clip-path="url(#lk)"><g transform="translate(0 ${2 * shore + 8}) scale(1 -1)" opacity=".55"><use href="#trees"/></g>` +
    `<ellipse cx="900" cy="${shore + 22}" rx="200" ry="26" fill="url(#sheen)"/><g fill="#efe4ff">${glints}</g></g>` +
    `<path d="${line(lake.slice(26, 47))}" stroke="#0d0819" stroke-width="3" fill="none" opacity=".7"/>`;

  // Reeds around the shore
  let reeds = "";
  for (let i = 0; i < lake.length; i++) {
    if (r() < 0.35 || lake[i][1] < shore + 20) continue;
    const [bx, by] = lake[i], s = 0.9 + (by - shore) * 0.03;
    for (let k = 0; k < 6; k++) reeds += blade(bx + (r() - 0.5) * 10, by + 2, (7 + r() * 10) * s, 0.5 * s, (r() - 0.5) * 6);
  }
  body += `<path d="${reeds}" fill="#0b0716"/>`;
  write("night-1-meadow.svg", svgDoc(body, defs));
}

function nightFront() {
  const r = rng(71);
  const p = r() * 6;
  let back = "", front = "";
  for (let x = -20; x < 1620; x += 2.2 + r() * 1.6) {
    const edge = Math.max(0, Math.abs(x - 800) / 800 - 0.55) * 120;
    let h = 24 + 34 * (0.5 + 0.5 * Math.sin(x / 70 + p)) + r() * 30 + edge;
    if (x > 590 && x < 690) h *= 0.55;
    const bend = (r() - 0.5) * 22 + 8 * Math.sin(x / 80);
    back += blade(x + 1, 892, h * 1.15, 1.6, bend * 1.2);
    front += blade(x, 900, h * 0.8, 1.9, bend);
  }
  // Cattails by the stream mouth
  let tails = "";
  for (let i = 0; i < 12; i++) {
    const x = 890 + r() * 260 + (i > 8 ? 380 : 0), top = 730 + r() * 60, lean = (r() - 0.5) * 18;
    tails += `<path d="M${f(x)},900Q${f(x + lean * 0.4)},${f((900 + top) / 2)} ${f(x + lean)},${f(top)}" stroke="#08050f" stroke-width="2" fill="none"/>`;
    tails += `<rect x="${f(x + lean - 3.2)}" y="${f(top + 6)}" width="6.4" height="26" rx="3.2" fill="#08050f"/>`;
    front += blade(x + 3, 900, (900 - top) * 0.8, 2.2, lean * 2 + 14);
  }
  // Dark shrubs framing the corners
  let shrubs = "";
  for (let i = 0; i < 40; i++) {
    const left = i < 20, cx = left ? r() * 150 - 20 : 1470 + r() * 160, cy = 900 - r() * (left ? 120 : 150);
    shrubs += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(16 + r() * 26)}"/>`;
  }
  const body =
    `<path d="${back}" fill="#100b1f"/>` +
    `<g fill="#06040c">${shrubs}</g>${tails}` +
    `<path d="${front}" fill="#06040c"/><rect y="890" width="${W}" height="10" fill="#06040c"/>`;
  write("night-1-front.svg", svgDoc(body));
}

// ======================= DAY =======================

function cloud(r, cx, cy, s) {
  let c = "", shade = "";
  for (let i = 0; i < 7; i++) {
    const x = cx + (r() - 0.5) * 140 * s, y = cy - r() * 26 * s, rr = (18 + r() * 26) * s;
    c += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}"/>`;
    shade += `<circle cx="${f(x + 4)}" cy="${f(y + 6)}" r="${f(rr)}"/>`;
  }
  return `<g clip-path="url(#flat${Math.round(cy)})"><g fill="#f0e2d0">${shade}</g><g fill="#fffdf8">${c}</g></g>`;
}

function daySky() {
  const r = rng(101);
  let defs = `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8d6e2"/><stop offset=".26" stop-color="#dde9e6"/><stop offset=".42" stop-color="#f7e4c4"/><stop offset="1" stop-color="#f3d3a8"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff3c8" stop-opacity=".95"/><stop offset=".2" stop-color="#ffdf99" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`;
  let body = `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="1390" cy="150" r="330" fill="url(#sun)"/><circle cx="1390" cy="150" r="48" fill="#fffaf0"/>`;
  let clouds = "";
  for (const [cx, cy, s] of [[260, 120, 1], [760, 70, 0.75], [1080, 190, 0.9], [1560, 250, 0.7], [-60, 230, 0.8]]) {
    defs += `<clipPath id="flat${cy}"><rect x="-200" y="0" width="2000" height="${cy + 14 * s}"/></clipPath>`;
    clouds += cloud(r, cx, cy, s);
  }
  body += `<g class="drift" opacity=".9">${clouds}</g>`;
  const style = `.drift{animation:drift 90s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(60px)}}`;
  write("day-1-sky.svg", svgDoc(body, defs, style));
}

function daySierra() {
  const r = rng(113);
  const back = displace(r, [[-60, 330], [120, 300], [260, 318], [420, 268], [580, 310], [760, 288], [940, 320], [1120, 280], [1300, 305], [1480, 258], [1660, 300]], 0.1, 6);
  const front = displace(r, [[-60, 370], [200, 345], [380, 362], [560, 335], [800, 360], [1000, 338], [1180, 362], [1400, 330], [1660, 360]], 0.08, 6);
  const defs = `<linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e6c9" stop-opacity="0"/><stop offset="1" stop-color="#f8e6c9" stop-opacity=".75"/></linearGradient>`;
  const body = `<path d="${area(back)}" fill="#e5d0c3"/><path d="${area(front)}" fill="#dcc0ab"/><rect y="320" width="${W}" height="110" fill="url(#hz)"/>`;
  write("day-1-sierra.svg", svgDoc(body, defs));
}

function house(r, x, base, w, h) {
  const shade = w * 0.32;
  let s = `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="#fcf7ee"/>`;
  s += `<rect x="${f(x + w - shade)}" y="${f(base - h)}" width="${f(shade)}" height="${f(h)}" fill="#ece1cf"/>`;
  s += `<rect x="${f(x - 1.5)}" y="${f(base - h - 4)}" width="${f(w + 3)}" height="4.5" fill="#c9714c"/>`;
  for (let i = 0; i < Math.floor(w / 9); i++) if (r() < 0.6) s += `<rect x="${f(x + 3 + i * 9)}" y="${f(base - h + 5 + r() * 4)}" width="3" height="4" fill="#8f7058"/>`;
  return s;
}

function dayHills() {
  const r = rng(127);
  const fold1 = wave(r, 402, [[16, 800], [7, 260]], 8);
  const fold2 = wave(r, 452, [[14, 640], [6, 200]], 8);
  let body = `<path d="${area(fold1)}" fill="#e8c99f"/>`;
  const grove = (fold, rows, from, to) => {
    let s = "";
    for (let j = 0; j < rows; j++)
      for (let x = from; x < to; x += 13 + r() * 4) {
        if (r() < 0.3) continue;
        s += `<circle cx="${f(x + j * 3)}" cy="${f(yAt(fold, x) + 9 + j * 7)}" r="${f(2 + r() * 1.2)}"/>`;
      }
    return `<g fill="#a7a873">${s}</g>`;
  };
  body += grove(fold1, 5, 260, 1240);
  // A white pueblo on the hill, with a church tower
  const homes = [];
  for (let i = 0; i < 16; i++) {
    const x = 1340 + r() * 230, w = 16 + r() * 18, h = 12 + r() * 12;
    homes.push([x, yAt(fold1, x) + 4 + r() * 30, w, h]);
  }
  for (let i = 0; i < 6; i++) {
    const x = 10 + r() * 170, w = 14 + r() * 16, h = 10 + r() * 10;
    homes.push([x, yAt(fold1, x) + 6 + r() * 26, w, h]);
  }
  homes.sort((a, b) => a[1] - b[1]);
  const ty = yAt(fold1, 1462) + 8;
  body += `<rect x="1456" y="${f(ty - 58)}" width="15" height="58" fill="#fbf5ea"/><rect x="1466" y="${f(ty - 58)}" width="5" height="58" fill="#ebdfcc"/><path d="M1454,${f(ty - 58)}L1463.5,${f(ty - 72)}L1473,${f(ty - 58)}Z" fill="#c9714c"/><rect x="1460.5" y="${f(ty - 50)}" width="5" height="8" rx="2.5" fill="#8f7058"/>`;
  for (const [x, b, w, h] of homes) body += house(r, x, b, w, h);
  for (const cx of [1320, 1332, 1600, 220, 1210]) {
    const cy = yAt(fold1, cx);
    body += `<ellipse cx="${cx}" cy="${f(cy - 12)}" rx="4.5" ry="20" fill="#86915a"/>`;
  }
  body += `<path d="${area(fold2)}" fill="#e3bd8f"/>`;
  body += grove(fold2, 6, -20, 700);
  write("day-1-hills.svg", svgDoc(body));
}

function palm(r, bx, base, height, lean) {
  const tx = bx + lean, ty = base - height, cx = bx + lean * 0.15, cy = base - height * 0.55;
  // Tapered trunk from two offset quadratics
  const trunk = `M${bx - 9},${base}Q${cx - 6},${f(cy)} ${tx - 4},${ty}L${tx + 4},${ty}Q${cx + 6},${f(cy)} ${bx + 9},${base}Z`;
  let rings = "";
  for (let t = 0.05; t < 0.97; t += 0.035) {
    const u = 1 - t, x = u * u * bx + 2 * u * t * cx + t * t * tx, y = u * u * base + 2 * u * t * cy + t * t * ty, w = 9 - 5 * t;
    rings += `M${f(x - w)},${f(y)}l${f(w * 2)},${f(-1.5)}`;
  }
  let s = `<path d="${trunk}" fill="#a8845c"/><path d="${rings}" stroke="#8a6a47" stroke-width="1.3" fill="none"/>`;
  const frond = (a, len, color) => {
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len + len * 0.42;
    const qx = tx + Math.cos(a) * len * 0.55, qy = ty + Math.sin(a) * len * 0.55 - len * 0.05;
    let d = `M${tx},${ty}Q${f(qx)},${f(qy)} ${f(ex)},${f(ey)}`;
    for (let t = 0.12; t < 0.98; t += 0.055) {
      const u = 1 - t;
      const px = u * u * tx + 2 * u * t * qx + t * t * ex, py = u * u * ty + 2 * u * t * qy + t * t * ey;
      let dx = 2 * u * (qx - tx) + 2 * t * (ex - qx), dy = 2 * u * (qy - ty) + 2 * t * (ey - qy);
      const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      const lf = 30 * (1 - t * 0.65);
      for (const side of [-1, 1]) d += `M${f(px)},${f(py)}l${f((-dy * side + dx * 0.7) * lf)},${f((dx * side + dy * 0.7) * lf + lf * 0.35)}`;
    }
    return `<path d="${d}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
  };
  const angles = [-3.0, -2.6, -2.15, -1.75, -1.35, -0.95, -0.5, -0.1, 0.25, 2.9];
  let back = "", front = "";
  angles.forEach((a, i) => {
    const len = 100 + r() * 40;
    if (i % 2) back += frond(a + (r() - 0.5) * 0.15, len * 0.9, "#4a7039");
    else front += frond(a + (r() - 0.5) * 0.15, len, "#5d8a4a");
  });
  s += back + `<g fill="#6e5232"><circle cx="${tx - 5}" cy="${ty + 6}" r="5"/><circle cx="${tx + 4}" cy="${ty + 7}" r="5"/><circle cx="${tx}" cy="${ty + 12}" r="4.6"/></g>` + front;
  return s;
}

function leaf(x, y, a, len, wid, fill, vein) {
  const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const nx = -Math.sin(a), ny = Math.cos(a);
  const mx = (x + ex) / 2, my = (y + ey) / 2;
  let d = `M${f(x)},${f(y)}Q${f(mx + nx * wid)},${f(my + ny * wid)} ${f(ex)},${f(ey)}Q${f(mx - nx * wid)},${f(my - ny * wid)} ${f(x)},${f(y)}Z`;
  let v = `M${f(x)},${f(y)}L${f(ex)},${f(ey)}`;
  if (vein) for (let t = 0.15; t < 0.9; t += 0.1) {
    const px = x + (ex - x) * t, py = y + (ey - y) * t, w = wid * 0.45 * Math.sin(t * Math.PI);
    v += `M${f(px)},${f(py)}l${f(nx * w + Math.cos(a) * w * 0.4)},${f(ny * w + Math.sin(a) * w * 0.4)}M${f(px)},${f(py)}l${f(-nx * w + Math.cos(a) * w * 0.4)},${f(-ny * w + Math.sin(a) * w * 0.4)}`;
  }
  return `<path d="${d}" fill="${fill}"/><path d="${v}" stroke="${vein || "#ffffff"}" stroke-opacity=".45" stroke-width="1.2" fill="none"/>`;
}

function dayGarden() {
  const r = rng(149);
  const ground = wave(r, 600, [[5, 700], [3, 180]], 10);
  const defs = `<linearGradient id="g" x1="0" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e9cfa3"/><stop offset="1" stop-color="#f0dbb6"/></linearGradient>`;
  let body = `<path d="${area(ground)}" fill="url(#g)"/>`;

  // Mango tree
  body += `<path d="M168,800C172,740 160,690 150,640M170,760C190,700 220,670 250,640M165,720C140,690 110,670 90,650" stroke="#7a5a3c" stroke-width="12" stroke-linecap="round" fill="none"/>`;
  let crown = "", fruit = "";
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const cx = 175 + Math.cos(a) * d * 150, cy = 600 + Math.sin(a) * d * 85, rr = 18 + r() * 18;
    crown += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="${cy < 590 && cx > 170 ? "#689650" : pick(r, ["#47703f", "#527d47", "#5c8a4c"])}"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const cx = 60 + r() * 240, cy = 610 + r() * 60;
    fruit += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="5.5" ry="7.5" fill="#f2aa3c"/><ellipse cx="${f(cx + 1.8)}" cy="${f(cy - 2)}" rx="3" ry="4.5" fill="#e3653a" opacity=".85"/>`;
  }
  body += crown + fruit;

  body += palm(r, 1560, 780, 470, 30);

  // Banana plant
  let banana = `<path d="M1290,790Q1286,720 1298,660M1305,790Q1312,730 1322,680M1280,790Q1262,740 1262,700" stroke="#7aa356" stroke-width="9" stroke-linecap="round" fill="none"/>`;
  for (const [a, len] of [[-2.5, 150], [-2.0, 170], [-1.55, 160], [-1.1, 165], [-0.6, 150], [2.7, 120], [0.3, 120]])
    banana += leaf(1300, 665, a + (r() - 0.5) * 0.1, len, 26, a > 0 || a < -2.4 ? "#6f9a4f" : "#7fae5a", "#c6e39a");
  banana += `<g fill="#a6b84a"><path d="M1336,700q8,6 4,16q-8,-4 -4,-16Z"/><path d="M1344,702q8,6 4,16q-8,-4 -4,-16Z"/><path d="M1340,714q8,6 4,16q-8,-4 -4,-16Z"/></g><path d="M1340,690Q1352,720 1348,740" stroke="#7aa356" stroke-width="3" fill="none"/><ellipse cx="1348" cy="748" rx="6" ry="10" fill="#6b2a4a"/>`;
  body += banana;

  // Whitewashed wall with bougainvillea
  body += `<rect x="780" y="652" width="460" height="78" fill="#f8f2e7"/><rect x="780" y="712" width="460" height="18" fill="#ece1cf"/>`;
  let cap = `<rect x="774" y="642" width="472" height="12" fill="#c46a45"/>`;
  for (let x = 778; x < 1244; x += 10) cap += `<circle cx="${x + 5}" cy="644" r="5" fill="#d27c53"/>`;
  body += cap;
  let flowers = "";
  for (const [x0, x1, drop] of [[780, 900, 70], [1110, 1240, 50]])
    for (let i = 0; i < 170; i++) {
      const x = x0 + r() * (x1 - x0), y = 630 + Math.pow(r(), 1.6) * drop * (1 - Math.abs((x - (x0 + x1) / 2) / ((x1 - x0) / 2)) * 0.5);
      flowers += r() < 0.28
        ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="4" ry="2.4" fill="#5d8a4b" transform="rotate(${Math.round(r() * 180)} ${f(x)} ${f(y)})"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.5 + r() * 3.5)}" fill="${pick(r, ["#ff6a1a", "#f97316", "#ff8a3d", "#e8590c", "#ffa05c", "#e2445c"])}"/>`;
    }
  body += flowers;

  body += palm(r, 1470, 770, 570, -70);
  body += palm(r, 100, 790, 520, 80);
  write("day-1-garden.svg", svgDoc(body, defs));
}

function aloe(r, x, base, size, tones, spike) {
  let s = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI + 0.25 + (i / (n - 1)) * (Math.PI - 0.5) + (r() - 0.5) * 0.12;
    const len = size * (0.75 + r() * 0.35) * (1 - Math.abs(i - (n - 1) / 2) / n * 0.6);
    const wid = size * 0.12;
    const ex = x + Math.cos(a) * len, ey = base + Math.sin(a) * len * 0.95 + len * 0.12;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const d = `M${f(x + nx * wid)},${f(base + ny * wid * 0.3)}Q${f(x + Math.cos(a) * len * 0.5 + nx * wid)},${f(base + Math.sin(a) * len * 0.5 + ny * wid)} ${f(ex)},${f(ey)}Q${f(x + Math.cos(a) * len * 0.5 - nx * wid * 0.6)},${f(base + Math.sin(a) * len * 0.5 - ny * wid * 0.6)} ${f(x - nx * wid)},${f(base - ny * wid * 0.3)}Z`;
    s += `<path d="${d}" fill="${tones[i % 2]}"/>`;
    if (spike) s += `<circle cx="${f(ex)}" cy="${f(ey)}" r="1.6" fill="${spike}"/>`;
    else for (let k = 0; k < 4; k++) {
      const t = 0.2 + r() * 0.55;
      s += `<ellipse cx="${f(x + Math.cos(a) * len * t)}" cy="${f(base + Math.sin(a) * len * t)}" rx="1.6" ry="1" fill="#d5e6c8" opacity=".8"/>`;
    }
  }
  return s;
}

function dayFront() {
  const r = rng(167);
  const ground = wave(r, 852, [[4, 500], [2, 150]], 10);
  let body = `<path d="${area(ground)}" fill="#f4e5ca"/>`;
  for (let i = 0; i < 30; i++) body += `<ellipse cx="${f(r() * W)}" cy="${f(868 + r() * 28)}" rx="${f(3 + r() * 7)}" ry="${f(2 + r() * 3)}" fill="${pick(r, ["#e4d0ad", "#dcc6a0", "#eadbbd"])}"/>`;
  let tufts = "";
  for (let i = 0; i < 26; i++) {
    const x = r() * W, b = 880 + r() * 18;
    for (let k = 0; k < 7; k++) tufts += blade(x + (r() - 0.5) * 12, b, 14 + r() * 22, 1.1, (r() - 0.5) * 18);
  }
  body += `<path d="${tufts}" fill="#cfae78"/>`;
  body += aloe(r, 60, 892, 120, ["#86ac83", "#97bc92"]);
  body += aloe(r, 420, 896, 80, ["#86ac83", "#97bc92"]);
  body += aloe(r, 1240, 892, 96, ["#86ac83", "#97bc92"]);
  body += aloe(r, 1460, 900, 150, ["#9cb7ad", "#acc5bb"], "#5d4a3a");
  body += aloe(r, 1590, 896, 90, ["#86ac83", "#97bc92"]);
  // Terracotta pot with an aloe in it
  body += aloe(r, 700, 838, 70, ["#7fa67c", "#94bb8f"]);
  body += `<path d="M672,836L728,836L720,894L680,894Z" fill="#c46a45"/><rect x="666" y="830" width="68" height="10" rx="3" fill="#d6845b"/><path d="M712,840L720,840L713,894L706,894Z" fill="#b25e3c"/><ellipse cx="702" cy="896" rx="36" ry="5" fill="#000" opacity=".1"/>`;
  write("day-1-front.svg", svgDoc(body));
}

// ======================= NIGHT 2: FJORD =======================

const FJORD_WATER = 574;

// Both cliff walls, shared by the cliff layer and their reflection in the water.
function fjordWalls() {
  const r = rng(307);
  const left = displace(r, [[-60, 110], [60, 130], [140, 175], [200, 190], [260, 260], [330, 300], [390, 380], [440, 420], [500, 500], [560, FJORD_WATER + 4]], 0.22, 5);
  const right = displace(r, [[1040, FJORD_WATER + 4], [1100, 500], [1150, 455], [1210, 380], [1270, 340], [1340, 270], [1410, 230], [1480, 180], [1560, 150], [1660, 125]], 0.22, 5);
  const wall = (pts, closeX) => line(pts) + `L${closeX},${H + 20}L${pts[0][0]},${H + 20}Z`;
  return { left, right, leftD: wall(left, 560), rightD: line(right) + `L1660,${H + 20}L1040,${H + 20}Z` };
}

function nightFjord() {
  nightSky("night-2-sky.svg", 211, [[260, 1380, 330, 150, 210], [460, 1240, 240, 90, 140]], false);

  // The far mountains at the end of the fjord
  let r = rng(311);
  const far = displace(r, [[380, 560], [480, 500], [600, 470], [700, 505], [800, 455], [900, 495], [1000, 465], [1120, 520], [1220, 560]], 0.12, 6);
  const snowTop = [], snowBot = [];
  for (const [x, y] of far) { snowTop.push([x, y]); snowBot.push([x, y + Math.max(0, 500 - y) * 0.6]); }
  write("night-2-far.svg", svgDoc(
    `<path d="${area(far)}" fill="#2d2058"/><path d="${line(snowTop) + "L" + snowBot.reverse().map((p) => `${f(p[0])},${f(p[1])}`).join("L")}Z" fill="#6a5aa6" opacity=".5"/>`
  ));

  // The cliff walls, moonlit along their edges, with a waterfall on the right
  r = rng(313);
  const walls = fjordWalls();
  let streaks = "";
  for (let i = 0; i < 120; i++) {
    const x = r() * W, y = 100 + r() * 500;
    streaks += `<path d="M${f(x)},${f(y)}l${f((r() - 0.5) * 8)},${f(30 + r() * 70)}"/>`;
  }
  let snow = "";
  for (const pts of [walls.left, walls.right]) {
    for (let i = 2; i < pts.length - 2; i += 3) {
      if (pts[i][1] > 430 || r() < 0.4) continue;
      const [x, y] = pts[i];
      snow += `<path d="M${f(x - 10)},${f(y + 1)}L${f(x + 12)},${f(y + 2)}L${f(x + 4)},${f(y + 10 + r() * 14)}Z"/>`;
    }
  }
  let trees = "";
  for (const [x0, x1] of [[300, 560], [1040, 1250]]) {
    for (let x = x0; x < x1; x += 6 + r() * 9) {
      const pts = x < 800 ? walls.left : walls.right, top = yAt(pts, x);
      if (top > FJORD_WATER - 8) continue;
      const h = 10 + r() * 16;
      trees += pine(x, top + 4 + r() * 18, h, h * 0.3);
    }
  }
  const fy = yAt(walls.right, 1318) + 3;
  const fall = `M1318,${f(fy)}C1316,${f(fy + 70)} 1312,${f((fy + FJORD_WATER) / 2)} 1316,${f(FJORD_WATER - 90)}S1322,${FJORD_WATER - 30} 1320,${FJORD_WATER + 2}`;
  const defs = `<linearGradient id="cl" x1="0" y1="120" x2="0" y2="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1d1338"/><stop offset="1" stop-color="#0e0820"/></linearGradient>
<linearGradient id="fall" x1="0" y1="${f(fy)}" x2="0" y2="576" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e6dcff" stop-opacity=".2"/><stop offset=".5" stop-color="#e6dcff" stop-opacity=".55"/><stop offset="1" stop-color="#e6dcff" stop-opacity=".25"/></linearGradient>
<clipPath id="walls"><path d="${walls.leftD}"/><path d="${walls.rightD}"/></clipPath>
<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6cc8" stop-opacity="0"/><stop offset=".6" stop-color="#8a6cc8" stop-opacity=".16"/><stop offset="1" stop-color="#8a6cc8" stop-opacity="0"/></linearGradient>`;
  const style = `.fall{stroke-dasharray:5 11;animation:fall 1.6s linear infinite}@keyframes fall{to{stroke-dashoffset:-32}}`;
  write("night-2-cliffs.svg", svgDoc(
    `<path d="${walls.leftD}" fill="url(#cl)"/><path d="${walls.rightD}" fill="url(#cl)"/>` +
    `<g clip-path="url(#walls)" stroke="#a48ae0" stroke-width="1.2" opacity=".08" fill="none">${streaks}</g>` +
    `<path d="${line(walls.left)}" stroke="#8f78d0" stroke-width="2" fill="none" opacity=".35"/><path d="${line(walls.right)}" stroke="#8f78d0" stroke-width="2" fill="none" opacity=".35"/>` +
    `<g fill="#7d6cb8" opacity=".55">${snow}</g><path d="${trees}" fill="#0b0619"/>` +
    `<path d="${fall}" stroke="url(#fall)" stroke-width="5" fill="none"/><path class="fall" d="${fall}" stroke="#f3eeff" stroke-width="2" fill="none" opacity=".5"/>` +
    `<ellipse cx="1320" cy="${FJORD_WATER + 2}" rx="22" ry="5" fill="#e6dcff" opacity=".18"/>` +
    `<rect y="${FJORD_WATER - 70}" width="${W}" height="100" fill="url(#mist)"/>`,
    defs, style
  ));

  // The water mirrors the walls and the aurora
  r = rng(317);
  const mirror = `translate(0 ${2 * FJORD_WATER}) scale(1 -1)`;
  let glints = "";
  for (let i = 0; i < 90; i++) {
    const y = FJORD_WATER + 4 + Math.pow(r(), 1.4) * 320, x = r() * W, len = 4 + (y - FJORD_WATER) * 0.12 * r();
    glints += `<rect x="${f(x)}" y="${f(y)}" width="${f(len)}" height="1" opacity="${(0.08 + r() * 0.3).toFixed(2)}"/>`;
  }
  const wdefs = `<linearGradient id="wt" x1="0" y1="${FJORD_WATER}" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3c2868"/><stop offset=".4" stop-color="#1d1340"/><stop offset="1" stop-color="#0d0820"/></linearGradient>
<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4dffb0" stop-opacity=".22"/><stop offset=".6" stop-color="#9a6bff" stop-opacity=".1"/><stop offset="1" stop-color="#9a6bff" stop-opacity="0"/></linearGradient>`;
  write("night-2-water.svg", svgDoc(
    `<rect y="${FJORD_WATER}" width="${W}" height="${H - FJORD_WATER + 20}" fill="url(#wt)"/>` +
    `<rect x="380" y="${FJORD_WATER + 4}" width="840" height="200" fill="url(#ar)"/>` +
    `<clipPath id="wa"><rect y="${FJORD_WATER}" width="${W}" height="${H}"/></clipPath>` +
    `<g clip-path="url(#wa)"><g transform="${mirror}" fill="#0a0618" opacity=".75"><path d="${walls.leftD}"/><path d="${walls.rightD}"/></g></g>` +
    `<g fill="#efe4ff">${glints}</g>`,
    wdefs
  ));

  // Foreground: a rocky shore with tall pines framing both sides
  r = rng(331);
  let rocks = "", pines = "";
  for (let i = 0; i < 26; i++) {
    const left = i < 13, x = left ? r() * 380 : 1240 + r() * 380;
    rocks += `<ellipse cx="${f(x)}" cy="${f(890 - r() * 40)}" rx="${f(26 + r() * 50)}" ry="${f(14 + r() * 22)}"/>`;
  }
  let lit = "";
  for (const [x, h] of [[40, 420], [130, 330], [210, 250], [1420, 280], [1500, 380], [1585, 450]]) {
    const p = pineParts(x, 905, h, h * 0.26);
    pines += p.outline; lit += p.lit;
  }
  write("night-2-front.svg", svgDoc(`<g fill="#06040c">${rocks}<path d="${pines}"/></g><path d="${lit}" fill="#9a82e0" opacity=".1"/>`));
}

// ======================= NIGHT 3: SNOWY FOREST =======================

function snowPine(x, base, h, w) {
  const p = pineParts(x, base, h, w);
  return { tree: p.outline, snow: p.snow };
}

function nightSnow() {
  let r = rng(401);
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090a1d"/><stop offset=".4" stop-color="#17163a"/><stop offset=".66" stop-color="#3a3468"/><stop offset="1" stop-color="#2a2550"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#e9e2ff" stop-opacity=".5"/><stop offset=".3" stop-color="#b4a4f0" stop-opacity=".16"/><stop offset="1" stop-color="#b4a4f0" stop-opacity="0"/></radialGradient>`;
  let stars = "";
  for (let i = 0; i < 90; i++) stars += `<circle cx="${f(r() * W)}" cy="${f(Math.pow(r(), 1.6) * 420)}" r="${f(0.4 + r() * 0.8)}" fill="#e9e2ff" opacity="${(0.15 + r() * 0.45).toFixed(2)}"/>`;
  let haze = "";
  for (let i = 0; i < 5; i++) haze += `<ellipse cx="${f(r() * W)}" cy="${f(120 + r() * 300)}" rx="${f(300 + r() * 300)}" ry="${f(18 + r() * 20)}" fill="#c9bfff" opacity=".05"/>`;
  write("night-3-sky.svg", svgDoc(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>${stars}<circle cx="1150" cy="200" r="260" fill="url(#halo)"/><circle cx="1150" cy="200" r="44" fill="#f2eeff"/><circle cx="1138" cy="190" r="9" fill="#ddd5f5" opacity=".6"/><circle cx="1165" cy="214" r="6" fill="#ddd5f5" opacity=".5"/>${haze}`,
    defs
  ));

  r = rng(409);
  const hills = wave(r, 560, [[26, 700], [10, 230]], 8);
  let line1 = "";
  for (let x = -40; x < 1640; x += 3 + r() * 5) {
    const h = 6 + r() * 9;
    line1 += pine(x, yAt(hills, x) + 3, h, h * 0.3);
  }
  write("night-3-hills.svg", svgDoc(`<path d="${area(hills)}" fill="#4b4579"/><path d="${line1}" fill="#2a2550"/>`));

  // The woods: moonlit snow ground with rows of snow-laden pines and a trail of footprints
  r = rng(419);
  const ground = wave(r, 612, [[6, 640], [3, 190]], 10);
  let trees = "", caps = "";
  for (let row = 0; row < 3; row++) {
    const base = 616 + row * 18, tall = 40 + row * 26;
    for (let x = -40 + row * 11; x < 1640; x += 14 + r() * 18) {
      if (x > 640 && x < 960 && row > 0) continue; // a clearing in the middle
      const h = tall * (0.75 + r() * 0.5), p = snowPine(x, base + r() * 6, h, h * 0.3);
      trees += p.tree; caps += p.snow;
    }
  }
  let prints = "";
  for (let i = 0; i < 26; i++) {
    const t = i / 26, y = 640 + t * t * 260, x = 800 + Math.sin(t * 5) * 60 * t, s = 0.6 + t * 2.4;
    prints += `<ellipse cx="${f(x + (i % 2 ? 5 : -5) * s)}" cy="${f(y)}" rx="${f(1.6 * s)}" ry="${f(0.8 * s)}"/>`;
  }
  const gdefs = `<linearGradient id="g" x1="0" y1="610" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8d86bc"/><stop offset="1" stop-color="#4a4478"/></linearGradient>`;
  write("night-3-woods.svg", svgDoc(
    `<path d="${area(ground)}" fill="url(#g)"/><g fill="#3a3466" opacity=".55">${prints}</g><path d="${trees}" fill="#16122e"/><path d="${caps}" fill="#d9d3f2" opacity=".85"/>`,
    gdefs
  ));

  // Big snowy pines close by on both sides
  r = rng(421);
  let big = "", bigCaps = "";
  for (const [x, h] of [[60, 470], [190, 360], [300, 250], [1330, 280], [1450, 400], [1570, 500]]) {
    const p = snowPine(x, 840 + r() * 30, h, h * 0.3);
    big += p.tree; bigCaps += p.snow;
  }
  write("night-3-grove.svg", svgDoc(`<path d="${big}" fill="#110e24"/><path d="${bigCaps}" fill="#cfc8ec" opacity=".8"/>`));

  // Foreground drifts
  r = rng(431);
  const drift = wave(r, 860, [[14, 520], [6, 170]], 10);
  write("night-3-front.svg", svgDoc(
    `<path d="${area(drift)}" fill="#5b5490"/><path d="${area(drift.map(([x, y]) => [x, y + 16]))}" fill="#3c3668"/>`
  ));
}

// ======================= DAY 2: ANDALUSIAN OLIVE GROVES =======================

function oliveTree(r, x, base, s) {
  // A gnarled trunk under a silvery, lumpy crown, with its shadow on the soil
  let t = `<ellipse cx="${f(x + 6 * s)}" cy="${f(base + 1)}" rx="${f(26 * s)}" ry="${f(5 * s)}" fill="#a86a3f" opacity=".35"/>`;
  t += `<path d="M${f(x - 4 * s)},${f(base)}C${f(x - 6 * s)},${f(base - 12 * s)} ${f(x + 4 * s)},${f(base - 16 * s)} ${f(x - 2 * s)},${f(base - 28 * s)}M${f(x + 4 * s)},${f(base)}C${f(x + 6 * s)},${f(base - 10 * s)} ${f(x + 10 * s)},${f(base - 18 * s)} ${f(x + 8 * s)},${f(base - 26 * s)}" stroke="#6e5a44" stroke-width="${f(4 * s)}" stroke-linecap="round" fill="none"/>`;
  for (let k = 0; k < 7; k++) {
    const cx = x + (r() - 0.5) * 34 * s, cy = base - 34 * s - r() * 14 * s;
    t += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f((11 + r() * 8) * s)}" ry="${f((8 + r() * 5) * s)}" fill="${pick(r, ["#7e8f5e", "#8b9b69", "#738458"])}"/>`;
  }
  for (let k = 0; k < 3; k++) t += `<ellipse cx="${f(x + (r() - 0.2) * 20 * s)}" cy="${f(base - 44 * s - r() * 6 * s)}" rx="${f(7 * s)}" ry="${f(4 * s)}" fill="#b3bf92" opacity=".7"/>`;
  return t;
}

function dayOlives() {
  let r = rng(503);
  let defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc8e0"/><stop offset=".3" stop-color="#d6e8ec"/><stop offset=".44" stop-color="#f6ecd9"/><stop offset="1" stop-color="#f1dfc0"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".25" stop-color="#ffe2a0" stop-opacity=".4"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`;
  let clouds = "";
  for (const [cx, cy, s] of [[340, 140, 0.9], [900, 90, 0.7], [1500, 210, 0.75]]) {
    defs += `<clipPath id="flat${cy}"><rect x="-200" y="0" width="2000" height="${cy + 14 * s}"/></clipPath>`;
    clouds += cloud(r, cx, cy, s);
  }
  write("day-2-sky.svg", svgDoc(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="1290" cy="140" r="300" fill="url(#sun)"/><circle cx="1290" cy="140" r="42" fill="#fffaf0"/><g class="drift" opacity=".9">${clouds}</g>`,
    defs, `.drift{animation:drift 90s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(60px)}}`
  ));

  // A hazy sierra with a white hill town far away
  r = rng(509);
  const sierra = displace(r, [[-60, 400], [180, 360], [420, 385], [640, 340], [900, 372], [1150, 330], [1400, 365], [1660, 345]], 0.08, 6);
  const townHill = wave(r, 420, [[14, 500], [6, 180]], 8);
  let town = "";
  for (let i = 0; i < 14; i++) {
    const x = 560 + r() * 160;
    town += house(r, x, yAt(townHill, x) + 2 + r() * 14, 9 + r() * 9, 7 + r() * 6);
  }
  write("day-2-far.svg", svgDoc(`<path d="${area(sierra)}" fill="#d9cdd0"/><path d="${area(townHill)}" fill="#e7d2b6"/>${town}`));

  // Rolling hills combed with rows of olive trees following the contours
  r = rng(521);
  const hillsSvg = [];
  const folds = [[468, [[22, 760], [10, 260]], "#e2bb8b"], [520, [[26, 640], [10, 220]], "#dcae7c"]];
  for (const [y, amps, fill] of folds) {
    const fold = wave(r, y, amps, 8);
    let rows = "";
    for (let j = 0; j < 9; j++) {
      const s = 0.7 + j * 0.12;
      for (let x = -40 + (j % 2) * 6; x < 1640; x += 11 * s + r() * 3) rows += `<circle cx="${f(x)}" cy="${f(yAt(fold, x) + 8 + j * 9 * s)}" r="${f(2.4 * s)}"/>`;
    }
    hillsSvg.push(`<path d="${area(fold)}" fill="${fill}"/><g fill="#8d9765">${rows}</g>`);
  }
  write("day-2-hills.svg", svgDoc(hillsSvg.join("")));

  // The near grove: red-ochre soil with furrows and rows of olive trees getting bigger towards you
  r = rng(541);
  const soil = wave(r, 604, [[12, 700], [5, 220]], 10);
  let furrows = "";
  for (let k = 1; k < 14; k++) furrows += `<path d="${line(soil.map(([x, y]) => [x, y + k * k * 1.6 + 6]))}"/>`;
  let trees = "";
  for (let row = 0; row < 5; row++) {
    const s = 0.55 + row * 0.38, spacing = 120 * s;
    for (let x = -40 + (row % 2) * spacing * 0.5 + r() * 20; x < 1660; x += spacing + r() * 20) {
      trees += oliveTree(r, x, yAt(soil, x) + 14 + row * row * 14, s);
    }
  }
  const gdefs = `<linearGradient id="soil" x1="0" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d9a06c"/><stop offset="1" stop-color="#c98a59"/></linearGradient>`;
  write("day-2-grove.svg", svgDoc(
    `<path d="${area(soil)}" fill="url(#soil)"/><g stroke="#e3b383" stroke-width="2" fill="none" opacity=".5">${furrows}</g>${trees}`,
    gdefs
  ));

  // Foreground: a dry-stone wall, poppies and an olive branch reaching in from the corner
  r = rng(557);
  let stones = "";
  for (let x = -20; x < 1640; x += 26 + r() * 18) stones += `<ellipse cx="${f(x)}" cy="${f(880 + r() * 8)}" rx="${f(16 + r() * 12)}" ry="${f(9 + r() * 5)}" fill="${pick(r, ["#e6d5b8", "#d8c4a2", "#efe2c8"])}"/>`;
  let poppies = "", grass = "";
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = 850 + r() * 26;
    grass += blade(x, y + 10, 14 + r() * 20, 1, (r() - 0.5) * 14);
    if (r() < 0.6) poppies += `<path d="M${f(x)},${f(y + 10)}L${f(x + 1)},${f(y)}" stroke="#7d8a52" stroke-width="1.2"/><circle cx="${f(x + 1)}" cy="${f(y)}" r="${f(3 + r() * 2)}" fill="${pick(r, ["#e2433a", "#d93a32", "#ef5a3c"])}"/>`;
  }
  let leaves = "";
  const branch = sampleBeziers([[[1660, 30], [1500, 60], [1400, 70], [1290, 130]]], 26);
  for (let i = 3; i < branch.length; i += 2) {
    const p = branch[i];
    for (const s of [-1, 1]) {
      const a = Math.atan2(p.ty, p.tx) + s * (0.9 + r() * 0.4);
      leaves += leaf(p.x, p.y, a, 26 + r() * 10, 4, r() < 0.5 ? "#7e8f5e" : "#a3b088", "");
    }
    if (r() < 0.3) leaves += `<ellipse cx="${f(p.x + 4)}" cy="${f(p.y + 8)}" rx="3.5" ry="4.5" fill="#4b3b4f"/>`;
  }
  write("day-2-front.svg", svgDoc(
    `<path d="${grass}" fill="#b9a46c"/>${stones}${poppies}<path d="M1660,30C1500,60 1400,70 1290,130" stroke="#6e5a44" stroke-width="6" fill="none" stroke-linecap="round"/>${leaves}`
  ));
}

// ======================= DAY 3: ALMERÍA DESERT =======================

function cactus(r, x, base, s) {
  // Prickly pear: a chain of tilted pads, with red fruit on the top edges
  let pads = "", fruit = "";
  const grow = (px, py, a, depth) => {
    const rx = 18 * s, ry = 26 * s, cx = px + Math.sin(a) * ry, cy = py - Math.cos(a) * ry;
    pads += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(cx)} ${f(cy)})" fill="${pick(r, ["#7d9a58", "#8aa863", "#728f50"])}"/>`;
    const tx = cx + Math.sin(a) * ry * 0.95, ty = cy - Math.cos(a) * ry * 0.95;
    if (depth >= 2 || r() < 0.25) {
      for (let k = 0; k < 3; k++) fruit += `<ellipse cx="${f(tx + (k - 1) * 9 * s)}" cy="${f(ty - 2)}" rx="${f(4 * s)}" ry="${f(5.5 * s)}" fill="#cf4a3c"/>`;
      return;
    }
    grow(tx, ty, a - 0.5 - r() * 0.3, depth + 1);
    if (r() < 0.7) grow(tx, ty, a + 0.4 + r() * 0.3, depth + 1);
  };
  grow(x, base, (r() - 0.5) * 0.3, 0);
  return pads + fruit;
}

function dayDesert() {
  let r = rng(601);
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e2c6"/><stop offset=".3" stop-color="#f7d6a8"/><stop offset=".48" stop-color="#f6b981"/><stop offset="1" stop-color="#eda56d"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff2d6" stop-opacity="1"/><stop offset=".18" stop-color="#ffc27a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`;
  let streaks = "";
  for (let i = 0; i < 6; i++) streaks += `<ellipse cx="${f(r() * W)}" cy="${f(120 + r() * 220)}" rx="${f(160 + r() * 200)}" ry="${f(4 + r() * 5)}" fill="#fff6e8" opacity="${(0.3 + r() * 0.3).toFixed(2)}"/>`;
  write("day-3-sky.svg", svgDoc(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="1180" cy="350" r="360" fill="url(#sun)"/><circle cx="1180" cy="350" r="56" fill="#fff4dc"/><g class="drift">${streaks}</g>`,
    defs, `.drift{animation:drift 80s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(50px)}}`
  ));

  // Flat-topped mesas on the horizon
  r = rng(607);
  const mesas = (y, list, fill) => {
    let d = `M-60,${y}`;
    for (const [x0, x1, top] of list) d += `L${x0},${y}L${x0 + 30},${top + 6}L${x0 + 40},${top}L${x1 - 40},${top}L${x1 - 28},${top + 8}L${x1},${y}`;
    return `<path d="${d}L1660,${y}L1660,${H + 20}L-60,${H + 20}Z" fill="${fill}"/>`;
  };
  write("day-3-mesas.svg", svgDoc(
    mesas(446, [[60, 420, 360], [700, 900, 380], [1280, 1640, 340]], "#ebbd94") +
    mesas(470, [[-80, 200, 400], [420, 640, 395], [960, 1200, 410]], "#e0a77c")
  ));

  // Eroded badlands with banded strata
  r = rng(613);
  const ridge = displace(r, [[-60, 520], [160, 480], [340, 530], [520, 470], [720, 520], [900, 490], [1100, 535], [1300, 480], [1480, 520], [1660, 495]], 0.2, 6);
  let bands = "";
  for (let k = 1; k < 7; k++) bands += `<path d="${line(ridge.map(([x, y]) => [x, y + k * 14 + Math.sin(x / 90 + k) * 4]))}"/>`;
  write("day-3-badlands.svg", svgDoc(
    `<clipPath id="bl"><path d="${area(ridge)}"/></clipPath><path d="${area(ridge)}" fill="#d0905f"/><g clip-path="url(#bl)" stroke="#e4ad7c" stroke-width="5" fill="none" opacity=".5">${bands}</g>`
  ));

  // The desert floor with a winding dirt road and scrub
  r = rng(619);
  const floor = wave(r, 572, [[4, 600], [2, 160]], 10);
  const road = sampleBeziers([[[820, 574], [760, 620], [900, 660], [840, 720]], [[840, 720], [780, 790], [600, 830], [640, 930]]]);
  const L = [], R = [];
  for (const p of road) {
    const w = 2 + Math.max(0, p.y - 572) * 0.22;
    L.push([p.x - p.ty * w, p.y + p.tx * w]); R.push([p.x + p.ty * w, p.y - p.tx * w]);
  }
  let scrub = "";
  for (let i = 0; i < 70; i++) {
    const y = 580 + Math.pow(r(), 0.8) * 300, x = r() * W, s = 0.4 + (y - 572) * 0.012;
    scrub += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(7 * s)}" ry="${f(4.5 * s)}" fill="${pick(r, ["#9c8a55", "#8d7d4b", "#a99760"])}"/>`;
  }
  const fdefs = `<linearGradient id="fl" x1="0" y1="572" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e5b384"/><stop offset="1" stop-color="#efcda2"/></linearGradient>`;
  write("day-3-floor.svg", svgDoc(
    `<path d="${area(floor)}" fill="url(#fl)"/><path d="${line(L) + "L" + R.reverse().map((q) => `${f(q[0])},${f(q[1])}`).join("L")}Z" fill="#f5dfbd"/>${scrub}`,
    fdefs
  ));

  // Foreground: prickly pear, agave, rocks and dry grass
  r = rng(631);
  let tufts = "";
  for (let i = 0; i < 22; i++) {
    const x = r() * W, b = 884 + r() * 16;
    for (let k = 0; k < 7; k++) tufts += blade(x + (r() - 0.5) * 12, b, 14 + r() * 22, 1.1, (r() - 0.5) * 18);
  }
  let rocks = "";
  for (let i = 0; i < 10; i++) rocks += `<ellipse cx="${f(r() * W)}" cy="${f(890 - r() * 16)}" rx="${f(18 + r() * 34)}" ry="${f(9 + r() * 12)}" fill="${pick(r, ["#c99a6c", "#b98a5e"])}"/>`;
  write("day-3-front.svg", svgDoc(
    `<path d="${area(wave(r, 868, [[5, 500], [2, 140]], 10))}" fill="#f1d3a9"/>${rocks}<path d="${tufts}" fill="#c9a26a"/>` +
    cactus(r, 120, 890, 1.6) + cactus(r, 280, 896, 1.1) + cactus(r, 1440, 892, 1.8) +
    aloe(r, 1240, 894, 100, ["#9cb7ad", "#acc5bb"], "#5d4a3a")
  ));
}

// ======================= Markup =======================

// Three scenes per theme, stacked; each later one takes over as its part of the page scrolls in.
// Only the first scene loads straight away; scene.js swaps data-href to href when a later one is near.
const SCENES = [
  { night: ["sky", "peaks", "forest", "meadow", "front"], day: ["sky", "sierra", "hills", "garden", "front"] },
  { night: ["sky", "far", "cliffs", "water", "front"], day: ["sky", "far", "hills", "grove", "front"] },
  { night: ["sky", "hills", "woods", "grove", "front"], day: ["sky", "mesas", "badlands", "floor", "front"] },
];
const SPEEDS = [0.6, 0.45, 0.32, 0.18, 0];

const layer = (file, speed, lazy) =>
  `<div class="scene-layer" data-speed="${speed}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><image ${lazy ? "data-href" : "href"}="assets/scene/${file}" width="${W}" height="${H}"/></svg></div>`;

function sceneMarkup(indent) {
  const i = (n) => "\n" + indent + "    ".repeat(n);
  let out = `<!-- scene:start (generated by tools/gen-scene.mjs) -->${i(0)}<div class="scene" aria-hidden="true">`;
  SCENES.forEach((scene, k) => {
    out += `${i(1)}<div class="scene-chapter${k === 0 ? " is-shown" : ""}" data-chapter="${k + 1}">`;
    for (const set of ["night", "day"]) {
      out += `${i(2)}<div class="scene-set scene-${set}">`;
      scene[set].forEach((name, n) => (out += i(3) + layer(`${set}-${k + 1}-${name}.svg`, SPEEDS[n], k > 0)));
      out += `${i(2)}</div>`;
    }
    out += `${i(1)}</div>`;
  });
  return out + `${i(1)}<canvas class="scene-fx"></canvas>${i(1)}<div class="scene-dim"></div>${i(0)}</div>${i(0)}<!-- scene:end -->`;
}

for (const old of fs.readdirSync(OUT)) if (!/^(night|day)-\d-/.test(old)) fs.unlinkSync(path.join(OUT, old));

nightSky(); nightPeaks(); nightForest(); nightMeadow(); nightFront();
nightFjord(); nightSnow();
daySky(); daySierra(); dayHills(); dayGarden(); dayFront();
dayOlives(); dayDesert();

const indexPath = path.join(REPO, "index.html");
const html = fs.readFileSync(indexPath, "utf8");
const re = /^([ \t]*)<!-- scene:start[\s\S]*?<!-- scene:end -->/m;
const m = html.match(re);
if (!m) throw new Error("scene markers missing in index.html");
fs.writeFileSync(indexPath, html.replace(re, m[1] + sceneMarkup(m[1])));
console.log("index.html: scene markup updated");
