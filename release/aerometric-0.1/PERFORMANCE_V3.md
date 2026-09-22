# Studio performance baseline — Quadrotor V3

Measured on 2026-09-22 with `node scripts/benchmark-studio.mjs` against the local Vite build, Headless Chrome 153, a 1422 × 804 viewport, and the same renderer and scene for both models. The harness uploads each original GLB and records animation-frame intervals and `renderer.info` counters. Results are comparative measurements on this host, not a prediction of a visitor's GPU.

| Model / solid scene | DPR 1 FPS | Frame ms | Draw calls/frame | Rendered triangles/frame | DPR 1.5 FPS | Frame ms | Draw calls/frame |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reference Drone, Bloom off | 60 | 16.7 | 131 | 6,290 | 42 | 24.0 | 124 |
| Reference Drone, Bloom on | 60 | 16.7 | 281 | 12,752 | 12 | 81.2 | 317 |
| Quadrotor V3, Bloom off | 60 | 16.7 | 361 | 161,546 | 47 | 21.2 | 362 |
| Quadrotor V3, Bloom on | 60 | 16.7 | 795 | 348,615 | 12 | 81.2 | 891 |

The source models have 60 meshes / 2,928 triangles (Reference) and 177 meshes / 79,708 triangles (V3). `renderer.info` includes repeated passes and shadows, so rendered triangle counts exceed source geometry counts. At DPR 1.5, Bloom on/off is the largest measured difference even on the light model; geometry alone is not sufficient to explain it. The current Bloom path redraws every mesh after swapping its material, then composites another full scene through a half-float four-sample target. The source already places the six LED meshes on layer 1, so a light-only Bloom pass can avoid that traversal without changing geometry. The 1024 shadow map uses one directional light, already within the requested limit.

Isolation checks at DPR 1.5: disabling StatusField with Bloom on yielded 13 FPS on both models; hiding GroundWorld in sky mode changed Reference from 12 to 14 FPS and V3 from 11 to 14 FPS; toggling Rain particles changed V3 from 11 to 11 FPS. These are smaller than the Bloom delta. The baseline is in `performance-baseline-v3.json` and `performance-baseline-v3-dpr15.json`. The same harness must be rerun after implementation.
