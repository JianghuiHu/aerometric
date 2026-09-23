# Contributing

English | [简体中文](../zh-CN/contributing.md)

Contributions may improve Studio, documentation, the standard, validators, tools, or reusable model packages. Keep changes focused and preserve the distinction between runtime features and model-asset responsibilities.

## Code and documentation

1. Create a focused branch.
2. Install with `npm ci`.
3. Add or update meaningful tests.
4. Run `npm run test:source` and `npm run build`.
5. Open a pull request describing behavior, validation, and licensing impact.

## Model packages

Use the [model package template](../../release/aerometric-0.1/models/_template/) and include:

- `model.glb`
- `model.aerometric.json`
- `preview.webp`
- `README.md`
- `LICENSE`

The license must explicitly permit redistribution, and Library metadata must set `redistributable: true`. Capabilities come from DroneProfile data. Do not maintain a conflicting manual capability list.

Before submitting:

```bash
npm run validate:model -- <model-package>
npm run validate:library
npm run validate:release
npm run check:publish
```

The full release contribution policy remains in [`release/aerometric-0.1/CONTRIBUTING.md`](../../release/aerometric-0.1/CONTRIBUTING.md).
