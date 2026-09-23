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

## After targeted render-path optimization

The Bloom pass now renders only the LED layer at half resolution. The main scene still renders at the preview DPR, while Bloom no longer swaps materials or traverses the scene each frame. The final composite no longer uses four-sample half-float MSAA. A UI switch can disable Bloom without hiding the LED geometry. The realtime renderer caps DPR at 1.5; the separate high-resolution image exporter is unchanged. No V3 mesh was joined or decimated.

Same host, viewport, Headless Chrome, and DPR 1.5; values are averages over the benchmark windows. FPS can vary across runs, especially near the 60 FPS display cap.

| Model / Bloom | Old FPS | Final FPS | Old frame ms | Final frame ms | Old calls/frame | Final calls/frame | Source meshes / triangles |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reference / off | 41.6 | 56.6 | 24.0 | 17.7 | 124 | 124 | 60 / 2,928 |
| Reference / on | 12.3 | 56.4 | 81.2 | 17.7 | 317 | 155 | 60 / 2,928 |
| V3 / off | 47.2 | 56.6 | 21.2 | 17.7 | 362 | 369 | 177 / 79,708 |
| V3 / on | 12.3 | 56.8 | 81.2 | 17.6 | 891 | 403 | 177 / 79,708 |

The optimized V3 with Bloom on renders about 175,540 triangles per frame including shadows and passes, versus 390,855 before. StatusField, GroundWorld, and rain isolation results are in `performance-final-v3-dpr15.json`; none accounts for the original ~69 ms Bloom penalty. Since source geometry and model materials are unchanged, image sharpness of the drone itself is preserved; the LED glow is deliberately softer at half resolution. This is a local comparative result, not a guaranteed FPS for every visitor.

## v0.1.1 presentation update

The v0.1.1 repository and product-presentation work does not change the measured render path, model geometry, Bloom resolution, shadow settings, or realtime DPR cap. It adds two small header icons and bilingual repository documentation. The candidate production build keeps Bloom in its separately loaded 19.86 KB chunk and the shared Three.js chunk at 552.10 KB uncompressed. The table above remains the current controlled comparison; no new FPS claim is inferred from the documentation-only changes.
