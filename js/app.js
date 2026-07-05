// App entry: hash router + view renderers. Views are plain functions that
// fill #view; game logic lives in games.js, 3D in crystals.js.

import { loadData, CATEGORIES, gridPosition } from './data.js';
import { progress, badges } from './progress.js';
import { renderDetective, renderMatch } from './games.js';
import { mountCrystal, LATTICE_TITLES } from './crystals.js';

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('app-title');
const backBtn = document.getElementById('back-btn');
backBtn.addEventListener('click', () => history.back());

let DATA = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function nova(text) {
  return `<div class="nova"><img src="assets/nova.svg" alt=""><div class="nova-bubble">${text}</div></div>`;
}

function setChrome(title, { back = false, tab = null } = {}) {
  titleEl.textContent = title;
  backBtn.classList.toggle('hidden', !back);
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  window.scrollTo(0, 0);
}

/* ---------- Views ---------- */

function homeView() {
  setChrome('Elements', { tab: 'home' });
  const visited = new Set(progress.get().visited);

  const tiles = DATA.elements.map((el) => {
    const { row, col } = gridPosition(el);
    const featured = DATA.featured[el.n] ? '<span class="star">⭐</span>' : '';
    return `<button class="el-tile ${visited.has(el.n) ? 'visited' : ''}"
      style="--row:${row};--col:${col};--cat:${CATEGORIES[el.c].color}"
      data-el="${el.n}" aria-label="${esc(el.name)}, element ${el.n}">
      ${featured}<span class="sym">${esc(el.s)}</span><span class="num">${el.n}</span>
    </button>`;
  }).join('');

  const seriesTags = `
    <div class="series-tag" style="--row:6;--col:3">57–71</div>
    <div class="series-tag" style="--row:7;--col:3">89–103</div>`;

  const legend = Object.entries(CATEGORIES).map(([, meta]) =>
    `<span class="legend-item"><span class="legend-dot" style="background:${meta.color}"></span>${meta.label}</span>`).join('');

  viewEl.innerHTML = `
    ${nova('Welcome to the periodic table — every single thing in the universe is built from these! Tap a tile to meet an element. The ⭐ ones have full stories.')}
    <div class="table-scroll"><div class="ptable">${tiles}${seriesTags}<div class="fblock-gap"></div></div></div>
    <div class="legend">${legend}</div>
  `;

  viewEl.querySelectorAll('.el-tile').forEach((tile) => {
    tile.addEventListener('click', () => { location.hash = `#/element/${tile.dataset.el}`; });
  });
}

