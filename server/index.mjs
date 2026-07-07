// Elements companion server — serves the static PWA and adds OPTIONAL
// Google sign-in, cloud progress sync, and an institutional roster.
// The PWA is local-first: it works fully without this server or an account.
//
// Zero npm dependencies except the official `mongodb` driver, which is
// imported dynamically only when MONGODB_URI is set (Atlas M0 free tier).
// Without a URI, a JSON file store is used (local development).

import http from 'node:http';
import crypto from 'node:crypto';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8080);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
const DEV_FAKE_AUTH = process.env.DEV_FAKE_AUTH === '1';
const SESSION_DAYS = 30;

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[elements] SESSION_SECRET not set — sessions will not survive a restart.');
}

/* ---------------- storage ---------------- */
/* Interface: getUser(email) -> {name, picture, progress, updatedAt} | null
   putUser(email, doc), getRoster() -> {email: {name, addedAt, addedBy}},
   addStudent(email, entry), removeStudent(email), usersByEmails(emails). */

class FileStore {
  constructor(dir) {
    this.file = path.join(dir, 'store.json');
    this.dir = dir;
    this.data = { users: {}, roster: {} };
  }
  async init() {
    await mkdir(this.dir, { recursive: true });
    if (existsSync(this.file)) {
      this.data = JSON.parse(await readFile(this.file, 'utf8'));
      this.data.users ??= {}; this.data.roster ??= {};
    }
    return this;
  }
  async persist() {
    const tmp = this.file + '.tmp';
    await writeFile(tmp, JSON.stringify(this.data));
    await rename(tmp, this.file);
  }
  async getUser(email) { return this.data.users[email] || null; }
  async putUser(email, doc) { this.data.users[email] = doc; await this.persist(); }
  async getRoster() { return this.data.roster; }
  async addStudent(email, entry) { this.data.roster[email] = entry; await this.persist(); }
  async removeStudent(email) { delete this.data.roster[email]; await this.persist(); }
  async usersByEmails(emails) {
    return Object.fromEntries(emails.filter((e) => this.data.users[e]).map((e) => [e, this.data.users[e]]));
  }
  kind = 'file';
}

class MongoStore {
  constructor(uri) { this.uri = uri; }
  async init() {
    const { MongoClient } = await import('mongodb').catch(() => {
      throw new Error('MONGODB_URI is set but the mongodb driver is missing. Run: cd server && npm install');
    });
    this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 8000 });
    await this.client.connect();
    const db = this.client.db(process.env.MONGODB_DB || 'elements');
    this.users = db.collection('users');
    this.roster = db.collection('roster');
    return this;
  }
  async getUser(email) {
    const doc = await this.users.findOne({ _id: email });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest;
  }
  async putUser(email, doc) {
    await this.users.replaceOne({ _id: email }, { _id: email, ...doc }, { upsert: true });
  }
  async getRoster() {
    const rows = await this.roster.find({}).toArray();
    return Object.fromEntries(rows.map(({ _id, ...rest }) => [_id, rest]));
  }
  async addStudent(email, entry) {
    await this.roster.replaceOne({ _id: email }, { _id: email, ...entry }, { upsert: true });
  }
  async removeStudent(email) { await this.roster.deleteOne({ _id: email }); }
  async usersByEmails(emails) {
    const rows = await this.users.find({ _id: { $in: emails } }).toArray();
    return Object.fromEntries(rows.map(({ _id, ...rest }) => [_id, rest]));
  }
  kind = 'mongodb';
}

const store = process.env.MONGODB_URI
  ? await new MongoStore(process.env.MONGODB_URI).init()
  : await new FileStore(process.env.DATA_DIR || path.join(ROOT, 'data')).init();
console.log(`[elements] store: ${store.kind}`);

/* ---------------- sessions ---------------- */

const b64url = (s) => Buffer.from(s).toString('base64url');
const unb64url = (s) => Buffer.from(s, 'base64url').toString();
const hmac = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

function makeSession(email) {
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  const payload = `${b64url(email)}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

function readSession(req) {
  const cookie = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith('elsess='));
  if (!cookie) return null;
  const [emailB64, expStr, sig] = cookie.slice('elsess='.length).split('.');
  if (!emailB64 || !expStr || !sig) return null;
  const payload = `${emailB64}.${expStr}`;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmac(payload)), Buffer.from(sig))) return null;
  } catch { return null; }
  if (Number(expStr) < Date.now()) return null;
  return unb64url(emailB64);
}

function sessionCookie(req, value, maxAge) {
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  return `elsess=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/* ---------------- helpers ---------------- */

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(data);
}

function readBody(req, cap = 200_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > cap) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

// Only known fields, sane types/sizes — never trust the client blindly.
function sanitizeProgress(p) {
  const intList = (v, max) => Array.isArray(v)
    ? [...new Set(v.filter((x) => Number.isInteger(x) && x >= 1 && x <= 118))].slice(0, max) : [];
  const strList = (v, max) => Array.isArray(v)
    ? [...new Set(v.filter((x) => typeof x === 'string' && x.length <= 60))].slice(0, max) : [];
  const num = (v) => (typeof v === 'number' && v >= 0 && v <= 1e6) ? Math.floor(v) : 0;
  return {
    visited: intList(p.visited, 118),
    solved: strList(p.solved, 200),
    experimentsRead: strList(p.experimentsRead, 200),
    matchWins: num(p.matchWins),
    compares: num(p.compares),
    familyCorrect: num(p.familyCorrect),
    heavierBest: num(p.heavierBest)
  };
}

