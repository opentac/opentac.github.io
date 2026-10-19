# OpenTac website

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
published through GitHub Pages. The hosted CAD backend is deployed separately;
its URL remains `https://opentac-cad.onrender.com`.

## Pending Render migration

The website and code repositories are separated, but the existing `opentac-cad`
Render service still needs its owner to reconnect it to the code repository.
The website continues to call the existing backend at the same URL.

Until that switch is confirmed, include `[skip render]` in every commit or merge
commit that reaches this repository's `main` branch. This is Render's documented
[per-commit deployment skip](https://render.com/docs/deploys#skipping-an-auto-deploy);
it does not skip GitHub Pages. Do not manually deploy the latest commit from this
website repository on Render: it no longer contains the backend.

The service owner should update the existing service, preserving its URL and
environment variables, including `GEMINI_API_KEY`:

| Setting | Value |
| --- | --- |
| Repository | `https://github.com/opentac/opentac` |
| Branch | `main` |
| Dockerfile | `./deploy/Dockerfile` |
| Docker build context | `.` |
| Health check | `/health` |

If the service is managed by a Render Blueprint, reconnect that existing
Blueprint as well so a later sync cannot restore the old repository settings.
After deploying, check `/health` and a CAD generation through the website. Then
remove this temporary section and the corresponding note in `AGENTS.md`.

The pre-split source remains available on `backup/before-code-split` at
`dba4f9017ceb1c25389b2a56f7cd4de19db424d0`.

## License

Website code: MIT ([LICENSE](LICENSE)). Documentation and media: CC BY 4.0
([LICENSE-docs](LICENSE-docs)). Downloadable hardware designs: CERN-OHL-P-2.0
([LICENSE-hardware](LICENSE-hardware)). See [CITATION.cff](CITATION.cff) for citation.
