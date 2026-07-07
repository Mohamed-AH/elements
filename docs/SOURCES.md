# Data sources & verification notes

Citations for every numeric value and factual claim in `data/*.json`.
This file is deliberately **separate from the JSON** — the app schema is
frozen and carries no citation fields. Cross-reference by atomic number.

## Verification method (read this first)

- Values were checked against the references below **from model knowledge**
  on 2026-07-06; live access to CIAAW/PubChem/CRC was unavailable in the
  build environment (network policy allows GitHub only).
- Everything listed matches the cited references to the stated precision.
  Values with any real ambiguity are marked **⚠ FLAG** with the spread found
  in published sources — these are the ones to re-check first when doing the
  final pre-release pass with the references in hand.
- Recommended pre-release check order: ⚠ FLAG rows → atomic weights → the
  featured-element property table → narrative claims.

## References

- **[IUPAC]** IUPAC/CIAAW, *Standard Atomic Weights* (abridged to four
  significant digits, 2021 revision), ciaaw.org; and the IUPAC Periodic
  Table of Elements (bracketed mass numbers for elements without standard
  atomic weights).
- **[CRC]** *CRC Handbook of Chemistry and Physics*, 97th ed. (2016),
  Sec. 4, "Physical Constants of Inorganic Compounds" and "The Elements"
  (densities at ~20–25 °C, melting points at 1 atm).
- **[RSC]** Royal Society of Chemistry, *Periodic Table* (rsc.org/periodic-table)
  — discovery history, name origins, uses.
- **[MOHS]** Mohs hardness values for metals: commonly tabulated engineering
  values (e.g., Samsonov, *Handbook of the Physicochemical Properties of the
  Elements*). **Inherently approximate for metals** — treat every hardness
  as ±0.5 and qualitative. The in-app bar caps at 10 (diamond).
- **[COND]** The `conduct` field (0–10) is an **app-internal qualitative
  scale**, not a physical unit. It preserves the real ordering of electrical
  conductivity (Ag > Cu > Au > Al > W/Zn/Ni/Fe … > semiconductors >
  insulators/gases) per [CRC] resistivity tables. Do not cite it as data.

## elements.json — atomic weights & categories

- Atomic weights for elements 1–118: **[IUPAC]** abridged values.
  Elements with no stable isotopes use the IUPAC bracketed mass number of
  the most stable known isotope.
- **⚠ FLAG Ar (18) = 39.948**: IUPAC 2017+ gives an *interval* for argon;
  39.948 is the older conventional value, still standard in [CRC]. Fine for
  this app; note if re-deriving from ciaaw.org.
- **⚠ FLAG Hs (108) = [269]**: sources vary between [269] and [277]
  depending on which isotope's stability data is used; [269] matches the
  IUPAC table.
- **⚠ FLAG Lr (103) = [266]**: older tables show [262]; [266] matches the
  current IUPAC table.
- Categories follow the conventional IUPAC-style block/family coloring;
  109–118 marked `unknown` because their chemistry is experimentally
  unconfirmed. Po as post-transition metal and At as halogen follow common
  convention ([RSC]); both are sometimes classed as metalloids.

## kid-content.json — featured element properties

Density g/cm³ (gases: value ≈ g/L ÷ 1000 at 0–25 °C, 1 atm), melt °C, Mohs
hardness. Source is [CRC] unless noted; hardness per [MOHS].

