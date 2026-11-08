# Website maintenance

Build and serve the research website from the files in this branch. The source map below identifies
the templates, presentation data, and records used by each page.

## Source map

| Change | Source |
| --- | --- |
| Shared shell and four generated HTML pages | `site/templates/`, `scripts/build-pages.mjs` |
| Fonts, theme, navigation and page layouts | `site/` |
| Article text and four embedded cases, per language | `content/article/post.{zh,en}.json`, `content/article/cases.{zh,en}.json` (same structure; a test keeps the two posts aligned) |
| Formal case catalogue and Chinese case content | `content/cases/catalog.json`, its three kind directories |
| English case overlays | `content/cases/en/` |
| Case/record components and exact-span checks | `site/cases/` |
| Published case evidence and downloads | `data/case-library/` |
| Homepage result chart and downloadable table | `experiments/data/` |
| GUI task replays, reviewed annotations and screenshots | `demos/`, `scripts/build-demo.py` |

Edit templates, then regenerate HTML; do not edit generated HTML directly. In English mode, all editorial text and UI labels are English; only media and recorded model output keep their source language. Article diagram and chart labels are paired zh/en strings in `site/article-motion.js` and `site/article-charts.js`. `python3
scripts/build-case-locales.py` regenerates the English catalogue. An English overlay's
`sourceSha256` binds it to the reviewed Chinese JSON. When changing a source list, remap its
translated indices. Review translations before updating the hash. Keep original task/action/guidance
evidence intact, except for declared privacy redactions applied consistently to every copy.

Case authoring and renderer contracts remain in [case content](../content/cases/README.md)
and [shared components](../site/cases/README.md).

## Case evidence and privacy

Only evidence supporting registered cases is published. Do not import whole experiment directories.
Keep stable case/source IDs, all primary records, and files referenced by displayed evidence.
Exclude nested import ZIPs, SQLite dumps, transport/tokenization logs, local runtime code, and stale
checksums.

Replace experiment host/user roots with `/redacted` before publishing any raw record. Simulated
benchmark paths such as `/alex`, `/workspace`, `/home/user`, and task-provided mock account fields
are evidence, not paths on a researcher's machine. Preserve them. The task replays use simulated app
state and test identities; review new screenshots as well as text for actual personal data. Never
use model-generated success claims as a substitute for recorded outcomes.

For a new or changed case, update its `manifest.json` inventory, byte sizes and SHA-256 values to
match the sanitized public files, then run:

```bash
python3 scripts/case-library.py --package
python3 scripts/case-library.py --check
```

The ZIP contains those exact public bytes and its manifest. This manifest verifies the distributed
sanitized copy; it does not claim byte identity with private experiment originals. Do not add
historical manifests describing removed files. The checker rejects source links outside the case's
own root.

## GUI replays

Run `python3 scripts/build-demo.py` after editing source records or reviewed annotations. The three
tasks contain 176 decisions in total: WPS 40, WhatsApp 70, and Google News 66. A decision
is one recorded model response with its thought, action, executed coordinates, and timing fields.
The 185 PNGs are one screenshot per decision plus a final screen for each of the 9 task/model runs.
The release cleanup preserves the original bytes of all retained decisions and screenshots; only
experiment paths in provenance metadata are redacted.

Measured step endpoints and inference/execution durations determine replay timing; phase placement
within each step is reconstructed. The screenshot sequence is not continuous video and has no
measured token-level timing. Selection is post hoc, not evidence of aggregate speed or a
matched-training ablation. Model-lineage information is retained in `demos/*/source.json`. Do not infer lineage from a redacted model-storage path.

## Validation

```bash
python3 scripts/check-release.py
```

Optional browser checks (`scripts/browser-*.cjs`, same `PLAYWRIGHT_MODULE`/`BASE_URL` variables) cover
loading, refresh and theme persistence, replay folding and repetition, article figures, charts and
continuous navigation.

`check-release.py` runs generated-page/locale freshness checks, all existing Node tests, case annotation/link
checks, ZIP/hash verification, and text/archive privacy checks. Check the homepage, article, a
training/inference/recovery case and raw reader in a browser at both root and `/SteerDistill/`
hosting, in both languages, on desktop and narrow screens. Inspect themes, method selection,
language switching, replay controls, and source downloads after layout changes.

