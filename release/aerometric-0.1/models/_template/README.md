# Community model template

Copy this directory to `models/<model-id>/` and add:

```text
model.glb
model.aerometric.json
preview.webp
README.md
LICENSE
```

The model README must identify its name, author, type, compatibility level, tested capabilities, and asset license. Run `node validator/src/cli.mjs models/<model-id>` before submitting it.

Use [CONTRIBUTION_CHECKLIST.md](CONTRIBUTION_CHECKLIST.md) before opening a model pull request. Studio's mapping dialog can generate the initial Profile, but name matching does not replace pivot and motion testing.

After the package passes validation, add one metadata entry to the 0.1.0 `models/index.json` using paths relative to that index. Set `license` to the explicit asset license and `redistributable` to `true` only when the package's `LICENSE` grants those rights. Run `node scripts/validate-model-library.mjs`; the index validator rejects duplicate IDs, missing files, missing or empty LICENSE, unclear rights, remote paths, parent-directory traversal, and Level 1 entries without a Profile.