| n | El | density | melt °C | hardness | notes |
|---|----|---------|---------|----------|-------|
| 1 | H | 0.00009 | −259 | — | gas at STP [CRC] |
| 2 | He | 0.00018 | −272 | — | **⚠ FLAG**: helium does NOT solidify at 1 atm; −272 °C is at ~2.5 MPa. UI shows it plainly; acceptable simplification, documented here. |
| 3 | Li | 0.534 | 180.5 | 0.6 | lightest metal [CRC] |
| 6 | C | 2.27 | 3550 | 10 | **⚠ FLAG (intentional mix)**: density = graphite; hardness = diamond; carbon *sublimes* (~3642 °C) rather than melting at 1 atm — 3550 is the conventional "melting point" figure. Kid copy says "same atoms, different arrangement", so the mix is pedagogically deliberate. |
| 7 | N | 0.00125 | −210 | — | gas [CRC] |
| 8 | O | 0.00143 | −218 | — | gas [CRC] |
| 9 | F | 0.0017 | −220 | — | gas [CRC] (1.696 g/L) |
| 10 | Ne | 0.0009 | −249 | — | gas [CRC] |
| 11 | Na | 0.97 | 98 | 0.5 | [CRC]; melt 97.79 |
| 12 | Mg | 1.74 | 650 | 2.5 | [CRC] |
| 13 | Al | 2.70 | 660 | 2.75 | [CRC]; melt 660.32 |
| 14 | Si | 2.33 | 1414 | 6.5 | [CRC] |
| 15 | P | 1.82 | 44 | — | white phosphorus [CRC]; red P differs (~2.2, no sharp melt) |
| 16 | S | 2.07 | 115 | 2 | alpha sulfur [CRC] |
| 17 | Cl | 0.0032 | −101 | — | gas [CRC] |
| 19 | K | 0.89 | 63.5 | 0.4 | **⚠ FLAG**: published density 0.86–0.89; 0.89 per [CRC] at 20 °C |
| 20 | Ca | 1.55 | 842 | 1.75 | [CRC] |
| 22 | Ti | 4.51 | 1668 | 6 | [CRC] |
| 26 | Fe | 7.87 | 1538 | 4 | [CRC] |
| 28 | Ni | 8.91 | 1455 | 4 | [CRC] |
| 29 | Cu | 8.96 | 1085 | 3 | [CRC]; melt 1084.62 |
| 30 | Zn | 7.13 | 420 | 2.5 | [CRC]; melt 419.53 |
| 47 | Ag | 10.5 | 962 | 2.5 | [CRC]; melt 961.78 |
| 50 | Sn | 7.31 | 232 | 1.5 | **⚠ FLAG**: white (β) tin density published 7.26–7.31; melt 231.93 [CRC] |
| 74 | W | 19.25 | 3422 | 7.5 | [CRC]; highest melting point of all metals |
| 79 | Au | 19.3 | 1064 | 2.75 | [CRC]; melt 1064.18 |
| 80 | Hg | 13.53 | −39 | — | liquid at RT [CRC]; melt −38.83 |
| 82 | Pb | 11.34 | 327 | 1.5 | [CRC]; melt 327.46 |

## kid-content.json — narrative claims (key facts per element)

One line per element; playful `imagine` text is metaphor by design and not
cited. All claims below verified against [RSC]/[CRC] unless noted.

- **H**: most abundant element in universe (~74% by mass, ~90% of atoms);
  stellar fusion; H₂O composition; big-bang origin — [RSC], standard cosmology.
- **He**: lighter than air; noble/inert; liquid He ≈ −269 °C, coolant for MRI
  magnets; discovered in solar spectrum 1868 (name: *helios*); non-flammable
  lifting gas; escapes Earth — [RSC].
- **Li**: lightest metal; Li-ion batteries in phones/EVs; one of three
  primordial big-bang elements (H, He, Li); named from *lithos* (stone),
  discovered 1817; crimson flame test — [RSC].
- **C**: diamond hardest natural material (Mohs 10) vs graphite soft;
  life is carbon-based; stellar nucleosynthesis; pencil "lead" is graphite — [RSC], [CRC].
- **N**: ~78% of air; fertilizer (Haber process context); liquid N₂ ≈ −196 °C — [CRC].
- **O**: ~21% of air; combustion requires it; most abundant element in
  Earth's crust; atmospheric O₂ from photosynthesis; rust = iron oxidation — [RSC], USGS crust data.
- **F**: most reactive element; fluoride hardens tooth enamel (fluorapatite);
  PTFE (Teflon) = C+F polymer; isolation by Moissan 1886 (Nobel 1906);
  name from *fluere* — [RSC]. Safety framing: pure F₂ is dangerous (true, stated as "lab-only").
- **Ne**: glows red-orange in discharge tubes; noble gas; isolated from
  liquefied air, 1898; name = "new"; only true "neon" signs are red-orange;
  rare in atmosphere — [RSC].
- **Na**: soft metal, knife-cuttable; violent water reaction (framed
  "never touch — lab-only"); NaCl = table salt; symbol from *natrium*;
  isolated 1807 by Davy (electrolysis); cubic NaCl crystals; sodium-vapor
  streetlights — [RSC].
- **Mg**: burns brilliant white (flares/fireworks/early camera flash);
  central atom of chlorophyll; light structural alloys; named after Magnesia,
  Greece; abundant in seawater; needed for muscle function — [RSC].