The global language choice is preserved between entries. Homepage defaults to English; article and
cases default to Chinese. The article, its embedded cases, diagrams and charts follow the chosen
language. The theme defaults to the system appearance; the header button cycles system, light and
dark, and an explicit choice is stored per browser. Legacy ablation URLs are aliases for the
current guidance-comparison section; they do not require keeping withdrawn case configurations or
raw banks.

## GitHub Pages deployment

The code branch `main` is the repository default. GitHub Pages serves `/` from
`website`. Push changes to the website branch after running the publication
checks.

The website history was consolidated into a single commit on 2026-11-08; earlier development
history is kept only in a local backup branch. Continue amending that single website commit
and push with an explicit `--force-with-lease` against the verified remote tip.

## Release TODOs

- TODO: Add checkpoint download links in the same resource navigation.

## Clean routes and loading (2026-11-07)

The generated entries are `/`, `/article/`, `/cases/`, and `/records/`, each served by
an `index.html`. `design-lab/` contains only compatibility redirects. Old article,
case, record and p2 URLs preserve their query and fragment when redirected. Components
live in `site/` (case/record components in `site/cases/`); editorial JSON lives in
`content/article/` and `content/cases/`. Evidence stays in `data/case-library/` and `demos/`.
Do not add new content or dependencies to the compatibility directory.

The page builder gives each CSS/JS dependency its own content hash, so unchanged assets
retain their cache key across builds. The three preloaded fonts use generated Latin/Greek
subsets; exact Unicode ranges keep Chinese text from triggering downloads of full Latin
fonts. Other supported glyphs retain the original fonts as fallbacks. Regenerate subsets
and `site/fonts.css` with `python scripts/build-fonts.py` in an environment containing
`fonttools[woff]`, then rebuild the pages. Generated font assets are committed, so normal
preview/build does not require that package.

Demo interaction waits for initial screenshots only. Subsequent images warm in two workers,
in timeline order across methods. A requested frame is decoded before display; pending
frames hide stale screens, and obsolete requests cannot overwrite the latest selection.
The existing task-loading retry still covers first-frame failures.

