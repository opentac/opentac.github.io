# Website development

This repository contains the OpenTac website. Application, firmware, hardware,
and generator sources live in https://github.com/opentac/opentac.

Run Python through this repository's environment: `uv run python ...`.
Build with `uv run python scripts/build_site.py` after checking out the code
revision recorded in `code-revision.txt` into `.opentac/`.

Keep website media and generated design downloads unchanged unless the requested
change specifically requires updating them.
