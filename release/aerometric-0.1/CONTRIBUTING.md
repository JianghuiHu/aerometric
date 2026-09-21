# Contributing

Keep changes small and verify observable compatibility.

## Model contributions

1. Submit a binary GLB plus either a valid sidecar profile or native `aerometric` node extras.
2. Preserve real dimensions. Do not compensate for a bad camera view by changing model scale.
3. Keep controllable parts separate and place pivots on their physical axes.
4. Use stable semantic object and material names.
5. Document the asset license and every third-party texture.
6. Test load, controls, current-GLB export, and re-import.

## Code contributions

Run:

```text
npm test
npm run build
npm run verify:export
```

Do not add environment, camera, lighting, UI, or runtime shader nodes to exported model GLBs. Do not make UI components reach into Three.js meshes; extend the model adapter or session boundary.

