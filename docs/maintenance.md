# Website maintenance

This branch publishes the SteerDistill research website through GitHub Pages.
`main` contains the code release; `website` contains this static site. The public
base path is `/SteerDistill/`. Use Node.js 20+ and Python 3.10+; ordinary builds
need no package installation.

## Source map

| Change | Source |
| --- | --- |
| Shared shell and generated entries | `site/templates/`, `scripts/build-pages.mjs` |
| Homepage layout and navigation | `site/home.css`, `site/home.js`, `site/home-locale.js` |
| Article prose and four case excerpts | `content/article/post.{zh,en}.json`, `content/article/cases.{zh,en}.json` |
| Article rendering, diagrams and charts | `site/article.js`, `site/article-motion.js`, `site/article-charts.js` and their CSS |
| Formal case catalogue and Chinese content | `content/cases/catalog.json`, the three case-kind directories |
| English case overlays | `content/cases/en/` |
| Case and record components | `site/cases/` |
| Published evidence and ZIP downloads | `data/case-library/` |
| Benchmark and efficiency inputs | `experiments/data/` |
| GUI replays and reviewed annotations | `demos/`, `scripts/build-demo.py` |
| Paper citation | `CITATION.bib`, `site/templates/citation.html`, `site/citation.js` |

Edit source templates or content, then regenerate HTML. The four generated
entries are `index.html`, `article/index.html`, `cases/index.html` and
`records/index.html`. `design-lab/` and `article.html` retain compatibility redirects.

## Reading routes and presentation

`/` and `/article/` contain the same continuous home-and-article surface. The route
selects the initial reading position. `site/home.js` manages lazy mounting, deep
links, browser history and active navigation; `site/reading.js` owns the contents
rail and sidenotes. Local resource URLs are resolved before history changes.
`DemoGallery.prepare()` establishes replay geometry before positioning the article.

Language follows `?lang=en` / `?lang=zh`, then the saved preference. The homepage
defaults to English; article and cases default to Chinese. Theme defaults to the
system appearance and can be switched to light or dark. Recorded model output
keeps its original language.

Keep section IDs stable: homepage `#benchmark-results`, `#steerdistill-in-action`
and `#demo`; article `#article-start`, `#problem`, `#method`, `#learning`,
`#guidance`, `#recovery`, `#results`, `#notes`, `#resources` and `#bibtex`.
Links retain the current language and replay selection.

`site/visibility.js` controls animation entry and re-entry. User pauses remain
paused, background tabs suspend playback, and reduced motion uses static figures.
Recorded task replays remain explicitly controlled. Font bootstrap reveals text
after locale and critical fonts are ready, with a bounded system-font fallback.

## Edit the article and charts

In `post.{zh,en}.json`, `post.title` / `titleLines` set the heading, `post.intro`
sets the TL;DR, and each section's `title`, `navTitle` and paragraph `html` set the
text and contents labels. Paragraphs support inline HTML. `note.text` is the full
endnote; `note.aside` is an optional shorter desktop margin note. Maintain matching
section/block structure in both languages.

The article and homepage charts share `site/chart-data.js` and
`experiments/data/benchmark_results.csv`. Efficiency plots use
`experiments/data/efficiency.json`; their scope is Qwen3-8B W4A16 on τ²-Bench.
The 32 GPUh training point and the final inference checkpoint are distinct.
Input definitions and the current update gap are in [experiments/README.md](../experiments/README.md).
Diagram and chart labels have paired zh/en strings in their rendering modules.

The Paper link points to [arXiv:2611.13410](https://arxiv.org/abs/2611.13410).
`CITATION.bib` supplies the generated BibTeX box after the article and resource
links. The homepage jumps to `article/#bibtex`; readers can copy or download it.
Keep the citation aligned with `main`'s README, `CITATION.bib` and `CITATION.cff`.

## Edit cases and evidence

Use the contracts in [case content](../content/cases/README.md),
[shared components](../site/cases/README.md) and
[the evidence library](../data/case-library/README.md). Preserve stable case/source IDs.
An English overlay's `sourceSha256` binds it to the reviewed Chinese JSON; source
list changes require matching translated indices and reviewed translations.

Publish only records supporting registered cases. Redact experiment host/user
roots consistently while retaining task-provided simulated paths and outputs.
Update each changed case's manifest, byte sizes and hashes, then package the same
sanitized bytes into its ZIP:

```sh
python3 scripts/build-case-locales.py
python3 scripts/case-library.py --package
python3 scripts/case-library.py --check
```

Inference method order is BF16, SteerDistill, QeRL, On-Policy QAD, BitDistiller,
EfficientQAT, GPTQ. Defaults compare BF16 and SteerDistill; URL selections override
them. Keep method descriptions, translations and evidence attached to the same method.

## Edit GUI replays

The registered tasks are WPS, WhatsApp and Google News: nine model/task runs,
176 decisions and 185 screenshots. `demos/*/source.json` records provenance;
`editorial.json` contains reviewed annotations. Run `python3 scripts/build-demo.py`
after changing their sources.

A decision includes recorded thought, action, coordinates and timing. Screen
sequences are reconstructed replays; phase placement is illustrative, while step
endpoints and inference/execution durations come from records. QAD step-7 runs
were collected later than the retained BF16/SteerDistill runs, so this collection
is a post-hoc demonstration rather than a matched-repeat timing experiment.

Optional `repetition.from` is a reviewed zero-based trailing range. The condensed
view holds that range for two seconds and then shows the final screen; expanding
restores every decision and its timing. The master slider represents presentation
progress. Image loading decodes a requested frame before display and ignores stale
requests when the reader changes selection.

## Build, check and publish

```sh
node scripts/build-pages.mjs
python3 scripts/check-release.py
python3 scripts/serve.py
```

The preview serves `http://127.0.0.1:18775/`. The release checker covers generated
page/locale freshness, Node tests, case spans and source links, ZIP/hash consistency,
registered assets, and text/archive privacy checks.

For layout or interaction changes, use the relevant `scripts/browser-*.cjs` checks
and inspect affected pages in both languages, at desktop and narrow widths, with
root and `/SteerDistill/` hosting. Supply `PLAYWRIGHT_MODULE`, `BASE_URL` and optional
`BROWSER_EXECUTABLE`; `ARTICLE_QA_DIR` saves screenshots outside the checkout.

| Area | Browser check |
| --- | --- |
| Delayed resources and replay loading | `browser-loading-check.cjs` |
| Article diagrams | `browser-article-check.cjs` |
| Article charts and method selections | `browser-article-charts-check.cjs` |
| Continuous reading, history and motion | `browser-reading-motion-check.cjs` |
| Heading links, refresh and keyboard navigation | `browser-heading-links-check.cjs` |

The builder adds per-file hashes to CSS/JS URLs. Font subsets are committed;
regenerate them only for font changes with `scripts/build-fonts.py` in an environment
containing `fonttools[woff]`, then rebuild the pages.

Push the checked source to `website`. GitHub Pages serves the branch root; confirm
its build result and affected public resources. Checkpoint download links remain
pending in the homepage resources.
