/**
 * ============================================================================
 *  Bridge: 把「HTML 版游戏逻辑」对接进 Monogatari 脚本引擎
 * ----------------------------------------------------------------------------
 *  - GK.*  : 一组纯函数 / 状态访问器，可被 Monogatari 脚本里的 Choice.Do
 *            函数、或 main.js 里的注册逻辑直接调用。
 *  - GK.run* : 驱动一次性的游戏事件（生成分数、召唤导师、生成志愿表），
 *            把结果写进 monogatari.storage，供对话模板 {{gk.xxx}} 取用。
 *
 *  Monogatari 的 storage 是「响应式」对象：this.storage({...}) 会浅合并，
 *  模板里用 {{gk.score}} 这类路径即可插值。
 * ============================================================================
 */
'use strict';
/* global monogatari, SCORE_CHECKER, RECOMMENDER, AGENT, GAME, SFX,
          PROVINCES, MBTI_TYPES, MBTI_QUESTIONS, MAJORS, UNIVERSITIES,
          CAREER_VISIONS, INTEREST_TAGS, MENTORS, RARITY_CONFIG,
          ACHIEVEMENTS, INTRO_LANDMARKS */

const GK = (() => {

  // —— 工具：在 monogatari.storage 里写一条 gk 子树 ——
  function set(partial) {
    const cur = monogatari.storage('gk') || {};
    monogatari.storage({ gk: Object.assign({}, cur, partial) });
    return monogatari.storage('gk');
  }
  function get() { return monogatari.storage('gk') || {}; }

  // —— 静音状态下安全播音 ——
  function sfx(name) { try { SFX.unlock(); SFX.play(name); } catch (e) { /* noop */ } }

  // —— 清除所有角色立绘（切场景前调用，防重叠）——
  // 用 DOM 直接隐藏角色 img（绕过引擎的 hide action，避免"未显示角色"报错）
  function clearCharacters () {
    try {
      document.querySelectorAll('img[data-character]').forEach(img => {
        img.style.display = 'none';
      });
    } catch (e) {}
  }

  // —— 角色语音播放（关键台词配音）——
  // path: 'senior/greet' → 播放 assets/voices/senior/greet.mp3
  // ★ 播放期间拦截 text-box 点击，防止语音被截断（撕裂感）
  let _voiceAudio = null;
  let _voicePlaying = false;  // livemotion 检查此标志，播放配音时跳过 blip
  let _voiceLockTimer = null;

  // 拦截器：在 capture 阶段阻止 text-box 的点击事件
  const _voiceClickBlocker = (e) => {
    const tb = e.target.closest && e.target.closest('text-box, [data-component="text-box"]');
    if (tb && _voicePlaying) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  function _lockTextBox () {
    document.addEventListener('click', _voiceClickBlocker, true);
    // 视觉提示：加一个"播放中"样式
    const tb = document.querySelector('text-box, [data-component="text-box"]');
    if (tb) tb.classList.add('gk-voice-playing');
  }
  function _unlockTextBox () {
    document.removeEventListener('click', _voiceClickBlocker, true);
    const tb = document.querySelector('text-box, [data-component="text-box"]');
    if (tb) tb.classList.remove('gk-voice-playing');
    _voicePlaying = false;
  }

  function voice(path) {
    try {
      // 先解锁上一次（如果有的话）
      _unlockTextBox();
      if (_voiceLockTimer) { clearTimeout(_voiceLockTimer); _voiceLockTimer = null; }
      if (_voiceAudio) { _voiceAudio.pause(); _voiceAudio = null; }

      _voiceAudio = new Audio('assets/voices/' + path + '.mp3');
      _voiceAudio.volume = 0.9;
      _voicePlaying = true;
      _lockTextBox();

      _voiceAudio.onended = () => { _unlockTextBox(); };
      _voiceAudio.onerror = () => { _unlockTextBox(); };
      _voiceAudio.play().catch(() => { _unlockTextBox(); });

      // 超时兜底：最长 15 秒后自动解锁（防止音频卡住永远锁住）
      _voiceLockTimer = setTimeout(() => { _unlockTextBox(); }, 15000);
    } catch (e) { _unlockTextBox(); }
  }

  // —— 取下拉选项（省份 / 选科组 / 兴趣 / 理想）——
  function provinceOptions() {
    return PROVINCES
      .filter(p => p.total && p.total > 0) // 仅展示有分数口径的省份
      .map(p => ({ value: p.code, label: `${p.name}（满分${p.total}）` }));
  }
  function groupOptions(provinceCode) {
    const p = PROVINCES.find(x => x.code === provinceCode);
    if (!p) return [];
    return (p.groups || ['综合']).map(g => ({ value: g, label: g }));
  }
  function visionOptions() {
    return CAREER_VISIONS.map(v => ({ value: v.id, label: `${v.emoji} ${v.name}` }));
  }
  function interestOptions() {
    return INTEREST_TAGS.map(i => ({ value: i.id, label: `${i.emoji} ${i.name}` }));
  }
  function mbtiInfo(type) {
    return MBTI_TYPES.find(m => m.type === type) || null;
  }

  // —— 入营：存档基础信息 ——
  function enroll({ name, province, group }) {
    set({ name: name || '同学', province, group, stage: 'enrolled' });
    sfx('select');
    return get();
  }

  // —— 查分 BOSS 战：生成演示分数 + 情绪反应 ——
  function rollScore(autoMode = false) {
    const { province, group } = get();
    const p = PROVINCES.find(x => x.code === province) || PROVINCES[0];
    const grp = group || (p.groups && p.groups[0]) || '综合';
    const sc = SCORE_CHECKER.generateFakeScore(p, grp);
    const react = SCORE_CHECKER.reactToScore(sc.tier);
    set({
      score: sc.score, total: sc.total, tier: sc.tier, rank: sc.rank,
      subjects: sc.subjects, group: sc.group,
      mood: react.mood, moodEmoji: react.emoji, moodColor: react.color,
      moodLine: react.line, autoMode: !!autoMode,
    });
    return get();
  }

  // —— MBTI：累计答题 ——
  function resetMbti() {
    set({ mbtiAnswers: {}, mbtiIdx: 0, mbtiType: '' });
  }
  function answerMbti(idx, letter) {
    const g = get();
    const ans = Object.assign({}, g.mbtiAnswers || {});
    ans[idx] = letter;
    set({ mbtiAnswers: ans, mbtiIdx: idx + 1 });
    return ans;
  }
  function computeMbti() {
    const g = get();
    const ans = g.mbtiAnswers || {};
    // 维度计数：E/I S/N T/F J/P（只按实际选择累加，不重复计数）
    const dim = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
    Object.values(ans).forEach(L => { if (dim.hasOwnProperty(L)) dim[L]++; });
    const type =
      (dim.E >= dim.I ? 'E' : 'I') +
      (dim.S >= dim.N ? 'S' : 'N') +
      (dim.T >= dim.F ? 'T' : 'F') +
      (dim.J >= dim.P ? 'J' : 'P');
    set({ mbtiType: type });
    return type;
  }

  // —— 兴趣 / 理想 ——
  function setVision(visionId) {
    const v = CAREER_VISIONS.find(x => x.id === visionId) || null;
    set({ visionId, vision: v ? `${v.emoji} ${v.name}` : '', visionDesc: v ? v.desc : '' });
    sfx('select');
    return get();
  }
  function toggleInterest(id) {
    const g = get();
    const arr = (g.interests || []).slice();
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    set({ interests: arr });
    sfx('click');
    return arr;
  }

  // —— 召唤导师（抽卡）——
  function pullMentor() {
    const got = GAME.pullMentor();
    const cfg = RARITY_CONFIG[got.rarity];
    set({
      mentor: got.id, mentorName: got.name, mentorTitle: got.title,
      mentorEmoji: got.emoji, mentorColor: got.color,
      mentorElement: got.element, mentorRarity: got.rarity,
      mentorRarityLabel: cfg.label, mentorTagline: got.tagline,
      mentorGreet: got.greet,
      mentorSkill: got.skill, mentorPassive: got.passive && got.passive.label,
      mentorObj: got,
    });
    sfx(got.rarity === 'SSR' ? 'ssr' : got.rarity === 'SR' ? 'reveal' : 'flip');
    return got;
  }
  function mentorObj() { return get().mentorObj || null; }

  // —— 生成志愿表（推荐引擎）——
  function buildWishlist() {
    const g = get();
    const recs = RECOMMENDER.recommend({
      province: PROVINCES.find(p => p.code === g.province) || PROVINCES[0],
      group: g.group,
      score: g.score, total: g.total,
      mbtiType: g.mbtiType,
      interests: g.interests || [],
      visionId: g.visionId,
      mentorObj: g.mentorObj,
    });
    set({ wishlist: recs });
    sfx('reveal');
    return recs;
  }

  // —— 渲染志愿表为可读 HTML（用于对话框/HTML 动作注入）——
  function wishlistHtml() {
    const g = get();
    const list = g.wishlist || [];
    if (!list.length) return '<p class="gk-empty">（志愿表为空，请先完成前置步骤）</p>';
    const rows = list.map((r, i) => {
      const rc = RARITY_CONFIG[r.rarity];
      const star = '★'.repeat(rc.stars);
      return `
        <div class="gk-card gk-r-${r.rarity.toLowerCase()}" style="--rc:${rc.color}">
          <div class="gk-card__rarity">${r.rarity} ${star}</div>
          <div class="gk-card__match">匹配度 ${r.matchScore}</div>
          <div class="gk-card__uni">${r.university.name}
            <span class="gk-card__tier">${r.university.tier}</span>
            <span class="gk-card__stab" style="color:${r.stability.color}">${r.stability.tag}</span>
          </div>
          <div class="gk-card__major">${r.major.name}</div>
          <div class="gk-card__reason">${r.reason}</div>
        </div>`;
    }).join('');
    return `<div class="gk-wishlist">${rows}</div>`;
  }

  // —— 分数面板 HTML ——
  function scorePanelHtml() {
    const g = get();
    const subs = (g.subjects || []).map(s =>
      `<span class="gk-subj">${s.name}<b>${s.score}</b></span>`).join('');
    return `
      <div class="gk-scorepanel" style="--mc:${g.moodColor}">
        <div class="gk-scorepanel__emoji">${g.moodEmoji}</div>
        <div class="gk-scorepanel__num">${g.score}<small>/${g.total}</small></div>
        <div class="gk-scorepanel__meta">全省位次约 <b>#${(g.rank||0).toLocaleString()}</b> · ${g.tier} 档</div>
        <div class="gk-scorepanel__subs">${subs}</div>
      </div>`;
  }

  // —— 导师召唤卡 HTML（含真实立绘 PNG）——
  function mentorCardHtml() {
    const g = get();
    const cfg = RARITY_CONFIG[g.mentorRarity];
    const mentorId = g.mentor || 'yuan';
    // 立绘路径：assets/characters/mentor_<id>/mentor_<id>_normal.png
    const portrait = `assets/characters/mentor_${mentorId}/mentor_${mentorId}_normal.png`;
    return `
      <div class="gk-gacha gk-gacha--${g.mentorRarity.toLowerCase()}" style="--mc:${g.mentorColor};--rc:${cfg.color}">
        <div class="gk-gacha__rarity">${g.mentorRarityLabel} ${'★'.repeat(cfg.stars)}</div>
        <div class="gk-gacha__portrait"><img src="${portrait}" alt="${g.mentorName}"></div>
        <div class="gk-gacha__emoji">${g.mentorEmoji}</div>
        <div class="gk-gacha__name">${g.mentorName}</div>
        <div class="gk-gacha__title">${g.mentorTitle}</div>
        <div class="gk-gacha__elem">${g.mentorElement}属性 · ${g.mentorPassive||''}</div>
        <div class="gk-gacha__tag">${g.mentorTagline}</div>
      </div>`;
  }

  // —— 名校剪影片头 HTML ——
  function landmarkFlashHtml() {
    const cards = INTRO_LANDMARKS.map((l, i) => `
      <div class="gk-landmark" style="--c1:${l.c1};--c2:${l.c2};animation-delay:${i * 0.18}s">
        <div class="gk-landmark__svg"><svg viewBox="0 0 100 100" style="color:${l.c2}">${l.svg}</svg></div>
        <div class="gk-landmark__name">${l.name}</div>
        <div class="gk-landmark__lm">${l.landmark}</div>
        <div class="gk-landmark__tier">${l.tier} · est.${l.est}</div>
      </div>`).join('');
    return `<div class="gk-intro">${cards}</div>`;
  }

  // —— AI Agent 对话（用于自由聊天的回退/兜底文案）——
  function agentRespond(text) {
    const r = AGENT.respond(text, get());
    return r;
  }

  // —— 成就 ——
  function checkAchievements() {
    return GAME.checkAchievements(get());
  }

  // ==========================================================================
  //  动态 Choice 工厂（关键！）
  //  Monogatari v2 实测约束：
  //    A. Choice 必须是【字面对象语句】——「函数 return {Choice}」不会渲染。
  //    B. Do 只接受「字符串」(被 run() 解析)；Do:function 不渲染。
  //  因此动态多选项的正确做法：
  //    1. 在模块加载时（页面上下文，闭包有效）预先构建【字面 Choice 对象】；
  //    2. 每个选项 Do: 'jump <handlerLabel>'；
  //    3. 为每个选项注册 handler 标签（函数语句执行 JS 后 return 'jump next'）。
  //  picker() 返回 { statement: <字面Choice对象>, handlers: {...} }。
  //  调用方需把 statement 放进标签数组，并把 handlers 经 monogatari.script() 注册。
  // ==========================================================================
  let _pickerSeq = 0;
  function picker(opts) {
    const { dialog, items, onPick, nextLabel, prefix, extra } = opts;
    const pre = prefix || ('_pk' + (++_pickerSeq));
    const handlers = {};
    const Choice = { Dialog: dialog };
    items.forEach((it, i) => {
      const hLabel = `${pre}_h${i}`;
      // 闭包捕获 it.value / onPick / nextLabel（页面上下文内闭包有效）
      const val = it.value;
      const cb = onPick;
      const next = nextLabel;
      // 关键：必须是【两条语句】—— 函数写状态，字符串 jump 跳转。
      // （函数 return 'jump X' 不会被引擎当作跳转执行）
      handlers[hLabel] = [ function () { try { cb(val); } catch (e) {} }, 'jump ' + next ];
      Choice['O' + i] = { Text: it.label, Do: 'jump ' + hLabel };
    });
    if (extra && extra.length) {
      extra.forEach((e, i) => { Choice['X' + i] = e; });
    }
    return { statement: { Choice }, handlers };
  }

  // ==========================================================================
  //  地图与任务系统（失忆穿越主线）
  //  - cleared: 记录每个任务节点完成状态
  //  - shards:  记忆碎片数组，每个任务完成得一块
  //  - showCampusMap(): 全屏校园地图 overlay（节点点击→跳转）
  // ==========================================================================

  // 5 个任务节点定义（key 与 cleared 字段对应；dest = 进入该任务的入口 label）
  // requires: 前置任务 key 数组（必须全部完成才能解锁）
  // lockReason: 未满足前置时显示的锁定原因
  // 依赖链逻辑：高考志愿填报的客观顺序
  //   查分(起点) → MBTI(需分数) → 理想+兴趣(需MBTI) → 导师(需查分+MBTI) → 志愿提交(全完成)
  const MAP_NODES = [
    { key: 'score',    label: '教室 · 查分 BOSS',     icon: '🏫', dest: 'PuzzleScore',   bg: 'scene-score',  bgm: 'bgm-score',  npc: '学霸·凛',    shard: '闪回：那次逃避的查分',
      requires: [], lockReason: '' },
    { key: 'mbti',     label: '图书室 · MBTI 人格',   icon: '📚', dest: 'PuzzleMbti',   bg: 'scene-mbti',   bgm: 'bgm-mbti',   npc: '导师·沈',    shard: '闪回：不懂自己的代价',
      requires: ['score'], lockReason: '🔒 先去教室查分——没有客观分数，谈什么认识自己？' },
    { key: 'vision',   label: '屋上 · 人生理想',      icon: '🌌', dest: 'PuzzleVision', bg: 'scene-vision', bgm: 'bgm-vision', npc: '学姐·温',    shard: '闪回：放弃梦想的夜晚',
      requires: ['mbti'], lockReason: '🔒 先完成 MBTI 人格测试——不了解自己，怎么知道想成为谁？' },
    { key: 'interest', label: '食堂 · 兴趣与闲聊',    icon: '🍜', dest: 'PuzzleInterest', bg: 'scene-chat', bgm: 'bgm-chat',   npc: '死党·阿星',  shard: '闪回：随波逐流的四年',
      requires: ['mbti'], lockReason: '🔒 先完成 MBTI 人格测试——性格清楚了，兴趣才好对应专业。' },
    { key: 'mentor',   label: '召唤台 · 召唤导师',    icon: '⚔️', dest: 'PuzzleMentor', bg: 'scene-summon', bgm: 'bgm-summon', npc: '系统',       shard: '闪回：无人指引的迷茫',
      requires: ['score','mbti'], lockReason: '🔒 导师需要你的分数和人格数据才能给出准确指引，先完成查分和 MBTI。' },
    // 走廊（NPC 同学互动，支线，需查分后解锁；optional 不计入主线 allCleared）
    { key: 'corridor', label: '走廊 · 同学们', icon: '🚶', dest: 'NpcCorridorEnter', bg: 'scene-corridor', bgm: 'bgm-chat', npc: '林/小雨/大志', shard: '', optional: true,
      requires: ['score'], lockReason: '🔒 先去教室查分——有了分数，才能和同学们对比处境。' },
    // 放松场景（日常支线，节奏调节 + 关系培养；optional，无需前置）
    { key: 'relax_gym',   label: '体育馆 · 打篮球', icon: '🏀', dest: 'RelaxGym', bg: 'scene-gym', bgm: 'bgm-chat', npc: '阿星', shard: '', optional: true, requires: [], lockReason: '' },
    { key: 'relax_star',  label: '屋上 · 看星空',   icon: '🌌', dest: 'RelaxStargaze', bg: 'scene-stargaze', bgm: 'bgm-vision', npc: '学姐·温', shard: '', optional: true, requires: [], lockReason: '' },
    { key: 'relax_river', label: '河川敷 · 散步',   icon: '🌊', dest: 'RelaxRiver', bg: 'scene-river', bgm: 'bgm-chat', npc: '死党·阿星', shard: '', optional: true, requires: [], lockReason: '' },
  ];

  // 标记任务完成 + 给一块碎片
  function markCleared (taskKey) {
    const g = get();
    const cleared = Object.assign({}, g.cleared || {});
    cleared[taskKey] = true;
    const shards = (g.shards || []).slice();
    if (!shards.includes(taskKey)) shards.push(taskKey);
    set({ cleared, shards });
    sfx('reveal');
    return shards.length;
  }
  function isCleared (taskKey) { const g = get(); return !!(g.cleared && g.cleared[taskKey]); }
  function shardCount () { return (get().shards || []).length; }
  function allCleared () { return MAP_NODES.filter(n => !n.optional).every(n => isCleared(n.key)); }
  // 检查节点是否已解锁（前置任务全部完成）
  function isUnlocked (taskKey) {
    const node = MAP_NODES.find(n => n.key === taskKey);
    if (!node || !node.requires || !node.requires.length) return true; // 无前置 = 始终解锁
    return node.requires.every(req => isCleared(req));
  }
  function lockReasonOf (taskKey) {
    const node = MAP_NODES.find(n => n.key === taskKey);
    return node ? node.lockReason : '';
  }

  // ==========================================================================
  //  角色关系值 & 玩家属性 & 解谜 & 存档提醒
  //  - relations: {senior,rival,buddy,guide} 0-100，初始 50
  //  - attrs: {patience,insight,courage,diligence} 0-100
  //  - 正反馈（认真/深思）+关系；负反馈（毛躁/敷衍）-关系，引导玩家深入思考
  // ==========================================================================
  const RELATION_KEYS = ['senior', 'rival', 'buddy', 'guide', 'classmate_lin', 'classmate_xyu', 'classmate_dazhi'];
  const ATTR_KEYS = ['patience', 'insight', 'courage', 'diligence'];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function addRelation (charKey, delta) {
    const g = get();
    const rel = Object.assign({}, g.relations || {});
    rel[charKey] = clamp((rel[charKey] == null ? 50 : rel[charKey]) + delta, 0, 100);
    set({ relations: rel });
    return rel[charKey];
  }
  function relation (charKey) { const g = get(); return (g.relations && g.relations[charKey]) || 0; }
  function relationTier (charKey) {
    const v = relation(charKey);
    if (v >= 90) return { tier: '挚友', color: '#FFD700' };
    if (v >= 70) return { tier: '信任', color: '#2cb67d' };
    if (v >= 50) return { tier: '友好', color: '#7f5af0' };
    if (v >= 30) return { tier: '普通', color: '#9ab' };
    return { tier: '冷淡', color: '#e53170' };
  }
  function addAttr (attrKey, delta) {
    const g = get();
    const attrs = Object.assign({}, g.attrs || {});
    attrs[attrKey] = clamp((attrs[attrKey] == null ? 10 : attrs[attrKey]) + delta, 0, 100);
    set({ attrs });
    return attrs[attrKey];
  }
  function attr (attrKey) { const g = get(); return (g.attrs && g.attrs[attrKey]) || 0; }
  // 综合反馈：一个选择同时影响关系+属性。effect: { rel:{senior:+5}, attrs:{patience:+3} }
  function feedback (effect) {
    const out = { rel: {}, attrs: {} };
    if (effect.rel) Object.entries(effect.rel).forEach(([k, v]) => { out.rel[k] = addRelation(k, v); });
    if (effect.attrs) Object.entries(effect.attrs).forEach(([k, v]) => { out.attrs[k] = addAttr(k, v); });
    return out;
  }
  function meetsAttr (req) { return Object.entries(req).every(([k, v]) => attr(k) >= v); }
  function meetsRelation (req) { return Object.entries(req).every(([k, v]) => relation(k) >= v); }

  function solvePuzzle (puzzleKey) {
    const g = get();
    const puzzles = Object.assign({}, g.puzzles || {});
    puzzles[puzzleKey] = true;
    set({ puzzles });
    addAttr('insight', 5);
    sfx('achievement');
  }
  function isSolved (puzzleKey) { const g = get(); return !!(g.puzzles && g.puzzles[puzzleKey]); }

  // 存档提醒：关键节点首次提醒（避免错过分支无法回退）。返回 true=应弹窗
  function saveWarn (gateKey) {
    const g = get();
    if (g.saveWarned && g.saveWarned[gateKey]) return false;
    const sw = Object.assign({}, g.saveWarned || {});
    sw[gateKey] = true;
    set({ saveWarned: sw });
    return true;
  }

  // 存档提醒弹窗（横幅，自动消失）
  function showSaveWarn (msg) {
    const old = document.querySelector('.gk-savewarn');
    if (old) old.remove();
    const banner = document.createElement('div');
    banner.className = 'gk-savewarn';
    banner.innerHTML = `<span class="gk-savewarn__text">⚠️ ${msg || '即将进入关键节点，建议先存档（菜单→存档），否则可能错过某些分支。'}</span><button class="gk-savewarn__btn">知道了</button>`;
    document.body.appendChild(banner);
    const dismiss = () => banner.remove();
    banner.querySelector('.gk-savewarn__btn').addEventListener('click', dismiss);
    setTimeout(dismiss, 8000);
  }

  // 记忆碎片闪回 overlay（任务完成后弹出，揭示一段未来困境）
  function showShardFlash (taskKey) {
    const node = MAP_NODES.find(n => n.key === taskKey);
    if (!node) return;
    const old = document.querySelector('.gk-shard');
    if (old) old.remove();
    const flashes = {
      score: { icon: '🎯', title: '记忆碎片 · 查分之夜', text: '…我记得那个雨夜，分数出来时我关掉了手机，骗自己没看见。后来五年，我一直在为那次逃避买单——选了一个我根本不了解的专业，浑浑噩噩地毕业。' },
      mbti:  { icon: '🪞', title: '记忆碎片 · 不懂自己', text: '…我从不肯花时间想清楚自己是谁。别人说哪个火就报哪个，结果进了才发现自己根本坐不住实验室。那四年像一场漫长的错位。' },
      vision:{ icon: '🌌', title: '记忆碎片 · 放弃的星空', text: '…我有过一个梦想，在某个屋上的夜晚。但我对自己说"不现实"，把它埋了。现在我才明白，所谓现实，不过是我不敢的借口。' },
      interest:{ icon: '🍜', title: '记忆碎片 · 随波逐流', text: '…我从来没有真正喜欢过什么，或者说，我没有给自己机会去喜欢。四年大学，别人热爱的我都不懂，只能在食堂的喧闹里假装合群。' },
      mentor:{ icon: '⚔️', title: '记忆碎片 · 无人指引', text: '…当年填志愿，我没有问过任何懂行的人。父亲只说"你自己定"，于是我乱填了一通。如果有一个人那时候拉我一把，也许……' },
    };
    const f = flashes[taskKey] || { icon: '✨', title: '记忆碎片', text: '…又一块记忆回来了。' };
    const overlay = document.createElement('div');
    overlay.className = 'gk-shard';
    overlay.innerHTML = `
      <div class="gk-shard__inner">
        <div class="gk-shard__icon">${f.icon}</div>
        <div class="gk-shard__title">${f.title}</div>
        <div class="gk-shard__text">「${f.text}」</div>
        <div class="gk-shard__hint">这块碎片属于过去的你。集齐全部，才能看清整个真相。</div>
        <button class="gk-shard__close">收下碎片 ▶</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.gk-shard__close').addEventListener('click', () => {
      overlay.remove();
      try { monogatari.run('jump CampusMap'); } catch (e) {}
    });
  }

  // 关系/属性面板 HTML
  function statusPanelHtml () {
    const relNames = { senior: '学姐·温', rival: '学霸·凛', buddy: '死党·阿星', guide: '导师·沈', classmate_lin: '同学·林', classmate_xyu: '同学·小雨', classmate_dazhi: '同学·大志' };
    const attrNames = { patience: '耐心', insight: '洞察', courage: '勇气', diligence: '务实' };
    const attrIcons = { patience: '🧘', insight: '💡', courage: '⚔️', diligence: '📋' };
    const relRows = RELATION_KEYS.map(k => {
      const t = relationTier(k); const v = relation(k);
      return `<div class="gk-status__row"><span class="gk-status__name">${relNames[k]}</span>
        <div class="gk-status__bar"><div class="gk-status__fill" style="width:${v}%;background:${t.color}"></div></div>
        <span class="gk-status__val" style="color:${t.color}">${v} ${t.tier}</span></div>`;
    }).join('');
    const attrRows = ATTR_KEYS.map(k => {
      const v = attr(k);
      const color = v >= 30 ? '#2cb67d' : v >= 15 ? '#f9c74f' : '#e53170';
      return `<div class="gk-status__row"><span class="gk-status__name">${attrIcons[k]} ${attrNames[k]}</span>
        <div class="gk-status__bar"><div class="gk-status__fill" style="width:${v}%;background:${color}"></div></div>
        <span class="gk-status__val">${v}</span></div>`;
    }).join('');
    return `<div class="gk-status"><div class="gk-status__group"><h3>关系</h3>${relRows}</div>
      <div class="gk-status__group"><h3>属性</h3>${attrRows}</div></div>`;
  }

  // NPC 同学分数生成（玩家查分后调用，相对偏移）
  function rollNpcScores () {
    const g = get();
    const playerScore = g.score || 500;
    const total = g.total || 750;
    const npcScores = {};
    (window.CLASSMATES || []).forEach(c => {
      const [lo, hi] = c.scoreOffset;
      const offset = lo + Math.floor(Math.random() * (hi - lo + 1));
      const score = Math.max(0, Math.min(total, playerScore + offset));
      npcScores[c.id] = { score, total, offset };
    });
    set({ npcScores });
    return npcScores;
  }

  // NPC 互动 overlay（仿 showShardFlash，支持多按钮 + 关系反馈）
  function showNpcInteract (classmateId, optionKey) {
    const c = (window.CLASSMATES || []).find(x => x.id === classmateId);
    if (!c) return;
    const opt = c.options[optionKey];
    if (!opt) return;
    // 应用反馈
    if (opt.rel) addRelation(classmateId, opt.rel);
    if (opt.attrs) Object.entries(opt.attrs).forEach(([k, v]) => addAttr(k, v));
    // 弹窗显示互动结果 + 镜照
    const isGood = opt.rel > 0;
    const old = document.querySelector('.gk-shard');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.className = 'gk-shard';
    overlay.innerHTML = `
      <div class="gk-shard__inner">
        <div class="gk-shard__icon">${c.emoji}</div>
        <div class="gk-shard__title">${c.name}${isGood ? ' · 互动' : ' · 错失'}</div>
        <div class="gk-shard__text">「${opt.reply}」</div>
        ${isGood ? `<div class="gk-shard__hint" style="color:#7f5af0;font-style:italic">镜照：${c.mirror}</div>` : `<div class="gk-shard__hint" style="color:#e53170">关系 ${opt.rel} · 这次互动没有产生好的结果。</div>`}
        <button class="gk-shard__close">继续 ▶</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.gk-shard__close').addEventListener('click', () => {
      overlay.remove();
      try { monogatari.run('jump NpcCorridorAfter'); } catch (e) {}
    });
  }

  // 全屏校园地图（复用画廊 overlay 模式）
  function showCampusMap () {
    const old = document.querySelector('.gk-map');
    if (old) old.remove();
    const g = get();
    const cleared = g.cleared || {};
    const done = shardCount();
    const total = MAP_NODES.filter(n => !n.optional).length;
    const allDone = done >= total;
    // SLG 风格地图：每个节点是一张真实场景缩略图卡片（教室/图书室/屋上/食堂/召唤台）
    const nodes = MAP_NODES.map((n) => {
      const isDone = !!cleared[n.key];
      const unlocked = isUnlocked(n.key);
      const cls = isDone ? 'gk-map__node--done' : (unlocked ? '' : 'gk-map__node--locked');
      const badge = isDone ? '<div class="gk-map__node-check">✓ 已完成</div>'
        : (unlocked ? '<div class="gk-map__node-go">▶ 前往</div>'
           : `<div class="gk-map__node-locked">${n.lockReason || '🔒 未解锁'}</div>`);
      const clickable = unlocked && !isDone ? `data-dest="${n.dest}" data-task="${n.key}"` : '';
      return `<div class="gk-map__node ${cls}" ${clickable}>
        <div class="gk-map__node-thumb"><img src="assets/scenes/${n.bg}.webp" alt="${n.label}" loading="lazy"></div>
        <div class="gk-map__node-body">
          <div class="gk-map__node-icon">${n.icon}</div>
          <div class="gk-map__node-label">${n.label}</div>
          <div class="gk-map__node-npc">引导：${n.npc}</div>
        </div>
        ${badge}
      </div>`;
    }).join('');
    const overlay = document.createElement('div');
    overlay.className = 'gk-map';
    overlay.innerHTML = `
      <div class="gk-map__bg"></div>
      <div class="gk-map__header">
        <h2 class="gk-map__title">🗺 校园探索</h2>
        <div class="gk-map__subtitle">记忆碎片 ${done}/${total} · 点击场景前往，完成全部任务揭开真相</div>
      </div>
      <button class="gk-map__close">✕ 关闭</button>
      <button class="gk-map__status">📊 我的状态</button>
      <div class="gk-map__grid">${nodes}</div>
      ${allDone
        ? '<div class="gk-map__submit" data-dest="WishRevealPre"><div class="gk-map__submit-icon">📜</div><div>提交志愿表 · 真相揭晓</div></div>'
        : '<div class="gk-map__locked">🔒 集齐 '+total+' 块碎片后解锁志愿提交（已完成 '+done+'/'+total+'）</div>'}
    `;
    document.body.appendChild(overlay);
    // 节点点击 → 跳转（已完成的任务节点：提示已完成，不重复进入）
    overlay.querySelectorAll('.gk-map__node[data-dest], .gk-map__submit[data-dest]').forEach(node => {
      node.addEventListener('click', () => {
        const dest = node.getAttribute('data-dest');
        const taskKey = node.getAttribute('data-task');
        // 已完成的任务节点：不重复进入（避免重复解谜/抽卡状态错乱）
        if (taskKey && isCleared(taskKey)) {
          showSaveWarn('这个场景已经探索过了，记忆碎片已收集。');
          return;
        }
        overlay.remove();
        try { monogatari.run('jump ' + dest); } catch (e) {}
      });
    });
    // 关闭 → 回到安全处（地图本身从 CampusMap 打开，关闭即停留）
    overlay.querySelector('.gk-map__close').addEventListener('click', () => { overlay.remove(); });
    // 查看状态（关系/属性）
    const statusBtn = overlay.querySelector('.gk-map__status');
    if (statusBtn) statusBtn.addEventListener('click', () => { showStatus(); });
  }

  // 全局重置（结局后重玩用）：清空 gk 全部状态 + 回 Start
  function fullReset () {
    try {
      const fresh = {
        name: get().name, // 保留名字
        province:'', group:'', stage:'',
        score:0, total:0, tier:'', rank:0, subjects:[], mood:'', moodEmoji:'', moodColor:'', moodLine:'', autoMode:false,
        mbtiAnswers:{}, mbtiIdx:0, mbtiType:'', mbtiSkipped:false,
        interests:[], visionId:'', vision:'', visionDesc:'',
        mentor:'', mentorName:'', mentorRarity:'', wishlist:[],
        cleared:{}, shards:[],
        relations:{ senior:50, rival:50, buddy:50, guide:50, classmate_lin:30, classmate_xyu:30, classmate_dazhi:30 },
        attrs:{ patience:10, insight:10, courage:10, diligence:10 },
        puzzles:{}, saveWarned:{},
        npcScores:{},
      };
      set(fresh);
    } catch (e) {}
    try { monogatari.run('jump Start'); } catch (e) {}
  }

  // 状态面板（关系值 + 属性）弹窗
  function showStatus () {
    const old = document.querySelector('.gk-status-overlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.className = 'gk-status-overlay';
    overlay.innerHTML = `
      <div class="gk-status-box">
        <div class="gk-status-box__head">
          <h2>📊 我的状态</h2>
          <button class="gk-status-box__close">✕</button>
        </div>
        ${statusPanelHtml()}
        <p class="gk-status-box__tip">💡 认真完成谜题、深入思考可提升关系与属性；毛躁敷衍会降低。部分结局需要高关系值。</p>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.gk-status-box__close').addEventListener('click', () => { overlay.remove(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  return {
    set, get, sfx, voice, clearCharacters,
    get _voicePlaying () { return _voicePlaying; },
    provinceOptions, groupOptions, visionOptions, interestOptions, mbtiInfo,
    enroll, rollScore,
    resetMbti, answerMbti, computeMbti,
    setVision, toggleInterest,
    pullMentor, mentorObj,
    buildWishlist, wishlistHtml, scorePanelHtml, mentorCardHtml, landmarkFlashHtml,
    agentRespond, checkAchievements,
    picker,
    // 地图与任务系统
    mapNodes: MAP_NODES, markCleared, isCleared, shardCount, allCleared, showCampusMap, showStatus, fullReset,
    rollNpcScores, showNpcInteract,
    // 关系/属性/解谜/存档提醒
    addRelation, relation, relationTier, addAttr, attr, feedback, meetsAttr, meetsRelation,
    solvePuzzle, isSolved, saveWarn, showSaveWarn, showShardFlash, statusPanelHtml,
  };
})();
window.GK = GK;
