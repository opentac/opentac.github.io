from pathlib import Path
import shutil
import subprocess
import sys

root = Path(sys.argv[1]).resolve()
code_revision = sys.argv[2]
keep_roots = {'docs', 'overrides'}
keep_files = {'.gitattributes', '.python-version', 'CITATION.cff', 'LICENSE', 'LICENSE-docs',
              'LICENSE-hardware', 'mkdocs.yml', 'uv.lock',
              'scripts/preview_site.py', 'scripts/stamp_cad_assets.py', '.github/workflows/pages.yml'}
tracked = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z']).decode().split('\0')
for name in filter(None, tracked):
    if name.split('/')[0] not in keep_roots and name not in keep_files:
        (root / name).unlink()
old = 'https://github.com/opentac/opentac.github.io'
new = 'https://github.com/opentac/opentac'
for p in (root / 'docs').rglob('*.md'):
    text = p.read_text()
    changed = text.replace(old, new)
    if p.name == 'results.md':
        changed = changed.replace('Released in the [repository](' + new + '):',
                                  'Released in the [code repository](' + new + ') and [website repository](' + old + '):')
        changed = changed.replace('in `docs/learn/data/takes/`.', 'in [`docs/learn/data/takes/`](' + old + '/tree/main/docs/learn/data/takes/).')
    if changed != text:
        p.write_text(changed)
p = root / 'mkdocs.yml'
s = p.read_text().replace(old, new).replace('repo_name: opentac/opentac.github.io', 'repo_name: opentac/opentac')
s = s.replace('edit_uri: edit/main/docs/', 'edit_uri: https://github.com/opentac/opentac.github.io/edit/main/docs/')
p.write_text(s)
p = root / 'CITATION.cff'; p.write_text(p.read_text().replace(old, new))
p = root / 'scripts/preview_site.py'
s = p.read_text().replace('import argparse\n', 'import argparse\nimport os\n')
s = s.replace('WEB = ROOT / "opentac" / "cad" / "web"',
'''DEFAULT_CODE = ROOT / ".opentac" if (ROOT / ".opentac").is_dir() else ROOT.parent / "opentac"
CODE_ROOT = Path(os.environ.get("OPENTAC_CODE_ROOT", DEFAULT_CODE)).resolve()
WEB = CODE_ROOT / "opentac" / "cad" / "web"
sys.path.insert(0, str(CODE_ROOT))''')
s = s.replace('uv run --extra docs python scripts/preview_site.py', 'uv run --project .opentac --extra docs python scripts/preview_site.py')
p.write_text(s)
(root / 'code-revision.txt').write_text(code_revision + '\n')
(root / '.gitignore').write_text('.venv/\n.opentac/\nsite/\n__pycache__/\n*.pyc\n')
(root / 'pyproject.toml').write_text('''[project]
name = "opentac-website"
version = "0.0.0"
requires-python = ">=3.12"
dependencies = ["mkdocs-material==9.7.7"]

[tool.uv]
package = false
''')
(root / 'AGENTS.md').write_text('''# Website development

This repository contains the OpenTac website. Application, firmware, hardware,
and generator sources live in https://github.com/opentac/opentac.

Run Python through this repository's environment: `uv run python ...`.
Build with `uv run python scripts/build_site.py` after checking out the code
revision recorded in `code-revision.txt` into `.opentac/`.

Keep website media and generated design downloads unchanged unless the requested
change specifically requires updating them.
''')
(root / 'README.md').write_text('''# OpenTac website

Source for [opentac.github.io](https://opentac.github.io), including the documentation,
media, interactive explanations, QR decoder, and ready-to-order design downloads.

The application, firmware, hardware, examples, and code tests are maintained in
[opentac/opentac](https://github.com/opentac/opentac).

## Build

```bash
git clone https://github.com/opentac/opentac .opentac
git -C .opentac checkout "$(cat code-revision.txt)"
uv sync --locked
uv run python scripts/build_site.py
```

The build copies the CAD frontend from the pinned code checkout to `site/cad/`.
Its source is maintained only in the code repository. To publish a different CAD
version, update `code-revision.txt` to its full commit SHA and run the checks.

For a local preview including the CAD backend:

```bash
uv run --project .opentac --extra docs python scripts/preview_site.py
```

`OPENTAC_CODE_ROOT` can select another code checkout. The preview also recognises
an `opentac` checkout beside this repository. Asset-generation scripts live in
the code repository and accept `OPENTAC_SITE_ROOT` for this website checkout.

GitHub Actions builds and checks pull requests. Changes merged into `main` are
published through GitHub Pages. The hosted CAD backend is deployed separately
from the code repository; its URL remains `https://opentac-cad.onrender.com`.

## License

Website code: MIT ([LICENSE](LICENSE)). Documentation and media: CC BY 4.0
([LICENSE-docs](LICENSE-docs)). Downloadable hardware designs: CERN-OHL-P-2.0
([LICENSE-hardware](LICENSE-hardware)). See [CITATION.cff](CITATION.cff) for citation.
''')
(root / 'scripts/build_site.py').write_text('''"""Build the website with the CAD frontend pinned in code-revision.txt."""
from pathlib import Path
import argparse
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--code-root", type=Path, default=ROOT / ".opentac")
    args = parser.parse_args()
    code = args.code_root.resolve()
    revision = (ROOT / "code-revision.txt").read_text().strip()
    actual = subprocess.check_output(["git", "-C", str(code), "rev-parse", "HEAD"], text=True).strip()
    if actual != revision:
        parser.error("Code checkout does not match code-revision.txt")
    subprocess.run([sys.executable, "-m", "mkdocs", "build", "--strict", "-d", str(ROOT / "site")], cwd=ROOT, check=True)
    dest = ROOT / "site" / "cad"
    shutil.copytree(code / "opentac" / "cad" / "web", dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns("tests"))
    subprocess.run([sys.executable, str(ROOT / "scripts" / "stamp_cad_assets.py"), str(dest), revision[:8]], check=True)

if __name__ == "__main__":
    main()
''')
print('Website files allocated; media, demos, and design downloads retained unchanged.')
