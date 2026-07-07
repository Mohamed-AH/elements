# Elements 🧪⚛️

**Elements** is a playful, offline-first web app where kids (around age 9)
explore the periodic table through the materials of the real world. Every
element is a character with a *superpower* — a real scientific property —
connected to things kids already know: the tungsten in a light bulb, the
silicon in a game console, the calcium in their own bones. A friendly atom
mascot named **Nova** guides the way. No accounts, no ads, no internet needed
after the first visit.

## Features & learning goals

- **Start Here intro** — a four-page, two-minute story explaining atoms,
  protons, the atomic number (with a hands-on proton counter you can tap),
  and why the periodic table is "the great map of everything". Shown on
  first launch, always revisitable from Learn.
- **The Journey (Learn tab)** — all 118 elements are introduced in 25
  themed chapters (The Air Around You → The Edge of the Map) that unlock
  one by one as kids meet every element in the current chapter. Self-paced,
  curiosity-driven — and the full table stays freely explorable at all times.
- **Interactive periodic table** — all 118 elements, color-coded by family,
  every one with a full kid-friendly story. Elements science has never
  measured in bulk (astatine, francium, the superheavies) honestly say so
  with a "mystery" card instead of made-up numbers.
- **Element profiles** — superpowers, science facts, origin stories, wow
  trivia, and real-world uses. Facts and playful metaphors are always
  visually separated ("Science facts" vs. "Imagine it like…").
- **Compare Lab** — side-by-side property bars (hardness, density, melting
  point, conductivity) that teach kids to think like material engineers:
  *why is a plane aluminum and not lead?*
- **Material Detective 🔍** — 24 mysteries: deduce a material from three
  clues. Wrong guesses unlock hints; nothing punishes.
- **Material Match 🧠** — pair elements with the objects they're famous for
  (24-pair pool, 6 per round).
- **Family Finder 🎨** — sort any of the 118 elements into its family;
  questions derive straight from the verified dataset.
- **Heavier or Lighter 🏋️** — density-streak duels between the 97
  measurable elements (near-tie pairs excluded so answers are always fair).
- **Crystal viewer** — spin simplified 3D lattices (salt cube, diamond,
  graphite sheets, iron) rendered on Canvas 2D.
- **The Lab 🧪** — twelve parent-approved kitchen experiments (classic,
  documented demos only), each gated with "Ask a grown-up first" and a
  safety note.
- **Badges 🏅** — eight badges tracking exploration, games, and lab reading;
  stored only on the device.

Learning goals: recognize major elements and their signature properties,
connect elements to everyday materials, and build recall through play.

## Tech stack & architecture

**Zero dependencies. No build step.** Plain HTML + CSS + ES modules + Canvas 2D.

```
index.html            app shell (header, view container, tab bar)
manifest.webmanifest  PWA manifest (installable, standalone)
sw.js                 service worker — versioned cache-first precache
css/styles.css        design system (dark stage, bright category colors)
js/app.js             hash router + view renderers
js/data.js            data loading, category metadata, grid placement
js/games.js           Detective + Match + confetti
js/crystals.js        Canvas 2D orthographic 3D lattice viewer
js/progress.js        localStorage progress + badge logic
data/elements.json    basic data for all 118 elements
data/kid-content.json rich content for all 118 elements
data/games.json       detective cases, match pairs, experiments
data/journey.json     phased chapter progression for the Learn tab
tools/validate-data.mjs  data schema/cross-reference validator
docs/DESIGN.md        full design & architecture document
docs/SOURCES.md       citations + uncertainty flags for every data value
```

Key decisions (full rationale in [docs/DESIGN.md](docs/DESIGN.md)):

- **No framework** — the app is a handful of views over static JSON; staying
  browser-native keeps the payload tiny (< 200 KB) and fast on older iPads.
- **Hash routing** — works from any static host, no server config, and keeps
  the service-worker precache trivial.
- **Offline-first** — the service worker precaches *everything* on install.
  After one visit the app works with zero connectivity. To ship an update,
  bump `CACHE_VERSION` in `sw.js`; old caches are deleted on activate.
- **Privacy by construction** — no accounts, no analytics, no network calls
  after install. Progress lives in `localStorage` only.

## Install, run, test locally

You only need a static file server (service workers require `http(s)`, not `file://`):

```bash
# any of these:
python3 -m http.server 8000
npx serve .
```

Then open `http://localhost:8000`. There are no build commands, environment
variables, or dependencies.

**Testing:**

```bash
node tools/validate-data.mjs   # validates all data files (run after any content edit)
```

To verify offline behavior: load the app once, then in DevTools → Network set
"Offline" and reload — every screen should still work. On a tablet, use
"Add to Home Screen" to install it as a standalone app.

## Adding or updating element content

All content lives in `data/*.json` — no code changes needed:

1. **Basic element data** → `data/elements.json` (`n`, `s`, `name`, `m`, `c`,
   `p`, `g`). Categories must be one of the values listed in
   `tools/validate-data.mjs`.
2. **Featured (rich) content** → `data/kid-content.json`, keyed by atomic
   number. Required: `superpower`, `facts` (≥2), `imagine`, `origin`,
   `trivia`, `uses`, `props` (`hardness` may be `null` for gases/liquids;
   `density` g/cm³; `meltC`; `conduct` 0–10 qualitative).
3. **Games & experiments** → `data/games.json`.

4. **Journey chapters** → `data/journey.json`. Every featured element must
   appear in exactly one chapter (the validator enforces this), so new
   featured elements need a chapter home too.

**Rules:**
- `facts`, clues, and `reveal` texts must be *scientifically true* — check
  numeric properties against an authoritative source (IUPAC atomic weights,
  CRC Handbook for densities/melting points) before merging, and record the
  reference in `docs/SOURCES.md`. Citations live there — never in the JSON;
  the schema is frozen.
- Playful language goes in `imagine` only, and must never contradict the facts.
- Every experiment must be household-safe and include a `safety` note.
- Always run `node tools/validate-data.mjs` after editing.

> **Data provenance:** every value is cross-referenced in
> [docs/SOURCES.md](docs/SOURCES.md) (IUPAC/CIAAW atomic weights, CRC
> Handbook properties, RSC for history/uses), including explicit ⚠ flags on
> the handful of values where published sources vary. A final pass against
> the live references is recommended before public release — SOURCES.md
> lists the flagged rows to check first.

## Performance on tablets

- **Budget:** < 200 KB total, interactive in < 1s on a 2018-era iPad.
- Animations use `transform`/`opacity` only; `prefers-reduced-motion` disables
  them entirely (including confetti and crystal auto-spin).
- The crystal canvas caps `devicePixelRatio` at 2 and stops its
  `requestAnimationFrame` loop when the view is replaced.
- No raster images — icons and the mascot are inline SVG.
- Profile with DevTools → Performance while scrolling the table and spinning a
  crystal; both should hold 60fps.

## Contributing

- **New featured elements:** follow the content rules above; keep the voice
  curious and concrete, never condescending. Aim the reading level at ~9 years.
- **New experiments:** household materials only, "Ask a grown-up first"
  framing, and a `science` note that links the activity back to elements or
  material engineering.
- **New UI/components:** browser-native only (no new dependencies), touch
  targets ≥ 48px, works offline, respects reduced motion, and keeps text
  contrast ≥ 4.5:1.
- **Before any PR:** run `node tools/validate-data.mjs`, click through every
  tab, and test once with DevTools set to Offline.

See [docs/DESIGN.md](docs/DESIGN.md) for the full product and architecture
rationale, and [CLAUDE.md](CLAUDE.md) for current project state and next steps.
