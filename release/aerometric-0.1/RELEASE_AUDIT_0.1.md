# AEROMETRIC Release 0.1 local freeze audit

Audit date: 2026-09-21 (Asia/Shanghai). Scope: local workspace and Vite preview. This is **not approval to publish**.

## Contract and version check

| Component | Version / contract | Result |
| --- | --- | --- |
| Studio package | `0.1.0` | Build and tests pass. The UI's `V3.2.1` is a product iteration label, not a Model Standard version. |
| Model Standard | `0.1` | `docs/model-standard.md` defines levels, roles, extras, export. |
| DroneProfile | `version: 0.1.0` | Schema title/id and Validator require 0.1.x; example and generated Profiles use 0.1.0. |
| Community Library | `version: 0.1.0` | Index, Schema, runtime parser, and local gate agree on required fields. |
| CLI Validator | package `0.1.0` | Uses the same Profile role and capability names as the schema. |
| AI Model Skill | Release 0.1 | References the Model Standard and Profile contract. |
| Blender Helper | `0.1.0` | Exports Profile version 0.1.0. |

Profile capabilities are `partColors`, `partVisibility`, `rotorControl`, `gimbalControl`, `statusLights`, and `statusField`. Community cards derive their labels from a Profile; the Library index contains no second capability list. The Profile Schema parses as JSON and its example passes the runtime Validator. Independent Draft 2020-12 evaluation by a separate JSON Schema engine has not yet been run.

## Required audit results

1. **Production build:** `npm run build` passed. Vite transformed 77 modules; no build errors.
2. **Tests:** Full local `npm test -- --run` passed, 58/58. The source-only subset passed 20/20 without the excluded model asset. Includes negative license-gate tests.
3. **Initial resource path:** `dist/index.html` references the main JS and CSS and preloads the shared `three.module` chunk. Studio then requests `/models/drone_v3.glb`. The Community Library index is requested only when the model menu opens. Bloom is requested through a dynamic import after browser idle (or a short timeout). This is a dependency-path audit, not a timed waterfall measurement.
4. **JS chunks (uncompressed / gzip):** main 176.88 / 51.10 KB; shared Three.js 552.10 / 140.09 KB; Bloom 19.84 / 4.82 KB; GLTFExporter 35.18 / 10.51 KB; GroundWorld 6.33 / 2.61 KB; SimplifyModifier 5.17 / 1.87 KB; image exporter 1.86 / 1.10 KB; RainLayer 1.21 / 0.70 KB. Three.js produces the >500 KB warning. Bloom no longer causes a 572 KB first-screen chunk.
5. **Model Library:** `npm run validate:library` passed at version 0.1.0 with 0 public entries. This empty result is intentional while asset rights remain unresolved.
6. **Profile Schema:** 0.1 Profile example passed `validateProfile` and GLB/sidecar CLI Level 1 validation. Model Library Schema and indexes declare version 0.1.0. Formal independent JSON Schema-engine conformance remains unverified.
7. **License gate:** Local Library validator and CLI community-directory validator reject missing or empty `LICENSE`, missing/ambiguous metadata `license`, and `redistributable !== true`. CI calls the Library validator. Negative tests passed. A statement in metadata cannot itself prove legal ownership; manual rights review remains necessary.
8. **i18n:** zh-CN and en-US each contain 130 keys, with no key missing from either locale.
9. **GLB import:** Browser regression loaded a valid GLB, rejected a broken GLB without replacing the active session, and completed repeated model swaps with stable geometry/texture counts (181/16 before and after).
10. **Exports:** `npm run verify:export` re-imported the exported GLB and confirmed current body/arm colors, hidden camera and landing gear, status-light emissive color, rotor and ripple animation, and scene-system exclusion. `npm run verify:image` passed 1920×1080 and 3840×2160 PNG, transparent PNG, and opaque JPG checks.
11. **Vercel static-deployment risk:** Vite output is static and uses root-relative `/assets/...` URLs, suitable for a root-domain deployment. It has not been tested on an actual Vercel project. **The build copies `public/models/drone_v3.glb` into `dist/models/`, so deploying the current Studio would redistribute an asset whose license is not confirmed.** This blocks deployment regardless of the empty Community index.
12. **Release decision:** Local freeze checks pass. Public Release 0.1 is **blocked** by the model/texture/preview redistribution rights, owner/canonical URL/copyright confirmation, and untested repository-hosted CI/deployment. The large shared Three.js chunk and independent JSON Schema-engine check are tracked as non-blocking follow-ups.

At the local freeze audit, no GitHub Release had been created and no files had been uploaded to an external repository. The subsequent source-only push is recorded below.

## Git source preparation after audit

The repository root now has a release entry README, ignore rules for unlicensed local assets, and source-only CI checks including 20 asset-independent tests. A fresh checkout from the staged Git index, with no `drone_v3.glb`, passed `npm ci`, all 20 source tests, Release validation, and the production build. `npm run check:publish` remains a separate, intentionally failing deployment gate until the built-in GLB has an explicit asset `LICENSE` and `asset-rights.json`.

