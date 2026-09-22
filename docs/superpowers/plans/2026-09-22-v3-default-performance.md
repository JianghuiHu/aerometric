# Quadrotor V3 Default and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the existing CC0 Quadrotor V3 as Studio's default model with measured performance improvements and retain Reference Drone 01 as the lightweight validation asset.

**Architecture:** A model package supplies V3 GLB, sidecar Profile, preview, and CC0 license through the existing library contract. Studio's built-in model points at that package. A CDP benchmark measures the render pipeline before and after targeted changes.

**Tech Stack:** Vite, vanilla JavaScript, Three.js 0.179, Blender-authored GLB, Node test runner, Chrome CDP.

**Spec:** `docs/superpowers/specs/2026-09-22-v3-default-performance-design.md`

## Global Constraints

- Preserve the exact authored V3 form and independent rotor, gimbal, camera, light, color, and visibility semantics.
- License V3 assets CC0-1.0; leave code, Skill, Schema, Validator, and Blender scripts under MIT.
- Publish no private Blender source directory or unrelated screenshots/textures.
- Image export resolution is independent of interactive DPR.

## Review Focus

- V3 fetch failure must show the model upload/library empty state.
- Asset gate must reject unlicensed, unindexed, or conflicting model files.
- Reference Drone 01 and user-uploaded GLBs must retain their existing flows.
- Bloom-off or hidden lights must not make the complete scene disappear.
- Exported visible parts and edited materials must survive GLB re-import.

---

### Task 1: Reproducible baseline

**Files:** Create `scripts/benchmark-studio.mjs`, `release/aerometric-0.1/PERFORMANCE_V3.md`.

- [ ] Instrument Chrome CDP to load each model and record frame intervals and `renderer.info` deltas for four required Bloom combinations.
- [ ] Measure StatusField, GroundWorld, and Rain on/off separately; include DPR, viewport, and draw calls.
- [ ] Save dated baseline JSON and report measurement limits; commit the harness and report.

### Task 2: Licensed V3 package

**Files:** Create `public/models/quadrotor-v3/{model.glb,model.aerometric.json,preview.webp,README.md,LICENSE}` and release package counterpart; modify `public/models/index.json`, model-library schema/validator, asset gate, and tests.

- [ ] Copy the existing V3 GLB byte-for-byte, verify its hash, and make a matching Level 1 Profile with accurate metrics and six lights.
- [ ] Add official CC0 license, original-source statement, preview, and official metadata; keep Reference Drone 01.
- [ ] Add official model distinction to the library schema and generated card UI, without duplicating capability data.
- [ ] Run Model Package, Profile, extras, library, license, source, and Release validators; commit.

### Task 3: Default Studio model

**Files:** Modify `src/viewer.js`, i18n labels, and relevant source/browser tests.

- [ ] Replace only built-in source/path/label with V3; preserve asynchronous load and fallback.
- [ ] Keep Reference Drone 01 selectable through the Library, and custom upload functional.
- [ ] Verify current-GLB export/re-import and all model controls; commit.

### Task 4: Evidence-based renderer optimization

**Files:** Modify only measured hot-path modules, likely `src/drone/StatusLightBloom.js`, `src/viewer.js`, and focused tests.

- [ ] Use baseline to identify the largest costs; add a failing regression test for the selected hot path.
- [ ] Remove unnecessary per-frame traversal or material swaps if measured; keep mature Bloom implementation.
- [ ] Test bloom-pass resolution, light-only selection, DPR 1.5, shadows, and environment one variable at a time; retain only beneficial changes.
- [ ] Rerun exact benchmarks and visual/functional export checks; commit.

### Task 5: Release integration

**Files:** Update package validators, audit, README, model Skill reference, and screenshots as warranted.

- [ ] Publish a before/after/reference measurement table with hardware and method caveats.
- [ ] Run full local regression with V3, public source CI, Production build, License Gate, and Preview browser dogfood.
- [ ] Check repository tracking and Vercel upload excludes, open a PR, wait for CI/Preview, merge, then verify Production and report results.
