# 贡献指南

## 新增一套皮肤

皮肤放在 `art/skins/<id>/`，最少包含：

```
art/skins/<id>/
├── meta.json        # id / name / latin / appearance / slots / tags
├── components.js    # 插槽组件
├── skin.css         # 令牌与局部样式
└── assets/          # 位图素材（可选）
```

`meta.json` 关键字段：

```json
{
  "id": "my-skin",
  "name": "中文名",
  "latin": "LATIN NAME",
  "appearance": "light",       // light | dark
  "slots": {
    "sidebar.brand.mark": "MyMark",
    "sidebar.brand.name": "MyName"
  }
}
```

然后在 `tools/import-one.mjs` 里登记组件名与插槽映射，再跑：

```bash
npm run build     # 生成 client.js
npm run verify    # 校验插槽、令牌、构建产物
```

## 可用插槽

```
shell.overlay
sidebar.brand.mark          sidebar.brand.name
conversation.hero.brand.mark
conversation.input.left     conversation.composer.dock
sidebar.footer.action
```

同一个插槽可以有多个贡献者，优先级最低的先渲染。

## 素材与授权

- 代码以 MIT 提交，美术素材**不在** MIT 范围内（见 [NOTICE](NOTICE.md)）
- 不要提交任何作品的官方素材、官方标志或可辨认的既有角色
- 使用图像生成平台产出的人物，请在 PR 描述里注明平台
- 同人性质的主题必须附非官方声明与下架承诺

## 提交前

```bash
npm test
```

CI 会跑同样的检查。
