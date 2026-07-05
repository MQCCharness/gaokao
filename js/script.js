/* global monogatari, GK, MENTORS, PROVINCES, CAREER_VISIONS,
          INTEREST_TAGS, MBTI_QUESTIONS, MBTI_TYPES, RARITY_CONFIG,
          INTRO_LANDMARKS */

'use strict';

// ============================================================================
//  高考志愿 · 命运执笔人  —— Monogatari 主脚本
//
//  ⚠ Monogatari v2 实测可用模式（决定本文件全部结构）：
//    A. Choice 必须是【字面对象语句】：{ Choice: { Dialog, Key:{Text,Do:'jump X'} } }
//       —— 「函数 return {Choice}」不渲染；Do 不能是 function。
//    B. 动态选项 = 模块加载时用 GK.picker() 预生成【字面 Choice + 每项 handler 标签】。
//    C. handler 标签：[ function(){ 写状态; }, 'jump NextLabel' ] —— 函数语句写状态，
//       下一句用字面 'jump' 字符串跳转。此模式已实测通过。
//    D. 卡面（分数/导师/MBTI/志愿表）用对话框内联 HTML（引擎文本框原生支持 HTML）。
// ============================================================================

monogatari.characters ({
	'system': {
		Name: '志愿命运系统', Color: '#FFD700', Directory: 'system',
		Images: { 'normal': 'system_normal.png' },
	},
	// 主角内心独白（序章/回忆用，不显示立绘，柔和米白色）
	'me': {
		Name: '', Color: '#E8E0D0',
	},
	// 立绘来源：CC0 / Public Domain（OpenGameArt 二次元 VN 全身立绘）
	// 主角团：「Visual Novel Character Sprite」 https://opengameart.org/content/visual-novel-character-sprite
	// 导师团：「VN Characters (by cabbit KusSv)」 https://opengameart.org/content/vn-characters
	// 表情键→源文件映射见 lib/install-sprites.mjs，重跑即可刷新。
	// 立绘来源：houkago_stella (MIT, github.com/usakan2077/houkago_stella)
	// 3 个真正不同的人（kotoha紫发/mahiru棕发/sakura黑发）+ 换装变体
	// Images 键必须与实际 PNG 一致；表情映射见 lib/map-stella.mjs
	'senior': {   // kotoha 制服
		Name: '学姐·温', Color: '#B07AAC', Directory: 'senior',
		Images: { 'normal': 'senior_normal.png', 'happy': 'senior_happy.png', 'sad': 'senior_sad.png' },
	},
	'rival': {    // sakura 制服
		Name: '学霸·凛', Color: '#5B7FB8', Directory: 'rival',
		Images: { 'normal': 'rival_normal.png', 'happy': 'rival_happy.png', 'angry': 'rival_angry.png' },
	},
	'buddy': {    // mahiru 制服
		Name: '死党·阿星', Color: '#C09A6F', Directory: 'buddy',
		Images: { 'normal': 'buddy_normal.png', 'happy': 'buddy_happy.png', 'surprised': 'buddy_surprised.png' },
	},
	'guide': {    // kotoha 泳装（与学姐造型区分）
		Name: '导师·沈', Color: '#3D8A9E', Directory: 'guide',
		Images: { 'normal': 'guide_normal.png', 'happy': 'guide_happy.png', 'sad': 'guide_sad.png' },
	},
	// 3 位 NPC 同学（走廊互动，stella 换装）
	'classmate_lin':   { Name: '同学·林',   Color: '#4A90D9', Directory: 'classmate_lin',   Images: { 'normal': 'classmate_lin_normal.png' } },
	'classmate_xyu':   { Name: '同学·小雨', Color: '#7EC8E3', Directory: 'classmate_xyu',   Images: { 'normal': 'classmate_xyu_normal.png' } },
	'classmate_dazhi': { Name: '同学·大志', Color: '#E8923C', Directory: 'classmate_dazhi', Images: { 'normal': 'classmate_dazhi_normal.png', 'angry': 'classmate_dazhi_angry.png', 'smirk': 'classmate_dazhi_smirk.png' } },
	'buddy_sports':   { Name: '阿星(运动装)', Color: '#C09A6F', Directory: 'buddy_sports', Images: { 'normal': 'buddy_sports_normal.png', 'happy': 'buddy_sports_happy.png' } },
	// 家人 NPC
	'fam_mom':  { Name: '妈妈',   Color: '#E891A8', Directory: 'fam_mom',  Images: { 'normal': 'fam_mom_normal.png' } },
	'fam_dad':  { Name: '爸爸',   Color: '#5B8AB8', Directory: 'fam_dad',  Images: { 'normal': 'fam_dad_normal.png', 'angry': 'fam_dad_angry.png', 'smirk': 'fam_dad_smirk.png', 'straight': 'fam_dad_straight.png' } },
	'fam_aunt': { Name: '小姨',   Color: '#C4A0D9', Directory: 'fam_aunt', Images: { 'normal': 'fam_aunt_normal.png' } },
	// 老师 NPC
	'tch_lee':  { Name: '李老师', Color: '#5B8A5B', Directory: 'tch_lee',  Images: { 'normal': 'tch_lee_normal.png', 'happy': 'tch_lee_happy.png', 'sad': 'tch_lee_sad.png', 'angry': 'tch_lee_angry.png', 'talk': 'tch_lee_talk.png' } },
	'tch_wang': { Name: '王主任', Color: '#B8860B', Directory: 'tch_wang', Images: { 'normal': 'tch_wang_normal.png', 'angry': 'tch_wang_angry.png', 'smirk': 'tch_wang_smirk.png', 'straight': 'tch_wang_straight.png' } },
	// —— 8 位导师（独立角色定义，对话时可 show character mentor_xxx 显示各自立绘）——
	// Color 取自 mentors.js 各导师的 color 字段
	'mentor_yuan':     { Name: '导师·渊',     Color: '#4A6FA5', Directory: 'mentor_yuan',     Images: { 'normal': 'mentor_yuan_normal.png' } },
	'mentor_can':      { Name: '导师·灿哥',   Color: '#E8702A', Directory: 'mentor_can',      Images: { 'normal': 'mentor_can_normal.png', 'happy': 'mentor_can_happy.png', 'angry': 'mentor_can_angry.png', 'surprised': 'mentor_can_surprised.png' } },
	'mentor_wan':      { Name: '导师·婉',     Color: '#B07AAC', Directory: 'mentor_wan',      Images: { 'normal': 'mentor_wan_normal.png' } },
	'mentor_chi':      { Name: '导师·炽',     Color: '#5B8A8A', Directory: 'mentor_chi',      Images: { 'normal': 'mentor_chi_normal.png', 'happy': 'mentor_chi_happy.png', 'angry': 'mentor_chi_angry.png', 'sad': 'mentor_chi_sad.png', 'surprised': 'mentor_chi_surprised.png' } },
	'mentor_ning':     { Name: '导师·宁老师', Color: '#9C6FB0', Directory: 'mentor_ning',     Images: { 'normal': 'mentor_ning_normal.png' } },
	'mentor_lao':      { Name: '导师·老朽',   Color: '#C09A6F', Directory: 'mentor_lao',      Images: { 'normal': 'mentor_lao_normal.png', 'happy': 'mentor_lao_happy.png', 'clueless': 'mentor_lao_clueless.png', 'poker': 'mentor_lao_poker.png' } },
	'mentor_lingfeng': { Name: '导师·凛',     Color: '#5B7FB8', Directory: 'mentor_lingfeng', Images: { 'normal': 'mentor_lingfeng_normal.png', 'happy': 'mentor_lingfeng_happy.png', 'thinking': 'mentor_lingfeng_thinking.png' } },
	'mentor_zhaoyang': { Name: '导师·朝阳',   Color: '#E8923C', Directory: 'mentor_zhaoyang', Images: { 'normal': 'mentor_zhaoyang_normal.png', 'happy': 'mentor_zhaoyang_happy.png', 'excited': 'mentor_zhaoyang_excited.png' } },
});

