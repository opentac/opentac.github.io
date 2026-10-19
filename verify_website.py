from pathlib import Path
import json
import subprocess
import sys
import tomllib

baseline, website, code, before, after = map(Path, sys.argv[1:])
old = 'https://github.com/opentac/opentac.github.io'
new = 'https://github.com/opentac/opentac'
original = tomllib.loads((baseline / 'uv.lock').read_text())
current = tomllib.loads((website / 'uv.lock').read_text())
versions = {(p['name'], p['version']) for p in original['package']}
assert all((p['name'], p['version']) in versions or p['name'] == 'opentac-website' for p in current['package']), 'Dependency version changed'
tracked = subprocess.check_output(['git', '-C', str(baseline), 'ls-files', '-z']).decode().split('\0')
for name in filter(None, tracked):
    original_file = baseline / name
    assert (website / name).is_file() or (code / name).is_file(), 'Unallocated file: ' + name
    if name.startswith(('docs/', 'overrides/')):
        original_bytes = original_file.read_bytes()
        if name.endswith('.md'):
            expected = original_bytes.decode().replace(old, new)
            if name == 'docs/results.md':
                expected = expected.replace('Released in the [repository](' + new + '):', 'Released in the [code repository](' + new + ') and [website repository](' + old + '):')
                expected = expected.replace('in `docs/learn/data/takes/`.', 'in [`docs/learn/data/takes/`](' + old + '/tree/main/docs/learn/data/takes/).')
            assert (website / name).read_text() == expected, name
        else:
            assert (website / name).read_bytes() == original_bytes, name
    if name.startswith(('opentac/', 'hardware/', 'firmware/', 'examples/', '.claude/')):
        assert (code / name).read_bytes() == original_file.read_bytes(), name
        assert not (website / name).exists(), 'Code retained in website: ' + name

before_files = {p.relative_to(before).as_posix():p for p in before.rglob('*') if p.is_file()}
after_files = {p.relative_to(after).as_posix():p for p in after.rglob('*') if p.is_file()}
assert before_files.keys() == after_files.keys(), (before_files.keys() - after_files.keys(), after_files.keys() - before_files.keys())
changed = []
for name, p in before_files.items():
    a, b = p.read_bytes(), after_files[name].read_bytes()
    if a == b:
        continue
    if name == 'sitemap.xml.gz':
        import gzip
        assert gzip.decompress(a) == gzip.decompress(b)
        continue
    if name.endswith('.html'):
        expected = a.decode().replace(old, new).replace('opentac/opentac.github.io', 'opentac/opentac')
        if expected == b.decode():
            continue
    if name not in {'results/index.html', 'search/search_index.json'}:
        raise AssertionError('Unexpected generated difference: ' + name)
    changed.append(name)
print(json.dumps({'tracked_files_accounted_for':len(list(filter(None,tracked))), 'generated_files_compared':len(before_files), 'expected_repository_metadata_differences':changed, 'application_and_asset_bytes':'unchanged', 'dependency_versions':'unchanged'}, indent=2))
