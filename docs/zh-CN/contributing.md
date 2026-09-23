# 贡献指南

[English](../en/contributing.md) | 简体中文

贡献内容可以涉及 Studio、文档、模型标准、Validator、工具或可再分发模型包。改动应保持聚焦，并清楚区分运行时功能和模型资产职责。

## 代码与文档

1. 创建聚焦的功能分支。
2. 运行 `npm ci` 安装依赖。
3. 添加或更新有意义的测试。
4. 运行 `npm run test:source` 和 `npm run build`。
5. 创建 PR，说明行为变化、验证结果和许可证影响。

## 模型包

使用[模型包模板](../../release/aerometric-0.1/models/_template/)，并包含：

- `model.glb`
- `model.aerometric.json`
- `preview.webp`
- `README.md`
- `LICENSE`

许可证必须明确允许再分发，Library metadata 必须设置 `redistributable: true`。能力信息来自 DroneProfile，不维护与其冲突的人工能力列表。

提交前运行：

```bash
npm run validate:model -- <model-package>
npm run validate:library
npm run validate:release
npm run check:publish
```

完整发布贡献规则见 [`release/aerometric-0.1/CONTRIBUTING.md`](../../release/aerometric-0.1/CONTRIBUTING.md)。