monogatari.action ('notification').notifications ({
	'EnrollOk':   { title: '系统',   body: '入营登记完成。命运的齿轮，开始转动。' },
	'ScoreReady': { title: '查分',   body: '分数已解密，请面对你的战果。' },
	'MentorGet':  { title: '召唤',   body: '一位导师响应了你的呼唤。' },
	'MbtiDone':   { title: '人格',   body: '天赋地图已点亮。' },
	'WishDone':   { title: '志愿表', body: '你的命运志愿表已生成。' },
});
monogatari.action ('message').messages ({
	'Help': { title:'操作说明', subtitle:'高考志愿 · 命运执笔人',
		body:`<p>🎮 <b>空格 / 点击对话框</b>：推进对话</p>
<p>💾 <b>存档/读档</b>：右上角菜单</p>
<p>🖼️ <b>CG 回廊</b>：主菜单查看卡面</p>
<p>↩️ <b>回滚</b>：左箭头回到上一句</p>` }
});
monogatari.configuration ('credits', { en:`
<p><b>高考志愿 · 命运执笔人</b></p>
<p>基于 Monogatari Visual Novel Engine v2.8.0 (MIT)</p>
<p>角色立绘：houkago_stella (MIT) · github.com/usakan2077/houkago_stella</p>
<p>所有名校剪影为原创 SVG 矢量演绎 · 角色姓名为原创虚构</p>
<p>本作品仅作教育与演示用途</p>` });

