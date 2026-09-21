# AEROMETRIC model skill

Inspect the actual asset before changing it. Report its hierarchy, dimensions, node transforms, pivots, materials, UVs, and animations.

Choose the lowest honest level:

- Level 0: valid generic GLB.
- Level 1: GLB plus a valid Profile whose role candidates exist in the GLB.
- Level 2: GLB nodes contain verified `extras.aerometric` semantics.

Fix topology, UVs, pivots, hierarchy, light fixtures, and stable names in the asset. Use runtime code for semantic adapters, state, material isolation, and export behavior. Preserve source dimensions. Validate the final output with the AEROMETRIC CLI Validator and a GLB re-import.

