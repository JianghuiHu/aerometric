# 快速开始

[English](../en/getting-started.md) | 简体中文

## 使用在线 Studio

1. 打开 [aerometric.vercel.app](https://aerometric.vercel.app)。
2. 使用默认 Quadrotor V3、选择 Reference Drone 01，或上传你有权使用的 GLB。
3. 调整颜色、显隐、旋翼、云台、状态、环境和镜头。
4. 将当前可见模型导出为 GLB，或输出不含页面 UI 的 PNG/JPG。

普通 GLB 以兼容 Level 0 载入。添加 DroneProfile 后可获得 Level 1 控制；写入 AEROMETRIC glTF extras 后可通过 Level 2 自动发现语义结构。

## 本地运行

需要当前 Node.js LTS 版本。

```bash
git clone https://github.com/JianghuiHu/aerometric.git
cd aerometric
npm ci
npm run dev
```

Vite 会输出本地地址。Studio 外壳先于默认模型显示；默认模型请求失败时，页面会回退到模型选择和上传状态。

## 验证工作区

```bash
npm run test:source
npm run build
npm run validate:release
npm run validate:library
npm run check:publish
```

如果要制作模型，请继续阅读 [AI Model Skill 使用](./ai-model-skill.md)或[模型标准概览](./model-standard-overview.md)。
