# Project: Periodic Table Material Science PWA ("Elements")

Read this file at the start of every work session — it is the source of truth
for goals, constraints, and active tasks. Update it at the end of each phase.

## Current phase

**ALL 118 ELEMENTS FEATURED — task complete (2026-07-07).** Phases 0 + A–H
all done and pushed (one commit each). Final state: 118 featured entries in
kid-content.json, 25 journey chapters covering each element exactly once,
validator green, Chromium smoke + offline test green, SW CACHE_VERSION v4.
Also completed en route: Lucide SVG icon redesign (js/icons.js; emoji UI
chrome removed; content pictograms in games.json intentionally kept).

Key facts for future sessions:
- 21 elements have null props (At, Fr, Fm, Md, No, Lr, 104–118) → app shows
  the honest "mystery" card; Compare picker filters to the 97 measurable.
- Featured tile star was removed (everything is featured now).
- Chapter ids are mapped to icons in js/icons.js CHAPTER_ICONS — new
  chapters need an id there (or they fall back to their emoji field).
- Radioactive/synthetic content rules (preserved): decay = "atoms that
  slowly break apart, releasing energy — scientists use special
  protection"; radon → home test kits; no poisoning stories; synthesis/
  naming stories are the hook. Ra/Tl/As/Po framed as history + safety.

## Completed work (this task)

1. **Audit** — all 118 atomic weights match IUPAC/CIAAW abridged values;
   featured props match CRC. No data errors found; caveats flagged.
2. **Citations** — `docs/SOURCES.md`: per-value refs (IUPAC, CRC, RSC) +
   ⚠ flags (Ar, He, C, K, Sn, Hs, Lr, Mohs-for-metals). JSON schema frozen —
   citations deliberately live outside the JSON; `$comment`s point there.
3. **+6 featured elements** — Li 3, F 9, Mg 12, P 15, K 19, Ni 28 (28 total),
   exact existing schema.
4. **`data/journey.json`** (additive file) — 6 chapters covering all 28
   featured elements exactly once; validator extended to enforce this.
5. **Redesign** — `#/intro` (atoms → proton-counter → why the table matters;
   first-run landing, `elements-intro-seen` flag), `#/learn` (default view:
   chapter cards, sequential unlock via existing `visited` progress, "up
   next" pill), Compare moved into Play hub, CSS polish (aurora background,
   bordered cards, journey/intro components). Table itself untouched.
6. **Verified + shipped** — smoke tests + offline pass; README updated.

## Constraints (unchanged — read before editing)

- **JSON schema frozen:** never change field names/structure of data/*.json;
  citations only in docs/SOURCES.md; new data = new files.
- **Kid safety:** audience ~9; experiments household-benign + "Ask a grown-up
  first"; hazards framed "never do this", never as activities.
- **Accuracy:** facts true; metaphors only in `imagine`; uncertain values
  flagged in SOURCES.md, never guessed silently.
- **Tech:** zero deps, no build, offline-first, < 200 KB, no external
  fonts/CDNs. Bump `CACHE_VERSION` in sw.js whenever any precached file
  changes (currently **v2**), and add new files to its PRECACHE list.
- **Process:** `node tools/validate-data.mjs` after any data edit; commit +
  push per phase; smoke-test all tabs + offline before finishing.

## Preserved decisions

- Journey = additive JSON; unlock state derived from existing `visited`
  list (no new progress schema). Chapter unlocks when previous chapter's
  elements are all visited; chapter 1 always open; table always freely
  explorable (pacing, not gating).
- Tabs: Learn (#/learn, default) · Explore (#/home) · Play (detective,
  match, compare) · Lab · Badges. Empty hash → #/intro on first run only.
- Verification method: network egress blocked except GitHub in this env, so
  numeric checks were from model knowledge of IUPAC/CRC — disclosed in
  SOURCES.md; ⚠-flagged rows are the pre-release re-check list.
- Older decisions (no framework, hash routing, Canvas 2D crystals,
  fact/imagine separation, games never punish) all stand — see docs/DESIGN.md.

## Open questions / risks

- ⚠-flagged values (Ar, He, C, K, Sn, Hs, Lr) should be re-checked against
  live CIAAW/CRC before public release — needs an environment with network.
- iOS home-screen icons still SVG-only; PNGs (192/512 + apple-touch-icon)
  remain to be generated.
- Detective/Match don't yet use the 6 new featured elements as answers —
  optional content growth, not a defect.

## Desktop layout (2026-07-07)

Desktop optimization behind `@media (min-width:1100px)` (mobile/tablet
untouched below it; extra tile bump ≥1500px). Global: tab bar becomes a
fixed 232px left sidebar (pure CSS, same markup; `body{padding-left}`),
view max-width 1400px. Per-screen: table = grid + sticky right panel
(hover preview `#el-preview` filled by pointerenter JS + vertical legend);
Learn = split dashboard (sticky left: intro banner, progress, badge row,
clickable chapter timeline w/ scrollIntoView; right: chapters, ids
`ch-{id}`); intro card = 2fr/3fr visual|content split (pages refactored to
{visual, body}); element detail = `.detail-cols` (tech col left via
explicit grid placement, story col right — DOM order story-first so mobile
stacks narrative first); compare scaled up via CSS; detective =
`.detective-layout` w/ sticky Case Files aside (games.js) + 2×2 options;
lab/badges grids widened; experiment detail = `.exp-cols` 35/65 recipe.
SW CACHE_VERSION v5. User's reference screenshots are the root
`Screenshot 2026-07-07 *.png` files (commit 61ca0ca).

## Progress log

- 2026-07-05 — MVP built + verified (see git history).
- 2026-07-06 — Verification+redesign task, phases 1–6 complete and pushed.
- 2026-07-06/07 — All-118 task: Phase 0 (null-props infra), A (nobles/
  halogens), B (metalloids/3d), Lucide icon redesign, C (wild alkali),
  D (4d/gadgets/platinum group), E (refractory/heavies), F (lanthanides),
  G (actinides), H (superheavies), final cleanup. 118/118 featured,
  25 chapters, SOURCES.md phases A–H, SW v4. Full smoke + offline green.

## Next steps

- [ ] Pre-release: re-check ALL ⚠-flagged rows in docs/SOURCES.md against
      live CIAAW + CRC (needs networked environment); mark each row.
- [ ] Generate PNG icons (192/512 + apple-touch-icon), add to manifest +
      index.html + sw.js precache, bump CACHE_VERSION to v5.
- [ ] Optional: grow detective cases / match pairs using newly featured
      elements (Nd magnets, He→Xe engines, Bi crystals are good candidates).
