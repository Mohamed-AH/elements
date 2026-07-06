# Project: Periodic Table Material Science PWA ("Elements")

Read this file at the start of every work session — it is the source of truth
for goals, constraints, and active tasks. Update it at the end of each phase.

## Current phase

**Task: feature ALL 118 elements (started 2026-07-06).** Add the remaining
90 elements to kid-content.json + journey.json in 8 phased batches, same
workflow as before (SOURCES.md rows → entries → chapter(s) → validator →
commit+push per phase). Roadmap below; tick as completed so a crashed
session can resume at the first unticked phase.

- [ ] Phase 0 — Infra: app + validator accept `null` density/meltC/conduct
      (elements never measured in bulk show an honest "mystery" card instead
      of bars; compare picker filters to measurable elements). No schema
      change — extends the existing hardness-null convention.
- [ ] Phase A (7): Ar Kr Xe Rn + Br I At. Chapters: "The Invisible Shields"
      (18,36,54,86), "The Fierce Cousins" (35,53,85). At = null props.
- [ ] Phase B (11): B Ga Ge As Se + Be Sc V Cr Mn Co. Chapters: "The
      In-Betweeners" (5,31,32,33,34), "The Color Brigade" (4,21,23,24,25,27).
- [ ] Phase C (6): Rb Sr Cs Ba Fr Ra. Chapter: "The Wild Bunch"
      (37,38,55,56,87,88). Fr = null props.
- [ ] Phase D (15): chapters "The Super-Steel Squad" (39,40,41,42,43),
      "The Gadget Gang" (48,49,51,52), "The Precious Six" (44,45,46,76,77,78).
- [ ] Phase E (6): chapters "The Heat Champions" (72,73,75),
      "Heavy Legends" (81,83,84).
- [ ] Phase F (15): lanthanides. "Rare Earths: The Magnet Makers" (57-61),
      "Rare Earths: The Glow Team" (62-66), "Rare Earths: The Laser Crew" (67-71).
- [ ] Phase G (15): actinides. "The Atomic Age" (89-93), "The Star Makers"
      (94-98), "The Vanishing Five" (99-103). Fm Md No Lr = null props.
- [ ] Phase H (15): superheavies, ALL null props, state "unknown".
      "Lab Legends I" (104-108), "Lab Legends II" (109-113),
      "The Edge of the Map" (114-118).
- [ ] Final: bump sw.js CACHE_VERSION → v3 (precached data changed), full
      Chromium smoke + offline test, README count updates, CLAUDE.md close-out.

Content rules for radioactive/synthetic elements: radioactivity explained
as "atoms that slowly break apart, releasing energy — handled by scientists
with special protection, never found loose at home"; radon framed around
home test kits (useful safety knowledge); no poisoning stories; synthesis
stories (labs, naming, atom-counting) are the hook.

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

## Progress log

- 2026-07-05 — MVP built + verified (see git history).
- 2026-07-06 — Verification+redesign task, phases 1–6 complete and pushed
  (one commit per phase). App re-verified end-to-end incl. offline.

## Next steps

- [ ] Pre-release: re-check ⚠-flagged rows in docs/SOURCES.md against live
      CIAAW + CRC; mark each verified row.
- [ ] Generate PNG icons (192/512 + apple-touch-icon), add to manifest +
      index.html + sw.js precache, bump CACHE_VERSION to v3.
- [ ] Optional: add detective cases / match pairs featuring Li, F, Mg, P, K,
      Ni; validator + smoke-test.
