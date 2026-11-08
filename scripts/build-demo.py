"""Build the task replays from unchanged run records, not the slowed-down MP4.

Per-step end times and inference/execution durations are measured. Within each
step, phase placement is reconstructed: unallocated overhead, inference, action.
The logs do not provide timestamped tokens or continuous screen capture.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'demos/catalog.json').read_text())
LABELS = {'bf16': 'BF16', 'ours': 'SteerDistill', 'qad': 'On-Policy QAD'}

def spans(text, reviewed):
    result = []
    for mark in reviewed:
        value = mark['text']
        if text.count(value) != 1:
            raise ValueError(f'Highlight must uniquely match its source: {value}')
        at = text.index(value)
        # Browser evidence components use UTF-16 string offsets.
        start = len(text[:at].encode('utf-16-le')) // 2
        end = start + len(value.encode('utf-16-le')) // 2
        result.append(dict(start=start, end=end, text=value, tone=mark['tone']))
    return sorted(result, key=lambda span: span['start'])
def build(task):
    dest = ROOT / 'demos' / task['path']
    edits = json.loads((dest / 'editorial.json').read_text())
    runs = []
    for model, label in LABELS.items():
        folder = dest / 'raw' / model
        metrics = json.loads((folder / 'metrics.json').read_text())
        rows = [json.loads(line) for line in (folder / 'turns.jsonl').read_text().splitlines()]
        editorial = edits[model]
        if len(editorial['steps']) != len(rows):
            raise ValueError(f'Every decision needs an editorial review: {model}')
        repetition = editorial.get('repetition')
        if repetition and (not isinstance(repetition.get('from'), int) or not 2 <= repetition['from'] < len(rows)-1 or not repetition.get('review')):
            raise ValueError(f'Repetition folding requires a reviewed trailing range: {model}')
        steps, start = [], 0
        for index, row in enumerate(rows):
            end = row['episode_elapsed_seconds']
            act_start = end - row['environment_seconds']
            infer_start = act_start - row['inference_seconds']
            if infer_start < start - 1e-6:
                raise ValueError(f'Overlapping timings: {model} / {index}')
            review = editorial['steps'][index]
            call = re.fullmatch(r'([\w.]+)\((.*)\)', row['raw_action'])
            if call is None:
                raise ValueError(f'Unsupported action format: {row["raw_action"]}')
            action_event = dict(name=call[1], args=call[2], tone=review['actionTone'],
                                highlights={'call': spans(row['raw_action'], review['actionHighlights'])})
            steps.append(dict(index=index, title=review['title'], start=start,
                              inferStart=infer_start, actStart=act_start, end=end,
                              image=f'raw/{model}/{index:03}.png',
                              thought=row['thought'], action=row['raw_action'],
                              thoughtHighlights=spans(row['thought'], review['thoughtHighlights']),
                              actionEvent=action_event,
                              executed=row['result']['info']['executed_action']))
            start = end
        runs.append(dict(id=model, label=label, precision=editorial['precision'], language=editorial['language'], success=metrics['success'],
                         total=metrics['episode_seconds'], inference=metrics['inference_seconds'],
                         execution=sum(row['environment_seconds'] for row in rows),
                         final=f'raw/{model}/final.png', steps=steps, repetition=editorial.get('repetition')))
    data = dict(id=task['rawTask'], title=task['title'], task=task['task'], caption=task['caption'], notes=task['notes'],
                width=390, height=844, runs=runs)
    (dest / 'replay.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Built {task['app']}: {len(runs)} methods, {sum(len(r['steps']) for r in runs)} decisions.")

for task in CATALOG['tasks']:
    build(task)
