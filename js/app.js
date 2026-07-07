// App entry: hash router + view renderers. Views are plain functions that
// fill #view; game logic lives in games.js, 3D in crystals.js.

import { loadData, CATEGORIES, gridPosition } from './data.js';
import { progress, badges, introSeen, markIntroSeen } from './progress.js';
import { renderDetective, renderMatch, renderFamily, renderHeavier } from './games.js';
import { mountCrystal, LATTICE_TITLES } from './crystals.js';
import { icon, iconFilled, CHAPTER_ICONS } from './icons.js';
import { initAuth } from './auth.js';
import { adminView } from './admin.js';

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

/* ---------- Intro: atoms → atomic number → why the table matters ---------- */

const PROTON_LINES = {
  1: 'the star fuel that fills the universe',
  2: 'the gas that makes balloons float',
  3: 'the metal inside your tablet’s battery',
  4: 'a metal used in space telescope mirrors',
  5: 'found in heat-proof kitchen glass',
  6: 'the builder of diamonds, pencils — and you',
  7: 'most of every breath you take',
  8: 'the part of air that keeps you alive',
  9: 'the tooth-protector in toothpaste',
  10: 'the gas that glows red in signs'
};

function atomSVG(protons) {
  const nucleons = [];
  const total = Math.min(protons * 2, 20);
  for (let i = 0; i < total; i++) {
    const angle = i * 2.4, r = 4.5 * Math.sqrt(i);
    const x = 60 + r * Math.cos(angle), y = 60 + r * Math.sin(angle);
    const isProton = i % 2 === 0;
    nucleons.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5"
      fill="${isProton ? '#ff7ab8' : '#8a93c4'}" stroke="rgba(0,0,0,.3)"/>`);
  }
  const electrons = [];
  const shell1 = Math.min(protons, 2), shell2 = Math.max(0, protons - 2);
  for (let i = 0; i < shell1; i++) {
    const a = (i / shell1) * Math.PI * 2;
    electrons.push(`<circle cx="${(60 + 32 * Math.cos(a)).toFixed(1)}" cy="${(60 + 32 * Math.sin(a)).toFixed(1)}" r="3.5" fill="#5ee0ff"/>`);
  }
  for (let i = 0; i < shell2; i++) {
    const a = (i / shell2) * Math.PI * 2 + 0.4;
    electrons.push(`<circle cx="${(60 + 50 * Math.cos(a)).toFixed(1)}" cy="${(60 + 50 * Math.sin(a)).toFixed(1)}" r="3.5" fill="#5ee0ff"/>`);
  }
  return `<svg viewBox="0 0 120 120" class="atom-svg" aria-hidden="true">
    ${shell1 ? '<circle cx="60" cy="60" r="32" fill="none" stroke="rgba(94,224,255,.35)" stroke-width="1.5"/>' : ''}
    ${shell2 ? '<circle cx="60" cy="60" r="50" fill="none" stroke="rgba(94,224,255,.25)" stroke-width="1.5"/>' : ''}
    ${nucleons.join('')}${electrons.join('')}
  </svg>`;
}

function introView() {
  setChrome('Start Here', { tab: 'learn' });
  markIntroSeen();
  let page = 0;
  let protons = 1;

  const pages = [
    {
      visual: () => `
        <div class="intro-art">
          <span style="color:var(--accent)">${icon('globe')}</span>
          <span style="color:var(--pink)">${icon('heart')}</span>
          <span style="color:var(--green)">${icon('gift')}</span>
          <span style="color:var(--sun)">${icon('star')}</span>
          <span style="color:#c9a7ff">${icon('rocket')}</span>
        </div>`,
      body: () => `
        <h2 class="intro-title">Everything is made of atoms</h2>
        <p class="intro-text">Your shoes, the ocean, pizza, planets, <strong>you</strong> — if you could
        zoom in far, far closer than any microscope, you'd find that everything is built from
        unbelievably tiny building blocks called <strong>atoms</strong>.</p>
        <p class="intro-text">How tiny? The dot on this letter <strong>i</strong> could hold
        billions of them.</p>`
    },
    {
      visual: () => atomSVG(3),
      body: () => `
        <h2 class="intro-title">Inside an atom</h2>
        <p class="intro-text">Every atom has a middle called the <strong>nucleus</strong>, made of
        <span class="tag tag-pink">protons</span> and <span class="tag tag-gray">neutrons</span>.
        Around it, tiny <span class="tag tag-cyan">electrons</span> whizz in a blur.</p>
        <p class="intro-text">Different atoms are just different combos of these three pieces.</p>`
    },
    {
      visual: () => '<div id="proton-widget"></div>',
      body: () => `
        <h2 class="intro-title">The magic number</h2>
        <p class="intro-text">Here's the big secret: <strong>counting protons tells you which
        element an atom is.</strong> That count is called the <strong>atomic number</strong>.
        Try it — add and remove protons:</p>`
    },
    {
      visual: () => `<div class="intro-art"><span style="color:var(--sun)">${icon('map')}</span></div>`,
      body: () => `
        <h2 class="intro-title">The great map of everything</h2>
        <p class="intro-text">Scientists found <strong>118</strong> different elements — and arranged
        them into the <strong>periodic table</strong>: a map where element families line up in columns,
        like a bookshelf sorted by superpower.</p>
        <p class="intro-text">Over 150 years ago, Dmitri Mendeleev spotted the pattern and even left
        gaps for elements nobody had found yet. He was right — they were discovered later!</p>
        <p class="intro-text">Every material ever made — every toy, rocket, and cupcake — is a recipe
        using this one map. Ready to explore it?</p>`
    }
  ];

  function protonWidget() {
    const el = DATA.byNumber.get(protons);
    return `
      ${atomSVG(protons)}
      <div class="proton-controls">
        <button class="round-btn" id="p-minus" aria-label="Remove a proton" ${protons <= 1 ? 'disabled' : ''}>−</button>
        <div class="proton-readout">
          <div class="proton-count">${protons} proton${protons > 1 ? 's' : ''}</div>
          <div class="proton-element" style="color:${CATEGORIES[el.c].color}">${esc(el.name)} (${esc(el.s)})</div>
          <div class="proton-line">${esc(PROTON_LINES[protons])}</div>
        </div>
        <button class="round-btn" id="p-plus" aria-label="Add a proton" ${protons >= 10 ? 'disabled' : ''}>+</button>
      </div>`;
  }

  function draw() {
    const last = page === pages.length - 1;
    viewEl.innerHTML = `
      <div class="intro-card">
        <div class="intro-visual">${pages[page].visual()}</div>
        <div class="intro-content">
          ${pages[page].body()}
          <div class="intro-nav">
            <button class="big-btn secondary" id="intro-back" ${page === 0 ? 'style="visibility:hidden"' : ''}>${icon('arrow-left')} Back</button>
            <div class="intro-dots">${pages.map((_, i) =>
              `<span class="dot ${i === page ? 'on' : ''}"></span>`).join('')}</div>
            ${last
              ? `<a class="big-btn" href="#/learn">${icon('rocket')} Start the journey</a>`
              : `<button class="big-btn" id="intro-next">Next ${icon('arrow-right')}</button>`}
          </div>
          ${last ? `<p class="muted" style="text-align:center;margin-top:12px"><a class="text-link" href="#/home">or jump straight to the periodic table ${icon('arrow-right')}</a></p>` : ''}
        </div>
      </div>`;

    if (page === 2) {
      const mount = () => {
        viewEl.querySelector('#proton-widget').innerHTML = protonWidget();
        viewEl.querySelector('#p-plus')?.addEventListener('click', () => { protons = Math.min(10, protons + 1); mount(); });
        viewEl.querySelector('#p-minus')?.addEventListener('click', () => { protons = Math.max(1, protons - 1); mount(); });
      };
      mount();
    }
    viewEl.querySelector('#intro-back')?.addEventListener('click', () => { page--; draw(); });
    viewEl.querySelector('#intro-next')?.addEventListener('click', () => { page++; draw(); });
  }
  draw();
}

/* ---------- Learn: the phased journey ---------- */

function chapterStates() {
  const visited = new Set(progress.get().visited);
  let prevComplete = true;
  return DATA.journey.map((ch) => {
    const done = ch.elements.filter((n) => visited.has(n)).length;
    const complete = done === ch.elements.length;
    const unlocked = prevComplete;
    prevComplete = complete;
    return { ch, done, complete, unlocked, visited };
  });
}

function learnView() {
  setChrome('Your Journey', { tab: 'learn' });
  const states = chapterStates();
  const metCount = states.reduce((sum, s) => sum + s.done, 0);
  const totalCount = states.reduce((sum, s) => sum + s.ch.elements.length, 0);
  const allDone = metCount === totalCount;

  // The next element to meet: first unvisited in the first incomplete unlocked chapter.
  let nextEl = null;
  for (const s of states) {
    if (s.unlocked && !s.complete) {
      nextEl = s.ch.elements.find((n) => !s.visited.has(n));
      break;
    }
  }

  const chaptersHtml = states.map((s, idx) => {
    const { ch } = s;
    if (!s.unlocked) {
      const prev = states[idx - 1].ch;
      return `
        <section class="chapter locked" id="ch-${ch.id}" aria-label="${esc(ch.title)} (locked)">
          <div class="chapter-head">
            <span class="chapter-emoji">${icon('lock')}</span>
            <div>
              <span class="chapter-kicker">Chapter ${idx + 1}</span>
              <h3 class="chapter-title">${esc(ch.title)}</h3>
              <p class="chapter-tag">Meet everyone in “${esc(prev.title)}” to unlock this chapter.</p>
            </div>
          </div>
        </section>`;
    }
    const cards = ch.elements.map((n) => {
      const el = DATA.byNumber.get(n);
      const kid = DATA.featured[n];
      const met = s.visited.has(n);
      const isNext = n === nextEl;
      return `
        <a class="journey-el ${met ? 'met' : ''} ${isNext ? 'next-up' : ''}" href="#/element/${n}">
          ${isNext ? '<span class="next-pill">up next</span>' : ''}
          <span class="journey-sym" style="--cat:${CATEGORIES[el.c].color}">${esc(el.s)}${met ? `<span class="met-tick">${icon('check')}</span>` : ''}</span>
          <span class="journey-name">${esc(el.name)}</span>
          <span class="journey-power">${esc(kid.superpower)}</span>
        </a>`;
    }).join('');
    return `
      <section class="chapter ${s.complete ? 'complete' : ''}" id="ch-${ch.id}">
        <div class="chapter-head">
          <span class="chapter-emoji">${CHAPTER_ICONS[ch.id] ? icon(CHAPTER_ICONS[ch.id]) : ch.emoji}</span>
          <div>
            <span class="chapter-kicker">Chapter ${idx + 1}${s.complete ? ' · complete' : ''}</span>
            <h3 class="chapter-title">${esc(ch.title)}</h3>
            <p class="chapter-tag">${esc(ch.tagline)}</p>
          </div>
          <span class="chapter-count">${s.done}/${ch.elements.length}</span>
        </div>
        <div class="journey-grid">${cards}</div>
      </section>`;
  }).join('');

  const earnedBadges = badges(DATA.featuredNumbers).filter((b) => b.earned);
  const timeline = states.map((s, idx) => `
    <button class="tl-item ${s.unlocked ? '' : 'tl-locked'} ${s.complete ? 'tl-complete' : ''}" data-ch="ch-${s.ch.id}">
      <span class="tl-icon">${s.unlocked ? icon(CHAPTER_ICONS[s.ch.id] || 'star') : icon('lock')}</span>
      <span class="tl-text"><span class="tl-title">${esc(s.ch.title)}</span>
      <span class="tl-count">${s.unlocked ? `${s.done}/${s.ch.elements.length} met` : 'Locked'}</span></span>
      ${s.complete ? `<span class="tl-check">${icon('check')}</span>` : ''}
    </button>`).join('');

  viewEl.innerHTML = `
    ${nova(allDone
      ? 'You met every featured element — every single one! The whole table is yours to explore now.'
      : metCount === 0
        ? 'This is your element journey! Meet everyone in a chapter to unlock the next one. No rush — curiosity sets the pace.'
        : `Welcome back, explorer! You've met <strong>${metCount} of ${totalCount}</strong> featured elements. Your next discovery is waiting below.`)}
    <div class="learn-layout">
      <aside class="learn-side">
        <a class="intro-banner" href="#/intro">
          <span class="hub-emoji">${icon('book-open')}</span>
          <span><strong>New here? Start with the 2-minute intro:</strong><br>
          What's an atom, and why does one little number change everything?</span>
          <span class="intro-banner-go">${icon('arrow-right')}</span>
        </a>
        <div class="journey-progress">
          <div class="journey-progress-label"><span>Elements met</span><span>${metCount} / ${totalCount}</span></div>
          <div class="bar"><span style="width:${Math.max(2, (metCount / totalCount) * 100)}%"></span></div>
        </div>
        <div class="journey-progress side-badges">
          <div class="journey-progress-label"><span>Badges earned</span><span>${earnedBadges.length} / 6</span></div>
          <div class="side-badge-row">${badges(DATA.featuredNumbers).map((b) =>
            `<span class="side-badge ${b.earned ? '' : 'locked'}" title="${esc(b.title)}">${icon(b.icon)}</span>`).join('')}</div>
        </div>
        <nav class="chapter-timeline" aria-label="Chapters">${timeline}</nav>
      </aside>
      <div class="learn-main">
        ${chaptersHtml}
        <p class="muted" style="margin-top:18px">Want to roam free? The full periodic table is always open in
        <a class="text-link" href="#/home">${icon('atom')} Explore</a> — chapters just pace the story.</p>
      </div>
    </div>
  `;

  viewEl.querySelectorAll('.tl-item').forEach((item) => {
    item.addEventListener('click', () => {
      viewEl.querySelector(`#${item.dataset.ch}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ---------- Views ---------- */

function homeView() {
  setChrome('Elements', { tab: 'home' });
  const visited = new Set(progress.get().visited);

  const tiles = DATA.elements.map((el) => {
    const { row, col } = gridPosition(el);
    return `<button class="el-tile ${visited.has(el.n) ? 'visited' : ''}"
      style="--row:${row};--col:${col};--cat:${CATEGORIES[el.c].color}"
      data-el="${el.n}" aria-label="${esc(el.name)}, element ${el.n}">
      <span class="sym">${esc(el.s)}</span><span class="num">${el.n}</span>
    </button>`;
  }).join('');

  const seriesTags = `
    <div class="series-tag" style="--row:6;--col:3">57–71</div>
    <div class="series-tag" style="--row:7;--col:3">89–103</div>`;

  const legend = Object.entries(CATEGORIES).map(([, meta]) =>
    `<span class="legend-item"><span class="legend-dot" style="background:${meta.color}"></span>${meta.label}</span>`).join('');

  viewEl.innerHTML = `
    ${nova('Welcome to the periodic table — every single thing in the universe is built from these! Tap any tile to meet an element: all 118 have full stories, superpowers, and secrets.')}
    <div class="table-layout">
      <div class="table-scroll"><div class="ptable">${tiles}${seriesTags}<div class="fblock-gap"></div></div></div>
      <aside class="table-side">
        <div class="preview-card" id="el-preview">
          <p class="muted">Hover over an element to take a peek — click to meet it properly.</p>
        </div>
        <div class="legend">${legend}</div>
      </aside>
    </div>
  `;

  const preview = viewEl.querySelector('#el-preview');
  const renderPreview = (n) => {
    const el = DATA.byNumber.get(n);
    const kid = DATA.featured[n];
    preview.innerHTML = `
      <div class="preview-head">
        <span class="journey-sym" style="--cat:${CATEGORIES[el.c].color}">${esc(el.s)}</span>
        <div>
          <div class="preview-name">${esc(el.name)}</div>
          <div class="preview-meta">#${el.n} · mass ${esc(el.m)}</div>
        </div>
      </div>
      <div class="preview-cat" style="color:${CATEGORIES[el.c].color}">${esc(CATEGORIES[el.c].label)}</div>
      <div class="preview-power"><span class="sp-label">SUPERPOWER</span>${esc(kid.superpower)}</div>
      <p class="muted">Click the tile for the full story ${icon('arrow-right')}</p>
    `;
  };

  viewEl.querySelectorAll('.el-tile').forEach((tile) => {
    tile.addEventListener('click', () => { location.hash = `#/element/${tile.dataset.el}`; });
    tile.addEventListener('pointerenter', () => renderPreview(Number(tile.dataset.el)));
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
      ${nova(`I'm still writing ${esc(el.name)}'s full story! Explore a star-marked ${iconFilled('star', 'icon-star')} element on the table for superpowers, games, and trivia.`)}
      <a class="big-btn secondary" href="#/home">Back to the table</a>
    `;
    return;
  }

  const facts = kid.facts.map((f) => `<li>${esc(f)}</li>`).join('');
  const trivia = kid.trivia.map((t) => `<li>${esc(t)}</li>`).join('');
  const uses = kid.uses.map((u) => `<span class="chip">${esc(u)}</span>`).join('');

  const crystalSection = kid.crystals ? `
    <div class="card crystal-wrap">
      <h3>${icon('gem')} Crystal viewer — spin me!</h3>
      <div class="crystal-tabs">
        ${kid.crystals.map((c, i) => `<button class="big-btn ${i ? 'secondary' : ''}" data-crystal="${c}">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('')}
      </div>
      <canvas id="crystal-canvas" aria-label="Rotating crystal structure"></canvas>
      <p class="crystal-hint" id="crystal-title"></p>
    </div>` : '';

  viewEl.innerHTML = `
    ${hero}
    <div class="superpower"><span class="sp-label">SUPERPOWER</span>${esc(kid.superpower)}</div>
    <div class="detail-cols">
      <div class="col-story">
        <div class="card"><h3>${icon('microscope')} Science facts</h3><ul>${facts}</ul></div>
        <div class="card metaphor"><h3>${icon('cloud')} Imagine it like…</h3><p>${esc(kid.imagine)}</p></div>
        <div class="card"><h3>${icon('scroll')} Origin story</h3><p>${esc(kid.origin)}</p></div>
        <div class="card"><h3>${icon('sparkles')} Wow trivia</h3><ul>${trivia}</ul></div>
      </div>
      <div class="col-tech">
        <div class="card"><h3>${icon('gauge')} Powers &amp; properties</h3>${propBars(kid.props)}</div>
        <div class="card"><h3>${icon('globe')} Where you'll find it</h3><div class="chips">${uses}</div></div>
        ${crystalSection}
        <div class="detail-actions" style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="big-btn" href="#/compare/${el.n}">${icon('scale')} Compare me!</a>
          <a class="big-btn secondary" href="#/home">Back to the table</a>
        </div>
      </div>
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
  // Elements only ever made a few atoms at a time have no measured bulk
  // properties — say so honestly instead of showing made-up bars.
  if (props.density == null && props.meltC == null) {
    return `<p class="mystery-props">${icon('help')} Mystery! Scientists can only make a few atoms
      of this element at a time — and they vanish in moments. Nobody has ever collected
      enough to measure how heavy, hard, or melty it is. Maybe someday <em>you</em> will.</p>`;
  }
  const rows = [];
  if (props.hardness != null) {
    rows.push(bar(`${icon('gem')} Hardness`, `${props.hardness} / 10 on the Mohs scale`, props.hardness / 10));
  }
  if (props.density != null) {
    const isGas = props.density < 0.01;
    rows.push(bar(`${icon('weight')} Heaviness (density)`,
      isGas ? `${(props.density * 1000).toFixed(2)} g per liter — it's a gas, super light!` : `${props.density} g/cm³`,
      Math.min(props.density / 20, 1)));
  }
  if (props.meltC != null) {
    rows.push(bar(`${icon('flame')} Melting point`, `${props.meltC.toLocaleString()} °C`, (props.meltC + 273) / 3823));
  }
  if (props.conduct != null) {
    rows.push(bar(`${icon('zap')} Carries electricity`, CONDUCT_WORDS[props.conduct], props.conduct / 10));
  }
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
  // Only elements with measured properties can go head-to-head.
  const featured = DATA.featuredNumbers
    .filter((n) => {
      const p = DATA.featured[n].props;
      return p.density != null && p.meltC != null && p.conduct != null;
    })
    .map((n) => DATA.byNumber.get(n));
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
    // Read back from the selects: if the URL named an unmeasurable element,
    // the browser falls back to the first option, which is always valid.
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
    <div class="section-title">${icon('trophy')} The verdict</div>
    ${verdicts.map((v) => `<div class="verdict">${v}</div>`).join('')}
  `;
}

function playView() {
  setChrome('Play', { tab: 'play' });
  viewEl.innerHTML = `
    ${nova('Time to play! Games are secretly the best way to remember what you learned. Don\'t tell anyone.')}
    <div class="hub-cards">
      <a class="hub-card" href="#/detective">
        <span class="hub-emoji">${icon('search')}</span>
        <h3>Material Detective</h3>
        <p>A mystery material, three clues, one answer. Can you crack the case?</p>
      </a>
      <a class="hub-card" href="#/match">
        <span class="hub-emoji">${icon('puzzle')}</span>
        <h3>Material Match</h3>
        <p>Match each element to the real-world thing it's famous for.</p>
      </a>
      <a class="hub-card" href="#/compare">
        <span class="hub-emoji">${icon('scale')}</span>
        <h3>Compare Lab</h3>
        <p>Put two elements head-to-head and think like an engineer.</p>
      </a>
      <a class="hub-card" href="#/family">
        <span class="hub-emoji">${icon('palette')}</span>
        <h3>Family Finder</h3>
        <p>Sort elements into their families — all 118 can appear!</p>
      </a>
      <a class="hub-card" href="#/heavier">
        <span class="hub-emoji">${icon('weight')}</span>
        <h3>Heavier or Lighter</h3>
        <p>Density showdown: which element wins? Build your streak!</p>
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

function familyView() {
  setChrome('Family Finder', { back: true, tab: 'play' });
  renderFamily(viewEl, DATA.elements, CATEGORIES);
}

function heavierView() {
  setChrome('Heavier or Lighter', { back: true, tab: 'play' });
  const contenders = DATA.featuredNumbers
    .filter((n) => DATA.featured[n].props.density != null)
    .map((n) => ({
      el: DATA.byNumber.get(n),
      density: DATA.featured[n].props.density,
      color: CATEGORIES[DATA.byNumber.get(n).c].color
    }));
  renderHeavier(viewEl, contenders);
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
    <div class="exp-cols">
      <div class="exp-col-a">
        <div class="exp-safety">${icon('shield-alert')} Ask a grown-up first — always! Extra note: ${esc(exp.safety)}</div>
        <div class="card"><h3>You'll learn about</h3><p>${esc(exp.teaches)}</p></div>
        <div class="card"><h3>You'll need</h3><div class="chips">${exp.materials.map((m) => `<span class="chip">${esc(m)}</span>`).join('')}</div></div>
      </div>
      <div class="exp-col-b">
        <div class="card"><h3>Steps</h3><ol class="steps">${exp.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol></div>
        <div class="card"><h3>${icon('microscope')} The science</h3><p>${esc(exp.science)}</p></div>
      </div>
    </div>
    <a class="big-btn secondary" href="#/experiments">Back to the Lab</a>
  `;
}

function badgesView() {
  setChrome('My Badges', { tab: 'badges' });
  const list = badges(DATA.featuredNumbers);
  const earned = list.filter((b) => b.earned).length;

  viewEl.innerHTML = `
    ${nova(earned === list.length
      ? 'EVERY badge?! You\'re officially a Periodic Legend. Go tell someone — you\'ve earned the bragging rights!'
      : `You've earned ${earned} of ${list.length} badges. Keep exploring, playing, and experimenting to unlock the rest!`)}
    <div class="badge-grid">
      ${list.map((b) => `
        <div class="badge-card ${b.earned ? '' : 'locked'}">
          <div class="badge-emoji">${icon(b.icon)}</div>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.desc)}</p>
          <div class="badge-progress">${b.earned ? `${icon('check')} EARNED` : `${Math.min(b.have, b.need)} / ${b.need}`}</div>
        </div>`).join('')}
    </div>
    <p class="muted" style="margin-top:16px">Progress is saved on this device only — no accounts, nothing leaves your tablet.</p>
  `;
}

/* ---------- Router ---------- */

const routes = [
  { pattern: /^learn$/, view: learnView },
  { pattern: /^intro$/, view: introView },
  { pattern: /^home$/, view: homeView },
  { pattern: /^element\/(\d+)$/, view: elementView },
  { pattern: /^compare(?:\/(\d+))?(?:\/(\d+))?$/, view: compareView },
  { pattern: /^play$/, view: playView },
  { pattern: /^detective$/, view: detectiveView },
  { pattern: /^match$/, view: matchView },
  { pattern: /^family$/, view: familyView },
  { pattern: /^heavier$/, view: heavierView },
  { pattern: /^experiments$/, view: experimentsView },
  { pattern: /^experiments\/([\w-]+)$/, view: experimentView },
  { pattern: /^badges$/, view: badgesView },
  { pattern: /^admin$/, view: () => { setChrome('Institution Dashboard', { back: true }); adminView(viewEl); } }
];

function render() {
  const path = location.hash.replace(/^#\//, '');
  if (!path) { location.hash = introSeen() ? '#/learn' : '#/intro'; return; }
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) { route.view(...match.slice(1)); return; }
  }
  location.hash = '#/learn';
}

window.addEventListener('hashchange', render);

window.addEventListener('elements-progress-synced', render);

loadData().then((data) => {
  DATA = data;
  render();
  initAuth(); // optional cloud layer; no-op on static hosting / offline
}).catch(() => {
  viewEl.innerHTML = '<div class="card"><h3>Oops</h3><p>Couldn\'t load the element data. Check your connection once, then the app works fully offline.</p></div>';
});