// 场景背景（二次元 galgame 风格，houkago_stella MIT，与角色立绘画风统一）
monogatari.assets ('scenes', {
	'scene-start':  'scene-start.webp',   // 学校外观·夜（开场）
	'scene-enroll': 'scene-enroll.webp',  // 校门·春樱（入营）
	'scene-summon': 'scene-summon.webp',  // 屋上·青空（召唤导师）
	'scene-score':  'scene-score.webp',   // 教室·夜暗（查分 BOSS）
	'scene-mbti':   'scene-mbti.webp',    // 图书室（MBTI）
	'scene-vision': 'scene-vision.webp',  // 屋上·星空（人生理想）
	'scene-wish':   'scene-wish.webp',    // 房间·夜（志愿深空）
	'scene-chat':   'scene-chat.webp',    // 食堂（聊天）
	'scene-end':    'scene-end.webp',     // 屋上·朝日（结局）
	'scene-corridor': 'scene-corridor.webp', // 走廊（NPC 同学互动）
	'scene-gym':      'scene-gym.webp',       // 体育馆（打篮球放松）
	'scene-stargaze': 'scene-stargaze.webp',  // 屋上星空（看星星放松）
	'scene-river':    'scene-river.webp',     // 河川敷（散步放松）
	'scene-home':     'scene-home.webp',      // 家（家人互动）
	'scene-office':   'scene-office.webp',    // 楼梯/办公室（老师互动）
	// 序章 5 幕场景（v2 由 mimo-v2.5 生成）
	'scene-rain-office': 'scene-rain-office.webp',  // 幕1 雨夜办公室
	'scene-subway':      'scene-subway.webp',       // 幕2 末班地铁
	'scene-rent-room':   'scene-rent-room.webp',    // 幕3 8平米合租房
	'scene-lightning':   'scene-lightning.webp',    // 幕4 闪电穿越（抽象）
	'scene-bedroom':     'scene-bedroom.webp',      // 幕5 高中卧室
});

// 背景音乐（houkago_stella MIT，每关一首贴合氛围的 BGM）
monogatari.assets ('music', {
	'bgm-start':  'scene-start.mp3',
	'bgm-enroll': 'scene-enroll.mp3',
	'bgm-summon': 'scene-summon.mp3',
	'bgm-score':  'scene-score.mp3',
	'bgm-mbti':   'scene-mbti.mp3',
	'bgm-vision': 'scene-vision.mp3',
	'bgm-wish':   'scene-wish.mp3',
	'bgm-chat':   'scene-chat.mp3',
	'bgm-end':    'scene-end.mp3',
});

// 环境音 SE（hooukago_stella MIT）
monogatari.assets ('sounds', {
	'env-city':      'env-city.mp3',
	'env-classroom': 'env-classroom.mp3',
	'env-chime':     'env-chime.mp3',
	'env-wind':      'env-wind.mp3',
	'env-gym':       'env-gym.mp3',        // 体育馆哨声
	'env-crowd':     'env-crowd.mp3',      // 远处人群
	'env-insect':    'env-insect.mp3',     // 夜间虫鸣
	'env-river':     'env-river.mp3',      // 河水声
	'env-leaves':    'env-leaves.mp3',     // 树叶风声
	'env-rooftop':   'env-rooftop.mp3',    // 屋上风声
	'env-semi':      'env-semi.mp3',       // 蝉鸣
});

// 角色立绘资源声明（真实二次元 PNG，由 Keri 装扮系统合成）
monogatari.assets ('characters', {
	'senior': [ 'senior_normal.png', 'senior_happy.png', 'senior_sad.png' ],
	'rival':  [ 'rival_normal.png', 'rival_happy.png', 'rival_angry.png' ],
	'buddy':  [ 'buddy_normal.png', 'buddy_happy.png', 'buddy_surprised.png' ],
	'guide':  [ 'guide_normal.png', 'guide_happy.png', 'guide_sad.png' ],
	'system': [ 'system_normal.png' ],
	'classmate_lin':   [ 'classmate_lin_normal.png' ],
	'classmate_xyu':   [ 'classmate_xyu_normal.png' ],
	'classmate_dazhi': [ 'classmate_dazhi_normal.png' ],
	'mentor_yuan':     [ 'mentor_yuan_normal.png' ],
	'mentor_can':      [ 'mentor_can_normal.png' ],
	'mentor_wan':      [ 'mentor_wan_normal.png' ],
	'mentor_chi':      [ 'mentor_chi_normal.png' ],
	'mentor_ning':     [ 'mentor_ning_normal.png' ],
	'mentor_lao':      [ 'mentor_lao_normal.png' ],
	'mentor_lingfeng': [ 'mentor_lingfeng_normal.png' ],
	'mentor_zhaoyang': [ 'mentor_zhaoyang_normal.png' ],
	'buddy_sports':   [ 'buddy_sports_normal.png', 'buddy_sports_happy.png' ],
	'fam_mom':  [ 'fam_mom_normal.png' ],
	'fam_dad':  [ 'fam_dad_normal.png' ],
	'fam_aunt': [ 'fam_aunt_normal.png' ],
	'tch_lee':  [ 'tch_lee_normal.png' ],
	'tch_wang': [ 'tch_wang_normal.png' ],
});

// ============================================================================
//  预生成动态选项（模块加载时构建，闭包捕获 value）
// ============================================================================
const PROV_ITEMS    = GK.provinceOptions();
const VISION_ITEMS  = GK.visionOptions();
const INTEREST_ITEMS = GK.interestOptions();
const ALL_GROUPS    = [...new Set(PROVINCES.flatMap(p => p.groups || []))];

// —— 省份 picker ——
const provPick = GK.picker({
	dialog: 'system 请选择你的【省份】（满分口径不同）：',
	items: PROV_ITEMS,
	onPick: (v) => { GK.set({ province: v }); },
	nextLabel: 'EnrollGroupChoice',
	prefix: '_prov',
});

