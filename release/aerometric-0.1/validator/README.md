# AEROMETRIC Validator 0.1

Validate a GLB and optional AEROMETRIC Profile without opening the Studio.

```text
node src/cli.mjs ./model.glb ./model.aerometric.json
node src/cli.mjs ./model-package
node src/cli.mjs ./model-package --json
```

Exit code `0` means the package satisfies its declared compatibility level. Exit code `1` means parsing, schema, mapping, or capability checks failed. Recommendations such as high triangle count remain warnings.

