# Quadrotor V3 default model and performance design

Approved scope: the existing Quadrotor V3 becomes Studio's default visual model, screenshot model, and semantic AI/Blender reference. Reference Drone 01 remains the small CC0 validation asset. The user's rights statement authorizes CC0 1.0 for the V3 model and self-authored materials. Repository code and generation scripts stay MIT.

Publish the exact current V3 geometry as a separately licensed official package with Profile, metadata, preview, and the unmodified CC0 legal text. The GLB contains no embedded images; no unrelated files from the private Blender directory enter the public package. The Community Library marks both official entries without duplicating capability declarations. The default model loads asynchronously after the UI renders, with existing empty-state recovery on failure.

Measure performance before edits in one reproducible browser harness: Reference/V3, Bloom on/off, and isolated StatusField, GroundWorld, and Rain switches. Record FPS, mean and p95 frame interval, renderer calls/triangles, model meshes/triangles, DPR, and environment. Run the same harness on the finished branch and keep raw JSON. Headless browser results are comparative, not a substitute for the user's device.

Optimization follows evidence. First remove avoidable per-frame lookup/traversal/allocation, then reduce Bloom scene work if measured, then test DPR 1.5 (up to 1.75 only if justified), keep one 1024 shadow map, and only merge static V3 geometry if draw calls remain a demonstrated bottleneck. No model silhouette change. Offscreen image exports keep their independent resolution.

Acceptance includes source and asset validators, both model loads, independent editing, rotors, gimbal, six LEDs, status field, environments, images, current-GLB roundtrip, bilingual UI, upload, fallback when V3 cannot load, and clean public deployment/package gates. Production changes require a passing PR and Preview before merge.
