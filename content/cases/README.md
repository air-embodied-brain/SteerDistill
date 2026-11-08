# Case content

Authors maintain one `case-content/<kind>/<slug>.json` plus its reviewed English overlay. Keep
private research ledgers outside the public site. Current kinds are `training`, `inference`, and
`recovery`. Training includes `correction` (修正过程) and `guidance-comparison` (指导对照) sections. Do not
change the registry, readers, shared assets or another author's case. An integration owner registers
accepted JSON in `catalog.json`; loading a case never generates or rewrites its content.

The single maintained component source is `site/cases/`. Read the editorial SKILL and
`case-shared/README.md`; follow the selection gate and review raw data before authoring. Existing
case JSON is a composition reference, not evidence for a different task.

```json
{
  "schemaVersion": 1,
  "id": "my-case-slug",
  "kind": "inference",
  "title": "Concrete case title",
  "summary": "Task and material environment condition.",
  "template": "comparison",
  "originalTask": {"question": [[{"role": "user", "content": "Full verbatim user request"}]]},
  "taskTurns": [0],
  "presentation": {},
  "records": {
    "defaultSource": "ours",
    "defaultMessage": 4,
    "sources": [{"id": "ours", "label": "SteerDistill · 轨迹", "url": "data/case-library/inference/example/raw/Ours/trajectory.json", "primary": true, "format": "auto"}]
  }
}
```

All `url` / external-download `href` values are site-relative (`data/case-library/...`, without a
leading slash), or portable HTTPS URLs when needed. `SitePaths.url()` resolves these resource paths
relative to the deployed site, including its project prefix. Preserve simulated task paths. Redact
researcher machine paths before publication, consistently across displayed and downloadable records.
IDs/slugs must be stable `[a-z0-9_-]+`. `title`/`summary` belong in the envelope only; no machine
provenance or protocol boilerplate in the task summary.

## Titles and explicit case codes

Use a full `title` that identifies the task and its key decision, without a final period, Chinese
full stop, question mark or exclamation mark. Keep the title in the case JSON and matching catalog
entry identical; do not include the case code in that text.

For each accepted entry, the integration owner adds a fixed `code` and a separate `indexTitle` to
`catalog.json`. Prefixes are `T` (training, including guidance comparisons), `I` (inference) and `R`
(recovery), followed by a positive integer. Assign the next unused number in the category; never
derive it from display order or recycle a withdrawn code. Existing entries are renumbered only when
the user explicitly requests a reorganization; record that mapping in the integration notes.
Unregistered author previews need no code.

Catalog groups may define ordered `sections: [{id, label}]` for reading subgroups. Each registered
case in that group sets `section` to one declared ID. Keep case entries in the intended reading
order; the shared adapter supplies the subgroup layout. This classification is editorial data, not
inferred from task IDs or keywords.

`indexTitle` is a short subject label, manually chosen to fit one sidebar line with its code (at
most eight characters; prefer four to six Chinese characters). It has no final sentence punctuation.
The shared sidebar displays `I1 · 工具名大小写`, while the case heading displays the same code followed by
the full title. Do not hide an overlong index with an ellipsis or put identifiers into the task
summary. Check the actual sidebar fit when integrating a case.

## Task disclosure scope

Keep `originalTask` complete and verbatim. Set root-level `taskTurns` to the ordered, zero-based
indices of complete user turns needed to understand the displayed case. The page renders only these
turns; unrelated later tasks remain in the original record reader and archive. Do not truncate or
rewrite a selected user message, silently renumber nonconsecutive turns, or infer the selection from
method names or displayed step counts. If the request depends on prior context (a filename derived
from a line count, for example), include that context as well. A single selected turn needs no extra
turn heading.

The current selection was reviewed case by case: T1 [0], T2 [0,1,2], T3 [0], T4 [0], T5 [5]; I1–I6
[0], I7 [0,1,2], I8 [0], I9 [0,1,2,3]; R1–R2 [0], R3 [0,1,3], R4 [3], R5 [0]. R3 retains the later
read used as evidence but omits the unrelated question about the second filename. T2 retains both
preceding requests because they determine the source file and output filename. This is editorial
data shared by both languages.

## Frame headings

