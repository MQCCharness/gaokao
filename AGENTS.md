# 高考志愿 · 命运执笔人（galgame） · 项目总记忆

> 本文件是项目的**长期记忆**，记录架构决策、数据流、关键约束、踩过的坑。
> 任何接手者（人或 AI）应先读本文件，避免重复踩坑或破坏既有设计。

---

## 一、项目定位

- **目录**：`G:\G_cursor\gaokao-monogatari\`
- **类型**：二次元 galgame / 视觉小说，基于 **Monogatari Visual Novel Engine v2.8.0**
- **创意**：玩家扮演从五年后穿越回来、失忆的人，在校园探索找回记忆碎片，最终正确填报高考志愿、改写命运
- **兄弟目录**：`../gaokao-agent/` 是更早的纯 HTML 版，已停更，互不影响
- **GitHub**：https://github.com/MQCCharness/gaokao.git（分支 `main`）

---

## 二、架构总览

### 前端（浏览器，Monogatari 引擎）
```
index.html              入口（加载顺序严格：engine → data → lib → js）
engine/                 Monogatari v2.8.0 引擎（勿改）
assets/                 立绘(34角色)/场景(16)/BGM(10)/配音(10角色)
data/                   数据层：provinces/mbti/universities(38样本)/mentors...
lib/                    游戏逻辑 + 美术生成器
  ├── agent.js          ★ 离线对话 + AI_REAL 接入层（ping/rank/analyze/stream/realRank/realRecommend）
  ├── bridge.js         ★ GK.* 桥接层 + 动态 Choice + showRealScoreForm + wishlistHtml
  ├── score.js          查分 + 情绪反应
  ├── recommender.js    本地志愿推荐（基于 universities.js）
  ├── livemotion.js     活体动画（呼吸 + blip）
  └── sfx.js            Web Audio 音效
js/                     剧本
  ├── script.js         主剧本（669 行）
  ├── story.js          失忆穿越主线（752 行）
  ├── storage.js        存档树
  ├── options.js        引擎设置
  └── main.js           入口 + 片头快闪
style/gaokao.css        游戏化样式 + AI 推荐区块
```

### 后端（`server-ai.mjs`，端口 8001）
```
端点：
  GET  /api/status              服务状态
  GET  /api/rank-estimate       本地公式位次估算（毫秒级）
  GET  /api/realdata/rank       ★ 真实位次（HuggingFace 一分一段表）
  GET  /api/realdata/recommend  ★ 真实院校推荐（2024 投档线）
  POST /api/analyze             非流式 AI 分析
  POST /api/analyze/stream      ★ SSE 流式 AI 分析（打字机效果）
  POST /api/recommend           本地结构化推荐 + AI 点评
```

---

## 三、AI 数据流（核心 · 数据真实性保障）

### 现实路径完整流程
```
玩家在查分关卡选"📊 现实路线" → 输入真实分数（如浙江 620）
  ↓