function elementView(n) {
  const el = DATA.byNumber.get(Number(n));
  if (!el) { location.hash = '#/home'; return; }
  progress.visit(el.n);
  setChrome(el.name, { back: true, tab: 'home' });

  const cat = CATEGORIES[el.c];
  const kid = DATA.featured[el.n];

  const hero = `
    <div class="el-hero" style="--cat:${cat.color}">
      <div class="big-sym">${esc(el.s)}</div>
      <div class="hero-meta">
        <h2>${esc(el.name)}</h2>
        <p>Element #${el.n} · mass ${esc(el.m)} · ${esc(cat.label)}</p>
      </div>
    </div>`;

  if (!kid) {
    viewEl.innerHTML = `
      ${hero}
      <div class="card"><h3>What kind of element is this?</h3><p>${esc(cat.kid)}</p></div>
      ${nova(`I'm still writing ${esc(el.name)}'s full story! Explore a ⭐ element on the table for superpowers, games, and trivia.`)}
      <a class="big-btn secondary" href="#/home">Back to the table</a>
    `;
    return;
  }

  const facts = kid.facts.map((f) => `<li>${esc(f)}</li>`).join('');
  const trivia = kid.trivia.map((t) => `<li>${esc(t)}</li>`).join('');
  const uses = kid.uses.map((u) => `<span class="chip">${esc(u)}</span>`).join('');

  const crystalSection = kid.crystals ? `
    <div class="card crystal-wrap">
      <h3>Crystal viewer — spin me!</h3>
      <div class="crystal-tabs">
        ${kid.crystals.map((c, i) => `<button class="big-btn ${i ? 'secondary' : ''}" data-crystal="${c}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('')}
      </div>
      <canvas id="crystal-canvas" aria-label="Rotating crystal structure"></canvas>
      <p class="crystal-hint" id="crystal-title"></p>
    </div>` : '';

  viewEl.innerHTML = `
    ${hero}
    <div class="superpower"><span class="sp-label">SUPERPOWER</span>${esc(kid.superpower)}</div>
    <div class="card"><h3>🔬 Science facts</h3><ul>${facts}</ul></div>
    <div class="card metaphor"><h3>💭 Imagine it like…</h3><p>${esc(kid.imagine)}</p></div>
    <div class="card"><h3>📜 Origin story</h3><p>${esc(kid.origin)}</p></div>
    <div class="card"><h3>🌍 Where you'll find it</h3><div class="chips">${uses}</div></div>
    <div class="card"><h3>⚡ Powers &amp; properties</h3>${propBars(kid.props)}</div>
    ${crystalSection}
    <div class="card"><h3>🤯 Wow trivia</h3><ul>${trivia}</ul></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a class="big-btn" href="#/compare/${el.n}">Compare me! ⚖️</a>
      <a class="big-btn secondary" href="#/home">Back to the table</a>
    </div>
  `;

  if (kid.crystals) {
    const canvas = viewEl.querySelector('#crystal-canvas');
    const title = viewEl.querySelector('#crystal-title');
    const show = (name) => { title.textContent = LATTICE_TITLES[name]; mountCrystal(canvas, name); };
    viewEl.querySelectorAll('[data-crystal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        viewEl.querySelectorAll('[data-crystal]').forEach((b) => b.classList.add('secondary'));
        btn.classList.remove('secondary');
        show(btn.dataset.crystal);
      });
    });
    show(kid.crystals[0]);
  }
}

const CONDUCT_WORDS = ['not at all', 'barely', 'a little', 'a little', 'pretty well', 'well', 'well', 'really well', 'really well', 'amazingly', 'best of all!'];

function propBars(props) {
  const rows = [];
  if (props.hardness != null) {
    rows.push(bar('💪 Hardness', `${props.hardness} / 10 on the Mohs scale`, props.hardness / 10));
  }
  const isGas = props.density < 0.01;
  rows.push(bar('🏋️ Heaviness (density)',
    isGas ? `${(props.density * 1000).toFixed(2)} g per liter — it's a gas, super light!` : `${props.density} g/cm³`,
    Math.min(props.density / 20, 1)));
  rows.push(bar('🔥 Melting point', `${props.meltC.toLocaleString()} °C`, (props.meltC + 273) / 3823));
  rows.push(bar('⚡ Carries electricity', CONDUCT_WORDS[props.conduct], props.conduct / 10));
  return rows.join('');
}

function bar(label, valueText, frac) {
  const pct = Math.max(2, Math.min(100, frac * 100));
  return `<div class="prop-row">
    <div class="prop-head"><span>${label}</span><span class="prop-val">${esc(valueText)}</span></div>
    <div class="bar"><span style="width:${pct}%"></span></div>
  </div>`;
}

function compareView(aNum, bNum) {
  setChrome('Compare Lab', { tab: 'compare' });
  const featured = DATA.featuredNumbers.map((n) => DATA.byNumber.get(n));
  const a = Number(aNum) || 26;
  const b = Number(bNum) || 13;

  const options = (sel) => featured.map((el) =>
    `<option value="${el.n}" ${el.n === sel ? 'selected' : ''}>${esc(el.name)} (${esc(el.s)})</option>`).join('');

  viewEl.innerHTML = `
    ${nova('This is how engineers think! Compare two elements and figure out which one you\'d build a plane, a bridge, or a wire from.')}
    <div class="compare-pickers">
      <select id="pick-a" aria-label="First element">${options(a)}</select>
      <select id="pick-b" aria-label="Second element">${options(b)}</select>
    </div>
    <div id="compare-result"></div>
  `;

  const draw = () => {
    const na = Number(viewEl.querySelector('#pick-a').value);
    const nb = Number(viewEl.querySelector('#pick-b').value);
    renderComparison(viewEl.querySelector('#compare-result'), na, nb);
  };
  viewEl.querySelector('#pick-a').addEventListener('change', () => { progress.compare(); draw(); });
  viewEl.querySelector('#pick-b').addEventListener('change', () => { progress.compare(); draw(); });
  draw();
}