Use the shared content-type heading and a separate reading context, with no final sentence
punctuation. Case action frames use 调用与回复 / Calls and responses; reasoning uses Agent 推理节选 / Agent
reasoning excerpt; guidance uses 指导原文 / Original guidance; verification uses 执行结果 / Execution
results. The context identifies the method/intervention, turn, or concrete recovery step. Recovery
step descriptions remain visible in the header; they are not replaced with generic step numbers.

The shared templates compose these headings. Do not add per-case font, border, color, spacing or
header markup. `branches[].excerpt` is an explicit boolean for a shortened action selection. A
recovery reference can set `method` for the reasoning context; `reasoning.context` distinguishes
multiple excerpts within a step when needed. The old training `frameTitle` and guidance-comparison
`guidanceLabel` strings are no longer used.

## Templates

`template: "training"`: `presentation` is the data portion of `CaseTemplates.training`: `branches`,
optional `guidance:{title,fields,checks,takeaway}`. `branches[]` contains
`{title,summary,tone,events,reasoning?}`. `guidance` is one row-based full-width box and optional
execution checks. The shell supplies envelope title/summary/originalTask and records footer.

`template: "sequence"`: `presentation` is the data portion of `CaseTemplates.sequence`: `steps`,
optional `sequenceTitle`, `reference`, `result`, `compact`. Preserve accepted recovery composition
using `reference:{position:"before",compact:true,...}` when appropriate. These are layout options,
not evidence claims.

`template: "comparison"`: `presentation` contains:

- `methods[]`: `{id,name,heading?,description?,turns:[eventArrays],tones:[tonePerTurn],reasoning:[{text,highlights,source}?],outcomes:[string?],record:{sourceId,message}}`.
- `turns[]`: `{label,title?,summary?,showOutcome?}`. If `showOutcome` is true, the generic loader reads that turn's `method.outcomes[index]`; no callbacks in JSON.
- `defaultPair:[leftId,rightId]`, optional `selectionLabels:[leftLabel,rightLabel]`.
- Reserve each branch heading for its method/intervention name (`heading` may be omitted to use `name`); put observed behavior in `description`. Do not insert a full-width schema/protocol explanation between paired headings and action frames. Material common tool constraints belong in the task background.
- Retain all available inference methods. Selections update actions, reasoning, observed results and records together. Branch color reflects local behavior, not full-task score.
- Optional `details:{guidanceTitle,guidanceLabel,resultTitle}` enables the accepted ablation continuation. Each method then supplies `guidanceExcerpt`, `guidanceHighlights`, `guidance` (four original fields, or `{guidance: "freeform text"}`), and `resultLines:[{text,highlights,source}]`. This uses the existing fields/highlight components; do not invent a renderer.
- Optional method `guidanceAnalysis:{text,highlights,source}` preserves a reviewed excerpt from the advisor's guidance-generation analysis. It appears inside that method's existing full-guidance disclosure, clearly attributed and separated from the final guidance. Do not use the executing agent's `reasoning` field for advisor analysis. Preserve mistaken beliefs as attributed quotes; a different final instruction does not establish self-correction. Analysis uses the same explicit semantic spans and source ledger as other passages.

All event arrays use **display-ready** EvidenceUI strings:

```json
{"type":"action","name":"lookup","args":"key=\"value\"","result":"found=true","highlights":{"args":[{"start":5,"end":10,"text":"value"}]},"source":{"file":".../trajectory.json","message":4,"returnMessage":5}}
```

Fix the illustrative span offsets to your literal text; spans use JavaScript UTF-16 indices. Replies
use `{type:"reply",text,highlights:{text:[]},source}`. Reasoning uses `{text,highlights,source}`.
Spans may include explicit `tone:"before"|"after"`; otherwise they inherit the frame. Every
occurrence must be manually reviewed in the ledger, including deliberate no-mark decisions. Do not
send raw argument objects for the renderer to format, choose highlights or infer correctness. Mark
omissions as excerpts and preserve event order.

For a tool return whose meaning differs from its frame, set its manually reviewed `returnTone` to
`before`, `after` or `neutral`. Omission or an empty string inherits the frame. For example, a
returned price can be valid for the requested date even when the agent selected the wrong date. This
is an evidence decision, not a method-wide formatting rule.

## Unguided comparisons

