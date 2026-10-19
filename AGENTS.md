# Website development

This repository contains the OpenTac website. Application, firmware, hardware,
and generator sources live in https://github.com/opentac/opentac.

Run Python through this repository's environment: `uv run python ...`.
Build with `uv run python scripts/build_site.py` after checking out the code
revision recorded in `code-revision.txt` into `.opentac/`.

Keep website media and generated design downloads unchanged unless the requested
change specifically requires updating them.

Until the Render service owner confirms the repository switch described in
README.md, include `[skip render]` in every commit or merge commit reaching `main`.
The existing backend remains deployed separately; do not trigger a manual Render
deploy from this website repository. Remove this note after the switch is verified.
