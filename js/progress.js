// Progress and badges, stored locally only (no accounts, no network, no PII).
// localStorage access is wrapped so private-browsing modes degrade gracefully.

const KEY = 'elements-progress-v1';

const DEFAULTS = {
  visited: [],          // atomic numbers of viewed element profiles
  solved: [],           // detective case ids solved
  matchWins: 0,
  compares: 0,
  experimentsRead: []   // experiment ids opened
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: progress is session-only */ }
}

export const progress = {
  get: load,
  visit(n) {
    const s = load();
    if (!s.visited.includes(n)) { s.visited.push(n); save(s); }
  },
  solve(id) {
    const s = load();
    if (!s.solved.includes(id)) { s.solved.push(id); save(s); }
  },
  winMatch() {
    const s = load();
    s.matchWins += 1;
    save(s);
  },
  compare() {
    const s = load();
    s.compares += 1;
    save(s);
  },
  readExperiment(id) {
    const s = load();
    if (!s.experimentsRead.includes(id)) { s.experimentsRead.push(id); save(s); }
  }
};

const INTRO_KEY = 'elements-intro-seen';

export function introSeen() {
  try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return true; }
}

export function markIntroSeen() {
  try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* session-only */ }
}

export function badges(featuredNumbers) {
  const s = load();
  const featuredVisited = s.visited.filter((n) => featuredNumbers.includes(n)).length;
  return [
    { id: 'explorer', emoji: '🧭', title: 'Element Explorer', desc: 'Visit 10 different elements', have: s.visited.length, need: 10 },
    { id: 'sleuth', emoji: '🔍', title: 'Super Sleuth', desc: 'Solve 5 material mysteries', have: s.solved.length, need: 5 },
    { id: 'matcher', emoji: '🧠', title: 'Match Master', desc: 'Win a round of Material Match', have: s.matchWins, need: 1 },
    { id: 'engineer', emoji: '⚖️', title: 'Junior Engineer', desc: 'Compare 3 pairs of elements', have: s.compares, need: 3 },
    { id: 'scientist', emoji: '🧪', title: 'Kitchen Scientist', desc: 'Read 3 experiments', have: s.experimentsRead.length, need: 3 },
    { id: 'legend', emoji: '🌟', title: 'Periodic Legend', desc: `Visit all ${featuredNumbers.length} featured elements`, have: featuredVisited, need: featuredNumbers.length }
  ].map((b) => ({ ...b, earned: b.have >= b.need }));
}
