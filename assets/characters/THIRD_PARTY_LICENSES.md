# 第三方素材许可声明

本项目使用的角色立绘、场景背景图、背景音乐（BGM）、环境音（SE）均源自开源视觉小说项目 **houkago_stella**。

## houkago_stella

- **项目地址**：<https://github.com/usakan2077/houkago_stella>
- **作者**：usakan2077
- **许可证**：MIT License

### MIT License (原作)

```
MIT License

Copyright (c) [year] usakan2077

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

### 本项目对原立绘的处理

- 按角色槽位**重命名**（如 `kotoha/normal.png` → `senior/senior_normal.png`）；
- **裁选**部分表情（未使用全部变体）；
- 程序**合成闭眼帧**（`*_blink.png`，原作无闭眼图层，由 `lib/map-stella.mjs` 用眼区检测 + SVG 弧形覆盖生成）——**历史产物，当前运行时不再使用**（详见根 README 的 Livemotion 章节）；
- 角色姓名（温/凛/阿星/沈 等）为**原创虚构**，与原作角色无关。

如需重新获取原始立绘，运行 `node lib/fetch-stella.mjs`（从 jsdelivr CDN 拉取原仓库 `assets/images/chars/`）。

## 场景背景图（assets/scenes/*.webp）

9 张二次元 galgame 场景背景，来自 houkago_stella 的 `assets/images/bg/`：

| 我们的文件 | 原作文件 | 内容 |
|------------|----------|------|
| scene-start.webp | school_exterior_night.webp | 学校外观·夜 |
| scene-enroll.webp | school_gate_spring.webp | 校门·春樱 |
| scene-summon.webp | rooftop.webp | 屋上·青空 |
| scene-score.webp | classroom_night.webp | 教室·夜暗 |
| scene-mbti.webp | library.webp | 图书室 |
| scene-vision.webp | rooftop_night.webp | 屋上·星空 |
| scene-wish.webp | protagonist_room_night.webp | 房间·夜 |
| scene-chat.webp | cafeteria.webp | 食堂 |
| scene-end.webp | rooftop_dawn.webp | 屋上·朝日 |

## 背景音乐（assets/music/*.mp3）

9 首 BGM + 1 首主菜单主题曲，来自 houkago_stella 的 `assets/audio/bgm/`：opening_piano / daily_life / mystery_shadow / predawn_tension / library_quiet / night_melody / spring_breeze / sunday_afternoon / epilogue_sunset_for_each / title。

## 环境音 SE（assets/sounds/env-*.mp3）

4 个环境音，来自 houkago_stella 的 `assets/audio/se/`：city_morning / classroom_noise / chime_soft / evening_wind。

如需重新获取背景与音频，运行 `node lib/fetch-bg.mjs`。

### 对原作素材的处理

所有背景图、BGM、SE **未经修改**，仅按用途重命名（如 `school_gate_spring.webp` → `scene-enroll.webp`）。