// —— 选科 picker（列出所有可能的 group）——
const groupPick = GK.picker({
	dialog: 'system 请选择你的【选科组】：',
	items: ALL_GROUPS.map(g => ({ label: g, value: g })),
	onPick: (g) => { const c = GK.get(); GK.enroll({ name: c.name, province: c.province, group: g }); },
	nextLabel: 'AmnesiaIntro',
	prefix: '_grp',
});

// —— 人生理想 picker ——
const visionPick = GK.picker({
	dialog: 'guide 选择你的【人生理想】（决定专业推荐方向）：',
	items: VISION_ITEMS,
	onPick: (v) => { GK.setVision(v); },
	nextLabel: 'VisionTaskDone',
	prefix: '_vis',
});

// —— 兴趣 picker（多选，每点一个 toggle 后回自身；完成键单独）——
const interestPick = GK.picker({
	dialog: 'buddy 选几个你最来劲的【兴趣标签】（可多选，选完点最下方确认）：',
	items: INTEREST_ITEMS,
	onPick: (id) => { GK.toggleInterest(id); },
	nextLabel: 'InterestPickStart',   // 选完一个回自身继续选
	prefix: '_int',
});

// —— 导师阵容：接近全屏的画廊覆盖层（角色图鉴风格，独立于对话框）——
// GK.showMentorGallery() 弹出全屏画廊，用户点卡片 → 写 _peekMentor → 关闭 → jump MentorPeek。
// 关闭按钮 / 点背景 → 回到 MentorSummon。
window.GK = window.GK || {};
GK.showMentorGallery = function () {
	// 移除已存在的画廊
	const old = document.querySelector('.gk-gallery');
	if (old) old.remove();
	const cards = MENTORS.map(m => {
		const rc = RARITY_CONFIG[m.rarity];
		const archetypes = (m.archetypes || []).slice(0, 4).join(' · ');
		return `<div class="gk-gallery__card" data-mentor="${m.id}" style="--rc:${m.color || rc.color}">
			<div class="gk-gallery__rarity" style="--rc-rarity:${rc.color}">${'★'.repeat(rc.stars)} ${rc.label.split(' ')[0]}</div>
			<div class="gk-gallery__portrait"><img src="assets/characters/mentor_${m.id}/mentor_${m.id}_normal.png" alt="${m.name}" loading="lazy"></div>
			<div class="gk-gallery__info">
				<div class="gk-gallery__name">${m.emoji} ${m.name}</div>
				<div class="gk-gallery__title-text">${m.title.split(' · ')[1] || m.title}</div>
				<div class="gk-gallery__tags">
					<span class="gk-gallery__elem" style="background:${m.color}">${m.element}</span>
					<span class="gk-gallery__arch">${archetypes}</span>
				</div>
				<div class="gk-gallery__tagline">"${m.tagline}"</div>
				<div class="gk-gallery__bio">${m.bio}</div>
				<div class="gk-gallery__skills">
					<div class="gk-gallery__passive"><b>⚔ ${m.passive.label}</b>：${m.passive.desc}</div>
					<div class="gk-gallery__skill"><b>✨ 主动技</b>：${m.skill}</div>
				</div>
				<div class="gk-gallery__greet">💬 ${m.greet}</div>
			</div>
		</div>`;
	}).join('');
	const overlay = document.createElement('div');
	overlay.className = 'gk-gallery';
	overlay.innerHTML = `
		<div class="gk-gallery__header">
			<h2 class="gk-gallery__title">♟ 导师阵容</h2>
			<div class="gk-gallery__subtitle">点击导师卡片查看详情并出战 · 共 ${MENTORS.length} 位</div>
		</div>
		<button class="gk-gallery__close">✕ 关闭</button>
		<div class="gk-gallery__grid">${cards}</div>`;
	document.body.appendChild(overlay);
	// 点卡片 → 选导师
	overlay.querySelectorAll('.gk-gallery__card').forEach(card => {
		card.addEventListener('click', () => {
			const id = card.getAttribute('data-mentor');
			GK.set({ _peekMentor: id });
			overlay.remove();
			try { monogatari.run('jump MentorPeek'); } catch (e) {}
		});
	});
	// 关闭按钮 / 点背景 → 返回召唤
	const close = () => { overlay.remove(); try { monogatari.run('jump MentorSummon'); } catch (e) {} };
	overlay.querySelector('.gk-gallery__close').addEventListener('click', close);
};
// roster handler：点「先看看导师阵容」触发画廊（两语句：函数 + 回到自身等待）
const rosterHandlers = {
	'_roster_open': [ function () { GK.showMentorGallery(); }, 'jump MentorSummon' ],
};

// —— 聊天主题 picker ——
const CHAT_TOPICS = [
	{ k:'紧张害怕', t:'我有点紧张，不敢看分数…' },
	{ k:'填志愿',   t:'我该怎么填志愿？' },
	{ k:'人格',     t:'讲讲我的人格类型吧' },
	{ k:'未来',     t:'聊聊我的未来规划' },
	{ k:'感谢',     t:'谢谢你陪我' },
];
const chatPick = GK.picker({
	dialog: 'senior 想聊点什么？',
	items: CHAT_TOPICS.map(o => ({ label: '💬 ' + o.k, value: o.t })),
	onPick: (t) => { const r = GK.agentRespond(t); GK.set({ _chatReply: r.text }); },
	nextLabel: 'ChatReply',
	prefix: '_chat',
});

