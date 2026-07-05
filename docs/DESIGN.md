# Elements — Design & Architecture

A Progressive Web App for nine-year-olds to explore the periodic table through
material science. This document is the planning-phase output: concept,
architecture, flows, delegation plan, risks, and the phased build plan.

---

## 1. App concept and learning structure

**Concept:** *"Every thing is made of something. Every something is made of
elements."* The app treats elements as characters with **superpowers**
(real physical properties) and connects each one to objects kids already know
(a soda can, a pencil, a balloon). A friendly atom mascot, **Nova**, guides
exploration.

**Learning structure — three loops:**

1. **Explore** (input): browse the periodic table, open element profiles,
   read superpowers, origin stories, and trivia. Rich content for ~22
   "featured" elements a nine-year-old can actually meet in daily life;
   honest basic facts (number, mass, category, discovery-level info) for all 118.
2. **Compare** (reasoning): the Compare Lab puts two elements side by side
   with visual property bars — hardness, density (weight), melting point,
   conductivity. This is the bridge from chemistry to *material engineering*:
   "Why is a plane made of aluminum and not lead?"
3. **Play & recall** (retrieval practice): Material Detective (deduce a
   material from clues), Material Match (pair elements with real objects),
   and badges that reward exploration. Retrieval, not rereading, is what
   makes facts stick.

**Content rule (non-negotiable):** scientific facts and playful metaphors are
visually separated. Facts appear under a "Science fact" label; metaphors under
"Imagine it like…". Nothing playful is allowed to contradict the science.

## 2. Information architecture and main user flows

```
Home (periodic table grid)
├── Element profile  (#/element/:number)
│     └── Crystal viewer (for elements with lattice data)
├── Compare Lab      (#/compare)
├── Material Detective (#/detective)
├── Material Match   (#/match)
├── Experiments      (#/experiments)   ← parent-approved, safety-first
└── My Badges        (#/badges)        ← progress tracking
```

**Primary flows:**
- *Curious browse:* Home → tap a colored tile → profile → "Compare me!" → Compare Lab.
- *Game session:* Home → Detective → 3 clues → guess → confetti + badge progress.
- *Kitchen science:* Experiments → pick one → checklist with "Ask a grown-up" gate.

Navigation is a persistent bottom tab bar (thumb-reachable on tablets),
5 large targets. Back is always available in the header. No dead ends.

## 3. UI/UX system for kids

- **Touch targets** ≥ 48px; the table tiles scale with viewport but never below tappable size.
- **Color = meaning:** each element category has one bright color used
  consistently on tiles, profile headers, and the legend.
- **Language:** short sentences, concrete nouns, second person ("You breathe
  argon right now!"). No baby talk.
- **Feedback:** immediate, generous, never punishing. Wrong guesses in games
  get a hint, not a buzzer. Confetti (CSS, cheap) on wins.
- **Mascot:** Nova appears with one tip per screen — guidance, not clutter.
- **Gamification:** 6 badges tied to learning behaviors (visit 10 elements,
  solve 5 mysteries, win a match round, compare 3 pairs, read 3 experiments,
  visit all featured elements). No streaks, no timers, no dark patterns.
- **Accessibility:** all interactions work with tap alone (no drag required),
  `prefers-reduced-motion` respected, semantic HTML, focus-visible styles,
  min 4.5:1 text contrast on dark theme.

## 4. Technical architecture and offline strategy

**Stack: zero-dependency, no-build-step web platform.**
Plain HTML + CSS + ES modules + Canvas 2D. Rationale:

| Decision | Why |
|---|---|
| No framework | App is ~8 views over static JSON; a framework adds download weight on school iPads and a build pipeline to maintain. Browser-native wins on the brief's performance + maintainability goals. |
| Hash routing | Works from any static host and from `file://`-adjacent contexts; no server rewrites needed; SW precache stays trivial (one HTML file). |
| Canvas 2D crystal viewer | A tiny orthographic 3D projector (~100 lines) renders rotating lattices smoothly on old iPads; WebGL/WebXR is overkill and a battery drain for this need. |
| JSON data files, not code | Content editors can update `data/*.json` without touching logic; validation script in `tools/` checks structure. |
| Service Worker: versioned cache-first precache | Everything the app needs (~all of it) is precached on install → true offline-first. Bump `CACHE_VERSION` to ship updates; old caches are deleted on activate. |
| localStorage for progress | Tiny, synchronous, survives offline; no accounts, no PII, COPPA-safe by construction. |

**Performance budget:** < 200 KB total transfer (no images beyond inline SVG),
first load interactive < 1s on a 2018 iPad, 60fps animations (transform/opacity
only), canvas capped at devicePixelRatio ≤ 2.

## 5. Screens, components, interactions

Screens: Home table, Element profile, Compare Lab, Detective, Match,
Experiments, Badges. Shared components: header (back + title), bottom nav,
Nova tip bubble, property bar, badge card, category legend, crystal canvas,
confetti layer.

Interactions: tap tile → profile; tap-tap pairing in Match (no drag);
clue-by-clue reveal in Detective; picker chips in Compare; rotate-by-drag
(pointer events) on crystal canvas with auto-spin fallback.

## 6. Delegation plan

Per the brief, the orchestrator (Fable 5) owns strategy, pedagogy, factual
review, architecture, and integration. Well-scoped mechanical work is
delegable to smaller models:

| Subtask | Delegate to | Validation by orchestrator |
|---|---|---|
| 118-element basic dataset (number/symbol/mass/category/period/group) | Haiku-class, from a fixed schema | Spot-check against IUPAC values; run `tools/validate-data.mjs` (schema + count + unique numbers) |
| Trivia/copy drafts for featured elements | Sonnet-class | Fact-check every claim; enforce fact/metaphor separation; tone pass |
| CSS scaffolding, icon SVGs | Haiku-class | Visual review, contrast check |
| Detective/Match case drafts | Sonnet-class | Verify each clue is scientifically true and age-appropriate |

In this session all work was done by the orchestrator directly (single-agent
execution is cheaper than cold-start delegation here), but the data files and
validation script are structured so future delegated content drops in safely.

## 7. Risks, edge cases, content safety

- **Kid safety:** experiments are limited to household-benign activities and
  every one starts with an "Ask a grown-up first" gate and a safety note.
  Hazard facts (mercury toxicity, sodium + water) are stated as *facts with a
  clear "never do this" framing*, never as activities.
- **Factual accuracy:** all numeric properties (mass, density, melting point,
  Mohs hardness) need a verification pass against a reference dataset (e.g.
  IUPAC / CRC Handbook) before any public release — flagged in README.
- **Privacy:** no accounts, no analytics, no network calls after install.
- **Offline edge cases:** SW install failure degrades gracefully (app still
  works online); cache version bump cleans old caches; localStorage wrapped in
  try/catch for private-browsing modes.
- **Device edge cases:** small phones get a scrollable table; reduced-motion
  users get static crystals and no confetti.

## 8. Phased build plan

- **MVP (this session):** table, profiles (22 featured + 118 basic), Compare
  Lab, Detective (10 cases), Match, 6 experiments, crystal viewer (NaCl,
  diamond, graphite), badges, mascot, offline PWA shell, data validator.
- **Beta:** sound effects (opt-in), more featured elements (goal: 40),
  Detective difficulty levels, parent dashboard page, i18n scaffolding,
  Lighthouse + axe CI, external fact-check of all data.
- **Polish:** element collection "sticker book", WebXR "hold a crystal" AR
  experiment behind a capability check, teacher mode (classroom codes,
  printable activity sheets), localization.
