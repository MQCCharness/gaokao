# 高考志愿 · 命运执笔人（Monogatari 视觉小说版）

将原 HTML 版「高考志愿 Agent」迁移到 **Monogatari Visual Novel Engine v2.8.0**，
以 **二次元 galgame / 视觉小说**的形式呈现：**真实角色立绘站桩**、表情切换、呼吸活体动画、二次元场景背景 + BGM、查分、人格测试、人生理想、志愿推荐。

**「未来回声」主线**：失忆穿越 + 校园地图任务 + 记忆碎片救赎系统。主角穿越回高考填志愿之夜，失忆后通过校园探索找回 5 块记忆碎片，揭示"志愿决定未来"的真相，最终用正确方式重填志愿改写命运。

> 兄弟目录 `../gaokao-agent/` 保留原 HTML 版，互不影响。

## 🗺 失忆穿越主线 · 地图任务系统

- **开场失忆闪回**：主角从 5 年后的失败未来穿越回填志愿之夜，失去记忆，只剩零碎的"未来片段"。
- **全屏校园地图枢纽**：5 个场景节点（教室查分 / 图书室MBTI / 屋上理想 / 食堂兴趣 / 召唤台导师），玩家自由选择探索顺序。
- **记忆碎片系统**：每个任务完成 → 解锁一段"未来困境"闪回（揭示"如果当初没做对会怎样"）。集齐 5 块 → 拼出完整真相 → 解锁志愿提交。
- **角色关系值 + 玩家属性**：4 位主角团（温/凛/阿星/沈）各有 0-100 关系值（友好/信任/挚友档）；玩家有耐心/洞察/勇气/务实 4 项属性。正反馈（认真/深思）+关系，负反馈（毛躁/敷衍）-关系，引导深入思考。
- **解谜元素**：查分关（读位次判断冲/稳/保档）、MBTI 关（区分行为 vs 偏好）等贴合任务主题的小谜题，解出加洞察属性。
- **门控 + 存档提醒**：志愿提交需集齐全部碎片；关键节点首次进入时提醒存档（避免错过分支无法回退）。
- **真相结局**：按关系值总分分支（挚友结局/普通结局/苦涩结局），呼应"志愿决定未来"主题。

## ✨ 二次元 galgame 画面

### 角色立绘（真实二次元 · 3 个不同的人）