// —— 卡面 Choice 对象（live 引用，Dialog 在前置函数里动态写入，避免加载期求值）——
const mentorRevealChoice = { Choice: { Dialog: 'system ', 'Next': { Text: '✦ 出战！', Do: 'jump ScoreBoss' } } };
const scoreRevealChoice  = { Choice: { Dialog: 'system ', 'Next': { Text: '▶ 面对它', Do: 'jump ScoreReact' } } };

// 合并所有 handler 标签
const HANDLERS = Object.assign({},
	provPick.handlers, groupPick.handlers, visionPick.handlers,
	interestPick.handlers, rosterHandlers, chatPick.handlers
);

// —— MBTI 答题：预生成 28×2 = 56 个 handler（每题答A/答B 各一），2 语句模式 ——
// 第 i 题答完后，i<27 跳回 MbtiQuiz；i==27（最后一题）跳 MbtiResult。
const mbtiHandlers = {};
const quizChoice = { Choice: {
	Dialog: 'system 请选择你的倾向：',
	'A': { Text: '⬅ A', Do: 'jump _mbtiA_0' },
	'B': { Text: 'B ➡', Do: 'jump _mbtiB_0' },
}};
// MBTI 结果卡片的 live choice（Dialog 由 MbtiResult 标签的函数动态写入人格信息）
const mbtiResultChoice = { Choice: {
	Dialog: 'system 正在生成你的人格画像…',
	'Next': { Text: '🗺 完成 MBTI，返回地图', Do: 'jump MbtiTaskDone' },
}};
// 在 MbtiResult 渲染前，用函数写入人格卡 HTML 到 mbtiResultChoice.Dialog
function buildMbtiResultDialog () {
	GK.computeMbti();
	const g = GK.get();
	const info = GK.mbtiInfo(g.mbtiType) || { type: g.mbtiType, cn: '探索者', nick: '', tagline: '', strengths: [], careers: [], color: '#5B7FB8', emoji: '🔮' };
	// 优先用 16personalities 真实形象（花瓣画板下载），失败回退到简笔 SVG
	// 真图可能是 png/jpg/svg，用 onerror 链式回退
	const realImgs = ['png', 'jpg', 'svg'].map(ext =>
		`assets/images/mbti_real/${g.mbtiType}.${ext}`
	);
	const fallbackSvg = `assets/images/mbti/${g.mbtiType}.svg`;
	const onerrorChain = `this.onerror=null;` +
		realImgs.slice(1).map(p => `if(this.src!=='${p}'){this.src='${p}';}`).join('') +
		`if(this.src!=='${fallbackSvg}'){this.src='${fallbackSvg}';}`;
	return `system <div class="gk-mbti" style="--mc:${info.color}">
		<div class="gk-mbti__avatar gk-mbti__avatar--real"><img src="${realImgs[0]}" alt="${g.mbtiType}" onerror="${onerrorChain}"></div>
		<div class="gk-mbti__type">${g.mbtiType}</div>
		<div class="gk-mbti__cn">${info.cn} ${info.emoji || ''}</div>
		<div class="gk-mbti__nick">「${info.nick}」</div>
		<div class="gk-mbti__tag">${info.tagline}</div>
		<div class="gk-mbti__row"><b>天赋：</b>${(info.strengths || []).join(' · ')}</div>
		<div class="gk-mbti__row"><b>可能的方向：</b>${(info.careers || []).slice(0, 4).join(' · ')}</div></div>`;
}
MBTI_QUESTIONS.forEach((q, i) => {
	const nextLabel = (i + 1 >= MBTI_QUESTIONS.length) ? 'MbtiResult' : 'MbtiQuiz';
	mbtiHandlers['_mbtiA_' + i] = [
		function (idx) { return function () { GK.answerMbti(idx, MBTI_QUESTIONS[idx].a.t); }; }(i),
		'jump ' + nextLabel
	];
	mbtiHandlers['_mbtiB_' + i] = [
		function (idx) { return function () { GK.answerMbti(idx, MBTI_QUESTIONS[idx].b.t); }; }(i),
		'jump ' + nextLabel
	];
});
// 把 mbtiHandlers 合并进 HANDLERS
Object.assign(HANDLERS, mbtiHandlers);

// 给兴趣 picker 的 Choice 追加「完成」键（静态 Do）
interestPick.statement.Choice['Done'] = {
	Text: '✦ 选好了，返回地图',
	Do: 'jump InterestTaskDone',
};
// WishRevealPre: 先 buildWishlist，再跳 WishReveal（2 语句，规避直接 jump 到多语句标签）
const _wishPreChoice = { Choice: { Dialog: 'system ', 'Go': { Text: '▶ 揭晓志愿表（真相）', Do: 'jump WishRevealTruth' } } };
// 给聊天 picker 的 Choice 追加「返回志愿表」键
chatPick.statement.Choice['Back'] = { Text: '◀ 返回志愿表', Do: 'jump WishReveal2' };

