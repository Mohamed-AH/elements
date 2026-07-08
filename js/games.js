// Material Detective and Material Match. Feedback is generous by design:
// wrong guesses unlock hints, never punish.

import { progress } from './progress.js';
import { icon } from './icons.js';

export function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.getElementById('confetti-layer');
  const colors = ['#5ee0ff', '#ffcf5c', '#ff7ab8', '#7dffa8', '#c9a7ff'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetto';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.5 + 's';
    layer.appendChild(c);
    setTimeout(() => c.remove(), 2500);
  }
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ---------- Material Detective ---------- */

export function renderDetective(container, cases) {
  const solved = progress.get().solved;
  const unsolved = cases.filter((c) => !solved.includes(c.id));
  const pool = unsolved.length ? unsolved : cases;
  startCase(container, cases, pool[Math.floor(Math.random() * pool.length)]);
}

function startCase(container, cases, kase) {
  let revealed = 1;

  function draw() {
    const solvedNow = progress.get().solved;
    const caseFiles = cases.map((c) => {
      const isSolved = solvedNow.includes(c.id);
      return `<li class="case-row ${isSolved ? 'solved' : ''}">
        <span class="case-emoji">${isSolved ? c.emoji : '❓'}</span>
        <span>${isSolved ? esc(c.material) : 'Unsolved mystery'}</span>
        ${isSolved ? `<span class="case-check">${icon('check')}</span>` : ''}
      </li>`;
    }).join('');

    container.innerHTML = `
      <div class="nova">
        <img src="assets/nova.svg" alt="">
        <div class="nova-bubble">A mystery material, detective! Read the clue${revealed > 1 ? 's' : ''} and make your guess. Wrong guesses unlock more clues.</div>
      </div>
      <div class="detective-layout">
        <div class="detective-main">
          <div class="case-emoji-big">${kase.emoji}</div>
          ${kase.clues.slice(0, revealed).map((clue, i) =>
            `<div class="clue-box"><span class="clue-n">Clue ${i + 1}:</span>${esc(clue)}</div>`).join('')}
          <div class="game-status" id="status"></div>
          <div class="options" id="options">
            ${shuffle(kase.options).map((o) => `<button class="option-btn" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
          </div>
          <div id="after" style="margin-top:16px"></div>
        </div>
        <aside class="card case-files">
          <h3>${icon('search')} Case files</h3>
          <p class="muted">${solvedNow.length} of ${cases.length} mysteries solved</p>
          <ul class="case-list">${caseFiles}</ul>
        </aside>
      </div>
    `;

    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => guess(btn));
    });
  }

  function guess(btn) {
    const status = container.querySelector('#status');
    if (btn.dataset.answer === kase.material) {
      btn.classList.add('correct');
      container.querySelectorAll('.option-btn').forEach((b) => { b.disabled = true; });
      status.textContent = 'Case closed!';
      progress.solve(kase.id);
      celebrate();
      container.querySelector('#after').innerHTML = `
        <div class="card"><h3>${icon('lightbulb')} The reveal</h3><p>${esc(kase.reveal)}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="big-btn" id="next-case">${icon('search')} Next mystery</button>
          <a class="big-btn secondary" href="#/element/${kase.element}">Meet the element</a>
        </div>`;
      container.querySelector('#next-case').addEventListener('click', () => renderDetective(container, cases));
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      if (revealed < kase.clues.length) {
        revealed += 1;
        setTimeout(() => {
          draw();
          container.querySelector('#status').textContent = 'Not quite — here comes another clue!';
        }, 400);
      } else {
        status.textContent = 'So close! Look at the clues again…';
      }
    }
  }

  draw();
}

/* ---------- Family Finder ----------
   Questions derive entirely from elements.json categories — authentic by
   construction, and it covers all 118 elements. Wrong answers get retries
   (never punish); only first-try correct counts toward the badge. */

export function renderFamily(container, elements, categories) {
  let sessionRight = 0;
  let sessionTotal = 0;

  function next() {
    const el = elements[Math.floor(Math.random() * elements.length)];
    const wrongs = shuffle(Object.keys(categories).filter((c) => c !== el.c)).slice(0, 3);
    const options = shuffle([el.c, ...wrongs]);
    let firstTry = true;

    container.innerHTML = `
      <div class="nova">
        <img src="assets/nova.svg" alt="">
        <div class="nova-bubble">Every element belongs to a family with shared superpowers — the table's columns and colors! Which family is this one from?</div>
      </div>
      <div class="family-el">
        <span class="journey-sym family-sym" style="--cat:${categories[el.c].color}">${esc(el.s)}</span>
        <div class="family-name">${esc(el.name)}</div>
        <div class="family-meta">element #${el.n}</div>
      </div>
      <div class="game-status" id="status">Sorted right this visit: ${sessionRight}${sessionTotal ? ` of ${sessionTotal}` : ''}</div>
      <div class="options family-options" id="options">
        ${options.map((c) => `
          <button class="option-btn" data-cat="${c}">
            <span class="legend-dot" style="background:${categories[c].color}"></span>${esc(categories[c].label)}
          </button>`).join('')}
      </div>
      <div id="after" style="margin-top:16px"></div>
    `;

    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const status = container.querySelector('#status');
        if (btn.dataset.cat === el.c) {
          btn.classList.add('correct');
          container.querySelectorAll('.option-btn').forEach((b) => { b.disabled = true; });
          sessionTotal += 1;
          if (firstTry) {
            sessionRight += 1;
            progress.familyCorrect();
            status.textContent = 'First try — expert sorting!';
            celebrate();
          } else {
            status.textContent = 'Found it!';
          }
          container.querySelector('#after').innerHTML = `
            <div class="card"><h3>${icon('lightbulb')} About this family</h3>
            <p>${esc(categories[el.c].kid)}</p></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="big-btn" id="next-el">Next element</button>
              <a class="big-btn secondary" href="#/element/${el.n}">Meet ${esc(el.name)}</a>
            </div>`;
          container.querySelector('#next-el').addEventListener('click', next);
        } else {
          firstTry = false;
          btn.classList.add('wrong');
          btn.disabled = true;
          status.textContent = 'Not that family — hint: check its color on the periodic table!';
        }
      });
    });
  }
  next();
}

/* ---------- Heavier or Lighter ----------
   Density duel using the sourced props in kid-content.json. Pairs with a
   density ratio under 1.15 are skipped so measurement uncertainty can
   never flip an answer. */

export function renderHeavier(container, contenders) {
  let streak = 0;

  function pickPair() {
    for (let tries = 0; tries < 60; tries++) {
      const a = contenders[Math.floor(Math.random() * contenders.length)];
      const b = contenders[Math.floor(Math.random() * contenders.length)];
      if (a.el.n === b.el.n) continue;
      const ratio = Math.max(a.density, b.density) / Math.min(a.density, b.density);
      if (ratio >= 1.15) return [a, b];
    }
    return [contenders[0], contenders[1]];
  }

  function next() {
    const [a, b] = pickPair();

    const cardHtml = (side) => `
      <button class="versus-card" data-n="${side.el.n}" style="--cat:${side.color}">
        <span class="versus-sym">${esc(side.el.s)}</span>
        <span class="versus-name">${esc(side.el.name)}</span>
        <span class="versus-density" data-density hidden>${side.density < 0.01
          ? `${(side.density * 1000).toFixed(2)} g per liter (gas!)`
          : `${side.density} g/cm³`}</span>
      </button>`;

    container.innerHTML = `
      <div class="nova">
        <img src="assets/nova.svg" alt="">
        <div class="nova-bubble">Same-size blocks of each — which one is <strong>denser</strong> (heavier for its size)? Tap your pick!</div>
      </div>
      <div class="game-status" id="status">Streak: ${streak} 🔥</div>
      <div class="versus-grid">${cardHtml(a)}${cardHtml(b)}</div>
      <div id="after" style="margin-top:16px;text-align:center"></div>
    `;

    const denser = a.density >= b.density ? a : b;
    container.querySelectorAll('.versus-card').forEach((card) => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.versus-card').forEach((c) => {
          c.disabled = true;
          c.querySelector('[data-density]').hidden = false;
          c.classList.add(Number(c.dataset.n) === denser.el.n ? 'correct' : 'dimmed');
        });
        const status = container.querySelector('#status');
        const won = Number(card.dataset.n) === denser.el.n;
        if (won) {
          streak += 1;
          progress.heavierStreak(streak);
          status.textContent = `Correct! Streak: ${streak} 🔥`;
          if (streak > 0 && streak % 5 === 0) celebrate();
        } else {
          streak = 0;
          status.textContent = `Oof — ${denser.el.name} wins this one. New streak starts now!`;
        }
        container.querySelector('#after').innerHTML =
          '<button class="big-btn" id="next-round">Next round</button>';
        container.querySelector('#next-round').addEventListener('click', next);
      });
    });
  }
  next();
}

/* ---------- Material Match ---------- */

export function renderMatch(container, pairs) {
  const round = shuffle(pairs).slice(0, 6);
  const cards = shuffle([
    ...round.map((p) => ({ kind: 'element', id: p.element, top: p.symbol, sub: p.name })),
    ...round.map((p) => ({ kind: 'object', id: p.element, top: p.emoji, sub: p.object }))
  ]);
  let selected = null;
  let matched = 0;

  container.innerHTML = `
    <div class="nova">
      <img src="assets/nova.svg" alt="">
      <div class="nova-bubble">Match each element to the real-world thing it's famous for! Tap an element, then tap its object.</div>
    </div>
    <div class="game-status" id="status"></div>
    <div class="match-grid" id="grid"></div>
    <div id="after" style="margin-top:16px;text-align:center"></div>
  `;

  const grid = container.querySelector('#grid');
  cards.forEach((card) => {
    const el = document.createElement('button');
    el.className = 'match-card';
    el.innerHTML = `<span class="mc-top">${esc(card.top)}</span><span class="mc-sub">${esc(card.sub)}</span>`;
    el.addEventListener('click', () => tap(el, card));
    grid.appendChild(el);
  });

  function tap(el, card) {
    const status = container.querySelector('#status');
    if (!selected) {
      selected = { el, card };
      el.classList.add('selected');
      return;
    }
    if (selected.el === el) {
      el.classList.remove('selected');
      selected = null;
      return;
    }
    if (selected.card.kind === card.kind) {
      selected.el.classList.remove('selected');
      selected = { el, card };
      el.classList.add('selected');
      return;
    }
    if (selected.card.id === card.id) {
      selected.el.classList.remove('selected');
      selected.el.classList.add('matched');
      el.classList.add('matched');
      matched += 1;
      status.textContent = ['Nice match!', 'You got it!', 'Brilliant!', 'Science whiz!'][matched % 4];
      if (matched === 6) {
        status.textContent = 'You matched them all!';
        progress.winMatch();
        celebrate();
        const after = container.querySelector('#after');
        after.innerHTML = `<button class="big-btn" id="again">${icon('rotate-ccw')} Play again</button>`;
        after.querySelector('#again').addEventListener('click', () => renderMatch(container, pairs));
      }
    } else {
      el.classList.add('nope');
      selected.el.classList.add('nope');
      status.textContent = 'Hmm, those two don’t go together. Try again!';
      const a = selected.el;
      setTimeout(() => { el.classList.remove('nope'); a.classList.remove('nope'); }, 400);
      selected.el.classList.remove('selected');
      selected = null;
    }
    if (selected && selected.el.classList.contains('matched')) selected = null;
  }
}
