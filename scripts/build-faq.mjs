// Builds the FAQ into the FAQ page, so search engines and AI assistants can read it.
//
// The questions and answers live in public/faq/faq.json (also read by the IGVhope platform's Call Desk), so
// there is still one copy to edit. This script copies them into public/faq/index.html twice:
//   1. as the visible question list, so the words are in the page itself (most AI crawlers don't run scripts)
//   2. as FAQPage structured data (JSON-LD), which Google reads
// Each copy sits between marker comments and is replaced whole every run, so running it again is harmless.
//
// Cloudflare runs it on every deploy (the "build" command in wrangler.jsonc), so the live page always matches
// faq.json. Run it yourself after editing faq.json to see the change locally and commit it:
//   node scripts/build-faq.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const jsonPath = root + 'public/faq/faq.json';
const pagePath = root + 'public/faq/index.html';

const items = JSON.parse(readFileSync(jsonPath, 'utf8'));
if (!Array.isArray(items) || !items.length) throw new Error('faq.json should be a list of questions');
items.forEach((it, i) => {
  if (!it || typeof it.q !== 'string' || typeof it.a !== 'string' || !it.q.trim() || !it.a.trim()) {
    throw new Error('faq.json item ' + (i + 1) + ' needs a "q" (question) and an "a" (answer)');
  }
});

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/'/g, '&#39;');
const plain = s => String(s).replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();

// The same markup the page's renderFaqList() builds, so the page looks identical either way.
// q and a are HTML (answers use <br><br> between paragraphs), as they are when the page renders them.
const chevron = '<svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A5C50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const listHtml = items.map((it, i) => {
  const id = 'faq-' + (it.id || ('faq-list-participant-' + i));
  return '<div class="faq-item" id="' + attr(id) + '">'
    + '<button class="faq-question" onclick="toggleFaq(\'' + attr(id) + '\')">'
    + '<span class="q-text">' + it.q + '</span>' + chevron + '</button>'
    + '<div class="faq-answer"><div class="faq-answer-inner">' + it.a + '</div></div>'
    + '</div>';
}).join('\n');

// Google allows simple HTML (such as <br>, <p>, <a>, <b>) in an answer's text
const schema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  url: 'https://www.igvhope.com/faq',
  mainEntity: items.map(it => ({
    '@type': 'Question',
    name: plain(it.q),
    acceptedAnswer: { '@type': 'Answer', text: it.a.trim() },
  })),
};
const schemaHtml = '<script type="application/ld+json">\n'
  + JSON.stringify(schema, null, 2).replace(/<\//g, '<\\/') + '\n</script>';

let page = readFileSync(pagePath, 'utf8');
function fill(name, content) {
  const re = new RegExp('(<!-- ' + name + ':START[^>]*-->)[\\s\\S]*?(<!-- ' + name + ':END -->)');
  if (!re.test(page)) throw new Error('public/faq/index.html is missing the <!-- ' + name + ':START --> / <!-- ' + name + ':END --> markers');
  page = page.replace(re, (m, start, end) => start + '\n' + content + '\n' + end);
}
fill('FAQ-SCHEMA', schemaHtml);
fill('FAQ-LIST', listHtml);
writeFileSync(pagePath, page);
console.log('FAQ page built with ' + items.length + ' questions from faq.json');
