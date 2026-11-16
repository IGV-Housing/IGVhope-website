// Builds the IGVhope Employer Pack into public/assets/files/employer-pack/
// Usage (from this folder): npm install, then npm run build
// Optional: set EDGE to the path of msedge.exe / chrome.exe if it is not found automatically.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { buildWordDocs } from './docx-assets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
// Built files and the zip are kept in dist/ (git-ignored, never served by the website).
const outDir = path.join(here, 'dist/IGVhope-Employer-Pack');
const zipPath = path.join(here, 'dist/IGVhope-Employer-Pack.zip'); // kept out of public/: these kits are shared through myIGVhope, not the website
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'igvhope-pack-'));

// ---- Settings: change links and contact details here, then rebuild ----
export const CONFIG = {
  siteUrl: 'https://www.igvhope.com/how-it-works',
  displayUrl: 'igvhope.com',
  linkUrl: 'https://www.igvhope.com',
  email: 'support@igvhope.com',
};

// ---- Helpers ----
const fontFile = (w) => pathToFileURL(path.join(here, `node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`)).href;
const FONTS = [400, 500, 600, 700, 800]
  .map((w) => `@font-face{font-family:'Montserrat';font-weight:${w};font-style:normal;src:url('${fontFile(w)}') format('woff2')}`)
  .join('\n');
const css = fs.readFileSync(path.join(here, 'src/shared.css'), 'utf8').replace('{{FONTS}}', FONTS);
const logoWhite = fs.readFileSync(path.join(here, 'src/logo-white.svg'), 'utf8')
  .replace(/ width="\d+"/, '').replace(/ height="\d+"/, '');
