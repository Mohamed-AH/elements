// Data loading and category metadata. All content lives in data/*.json so it
// can be edited and validated (tools/validate-data.mjs) without touching code.

export const CATEGORIES = {
  'alkali':          { label: 'Alkali metals', color: 'var(--cat-alkali)', kid: 'Soft, super-reactive metals. They go wild in water, so scientists store them under oil.' },
  'alkaline':        { label: 'Alkaline earth metals', color: 'var(--cat-alkaline)', kid: 'Reactive metals that build things — like the calcium in your bones.' },
  'transition':      { label: 'Transition metals', color: 'var(--cat-transition)', kid: 'The classic metals: strong, shiny, and great at carrying electricity.' },
  'post-transition': { label: 'Post-transition metals', color: 'var(--cat-post-transition)', kid: 'Softer, lower-melting metals like aluminum, tin, and lead.' },
  'metalloid':       { label: 'Metalloids', color: 'var(--cat-metalloid)', kid: 'Half metal, half not. Silicon is one — it runs every computer.' },
  'nonmetal':        { label: 'Nonmetals', color: 'var(--cat-nonmetal)', kid: 'The building blocks of life and air — carbon, oxygen, nitrogen and friends.' },
  'halogen':         { label: 'Halogens', color: 'var(--cat-halogen)', kid: 'Fierce germ-fighters and salt-makers. Powerful alone, useful when teamed up.' },
  'noble':           { label: 'Noble gases', color: 'var(--cat-noble)', kid: 'The loners. They almost never react with anything — but some glow beautifully.' },
  'lanthanide':      { label: 'Lanthanides', color: 'var(--cat-lanthanide)', kid: 'Rare-earth metals hiding inside magnets, screens, and headphones.' },
  'actinide':        { label: 'Actinides', color: 'var(--cat-actinide)', kid: 'Heavy, radioactive elements. Uranium powers some electricity plants.' },
  'unknown':         { label: 'Superheavy (mystery!)', color: 'var(--cat-unknown)', kid: 'Made atom-by-atom in labs and gone in a blink. Scientists are still learning about them.' }
};

let cache = null;

export async function loadData() {
  if (cache) return cache;
  const [elementsRes, kidRes, gamesRes, journeyRes] = await Promise.all([
    fetch('data/elements.json'),
    fetch('data/kid-content.json'),
    fetch('data/games.json'),
    fetch('data/journey.json')
  ]);
  const [elementsJson, kidJson, gamesJson, journeyJson] = await Promise.all([
    elementsRes.json(), kidRes.json(), gamesRes.json(), journeyRes.json()
  ]);

  const elements = elementsJson.elements;
  const byNumber = new Map(elements.map((el) => [el.n, el]));
  cache = {
    elements,
    byNumber,
    featured: kidJson.featured,
    games: gamesJson,
    journey: journeyJson.chapters,
    featuredNumbers: Object.keys(kidJson.featured).map(Number).sort((a, b) => a - b)
  };
  return cache;
}

// Grid placement in the standard 18-column layout. Lanthanides and actinides
// render as detached rows 9-10 below the main table.
export function gridPosition(el) {
  if (el.c === 'lanthanide') return { row: 9, col: el.n - 57 + 4 };
  if (el.c === 'actinide') return { row: 10, col: el.n - 89 + 4 };
  return { row: el.p, col: el.g };
}
