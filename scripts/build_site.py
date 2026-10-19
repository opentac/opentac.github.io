"""Build the website with the CAD frontend pinned in code-revision.txt."""
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
