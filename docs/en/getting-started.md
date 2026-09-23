# Getting Started

English | [简体中文](../zh-CN/getting-started.md)

## Use the online Studio

1. Open [aerometric.vercel.app](https://aerometric.vercel.app).
2. Use the default Quadrotor V3, choose Reference Drone 01, or upload a GLB you are allowed to use.
3. Adjust colors, visibility, rotor motion, gimbal, status, environment, and camera.
4. Export the current visible model as GLB, or render PNG/JPG without page UI.

Generic GLBs start at Compatibility Level 0. Add a DroneProfile for Level 1 controls, or AEROMETRIC glTF extras for Level 2 automatic semantic discovery.

## Run locally

Requires a current Node.js LTS release.

```bash
git clone https://github.com/JianghuiHu/aerometric.git
cd aerometric
npm ci
npm run dev
```

Vite prints the local URL. The Studio shell renders before the default model finishes loading, and a failed model request falls back to model selection and upload.

## Validate the checkout

```bash
npm run test:source
npm run build
npm run validate:release
npm run validate:library
npm run check:publish
```

For model creation, continue with [AI Model Skill Usage](./ai-model-skill.md) or [Model Standard Overview](./model-standard-overview.md).