- **Al**: ~1/3 density of steel; self-passivating oxide layer; most abundant
  metal in Earth's crust; Napoleon III's aluminum cutlery (historical
  anecdote, well-documented); Hall–Héroult process 1886; infinitely
  recyclable, large energy savings — [RSC], The Aluminum Association.
- **Si**: sand/quartz = SiO₂; semiconductor, basis of chips; 2nd most
  abundant element in crust; glass from melted sand; Silicon Valley naming — [RSC], USGS.
- **P**: red P on matchbox strikers; bones/teeth = calcium phosphate; DNA
  backbone contains phosphate; white P glows/ignites (framed lab-only,
  "never touch"); discovered 1669 by Hennig Brand from urine — first
  documented element discovery; name = "light-bearer"; fertilizer NPK — [RSC].
- **S**: yellow volcanic solid; native element; sulfur compounds cause
  rotten-egg/skunk smells; vulcanization of rubber (Goodyear); in matches;
  fertilizer — [RSC].
- **Cl**: water/pool disinfection; Cl₂ is a toxic green-yellow gas (framed
  as adult-only handling); NaCl; discovered 1774 (Scheele); name from
  *chloros*; ocean salinity — [RSC].
- **K**: in bananas/potatoes; Na/K nerve & muscle signaling; reacts with
  water more violently than sodium (lab-only framing); symbol from *kalium*;
  first metal isolated by electrolysis (Davy 1807, from potash); name from
  "pot ash"; lilac flame test — [RSC].
- **Ca**: bones/teeth strength (hydroxyapatite); chalk/limestone/shells =
  CaCO₃; dairy source; name from *calx*; isolated 1808; White Cliffs of
  Dover; eggshells CaCO₃ — [RSC].
- **Ti**: steel-comparable strength at ~57% density (strength-to-weight);
  seawater corrosion resistance; biocompatible implants; named for Titans,
  discovered 1791; aerospace use — [RSC], ASM.
