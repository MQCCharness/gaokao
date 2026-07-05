/**
 * =============================================================================
 *  story.js —— 失忆穿越主线剧情扩展模块
 * ----------------------------------------------------------------------------
 *  在 script.js 之后加载，通过 monogatari.script() 追加新标签。
 *  覆盖：
 *    1. 开场失忆闪回（改写 Start 流程，省份/选科后进入 CampusMap）
 *    2. 校园地图枢纽（CampusMap）—— 玩家自由选任务节点
 *    3. 各任务完成后的记忆碎片闪回（5 段未来困境）
 *    4. 关键节点的存档提醒 + 关系/属性反馈
 *    5. 志愿揭晓的真相揭示 + 救赎结局（按关系值分支）
 *
 *  ⚠ Monogatari v2 约束（同 script.js）：
 *    - Choice 字面对象；Do 只接受 'jump X' 字符串
 *    - jump 目标首句不能是 'show scene ... with fadeIn'（会卡 step 0）
 *    - 动态状态写入用「函数语句 + 字面 jump」两语句
 *    - 用 monogatari.run('jump X') 驱动覆盖层跳转（如地图点节点）
 * =============================================================================
 */
'use strict';
/* global monogatari, GK */

// 校园地图打开 handler（被 MentorSummon 之外的入口复用）
// CampusMap 不放剧本语句，而是用 GK.showCampusMap() 全屏覆盖层

