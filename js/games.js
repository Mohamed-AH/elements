// Material Detective and Material Match. Feedback is generous by design:
// wrong guesses unlock hints, never punish.

import { progress } from './progress.js';

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
    container.innerHTML = `
      <div class="nova">
        <img src="assets/nova.svg" alt="">
        <div class="nova-bubble">A mystery material, detective! Read the clue${revealed > 1 ? 's' : ''} and make your guess. Wrong guesses unlock more clues.</div>
      </div>
      <div style="text-align:center;font-size:3rem">${kase.emoji}</div>
      ${kase.clues.slice(0, revealed).map((clue, i) =>
        `<div class="clue-box"><span class="clue-n">Clue ${i + 1}:</span>${esc(clue)}</div>`).join('')}
      <div class="game-status" id="status"></div>
      <div class="options" id="options">
        ${shuffle(kase.options).map((o) => `<button class="option-btn" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}
      </div>
      <div id="after" style="margin-top:16px"></div>
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
      status.textContent = 'Case closed! 🎉';
      progress.solve(kase.id);
      celebrate();
      container.querySelector('#after').innerHTML = `
        <div class="card"><h3>The reveal</h3><p>${esc(kase.reveal)}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="big-btn" id="next-case">Next mystery 🔍</button>
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
        status.textContent = 'You matched them all! 🎉';
        progress.winMatch();
        celebrate();
        const after = container.querySelector('#after');
        after.innerHTML = '<button class="big-btn" id="again">Play again 🎮</button>';
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