- **Fe**: most-used metal; steel = Fe+C; Earth's core mostly Fe →
  geomagnetic field; hemoglobin contains Fe, carries O₂; pre-smelting
  meteoritic iron tools (e.g., Tutankhamun's dagger); ferromagnetic; rust
  chemistry — [RSC], standard geophysics.
- **Ni**: US "nickel" coin is 75% Cu / 25% Ni; stainless steel alloying;
  Earth's core Fe-Ni; nitinol (Ni-Ti) shape-memory alloy; name from
  *Kupfernickel* ("devil's copper"), identified 1751 (Cronstedt);
  iron-nickel meteorites; ferromagnetic (Fe, Co, Ni) — [RSC], ASM.
- **Cu**: household wiring standard; green patina (Statue of Liberty);
  antimicrobial surfaces (EPA-registered); ~9,000-year-old artifacts;
  bronze = Cu+Sn (Bronze Age); brass = Cu+Zn — [RSC], EPA.
- **Zn**: galvanizing steel; brass; dietary zinc for immune function/wound
  healing; coins with zinc cores; ZnO sunscreen — [RSC].
- **Ag**: highest electrical conductivity of any element [CRC resistivity];
  mirror coatings; tarnish = Ag₂S from trace H₂S; *argentum*/Argentina;
  antibacterial wound dressings — [RSC], [CRC].
- **Sn**: bronze ≈ 5,000 yr (from ~3300 BCE); "tin" cans are tin-plated
  steel; "tin cry" = deformation twinning (audible crackle); solder alloys — [RSC], ASM.
- **W**: highest melting point of all metals, 3422 °C [CRC]; incandescent
  filaments; density ≈ 19.25 (≈ gold's 19.3); Swedish *tung sten* = "heavy
  stone"; symbol W from wolfram; drill bits/high-temp parts — [RSC], [CRC].
- **Au**: noble, does not oxidize/tarnish; extreme malleability (gold leaf;
  1 g → >1 km wire); electronics contacts; astronaut visor coatings;
  r-process origin (neutron-star mergers, LIGO/GW170817 era evidence) — [RSC], NASA.
- **Hg**: only metal liquid at room temperature; toxic (framed "look,
  never touch"; phased out of thermometers); density 13.53 → iron floats
  on it; cinnabar ore; *hydrargyrum*; hatters' mercury poisoning
  (historical) — [RSC], [CRC].
- **Pb**: dense, soft; X-ray/gamma shielding (dentist apron); toxicity →
  removed from paint/gasoline/pipes; Roman *plumbum* → "plumbing"; pencil
  "lead" never was lead; lead-acid car batteries — [RSC], EPA.

## games.json — claims

- Detective clue/reveal facts are subsets of the element claims above
  (copper conductivity & cost, He lift & non-flammability, graphite layers,
  NaCl cube crystals & Na/Cl hazard-vs-salt framing, Al foil/planes,
  Fe magnetism & rust, Si semiconductors from sand, Au nobility, W filament
  3422 °C, glass = melted sand SiO₂, amorphous because fast cooling) — [RSC], [CRC].
- Experiments teach standard, safe kitchen science: density layering
  (honey > water > oil), NaCl crystal growth (cubic habit), triboelectric
  static (balloon), copper-oxide dissolution in vinegar+salt (weak-acid +
  chloride), elemental iron in fortified cereal (magnet-extractable — a
  classic classroom demo), rust requires iron+water+oxygen and coatings
  block it (galvanizing analogy). All standard demonstrations; no citation
  disputes known.

## Batch 2: completing all 118 featured elements (phases A–H)

Same conventions as above: density g/cm³ [CRC], melt °C [CRC], Mohs
hardness [MOHS], `null` = **never measured** (element exists only as a few
short-lived atoms — displayed in-app as an honest "mystery" card, never
guessed). Narrative claims per [RSC] unless noted.

### Phase A — noble gases & halogens (Ar, Br, Kr, I, Xe, At, Rn)

| n | El | density | melt °C | notes |
|---|----|---------|---------|-------|
| 18 | Ar | 0.0018 | −189 | gas, 1.784 g/L [CRC]; 0.934% of air |
| 35 | Br | 3.10 | −7 | liquid at RT [CRC]; melt −7.2 |
| 36 | Kr | 0.0037 | −157 | gas, 3.749 g/L [CRC] |
| 53 | I | 4.93 | 114 | sublimes readily; melt 113.7 [CRC] |
| 54 | Xe | 0.0059 | −112 | gas, 5.894 g/L [CRC] |
| 85 | At | null | null | never seen in bulk; total crustal inventory commonly estimated at under ~30 g ("less than a spoonful"); At-210 half-life 8.1 h |
| 86 | Rn | 0.0097 | −71 | gas, 9.73 g/L [CRC]; radioactive, Rn-222 half-life 3.8 d |

Claims: Ar third most abundant air gas, name *argos* (idle), Rayleigh &
Ramsay 1894, bulb/welding fill [RSC]. Br one of two liquid elements, name
*bromos* (stench), Balard 1826 age 23, AgBr photography, Dead Sea brines
[RSC]. Kr name *kryptos* (hidden), Ramsay & Travers 1898, meter defined by
Kr-86 line 1960–1983 (BIPM) [RSC]. I violet vapor/name, Courtois 1811
seaweed ash, thyroid/iodized salt, starch test [RSC]. Xe name *xenos*
(stranger), ion propulsion (NASA Dawn), HID lamps, anesthesia [RSC/NASA].
At rarest natural element, name *astatos* (unstable), synthesized Berkeley
1940, At-211 targeted alpha-therapy research [RSC]. Rn from radium decay,
Dorn 1900, home test kits/mitigation fans (EPA), heaviest noble gas [RSC/EPA].

### Phase B — metalloids & 3d metals (Be, B, Sc, V, Cr, Mn, Co, Ga, Ge, As, Se)

| n | El | density | melt °C | hardness | notes |
|---|----|---------|---------|----------|-------|
| 4 | Be | 1.85 | 1287 | 5.5 | [CRC] |
| 5 | B | 2.34 | 2077 | 9.3 | β-rhombohedral [CRC] |
| 21 | Sc | 2.99 | 1541 | — | [CRC] |
| 23 | V | 6.11 | 1910 | 7 | [CRC]; Mohs ~6.7 rounded |
| 24 | Cr | 7.19 | 1907 | 8.5 | [CRC] |
| 25 | Mn | 7.3 | 1246 | 6 | [CRC] |
| 27 | Co | 8.86 | 1495 | 5 | [CRC] |
| 31 | Ga | 5.91 | 30 | 1.5 | melt 29.76 [CRC] |
| 32 | Ge | 5.32 | 938 | 6 | [CRC] |
| 33 | As | 5.75 | 817 | 3.5 | **⚠ FLAG**: gray As sublimes at 1 atm (~614 °C); 817 °C is the triple-point melt under pressure — conventional table value |
| 34 | Se | 4.81 | 221 | 2 | gray Se [CRC] |

Claims: Be JWST beryllium mirrors (NASA), beryl→emerald/aquamarine, 1798
Vauquelin, sweet-tasting "glucinium", X-ray windows, dust toxicity [RSC/NASA].
B borosilicate glass, borax-glue slime crosslinking, plant micronutrient,
green flame, B₄C armor, 1808 isolation [RSC]. Sc Mendeleev eka-boron,
Nilson 1879, Al-Sc alloys [RSC]. V Model T vanadium steel, colorful
oxidation states, Vanadis naming, del Río 1801 / Sefström 1830, ascidian
blood, flow batteries [RSC]. Cr *chroma*, ruby/emerald chromophore,
electroplating, stainless steel, 1797 Vauquelin, school-bus "chrome yellow"
[RSC]. Mn Lascaux manganese-oxide pigments (~17k yr), Hadfield steel,
seafloor nodules, trace nutrient, 1774 Gahn [RSC]. Co kobold naming, Brandt
1735, cobalt blue, B12, Li-ion cathodes, ferromagnetic trio, CoCl₂
thermochromic ink, superalloys [RSC]. Ga melt-in-hand 29.8 °C, GaN blue LED
(2014 Nobel), eka-aluminum 1875, liquid range to ~2200 °C [RSC]. Ge first
transistor 1947 (Bell Labs), IR optics, fiber-optic dopant, eka-silicon
1886 Winkler [RSC]. As toxicity/forensics (Marsh test 1836), GaAs
electronics, Paris green history, Albertus Magnus ~1250 [RSC]. Se
photoconductivity (xerography), Berzelius 1817, Brazil nuts, red glass,
Selene naming [RSC].

### Phase C — heavy alkali & alkaline earth (Rb, Sr, Cs, Ba, Fr, Ra)

| n | El | density | melt °C | hardness | notes |
|---|----|---------|---------|----------|-------|
| 37 | Rb | 1.53 | 39 | 0.3 | melt 39.3 [CRC] |
| 38 | Sr | 2.64 | 777 | 1.5 | [CRC] |
| 55 | Cs | 1.93 | 28 | 0.2 | melt 28.5 [CRC] |
| 56 | Ba | 3.62 | 727 | 1.25 | [CRC] |
| 87 | Fr | null | null | null | never isolated in weighable amounts; Fr-223 half-life 22 min; crustal inventory ~tens of grams |
| 88 | Ra | 5.5 | 700 | null | [CRC]; Ra-226 half-life 1600 y |

Claims: Rb spectroscopic discovery 1861 Bunsen/Kirchhoff, *rubidus* red
lines, GPS rubidium clocks [RSC/NIST]. Sr Strontian (Scotland) naming, red
pyrotechnics, SrAl₂O₄ glow pigments, bone chemistry, CRT X-ray blocking
[RSC]. Cs SI second = 9,192,631,770 Cs-133 oscillations (BIPM), golden
color, melt 28.5 °C, first spectroscope discovery 1860, *caesius* [RSC/BIPM].
Ba *barys* (heavy), BaSO₄ contrast meals (insoluble → safe), green
fireworks, Davy 1808, Bologna stone [RSC]. Fr Perey 1939 (Curie's
assistant), last naturally-discovered element, 22-min half-life, first
woman in French Academy of Sciences [RSC]. Ra Curies 1898, ~1M× uranium
activity, radioluminescence, dial-painter history (framed as safety
lesson), Curie's radioactive notebooks, dual Nobels [RSC].

| Where | Field | Status |
|---|---|---|
| elements.json | all masses | ✅ matches [IUPAC] abridged |
| elements.json | Ar, Hs, Lr | ⚠ flagged above |
| kid-content | density/melt/hardness | ✅ [CRC]/[MOHS]; ⚠ He, C, K, Sn flagged above |
| kid-content | conduct | ℹ app-internal scale, ordering per [CRC] |
| kid-content | facts/origin/trivia | ✅ per-element list above |
| games.json | clues/reveals/experiments | ✅ see above |
