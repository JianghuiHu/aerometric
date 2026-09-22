# AEROMETRIC 0.1

AEROMETRIC 是开放的无人机 3D 配置器与模型标准。0.1 版先固定一套小而明确的资产契约，让普通 GLB、带 Profile 的 GLB 和原生 AEROMETRIC GLB 能以不同能力等级进入同一平台。

## 入口

- 模型作者：阅读 [Model Standard 0.1](docs/model-standard.md)。
- AI 建模：先把 [AI_START_HERE.md](skills/AI_START_HERE.md) 交给 Agent。安装 Codex Skill 时，把整个 [`aerometric-model`](skills/aerometric-model/) 目录复制到 `$CODEX_HOME/skills`（通常是 `~/.codex/skills`），然后新建 Codex 任务。
- 开发者：使用 [Profile JSON Schema](schema/aerometric-profile.schema.json) 校验 sidecar 文件。
- Validator：执行 `node validator/src/cli.mjs <模型目录或 GLB> [Profile]`。
- Web Validator：在浏览器本地拖入 GLB 与可选 Profile，文件不会上传。
- Blender 作者：安装 `blender/addon/aerometric_helper` 完成语义标注、检查和导出。
- Studio：在主项目执行 `npm ci` 与 `npm run dev`。内置模型为 CC0 授权的 Reference Drone 01；如内置文件不可用，可通过上传入口或社区模型目录选择模型。Quadrotor V3 不在公开资产中。

平台不会为了预览效果偷偷缩放第三方资产。导入模型的 Geometry、Node Transform、Scale 与物理尺寸保持不变，居中和 Camera Fit 发生在模型外层。

当前包包含 CLI Validator、Web Validator、AI Model Kit、Blender Helper、CI 工作流模板，以及采用 CC0-1.0 许可的 Reference Drone 01 模型包。主仓库代码与 Blender 生成脚本维持 MIT 许可；Quadrotor V3 的再分发授权仍未确认。
