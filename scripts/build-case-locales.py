"""Build the English directory from individually reviewed editorial overlays."""
import json
import hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content/cases'
catalog = json.loads((CONTENT / 'catalog.json').read_text())
group_labels = {'training': 'Training corrections', 'inference': 'Inference comparisons', 'recovery': 'Self-recovery'}
section_labels = {'correction': 'Correction process', 'guidance-comparison': 'Guidance comparison', 'request-interface': 'Requests & APIs', 'action-conditions': 'Prerequisites', 'execution-state': 'Execution & state'}
translations = {}
for gi, group in enumerate(catalog['groups']):
    prefix = f'/groups/{gi}'
    translations[prefix + '/label'] = group_labels[group['id']]
    for si, section in enumerate(group.get('sections', [])):
        translations[f'{prefix}/sections/{si}/label'] = section_labels[section['id']]
    for ci, case in enumerate(group['cases']):
        overlay = json.loads((CONTENT / 'en' / group['id'] / (case['id'] + '.json')).read_text())
        assert overlay['sourceSha256'] == hashlib.sha256((ROOT / case['url']).read_bytes()).hexdigest(), f"Review stale translation: {group['id']}/{case['id']}"
        translations[f'{prefix}/cases/{ci}/title'] = overlay['translations']['/title']
        translations[f'{prefix}/cases/{ci}/indexTitle'] = overlay['indexTitle']
output = json.dumps({'schemaVersion': 1, 'translations': translations}, ensure_ascii=False, indent=2) + '\n'
path = CONTENT / 'en/catalog.json'
import sys
if '--check' in sys.argv:
    assert path.read_text() == output, 'English directory is stale; run scripts/build-case-locales.py'
else:
    path.write_text(output)
print('English case directory is current.' if '--check' in sys.argv else 'Built English case directory.')
