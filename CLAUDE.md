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

## Constraints (read before editing)

- **JSON schema frozen:** never change field names/structure of data/*.json;
  citations only in docs/SOURCES.md; new data = new files.
- **Kid safety:** audience ~9; experiments household-benign + "Ask a grown-up
  first"; hazards framed "never do this", never as activities.
- **Accuracy:** facts true; metaphors only in `imagine`; uncertain values
  flagged in SOURCES.md, never guessed silently.
- **Tech (frontend):** zero deps, no build, offline-first, < 200 KB, no
  external fonts/CDNs (exception: Google Identity Services script, loaded
  on demand, online + server-configured only). Bump `CACHE_VERSION` in
  sw.js whenever any precached file changes (currently **v7**), and add new
  files to its PRECACHE list.
- **Tech (server, amended 2026-07-07):** server/ is optional; only dep is
  `mongodb` (dynamically imported; file store without it). The app must
  ALWAYS work fully on pure-static hosting.
- **Privacy (amended 2026-07-07):** LOCAL-FIRST. No accounts/tracking by
  default; localStorage is source of truth; merge-on-login = union/max
  (never loses progress). Accounts = school-managed, admin-added rosters,
  no self-signup; only active when GOOGLE_CLIENT_ID is configured.
- **Process:** `node tools/validate-data.mjs` after any data edit;
  `node --test tests/server.test.mjs` after server changes;
  `cd tests && node --test e2e.test.mjs` before finishing any UI work
  (needs playwright-core — `cd tests && npm install`; Chromium via
  PLAYWRIGHT_CHROMIUM_PATH or /opt/pw-browsers/chromium). Commit + push
  per phase.
  ⚠ NEVER `rm -rf data` — that's the app's dataset (server store lives in
  server/data). This mistake happened once; restored from git.

## Testing (added 2026-07-07)

- `tools/validate-data.mjs` — data schema, counts, cross-references
  (118 elements/featured, journey coverage, games shapes).
- `tests/server.test.mjs` — API suite, zero deps, Node's built-in runner.
  Spawns the server with DEV_FAKE_AUTH + temp DATA_DIR. Covers: health/
  config, static serving + traversal/server-dir blocks, session guard,
  progress round-trip + sanitization (dupes/invalid/out-of-range dropped),
  me/logout, admin guard + roster CRUD + student summaries, unconfigured
  Google rejection, forged-cookie rejection.
- `tests/e2e.test.mjs` — 11 browser tests via playwright-core (the only
  test dep, isolated in tests/package.json; skips if Chromium missing).
  Covers: 118 tiles, featured profile + crystal canvas, mystery card,
  journey unlock (visit ch1 → ch2 unlocks), proton counter, detective
  solvable, match winnable (12/12), family finder + heavier round won,
  compare = 97 options, dev-auth sync, desktop sidebar + hover preview,
  offline via SW, zero console errors overall.
- All green as of 2026-07-07 (7 + 11 pass). E2E serves the app through
  server/index.mjs so auth paths are exercised; static-only behavior is
  additionally covered by the "chip hidden" logic in initAuth (no-op when
  /api/config unreachable).

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

## Games & Lab expansion — COMPLETE (2026-07-07)

All 4 phases done + pushed: detective 24 cases, match 24 pairs,
experiments 12, new games Family Finder (#/family, all 118 via
elements.json categories) and Heavier or Lighter (#/heavier, 97
measurable, ratio ≥1.15 guard), badges 8 (familyCorrect ≥15,
heavierBest ≥8 — additive progress fields), Play hub 5 cards, SW v6.
Authenticity rule held: every new clue/pair/experiment cited in
SOURCES.md "Games & Lab expansion"; quiz games derive from already-cited
data so they introduce no new facts. Verified in Chromium (both games
playable, counts correct, offline OK, zero console errors).

## Auth + Render + Admin dashboard — COMPLETE (2026-07-07)

All phases done + pushed. server/index.mjs (Google auth via tokeninfo,
HMAC sessions, progress API, roster; MongoDB Atlas via MONGODB_URI or
file store), js/auth.js (chip, GIS on demand, debounced sync,
merge-on-login), js/admin.js (#/admin dashboard: roster CRUD + stats +
per-student table), render.yaml, docs/DEPLOY.md, docs/LAUNCH.md (B2C+B2B
copy), SW v7 (/api/ + cross-origin bypass). E2E verified with
DEV_FAKE_AUTH: sync, cross-device merge, dashboard metrics, non-admin
guard, static-mode regression (chip hidden, app fully functional).

- [ ] Phase 1: server/index.mjs (zero npm deps: http/crypto/fetch) —
      static serving, POST /api/auth/google (tokeninfo verify, aud check),
      HMAC cookie sessions, GET/PUT /api/progress, roster CRUD
      /api/admin/students, GET /api/config|/api/me|/api/health.
      Stores: MongoDB Atlas M0 free tier via MONGODB_URI (official driver,
      dynamically imported — the ONLY npm dep, scoped to server/package.json;
      frontend stays zero-dep) with file fallback (DATA_DIR/store.json,
      atomic rename) when no URI, for local dev. Mongo Data API is EOL
      (2025) — driver is the supported path. DEV_FAKE_AUTH=1 enables
      /api/auth/dev for local/e2e only. render.yaml + .node-version (22).
- [ ] Phase 2: js/auth.js (header account chip, GIS script loaded on
      demand online-only, debounced PUT on progress-changed event,
      merge-on-login via progress.mergeProgress/replaceAll), progress.js
      event dispatch + merge helpers, index.html #account-slot,
      sw.js v7 (bypass /api/ + cross-origin).
- [ ] Phase 3: #/admin view (js/admin.js): guard via /api/me.admin;
      add/remove students; stats cards (students, active 7d, avg elements
      met, avg badges) + per-student table (reuses badges() logic).
      Admin = ADMIN_EMAILS env (comma-separated, lowercase). One
      institution per deployment (school runs own instance).
- [ ] Phase 4: docs/DEPLOY.md (Render free tier: blueprint, Google OAuth
      client origins, env vars, Upstash persistence — free disk is
      EPHEMERAL; cold start ~1 min after 15-min idle), README updates,
      child-privacy note (school-managed Workspace accounts, no
      self-signup; localStorage default). CLAUDE.md privacy constraint
      amended: "no accounts" → "no accounts by default; optional
      school-deployment accounts, local-first".
- [ ] Phase 5: e2e verify with DEV_FAKE_AUTH (student sync + admin
      dashboard), screenshots; docs/LAUNCH.md — B2C (parents/homeschool)
      AND B2B (schools/institutions) copy for Twitter/X + LinkedIn,
      honest claims only, no invented metrics; commits per phase.

## Scientists + SEO + a11y (started 2026-07-07) — resume at first unticked

- [ ] Phase 1: data/scientists.json (~50 people named in kid content;
      name/years/knownFor/bio/elements/aliases; living people use
      "b. YYYY"); validator coverage; SOURCES.md bio citations.
- [ ] Phase 2: js/scientists.js (gallery #/scientists w/ filter, bio
      #/scientists/:id w/ element chips + breadcrumb), linkify pass
      (longest-alias-first single regex) applied to facts/origin/trivia +
      intro Mendeleev; Learn sidebar banner entry; routes; SW v8
      (+scientists.json +js/scientists.js).
- [ ] Phase 3: SEO (document.title per route, OG/Twitter meta, JSON-LD
      LearningResource, robots.txt, sitemap.xml w/ hash-route caveat,
      noscript) + a11y (skip link, focus-to-main on route change,
      aria-current, role=status game feedback, :focus-visible, SR text for
      intro dots) + e2e tests for bio nav + a11y; README; close-out.

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