Reference reviewed: OxyGen commit
[d61fb79](https://github.com/air-embodied-brain/OxyGen/commit/d61fb799bd236f6ede42bbf80258547bcce93538),
particularly priority fonts and deferred media queues. This site remains a static site;
no framework migration or runtime package dependency was introduced.

### Delayed-load verification

`scripts/browser-loading-check.cjs` accepts `BASE_URL`, `PLAYWRIGHT_MODULE` and optionally
`BROWSER_EXECUTABLE`. Install/use Playwright in a separate tooling environment. The test
adds 800 ms to each demo screenshot request and 150 ms to other requests, starts with a
fresh browser, and measures when the WPS controls become available. Against the baseline
checkout `bf76cec` and the new tree on the same machine:

| Measurement | Before | After |
| --- | ---: | ---: |
| WPS interactive | 6,034 ms | 1,954–1,988 ms |
| Screenshot requests issued by that point | 16 | 5 |
| Preloaded font files | Full fonts | Three subsets, 224,860 bytes total |

These are injected-delay local measurements, not a claim about all production connections.
Browser checks also covered all retained tasks with delayed frames and rapid last/first-step
selection, all 38 case/language pages, source reader/downloads, old links, project-prefix
hosting, mobile layout and dark theme. Publication validation and all 40 Node tests pass.
Use `python3 scripts/serve.py` for the local preview; its enlarged connection backlog avoids
connection resets when multiple image-rich pages are being tested concurrently.

### Refresh and replay update (2026-11-07)

The shared shell inlines theme initialization and an OxyGen-inspired text placeholder
bootstrap. Text is revealed only after the initial locale and critical fonts are ready.
Font failure or a four-second timeout selects system fonts for the rest of the page
visit, preventing a later font swap. JavaScript-disabled reading stays visible.

WPS, WhatsApp and Google News now use QAD step 7 from
`QAD-Step7-Three-Failed-Demos-Raw-20261107.zip`. Source archive hashes and task directories
are in each `demos/*/source.json`. Model outputs, screenshots and timing records are
retained; private deployment paths in provenance are redacted. All 90 new decisions
were reviewed against their observations and actions. Slack has no replacement in
this package and has been removed from the demo collection. The new QAD runs share the Brownie
initializer and recorded inference settings, but were collected later than the retained
BF16/SteerDistill runs; do not describe them as a simultaneous or matched-repeat trial.

### Repeated-tail presentation

`editorial.json` may define a per-run `repetition` with a zero-based `from`,
translated `label`, and editorial `review`. This is a manually confirmed trailing
range, never inferred from action-string similarity. WPS folds from decision 3,
WhatsApp from decision 9, and Google News from decision 16. The preceding decisions
retain the first error and its initial repetition.

`DemoTiming.presentation` maps the reviewed tail to a two-second hold, then shows
the final recorded screen. The master slider is presentation progress, not measured
wall time. Successful runs retain a shared linear scale; folded runs show a hatched
break, actual duration and repeat count. Expanding restores every recorded step and
real-time playback. Per-method inspection stays independent of other methods.
Original timings, outputs, and screenshots are unchanged.


### Chinese article and explanatory motion (2026-11-07)

`content/article/post.zh.json` owns prose and complete endnotes. An optional note `aside`
contains a shorter desktop margin summary, so long formulas/metric definitions do not create
large gaps in the reading column. `site/article.js` resolves prose links with `SitePaths`.

`site/article-motion.js` / `.css` replace the old text diagrams. Each SVG figure has one phase
clock, manual phase buttons, pause/resume, viewport/document suspension, and a complete static
overview for reduced motion. Separate mobile geometry keeps labels readable. The token bars are
illustrative distributions, not measured data. Both homepage continuation and `/article/` use
these same components; rebuild with `node scripts/build-pages.mjs` after changing dependencies.

Optional `scripts/browser-article-check.cjs` uses the same `PLAYWRIGHT_MODULE`,
`BROWSER_EXECUTABLE`, and `BASE_URL` settings as other browser checks; `ARTICLE_QA_DIR` saves
screenshots outside the checkout. It covers animation lifecycle, stable captions, responsive SVG
bounds, the article's links and homepage integration. It emulates the `/SteerDistill/` mount by
routing requests to the local root-only preview server.


### Article experiment figures and method order

`site/chart-data.js` provides a cached score loader and the existing homepage palette.
The homepage and article both read `experiments/data/benchmark_results.csv`.
`site/article-charts.js` / `.css` render the article's five-benchmark mean and the two
side-by-side efficiency plots. Average-score controls cover all five supported settings;
efficiency is explicitly fixed to Qwen3-8B W4A16 on τ²-Bench. Narrow screens use horizontal
mean-score bars and stack the efficiency panels. Reveals start in the viewport and honour
reduced motion. All points have keyboard-accessible numerical readouts.

`experiments/data/efficiency.json` is an exact copy of the approved paper figure input,
including provenance, means and standard deviations. It is not reconstructed from older
CSV files or PDF geometry. The intermediate 32-hour point is 31.68 ± 0.38; final inference
uses 4.0K / 31.79. Shared readout tests protect this distinction.

Inference methods are ordered BF16, SteerDistill, QeRL, On-Policy QAD, BitDistiller,
EfficientQAT, GPTQ in all nine source configs and the article excerpt. Default comparisons
are BF16 / SteerDistill; URL selections still override them. English overlay method
indices and preserved paths follow their method identities, with updated source hashes.
Reordering must never detach descriptions or reasoning from the corresponding method.

`browser-article-charts-check.cjs` validates all five settings, geometry/readouts, root
and homepage integration, responsive bounds, and the 18 localized inference views. Use
the same external Playwright environment and optional `ARTICLE_QA_DIR` as the article test.

### Continuous reading and replay on re-entry

Both `/` and `/article/` now build the same complete home + article surface. The route
selects the initial reading position and language default, not a different document.
`site/home.js` owns lazy article mounting, direct/deep-link positioning, same-document
navigation, titles, active navigation and browser history. Explicit links push history;
passive boundary crossings replace it. Native smooth scrolling stays interruptible,
and reduced motion uses immediate positioning. Static local URLs are resolved before
changing history so downloads and case links keep their base. The gallery exposes
`DemoGallery.prepare()` to establish its layout before positioning the article; slow
resources have a bounded wait. `reading.js` continues to own the contents and sidenotes.

`site/visibility.js` uses a readable pixel threshold for entry, then waits for complete
exit before re-arming (following the OxyGen visibility pattern). It drives the hero
concept, both article stories and all experimental plots. Re-entry resets the animation
clock; deliberate pauses/selected phases remain paused. Background tabs suspend playback.
Finite CSS chart animations restart without replacing DOM or resetting selected settings.
The efficiency panels are observed individually so the lower mobile plot does not finish
before it is seen. Reduced motion still presents complete static figures. Interactive
recorded demos remain explicitly controlled with their existing play/seek controls.

`scripts/browser-reading-motion-check.cjs` covers entry, re-entry, manual pause, direct
article loads, refresh, back/forward, root/project paths, short mobile viewports and
reduced motion. It clicks sticky navigation at its visible coordinates: Playwright's
`locator.click()` first scrolls the sticky header relative to the document's scroll
padding, which changes the saved reading position before the actual click.


### Publication cleanup (2026-11-07)

The published replay collection contains only WPS, WhatsApp and Google News: 176 decisions,
185 screenshots, and nine task/model runs. Removed Slack assets and unused translations for
withdrawn runs are not shipped. The two original WPS provenance records retain the source
configuration's historical Slack task fields; these are source metadata, not a registered
Slack replay, and must not be rewritten to make a text search clean.

The site uses the shared root fonts; unused copies under the former case font directory are
removed. The homepage benchmark now contains only its shipped grouped chart and loads the
same CSV as the article. Unused prototype chart modes and the redundant W4A16 JSON projection
are removed. Legacy page redirects remain so existing article/case links continue to work.
The release checker rejects unregistered demo directories and unused or missing screenshots.


### Editing the Chinese article

Edit `content/article/post.zh.json`: `post.title` / `titleLines` set the heading,
`post.intro` sets the TL;DR, and each section's `title`, `navTitle`, and paragraph
`html` fields set the main text and contents labels. Paragraph HTML accepts inline
`<strong>`, `<code>`, and links. Keep JSON string quoting valid. `note.text` is the
complete endnote and optional `note.aside` is its shorter desktop version. Keep section
IDs stable for existing chapter links.

`content/article/cases.zh.json` owns the four embedded case excerpts. Shared animation
labels/captions live in `site/article-motion.js`. Its intermediate stages last 1.6 s,
and the final stage holds for 4.8 s before repeating; progress uses each stage's own duration.

After editing, run `node scripts/build-pages.mjs`, then `python3 scripts/check-release.py`.
Preview with `python3 scripts/serve.py` and open `/article/?lang=zh`; if the preview is
already running, rebuild and refresh. Generated `index.html` and `article/index.html`
are outputs, not editing sources. Committing and pushing the website branch publishes
both entry points together.


### Heading permalinks (2026-11-09)

The homepage result chart (`#benchmark-results`) and demo heading
(`#steerdistill-in-action`) have clickable title links. The existing `#demo` target
remains available. The article title (`#article-start`), its six chapters
(`#problem`, `#method`, `#learning`, `#guidance`, `#recovery`, `#results`), notes
(`#notes`) and resources (`#resources`) share the same link style. IDs are stable
across languages; the current query retains language and replay selection.

Titles retain their typography. A `#` appears on hover and keyboard focus, and stays
visible on touch devices. Native links support opening in a new tab and copying the
section address. `site/home.js` preserves homepage fragments when normalizing an
article-route URL to its actual target, waits for lazy content before positioning,
and focuses the selected heading after navigation.

`scripts/browser-heading-links-check.cjs` covers direct links, click/keyboard activation,
refresh, back/forward, language switching and narrow-screen positioning at both root
and project-prefix paths. It uses the same external browser tooling as other checks.


### Paper citation (2026-11-11)

The Paper link points to [arXiv:2611.13410](https://arxiv.org/abs/2611.13410).
`CITATION.bib` is the citation source; keep it aligned with the code branch's
README, `CITATION.bib`, and `CITATION.cff`. Title, author order, year, subject,
and DOI were checked against the arXiv abstract page (v1, submitted 2026-11-10).

`site/templates/citation.html` is rendered after the article body and resources
on both continuous reading routes. The homepage BibTeX link targets
`article/#bibtex`; the block supports copying and downloading, with selectable
text if clipboard access is unavailable. Rebuild the generated pages after edits.