// ============================================================================
//  脚本主体
// ============================================================================
monogatari.script (Object.assign({

		// ══════ Start ══════
		'Start': [
			// 片头快闪（名校剪影）已移到 main.js 的 init().then() 里播放，
			// 不再用 Start 首句的函数语句——那会卡住剧本推进。
			// 主菜单 BGM 的停止由 main.js 的 MutationObserver 处理（监听主菜单隐藏）
			'show scene scene-start with fadeIn',
			'play music bgm-start',
			{ 'Input': {
				'Text': '在开始之前，请告诉我你的名字 —— 它将被写进命运的志愿表。',
				'Validation': function (input) { return input.trim().length > 0; },
				'Save': function (input) { this.storage({ player: { name: input.trim() } }); return true; },
				'Revert': function () { this.storage({ player: { name: '' } }); },
				'Warning': '名字不能为空哦！'
			}},
			'show character senior happy with fadeIn',
			function () { GK.voice('senior/greet'); },
			'senior 你好呀，{{player.name}}。我是「温」，你的志愿陪伴学姐。接下来这段路，我陪你一起走。',
			'show character senior normal',
			'senior 查分、识己、选向、落笔 —— 别紧张，无论考了多少分，你都值得被温柔对待。',
			'jump Enroll'
		],

	// ══════ Enroll ══════
	'Enroll': [
		'show scene scene-enroll with fadeIn',
		'play music bgm-enroll',
		function () { GK.clearCharacters(); },
		'show character system normal with fadeIn',
		'system 入营登记 · 开始',
		'jump EnrollProvince'
	],
	'EnrollProvince': [
		provPick.statement
	],
	'EnrollGroupChoice': [
		groupPick.statement
	],

	// ══════ MentorSummon ══════
	'MentorSummon': [
		'show scene scene-summon with fadeIn',
		'play music bgm-summon',
		function () { GK.clearCharacters(); },
		'show character senior happy with fadeIn',
		'show notification EnrollOk',
		'play sound select',
		function () { GK.voice('system/mentor_intro'); },
		'senior {{player.name}}，在踏上战场前，先召唤一位「导师」为你加持吧。',
		'show character senior normal',
		'senior 他们是各有所长的战略家 —— 抽到谁，将影响你整张志愿表的走向。',
		{ Choice: {
			Dialog: 'senior 召唤池中有 6 位导师（SSR/SR/R）。准备好了吗？',
			'Summon': { Text: '✦ 召唤导师', Do: 'jump MentorPull' },
			'Roster': { Text: '🖼 查看导师画廊', Do: 'jump _roster_open' }
		}}
	],
	// 导师画廊由 GK.showMentorGallery() 全屏覆盖层实现（不再用标签）
	'MentorPeek': [
		function () {
			const m = MENTORS.find(x => x.id === GK.get()._peekMentor) || MENTORS[0];
			const rc = RARITY_CONFIG[m.rarity];
			const html = `<div class="gk-gacha gk-gacha--${m.rarity.toLowerCase()} gk-gacha--peek" style="--mc:${m.color};--rc:${rc.color}">
				<div class="gk-gacha__rarity">${rc.label} ${'★'.repeat(rc.stars)}</div>
				<div class="gk-gacha__portrait"><img src="assets/characters/mentor_${m.id}/mentor_${m.id}_normal.png" alt="${m.name}"></div>
				<div class="gk-gacha__emoji">${m.emoji}</div>
				<div class="gk-gacha__name">${m.name}</div>
				<div class="gk-gacha__title">${m.title}</div>
				<div class="gk-gacha__elem">${m.element}属性 · ${m.passive.label}</div>
				<div class="gk-gacha__tag">${m.tagline}</div>
				<div class="gk-gacha__bio">${m.bio}</div></div>`;
			return 'system ' + html;
		},
		{ Choice: {
			Dialog: 'system 是否让他/她出战？',
			'Go':   { Text: '✦ 就用他/她出战', Do: 'jump MentorPickConfirm' },
			'Back': { Text: '◀ 返回阵容', Do: 'jump _roster_open' }
		}}
	],
	'MentorPickConfirm': [
		function () {
			const m = MENTORS.find(x => x.id === GK.get()._peekMentor) || MENTORS[0];
			const rc = RARITY_CONFIG[m.rarity];
			GK.set({ mentorObj: m, mentor: m.id, mentorName: m.name, mentorRarity: m.rarity,
				mentorColor: m.color, mentorEmoji: m.emoji, mentorTitle: m.title,
				mentorElement: m.element, mentorTagline: m.tagline, mentorGreet: m.greet,
				mentorSkill: m.skill, mentorPassive: m.passive.label, mentorRarityLabel: rc.label });
		},
		'jump MentorReveal'
	],
	'MentorPull': [
		// 函数语句执行 pullMentor；jump 在单独标签里（规避「函数后紧跟 jump 不推进」的坑）
		function () { GK.pullMentor(); },
		'jump MentorPullGo'
	],
	'MentorPullGo': [
		'jump MentorReveal'
	],
	'MentorReveal': [
		'system 一道光芒闪过。你召唤出的导师出现在面前。',
		'system 导师的力量将影响你整张志愿表的推荐方向——他们的"被动技能"会加权不同维度。',
		'system 选好的导师会陪你走完整个流程。你也可以稍后在地图重新召唤。',
		{ Choice: {
			Dialog: 'system 导师已就位。准备好了吗？',
			'Next': { Text: '✦ 出战！返回地图', Do: 'jump MentorTaskDone' }
		}}
	],

	// ══════ ScoreBoss ══════
	'ScoreBoss': [
		'show scene scene-score with fadeIn',
		'play music bgm-score',
		function () { GK.clearCharacters(); },
		'show character rival angry with fadeIn',
		'system 第二关 · 查分 BOSS 战',
		function () { GK.voice('rival/score_intro'); },
		'rival 听好了，{{player.name}}。分数不是终点，但它是你必须面对的第一只 BOSS。',
		'show character rival normal',
		'rival 你的导师「{{gk.mentorName}}」已就位。现在 —— 看分数，还是不看？',
		{ Choice: {
			Dialog: 'rival 怎么选？',
			'Brave': { Text: '⚔ 我自己看！', Do: 'jump ScoreBrave' },
			'Auto':  { Text: '🫣 帮我查（自动查分）', Do: 'jump ScoreAutoPrep' }
		}}
	],
	'ScoreBrave': [
		function () { GK.rollScore(false); },
		'jump ScoreReveal'
	],
	'ScoreAutoPrep': [
		function () { GK.rollScore(true); },
		'jump ScoreAuto'
	],
	'ScoreAuto': [
		'play sound whoosh',
		function () { GK.clearCharacters(); },
		'show character senior sad with fadeIn',
		'senior 好，把屏幕放下，深呼吸三次……',
		'senior 我现在帮你打开系统，你不用看，我盯着。',
		'senior 连接中……正在和各省考试院同步……',
		'senior 身份核验通过，找到了你的成绩。',
		'senior 别紧张，无论多少分，你都值得被温柔对待。',
		'senior 正在解密分数……3……2……1……',
		'senior 好了。我帮你看了。来，一起面对它。',
		'jump ScoreReveal'
	],
	'ScoreReveal': [
		'show notification ScoreReady',
		'play sound crit',
		function () { scoreRevealChoice.Choice.Dialog = 'system ' + GK.scorePanelHtml(); },
		scoreRevealChoice
	],
	'ScoreReact': [
		// 用函数决定角色 + 台词，统一在一个标签里（规避函数 return jump 不可靠）
		function () {
			const g = GK.get();
			const high = (g.tier === 'S' || g.tier === 'A');
			GK.set({ _scoreHigh: high });
			// 直接 show 对应角色（函数语句执行 show 可靠，卡死的是 return jump）
		},
		'jump ScoreReactShow'
	],
	'ScoreReactShow': [
		function () { GK.clearCharacters(); },
		'show character senior sad with fadeIn',  // 默认温（治愈系），高分时下面函数覆盖
		function () {
			const g = GK.get();
			// 播放对应配音（高分用凛，低分用温）
			GK.voice(g._scoreHigh ? 'rival/score_high' : 'rival/score_low');
			return (g._scoreHigh ? 'rival ' : 'senior ') + g.moodLine;
		},
		{ Choice: {
			Dialog: 'senior 这次的查分，你认真面对了。回去校园地图，看看还有什么没找回的。',
			'Next': { Text: '🗺 完成查分，返回地图', Do: 'jump ScoreTaskDone' },
		}}
	],
	'MbtiSkip': [
		function () { GK.set({ mbtiType: 'XXXX' }); },
		'jump MbtiTaskDone'
	],

	// ══════ MBTI ══════
	'MbtiIntro': [
		'show scene scene-mbti with fadeIn',
		'play music bgm-mbti',
		function () { GK.clearCharacters(); },
		'show character guide normal with fadeIn',
		'system 第三关 · 认识你自己',
		'guide 人格测试是一面镜子 —— 它不定义你，但能帮你看见自己擅长什么、在意什么。',
		function () { GK.voice('guide/mbti_intro'); },
		'show character guide happy',
		'guide 我会用 28 道小题带你完成，约 3 分钟。凭直觉作答即可。',
		'show character guide normal',
		{ Choice: {
			Dialog: 'guide 准备好了吗？',
			'Start': { Text: '🪞 开始测试', Do: 'jump MbtiStart' },
			'Back':  { Text: '◀ 返回校园地图', Do: 'jump CampusMap' }
		}}
	],
	'MbtiStart': [
		function () { GK.resetMbti(); },
		'jump MbtiQuiz'
	],
	'MbtiQuiz': [
		// 函数：设置当前题号、改写 quizChoice 的 A/B Do + Dialog 为本题内容
		function () {
			const g = GK.get();
			const idx = g.mbtiIdx || 0;
			// 把 Choice 的 A/B 改指向「第 idx 题」的 handler
			quizChoice.Choice['A'].Do = 'jump _mbtiA_' + idx;
			quizChoice.Choice['B'].Do = 'jump _mbtiB_' + idx;
			GK.set({ _mbtiQ: idx });
			GK.sfx('click');
			const q = MBTI_QUESTIONS[idx];
			// ★ 关键：把题目 HTML 写入 quizChoice 的 Dialog（这样 Choice 渲染时题目与按钮同屏）
			quizChoice.Choice.Dialog = `system <div class="gk-mbti-q">
				<div class="gk-mbti-q__no">第 ${idx + 1} / ${MBTI_QUESTIONS.length} 题</div>
				<div class="gk-mbti-q__text">${q.q}</div>
				<div class="gk-mbti-q__opt"><b>A.</b> ${q.a.text}</div>
				<div class="gk-mbti-q__opt"><b>B.</b> ${q.b.text}</div></div>`;
		},
		'jump MbtiQuizChoice'
	],
	'MbtiQuizChoice': [
		quizChoice   // 字面 Choice 对象（A/B 的 Do 由 MbtiQuiz 函数运行时改写为 _mbtiA_i/_mbtiB_i）
	],
	'MbtiResult': [
		'show scene scene-mbti with fadeIn',
		'show character guide happy with fadeIn',
		'play sound achievement',
		'show notification MbtiDone',
		function () {
			// ★ 把人格卡 HTML 写入 mbtiResultChoice.Dialog（避免被 Choice 覆盖）
			mbtiResultChoice.Choice.Dialog = buildMbtiResultDialog();
		},
		mbtiResultChoice
	],

	// ══════ Vision + Interest ══════
	'VisionIntro': [
		'show scene scene-vision with fadeIn',
		'play music bgm-vision',
		function () { GK.clearCharacters(); },
		'show character senior normal with fadeIn',
		'senior 想成为什么样的人，比考多少分更重要。这是你志愿表的灵魂。',
		function () { GK.voice('senior/vision_intro'); },
		'show character senior happy',
		'senior 我这里有 12 种「人生理想」画像，每一个都指向不同的专业方向。',
		'senior 别急着选"听起来厉害"的。闭上眼想想——十年后的你，在做什么？那个画面里，你是什么样的人？',
		'show character senior normal',
		'senior 那个画面，就是你真正该选的理想。来吧，选一个让你心跳加速的。',
		'jump VisionPick'
	],
	'VisionPick': [
		visionPick.statement
	],
	'InterestPickStart': [
		// 首次进入清空（条件写在函数里，但跳转用字面 jump）
		function () {
			const g = GK.get();
			if (!g._interestInit) { GK.set({ interests: [], _interestInit: true }); }
		},
		'jump InterestPickChoice'
	],
	'InterestPickChoice': [
		interestPick.statement
	],

	// ══════ WishReveal ══════
	'WishRevealPre': [
		'show scene scene-wish with fadeIn',
			'play music bgm-wish',
		function () { GK.buildWishlist(); return 'senior 命运的齿轮转动完毕……你的志愿表即将揭晓。'; },
		_wishPreChoice
	],
	'WishReveal': [
		'show scene scene-wish with fadeIn',
		'show character senior happy with fadeIn',
		'show notification WishDone',
		'play sound ssr',
		function () { return 'system ' + GK.wishlistHtml(); },
		{ Choice: {
			Dialog: 'senior {{player.name}}，命运志愿表已落定。接下来想做什么？',
			'Chat': { Text: '💬 和导师聊聊', Do: 'jump Chat' },
			'Redo': { Text: '🔄 换个导师再算一次', Do: 'jump MentorSummon' },
			'End':  { Text: '📜 收下志愿表', Do: 'jump WishRevealTruth' }
		}}
	],
	'WishReveal2': [
		'show character senior normal',
		function () { return 'system ' + GK.wishlistHtml(); },
		{ Choice: {
			Dialog: 'senior 还想做什么？',
			'Chat': { Text: '💬 和导师聊聊', Do: 'jump Chat' },
			'End':  { Text: '📜 收下志愿表', Do: 'jump WishRevealTruth' }
		}}
	],

	// ══════ Chat ══════
	'Chat': [
		'show scene scene-chat with fadeIn',
			'play music bgm-chat',
		'show character senior happy with fadeIn',
		'senior 在这里你可以随时和我聊聊 —— 紧张、迷茫、想填志愿、聊聊未来，我都在。',
		'jump ChatMenu'
	],
	'ChatMenu': [
		chatPick.statement
	],
	'ChatReply': [
		function () {
			const t = GK.get()._chatReply || '嗯，我在听。';
			// 根据回复情绪切换表情
			const sad = /害怕|紧张|没考|砸|崩溃|放弃/.test(t);
			return 'show character senior ' + (sad ? 'sad' : 'happy') + '';
		},
		function () { return 'senior ' + (GK.get()._chatReply || '嗯，我在听。'); },
		'jump ChatMenu'
	],

	// ══════ GoodEnding ══════
	'GoodEnding': [
		'show scene scene-end with fadeIn',
			'play music bgm-end',
		'show character senior happy with fadeIn',
		'play sound levelup',
		'senior {{player.name}}，无论这手牌怎么打，请记得 ——',
		'senior 你的人生，是你自己的功劳。我只是递了把伞。',
		'show character senior happy',
		'senior 祝前程似锦，未来可期。🌙',
		{ Choice: {
			Dialog: 'senior 想再走一遍这段旅程吗？',
			'End': { Text: '🌙 到此为止', Do: 'end' }
		}}
	],

}, HANDLERS, {

}));
