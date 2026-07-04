/**
 * AI Agent 对话系统（galgame 化）
 * - 角色：根据当前阶段切换"陪伴人格"（温柔学姐 / 毒舌学霸 / 中二伙伴 / 沉稳导师）
 * - respond(userText, state): 返回 { speaker, text, mood, choices }
 *
 * 这是离线规则 + 模板系统，不依赖外部 API。
 * 关键词触发 + 状态机分支，模拟"被理解"的对话感。
 */

const AGENT = (() => {

  // —— 陪伴人格（4 种）——
  const PERSONAS = {
    senior:  { name:'学姐·温', color:'#B07AAC', emoji:'🌸', voice:'温柔、治愈、共情' },
    rival:   { name:'学霸·凛', color:'#5B7FB8', emoji:'⚔️', voice:'毒舌、理性、护短' },
    buddy:   { name:'死党·阿星', color:'#C09A6F', emoji:'🔥', voice:'活泼、中二、打气' },
    mentor:  { name:'导师·沈', color:'#3D8A9E', emoji:'🦉', voice:'沉稳、专业、洞察' },
  };

  // —— 状态：当前人格 + 当前阶段 ——
  let current = 'senior';

  function setPersona(p){ if(PERSONAS[p]) current = p; }
  function getPersona(){ return PERSONAS[current]; }

  // —— 关键词规则库 ——
  // 每条：{ k:[关键词], r:(state)=>回复 }
  const RULES = [
    {
      k:['紧张','害怕','不敢','慌','焦虑','怕','担心','压力'],
      r:(s)=>({
        text:`我感受到你在发抖了。${pick([
          '高考只是一次考试，不是你人生的审判。',
          '深呼吸。你今天能坐在这里，已经比很多人勇敢了。',
          '紧张是正常的——说明你在乎。但请相信，你比自己想象的强大。',
        ])}`,
        mood:'warm',
        choices:['谢谢你…','我还是有点怕','我们继续吧'],
      }),
    },
    {
      k:['考砸','没考好','完蛋','凉了','失败','低分','不行'],
      r:(s)=>({
        text:`${pick([
          '嘿，先别给自己下判决书。我见过太多"考砸"的人，后来活得漂亮极了。',
          '分数低不等于人生低。志愿填得好，照样能逆风翻盘。',
          '你愿意说出来，就说明你还没放弃——这就是希望本身。',
        ])}`,
        mood:'encourage',
        choices:['真的吗？','那我该怎么办','帮我填志愿'],
      }),
    },
    {
      k:['考好','高分','不错','满意','超常','第一','状元'],
      r:(s)=>({
        text:`${pick([
          '哇哦！！我就知道你可以！这下我们要好好规划一下未来了！',
          '恭喜你！但别飘哦——填志愿可是第二场硬仗。',
          '漂亮！这种时候就该去吃顿好的，然后我们挑学校！',
        ])}`,
        mood:'happy',
        choices:['哈哈谢谢','帮我填志愿','我想聊聊未来'],
      }),
    },
    {
      k:['志愿','填志愿','报志愿','怎么填','学校','专业'],
      r:(s)=>({
        text:`填志愿这事儿，交给我。我们分四步走：
① 先看你分数在省内大概什么位置（冲/稳/保）；
② 再看你的人格和兴趣，适合哪类专业；
③ 结合你想成为什么样的人（人生理想）；
④ 最后按"冲2、稳4、保2"排出一张表。
准备好了吗？我们一步步来。`,
        mood:'pro',
        choices:['开始吧','先做人格测试','先聊聊我的理想'],
      }),
    },
    {
      k:['人格','mbti','性格','MBTI','测试'],
      r:(s)=>({
        text:`人格测试是认识自己的一面镜子——它不会定义你，但能帮你看见自己擅长什么、在意什么。
我可以带你做一份 28 题的小测试，约 3 分钟。`,
        mood:'pro',
        choices:['好，做测试','测试有用吗','跳过，直接推荐'],
      }),
    },
    {
      k:['理想','未来','梦想','人生','想成为','规划'],
      r:(s)=>({
        text:`${pick([
          '想成为什么样的人，比考多少分更重要。这是你志愿表的灵魂。',
          '我这里有 12 种"人生理想"画像，看看哪个让你心跳加速？',
          '理想不是空话——它会决定你四年学什么、余生做什么。',
        ])}`,
        mood:'inspire',
        choices:['看看 12 种理想','我自己说','先填志愿再说'],
      }),
    },
    {
      k:['你好','嗨','hello','hi','在吗','你是谁'],
      r:(s)=>({
        text:`嗨～我是你的高考志愿陪伴 Agent。你可以叫我"${PERSONAS[current].name.replace(/.*·/,'')}"。
我能帮你：查分数、做人格测试、聊聊人生理想、最后把志愿表填得漂漂亮亮。
今天，你想从哪里开始？`,
        mood:'greet',
        choices:['查分数','人格测试','聊聊未来','填志愿'],
      }),
    },
    {
      k:['谢谢','感谢','谢','thx','thanks'],
      r:(s)=>({
        text:`${pick([
          '不用谢，能陪你走这一程，是我的荣幸。',
          '嘿嘿，我们可是搭档啊！',
          '记着——你的人生，是你自己的功劳。我只是递了把伞。',
        ])}`,
        mood:'warm',
        choices:['继续吧','我想换个人格','再见'],
      }),
    },
    {
      k:['再见','拜拜','bye','走了','88'],
      r:(s)=>({
        text:`再见！无论你去到哪所学校，都要记得：你值得被温柔以待。
祝前程似锦，未来可期。🌙`,
        mood:'farewell',
        choices:[],
      }),
    },
  ];

  // —— 兜底回复 ——
  const FALLBACKS = {
    senior:[
      '嗯，我在听。能多说一点吗？',
      '我懂你的意思。我们一起把它想清楚。',
      '没关系，慢慢说，我有的是时间陪你。',
    ],
    rival:[
      '哈？说清楚点，我可没空猜谜。',
      '别绕弯子，直说你要干嘛。',
      '你这话说得我有点懵——但我还是会帮你的。',
    ],
    buddy:[
      '诶诶诶？展开讲讲！',
      '哈哈哈你别卖关子啊！',
      '好嘞，咱们一步步来，不急不急！',
    ],
    mentor:[
      '请继续。我需要更多上下文。',
      '你的想法很有意思，能具体说说吗？',
      '把问题拆开看，我们一个一个解决。',
    ],
  };

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function respond(userText, state={}) {
    const text = (userText||'').trim();
    if (!text) {
      return { speaker:PERSONAS[current], text:'嗯？你想说什么呀？', mood:'idle', choices:[] };
    }
    for (const rule of RULES) {
      if (rule.k.some(kw => text.includes(kw))) {
        const out = rule.r(state);
        return { speaker:PERSONAS[current], ...out };
      }
    }
    return {
      speaker:PERSONAS[current],
      text: pick(FALLBACKS[current]),
      mood:'idle',
      choices:['查分数','人格测试','聊聊未来','填志愿'],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  AI 现实路线接入层（v2 · 2026-07）
  //  ───────────────────────────────────────────────────────────────────────
  //  对接 server-ai.mjs（默认 http://localhost:8001）。
  //  设计原则：
  //    · 完全独立，不影响离线规则系统（respond() 不变）
  //    · 后端不可达时静默降级到本地估算
  //    · 流式接口用 ReadableStream + 回调，适配 galgame 打字机
  //
  //  用法：
  //    const res = await AI_REAL.analyzeStream(
  //      {province:'浙江',group:'物理组',score:620,total:750},
  //      { onMeta:(m)=>..., onContent:(text)=>..., onError:(e)=>... }
  //    );
  // ───────────────────────────────────────────────────────────────────────
  const AI_REAL = (() => {
    // 后端地址：优先 localStorage 覆盖，默认本机
    function baseURL () {
      try {
        const saved = localStorage.getItem('gk_ai_base');
        if (saved) return saved.replace(/\/$/, '');
      } catch (e) { /* SSR 或隐私模式 */ }
      return 'http://localhost:8001';
    }

    // 状态探测（Promise<boolean>：后端是否在线 + 是否配 Key）
    async function ping () {
      try {
        const r = await fetch(baseURL() + '/api/status', { signal: AbortSignal.timeout(2000) });
        if (!r.ok) return { ok: false };
        const d = await r.json();
        return { ok: true, hasKey: !!d.hasKey, model: d.model, universities: d.universities || 0 };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }

    // 纯位次估算（GET，毫秒级，本地计算）
    async function rank (score, total, province) {
      try {
        const url = `${baseURL()}/api/rank-estimate?score=${score}&total=${total}&province=${encodeURIComponent(province)}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { return null; }
    }

    // 非流式分析（一次性返回完整 JSON）
    async function analyze ({ province, group, score, total, subjects }) {
      try {
        const r = await fetch(baseURL() + '/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ province, group, score, total, subjects }),
        });
        if (!r.ok) return { error: 'HTTP ' + r.status };
        return await r.json();
      } catch (e) { return { error: e.message }; }
    }

    // 流式分析（SSE · 打字机效果核心）
    // callbacks: { onMeta(meta), onContent(textChunk), onDone(fullText), onError(err) }
    async function analyzeStream (params, callbacks = {}) {
      const { onMeta, onContent, onDone, onError } = callbacks;
      try {
        const resp = await fetch(baseURL() + '/api/analyze/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (!resp.ok || !resp.body) {
          if (onError) onError('HTTP ' + resp.status);
          return;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let full = '';
        let doneReceived = false;
        // 处理 buf 中残留的行
        function processBuf (isFinal = false) {
          const lines = buf.split('\n');
          buf = isFinal ? '' : lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === 'meta' && onMeta) onMeta(ev);
              else if (ev.type === 'content') { full += ev.text; if (onContent) onContent(ev.text); }
              else if (ev.type === 'done') { doneReceived = true; if (onDone) onDone(full); }
              else if (ev.type === 'error' && onError) onError(ev.message);
            } catch (e) { /* 跳过坏行 */ }
          }
        }
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          processBuf(false);
        }
        // flush 解码器 + 处理最后一行
        buf += decoder.decode();
        processBuf(true);
        if (!doneReceived && onDone && full) onDone(full); // 兜底：未收到 done 事件也触发
      } catch (e) {
        if (onError) onError(e.message);
      }
    }

    // 结构化推荐（本地+AI 点评）
    async function recommend ({ score, total, province, group, interests, ideal }) {
      try {
        const r = await fetch(baseURL() + '/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, total, province, group, interests, ideal }),
        });
        if (!r.ok) return { error: 'HTTP ' + r.status };
        return await r.json();
      } catch (e) { return { error: e.message }; }
    }

    // 真实位次查询（基于一分一段表，HuggingFace 数据集）
    // 返回 { real: {rank, category, year, source, verifyUrl} | null, estimate, tier }
    // multi=true 时额外返回 multi.years（近3年对比）
    async function realRank (score, province, year = 2024, multi = false) {
      try {
        const url = `${baseURL()}/api/realdata/rank?score=${score}&province=${encodeURIComponent(province)}&year=${year}${multi ? '&multi=1' : ''}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!r.ok) return { error: 'HTTP ' + r.status };
        return await r.json();
      } catch (e) { return { error: e.message }; }
    }

    // 真实院校推荐（基于投档线，HuggingFace 数据集）
    // 返回 { real: {rush, stable, protect, total, source} | null, local }
    async function realRecommend (score, province, year = 2024, interests = []) {
      try {
        const url = `${baseURL()}/api/realdata/recommend?score=${score}&province=${encodeURIComponent(province)}&year=${year}&interests=${interests.join(',')}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) return { error: 'HTTP ' + r.status };
        return await r.json();
      } catch (e) { return { error: e.message }; }
    }

    return { ping, rank, analyze, analyzeStream, recommend, realRank, realRecommend, baseURL };
  })();

  return { respond, setPersona, getPersona, PERSONAS, AI_REAL };
})();
window.AGENT = AGENT;
