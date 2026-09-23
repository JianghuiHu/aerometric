# AI Model Skill 使用

[English](../en/ai-model-skill.md) | 简体中文

AEROMETRIC Model Skill 帮助 Codex 或其他兼容 AI Agent 创建、改造和检查可控无人机资产。它不能替代 Schema 和 Validator。

## 流程

1. 打开或下载完整的 [`skills` 目录](../../release/aerometric-0.1/skills/)。
2. 把完整目录交给 AI Agent，不要删除其引用文件。
3. 要求 Agent 先读取 [`AI_START_HERE.md`](../../release/aerometric-0.1/skills/AI_START_HERE.md)。
4. 描述无人机和需要支持的控制能力。
5. 明确要求生成 Profile、glTF extras，并执行导出、Validator 与重新导入检查。

示例请求：

> 读取 `AI_START_HERE.md`，按照 AEROMETRIC 标准制作一架兼容四旋翼无人机。需要独立 Rotor Pivot、可控云台、状态灯、可换色材质和显隐组；最终验证并重新导入 GLB。

权威 Skill 入口为 [`aerometric-model/SKILL.md`](../../release/aerometric-0.1/skills/aerometric-model/SKILL.md)。可下载的 [AI Model Kit](../../release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip) 包含配套参考和示例。

模型几何、贴图和其他素材必须具有明确来源与再分发条件。