Step 1: 本地公式估算秒出（avoid 空白等待）
Step 2: 异步拉真实一分一段表（HuggingFace）→ 覆盖显示真实位次（34040）
Step 3: AI 流式分析（SSE）→ prompt 注入真实位次+真实院校，AI 只能引用不能编造
Step 4: 输出校验 → AI 的 rank 若偏离真实值 >5% 则强制覆盖
Step 5: 点"使用此分数" → 异步拉真实院校推荐（冲6/稳6/保4）
Step 6: 志愿揭晓 wishlistHtml 显示 → 含真实录取数据区块（绿色高亮）
```

### 三大数据真实性保障
1. **位次**：HuggingFace Gaokao-Compass-11M 一分一段表（2024 真实数据），AI 无权修改
2. **院校**：2024 真实投档线，AI 只能从给定列表引用
3. **AI 输出校验**：解析 AI 返回的 rank，偏离权威值 >5% 强制覆盖（`rankCorrected` 标记）

---

## 四、外部依赖与配置

### .env（不进 git）
```bash
AI_API_KEY=tp-xxx                    # 小米 MiMo 中转 token
AI_BASE_URL=https://token-plan-cn.xiaomimimo.com
AI_MODEL=mimo-v2.5
AI_PROVIDER=openai
AI_MAX_TOKENS=16384                  # 推理模型必须给足，否则 content 为空
```

### 数据源
- **AI 模型**：小米 MiMo v2.5（经第三方中转，OpenAI 兼容格式）
  - ⚠️ **推理模型**：max_tokens 必须 ≥8000，否则 reasoning 用完后 content 为空
  - 流式：首字节 500ms，content 首块 ~20s（reasoning 完成后）
- **真实数据**：[HuggingFace Gaokao-Compass-11M](https://huggingface.co/datasets/choucsan/Gaokao-Compass-11M)
  - MIT 协议，1132 万行，覆盖 31 省 × 2017-2025
  - 按需加载单省单年 CSV（score-range ~32KB + school-admission ~457KB）
  - 本地缓存到 `data_cache/`（24h TTL，自动刷新）

---

## 五、Monogatari v2 硬约束（踩坑记录）

> 这些是迁移过程中实测确认的引擎限制，违反会导致渲染失败或卡死。

| 约束 | 应对 |
|------|------|
| Choice 必须是字面对象语句 | 所有 Choice 用字面 `{ Choice:{...} }` |
| Choice.Do 只接受字符串 | `Do: 'jump Label'`（不能是 function）|
| 函数 return 'jump X' 不可靠 | 用 `[function(){写状态}, 'jump X']` 两语句 |
| **jump 目标首句不能是 `show scene ... with fadeIn`** | 会卡 step 0，首句用函数或纯对话 |
| 角色立绘用 `Images:` 字段（不是 `Sprite:`）| `Images: { normal:'x.png', happy:'y.png' }` |
| 动态多选项 | `GK.picker()` 预生成字面 Choice + handler 标签 |

---

## 六、运行方式

```bash
# 1. 启动后端（AI + 真实数据，端口 8001）
cd gaokao-monogatari
node server-ai.mjs

# 2. 启动前端（禁缓存服务器，端口 8000）
node serve.mjs

# 3. 浏览器打开
# http://localhost:8000/
```

- 前端依赖 HTTP 服务（Monogatari 用 LocalStorage，不能 `file://`）
- `serve.mjs` 自带 `Cache-Control: no-cache`，改代码直接刷新即可
- 无 API Key 时自动降级到本地估算模式（玩家无感知）

---

## 七、关键约定

1. **`.env` 永远不进 git**（已在 .gitignore，历史也干净）
2. **`data_cache/` 不进 git**（运行时缓存，可重新生成）
3. **测试探针 `_probe*.mjs` 不进 git**（已在 .gitignore）
4. **改 `engine/` 之外的核心文件后，跑浏览器实测**（puppeteer + Chrome headless）
5. **commit 格式**：`YYYY-MM-DD v版本号 · 阶段描述：具体内容`

---

## 八、开发进度时间线

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06 ~ 07-03 | v0.1 ~ v0.4 | 失忆穿越主线 + 地图任务 + 角色/配音/解谜 + 移动端 |
| **2026-07-04** | **v0.5** | **AI 功能增强 + 真实院校数据接入 + 数据校验** |

### 2026-07-04 本次完成（v0.5）
1. ✅ 后端重构：server-ai.mjs v2（4+2 个接口）
2. ✅ 接入小米 MiMo（OpenAI 兼容 + 流式 SSE）
3. ✅ 前端 AI_REAL 接入层 + CSP 修复
4. ✅ 查分关卡现实路径（流式打字 + 本地推荐联动）
5. ✅ 志愿表显示 AI 推荐院校（含 CSS）
6. ✅ 接入 HuggingFace 真实数据（一分一段表 + 投档线，1564 所院校）
7. ✅ max_tokens 拉到 16384（解决推理模型截断）
8. ✅ 数据真实性校验（AI 必须用真实位次，输出 rank 强制校验）

---

## 九、下次可以继续的方向

- [ ] 更多年份选择（目前固定 2024，可让玩家选 2023/2022 对比）
- [ ] 专业级推荐（用 major-admission.csv，3MB/省）
- [ ] 招生计划/学费显示（用 enrollment-plan.csv）
- [ ] AI 建议与剧情深度联动（导师角色根据 AI 结果做不同反应）
- [ ] 移动端现实路径表单适配
- [ ] 多省份数据预加载（减少首次等待）
