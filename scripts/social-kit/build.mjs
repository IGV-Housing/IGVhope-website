// Builds the IGVhope Social Kit for program participants: webinar tile, Secure/Live/Own video,
// "I checked my eligibility" carousel and a caption pack. The only output published on the site is
// public/assets/files/IGVhope-Social-Kit.zip. Loose files live in dist/ (git-ignored).
// Usage (from this folder): npm install, then npm run build.   Single parts: node build.mjs tile|video|carousel|captions
// Optional: set EDGE to the path of msedge.exe / chrome.exe if it is not found automatically.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { buildCaptions } from './captions.mjs';

const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const outDir = path.join(here, 'dist/IGVhope-Social-Kit');
const zipPath = path.join(repo, 'public/assets/files/IGVhope-Social-Kit.zip');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'igvhope-social-'));

// ---- Settings: change links, dates and contact details here, then rebuild ----
export const CONFIG = {
  linkUrl: 'https://www.igvhope.com',
  displayUrl: 'igvhope.com',
  email: 'support@igvhope.com',
  // Webinar days, matching WEBINAR_DAYS on the site. Update when new sessions are added.
  webinars: [
    { day: 'Tue', label: 'Dec 8' },
    { day: 'Thu', label: 'Jan 28' },
    { day: 'Thu', label: 'Feb 25' },
  ],
};

// ---- Page helpers ----
const fontFile = (w) => pathToFileURL(path.join(here, `node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`)).href;
const FONTS = [400, 500, 600, 700, 800].map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${fontFile(w)}') format('woff2')}`).join('\n');
const baseCss = fs.readFileSync(path.join(here, 'src/base.css'), 'utf8').replace('{{FONTS_ONLY}}', FONTS);
const logoWhite = fs.readFileSync(path.join(here, 'src/logo-white.svg'), 'utf8').replace(/ width="\d+"/, '').replace(/ height="\d+"/, '');
const logoDeep = logoWhite.replace(/#ffffff/gi, '#123D36');
const houseSvg = fs.readFileSync(path.join(here, 'src/house.svg'), 'utf8');
const house = (n) => houseSvg.replace(/<g class="g" data-g="(\d)">/g, (_, k) => `<g class="g" style="opacity:${+k <= n ? 1 : 0.16}">`);
const imgUrl = (name) => pathToFileURL(path.join(repo, 'public/assets/img', name)).href;
const link = (svg) => `<a href="${CONFIG.linkUrl}" style="display:block">${svg}</a>`;

async function qr(spec) {
  const [medium, page] = spec.split('@');
  const target = page ? `${CONFIG.linkUrl}/${page}` : CONFIG.linkUrl;
  const url = `${target}?utm_source=social-kit&utm_medium=${medium}`;
  return QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#123D36', light: '#ffffff' } });
}

async function fill(html) {
  html = html.replace('{{BASE}}', () => baseCss).replace('{{FONTS_ONLY}}', () => FONTS);
  html = html.replaceAll('{{LOGO_WHITE_DEEP}}', link(logoDeep)).replaceAll('{{LOGO_WHITE}}', link(logoWhite));
  html = html.replaceAll('{{HOUSE_RAW}}', houseSvg);
  html = html.replace(/\{\{HOUSE:(\d)\}\}/g, (_, n) => house(+n));
  html = html.replace(/\{\{IMG:([^}]+)\}\}/g, (_, n) => imgUrl(n));
  const qrs = [...html.matchAll(/\{\{QR:([^}]+)\}\}/g)].map((m) => m[1]);
  for (const spec of new Set(qrs)) html = html.replaceAll(`{{QR:${spec}}}`, await qr(spec));
  const chips = CONFIG.webinars.map((w) => `<span class="chip">${w.label}</span>`).join('');
  return html.replaceAll('{{WEBINAR_CHIPS}}', chips).replaceAll('{{URL}}', CONFIG.displayUrl).replaceAll('{{EMAIL}}', CONFIG.email);
}

async function pageFile(srcName) {
  const p = path.join(tmpDir, srcName);
  fs.writeFileSync(p, await fill(fs.readFileSync(path.join(here, 'src', srcName), 'utf8')));
  return p;
}

