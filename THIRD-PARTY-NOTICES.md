# 第三方组件声明

本仓库包含以下第三方软件。它们的授权与本仓库自身的 MIT（见 [LICENSE](LICENSE)）相互独立。

---

## Three.js

- **位置**：`art/skins/sakura/vendor/three.min.js`（构建时内联进 `client.js`）
- **版本**：r150 系列 UMD 构建
- **用途**：樱花树下皮肤的 3D 场景渲染（WebGL）
- **官网**：https://threejs.org

```
The MIT License

Copyright © 2010-2023 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Three.js 的 MIT 允许商用、修改与再分发，唯一义务是保留上述版权行与许可全文。
本仓库未修改其源码，仅以原样内联。

---

## 未使用的第三方资源

- **字体**：未打包任何字体文件，全部通过字体族名引用系统或已安装字体。
- **贴图**：未使用第三方贴图；所有美术素材来源见 [NOTICE](NOTICE.md)。
- **CDN**：运行时不请求任何外部资源（Three.js 为本地内联）。
