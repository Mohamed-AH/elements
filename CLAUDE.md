# Project: Periodic Table Material Science PWA ("Elements")

Read this file at the start of every work session — it is the source of truth
for goals, constraints, and active tasks. Update it at the end of each major
step (state, decisions + rationale, next 2–3 concrete actions).

## Current goal

MVP is built and verified. Next objective: content verification and beta
polish (see **Next steps**).

## Constraints

- **Kid safety first:** audience is ~9 years old. Experiments must be
  household-benign with "Ask a grown-up first" gates. Hazard facts are stated
  as facts with "never do this" framing, never as activities.
- **Factual accuracy:** science facts must be true; playful metaphors live
  only in clearly-labeled `imagine` fields and may never contradict facts.
  Numeric data needs verification against IUPAC/CRC before public release.
- **Tech:** zero dependencies, no build step, browser-native only. Must work
  fully offline after first load (service worker precache). Performance
  budget: < 200 KB, interactive < 1s on a 2018 iPad, 60fps animations.
- **Privacy:** no accounts, no analytics, no network calls after install.
  Progress in localStorage only.
- **Process:** plan before coding; run `node tools/validate-data.mjs` after
  any data edit; smoke-test all tabs + offline mode before pushing.

## Active tasks

- [x] Design doc (docs/DESIGN.md)
- [x] 118-element dataset + 22 featured element stories
- [x] App shell, router, periodic table, element profiles
- [x] Compare Lab, Material Detective, Material Match
- [x] Experiments, badges, mascot, crystal viewer
- [x] Service worker + manifest (verified offline in headless Chromium)
- [x] Data validator (tools/validate-data.mjs)
- [x] README.md
- [ ] External fact-check of all numeric data (IUPAC atomic weights, CRC
      densities/melting points) — owner: any agent; output: corrections PR
      + a `verified: true` note per element in kid-content.json
- [ ] PNG icons (192/512 + apple-touch-icon) — iOS home-screen icons don't
      support SVG; owner: any agent; output: assets/*.png + manifest update
- [ ] Grow featured elements from 22 toward 40 (candidates: Li, Mg, K, P, F,
      Ni, Cr, Pt, U, I) — follow content rules in README

## Decisions and rationale

- **No framework / no build step.** ~8 views over static JSON; browser-native
  keeps payload tiny, avoids toolchain rot, and meets the tablet perf budget.
- **Hash routing.** Static-host friendly; keeps SW precache to one HTML file.
- **Canvas 2D crystal viewer, not WebGL/WebXR.** A ~100-line orthographic
  projector is smooth on old iPads; WebXR deferred to polish phase behind a
  capability check.
- **Fact/metaphor separation enforced in the data schema** (`facts` vs
  `imagine`) and in the UI (differently-styled cards) — this is the content
  safety mechanism, keep it.
- **Featured-elements model.** Rich stories for elements kids can actually
  meet (22 now); honest "still writing this story" state for the rest. Better
  than thin auto-generated content for all 118.
- **Games never punish.** Wrong detective guesses unlock clues; wrong matches
  shake and reset. Retrieval practice works best low-stakes.
- **Single-agent execution this session.** Delegation-ready structure exists
  (data files + validator), but cold-start subagents cost more than they save
  at this size. Delegate content expansion once the schema is stable (it is).

## Progress log

- 2026-07-05 — MVP built end-to-end: design doc, all data files, app shell,
  7 views, 4 crystal lattices, SW + manifest, validator, README. Verified in
  headless Chromium: 118 tiles render, both games winnable, zero console
  errors, and the app fully renders with network disabled (SW precache works).
  Remaining: external fact-check, PNG icons, more featured elements.

## Next steps

- [ ] Fact-check pass: verify every number in data/*.json against IUPAC/CRC;
      fix and note sources in the JSON `$comment` fields.
- [ ] Generate 192/512 PNG + apple-touch-icon from assets/icon.svg and add to
      manifest + index.html + sw.js precache (bump CACHE_VERSION).
- [ ] Add 5 more featured elements (start with Li, Mg, K) following the
      content rules in README; run the validator; smoke-test.
