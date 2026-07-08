// Scientist biographies: gallery (#/scientists), bio pages
// (#/scientists/:id), and the linkify pass that turns scientist names in
// content into navigation links.

import { CATEGORIES } from './data.js';
import { icon } from './icons.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* Build a single regex over every alias (longest first, so "Lecoq de
   Boisbaudran" wins over "Boisbaudran") plus alias → scientist-id map. */
export function buildAliasIndex(scientists) {
  const map = new Map();
  for (const [id, sci] of Object.entries(scientists)) {
    for (const alias of sci.aliases) map.set(alias, id);
  }
  const escaped = [...map.keys()]
    .sort((a, b) => b.length - a.length)
    .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return { map, regex: new RegExp(`\\b(${escaped.join('|')})\\b`, 'g') };
}

/* Turn scientist names in already-escaped text into bio links.
   Single pass — matches can't nest or double-wrap. */
export function linkify(escapedText, index, excludeId = null) {
  if (!index) return escapedText;
  return escapedText.replace(index.regex, (match) => {
    const id = index.map.get(match);
    if (!id || id === excludeId) return match;
    return `<a class="sci-link" href="#/scientists/${id}">${match}</a>`;
  });
}

const initials = (name) => name.split(' ').filter((w) => /^[A-ZÀ-Þ]/.test(w)).map((w) => w[0]).slice(0, 2).join('');

const HUES = [200, 330, 150, 45, 270, 15, 100];
const hueFor = (id) => HUES[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % HUES.length];

function avatar(id, sci, size = '') {
  return `<span class="sci-avatar ${size}" style="--hue:${hueFor(id)}" aria-hidden="true">${esc(initials(sci.name))}</span>`;
}

export function scientistsView(viewEl, DATA) {
  const entries = Object.entries(DATA.scientists)
    .sort((a, b) => a[1].name.split(' ').pop().localeCompare(b[1].name.split(' ').pop()));

  const cards = entries.map(([id, sci]) => `
    <a class="sci-card" href="#/scientists/${id}" data-name="${esc(sci.name.toLowerCase())}">
      ${avatar(id, sci)}
      <span class="sci-card-body">
        <span class="sci-name">${esc(sci.name)}</span>
        <span class="sci-years">${esc(sci.years)}</span>
        <span class="sci-known">${esc(sci.knownFor)}</span>
      </span>
    </a>`).join('');

  viewEl.innerHTML = `
    <div class="nova">
      <img src="assets/nova.svg" alt="">
      <div class="nova-bubble">Every element has a human story! Meet the ${entries.length} scientists behind the
      discoveries — chemists, physicists, a saltpeter maker, and one gold-hunting alchemist.</div>
    </div>
    <input type="search" class="sci-filter" id="sci-filter" placeholder="Search ${entries.length} scientists…"
      aria-label="Search scientists by name">
    <div class="sci-grid" id="sci-grid">${cards}</div>
  `;

  viewEl.querySelector('#sci-filter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    viewEl.querySelectorAll('.sci-card').forEach((card) => {
      card.hidden = q && !card.dataset.name.includes(q);
    });
  });
}

export function scientistView(viewEl, DATA, id, sciIndex) {
  const sci = DATA.scientists[id];
  if (!sci) { location.hash = '#/scientists'; return; }

  const chips = sci.elements.map((n) => {
    const el = DATA.byNumber.get(n);
    return `<a class="journey-sym sci-el-chip" style="--cat:${CATEGORIES[el.c].color}"
      href="#/element/${n}" title="${esc(el.name)}">${esc(el.s)}</a>`;
  }).join('');

  viewEl.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a class="text-link" href="#/scientists">${icon('arrow-left')} All scientists</a>
    </nav>
    <div class="sci-hero">
      ${avatar(id, sci, 'big')}
      <div>
        <h2 class="sci-hero-name">${esc(sci.name)}</h2>
        <p class="sci-hero-meta">${esc(sci.years)}</p>
        <p class="sci-hero-known">${icon('sparkles')} ${esc(sci.knownFor)}</p>
      </div>
    </div>
    <div class="card"><h3>${icon('scroll')} Their story</h3>
      <p>${linkify(esc(sci.bio), sciIndex, id)}</p></div>
    <div class="card"><h3>${icon('atom')} Their elements</h3>
      <div class="sci-el-row">${chips}</div>
      <p class="muted" style="margin-top:10px">Tap an element to visit its page — you'll find
      ${esc(sci.name.split(' ').pop())} mentioned in its story.</p></div>
  `;
}