function renderComparison(container, na, nb) {
  const elA = DATA.byNumber.get(na), elB = DATA.byNumber.get(nb);
  const kidA = DATA.featured[na], kidB = DATA.featured[nb];

  const cell = (el) => `<div class="compare-cell" style="--cat:${CATEGORIES[el.c].color}">
    <span class="sym">${esc(el.s)}</span>${esc(el.name)}</div>`;

  const verdicts = [];
  if (na === nb) {
    verdicts.push(`That's ${esc(elA.name)} vs… ${esc(elA.name)}! Pick two different elements for a real showdown.`);
  } else {
    const pA = kidA.props, pB = kidB.props;
    const denseRatio = pA.density > pB.density ? pA.density / pB.density : pB.density / pA.density;
    const denser = pA.density > pB.density ? elA : elB;
    const lighter = pA.density > pB.density ? elB : elA;
    verdicts.push(`<strong>${esc(denser.name)}</strong> is denser — a block of it weighs about <strong>${denseRatio >= 10 ? Math.round(denseRatio) : denseRatio.toFixed(1)}×</strong> as much as the same-size block of ${esc(lighter.name)}.`);
    const hotter = pA.meltC > pB.meltC ? elA : elB;
    const hp = Math.max(pA.meltC, pB.meltC), cp = Math.min(pA.meltC, pB.meltC);
    verdicts.push(`<strong>${esc(hotter.name)}</strong> handles heat better: it melts at <strong>${hp.toLocaleString()} °C</strong>, the other at ${cp.toLocaleString()} °C.`);
    if (pA.hardness != null && pB.hardness != null && pA.hardness !== pB.hardness) {
      const harder = pA.hardness > pB.hardness ? elA : elB;
      const softer = pA.hardness > pB.hardness ? elB : elA;
      verdicts.push(`<strong>${esc(harder.name)}</strong> is harder — it could scratch ${esc(softer.name)}.`);
    }
    if (pA.conduct !== pB.conduct) {
      const zappier = pA.conduct > pB.conduct ? elA : elB;
      verdicts.push(`<strong>${esc(zappier.name)}</strong> carries electricity better.`);
    }
  }

  container.innerHTML = `
    <div class="compare-grid">${cell(elA)}${cell(elB)}</div>
    <div class="compare-grid" style="margin-top:12px">
      <div class="card" style="margin:0"><h3>${esc(elA.s)} properties</h3>${propBars(kidA.props)}</div>
      <div class="card" style="margin:0"><h3>${esc(elB.s)} properties</h3>${propBars(kidB.props)}</div>
    </div>
    <div class="section-title">🏆 The verdict</div>
    ${verdicts.map((v) => `<div class="verdict">${v}</div>`).join('')}
  `;
}

function playView() {
  setChrome('Play', { tab: 'play' });
  viewEl.innerHTML = `
    ${nova('Time to play! Games are secretly the best way to remember what you learned. Don\'t tell anyone. 🤫')}
    <div class="hub-cards">
      <a class="hub-card" href="#/detective">
        <span class="hub-emoji">🔍</span>
        <h3>Material Detective</h3>
        <p>A mystery material, three clues, one answer. Can you crack the case?</p>
      </a>
      <a class="hub-card" href="#/match">
        <span class="hub-emoji">🧠</span>
        <h3>Material Match</h3>
        <p>Match each element to the real-world thing it's famous for.</p>
      </a>
    </div>
  `;
}