const logoDeep = logoWhite.replace(/#ffffff/gi, '#123D36');
// The homepage house explainer: stages up to step n are lit, later ones faded (same as the site).
const houseSvg = fs.readFileSync(path.join(here, 'src/house.svg'), 'utf8');
const house = (n) => houseSvg.replace(/<g class="g" data-g="(\d)">/g, (_, k) => `<g class="g" style="opacity:${+k <= n ? 1 : 0.16}">`);
const imgUrl = (name) => pathToFileURL(path.join(repo, 'public/assets/img', name)).href;

// spec is 'medium' (links to siteUrl) or 'medium@path' (links to that page on the site, e.g. 'window-sheet@next-steps').
async function qr(spec) {
  if (spec === 'mailto') {
    // Opens a new email to the support address.
    return QRCode.toString(`mailto:${CONFIG.email}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#123D36', light: '#ffffff' } });
  }
  const [medium, page] = spec.split('@');
  const target = page === 'home' ? CONFIG.linkUrl : page ? `${CONFIG.linkUrl}/${page}` : CONFIG.siteUrl;
  const url = `${target}?utm_source=employer-pack&utm_medium=${medium}&utm_campaign=employer-pack`;
  const svg = await QRCode.toString(url, {
    type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#123D36', light: '#ffffff' },
  });
  return svg;
}

async function fill(html) {
  html = html.replace('{{CSS}}', () => css).replace('{{FONTS_ONLY}}', () => FONTS);
  html = html.replaceAll('{{LOGO_WHITE}}', `<a href="${CONFIG.linkUrl}" style="display:block">${logoWhite}</a>`).replaceAll('{{LOGO_DEEP}}', logoDeep);
  html = html.replace(/\{\{HOUSE:(\d)\}\}/g, (_, n) => house(+n));
  html = html.replace(/\{\{IMG:([^}]+)\}\}/g, (_, n) => imgUrl(n));
  const qrs = [...html.matchAll(/\{\{QR:([^}]+)\}\}/g)].map((m) => m[1]);
  for (const medium of new Set(qrs)) html = html.replaceAll(`{{QR:${medium}}}`, await qr(medium));
  return html.replaceAll('{{URL}}', CONFIG.displayUrl).replaceAll('{{EMAIL}}', CONFIG.email);
}

function findBrowser() {
  const candidates = [
    process.env.EDGE,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('No Edge/Chrome found. Set the EDGE environment variable to its path.');
  return found;
}
const browser = findBrowser();

function runBrowser(args) {
  const profile = fs.mkdtempSync(path.join(tmpDir, 'profile-'));
  const target = args.find((a) => /^--(print-to-pdf|screenshot)=/.test(a))?.split('=').slice(1).join('=');
  if (target) fs.rmSync(target, { force: true });
  // The browser occasionally lingers after writing its file, so a timeout is fine if the file exists.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = spawnSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, ...args], { encoding: 'utf8', timeout: 45000 });
    if (process.env.DEBUG) console.log(r.error || '', r.stderr);
    if (!target || fs.existsSync(target)) return;
  }
  throw new Error(`Browser did not produce ${target}`);
}

async function htmlFile(srcName) {
  const html = await fill(fs.readFileSync(path.join(here, 'src', srcName), 'utf8'));
  const p = path.join(tmpDir, srcName);
  fs.writeFileSync(p, html);
  return p;
}

async function pdf(srcName, outName) {
  const p = await htmlFile(srcName);
  runBrowser(['--no-pdf-header-footer', `--print-to-pdf=${path.join(outDir, outName)}`, pathToFileURL(p).href]);
  const pages = (fs.readFileSync(path.join(outDir, outName)).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`  ${outName}  (${pages} page${pages === 1 ? '' : 's'})`);
  return pages;
}

async function png(srcName, outName, w, h, scale) {
  const p = await htmlFile(srcName);
  runBrowser([`--window-size=${w},${h}`, `--force-device-scale-factor=${scale}`, `--screenshot=${path.join(outDir, outName)}`, pathToFileURL(p).href]);
  console.log(`  ${outName}  (${w * scale}x${h * scale})`);
}

// Review-only: a PNG of each A4 page, for checking layout. Not part of the pack.
async function preview(srcName, pages) {
  const p = await htmlFile(srcName);
  const dir = process.env.PREVIEW; fs.mkdirSync(dir, { recursive: true });
  runBrowser(['--window-size=794,' + 1123 * pages, `--screenshot=${path.join(dir, srcName.replace('.html', '.png'))}`, pathToFileURL(p).href]);
}

// ---- Build ----
fs.mkdirSync(outDir, { recursive: true });
console.log('Building employer pack...');
const jobs = [
  ['02-talking-points.html', '02-Talking-points-10-minute-chat.pdf', 1],
  ['03a-printable-one-pager.html', '03a-Printable-one-pager-for-break-rooms-and-shop-windows.pdf', 1],
  ['03b-employer-leave-behind.html', '03b-Employer-one-pager-to-leave-behind.pdf', 1],
  ['04-how-employers-can-help.html', '04-How-employers-can-help.pdf', 1],
  ['05-employer-faq.html', '05-Employer-FAQ.pdf', 1],
  ['06-poster.html', '06-Staff-noticeboard-poster-A4.pdf', 1],
];
const only = process.argv[2];
for (const [src, out, expected] of jobs) {
  if (!fs.existsSync(path.join(here, 'src', src))) continue;
  if (only && !src.startsWith(only)) continue;
  const pages = await pdf(src, out);
  if (pages !== expected) console.warn(`  !! expected ${expected} page(s) but got ${pages}: content is overflowing`);
  if (process.env.PREVIEW) await preview(src, expected);
}
if (!only || only === '08' || only === '09') {
  if (fs.existsSync(path.join(here, 'src/08-signature-supporting.html'))) {
    await png('08-signature-supporting.html', '08-Email-signature-600px.png', 600, 120, 1);
    await png('08-signature-supporting.html', '08-Email-signature-1200px-sharp.png', 600, 120, 2);
    await png('08-tile.html', '09-Social-media-tile.png', 1080, 1080, 1);
  }
}
if (!only || only === '01' || only === '07') {
  // The Word header is the same band as on the PDFs, rendered as an image (so the Montserrat lettering matches).
  const band = async (tag, name) => {
    const html = await fill(`<!doctype html><html><head><meta charset="utf-8"><style>{{CSS}} html,body{width:210mm;height:21.4mm;background:#E8A24A;overflow:hidden}</style></head><body><div class="hdr"><div class="logo">{{LOGO_WHITE}}</div><span class="tag">${tag}</span></div><div class="accent"></div></body></html>`);
    const src = path.join(tmpDir, `band-${name}.html`);
    fs.writeFileSync(src, html);
    const out = path.join(tmpDir, `band-${name}.png`);
    runBrowser(['--window-size=794,81', '--force-device-scale-factor=2', `--screenshot=${out}`, pathToFileURL(src).href]);
    return fs.readFileSync(out);
  };
  await buildWordDocs(outDir, CONFIG, { you: await band('Employer pack · For you', 'you'), employers: await band('Employer pack · For employers', 'employers') });
}
if (process.env.PREVIEW) console.log('Previews in', process.env.PREVIEW);

// Pack everything in dist/ into the single downloadable zip (forward-slash paths so it opens correctly on Windows, Mac and Linux).
{
  const zip = new JSZip();
  for (const f of fs.readdirSync(outDir).sort()) zip.file(`IGVhope-Employer-Pack/${f}`, fs.readFileSync(path.join(outDir, f)));
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  fs.writeFileSync(zipPath, buf);
  console.log(`Zip: ${path.relative(repo, zipPath)} (${(buf.length / 1048576).toFixed(1)} MB, ${Object.keys(zip.files).length} files)`);
}
