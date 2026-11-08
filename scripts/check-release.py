"""Validate the static publication tree, including downloadable evidence."""
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = {'.json', '.jsonl', '.txt', '.md', '.py', '.js', '.cjs', '.mjs', '.html', '.css', '.csv', '.svg', '.sh'}
PATTERNS = {
    'private key': r'BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY',
    'credential': r'(?:AKIA[0-9A-Z]{16}|sk-[\w-]{32,}|gh[pousr]_[A-Za-z0-9]{25,})',
    'machine path': r'/(?:Users|mnt|remote-home)/[\w.-]+|/root/[\w.-]+|/home/(?!user(?:/|[^\w.-]|$))[\w.-]+',
    'private address': r'(?<![\d.])(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?![\d.])',
    'URL credential': r'https?://[^\s/:]+:[^\s/@]+@',
}


def scan(label, data):
    value = data.decode('utf-8')
    for kind, pattern in PATTERNS.items():
        match = re.search(pattern, value)
        if match:
            line = value.count('\n', 0, match.start()) + 1
            raise ValueError(f'{label}:{line}: {kind} (value omitted)')


def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)


def main():
    for path in ROOT.rglob('*'):
        relative = path.relative_to(ROOT)
        if any(part in {'.git', '__pycache__', 'node_modules'} for part in relative.parts):
            continue
        if path.is_symlink():
            raise ValueError(f'{relative}: unexpected symlink')
        if not path.is_file():
            continue
        if path.suffix in TEXT:
            scan(str(relative), path.read_bytes())
        if path.suffix == '.zip':
            with zipfile.ZipFile(path) as archive:
                for name in archive.namelist():
                    member = Path(name)
                    if member.is_absolute() or '..' in member.parts or member.suffix in {'.zip', '.db', '.py'}:
                        raise ValueError(f'{relative}: unexpected archive member {name}')
                    if member.suffix in TEXT:
                        scan(f'{relative}!{name}', archive.read(name))
    assert {p.name for p in (ROOT / 'data').iterdir()} == {'README.md', 'case-library'}, 'Unused data bank'
    assert {p.name for p in (ROOT / 'experiments/data').iterdir()} == {'benchmark_results.csv', 'efficiency.json'}, 'Unused experiment inputs'
    demos = json.loads((ROOT / 'demos/catalog.json').read_text())
    expected_demos = {task['path'].rstrip('/') for task in demos['tasks']}
    assert {p.name for p in (ROOT / 'demos').iterdir() if p.is_dir()} == expected_demos, 'Unregistered demo directory'
    for task in demos['tasks']:
        folder = ROOT / 'demos' / task['path']
        replay = json.loads((folder / 'replay.json').read_text())
        expected_images = {run['final'] for run in replay['runs']}
        expected_images.update(step['image'] for run in replay['runs'] for step in run['steps'])
        assert {p.relative_to(folder).as_posix() for p in folder.rglob('*.png')} == expected_images, f'Unused or missing demo screenshots: {task["id"]}'
    catalog = json.loads((ROOT / 'content/cases/catalog.json').read_text())
    for group in catalog['groups']:
        expected = {case['id'] + '.json' for case in group['cases']}
        actual = {p.name for p in (ROOT / 'content/cases' / group['id']).glob('*.json')}
        assert actual == expected, f'Unregistered case content: {group["id"]}'
    run('node', 'scripts/build-pages.mjs', '--check')
    run(sys.executable, 'scripts/build-case-locales.py', '--check')
    run(sys.executable, 'scripts/case-library.py', '--check')
    tests = sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'scripts').glob('*.test.cjs'))
    tests += sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'site/cases/tests').glob('*.cjs'))
    run('node', '--test', *tests)
    run('node', 'site/cases/validate-case.cjs')
    print('PASS: static publication tree, sanitized text/ZIPs, pages, cases and replays')


if __name__ == '__main__':
    main()
