#!/usr/bin/env node
// Validates data/*.json structure and cross-references so content edits
// (including delegated/generated ones) can't silently break the app.
// Usage: node tools/validate-data.mjs

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

const CATEGORIES = ['alkali', 'alkaline', 'transition', 'post-transition', 'metalloid',
  'nonmetal', 'halogen', 'noble', 'lanthanide', 'actinide', 'unknown'];

// --- elements.json ---
const { elements } = read('data/elements.json');
check(elements.length === 118, `expected 118 elements, got ${elements.length}`);
const numbers = new Set();
for (const el of elements) {
  check(Number.isInteger(el.n) && el.n >= 1 && el.n <= 118, `bad atomic number: ${el.n}`);
  check(!numbers.has(el.n), `duplicate atomic number: ${el.n}`);
  numbers.add(el.n);
  check(typeof el.s === 'string' && /^[A-Z][a-z]{0,2}$/.test(el.s), `bad symbol for ${el.n}: ${el.s}`);
  check(typeof el.name === 'string' && el.name.length > 0, `missing name for ${el.n}`);
  check(typeof el.m === 'string' && el.m.length > 0, `missing mass for ${el.n}`);
  check(CATEGORIES.includes(el.c), `unknown category for ${el.n}: ${el.c}`);
  check(Number.isInteger(el.p) && el.p >= 1 && el.p <= 7, `bad period for ${el.n}`);
  const fBlock = el.c === 'lanthanide' || el.c === 'actinide';
  check(fBlock ? el.g === null : Number.isInteger(el.g) && el.g >= 1 && el.g <= 18,
    `bad group for ${el.n}: ${el.g}`);
}

// --- kid-content.json ---
const { featured } = read('data/kid-content.json');
for (const [key, kid] of Object.entries(featured)) {
  const n = Number(key);
  check(numbers.has(n), `featured key ${key} is not a valid element`);
  const where = `featured[${key}]`;
  check(typeof kid.superpower === 'string' && kid.superpower.length > 0, `${where}: missing superpower`);
  check(Array.isArray(kid.facts) && kid.facts.length >= 2, `${where}: needs >= 2 facts`);
  check(typeof kid.imagine === 'string' && kid.imagine.length > 0, `${where}: missing imagine`);
  check(typeof kid.origin === 'string' && kid.origin.length > 0, `${where}: missing origin`);
  check(Array.isArray(kid.trivia) && kid.trivia.length >= 1, `${where}: needs >= 1 trivia`);
  check(Array.isArray(kid.uses) && kid.uses.length >= 2, `${where}: needs >= 2 uses`);
  const p = kid.props || {};
  check(p.hardness === null || (typeof p.hardness === 'number' && p.hardness >= 0 && p.hardness <= 10), `${where}: bad hardness`);
  check(typeof p.density === 'number' && p.density > 0, `${where}: bad density`);
  check(typeof p.meltC === 'number' && p.meltC >= -273 && p.meltC <= 3550, `${where}: bad meltC`);
  check(Number.isInteger(p.conduct) && p.conduct >= 0 && p.conduct <= 10, `${where}: bad conduct`);
  if (kid.crystals) {
    check(kid.crystals.every((c) => ['salt', 'diamond', 'graphite', 'iron'].includes(c)), `${where}: unknown crystal`);
  }
}

// --- games.json ---
const games = read('data/games.json');
for (const c of games.detective) {
  const where = `detective[${c.id}]`;
  check(c.clues.length === 3, `${where}: needs exactly 3 clues`);
  check(c.options.length === 4, `${where}: needs exactly 4 options`);
  check(c.options.includes(c.material), `${where}: material "${c.material}" not among options`);
  check(numbers.has(c.element), `${where}: bad element ref ${c.element}`);
  check(typeof c.reveal === 'string' && c.reveal.length > 0, `${where}: missing reveal`);
}
check(games.match.length >= 6, `match needs >= 6 pairs, got ${games.match.length}`);
for (const p of games.match) {
  check(numbers.has(p.element), `match pair ${p.object}: bad element ref ${p.element}`);
}
for (const exp of games.experiments) {
  const where = `experiment[${exp.id}]`;
  check(typeof exp.safety === 'string' && exp.safety.length > 0, `${where}: missing safety note`);
  check(Array.isArray(exp.steps) && exp.steps.length >= 3, `${where}: needs >= 3 steps`);
  check(Array.isArray(exp.materials) && exp.materials.length >= 2, `${where}: needs >= 2 materials`);
  check(typeof exp.science === 'string' && exp.science.length > 0, `${where}: missing science note`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log(`✓ Data valid: ${elements.length} elements, ${Object.keys(featured).length} featured, ` +
  `${games.detective.length} detective cases, ${games.match.length} match pairs, ${games.experiments.length} experiments.`);
