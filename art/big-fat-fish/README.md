# 大肥鱼 · 冷调鲸鱼娘主视觉

> 桀骜、孤冷的蓝发鲸鱼娘：半垂眼、微抬下巴、不笑；一对更小、向下耷拉的小鲸鳍耳、白色褶边女仆头饰、
> 深蓝女仆长裙与白围裙，围裙上绣着一只小鲸，身后一条大鲸尾。
> 她贴着画面右缘，身后是冰蓝的晶体、冷光与深水，左侧留出界面文案区。

## 成品

| 文件 | 用途 |
|---|---|
| `cold-16x9.jpg` | 最终图（16:9，2752 × 1536；在基础图上四次 edit 削尖、收小、耷拉、再减小） |
| `keyvisual.jpg` | 适配 2560 × 1440 的最终背景 |
| `keyvisual-preview.jpg` | 1600 × 900 的轻量预览 |
| `art/skins/big-fat-fish/assets/keyvisual.webp` | 运行时背景，约 252 KB，构建时 base64 内联进 `client.js` |
| `art/skins/big-fat-fish/assets/face.webp` | 从最终图裁出的 512 × 512 圆形头像（约 49 KB） |
| `cold-16x9.task.json` | 基础图回执：task id、模型、用量、输出 URL（不含 Key） |
| `cold-16x9-ears.task.json` | 最终耳朵 edit 回执（耷拉 + 再减小版）：task id、模型、用量、源图 URL（不含 Key） |

## 生成

以下命令都在 `huaping/` 根目录执行。

```bash
export FLUX_ART_API_KEY=fa_live_...
node tools/gen-art.mjs \
  --prompt tools/prompts/big-fat-fish/keyvisual-cold-16x9-v3.txt \
  --model gemini-3-pro-image-preview --size 2K --ratio 16:9 \
  --out art/big-fat-fish/cold-16x9.jpg
```

- 模型：Flux Art `gemini-3-pro-image-preview`（Nano Banana Pro），2K，16:9，160 算力/张。
- Prompt：`tools/prompts/big-fat-fish/keyvisual-cold-16x9-v3.txt`。关键描述：
  - 情绪：`cold, aloof, untamed, half-lidded eyes, faint cold smirk, chin raised, unsmiling`
  - 位置：`standing at the RIGHT EDGE, right shoulder and skirt slightly cropped by the right border`
  - 构图：`whole head, ahoge and headdress fully inside the frame with open water above`
  - 参考图元素：`TWO LARGE HORIZONTAL WHALE-FIN EARS with pale ivory inner membranes and ribbed fin rays, clearly visible`、`ONE LONG THIN AHOGE curling in a large loop`、`white pleated blouse, navy bow with faceted sapphire, navy choker with silver buckle, white apron with whale emblem, long navy skirt with gold piping and white frills`
  - 背景：`icy blue abyssal water, translucent diamond ice shards, hard cold light shafts, no warm orange / pink coral / golden bokeh`
- 这一版直接 16:9 出图，不再需要左侧合成；角色本来就在右缘，左侧是冷水区。
- 耳朵不是一次生成到位的：基础图 v3 的鲸鳍耳偏大，随后用 Flux Art 的 `mode: edit` 连续四次只改耳朵——
  - `tools/prompts/big-fat-fish/ear-tweak-v1.txt`：收小约 45–50%，先削尖；
  - `tools/prompts/big-fat-fish/ear-tweak-v2.txt`：再收小约 30%，耳尖降到头饰下方，左右更平衡；
  - `tools/prompts/big-fat-fish/ear-tweak-v3.txt`：改成参考图里的**向下耷拉**小鲸鳍，耳尖朝下/朝外；
  - `tools/prompts/big-fat-fish/ear-tweak-v4.txt`：再减小约 45–50%，只在头发边缘露出小小的耷拉鳍。
  - 最终采用 v4 的小耳，人物、表情、服装、姿势、背景均保持不变；人物再用 CSS 整体右移 60px 贴边。
- Key 只从环境变量读取，不写入仓库；回执只含 task id、模型、用量与源图/输出 URL。

## 头像裁切

`face.webp` 从最终图 `(1720, 70) – (2320, 670)` 的正方形区域裁出，再缩到 512 × 512：
保留脸、鲸鳍耳、褶边头饰、颈环与胸前的蓝宝石领结。圆形遮罩在 CSS 里用 `border-radius` 完成。

## 参考与版权

角色设定参考用户提供的鲸鱼娘设定图：

- 原图：字母AI《DeepSeek 里长出了个“鲸鱼娘”》，36氪，2026-08-20
- 角色原型：上善无形
- 女仆二创：ZipZipPipe
- 标注：言辞之间
- 冷调表情/氛围参考：用户提供的第二张冷调特写（画面签名 Cat），只参考半垂眼、微抬下巴与冰蓝几何氛围，不复用其画面。

本主题的画面是本次通过 Flux Art API **新生成的原创演绎**，不复用参考图的任何像素、线条或文字；
没有 DeepSeek 官方素材、官方 Logo 或官方宣称，主题免费分享、不接赞助。
