# 模型标准概览

[English](../en/model-standard-overview.md) | 简体中文

AEROMETRIC 将模型外形与控制语义分离。兼容模型可以具有不同造型，但都应提供可预测的机身、旋翼、电机、云台轴、摄像头、起落架和状态灯等角色。

## 兼容级别

| 级别 | 模型包 | 可用能力 |
| --- | --- | --- |
| Level 0 — Generic GLB | 有效 `.glb` | 查看、镜头、环境、PNG/JPG |
| Level 1 — Profile | GLB + `.aerometric.json` | 语义部件、控制、材质、显隐组 |
| Level 2 — Native | 含 AEROMETRIC glTF extras 的 GLB | 无需额外映射即可自动发现语义结构 |

## 核心要求

- 使用稳定 Object3D 名称或 Profile 角色映射。
- Rotor Pivot 位于电机中心，并声明旋转轴。
- 需要独立控制的云台轴和显隐部件使用独立节点。
- 需要独立换色的材质必须隔离。
- 状态灯使用实体几何和支持 emissive 的材质。
- 模型包必须包含明确许可证和再分发 metadata。

机器可读定义是最终依据：

- [Model Standard 0.1 完整文档](../../release/aerometric-0.1/docs/model-standard.md)
- [DroneProfile Schema](../../release/aerometric-0.1/schema/aerometric-profile.schema.json)
- [Model Library Schema](../../release/aerometric-0.1/schema/model-library.schema.json)
- [Validator](../../release/aerometric-0.1/validator/README.md)

模型包先运行 `npm run validate:model -- <model-package>`，公开发布前再执行 Release 和 Library 门禁。
