// Optional cloud layer: Google sign-in + progress sync. The app is
// local-first — everything works without this. Activates only when served
// by server/index.mjs with auth configured; in pure-static or offline use,
// initAuth() quietly does nothing.

import { progress, mergeProgress, replaceAll } from './progress.js';
import { icon } from './icons.js';

const slot = () => document.getElementById('account-slot');
let config = null;
let me = null;
let syncTimer = null;
let syncState = 'idle'; // idle | saving | saved | error

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export function currentUser() { return me; }

export async function initAuth() {
  if (!slot()) return;
  try {
    config = await api('/api/config');
  } catch {
    return; // static hosting or offline — stay local-only, no UI
  }
  if (!config.authEnabled) return;
  try {
    me = (await api('/api/me')).user;
  } catch { me = null; }
  if (me) await pullAndMerge();
  renderChip();

  window.addEventListener('elements-progress-changed', () => {
    if (!me) return;
    syncState = 'saving';
    renderChip();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushProgress, 1500);
  });

  // Dev/e2e hook: real UI uses Google; tests use this (404s in production).
  window.__devLogin = async (email, name) => {
    me = (await api('/api/auth/dev', { method: 'POST', body: JSON.stringify({ email, name }) })).user;
    await pullAndMerge();
    renderChip();
    window.dispatchEvent(new CustomEvent('elements-progress-synced'));
  };
}

async function pullAndMerge() {
  try {
    const remote = (await api('/api/progress')).progress;
    const merged = mergeProgress(progress.get(), remote || {});
    replaceAll(merged); // also triggers a push, keeping server current
  } catch { /* keep local */ }
}

async function pushProgress() {
  try {
    await api('/api/progress', { method: 'PUT', body: JSON.stringify({ progress: progress.get() }) });
    syncState = 'saved';
  } catch {
    syncState = 'error';
  }
  renderChip();
}

async function signIn() {
  if (config.devAuth && !config.googleClientId) {
    const email = prompt('DEV login — email:');
    if (email) await window.__devLogin(email, email.split('@')[0]);
    return;
  }
  await loadGis();
  window.google.accounts.id.initialize({
    client_id: config.googleClientId,
    callback: async (response) => {
      try {
        me = (await api('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential: response.credential })
        })).user;
        await pullAndMerge();
        renderChip();
        window.dispatchEvent(new CustomEvent('elements-progress-synced'));
      } catch {
        syncState = 'error';
        renderChip();
      }
    }
  });
  // Render the official button into a small popover (required UX for GIS).
  const pop = document.createElement('div');
  pop.className = 'gsi-pop';
  pop.addEventListener('click', (e) => { if (e.target === pop) pop.remove(); });
  pop.innerHTML = '<div class="gsi-pop-card"><p>Sign in to save your progress across devices.</p><div id="gsi-btn"></div><p class="muted">Progress on this device is kept either way.</p></div>';
  document.body.appendChild(pop);
  window.google.accounts.id.renderButton(pop.querySelector('#gsi-btn'), { theme: 'filled_blue', size: 'large', shape: 'pill' });
}

function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = () => reject(new Error('offline'));
    document.head.appendChild(s);
  });
}

async function signOut() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  me = null;
  renderChip();
}

function renderChip() {
  const el = slot();
  if (!el) return;
  if (!me) {
    el.innerHTML = `<button class="chip-btn" id="signin-btn">${icon('rocket')} Sign in</button>`;
    el.querySelector('#signin-btn').addEventListener('click', signIn);
    return;
  }
  const initial = (me.name || me.email)[0].toUpperCase();
  const sync = syncState === 'saving' ? 'saving…'
    : syncState === 'error' ? 'sync error — retrying on next change'
    : 'progress synced';
  el.innerHTML = `
    <div class="account-chip">
      ${me.admin ? `<a class="chip-btn" href="#/admin">${icon('gauge')} Dashboard</a>` : ''}
      <span class="avatar" title="${me.email} · ${sync}">${initial}</span>
      <button class="chip-btn subtle" id="signout-btn" title="Sign out">Sign out</button>
    </div>`;
  el.querySelector('#signout-btn').addEventListener('click', signOut);
}