function findBrowser() {
  const c = [process.env.EDGE,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const found = c.find((p) => fs.existsSync(p));
  if (!found) throw new Error('No Edge/Chrome found. Set the EDGE environment variable to its path.');
  return found;
}

const only = process.argv[2];
const want = (name) => !only || only === name;
fs.mkdirSync(outDir, { recursive: true });
console.log('Building social kit...');

const browser = await puppeteer.launch({
  executablePath: findBrowser(), headless: true,
  userDataDir: fs.mkdtempSync(path.join(tmpDir, 'profile-')),
  args: ['--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb'],
});

async function open(srcName, w, h, query = '') {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(await pageFile(srcName)).href + query, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

try {
  // ---- Post 1: webinar tile ----
  if (want('tile')) {
    const page = await open('01-webinar-tile.html', 1080, 1080);
    await page.screenshot({ path: path.join(outDir, '01-Webinar-tile-no-down-payment.png') });
    await page.close();
    console.log('  01-Webinar-tile-no-down-payment.png');
  }

  // ---- Post 3: eligibility story carousel ----
  if (want('carousel')) {
    const page = await open('03-eligibility-story.html', 1080, 1350);
    const slides = await page.$$('.slide');
    for (let i = 0; i < slides.length; i++) {
      await slides[i].screenshot({ path: path.join(outDir, `03-I-checked-my-eligibility-slide-${i + 1}-of-${slides.length}.png`) });
    }
    await page.close();
    console.log(`  03-I-checked-my-eligibility-slide-1..${slides.length}`);
  }

  // ---- Post 2: Secure, Live, Own video (square and vertical) ----
  if (want('video')) {
    const FPS = 30;
    for (const [h, name] of [[1080, '02-Secure-Live-Own-video-square-1x1.mp4'], [1920, '02-Secure-Live-Own-video-vertical-9x16.mp4']]) {
      const page = await open('02-video.html', 1080, h, `?h=${h}`);
      const total = await page.evaluate(() => window.TOTAL);
      const frames = path.join(tmpDir, `frames-${h}`);
      fs.mkdirSync(frames, { recursive: true });
      const n = Math.round(total * FPS);
      for (let i = 0; i < n; i++) {
        await page.evaluate((t) => window.render(t), i / FPS);
        await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
      }
      await page.close();
      const out = path.join(outDir, name);
      const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error('ffmpeg failed: ' + r.stderr);
      console.log(`  ${name}  (${total}s, ${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
    }
  }

  // ---- Review only: still frames of the video at key moments (node build.mjs frames) ----
  if (only === 'frames' && process.env.PREVIEW) {
    fs.mkdirSync(process.env.PREVIEW, { recursive: true });
    for (const h of [1080, 1920]) {
      const page = await open('02-video.html', 1080, h, `?h=${h}`);
      for (const t of [2.0, 6.0, 8.0, 11.5, 12.9, 16.0, 17.2, 21.0]) {
        await page.evaluate((x) => window.render(x), t);
        await page.screenshot({ path: path.join(process.env.PREVIEW, `f-${h}-${t}.png`) });
      }
      await page.close();
    }
    console.log('  frames written');
  }

  // ---- Caption pack (Word) ----
  if (want('captions')) {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 81, deviceScaleFactor: 2 });
    const html = await fill(`<!doctype html><html><head><meta charset="utf-8"><style>{{BASE}} html,body{width:794px;height:81px;overflow:hidden;background:#E8A24A}
      .hdr{background:#123D36;height:75.6px;padding:0 52px;display:flex;align-items:center;justify-content:space-between}.logo{width:128px}.tag{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#A9C0AC}.accent{height:5.3px;background:#E8A24A}</style></head>
      <body><div class="hdr"><div class="logo">{{LOGO_WHITE}}</div><span class="tag">Social kit · For program participants</span></div><div class="accent"></div></body></html>`);
    const f = path.join(tmpDir, 'band.html');
    fs.writeFileSync(f, html);
    await page.goto(pathToFileURL(f).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const band = await page.screenshot({ type: 'png' });
    await page.close();
    await buildCaptions(outDir, band, CONFIG);
  }
} finally {
  await browser.close();
}

// ---- Pack everything in dist/ into the single downloadable zip ----
if (only !== 'frames') {
  const zip = new JSZip();
  for (const f of fs.readdirSync(outDir).sort()) zip.file(`IGVhope-Social-Kit/${f}`, fs.readFileSync(path.join(outDir, f)));
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  fs.writeFileSync(zipPath, buf);
  console.log(`Zip: ${path.relative(repo, zipPath)} (${(buf.length / 1048576).toFixed(1)} MB, ${fs.readdirSync(outDir).length} files)`);
}
process.exit(0);
