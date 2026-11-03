# 安全说明

## 这个插件会做什么

画屏是一个 DSH 客户端主题包，运行在 Web UI 的渲染进程里：

- 注入 CSS（每个皮肤一套 110 个 `--dsw-alias-*` 变量与局部样式）
- 在若干插槽里渲染 React 组件（侧栏标志、品牌名、输入区、悬浮切换器、启动幕）
- 樱花树下皮肤额外内联了一份 Three.js（MIT），在本地创建 WebGL 画布

它**不会**：

- 发起任何网络请求（Three.js 与所有素材均为本地内联）
- 读取或上传对话内容
- 写入除 `localStorage` 之外的持久化数据（只存当前皮肤 ID）

## 报告漏洞

请通过 GitHub 的 **Security → Report a vulnerability** 私密提交，或开 issue 并勾选"security"标签。
涉及 XSS、CSS 注入、越权读取的，请在标题注明 `[security]`。

收到后 7 天内回复，修复版本会记入 [CHANGELOG](CHANGELOG.md)。

## 支持范围

只维护最新发布版本的修复。皮肤素材引发的版权问题不属于安全范畴，请走 [NOTICE](NOTICE.md) 里的下架渠道。