A comparison method may omit `guidance`, `guidanceExcerpt` and `guidanceHighlights`. The shared
guidance table renders “未提供指导” for that row and creates no full-guidance disclosure. Use the same
method interface for actions, optional reasoning, results and source links. Keep unguided out of
`defaultPair` when it is supplementary. If the only source is a full original run from a different
start state, name it accordingly and describe the relevant difference; never represent it as a
matched continuation.

Action events also accept an explicit `tone: "before" | "after" | "neutral"` for manually reviewed
mixed sequences. A corrective action may be blue inside a red final-outcome frame; `returnTone`
still controls whether its tool return should stay neutral. This is separate from per-span
highlighting and must not be inferred from method identity or the final score.

## Supplemental state comparisons

A later comparison may support a displayed state match when the saved checkpoints, shared prefix and
action boundary are independently verified. Preserve the actual comparison provenance in records and
the ledger. Describe the observed match; do not invent a runtime acceptance decision or imply the
later comparison controlled continuation. A terminal state is not a substitute for a missing local
checkpoint. Keep local acceptance, subsequent unguided actions and terminal verification distinct.

## Shared record reader manifest

`sources[]` is the full inventory; set `primary:true` on the few default sidebar sources (usually
each method's trajectory, guidance, verifier). Other files stay available through the secondary
source picker. Each entry is `{id,label,url,primary?,format?,messagePath?,tone?}`.

- `format:"auto"` recognizes `messages`, `trajectory`, response `choices[].message`, arrays, and single JSON objects. `messagePath` is an optional dot-separated path to an explicit message array.
- `format:"guidance"` displays original structured guidance in shared fields, or freeform text unchanged.
- `format:"text"` keeps text readable; `format:"sqlite"` is download-only binary.
- `tone` is optional and editorial, never inferred from method identity. Do not mark an entire trajectory blue when it contains a meaningful error; use neutral manifest tone and case excerpts for local annotations.
- `records.defaultSource/defaultMessage` and each comparison method's `record` provide stable deep links. The reader supports exact raw-file mode and current-source download. Full file inventories do not replace the focused source → message reader.
- Optional `records.download:{href,label}` can link an existing complete archive; no new archive is required.

## Publication data library

Final case records live under `data/case-library/<kind>/<slug>/raw/`. Publish only sanitized
evidence used by the case. Each case has a `manifest.json` describing the public files and per-file
SHA-256, plus `records.zip`; the library index maps current codes to stable slugs. Set
`records.download` to that case archive and include the manifest as a secondary source. Keep source
IDs stable during migration so bookmarked record selections still work. Source file references in
presentation data must resolve to the same canonical case root. Verify with `python3
scripts/case-library.py --check`.

The catalogue group alias `ablation` resolves to `training`, preserving old case, pair and record
links. Guidance comparison uses `kind: "training"`, `template: "comparison"`; template and category
are independent. The article embed may retain its internal `ablation` composition style without
creating a separate catalogue group.
## Examples

- `training/directory-navigation.json`
- `inference/watchlist-disambiguation.json`
- `recovery/fuel-capacity.json`
- `training/ticket-login-before-create.json`

The catalogue's `retiredCases` entries preserve redirects for withdrawn slugs.

Formal page: `cases/?group=<kind>&case=<slug>`. Record reader:
`records/?group=<kind>&case=<slug>&source=<sourceId>&message=<zeroBasedIndex>`.

Review notes should map each displayed claim and excerpt to its source file and message or state
predicate. Record protocol conditions and the reasons for marked and unmarked passages. Validate
sources and inspect the page in a browser before registration.

## Local validation and unregistered previews

Run the read-only integrity checker before handoff:

```bash
node site/cases/validate-case.cjs content/cases/inference/my-case-slug.json
```

With no file argument it checks all registered cases. It verifies shape, turn alignment, display
strings, exact span boundaries/text, source-file existence, registry ID/code collisions, category
code prefixes and title/index consistency. It does not choose or repair annotations, prove
raw-source fidelity, or replace the ledger review.

An explicit safe `group`/`case` URL can load an unregistered JSON at its prescribed path for
coordinator preview. This adds nothing to `catalog.json`; only reviewed entries belong in the saved
registry. Old directory-task and reference aliases are recorded in the registry for
backwards-compatible links.

Withdrawn slugs in `retiredCases` redirect to a retained entry. Unregistered author previews remain
available for new cases awaiting review.