function detectiveView() {
  setChrome('Material Detective', { back: true, tab: 'play' });
  renderDetective(viewEl, DATA.games.detective);
}

function matchView() {
  setChrome('Material Match', { back: true, tab: 'play' });
  renderMatch(viewEl, DATA.games.match);
}

function experimentsView() {
  setChrome('The Lab', { tab: 'experiments' });
  viewEl.innerHTML = `
    ${nova('Real science you can do at home! One rule, no exceptions: show the experiment to a grown-up first and do it together.')}
    <div class="hub-cards">
      ${DATA.games.experiments.map((exp) => `
        <a class="hub-card" href="#/experiments/${exp.id}">
          <span class="hub-emoji">${exp.emoji}</span>
          <h3>${esc(exp.title)}</h3>
          <p>${esc(exp.teaches)}</p>
        </a>`).join('')}
    </div>
  `;
}

function experimentView(id) {
  const exp = DATA.games.experiments.find((e) => e.id === id);
  if (!exp) { location.hash = '#/experiments'; return; }
  progress.readExperiment(exp.id);
  setChrome(exp.title, { back: true, tab: 'experiments' });

  viewEl.innerHTML = `
    <div style="text-align:center;font-size:3rem">${exp.emoji}</div>
    <div class="exp-safety">🧑‍🔬 Ask a grown-up first — always! Extra note: ${esc(exp.safety)}</div>
    <div class="card"><h3>You'll learn about</h3><p>${esc(exp.teaches)}</p></div>
    <div class="card"><h3>You'll need</h3><div class="chips">${exp.materials.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div></div>
    <div class="card"><h3>Steps</h3><ol class="steps">${exp.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol></div>
    <div class="card"><h3>🔬 The science</h3><p>${esc(exp.science)}</p></div>
    <a class="big-btn secondary" href="#/experiments">Back to the Lab</a>
  `;
}

function badgesView() {
  setChrome('My Badges', { tab: 'badges' });
  const list = badges(DATA.featuredNumbers);
  const earned = list.filter((b) => b.earned).length;

  viewEl.innerHTML = `
    ${nova(earned === list.length
      ? 'EVERY badge?! You\'re officially a Periodic Legend. Go tell someone — you\'ve earned the bragging rights! 🌟'
      : `You've earned ${earned} of ${list.length} badges. Keep exploring, playing, and experimenting to unlock the rest!`)}
    <div class="badge-grid">
      ${list.map((b) => `
        <div class="badge-card ${b.earned ? '' : 'locked'}">
          <div class="badge-emoji">${b.emoji}</div>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.desc)}</p>
          <div class="badge-progress">${b.earned ? 'EARNED! ✅' : `${Math.min(b.have, b.need)} / ${b.need}`}</div>
        </div>`).join('')}
    </div>
    <p class="muted" style="margin-top:16px">Progress is saved on this device only — no accounts, nothing leaves your tablet.</p>
  `;
}

/* ---------- Router ---------- */

const routes = [
  { pattern: /^home$/, view: homeView },
  { pattern: /^element\/(\d+)$/, view: elementView },
  { pattern: /^compare(?:\/(\d+))?(?:\/(\d+))?$/, view: compareView },
  { pattern: /^play$/, view: playView },
  { pattern: /^detective$/, view: detectiveView },
  { pattern: /^match$/, view: matchView },
  { pattern: /^experiments$/, view: experimentsView },
  { pattern: /^experiments\/([\w-]+)$/, view: experimentView },
  { pattern: /^badges$/, view: badgesView }
];

function render() {
  const path = location.hash.replace(/^#\//, '') || 'home';
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) { route.view(...match.slice(1)); return; }
  }
  location.hash = '#/home';
}

window.addEventListener('hashchange', render);

loadData().then((data) => {
  DATA = data;
  render();
}).catch(() => {
  viewEl.innerHTML = '<div class="card"><h3>Oops</h3><p>Couldn\'t load the element data. Check your connection once, then the app works fully offline.</p></div>';
});
