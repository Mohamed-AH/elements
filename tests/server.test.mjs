// Companion-server API tests. Zero dependencies — runs with Node's
// built-in test runner:  node --test tests/server.test.mjs
// Spawns server/index.mjs with DEV_FAKE_AUTH and a temp file store.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8500 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;

let proc;
let dataDir;

// Minimal cookie jar per "browser".
function jar() {
  let cookie = '';
  return {
    async fetch(p, options = {}) {
      const res = await fetch(BASE + p, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(options.headers || {}) }
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return res;
    }
  };
}

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'elements-test-'));
  proc = spawn(process.execPath, [path.join(ROOT, 'server', 'index.mjs')], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DEV_FAKE_AUTH: '1',
      ADMIN_EMAILS: 'teacher@test.school',
      SESSION_SECRET: 'test-secret',
      DATA_DIR: dataDir,
      MONGODB_URI: '' // force file store
    },
    stdio: 'ignore'
  });
  // Wait for the server to come up.
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE + '/api/health');
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});

after(async () => {
  proc?.kill();
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

test('health and config report auth + store', async () => {
  const health = await (await fetch(BASE + '/api/health')).json();
  assert.equal(health.ok, true);
  assert.equal(health.store, 'file');
  const config = await (await fetch(BASE + '/api/config')).json();
  assert.equal(config.authEnabled, true);
  assert.equal(config.devAuth, true);
});

test('serves the app and its data, blocks server internals', async () => {
  assert.equal((await fetch(BASE + '/')).status, 200);
  assert.equal((await fetch(BASE + '/js/app.js')).status, 200);
  assert.equal((await fetch(BASE + '/data/elements.json')).status, 200);
  assert.equal((await fetch(BASE + '/server/index.mjs')).status, 404);
  assert.equal((await fetch(BASE + '/%2e%2e/etc/passwd')).status, 404);
  const sw = await fetch(BASE + '/sw.js');
  assert.match(sw.headers.get('cache-control') || '', /no-cache/);
});

test('progress requires a session', async () => {
  assert.equal((await fetch(BASE + '/api/progress')).status, 401);
});

test('dev login + progress round-trip with sanitization', async () => {
  const kid = jar();
  const login = await kid.fetch('/api/auth/dev', {
    method: 'POST',
    body: JSON.stringify({ email: 'kid@test.school', name: 'Test Kid' })
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.email, 'kid@test.school');

  const put = await kid.fetch('/api/progress', {
    method: 'PUT',
    body: JSON.stringify({
      progress: {
        visited: [8, 8, 26, 999, 'x'],       // dupes + invalid entries
        solved: ['copper-wire', 42],          // invalid entry
        matchWins: 3.9,
        compares: -5,                         // out of range
        familyCorrect: 2,
        heavierBest: 4,
        experimentsRead: ['density-tower'],
        hacked: 'nope'                        // unknown field
      }
    })
  });
  assert.equal(put.status, 200);

  const got = (await (await kid.fetch('/api/progress')).json()).progress;
  assert.deepEqual(got.visited.sort((a, b) => a - b), [8, 26]);
  assert.deepEqual(got.solved, ['copper-wire']);
  assert.equal(got.matchWins, 3);
  assert.equal(got.compares, 0);
  assert.equal(got.heavierBest, 4);
  assert.equal('hacked' in got, false);
});

test('me reflects session; logout clears it', async () => {
  const kid = jar();
  await kid.fetch('/api/auth/dev', { method: 'POST', body: JSON.stringify({ email: 'kid2@test.school' }) });
  let me = (await (await kid.fetch('/api/me')).json()).user;
  assert.equal(me.email, 'kid2@test.school');
  assert.equal(me.admin, false);
  await kid.fetch('/api/auth/logout', { method: 'POST' });
  me = (await (await kid.fetch('/api/me')).json()).user;
  assert.equal(me, null);
});

test('admin routes: guard, roster CRUD, student summaries', async () => {
  const kid = jar();
  await kid.fetch('/api/auth/dev', { method: 'POST', body: JSON.stringify({ email: 'kid@test.school' }) });
  assert.equal((await kid.fetch('/api/admin/students')).status, 403);

  const admin = jar();
  await admin.fetch('/api/auth/dev', { method: 'POST', body: JSON.stringify({ email: 'teacher@test.school', name: 'Ms Teacher' }) });
  const meAdmin = (await (await admin.fetch('/api/me')).json()).user;
  assert.equal(meAdmin.admin, true);

  assert.equal((await admin.fetch('/api/admin/students', {
    method: 'POST', body: JSON.stringify({ email: 'not-an-email' })
  })).status, 400);

  await admin.fetch('/api/admin/students', {
    method: 'POST', body: JSON.stringify({ email: 'kid@test.school', name: 'Test Kid' })
  });
  let students = (await (await admin.fetch('/api/admin/students')).json()).students;
  assert.equal(students.length, 1);
  assert.equal(students[0].email, 'kid@test.school');
  // Progress saved in the earlier test is linked to the roster entry.
  assert.deepEqual(students[0].progress.visited.sort((a, b) => a - b), [8, 26]);
  assert.ok(students[0].lastActive > 0);

  await admin.fetch('/api/admin/students?email=kid%40test.school', { method: 'DELETE' });
  students = (await (await admin.fetch('/api/admin/students')).json()).students;
  assert.equal(students.length, 0);
});

test('google auth rejects when unconfigured; bad sessions are ignored', async () => {
  const res = await fetch(BASE + '/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: 'x' })
  });
  assert.equal(res.status, 400); // GOOGLE_CLIENT_ID not set in tests
  const forged = await fetch(BASE + '/api/progress', {
    headers: { cookie: 'elsess=a2lkQHRlc3Quc2Nob29s.9999999999999.forged' }
  });
  assert.equal(forged.status, 401);
});