主角团与导师团来自开源视觉小说项目 **[houkago_stella](https://github.com/usakan2077/houkago_stella)**（MIT 协议，作者 usakan2077）。
该项目包含 **3 个真正不同造型**的角色（kotoha / mahiru / sakura，不同脸型/发型/身材）× 多套换装变体 × 多表情，解决了「脸模千篇一律」的问题。

| 我们的槽位 | stella 角色 | 视觉特征 | 表情 |
|------------|-------------|----------|------|
| 学姐·温 senior | kotoha（制服） | 紫色长发 | normal/happy/sad |
| 学霸·凛 rival  | sakura（制服） | 黑色短发 | normal/happy/angry |
| 死党·阿星 buddy | mahiru（制服） | 棕色头发 | normal/happy/surprised |
| 导师·沈 guide | kotoha_swimsuit | 紫发泳装（与学姐造型区分） | normal |
| 系统 system   | sakura_sports | 黑发运动装 | normal |
| 导师渊/灿/婉/炽/宁/老朽 | sakura_apron / sakura_swimsuit / mahiru_private / sakura_sports / mahiru_no_camera / mahiru_sports | 各换装造型 | normal |
| **导师凛/朝阳**（新·失忆穿越主线，女性） | kotoha(thinking表情) / mahiru(happy表情) | 紫发冷峻 / 棕发阳光（stella 换装变体） | normal + 2 表情 |

**共 25 张正式立绘**（含 8 位导师），均带程序合成的**闭眼帧**。所有角色均来自 houkago_stella（MIT），画风统一。凛/朝阳为失忆穿越主线新增导师（理性自我/少年热血的人格化身），用 stella 换装变体呈现（仅在导师画廊出现，与主角不同屏）。

### 活体动画系统（Livemotion）

`lib/livemotion.js` 让静态立绘有轻微生气：

- **呼吸**：对角色元素施加 `lm-breathing` 类，CSS `@keyframes lm-breathe` 做 ±6px 纵向微浮动（待机感，自然不违和）。
- **配音 blip**：监听对话框 `data-who`，每句新对话播放 Web Audio 合成的短促「哔」声（galgame 风格，仅在有立绘的角色说话时触发）。
- 由 `MutationObserver` 自动接管所有 `[data-character]` 立绘，无需手写每条语句（去抖 + 已处理集合，避免 observer→DOM 写→observer 死循环）。

> **注**：早期版本曾用程序合成的「闭眼帧 + 嘴型层」做眨眼/对口型，但实测与真实立绘贴合度不够，已停用。立绘本身已足够，只保留呼吸 + blip。`assets/characters/_manifest.json` 与各 `*_blink.png` 文件作为历史产物保留，不再被运行时使用。

### 场景背景

### 场景背景 + 背景音乐（BGM）

**二次元 galgame 场景背景** 9 张，同样来自 **houkago_stella (MIT)**，与角色立绘画风完全统一。每关按剧情氛围配对应场景 + BGM：

| 剧情 | 场景背景 | 氛围 | BGM |
|------|----------|------|-----|
| 开场 | 学校外观·夜 | 静谧/启程 | opening_piano |
| 入营 | 校门·春樱 | 明亮/希望 | daily_life |
| 召唤导师 | 屋上·青空 | 开阔/期待 | mystery_shadow |
| 查分 BOSS | 教室·夜暗 | 紧张/压迫 | predawn_tension |
| MBTI | 图书室 | 静思/内省 | library_quiet |
| 人生理想 | 屋上·星空 | 深邃/憧憬 | night_melody |
| 志愿深空 | 房间·夜 | 私密/沉思 | spring_breeze |
| 聊天 | 食堂 | 松弛/日常 | sunday_afternoon |
| 结局 | 屋上·朝日 | 晨光/释然 | epilogue_sunset |

另有 4 个环境音（SE）：城市早晨、教室嘈杂、铃声、晚风。主菜单主题曲 `title.mp3`。

下载脚本 `lib/fetch-bg.mjs`（从 jsdelivr 拉取 stella 的 `assets/images/bg/`、`assets/audio/bgm/`、`assets/audio/se/`）。
> 早期版本的原创 SVG 背景已替换；生成器 `lib/scenes-gen.mjs` 保留备用。

### 刷新 / 调整角色立绘与背景

```bash
# 1) 从 houkago_stella (MIT) 下载全部立绘到 assets/characters/_stella_*/
node lib/fetch-stella.mjs

# 2) 按槽位映射复制到正式目录 + 合成闭眼帧 + 生成 _manifest.json
node lib/map-stella.mjs

# 3) 场景背景 + BGM + 环境音（houkago_stella）
node lib/fetch-bg.mjs          # → assets/scenes/*.webp, assets/music/*.mp3, assets/sounds/*.mp3

# 4) （备用）原创 SVG 场景背景生成器，已被 stella WebP 背景取代
# node lib/scenes-gen.mjs
```

要换某角色的来源（例如把 senior 换成 mahiru），改 `lib/map-stella.mjs` 顶部 `MAP` 对象，重跑即可。
旧的 Keri 装扮合成方案（`lib/fetch-keri.mjs`）仍保留备用，但已不再用于当前立绘。

## 🎮 怎么运行

需要通过 HTTP 服务打开（Monogatari 用了 LocalStorage / 模块加载，不能直接双击 `file://`）。

**推荐：用项目自带的禁缓存服务器**（解决"第一次打开用旧缓存、必须 Ctrl+Shift+R 才更新"的问题）：

```bash
node serve.mjs            # 默认 8000 端口
node serve.mjs 3000       # 自定义端口
```

它会给所有响应加 `Cache-Control: no-cache`，改完代码**直接刷新**就能看到最新效果，不用硬刷新。

> 也可以用任意静态服务器（`npx serve .` / `python -m http.server 8000`），但那些默认会让浏览器启发式缓存静态文件，改完 CSS/JS 后可能需要 `Ctrl+Shift+R` 硬刷新。

然后浏览器访问 `http://localhost:8000/`，点主菜单「开始」即可。

## 🕹️ 玩法流程

```
片头快闪（16 所名校原创 SVG 建筑剪影）
  ↓
入营登记：选省份 → 选举科组
  ↓
召唤导师：抽卡（SSR/SR/R，6 位原创虚构导师，每位带不同 buff）
  ↓
查分 BOSS 战：自己看 / 自动查分 → 分数面板 + 情绪反应台词
  ↓
MBTI 人格测试：28 题 → 16 型人格卡
  ↓
人生理想：12 种画像选 1
  ↓
兴趣标签：多选
  ↓
志愿表揭晓：抽卡卡面（冲/稳/保 + 匹配度 + 稀有度）
  ↓
自由聊天 / 结局
```

引擎原生提供：**存档 / 读档 / 回滚 / CG 回廊 / 历史记录 / 设置（音量·文字速度）**。

## 📁 目录结构

```
gaokao-monogatari/
├── index.html              # 入口（加载顺序：engine → data → lib → js）
├── engine/                 # Monogatari v2.8.0 引擎（勿改）
├── assets/
│   ├── characters/         # ★ 角色立绘 PNG（houkago_stella, MIT）
│   │   ├── senior/rival/buddy/guide/   # 4 主角（各 normal + 2 表情 + 闭眼帧）
│   │   ├── mentor_yuan … mentor_lao/   # 6 导师（各 normal + 闭眼帧）
│   │   ├── system/                     # 系统（normal + 闭眼帧）
│   │   └── _manifest.json              # 眼区/嘴区 bbox + 闭眼帧文件名（livemotion 用）
│   ├── scenes/             # ★ 场景背景（houkago_stella WebP）：9 张
│   ├── music/              # ★ BGM（houkago_stella MP3）：9 关 + 主菜单主题曲
│   └── sounds/             # ★ 环境音 SE（houkago_stella MP3）：城市/教室/铃声/风
├── data/                   # 数据层（复用自 HTML 版，挂 window.*）
│   ├── provinces.js  mbti.js  mbti-questions.js  majors.js
│   ├── universities.js  careers.js  mentors.js  achievements.js
│   └── intro-landmarks.js   # 16 所名校原创 SVG 建筑剪影
├── lib/                    # 游戏逻辑 + 美术生成器
│   ├── sfx.js        # Web Audio 纯合成音效（零资源）+ voice() 对口型 blip
│   ├── score.js      # 查分 + 情绪反应
│   ├── recommender.js# 6 维志愿推荐引擎
│   ├── agent.js      # AI Agent 关键词对话（4 种人格）
│   ├── game.js       # 等级/经验/成就/抽卡
│   ├── bridge.js     # GK.* 桥接层 + 动态 Choice 工厂 picker()
│   ├── livemotion.js # ★ 活体动画（眨眼/呼吸/对口型，MutationObserver 自动接管）
│   ├── actions.js    # 自定义 Action（保留扩展用）
│   ├── fetch-stella.mjs # ★ 从 houkago_stella (MIT) 下载立绘
│   ├── map-stella.mjs   # ★ 映射到角色目录 + 合成闭眼帧 + manifest
│   ├── fetch-keri.mjs   # ★ Keri 装扮合成（新男性导师凛风/朝阳由此生成）
│   ├── portrait-gen.mjs # （旧）SVG 立绘生成器，已停用
│   ├── scenes-gen.mjs   # 场景背景生成器
│   └── map-gen.mjs      # ★ 校园俯视地图底图生成器（失忆穿越主线）
├── js/
│   ├── options.js    # 引擎设置（游戏名/存档/语言等）
│   ├── storage.js    # 初始存档树（含 gk 子树 + cleared/shards/relations/attrs）
│   ├── script.js     # ★ 主剧本（角色立绘/表情切换/场景/全部标签与流程）
│   ├── story.js      # ★ 失忆穿越主线扩展（闪回/地图枢纽/碎片闪回/解谜/真相结局）
│   └── main.js       # 入口 + 片头快闪 + 进度条 + 音频修复
└── style/
    ├── main.css      # 引擎自带
    └── gaokao.css    # ★ 游戏化样式 + livemotion CSS（lm-breathing/lm-blink/lm-mouth）
```

## ⚙️ 关键技术决策（Monogatari v2 实测约束）

迁移过程中实测确认了 Monogatari v2 的若干硬约束，`script.js` 的结构完全由此决定：

| 约束 | 说明 | 应对 |
|------|------|------|
| **Choice 必须是字面对象语句** | `function(){ return {Choice} }` 不渲染 | 所有 Choice 用字面 `{ Choice:{...} }` |
| **Choice.Do 只接受字符串** | `Do: function(){}` 不渲染按钮 | `Do: 'jump Label'` |
| **函数 return 'jump X' 不可靠** | 函数语句返回跳转字符串常不生效 | 用 `[function(){写状态}, 'jump X']` 两语句 |
| **选项 Do 直接 jump 到「首句为函数」的标签会失败** | `Do:'jump MultiStmtLabel'` 若该标签首句是 function，跳转后空白 | 中间插一个 2 语句「前置标签」（如 `WishRevealPre`）过渡 |
| **对话框每句替换上一句** | 卡面 HTML 作为普通对话行会消失 | 卡面 HTML 放进 **Choice.Dialog**，与按钮同屏 |
| **Choice.Dialog 加载期求值** | `{Dialog:'...'+fn()}` 在模块加载时就调用 fn | 用 **live choice 对象**，在前置函数里改写 `.Dialog` |
| **动态多选项** | 引擎无内联 JS 语句、无 `if` | `GK.picker()` 预生成「字面 Choice + 每项 handler 标签」 |
| **角色立绘字段名** | 引擎 show-character 读 `character.sprites[expr]`，由 `Images` 字段规范化而来；用 `Sprite` 不会加载 | 角色定义用 **`Images: {normal, happy, sad}`**（非 `Sprite`） |
| **show character 语法** | `at center` 位置参数在该版本不被解析 | 用 `show character <id> <expression> with <transition>`（不带 `at center`） |
| **jump 目标首句不能是 show scene** | `Choice.Do:'jump X'` 跳转到 X 后，若 X 的**首句**是 `show scene ... with fadeIn`，引擎卡在 step 0 不推进（DOM 空、choice 不渲染） | jump 目标标签首句改用纯对话/函数，把 `show scene` 移到标签**第二句之后**，或干脆省略（沿用上一场景） |
| **函数 return 'jump X' 不可靠** | 函数语句返回 jump 字符串，引擎执行了函数但不推进 | 用「写状态 + 字面 jump 两语句」分支，或合并到单一标签内用函数决定台词（不做条件 jump） |

### 动态 Choice 工厂 `GK.picker()`（lib/bridge.js）

```js
const provPick = GK.picker({
  dialog: 'system 请选择省份',
  items: [{label, value}, ...],     // 任意数量
  onPick: (v) => { GK.set({province: v}); },
  nextLabel: 'EnrollGroupChoice',
  prefix: '_prov',
});
// 返回 { statement: {Choice...}, handlers: { _prov_h0:[fn,'jump X'], ... } }
// statement 作为标签的字面语句；handlers 注册为独立标签
```

MBTI 28 题循环用更专门的方案：预生成 28×2 个 handler（`_mbtiA_0.._mbtiB_27`），
最后一题跳 `MbtiResult`，其余跳回 `MbtiQuiz`；`MbtiQuiz` 函数实时改写 `quizChoice` 的 A/B 指向。

## 📝 合规与署名

### 角色立绘 — MIT 协议（需保留署名）

本项目角色立绘源自开源视觉小说 **[houkago_stella](https://github.com/usakan2077/houkago_stella)**（作者 **usakan2077**，**MIT License**）。

> MIT 协议要求在分发时保留原版权声明与许可文本。原项目许可证详见：<https://github.com/usakan2077/houkago_stella/blob/master/LICENSE>

本项目对其立绘做了：
- 按角色槽位**重命名**（kotoha→senior 等）与**裁选**（只取需要的表情）；
- 程序**合成闭眼帧**（原作无闭眼图层）；
- 角色姓名（温/凛/阿星/沈/渊/灿/婉/炽/宁/老朽）为**原创虚构**，与原作角色无关。

如需重新获取原始立绘：`node lib/fetch-stella.mjs`（从 jsdelivr CDN 拉取 houkago_stella 仓库的 `assets/images/chars/`）。

### 其他

- **场景背景图、BGM、环境音 SE** 均来自 **houkago_stella (MIT)**，与角色立绘同源，画风/曲风统一。详见 `assets/characters/THIRD_PARTY_LICENSES.md`。
- 所有名校剪影为**原创 SVG 矢量演绎**（参照公共建筑外轮廓二次创作），不含任何高校官方校徽/商标。
- 角色姓名（温/凛/阿星/沈/渊/灿/婉/炽/宁/老朽）为原创虚构，不使用真实公众人物姓名/肖像。
- 交互音效（点击/暴击/抽卡/对话 blip）为 **Web Audio API 纯合成**（`lib/sfx.js`），零外部音频资源。
- 本作品仅作教育与演示用途。

## 🛠️ 引擎

[Monogatari](https://github.com/Monogatari/Monogatari) v2.8.0 — MIT 协议。
