# Community Model Library

`models/index.json` is the versioned 0.1.0 metadata catalog consumed by Studio. The Studio requests the catalog when the model menu first opens, then loads a selected model GLB on demand. A Level 1 card reads its Profile to derive displayed capabilities; the index has no separate capability list.

Each entry contains `id`, `name`, `author`, `type`, compatibility level, local `model` and `preview` paths, an optional Level 1 `profile`, an explicit asset `license`, and `redistributable: true`. The model directory must also contain a non-empty `LICENSE` covering the model, textures, and preview. Paths are relative to `models/index.json`; remote URLs and parent-directory traversal are rejected.

The catalog intentionally remains empty until a model and its textures have confirmed redistribution terms. Adding an entry requires the complete package described in `models/_template`, a passing CLI validation, and a successful library-index validation:

```bash
node scripts/validate-model-library.mjs
```
