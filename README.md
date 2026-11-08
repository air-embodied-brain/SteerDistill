# SteerDistill website

Research website for **SteerDistill: Quantizing LLM Agents via Closed-Loop Teacher Steering**.

[Paper](https://arxiv.org/abs/2611.13410) · [Website](https://air-embodied-brain.github.io/SteerDistill/) · [Project
code](https://github.com/air-embodied-brain/SteerDistill)

This checkout serves the website only. It includes the bilingual homepage, three interactive GUI task
replays, the bilingual research article, and 19 reviewed bilingual cases: 5 training
corrections/guidance comparisons, 9 inference comparisons, and 5 autonomous recoveries. Each case
links to its sanitized source records and a self-contained ZIP download.

## Local preview

Use Node.js 20+ and Python 3.10+. No package installation or framework server is needed.

```bash
node scripts/build-pages.mjs
python3 scripts/serve.py
```

Open [the local preview](http://localhost:18775/). The four maintained entry points are:

- `/?lang=en` / `/?lang=zh`: homepage, results, and GUI replays.
- `article/?lang=en` / `?lang=zh`: research article in the same continuous page; scroll up to return
  to the homepage.
- `cases/?lang=en` / `?lang=zh`: full case collection.
- `records/`: source reader linked from each case.

GitHub Pages serves the root of `website` at `/SteerDistill/`. The former
`design-lab/p2.html` URL redirects to the homepage.

## Validation

Run `python3 scripts/check-release.py` before publication. Optional browser checks live in
`scripts/browser-*.cjs`. See [maintenance](docs/maintenance.md)
for the source map, build commands, and verification scope, and [case
evidence](data/case-library/README.md) for the sanitization policy.

## Citation

The paper is available as [arXiv:2611.13410](https://arxiv.org/abs/2611.13410).
Download [CITATION.bib](CITATION.bib), or use the BibTeX box at the end of the
[research article](https://air-embodied-brain.github.io/SteerDistill/article/#bibtex).
The homepage resource navigation links directly to that box.

## Release TODOs

- TODO: Add checkpoint download links to the homepage resources.

## License

Code is distributed under the [MIT license](LICENSE). Layout references and font licenses are listed
in [third-party notices](THIRD-PARTY-NOTICES.txt).