// —— 进入地图枢纽的过渡标签（jump 目标，首句非 show scene）——
// 各任务完成后回这里 → 弹碎片闪回 → 回地图
monogatari.script({

	// ══════ 失忆穿越 · 开场闪回（省份/选科完成后进入）══════
	'AmnesiaIntro': [
		'system ……',
		function () { GK.voice('system/amnesia1'); },
		'system 雨声。很重的雨声。',
		'system 你站在一间灰暗的房间里，桌上是一张皱巴巴的毕业证。',
		'system 手机亮着——一条五年前的消息：「志愿提交成功。」',
		'system 你盯着那条消息，胸口发紧。你记得……你不记得选了什么。你只记得，之后的一切都不对。',
		function () { GK.voice('system/amnesia2'); },
		'system 闪电。世界碎了。',
		'system 当你再次睁眼，雨声还在，但你回到了——填报志愿的那一夜。',
		'system 只是，你什么都不记得了。只剩零碎的画面，像摔碎的镜子。',
		function () { GK.voice('system/amnesia3'); },
		'system 一个声音在脑海里回响：「去那些地方。找回每一块碎片。否则，你会重蹈覆辙。」',
		{ Choice: {
			Dialog: 'system 窗外是熟悉的校园。该去看看了。',
			'Go': { Text: '🗺 前往校园', Do: 'jump CampusMapEnter' }
		}}
	],

	// ══════ 校园地图入口（jump 目标，首句函数避免卡死）══════
	'CampusMapEnter': [
		function () { GK.showCampusMap(); },
		'system 在校园地图上选择要前往的地点。完成全部 5 个任务后，可提交志愿表，揭开真相。',
	],
	'CampusMap': [
		// 从碎片闪回/任务返回时回到这里，重新打开地图
		function () { GK.showCampusMap(); },
	],

	// 兴趣任务的地图入口（先切场景再进 InterestPickStart）
	'InterestStartMap': [
		'show scene scene-chat with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'show character buddy normal with fadeIn',
	'buddy 阿星 嘿，{{player.name}}！来食堂坐坐？填志愿太烧脑了，咱先聊点轻松的。',
		function () { GK.voice('buddy/interest_intro'); },
		'show character buddy happy',
		'buddy 阿星 说真的，别光看分数。你平时最来劲的事儿是啥？打游戏时爱琢磨策略？还是爱画画？爱跟人聊？',
		'buddy 阿星 这些「来劲」的事儿，就是你的兴趣。它直接决定你该报什么专业——学四年不喜欢的东西，比考低分还难受。',
		'buddy 阿星 来，选几个你最来劲的【兴趣标签】，选完点确认。这决定你未来的学习方向！',
		function () { GK.showInterestPicker(); },
		'system （请在弹出的卡片中选择你最来劲的兴趣）',
	],

	// ══════ 各任务完成后的收尾标签（markCleared + 碎片闪回）══════
	// showShardFlash 内部关闭按钮会 jump CampusMap，不再重复写 jump（避免双重跳转冲突）

	'ScoreTaskDone': [
		function () { GK.markCleared('score'); },
		function () { GK.showShardFlash('score'); },
	],
	'MbtiTaskDone': [
		function () { GK.markCleared('mbti'); },
		function () { GK.showShardFlash('mbti'); },
	],
	'VisionTaskDone': [
		function () { GK.markCleared('vision'); },
		function () { GK.showShardFlash('vision'); },
	],
	'InterestTaskDone': [
		function () { GK.markCleared('interest'); },
		function () { GK.showShardFlash('interest'); },
	],
	'MentorTaskDone': [
		function () { GK.markCleared('mentor'); },
		function () { GK.showShardFlash('mentor'); },
	],

	// ══════ 查分关的解谜（进入 ScoreBoss 前的小谜题）══════
	// 设计：贴合"查分需要冷静分析"——给一组模拟分数段，让玩家判断该冲/稳/保
	'PuzzleScore': [
		'system 【解谜】凛递来一张模拟分数表：「在动手查分前，先证明你会读它。」',
		'system 表上写着：某省物理组，你预估 580 分（省排约 28000）。参考线如下：',
		'system · A 校(985)：近三年最低录取位次 8000-12000',
		'system · B 校(211)：近三年最低录取位次 20000-26000',
		'system · C 校(普本)：近三年最低录取位次 35000-42000',
		{ Choice: {
			Dialog: 'system 你的 28000 位次，哪个学校属于合理的"冲"档（有希望但不稳）？',
			'Right': { Text: '✓ B 校（冲一冲有可能）', Do: 'jump PuzzleScoreOk' },
			'Wrong1': { Text: 'A 校（位次差太多，纯送）', Do: 'jump PuzzleScoreWrong' },
			'Wrong2': { Text: 'C 校（太保守，浪费分）', Do: 'jump PuzzleScoreWrong' },
		}}
	],
	'PuzzleScoreOk': [
		function () { GK.solvePuzzle('score'); GK.feedback({ rel: { rival: +8 }, attrs: { insight: +4 } }); },
		'rival 凛 对，B 校是冲档。你的位次比它低线略高，有戏但不稳——这正是"冲"的含义。',
		'rival 凛 学会读位次，比记住分数更重要。走吧，去查你真正的分数。',
		'jump ScoreBossReal',
	],
	'PuzzleScoreWrong': [
		function () { GK.feedback({ rel: { rival: -5 }, attrs: { patience: -3 } }); },
		'rival 凛 错。你这是凭感觉乱填——正是五年前的你犯过的毛病。',
		'rival 凛 重新想：冲档要"跳一跳够得着"，不是天差地别，也不是稳拿在手。',
		{ Choice: {
			Dialog: 'system （再选一次）',
			'Right': { Text: '✓ B 校', Do: 'jump PuzzleScoreOk' },
			'Wrong': { Text: '再想想…', Do: 'jump PuzzleScoreWrong2' },
		}}
	],
	'PuzzleScoreWrong2': [
		'rival 凛 提示：你的位次 28000，B 校要 20000-26000，你比它最低线还低一些——所以有希望冲，这就是冲档。',
		{ Choice: { Dialog: 'system 选 B 校', 'Go': { Text: '✓ B 校', Do: 'jump PuzzleScoreOk' } } }
	],
	// ScoreBossReal：真正的查分入口（解谜通过后）+ 存档提醒
	// ⚠ 存档提醒用 setTimeout 延迟弹窗，避免 DOM 插入干扰引擎 Choice 渲染（导致选项不出现）
	'ScoreBossReal': [
		function () {
			if (GK.saveWarn('score')) {
				// 延迟 300ms 让 Choice 先渲染
				setTimeout(() => GK.showSaveWarn('查分后剧情将根据分数分支，建议先存档。'), 300);
			}
		},
		'system 解谜通过。现在，选择你查分的方式：',
		{ Choice: {
			Dialog: 'system 🎮 游戏路线（虚拟分数，体验剧情） / 📊 现实路线（输入真实分数，AI 估算位次）',
			'Game':   { Text: '🎮 游戏路线（虚拟分数）', Do: 'jump ScoreBoss' },
			'Real':   { Text: '📊 现实路线（输入真实分数）', Do: 'jump RealScoreEnter' },
		}}
	],

	// 现实路线：输入真实分数 → 调 AI 估算位次
	'RealScoreEnter': [
		function () { GK.showRealScoreForm(); },
		'system （请在弹出的窗口中输入你的真实信息）',
	],

	// ══════ MBTI 关的解谜（进 MbtiIntro 前）══════
	'PuzzleMbti': [
		'system 【解谜】导师·沈 拿出一组卡片：「在测你自己之前，先学会区分——这是行为，还是偏好？」',
		'system 场景：考试前夜，你的同学约你出去放松。',
		{ Choice: {
			Dialog: 'system 你的第一反应是？',
			'A': { Text: '☀️ 去吧！人多力量大，放松一下挺好', Do: 'jump PuzzleMbtiE' },
			'B': { Text: '🌙 算了，我想一个人静静复习', Do: 'jump PuzzleMbtiI' },
		}}
	],
	'PuzzleMbtiE': [
		function () { GK.solvePuzzle('mbti'); GK.feedback({ rel: { guide: +6 }, attrs: { insight: +3 } }); },
		'guide 沈 你倾向于从外界获取能量——这是 E（外向）偏好。注意，是"偏好"而非"能力"。',
		'guide 沈 记住这个感觉。接下来的测试，凭直觉答，不要想太多。',
		'jump MbtiIntro',
	],
	'PuzzleMbtiI': [
		function () { GK.solvePuzzle('mbti'); GK.feedback({ rel: { guide: +6 }, attrs: { insight: +3 } }); },
		'guide 沈 你倾向于从独处中恢复能量——这是 I（内向）偏好。没有好坏之分。',
		'guide 沈 记住这个感觉。接下来的测试，凭直觉答，不要想太多。',
		'jump MbtiIntro',
	],

	// ══════ 人生理想关的解谜（进 VisionIntro 前）══════
	// 主题：理想 vs 现实，区分"真正的热爱"与"外界期待"
	'PuzzleVision': [
		'system 【解谜】学姐·温 靠在屋上栏杆，递来一张纸条：「在选理想前，先分清——哪个是你『真正想要的』，哪个是『别人希望你想要的』。」',
		'system 下面三个"人生理想"，哪个听起来最像『外界强加给你的』？',
		{ Choice: {
			Dialog: 'system （仔细想：哪个最像别人塞给你的？）',
			'Right': { Text: '✓ "我妈说当医生稳定，那就当医生"', Do: 'jump PuzzleVisionOk' },
			'Wrong1': { Text: '"我从小就爱拆机器，想做工程师"', Do: 'jump PuzzleVisionWrong' },
			'Wrong2': { Text: '"我想开一家自己的咖啡店"', Do: 'jump PuzzleVisionWrong' },
		}}
	],
	'PuzzleVisionOk': [
		function () { GK.solvePuzzle('vision'); GK.feedback({ rel: { senior: +8 }, attrs: { insight: +4, courage: +3 } }); },
		'senior 温 对。"我妈说稳定"——这不是你的理想，是你妈的。理想必须从你心里长出来，哪怕它不"稳定"。',
		'senior 温 记住这个区分。接下来选你的人生理想，问问自己：这是我要的，还是别人要我做的？',
		'jump VisionIntro',
	],
	'PuzzleVisionWrong': [
		function () { GK.feedback({ rel: { senior: -3 }, attrs: { patience: -2 } }); },
		'senior 温 嗯……这个听起来更像是你自己的声音，而不是外界强加的。再想想：哪个选项的动机来自『别人』？',
		{ Choice: {
			Dialog: 'system （再选一次：哪个动机来自别人？）',
			'Right': { Text: '✓ "我妈说当医生稳定"', Do: 'jump PuzzleVisionOk' },
			'Think': { Text: '再想想…', Do: 'jump PuzzleVisionHint' },
		}}
	],
	'PuzzleVisionHint': [
		'senior 温 提示：关键词是『我妈说』。当理想的理由是"别人说"，它就不是你的。',
		{ Choice: { Dialog: 'system 选「我妈说当医生稳定」', 'Go': { Text: '✓ 这个是外界强加的', Do: 'jump PuzzleVisionOk' } } }
	],

	// ══════ 兴趣关的解谜（进 InterestStartMap 前）══════
	// 主题：兴趣与专业的对应关系，纠正"随便选兴趣"
	'PuzzleInterest': [
		'system 【解谜】阿星 嘴里塞着半个包子：「等等！选兴趣之前先考考你——你知道哪个兴趣，最适合往『软件工程』方向走吗？」',
		'system （这关系到你能不能把兴趣变成专业）',
		{ Choice: {
			Dialog: 'buddy 阿星 来，凭直觉选：',
			'Right': { Text: '✓ 逻辑推理 / 创造想象', Do: 'jump PuzzleInterestOk' },
			'Wrong1': { Text: '审美艺术', Do: 'jump PuzzleInterestWrong' },
			'Wrong2': { Text: '社交表达', Do: 'jump PuzzleInterestWrong' },
		}}
	],
	'PuzzleInterestOk': [
		function () { GK.solvePuzzle('interest'); GK.feedback({ rel: { buddy: +8 }, attrs: { diligence: +4 } }); },
		'buddy 阿星 对！逻辑和创造是编程的核心。你看，兴趣不是瞎选的——它能直接告诉你适合什么专业。',
		'buddy 阿星 待会儿选兴趣，认真点选，这决定你未来的学习方向！',
		'jump InterestStartMap',
	],
	'PuzzleInterestWrong': [
		function () { GK.feedback({ rel: { buddy: -3 }, attrs: { diligence: -2 } }); },
		'buddy 阿星 嗤，错。审美和社交当然重要，但软件工程靠的是逻辑和抽象思维。',
		'buddy 阿星 提示：写代码本质是『用逻辑解决问题』+『创造新东西』。',
		{ Choice: { Dialog: 'system 选「逻辑推理/创造想象」', 'Go': { Text: '✓ 逻辑推理 / 创造想象', Do: 'jump PuzzleInterestOk' } } }
	],

	// ══════ 召唤台关的解谜（进 MentorSummon 前）══════
	// 主题：导师 passive buff 的理解，纠正"看脸选导师"
	'PuzzleMentor': [
		'system 【解谜】召唤台亮起，系统的声音响起：「选择导师前，先证明你看得懂他们的能力。」',
		'system 你查分后发现是『中等偏低』，冲一所好学校有风险。此时哪位导师的被动最适合你？',
		'system 提示：被动属性里有『稳如泰山(提升稳档权重)』『逆风冲刺(提升冲档权重)』『精确制导(提分适配)』等',
		{ Choice: {
			Dialog: 'system 中低分求稳，选哪个被动最合适？',
			'Right': { Text: '✓ 稳如泰山（稳档加权，保底更稳）', Do: 'jump PuzzleMentorOk' },
			'Wrong1': { Text: '逆风冲刺（冲档加权，更冒险）', Do: 'jump PuzzleMentorWrong' },
			'Wrong2': { Text: '看哪个立绘好看选哪个', Do: 'jump PuzzleMentorWrong' },
		}}
	],
	'PuzzleMentorOk': [
		function () { GK.solvePuzzle('mentor'); GK.feedback({ attrs: { insight: +5, diligence: +3 } }); },
		'system 正确。中低分时，稳档加权能让你保底志愿更可靠——导师的能力要匹配你的处境。',
		'system 去召唤你的导师吧。记住：选导师看能力，不看脸。',
		'jump MentorSummon',
	],
	'PuzzleMentorWrong': [
		function () { GK.feedback({ attrs: { diligence: -3, patience: -2 } }); },
		'system 错。中低分硬冲是赌博——这正是五年前你犯的错。『看脸选』更离谱。',
		'system 提示：分数不够时，"稳"比"冲"更重要。选稳如泰山。',
		{ Choice: { Dialog: 'system 选「稳如泰山」', 'Go': { Text: '✓ 稳如泰山', Do: 'jump PuzzleMentorOk' } } }
	],

	// ══════ 真相结局（志愿揭晓后，按关系值分支）══════
	'WishRevealTruth': [
		function () {
			if (GK.saveWarn('truth')) {
				setTimeout(() => GK.showSaveWarn('即将揭晓真相并进入结局（按关系值分支），强烈建议先存档！'), 500);
			}
		},
		'show scene scene-wish with fadeIn',
		'play music bgm-wish',
		function () { GK.buildWishlist(); },
		'system ……',
		'system 雨声。很重的雨声。',
		'system 你站在一间灰暗的房间里，桌上是一张皱巴巴的毕业证。',
		'system 手机亮着——一条五年前的消息：「志愿提交成功。」',
		'system 你盯着那条消息，胸口发紧。你记得……你不记得选了什么。你只记得，之后的一切都不对。',
		'system 闪电。世界碎了。',
		'system 当你再次睁眼，雨声还在，但你回到了——填报志愿的那一夜。',
		'system 只是，你什么都不记得了。只剩零碎的画面，像摔碎的镜子。',
		'system 一个声音在脑海里回响：「去那些地方。找回每一块碎片。否则，你会重蹈覆辙。」',
		function () { return 'system ' + GK.wishlistHtml(); },
		'system 志愿表生成完毕。但这一次，有些不一样。',
		'system 你低头看着这张表——每一个专业、每一所学校，都对应着一段你找回的记忆。',
		'system 碎片在脑海中拼合。你终于看清了——五年后的自己，为什么会走到那一步。',
		{ Choice: {
			Dialog: 'system 真相即将揭晓。',
			'Next': { Text: '🌅 揭开真相', Do: 'jump WishTruthBranch' }
		}}
	],
	'WishTruthBranch': [
		// 写入分支等级，然后用字面 jump 分发（不用函数 return jump）
		function () {
			const g = GK.get();
			// 关系值求和：主角团 + NPC 同学（帮助同学影响结局）
			const allKeys = ['senior','rival','buddy','guide','classmate_lin','classmate_xyu','classmate_dazhi'];
			const totalRel = allKeys.reduce((s,k)=>s+(g.relations?.[k]||0),0);
			// NPC 关系加分（帮助过同学额外加权）
			const npcRel = ['classmate_lin','classmate_xyu','classmate_dazhi'].reduce((s,k)=>s+(g.relations?.[k]||0),0);
			const effectiveTotal = totalRel + Math.max(0, npcRel - 90); // NPC 超 30 初始的部分算额外贡献
			const lvl = effectiveTotal >= 380 ? 'good' : effectiveTotal >= 290 ? 'normal' : 'bitter';
			GK.set({ _truthLevel: lvl, _truthTotalRel: totalRel });
		},
		'jump WishTruthPick',
	],
	'WishTruthPick': [
		// 用「写状态 + 字面 jump」两语句分发（规避函数 return jump 不可靠）
		function () {
			const lvl = GK.get()._truthLevel || 'normal';
			GK.set({ _truthDest: 'WishTruthGo_' + lvl });
		},
		'jump WishTruthDispatch',
	],
	'WishTruthDispatch': [
		// 中间标签：读 _truthDest 跳转（首句非 show scene）
		function () { try { monogatari.run('jump ' + GK.get()._truthDest); } catch (e) {} },
	],
	'WishTruthGo_good': [ 'jump WishTruthGood' ],
	'WishTruthGo_normal': [ 'jump WishTruthNormal' ],
	'WishTruthGo_bitter': [ 'jump WishTruthBitter' ],
	'WishTruthGood': [
		function () { GK.voice('senior/ending_good'); },
		'senior 温 你做到了，{{player.name}}。这一次，你真的想清楚了。',
		'senior 温 这张表上的每一个选择，都有你的理由——分数、性格、梦想、兴趣。它不再是五年前那张盲目的赌注。',
		'guide 沈 你找回了全部的自己。凛、朝阳、还有我们——其实都是你的一部分。',
		'system 雨停了。晨光透过窗帘。你看着那张志愿表，第一次觉得，未来是自己的。',
		{ Choice: {
			Dialog: 'senior 这一次，你会走向怎样的未来？',
			'End': { Text: '🌅 迎向晨光', Do: 'jump GoodEndingTruth' }
		}}
	],
	'WishTruthNormal': [
		'senior 温 ……你完成了。但有些地方，你走得不够深。',
		'senior 温 这张表能用，可你心里清楚，有一两个选择你还是凭了惯性，没有真正想透。',
		'guide 沈 没关系。人不可能一次就想清楚所有事。至少这次，你比五年前认真多了。',
		'system 雨小了。你看着志愿表，有些释然，也有些遗憾。但至少——你在往前走。',
		{ Choice: {
			Dialog: 'senior 未来还在继续。',
			'End': { Text: '🌤 带着遗憾前行', Do: 'jump NormalEndingTruth' }
		}}
	],
	'WishTruthBitter': [
		function () { GK.voice('senior/ending_bitter'); },
		'system ……',
		'senior 温 你走完了流程。但说实话，你敷衍了。',
		'senior 温 谜题乱选，对话不走心，该想的没想。这张表……和五年前那张，又有多大区别？',
		'buddy 阿星 嘿，别这么说……至少这次他回来了，对吧？',
		'senior 温 回来了，却没真的改变。那就只是，重蹈覆辙的慢一点版本。',
		'system 雨没停。你看着志愿表，感到一阵熟悉的麻木。',
		{ Choice: {
			Dialog: 'system ……',
			'End': { Text: '🌧 雨还在下', Do: 'jump BitterEndingTruth' }
		}}
	],
	'GoodEndingTruth': [
		'show scene scene-end with fadeIn',
		'play music bgm-end',
		'system ……',
		'system 五年后。',
		'system 你站在曾经那间灰暗的房间里。但这次，桌上不再是皱巴巴的毕业证。',
		'system 是一封录取通知书——来自这张志愿表上的第一志愿。',
		'senior 温 看吧？只要你愿意认真对待自己，命运是可以被改写的。',
		'system 那个雨夜的自己，终于笑了。',
		{ Choice: { Dialog: 'system 【挚友结局】全剧终', 'End': { Text: '🌙 谢谢这段旅程', Do: 'end' }, 'Replay': { Text: '🔄 重新开始', Do: 'jump ReplayGame' } } }
	],
	'NormalEndingTruth': [
		'show scene scene-end with fadeIn',
		'play music bgm-end',
		'system 五年后。',
		'system 你在一家还过得去的公司，做着还算对口的工作。不算耀眼，但也没走偏。',
		'system 偶尔深夜，你会想起那个雨夜——想起本来可以再认真一点。',
		'system 但你也知道，比起五年前那张盲目的赌注，至少这次是你自己选的。',
		{ Choice: { Dialog: 'system 【普通结局】全剧终', 'End': { Text: '🌙 继续走吧', Do: 'end' }, 'Replay': { Text: '🔄 重新开始', Do: 'jump ReplayGame' } } }
	],
	'BitterEndingTruth': [
		'show scene scene-end with fadeIn',
		'play music bgm-end',
		'system 五年后。',
		'system 同一间灰暗的房间。同一张皱巴巴的毕业证。',
		'system 你看着手机里那条「志愿提交成功」，分不清这是穿越前，还是穿越后。',
		'system ……也许，命运不是穿越一次就能改写的。它要的，是你真心。',
		'system （提示：认真解谜、深入思考、善待每个角色，可解锁更好的结局）',
		{ Choice: { Dialog: 'system 【苦涩结局】全剧终', 'End': { Text: '🌙 结束', Do: 'end' }, 'Replay': { Text: '🔄 这次认真一点，重来', Do: 'jump ReplayGame' } } }
	],
	'ReplayGame': [
		function () { GK.fullReset(); },
	],

	// ══════ NPC 同学互动（走廊·镜像对照玩法）══════
	'NpcCorridorEnter': [
		'show scene scene-corridor with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'system 走廊里弥漫着查分后的各种情绪。有人在笑，有人在哭，有人面无表情。',
		function () {
			// 首次进入生成 NPC 分数
			const g = GK.get();
			if (!g.npcScores || !Object.keys(g.npcScores).length) GK.rollNpcScores();
		},
		function () {
			const g = GK.get();
			const myScore = g.score || 0;
			const npcs = window.CLASSMATES || [];
			const lines = npcs.map(c => {
				const ns = g.npcScores?.[c.id];
				if (!ns) return '';
				const diff = ns.score - myScore;
				const cmp = diff > 30 ? `比你高 ${diff} 分` : diff < -30 ? `比你低 ${-diff} 分` : `和你差不多（差 ${Math.abs(diff)} 分）`;
				return `${c.emoji} ${c.name}：${ns.score} 分（${cmp}）—— ${c.tagline}`;
			}).filter(Boolean).join('\n');
			return 'system 你的分数：' + myScore + ' 分\n' + lines + '\n\n你看到三位同学。想和谁聊聊？';
		},
		function () {
			GK.showNpcPicker({
				title: '🚶 选择一位同学互动',
				subtitle: '已互动过的同学会标记 ✓。',
				npcs: [
					{ icon: '📐', label: '林（高分学霸）', talkedKey: 'classmate_lin', jumpLabel: 'NpcTalkLin' },
					{ icon: '🌧', label: '小雨（同分焦虑）', talkedKey: 'classmate_xyu', jumpLabel: 'NpcTalkXyu' },
					{ icon: '🍳', label: '大志（低分丧气）', talkedKey: 'classmate_dazhi', jumpLabel: 'NpcTalkDazhi' },
				],
				leaveLabel: '🚪 先走了',
				leaveJump: 'NpcCorridorLeave',
			});
		},
		'system （请在弹出的卡片中选择互动对象）',
	],
	// 林（高分）互动
	'NpcTalkLin': [
		function () { const t = GK.get()._talked || {}; t.classmate_lin = true; GK.set({ _talked: t }); },
		'show character classmate_lin normal with fadeIn',
		'system 林靠在窗边，手里捏着一张写得密密麻麻的纸。',
		'classmate_lin 林 ……你来啦。分数看了？',
		'classmate_lin 林 我考得还行。但说实话，现在最怕的不是分数，是接下来怎么填。考得好不代表填得好。',
		{ Choice: {
			Dialog: 'classmate_lin 林 你想……？',
			'Good':  { Text: '📚 请教学习方法', Do: 'jump NpcLinGood' },
			'Bad':   { Text: '😏 嫉妒顶撞', Do: 'jump NpcLinBad' },
		}}
	],
		'NpcLinGood':  [ function () { GK.showNpcInteract('classmate_lin', 'good'); } ],
		'NpcLinBad':   [ function () { GK.showNpcInteract('classmate_lin', 'bad'); } ],
	// 小雨（同分）互动
	'NpcTalkXyu': [
		function () { const t = GK.get()._talked || {}; t.classmate_xyu = true; GK.set({ _talked: t }); },
		'show character classmate_xyu normal with fadeIn',
		'system 小雨蹲在饮水机旁边，手机屏幕亮着，是查分页面。',
		'classmate_xyu 小雨 嘿……你考了多少？我……我和你差不多。天哪，我现在手还在抖。',
		'classmate_xyu 小雨 你说，咱俩这分数，能去哪啊？我好怕填错。',
		{ Choice: {
			Dialog: 'classmate_xyu 小雨 ……',
			'Good':  { Text: '🤝 互相打气', Do: 'jump NpcXyuGood' },
			'Bad':   { Text: '📉 攀比单科', Do: 'jump NpcXyuBad' },
		}}
	],
		'NpcXyuGood':  [ function () { GK.showNpcInteract('classmate_xyu', 'good'); } ],
		'NpcXyuBad':   [ function () { GK.showNpcInteract('classmate_xyu', 'bad'); } ],
	// 大志（低分）互动
	'NpcTalkDazhi': [
		function () { const t = GK.get()._talked || {}; t.classmate_dazhi = true; GK.set({ _talked: t }); },
		'show character classmate_dazhi normal with fadeIn',
		'system 大志蹲在走廊尽头，背对着所有人。',
		'classmate_dazhi 大志 ……别管我。我就是……不知道该干嘛了。',
		'classmate_dazhi 大志 分数你也看到了吧。我连本科线都没到。',
		{ Choice: {
			Dialog: 'classmate_dazhi 大志 ……',
			'Good':  { Text: '🫂 安慰他', Do: 'jump NpcDazhiGood' },
			'Bad':   { Text: '🚶 冷漠走过', Do: 'jump NpcDazhiBad' },
		}}
	],
		'NpcDazhiGood':[ function () { GK.showNpcInteract('classmate_dazhi', 'good'); } ],
		'NpcDazhiBad': [ function () { GK.showNpcInteract('classmate_dazhi', 'bad'); } ],
	// 互动后回到走廊选择（可继续和其他同学聊，或离开）
	'NpcCorridorAfter': [
		function () {
			try { monogatari.run('hide character classmate_lin with fadeOut'); } catch (e) {}
			try { monogatari.run('hide character classmate_xyu with fadeOut'); } catch (e) {}
			try { monogatari.run('hide character classmate_dazhi with fadeOut'); } catch (e) {}
			const g = GK.get();
			const talked = g._talked || {};
			const all = ['classmate_lin', 'classmate_xyu', 'classmate_dazhi'];
			const remaining = all.filter(k => !talked[k]);
			if (remaining.length === 0) {
				GK.markCleared('corridor');
				return 'system 你和每位同学都聊过了。走廊空了下来，阳光照进来。\n（走廊探索完成，关系值影响结局）';
			}
			return 'system 还可以再和其他同学聊聊，或者先走。';
		},
		{ Choice: {
			Dialog: 'system 走廊探索',
			'Back':  { Text: '🚶 继续找人聊', Do: 'jump NpcCorridorEnter' },
			'Leave': { Text: '🚪 离开走廊', Do: 'jump NpcCorridorLeave' },
		}}
	],
	'NpcCorridorLeave': [
		'hide character classmate_lin with fadeOut',
		'hide character classmate_xyu with fadeOut',
		'hide character classmate_dazhi with fadeOut',
		'jump CampusMap',
	],

	// ══════ 放松场景（日常支线，节奏调节 + 关系培养 + 环境音）══════

	// 🏀 打篮球（体育馆，和阿星）—— 扬抑交替 + 道德选择
	'RelaxGym': [
		'show scene scene-gym with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'play sound env-gym',
		'system 傍晚的体育馆，光线从高窗斜照进来。球鞋摩擦地板的声音回荡着。',
		'play sound env-crowd',
		'show character buddy_sports happy with fadeIn',
		function () { GK.voice('buddy/basketball'); },
		'buddy_sports 阿星 嘿！{{player.name}}！传一个！',
		'system 阿星把球甩给你。你接住，手感冰凉又熟悉。',
		{ Choice: {
			Dialog: 'buddy 阿星 来，单挑一局？输的请喝汽水！',
			'Play':  { Text: '🏀 接受挑战', Do: 'jump RelaxGymPlay' },
			'Talk':  { Text: '💤 坐场边聊聊', Do: 'jump RelaxGymTalk' },
		}}
	],
	'RelaxGymPlay': [
		function () { GK.feedback({ rel: { buddy: +8 }, attrs: { courage: +4 } }); },
		'play sound click',
		'system 你运球，急停，跳投——球在篮筐上弹了两下，进了。',
		'buddy 阿星 卧槽！可以啊你！这手感，填志愿也该这么果断。',
		'show character buddy_sports happy',
		'system 你俩你来我往，比分交替上升。汗水淌进眼睛，但奇怪的是，那些填志愿的焦虑，随着每一次运球慢慢淡了。',
		'system 一个小时后，你俩瘫在场边。晚霞把体育馆染成橙色。',
		// ↓ 抑：阿星突然沉默，透露家里压力
		'show character buddy_sports normal',
		'buddy 阿星 ……喂。',
		'buddy 阿星 你说，人是不是非得活成爸妈想要的样子？',
		'system 阿星盯着地板，球还在地上慢慢滚。他的声音突然轻了下来。',
		'buddy 阿星 我爸昨晚又喝多了。他说，我必须报金融。他说，他托了关系，能让我进一个不错的学校。',
		'buddy 阿星 可我想报体育教育。我想当教练。你知道的，我打球的时候……眼睛里有光。',
		'system 他抬起头看你，眼眶有点红。这是你认识阿星这么多年，第一次见他这样。',
		// ↓ 道德选择
		{ Choice: {
			Dialog: 'buddy 阿星 ……帮我个忙呗。今晚回去填预志愿的时候，你帮我盯着——如果我手一抖填了金融，你就骂醒我。行不？',
			'Help':    { Text: '🤝 行，我盯着你', Do: 'jump RelaxGymHelp' },
			'Refuse':  { Text: '🙅 这事你得自己跟你爸谈', Do: 'jump RelaxGymRefuse' },
			'Middle':  { Text: '💡 先报金融保底，体育做第二志愿？', Do: 'jump RelaxGymMiddle' },
		}}
	],
	'RelaxGymHelp': [
		function () { GK.feedback({ rel: { buddy: +12 }, attrs: { courage: +5, diligence: +3 } }); },
		'buddy 阿星 ……谢了兄弟。',
		'buddy 阿星 有你这句话，我就知道我不是一个人扛。',
		'system 阿星用力拍了一下你的肩膀。疼，但那种"被需要"的感觉，让你心里一暖。',
		'show character buddy_sports happy',
		'buddy 阿星 走！请你喝汽水。今天这局，我认输。',
		'jump RelaxGymEnd'
	],
	'RelaxGymRefuse': [
		function () { GK.feedback({ rel: { buddy: +4 }, attrs: { insight: +6 } }); },
		'show character buddy_sports normal',
		'buddy 阿星 ……也是。',
		'buddy 阿星 躲得过今晚，躲不过四年。躲得过我爸，躲不过我自己。',
		'system 阿星沉默了一会儿，忽然笑了。那笑里有点苦，但也有点释然。',
		'buddy 阿星 行，我今晚就跟我爸摊牌。大不了挨顿打。总比后悔四年强。',
		'system 你没有帮他隐瞒，但你的话让他下定了决心。有时候，朋友能做的不是替你决定，而是逼你面对。',
		'jump RelaxGymEnd'
	],
	'RelaxGymMiddle': [
		function () { GK.feedback({ rel: { buddy: +8 }, attrs: { diligence: +5, insight: +4 } }); },
		'buddy 阿星 ……保底？',
		'system 阿星愣了一下，眼睛突然亮了。',
		'buddy 阿星 卧槽，我怎么没想到！金融做第一志愿糊弄我爸，体育做第二志愿——就算第一志愿滑档，我还能上体育！',
		'buddy 阿星 你他妈是天才！这招"明修栈道暗度陈仓"，服了服了！',
		'show character buddy_sports happy',
		'system 阿星又活过来了。他用力撞了一下你的肩膀，力气大得差点把你撞倒。',
		'buddy 阿星 走，请你喝汽水。今天这局，值了。',
		'jump RelaxGymEnd'
	],
	'RelaxGymTalk': [
		function () { GK.feedback({ rel: { buddy: +5 }, attrs: { patience: +3 } }); },
		'play sound click',
		'system 你俩坐在场边，喝着汽水。球场空了，只有风穿过窗户的声音。',
		'play sound env-leaves',
		'buddy 阿星 其实我也慌。不是怕考不好，是怕……选错了，以后后悔。',
		'buddy 阿星 但刚才看你投那个球，我突然想通了——后悔又怎样？至少是我自己选的。比让爸妈替我选，然后怪他们一辈子强。',
		'system 阿星的话糙，但你听进去了。有些道理，非得出了汗才想得通。',
		'jump RelaxGymEnd'
	],
	'RelaxGymEnd': [
		'stop sound',
		function () { GK.markCleared('relax_gym'); },
		function () { GK.sfx('reveal'); },
		'system （体育馆探索完成。和阿星的关系提升了——你见过他最热血的样子，也见过他最脆弱的时刻。）',
		'jump CampusMap',
	],

	// 🌌 看星空（屋上，和学姐·温）—— 先扬后抑 + 学姐的遗憾
	'RelaxStargaze': [
		'show scene scene-stargaze with fadeIn',
		'play music bgm-vision',
		function () { GK.clearCharacters(); },
		'play sound env-rooftop',
		'system 夜风带着白天的余温。屋上的围栏凉凉的，头顶是漫天星斗。',
		'play sound env-insect',
		'show character senior sad with fadeIn',
		'senior 温 你也睡不着啊。',
		'system 学姐靠在围栏边，仰头看天。星光落在她脸上，很安静。',
		'senior 温 你知道吗，每次有学生来找我聊志愿，我都会带他们来这里。先看看星星，再谈分数。',
		{ Choice: {
			Dialog: 'senior 温 因为……填志愿和看星星很像。你想听哪个道理？',
			'Star': { Text: '🌟 星星的道理', Do: 'jump RelaxStarWisdom' },
			'Ask':  { Text: '💬 直接问建议', Do: 'jump RelaxStarAsk' },
		}}
	],
	'RelaxStarWisdom': [
		function () { GK.feedback({ rel: { senior: +10 }, attrs: { insight: +6 } }); },
		function () { GK.voice('senior/stargaze'); },
		'senior 温 你看，天上那么多星星。有的亮，有的暗。但每一颗，都在自己的位置上发着光。',
		'show character senior happy',
		'senior 温 分数就是你现在的亮度。但亮度不代表位置——有些暗星，其实在更重要的位置上。',
		'senior 温 填志愿，不是比谁更亮。是找到属于你的那个位置，然后，发你的光。',
		'system 夜风吹过，虫鸣起伏。你忽然觉得，那些分数的焦虑，轻了一点。',
		// ↓ 抑：学姐突然沉默，提起往事
		'show character senior sad',
		'senior 温 ……我跟你说个事。',
		'senior 温 去年，有个学生。分数比你高得多，全省前五百。所有人都觉得他要上清北。',
		'senior 温 他爸妈都是医生，从小到大，他的志愿只有两个字：医学。',
		'system 学姐的声音轻下去。她没有看你，只是盯着天上某一颗星。',
		'senior 温 他其实想学天文。但我那时候没像今晚这样带他看星星。我只是说"分数这么高，别浪费了"。',
		'senior 温 他听了所有的人，除了他自己。进了医学院，读了半年，退学了。',
		'system 夜风忽然冷了一些。学姐的睫毛上，似乎有什么东西在闪。',
		'senior 温 后来他重新高考，考得没第一次好。但他报了天文。现在在山里的一个观测站，天天看星星。',
		// ↓ 扬：遗憾化作叮嘱，温柔收尾
		'show character senior happy',
		'senior 温 所以今晚我带你来这里。我不想让你——也成为那个"分数很高，但夜里睡不着"的人。',
		'senior 温 {{player.name}}，听所有人的建议，但最后那一下，听你自己的。',
		'system 学姐笑了。星光又落回她脸上，这一次，比刚才暖。',
		'jump RelaxStargazeEnd'
	],
	'RelaxStarAsk': [
		function () { GK.feedback({ rel: { senior: +6 }, attrs: { diligence: +4 } }); },
		'senior 温 直接问啊……好，那我说实话。你现在的分数，够得上中游。中游的好处是——选择多。',
		'senior 温 别急着冲名校。找一个你真正感兴趣的专业的中等院校，比硬挤一个你不喜欢的名校强。',
		'system 学姐的话很实际。星星还在，但你心里多了一条清晰的路。',
		'jump RelaxStargazeEnd'
	],
	'RelaxStargazeEnd': [
		'stop sound',
		function () { GK.markCleared('relax_star'); },
		function () { GK.sfx('reveal'); },
		'system （屋上探索完成。和学姐的关系提升了——她把没对那个学生说出的话，今晚都对你说了。）',
		'jump CampusMap',
	],

	// 🌊 河川敷散步（和阿星）—— 先抑后扬 + 阿星崩溃
	'RelaxRiver': [
		'show scene scene-river with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'play sound env-river',
		'system 河水在夕阳下闪着光。你和阿星沿着堤岸走，谁都没说话。',
		'play sound env-semi',
		'show character buddy normal with fadeIn',
		'buddy 阿星 ……你知道吗，小时候我跟我爸来这钓鱼。那时候觉得，长大后什么都能搞定。',
		// ↓ 抑：阿星突然停下，情绪崩溃
		'system 阿星走着走着，忽然停下了。他没有回头，肩膀在抖。',
		'show character buddy_sports normal',
		'buddy 阿星 ……我撑不住了。',
		'system 你愣住了。认识阿星这么多年，你从没见他这样——他总是那个嘻嘻哈哈、什么事都能扛的人。',
		'buddy 阿星 我爸昨天把我志愿表撕了。当着我妈的面。',
		'buddy 阿星 他说我考这点分，还敢报体育？他说我要是敢不听他的，就别认他这个爸。',
		'buddy 阿星 我妈就坐在那儿，一句话都没说。她低着头，一直在择菜，好像什么都没发生。',
		'system 阿星蹲下来，把脸埋进手臂里。蝉鸣忽然变得很响。',
		'buddy 阿星 我不是怕我爸打我。我是怕……我真的相信了他说的，我这辈子就这样了。',
		'buddy 阿星 我怕我填志愿的那天，手会抖。我怕我最后变成他想要的样子，然后，恨我自己一辈子。',
		// ↓ 道德选择：怎么回应阿星的崩溃
		{ Choice: {
			Dialog: 'system 阿星蹲在堤岸边，肩膀一抖一抖的。蝉鸣很响，河水很慢。你怎么做？',
			'Hug':     { Text: '🫂 蹲下来，拍拍他', Do: 'jump RelaxRiverHug' },
			'Speak':   { Text: '🗣 你不是你爸说的那样', Do: 'jump RelaxRiverSpeak' },
			'Silent':  { Text: '😶 什么都不说，陪着他', Do: 'jump RelaxRiverSilent' },
		}}
	],
	'RelaxRiverHug': [
		function () { GK.feedback({ rel: { buddy: +15 }, attrs: { courage: +6, patience: +5 } }); },
		'system 你没说话，只是蹲下来，把手放在他肩上。',
		'system 阿星的身体僵了一下，然后，像是什么东西断了，他终于哭出了声。',
		'buddy 阿星 ……操。操他妈的志愿。操他妈的分数。',
		'buddy 阿星 ……我不是想哭。我就是……憋太久了。',
		'system 你没有打断他。河水在脚边慢慢流，蝉还在叫。有些眼泪，流出来比憋着强。',
		// ↓ 扬：阿星情绪宣泄后振作
		'show character buddy_sports happy',
		'buddy 阿星 ……靠。哭完了。丢人。',
		'buddy 阿星 但好像……没那么沉了。',
		'buddy 阿星 谢了兄弟。没你在这儿，我可能真就一个人扛到填志愿那天，然后手一抖，把我爸想要的填上去了。',
		'buddy 阿星 不行。我得自己填。大不了挨顿打。总比恨我自己强。',
		'system 夕阳沉下去一半。河水还在流。但阿星站起来了——这一次，背挺得比刚才直。',
		'jump RelaxRiverEnd'
	],
	'RelaxRiverSpeak': [
		function () { GK.feedback({ rel: { buddy: +10 }, attrs: { courage: +8 } }); },
		'system 你蹲到他面前，看着他的眼睛。',
		'system "你不是你爸说的那样。"',
		'system "你投篮的时候眼睛里有光，那是你自己发的光。你爸看不到，不代表它不存在。"',
		'system "志愿表是你填，不是他填。你的四年，不是他的四年。"',
		'buddy 阿星 ……',
		'system 阿星抬起头，眼睛红红的，但里面有什么东西在重新亮起来。',
		'buddy 阿星 ……你说的对。',
		'buddy 阿星 凭什么他说我怎样我就怎样。他填过志愿吗？他过的那辈子，是他想要的吗？',
		'buddy 阿星 不行。我不能走他的老路。我得自己试一次。哪怕错了，也是我自己错的。',
		'show character buddy_sports happy',
		'buddy 阿星 谢了兄弟。你刚才说的那几句，我记住了。',
		'system 夕阳沉下去一半。河水带走了很多，但也留下了什么。',
		'jump RelaxRiverEnd'
	],
	'RelaxRiverSilent': [
		function () { GK.feedback({ rel: { buddy: +12 }, attrs: { patience: +6, patience: +4 } }); },
		'system 你没有说话。你只是在他旁边蹲下来，跟他一起看河水。',
		'system 有时候，陪伴比任何话都管用。',
		'buddy 阿星 ……你不用安慰我。',
		'buddy 阿星 你在这儿，就够了。',
		'system 蝉鸣，河水，风。两个少年蹲在堤岸边，什么都没说，但什么都懂了。',
		'system 过了很久，阿星站起来，抹了一把脸。',
		'show character buddy_sports happy',
		'buddy 阿星 走吧。回去了。',
		'buddy 阿星 我今晚就跟我爸摊牌。不管结果怎样……至少今晚，我不是一个人。',
		'system 夕阳沉下去一半。河水还在流。但你的肩膀上，多了一份重量——那是一个朋友把信任交给你的重量。',
		'jump RelaxRiverEnd'
	],
	'RelaxRiverEnd': [
		'stop sound',
		function () { GK.markCleared('relax_river'); },
		function () { GK.sfx('reveal'); },
		'system （河川敷探索完成。和阿星的关系大幅提升——你见过他最脆弱的样子，也陪他撑过了最难的一关。）',
		'jump CampusMap',
	],

	// ══════ 家人互动（家·查分后解锁）══════ —— 修卡死 bug + 丰富剧情
	// markTalked：记录已聊过的家人（替代脆弱的关系值匹配）
	'HomeEnter': [
		'show scene scene-home with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'system 你回到家。客厅的灯亮着，桌上摆着水果和一堆打印的「热门专业推荐」。',
		'system 家人在等你。他们有不同的想法，也有不同的爱。',
		function () {
			GK.showNpcPicker({
				title: '🏠 选择和家人聊',
				subtitle: '他们有不同的想法，也有不同的爱。已互动过的家人会标记 ✓。',
				npcs: [
					{ icon: '👩', label: '妈妈', talkedKey: 'fam_mom', jumpLabel: 'HomeMom' },
					{ icon: '👨', label: '爸爸', talkedKey: 'fam_dad', jumpLabel: 'HomeDad' },
					{ icon: '👱‍♀️', label: '小姨', talkedKey: 'fam_aunt', jumpLabel: 'HomeAunt' },
				],
				leaveLabel: '🚪 先回学校',
				leaveJump: 'HomeLeave',
			});
		},
		'system （请在弹出的卡片中选择互动对象）',
	],
	// —— 妈妈：焦虑催促 → 深层是怕你将来怪她 → 耐心后她软化 ——
	'HomeMom': [
		function () { const t = GK.get()._talked || {}; t.fam_mom = true; GK.set({ _talked: t }); },
		'show character fam_mom normal with fadeIn',
		function () { GK.voice('fam_mom/intro'); },
		'fam_mom 妈 妈不求，妈只怕你将来怪妈没管你。',
		'fam_mom 妈 这几张是妈帮你打印的，你看看……计算机、金融、师范，都说热门。',
		'system 妈妈把一摞打印纸推到你面前，纸张边角都卷了——她翻了不知道多少遍。',
		'fam_mom 妈 隔壁王阿姨家的孩子，报的计算机，现在年薪三十万。妈不是要你比，妈是怕你吃亏。',
		{ Choice: {
			Dialog: 'fam_mom 妈 ……',
			'Good':  { Text: '❤️ 耐心解释自己的想法', Do: 'jump HomeMomGood' },
			'Bad':   { Text: '😤 不耐烦', Do: 'jump HomeMomBad' },
		}}
	],
		'HomeMomGood': [ function () { GK.showNpcInteract('fam_mom', 'good'); } ],
		'HomeMomBad':  [ function () { GK.showNpcInteract('fam_mom', 'bad'); } ],
	// —— 爸爸：强硬施压 → 加转折：他当年因选不稳的路吃过苦 ——
	'HomeDad': [
		function () { const t = GK.get()._talked || {}; t.fam_dad = true; GK.set({ _talked: t }); },
		'show character fam_dad normal with fadeIn',
		function () { GK.voice('fam_dad/intro'); },
		'fam_dad 爸 我吃过的盐比你走过的路多。听爸的，报个计算机，饿不死。',
		'fam_dad 爸 看看，你这个分，老老实实报个稳的。别整那些没用的。',
		'system 爸爸没有看你，他在看手机上的招生群。但你知道他在听。',
		'fam_dad 爸 你以为爸不想让你报你喜欢的？爸当年也想过。',
		'fam_dad 爸 爸那时候报了个"有前途"的专业，结果呢？毕业就下岗。整整三年，捡过破烂，摆过地摊。',
		'system 爸爸的声音顿了一下。这是你第一次听他说这些。',
		'fam_dad 爸 爸不让你冒险，不是要管你。是爸摔过的跤，不想让你再摔一遍。',
		{ Choice: {
			Dialog: 'fam_dad 爸 ……',
			'Good':  { Text: '📋 用数据理性回应', Do: 'jump HomeDadGood' },
			'Bad':   { Text: '😠 正面硬刚', Do: 'jump HomeDadBad' },
		}}
	],
		'HomeDadGood': [ function () { GK.showNpcInteract('fam_dad', 'good'); } ],
		'HomeDadBad':  [ function () { GK.showNpcInteract('fam_dad', 'bad'); } ],
	// —— 小姨：痛苦十年 → 现在终于敢做自己 → 给你打气 ——
	'HomeAunt': [
		function () { const t = GK.get()._talked || {}; t.fam_aunt = true; GK.set({ _talked: t }); },
		'show character fam_aunt normal with fadeIn',
		function () { GK.voice('fam_aunt/intro'); },
		'fam_aunt 小姨 别像我当年一样，别人说什么就报什么，毕业了才发现全是错的。',
		'fam_aunt 小姨 我跟你说句实话——当年你妈让我报会计，说稳定。我报了。然后我痛苦了十年。',
		'system 小姨端着茶杯，手指在杯沿上慢慢转。她的指甲是新做的，亮亮的——你从没见她这么精心打扮过。',
		'fam_aunt 小姨 但你知道吗？去年我辞职了。',
		'fam_aunt 小姨 我去学了一直想学的花艺。现在开了一家小花店，不大，但每天醒来，我是笑着的。',
		'fam_aunt 小姨 十年我才敢。你比我幸运——你十八岁就能问出"我真正想要什么"这个问题。',
		'system 小姨看着你，眼睛里有光。那是一种你从没在她脸上见过的、自由的光。',
		{ Choice: {
			Dialog: 'fam_aunt 小姨 ……',
			'Good':  { Text: '👂 认真听她的经验', Do: 'jump HomeAuntGood' },
			'Bad':   { Text: '📱 敷衍', Do: 'jump HomeAuntBad' },
		}}
	],
		'HomeAuntGood': [ function () { GK.showNpcInteract('fam_aunt', 'good'); } ],
		'HomeAuntBad':  [ function () { GK.showNpcInteract('fam_aunt', 'bad'); } ],
	'HomeAfter': [
		function () {
			// 首句函数：计算剩余家人 + markCleared（避免 hide character 首句报错卡住）
			try { monogatari.run('hide character fam_mom with fadeOut'); } catch (e) {}
			try { monogatari.run('hide character fam_dad with fadeOut'); } catch (e) {}
			try { monogatari.run('hide character fam_aunt with fadeOut'); } catch (e) {}
			const g = GK.get();
			const talked = g._talked || {};
			const all = ['fam_mom', 'fam_dad', 'fam_aunt'];
			const remaining = all.filter(k => !talked[k]);
			if (remaining.length === 0) {
				GK.markCleared('home');
				return 'system 你和每位家人都聊过了。客厅的灯还亮着，但空气轻了一些。\n（家探索完成，关系值影响结局）';
			}
			return 'system 还可以再和家人聊聊。';
		},
		{ Choice: {
			Dialog: 'system 家',
			'Back':  { Text: '🏠 继续聊', Do: 'jump HomeEnter' },
			'Leave': { Text: '🚪 回学校', Do: 'jump HomeLeave' },
		}}
	],
	'HomeLeave': [
		'hide character fam_mom with fadeOut',
		'hide character fam_dad with fadeOut',
		'hide character fam_aunt with fadeOut',
		'jump CampusMap',
	],

	// ══════ 老师互动（办公室·查分后解锁）══════ —— 最丰富版：多分支 + 跌宕起伏 + 道德选择
	'OfficeEnter': [
		'show scene scene-office with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'system 教师办公室。走廊尽头，有人在等你。',
		'system 注意：不是所有老师的建议都为你好。学会辨别真心和利益。',
		function () {
			GK.showNpcPicker({
				title: '📋 选择和老师聊',
				subtitle: '不是所有老师的建议都为你好。已互动过的老师会标记 ✓。',
				npcs: [
					{ icon: '🍎', label: '李老师（班主任）', talkedKey: 'tch_lee', jumpLabel: 'OfficeLee' },
					{ icon: '💰', label: '王主任（招生办）', talkedKey: 'tch_wang', jumpLabel: 'OfficeWang' },
				],
				leaveLabel: '🚪 离开',
				leaveJump: 'OfficeLeave',
			});
		},
		'system （请在弹出的卡片中选择互动对象）',
	],
	// ══════ 李老师线：先扬后抑 + 素描本秘密 + 道德选择（鼓励他追梦） ══════
	// 精简版：保留核心剧情点（美院往事+素描本+Choice），减少对话句数让 Choice 更快到达
	'OfficeLee': [
		function () { const t = GK.get()._talked || {}; t.tch_lee = true; GK.set({ _talked: t }); },
		'show character tch_lee normal with fadeIn',
		function () { GK.voice('tch_lee/intro'); },
		'tch_lee 李老师 我看了你的分数。不差。但老师更想问你——你想好了吗？',
		'system 李老师摘下眼镜，擦了擦。镜片上有道划痕，很旧了——他戴了很多年。',
		'tch_lee 李老师 跟你说句心里话。我当年高考，分数够上美院。但所有人都说"画画没出路"，我听了。现在做了二十年班主任。',
		'system 他拉开抽屉，从最底下摸出一个本子。封皮磨得发白——里面是一幅幅素描，每一幅都标着日期，从二十年前到上个月。',
		'tch_lee 李老师 我一直没停过画。每天半小时，雷打不动。但从没拿出去过——我怕学生笑我"不务正业"。',
		'system 说这话时，李老师的眼睛突然亮了——那是一个画了二十年的人，谈起画时的光。',
		{ Choice: {
			Dialog: 'tch_lee 李老师 上个月，有个老同学说想帮我报名一个画展。你说……我该去吗？',
			'Encourage': { Text: '🎨 去！画了二十年为什么不去', Do: 'jump OfficeLeeEncourage' },
			'Cautious':  { Text: '🤔 先想想会不会影响工作', Do: 'jump OfficeLeeCautious' },
			'Listen':    { Text: '👂 您自己心里其实有答案', Do: 'jump OfficeLeeListen' },
		}}
	],
	'OfficeLeeEncourage': [
		function () { GK.feedback({ rel: { tch_lee: +15 }, attrs: { courage: +6, insight: +4 } }); },
		'system 你没有犹豫："去。画了二十年，凭什么不能让人看看？"',
		'tch_lee 李老师 ……',
		'system 李老师愣住了。然后他笑了，是那种很久没笑过、突然咧开嘴的笑。',
		'tch_lee 李老师 你知道吗，我等这句话，等了二十年。',
		'tch_lee 李老师 我带过几百个学生。没有一个，像你今天这样，对我说"去"。',
		'system 他把素描本合上，紧紧攥在手里，像攥着一个迟到二十年的决定。',
		'tch_lee 李老师 好。我去。然后回来告诉你结果——不管成不成。',
		'system 你看见一个五十岁的老师，眼睛里有十八岁的光。有些话，说出口就改变了一个人。也许不只是你。',
		'jump OfficeAfter'
	],
	'OfficeLeeCautious': [
		function () { GK.feedback({ rel: { tch_lee: +6 }, attrs: { diligence: +5, patience: +3 } }); },
		'system 你想了想："老师，画展是什么时候？如果占用上课时间，可能会有麻烦。"',
		'tch_lee 李老师 ……也是。周末的展，但布展要请假。',
		'system 李老师沉默了。他重新把素描本放回抽屉。',
		'tch_lee 李老师 你说得对。我不能因为自己的事，影响学生。',
		'system 但你注意到，他放本子时，手在抽屉边缘停了很久。',
		'tch_lee 李老师 ……不过，我会再想想。你提醒了我，这事得有个计划，不能冲动。',
		'system 你的话很实际。但你也看到，那个抽屉，又被关上了。',
		'jump OfficeAfter'
	],
	'OfficeLeeListen': [
		function () { GK.feedback({ rel: { tch_lee: +12 }, attrs: { insight: +8, patience: +4 } }); },
		'system 你看着他："老师，您问我该不该去。但您画了二十年没停过——您心里，其实早有答案。"',
		'system 李老师的手停在素描本上，半天没动。',
		'tch_lee 李老师 ……',
		'tch_lee 李老师 你这孩子。',
		'system 他抬起头，眼眶有点红。',
		'tch_lee 李老师 是。我心里有答案。我只是不敢承认，我怕承认了，就得真的去做。',
		'tch_lee 李老师 你今天比我还勇敢。你敢问自己"我真正想要什么"——我五十岁了，才刚学会问。',
		'system 他把素描本放进包里，不是抽屉。',
		'tch_lee 李老师 好。我带回家。今晚就填报名表。',
		'tch_lee 李老师 谢谢你。你帮老师做了一件，老师犹豫了二十年的事。',
		'jump OfficeAfter'
	],
		'OfficeLeeGood': [ function () { GK.showNpcInteract('tch_lee', 'good'); } ],
		'OfficeLeeBad':  [ function () { GK.showNpcInteract('tch_lee', 'bad'); } ],
	// ══════ 王主任线：先抑(利益诱导) → 反转(孩子被骗往事) → 道德选择 ══════
	'OfficeWang': [
		function () { const t = GK.get()._talked || {}; t.tch_wang = true; GK.set({ _talked: t }); },
		'show character tch_wang normal with fadeIn',
		function () { GK.voice('tch_wang/intro'); },
		'tch_wang 王主任 同学！你这个分数，正好我们有个合作院校，还有内部名额。错过可就没了！',
		'system 他桌上堆着一摞招生简章，电脑屏幕上是一个表格——"XX学院 2024 招生指标完成度：67%"。',
		'tch_wang 王主任 跟他们招办的老总是铁哥们，你报了我保你录！',
		'system 他压低声音凑近你。但他杯子里的茶已经凉了——他在这里等了很久。',
		{ Choice: {
			Dialog: 'system 等的不是你，是任何"分数够、又没主见"的学生。你怎么回应？',
			'Question': { Text: '🔍 问清楚：这个学校是几本？就业率多少？', Do: 'jump OfficeWangQuestion' },
			'Refuse':   { Text: '🙅 不用了我自己查', Do: 'jump OfficeWangRefuse' },
			'Accept':   { Text: '😍 太好了！那就报这个！', Do: 'jump OfficeWangAccept' },
		}}
	],
	'OfficeWangQuestion': [
		function () { GK.feedback({ rel: { tch_wang: +3 }, attrs: { insight: +8 } }); },
		'system 你没有急着答应，也没有直接拒绝。你问了一个问题。',
		'system "王主任，这个学校是几本？去年的就业率是多少？毕业生都去了哪？"',
		'system 王主任的笑容僵了一瞬。很快又恢复了，但那一瞬，你看得清清楚楚。',
		'tch_wang 王主任 这个嘛……是民办本科，但就业率很不错的，很不错的……具体数字我得查查。',
		'system 他开始翻桌上的资料，动作有点乱。一份文件滑落——你瞥见了标题：',
		'system 《关于XX学院近年毕业生就业状况的内部调查》。',
		'system 你没看清全部内容，但看到了几个加粗的字："实际就业率……低于……宣传数据"。',
		// ↓ 反转铺垫
		'system 王主任手忙脚乱地把文件塞回去。他的脸有点白。',
		'jump OfficeWangTruth'
	],
	'OfficeWangRefuse': [
		function () { GK.feedback({ rel: { tch_wang: -2 }, attrs: { courage: +6 } }); },
		'system "不用了，王主任。我想自己回去查查再决定。"',
		'system 王主任愣了一下，脸上的笑淡了。',
		'tch_wang 王主任 ……行。你查吧。不过这个名额，我最多给你留三天。',
		'system 你转身要走。忽然，王主任的声音从背后传来，比刚才轻了很多。',
		'jump OfficeWangTruth'
	],
	'OfficeWangAccept': [
		function () { GK.feedback({ rel: { tch_wang: +8 }, attrs: { courage: -5, insight: -6 } }); },
		'system "太好了！那就报这个！"',
		'system 王主任眼睛一亮，立刻递过来一张表："来来来，先签个意向，老师帮你走流程！"',
		'system 你接过表，正要签字——笔尖碰到纸的瞬间，王主任突然按住了你的手。',
		'jump OfficeWangTruth'
	],
	// ↓ 真相反转：王主任的孩子也被骗过
	'OfficeWangTruth': [
		'system 王主任的力气很大。他按住你的手，表情突然变了——不是热情，是一种你读不懂的复杂。',
		'tch_wang 王主任 ……别签。',
		'system 你愣住了。',
		'tch_wang 王主任 你别签。老师刚才说的那些，什么内部名额、铁哥们——',
		'system 他颓然坐回椅子里。那张总是热情的脸，突然垮了下来。',
		'tch_wang 王主任 我儿子去年高考。分数跟你差不多。',
		'tch_wang 王主任 也有人跟我推荐一个"合作院校"，说有内部名额，说包录。我信了。让他报了。',
		'system 他从抽屉里拿出一张照片——一个男孩，穿着大学的校服，在笑。',
		'tch_wang 王主任 进去才发现，那个学校……就是个野鸡。学费贵得离谱，专业课全是水课，毕业证外面根本不认。',
		'tch_wang 王主任 我儿子现在大三，每天打游戏。他说，反正这个文凭也没用，不如混到毕业。',
		'system 王主任的声音抖了。他把照片翻过去——背面写着一行字："爸，我不怪你。"',
		'tch_wang 王主任 他不怪我。但我怪我自己。',
		// ↓ 道德选择：知道真相后怎么对他
		{ Choice: {
			Dialog: 'system 王主任把照片攥在手里。他是骗过你，但他也被骗过。你怎么做？',
			'Forgive':  { Text: '🤝 谢谢您告诉我这些', Do: 'jump OfficeWangForgive' },
			'Confront': { Text: '😠 那您为什么还要骗别人？', Do: 'jump OfficeWangConfront' },
			'Help':     { Text: '💡 帮您把那个学校的真相反查出来', Do: 'jump OfficeWangHelp' },
		}}
	],
	'OfficeWangForgive': [
		function () { GK.feedback({ rel: { tch_wang: +12 }, attrs: { patience: +6, insight: +5 } }); },
		'system 你没有指责他。你只是说："谢谢您告诉我这些。"',
		'tch_wang 王主任 ……你不骂我？',
		'system 王主任抬起头，眼眶红了。一个四十多岁的男人，在学生面前红了眼眶。',
		'tch_wang 王主任 我知道我在做什么。我完成指标，拿那点提成。我骗自己说"这是双赢"。其实我是在用别人孩子，弥补我自己的错。',
		'tch_wang 王主任 但今天看到你……我想起我儿子刚进那个学校时的样子。也是这么信任我。',
		'system 他把那张意向表撕了。',
		'tch_wang 王主任 你走吧。这个名额，我谁也不给了。我去跟校长说实话，大不了挨处分。',
		'system 你转身离开。走到门口，王主任又叫住你。',
		'tch_wang 王主任 ……谢谢你。你让我想起，我本来是个老师，不是个销售。',
		'jump OfficeAfter'
	],
	'OfficeWangConfront': [
		function () { GK.feedback({ rel: { tch_wang: +4 }, attrs: { courage: +8, insight: +4 } }); },
		'system 你直直看着他："您儿子被骗过，您为什么还要骗别人？"',
		'system 王主任沉默了很久。',
		'tch_wang 王主任 ……因为我得完成指标。完不成，扣绩效，调岗。我还有房贷。',
		'tch_wang 王主任 我知道这不对。但每个月工资条下来的时候，我就假装忘了。',
		'system 你的话像一把刀，但你也看到，他自己早就被这把刀捅过，只是假装不疼。',
		'tch_wang 王主任 你骂得对。但骂完了，明天我还得坐在这里，等下一个学生。',
		'system 你没有再说话。有些恶意，不是天生的，是被生活一点一点逼出来的。你能做的，只是不让自己成为下一个帮凶。',
		'jump OfficeAfter'
	],
	'OfficeWangHelp': [
		function () { GK.feedback({ rel: { tch_wang: +15 }, attrs: { insight: +8, courage: +5, patience: +4 } }); },
		'system 你想了一会儿，说："王主任，您儿子那个学校——如果您愿意，我帮您把它的真实就业数据查出来。"',
		'system "有了证据，您可以举报，可以帮其他被骗的学生，也可以……让您儿子看清现实。"',
		'system 王主任瞪大了眼睛。',
		'tch_wang 王主任 你……你愿意帮我？',
		'system "您今天拦住了我没让我签字。这就够了。"',
		'system 王主任站起来，手有些抖。他撕掉了那张意向表，又把桌上的招生简章整理成一摞。',
		'tch_wang 王主任 好。这个学校的名单我给你。这些年所有像我一样的人，我都知道是谁。',
		'tch_wang 王主任 我去跟校长坦白。你帮我，我帮所有被这些学校坑过的学生。',
		'system 你走出办公室时，王主任在身后说了一句话。声音不大，但你听得很清楚。',
		'tch_wang 王主任 ……谢谢你，孩子。你让我想起，我儿子小时候，也是这样的。',
		'jump OfficeAfter'
	],
		'OfficeWangGood': [ function () { GK.showNpcInteract('tch_wang', 'good'); } ],
		'OfficeWangBad':  [ function () { GK.showNpcInteract('tch_wang', 'bad'); } ],
	'OfficeAfter': [
		function () {
			try { monogatari.run('hide character tch_lee with fadeOut'); } catch (e) {}
			try { monogatari.run('hide character tch_wang with fadeOut'); } catch (e) {}
			const g = GK.get();
			const talked = g._talked || {};
			const remaining = ['tch_lee', 'tch_wang'].filter(k => !talked[k]);
			if (remaining.length === 0) {
				GK.markCleared('office');
				return 'system 你和每位老师都聊过了。\n（办公室探索完成——李老师找回了画笔，王主任撕掉了那张表。有些改变，就发生在一个下午。）';
			}
			return 'system 还可以再和老师聊聊。';
		},
		{ Choice: {
			Dialog: 'system 办公室',
			'Back':  { Text: '📋 继续聊', Do: 'jump OfficeEnter' },
			'Leave': { Text: '🚪 离开', Do: 'jump OfficeLeave' },
		}}
	],
	'OfficeLeave': [
		'hide character tch_lee with fadeOut',
		'hide character tch_wang with fadeOut',
		'jump CampusMap',
	],
});
