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
published through GitHub Pages. The hosted CAD backend is deployed separately
from the code repository, at `https://opentac-cad.onrender.com`.

The pre-split source remains available on `backup/before-code-split` at
`dba4f9017ceb1c25389b2a56f7cd4de19db424d0`.

## License

Website code: MIT ([LICENSE](LICENSE)). Documentation and media: CC BY 4.0
([LICENSE-docs](LICENSE-docs)). Downloadable hardware designs: CERN-OHL-P-2.0
([LICENSE-hardware](LICENSE-hardware)). See [CITATION.cff](CITATION.cff) for citation.