## First GitHub source push

The source-only `main` branch was pushed to `JianghuiHu/aerometric` as commit `fe3fbd7` using the repository-local Git identity. [GitHub Actions run 35588646422](https://github.com/JianghuiHu/aerometric/actions/runs/35588646422) passed `npm ci`, 20 source tests, Library validation, Release validation, and production build. The public-deployment gate was skipped on this push because it runs only on manual dispatch. The remote Community indexes both contain zero models. The only remote GLBs are the two small synthetic mapping fixtures; Quadrotor V3, Blender files, textures, user uploads, caches, and local secrets were not pushed. No GitHub Release or Studio deployment was created.

## Reference Drone 01 preparation addendum — 2026-09-22

The preceding sections record the historical source-only audit. The local `codex/reference-drone-01` branch now adds an original reference model generated by the repository Blender script, with the unmodified official CC0 1.0 legal code in its package. The CC0 asset scope is the GLB, preview, and model-specific Profile / metadata; software and the generator remain MIT. Quadrotor V3 is still excluded.

- The model is 204,288 bytes, with 60 meshes, 2,928 triangles, and 12 materials. Its sidecar Profile validates at Level 1; the same GLB validates at Level 2 without the sidecar by using glTF extras. The Library entry declares Level 1 because the Library validator checks the supplied Profile path.
- Both Release and Studio indexes contain one model. `npm run validate:library`, `npm run check:publish`, and `npm run validate:release` pass locally. The publish gate checks the official CC0 legal-code SHA-256 and rejects unindexed GLBs and Quadrotor V3.
- `npm run test:source` passes 23/23. Full `npm test` passes 61/61 with the excluded V3 assets supplied temporarily from the local checkout; those temporary test files were removed afterward. `npm run build` passes. The 552.10 KB uncompressed shared Three.js chunk remains a non-blocking optimization item.
- Browser dogfood used the public Library entry: load, color and visibility editing, rotor and gimbal controls, six status-light transitions, sky/rain/night, PNG/JPG rendering, current-state GLB export, and re-import. The re-import preserved body color, omitted the hidden camera, and retained body geometry dimensions. Exported portable status-field meshes are excluded from airframe bounds used for camera fit and hover placement.
- Vercel Preview / Production, canonical domain, and the v0.1.0 GitHub Release have not yet been run. They remain Release 0.1 tasks. No rights conclusion is made for Quadrotor V3 or any user-uploaded asset.

The preparation branch was pushed to GitHub. [Branch CI run 35677661780](https://github.com/JianghuiHu/aerometric/actions/runs/35677661780) passed. The first manual public-deployment gate exposed a workflow setup defect: that job had omitted `npm ci`, so the Validator could not resolve `three`. Commit `c484780` added dependency installation; [manual run 35677883854](https://github.com/JianghuiHu/aerometric/actions/runs/35677883854) then passed both the source and public-deployment-gate jobs. At that point Vercel was not connected or authenticated in this workspace, and no hosted test had occurred.

## Protected Vercel Preview addendum — 2026-09-22

The prior paragraph records the state before Vercel CLI authentication. A new `aerometric` Vercel project is linked locally but is not connected to the Git repository. The tracked `vercel.json` selects Vite, `npm ci`, `npm run build`, and `dist`; `.vercelignore` excludes local V3 review assets, release duplicates, scripts, and old build output. CLI dry-run selected 74 files (533,531 bytes), including the public Reference Drone package and no V3 asset or local secret.

Vercel unexpectedly classified the new project's first deployment as Production even with `--target=preview`; this matches a [reported Vercel CLI issue](https://github.com/vercel/vercel/issues/17069). Its two automatic aliases and the deployment were removed. A second deployment, [Preview `dpl_AY3HjUN84zaRnWahAU6mUHSK84Cu`](https://vercel.com/hujianghui233-2732s-projects/aerometric/AY3HjUN84zaRnWahAU6mUHSK84Cu), is Ready and is the project's only remaining deployment. It uses Vercel Authentication protection.

Browser dogfood against that protected Preview passed both built-in and Community Library loading, Chinese/English toggle, color and visibility editing, rotor and gimbal controls, all six mission status lights, sky/rain/night, PNG/JPG, GLB export, and exported-GLB re-import. Re-import retained the edited body color, omitted the hidden camera, and preserved body geometry dimensions. The preview returns 404 for `/models/drone_v3.glb`. Production, canonical domain, Git integration, and GitHub Release remain pending; the Preview result does not establish those outcomes.

The release artifact build generated `AEROMETRIC_Reference_Drone_01_0.1.zip` with exactly the five licensed model-package files. Regenerating the AI Model Kit also synchronized its bundled Profile Schema title to version 0.1. The user selected `aerometric.vercel.app` as the initial canonical URL; Production and its domain assignment remain to be verified.
