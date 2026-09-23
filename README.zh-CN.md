# AEROMETRIC

[English](./README.md) | 简体中文

**开放式无人机 3D Studio 与模型标准**

在线配置无人机、导入 GLB，也可以让 AI 或 Blender 按统一标准创建可控 3D 无人机资产。

[![在线体验](https://img.shields.io/badge/在线体验-打开_Studio-111111)](https://aerometric.vercel.app) [![许可证：MIT](https://img.shields.io/badge/代码-MIT-111111)](./LICENSE) [![Three.js](https://img.shields.io/badge/Three.js-r179-111111)](https://threejs.org/) [![模型标准](https://img.shields.io/badge/模型标准-0.1-111111)](./docs/zh-CN/model-standard-overview.md)

**[在线体验](https://aerometric.vercel.app)** · **[AI Model Skill](./release/aerometric-0.1/skills/AI_START_HERE.md)** · **[Blender 工具](./release/aerometric-0.1/blender/README.md)** · **[文档](./docs/zh-CN/)**

![AEROMETRIC Studio 与 Quadrotor V3](./docs/assets/aerometric-studio-hero.webp)

## 功能

| | 能力 |
| --- | --- |
| **外观自定义** | 颜色 · 部件 · 材质 · 显隐 |
| **动态控制** | 旋翼 · 云台 · 状态灯 · 状态场 |
| **环境模拟** | 晴天 · 雨天 · 夜间 · 地景 |
| **导入与导出** | GLB · PNG · JPG |
| **AI 创建** | AEROMETRIC Model Skill |
| **Blender 创建** | 模板 · Helper · Validator |

## 在线使用

打开 Studio → 选择官方模型或上传 GLB → 调整外观、状态、环境与镜头 → 导出 GLB、PNG 或 JPG。

**[打开 AEROMETRIC Studio](https://aerometric.vercel.app)**

默认 Quadrotor V3 采用异步加载。即使模型加载失败，Studio 仍会保留模型选择和本地 GLB 上传入口。

## 使用 AI 创建

打开 [AEROMETRIC AI Model Skill](./release/aerometric-0.1/skills/AI_START_HERE.md)，把完整 Skill 目录交给 Codex 或其他兼容 AI Agent，并让它读取 `AI_START_HERE.md`。该流程覆盖层级、Pivot、材质、DroneProfile 映射、导出和重新导入验证。

[阅读 AI Skill 指南](./docs/zh-CN/ai-model-skill.md) · [打开 Skill](./release/aerometric-0.1/skills/aerometric-model/SKILL.md) · [下载 AI Model Kit](./release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip)

## 使用 Blender 创建

[Blender Creator Kit](./release/aerometric-0.1/blender/README.md) 支持角色标记、Rotor Pivot 检查、云台轴设置、状态灯标记、模型层级检查和兼容 GLB 导出。工具用于辅助创作，Model Standard 和 Validator 仍是最终判定依据。

## 官方模型

| 模型 | 定位 | 资产数据 | 用途 |
| --- | --- | --- | --- |
| [Quadrotor V3](./release/aerometric-0.1/models/quadrotor-v3/README.md) | 默认 / 完整功能模型 | 177 Mesh · 79,708 三角面 · 6 个状态灯 · CC0-1.0 | Studio 主视觉、默认模型、完整能力参考 |
| [Reference Drone 01](./release/aerometric-0.1/models/aerometric-reference-drone-01/README.md) | 轻量 / 验证参考 | 2,928 三角面 · 0.19 MB · CC0-1.0 | CI、Validator、Schema、低性能环境与 Skill 示例 |

Quadrotor V3 支持独立换色、部件显隐、旋翼和云台控制、状态灯、状态场、环境与当前状态 GLB 导出。Reference Drone 01 刻意保持轻量和稳定，供自动化验证使用。

记录的本地基线中，V3 Bloom 性能由约 12.3 FPS 提升至 56.8 FPS。实际结果受硬件和场景设置影响，详见[完整性能报告](./release/aerometric-0.1/PERFORMANCE_V3.md)。

## 兼容级别

- **Level 0 — Generic GLB：**有效 GLB，支持查看、镜头、环境和 PNG/JPG 输出。
- **Level 1 — Profile：**GLB 加 `.aerometric.json`，提供语义部件、控制和材质映射。
- **Level 2 — Native：**GLB 内包含 AEROMETRIC glTF extras，可自动发现语义结构。

完整约定和验证流程见[模型标准概览](./docs/zh-CN/model-standard-overview.md)。

## 社区模型库

社区模型只有在具备明确再分发许可，并通过 AEROMETRIC Validator 后才会被收录。模型能力从 DroneProfile metadata 推导，不维护第二套人工能力清单。

[查看公开索引](./public/models/index.json) · [贡献模型](./docs/zh-CN/contributing.md)

## 开发者快速开始

```bash
npm ci
npm run dev
```

验证：

```bash
npm run test:source
npm run build
npm run validate:release
npm run check:publish
```

目录结构：

```text
src/       在线 Studio 源码
public/    公开资产和模型库
release/   版本化发布包
docs/      English 与简体中文文档
scripts/   验证和构建工具
```

## 文档

- [快速开始](./docs/zh-CN/getting-started.md)
- [AI Model Skill 使用](./docs/zh-CN/ai-model-skill.md)
- [模型标准概览](./docs/zh-CN/model-standard-overview.md)
- [Release 0.1 审计](./release/aerometric-0.1/RELEASE_AUDIT_0.1.md)
- [v0.1.1 发布说明](./docs/zh-CN/release-notes-0.1.1.md)
- [English documentation](./docs/en/)

## 贡献

请先阅读[贡献指南](./docs/zh-CN/contributing.md)。模型提交必须提供明确可再分发的许可证，通过 Profile 和模型包 Validator，并满足公开模型库的授权门禁。

## 许可证

- 代码、文档、Skill、Schema、Validator、Blender 工具：[MIT](./LICENSE)
- Quadrotor V3 模型资产：[CC0-1.0](./release/aerometric-0.1/models/quadrotor-v3/LICENSE)
- Reference Drone 01 模型资产：[CC0-1.0](./release/aerometric-0.1/models/aerometric-reference-drone-01/LICENSE)
- 社区模型：各模型包内的独立 `LICENSE`

模型资产许可证不会改变仓库代码许可证。详见[模型资产授权说明](./release/aerometric-0.1/MODEL_ASSET_LICENSE.md)。
