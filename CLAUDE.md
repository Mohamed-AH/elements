# Project: Periodic Table Material Science PWA ("Elements")

Read this file at the start of every work session — it is the source of truth
for goals, constraints, and active tasks. Update it at the end of each phase
(state, decisions + rationale, next 2–3 concrete actions).

## Current goal

**Task: data verification + citations + redesign** (started 2026-07-06).
Verify all data, add citations (separate file — JSON schema must NOT change),
add missing featured elements, and redesign the experience: polished visuals,
an intro section (atoms → atomic number → why the table matters), and a
phased "journey" that unlocks element cards gradually.

## Current phase

- [x] Phase 1 — Audit: validator green; all 118 masses match IUPAC abridged
      values; featured props match CRC within rounding. Caveats to flag in
      SOURCES.md: Ar conventional weight, C allotrope mix (hardness=diamond,
      density=graphite, melt=sublimation), He melts only under pressure,
      Sn/K density ranges, Hs/Lr mass numbers, Mohs-for-metals approximate.
      NOTE: external fetches (CIAAW/PubChem/Wikipedia) blocked by network
      policy — verification is against model knowledge of IUPAC/CRC, stated
      honestly in SOURCES.md.
- [ ] Phase 2 — Citations: write docs/SOURCES.md (per-element values + refs +
      uncertainty flags). Update `$comment` in data JSONs to point at it
      ($comment is ignored by app+validator, safe).
- [ ] Phase 3 — Add 6 featured elements (Li 3, F 9, Mg 12, P 15, K 19, Ni 28)
      to data/kid-content.json using the EXACT existing schema. Run validator.
- [ ] Phase 4 — data/journey.json (NEW additive file, existing schemas
      untouched): 6 chapters over the 28 featured elements. Extend validator
      to cover it (each ref featured, no dupes, full coverage).
- [ ] Phase 5 — Redesign: new intro view (#/intro: atoms, protons=atomic
      number w/ interactive proton counter, why the table matters), new Learn
      view (#/learn: unlockable chapter cards, default landing), Compare moves
      into Play hub, CSS polish pass. Table itself unchanged (#/home).
      Bump sw.js CACHE_VERSION to v2 + precache journey.json.
- [ ] Phase 6 — Verify: validator + Chromium smoke test (all tabs, intro flow,
      journey unlock, offline) + screenshots; update README; final push.

## Constraints

- **JSON schema is frozen:** do not change field names/structure of
  elements.json / kid-content.json / games.json — the app depends on them.
  Citations live in docs/SOURCES.md only. New data goes in NEW files.
- **Kid safety first:** audience ~9. Experiments household-benign with "Ask a
  grown-up first" gates. Hazard facts framed "never do this", never activities.
- **Factual accuracy:** facts true; metaphors only in `imagine` fields; flag
  uncertain values in SOURCES.md rather than guessing.
- **Tech:** zero dependencies, no build step, offline-first (SW precache),
  < 200 KB, 60fps on a 2018 iPad. No external fonts/CDNs (offline + privacy).
- **Privacy:** no accounts/analytics/network-after-install. localStorage only.
- **Process:** run `node tools/validate-data.mjs` after any data edit;
  commit + push after EVERY phase so work survives a crash; smoke-test all
  tabs + offline before finishing.

## Journey design (preserved decision — implement exactly this)

Chapters unlock in order; a chapter unlocks when every element in the
previous chapter has been visited. Table stays freely explorable.
1. The Air Around You 🌬️ — H, He, N, O
2. The Stuff of Life 🌱 — C, Ca, P, K, S
3. Kitchen Chemistry 🧂 — Na, Cl, Mg, F
4. The Metal Workshop 🔧 — Fe, Al, Cu, Zn, Ni, Ti
5. The Tech Lab 💡 — Si, W, Ne, Li
6. The Treasure Vault 👑 — Au, Ag, Sn, Pb, Hg

Tabs after redesign: Learn (#/learn, default) · Explore (#/home, table as-is)
· Play (#/play: detective, match, + compare) · Lab · Badges. First run with no
progress → #/intro once (localStorage flag `elements-intro-seen`).

## Decisions and rationale (carried + new)

- No framework / no build step; hash routing; Canvas 2D crystals; fact vs
  `imagine` separation enforced in schema+UI; games never punish.
- **Citations separate from JSON** (docs/SOURCES.md): schema frozen by
  requirement; `$comment` fields may reference the doc but carry no data.
- **Journey as additive JSON file**: existing files keep exact schema; app
  code reads the new file. Unlock state derives from existing `visited`
  progress — no new progress schema needed.
- **Verification method honesty:** network egress blocked except GitHub, so
  numeric verification = model knowledge of IUPAC CIAAW abridged weights +
  CRC Handbook, disclosed in SOURCES.md with per-value uncertainty flags.

## Open questions / risks

- Sn density: published values 7.26–7.31 g/cm³ (white tin) — kept 7.31,
  flagged in SOURCES.md. K density: 0.86–0.89 — using 0.89 (CRC), flagged.
- Hs [269] vs [277]: IUPAC table value [269] kept, flagged.
- Live source verification still recommended before public release (blocked
  in this environment); SOURCES.md is structured to make that pass fast.

## Progress log

- 2026-07-05 — MVP built end-to-end and verified in headless Chromium
  (118 tiles, games winnable, zero console errors, offline works).
- 2026-07-06 — Phase 1 audit complete: dataset accurate vs IUPAC/CRC
  knowledge; caveat list drawn up; network-verification blocked (documented).

## Next steps

- [ ] Phase 2: write docs/SOURCES.md; touch `$comment`s; validator; commit+push.
- [ ] Phase 3: add 6 featured elements; validator; commit+push.
- [ ] Phase 4–6 per **Current phase** above.