async function verifyGoogle(credential) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) throw new Error('token rejected');
  const info = await res.json();
  if (info.aud !== GOOGLE_CLIENT_ID) throw new Error('wrong audience');
  if (info.email_verified !== 'true' && info.email_verified !== true) throw new Error('email not verified');
  return { email: String(info.email).toLowerCase(), name: info.name || info.given_name || info.email };
}

async function meObject(email) {
  const user = await store.getUser(email);
  const roster = await store.getRoster();
  return {
    email,
    name: user?.name || email,
    admin: ADMIN_EMAILS.has(email),
    onRoster: Boolean(roster[email])
  };
}

const validEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;

/* ---------------- API ---------------- */

async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const sessionEmail = readSession(req);

  if (route === 'GET /api/health') {
    return send(res, 200, { ok: true, store: store.kind });
  }

  if (route === 'GET /api/config') {
    return send(res, 200, {
      googleClientId: GOOGLE_CLIENT_ID,
      authEnabled: Boolean(GOOGLE_CLIENT_ID) || DEV_FAKE_AUTH,
      devAuth: DEV_FAKE_AUTH
    });
  }

  if (route === 'POST /api/auth/google') {
    if (!GOOGLE_CLIENT_ID) return send(res, 400, { error: 'auth not configured' });
    const body = await readBody(req);
    let who;
    try { who = await verifyGoogle(String(body.credential || '')); }
    catch (e) { return send(res, 401, { error: e.message }); }
    const existing = await store.getUser(who.email);
    await store.putUser(who.email, {
      ...(existing || {}),
      name: who.name,
      progress: existing?.progress || null,
      updatedAt: existing?.updatedAt || null,
      lastLogin: Date.now()
    });
    res.setHeader('Set-Cookie', sessionCookie(req, makeSession(who.email), SESSION_DAYS * 86400));
    return send(res, 200, { user: await meObject(who.email) });
  }

  if (route === 'POST /api/auth/dev') {
    if (!DEV_FAKE_AUTH) return send(res, 404, { error: 'not found' });
    const body = await readBody(req);
    const email = String(body.email || '').toLowerCase();
    if (!validEmail(email)) return send(res, 400, { error: 'bad email' });
    const existing = await store.getUser(email);
    await store.putUser(email, {
      ...(existing || {}),
      name: String(body.name || email).slice(0, 80),
      progress: existing?.progress || null,
      updatedAt: existing?.updatedAt || null,
      lastLogin: Date.now()
    });
    res.setHeader('Set-Cookie', sessionCookie(req, makeSession(email), SESSION_DAYS * 86400));
    return send(res, 200, { user: await meObject(email) });
  }

  if (route === 'POST /api/auth/logout') {
    res.setHeader('Set-Cookie', sessionCookie(req, 'x', 0));
    return send(res, 200, { ok: true });
  }

  if (route === 'GET /api/me') {
    if (!sessionEmail) return send(res, 200, { user: null });
    return send(res, 200, { user: await meObject(sessionEmail) });
  }

  if (!sessionEmail) return send(res, 401, { error: 'sign in required' });

  if (route === 'GET /api/progress') {
    const user = await store.getUser(sessionEmail);
    return send(res, 200, { progress: user?.progress || null, updatedAt: user?.updatedAt || null });
  }

  if (route === 'PUT /api/progress') {
    const body = await readBody(req);
    const progress = sanitizeProgress(body.progress || {});
    const existing = await store.getUser(sessionEmail);
    await store.putUser(sessionEmail, {
      ...(existing || { name: sessionEmail }),
      progress,
      updatedAt: Date.now()
    });
    return send(res, 200, { ok: true });
  }

  /* ----- admin (institution) routes ----- */
  if (!ADMIN_EMAILS.has(sessionEmail)) return send(res, 403, { error: 'admin only' });

  if (route === 'GET /api/admin/students') {
    const roster = await store.getRoster();
    const emails = Object.keys(roster);
    const users = await store.usersByEmails(emails);
    const students = emails.map((email) => ({
      email,
      name: roster[email].name || users[email]?.name || email,
      addedAt: roster[email].addedAt,
      lastActive: users[email]?.updatedAt || users[email]?.lastLogin || null,
      progress: users[email]?.progress || null
    }));
    return send(res, 200, { students });
  }

  if (route === 'POST /api/admin/students') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!validEmail(email)) return send(res, 400, { error: 'valid email required' });
    await store.addStudent(email, {
      name: String(body.name || '').slice(0, 80),
      addedAt: Date.now(),
      addedBy: sessionEmail
    });
    return send(res, 200, { ok: true });
  }

  if (route === 'DELETE /api/admin/students') {
    const email = String(url.searchParams.get('email') || '').toLowerCase();
    if (!validEmail(email)) return send(res, 400, { error: 'valid email required' });
    await store.removeStudent(email);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'not found' });
}

/* ---------------- static files ---------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method' });
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || file.includes('..') || p.startsWith('/server') || p.startsWith('/data')) {
    return send(res, 404, { error: 'not found' });
  }
  const ext = path.extname(file).toLowerCase();
  if (!existsSync(file) || !MIME[ext]) return send(res, 404, { error: 'not found' });
  const noCache = ext === '.html' || p === '/sw.js';
  res.writeHead(200, {
    'Content-Type': MIME[ext],
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=300'
  });
  createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (err) {
    console.error('[elements]', err.message);
    if (!res.headersSent) send(res, 500, { error: 'server error' });
  }
}).listen(PORT, () => console.log(`[elements] listening on :${PORT} (auth: ${GOOGLE_CLIENT_ID ? 'google' : DEV_FAKE_AUTH ? 'DEV' : 'off'})`));
