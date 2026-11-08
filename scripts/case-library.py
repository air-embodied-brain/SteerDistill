#!/usr/bin/env python3
"""Package or verify sanitized evidence for the cases displayed on this site."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

SITE = Path(__file__).resolve().parents[1]
LIBRARY = SITE / 'data/case-library'
CATALOG = SITE / 'content/cases/catalog.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def bundle(case_root, manifest):
    output = case_root / 'records.zip'
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in ['manifest.json'] + ['raw/' + f['path'] for f in manifest['files']]:
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 6, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (case_root / name).read_bytes())
    return output


def run(package=False):
    cases = []
    file_count = 0
    for group in read(CATALOG)['groups']:
        for entry in group['cases']:
            case_root = LIBRARY / group['id'] / entry['id']
            manifest = read(case_root / 'manifest.json')
            assert manifest['id'] == entry['id'] and manifest['kind'] == group['id']
            files = manifest['files']
            assert len({f['path'] for f in files}) == len(files), 'Duplicate manifest path'
            actual = {str(f.relative_to(case_root / 'raw')) for f in (case_root / 'raw').rglob('*') if f.is_file()}
            assert actual == {f['path'] for f in files}, f'Inventory differs: {entry["id"]}'
            for f in files:
                source = case_root / 'raw' / f['path']
                assert source.resolve().is_relative_to((case_root / 'raw').resolve()), 'Unsafe file path'
                data = source.read_bytes()
                assert len(data) == f['bytes'] and digest(data) == f['sha256'], f'Source changed: {source}'
            config = read(SITE / entry['url'])
            assert config['id'] == entry['id'] and config['kind'] == group['id']
            def references(value):
                if isinstance(value, dict):
                    for key, child in value.items():
                        if key in ('url', 'file', 'href') and isinstance(child, str) and child.startswith('data/'):
                            path = SITE / child
                            assert path.is_file(), f'Missing source: {child}'
                            assert path.resolve().is_relative_to(case_root.resolve()), f'Unconsolidated source: {child}'
                        else:
                            references(child)
                elif isinstance(value, list):
                    for child in value:
                        references(child)
            archive = bundle(case_root, manifest) if package else case_root / 'records.zip'
            references(config['records'])
            references(config['presentation'])
            with zipfile.ZipFile(archive) as z:
                expected = {'manifest.json'} | {'raw/' + f['path'] for f in files}
                assert set(z.namelist()) == expected and len(z.namelist()) == len(expected)
                assert z.read('manifest.json') == (case_root / 'manifest.json').read_bytes()
                for f in files:
                    assert digest(z.read('raw/' + f['path'])) == f['sha256'], f'Archive differs: {archive}'
            cases.append(dict(id=entry['id'], code=entry['code'], kind=group['id'], section=entry.get('section'),
                              title=entry['title'], root=str(case_root.relative_to(SITE)),
                              files=len(files),
                              sourceBytes=sum(f['bytes'] for f in files),
                              download=str(archive.relative_to(SITE)), archiveBytes=archive.stat().st_size,
                              archiveSha256=digest(archive.read_bytes())))
            file_count += len(files)
    index = dict(schemaVersion=2, recordScope='Sanitized publication evidence', cases=cases)
    if package:
        write(LIBRARY / 'index.json', index)
    else:
        assert read(LIBRARY / 'index.json') == index, 'Library index is stale; review then run --package'
    print(f'PASS: {len(cases)} cases, {file_count} sanitized evidence files, {len(cases)} verified archives')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--package', action='store_true', help='Rebuild deterministic ZIPs and the library index')
    args = parser.parse_args()
    run(package=args.package)
