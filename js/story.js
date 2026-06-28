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
		'jump InterestPickStart',
	],

	// ══════ 各任务完成后的收尾标签（markCleared + 碎片闪回 + 回地图）══════
	// 每个 ScoreReact/MbtiResult/VisionPick 收尾 / InterestDone / MentorReveal 出战后
	// 应 jump 到这里，而不是直接跳下一关

	'ScoreTaskDone': [
		function () { GK.markCleared('score'); },
		function () { GK.showShardFlash('score'); },
		// showShardFlash 内部关闭后会 jump CampusMap，这里兜底
		'jump CampusMap',
	],
	'MbtiTaskDone': [
		function () { GK.markCleared('mbti'); },
		function () { GK.showShardFlash('mbti'); },
		'jump CampusMap',
	],
	'VisionTaskDone': [
		function () { GK.markCleared('vision'); },
		function () { GK.showShardFlash('vision'); },
		'jump CampusMap',
	],
	'InterestTaskDone': [
		function () { GK.markCleared('interest'); },
		function () { GK.showShardFlash('interest'); },
		'jump CampusMap',
	],
	'MentorTaskDone': [
		function () { GK.markCleared('mentor'); },
		function () { GK.showShardFlash('mentor'); },
		'jump CampusMap',
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
	'ScoreBossReal': [
		function () { if (GK.saveWarn('score')) GK.showSaveWarn('查分后剧情将根据分数分支，建议先存档。'); },
		'system 解谜通过。现在，面对你的真实分数。',
		'jump ScoreBoss',
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
		function () { if (GK.saveWarn('truth')) GK.showSaveWarn('即将揭晓真相并进入结局（按关系值分支），强烈建议先存档！'); },
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
		{ Choice: {
			Dialog: 'system 选择一位同学互动：',
			'Lin':    { Text: '📐 林（高分学霸）', Do: 'jump NpcTalkLin' },
			'Xyu':    { Text: '🌧 小雨（同分焦虑）', Do: 'jump NpcTalkXyu' },
			'Dazhi':  { Text: '🍳 大志（低分丧气）', Do: 'jump NpcTalkDazhi' },
			'Leave':  { Text: '🚪 先走了', Do: 'jump NpcCorridorLeave' },
		}}
	],
	// 林（高分）互动
	'NpcTalkLin': [
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
	'NpcLinGood':  [ function () { GK.showNpcInteract('classmate_lin', 'good'); }, 'jump NpcCorridorAfter' ],
	'NpcLinBad':   [ function () { GK.showNpcInteract('classmate_lin', 'bad'); }, 'jump NpcCorridorAfter' ],
	// 小雨（同分）互动
	'NpcTalkXyu': [
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
	'NpcXyuGood':  [ function () { GK.showNpcInteract('classmate_xyu', 'good'); }, 'jump NpcCorridorAfter' ],
	'NpcXyuBad':   [ function () { GK.showNpcInteract('classmate_xyu', 'bad'); }, 'jump NpcCorridorAfter' ],
	// 大志（低分）互动
	'NpcTalkDazhi': [
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
	'NpcDazhiGood':[ function () { GK.showNpcInteract('classmate_dazhi', 'good'); }, 'jump NpcCorridorAfter' ],
	'NpcDazhiBad': [ function () { GK.showNpcInteract('classmate_dazhi', 'bad'); }, 'jump NpcCorridorAfter' ],
	// 互动后回到走廊选择（可继续和其他同学聊，或离开）
	'NpcCorridorAfter': [
		'hide character classmate_lin with fadeOut',
		'hide character classmate_xyu with fadeOut',
		'hide character classmate_dazhi with fadeOut',
		function () {
			const g = GK.get();
			const talked = ['classmate_lin','classmate_xyu','classmate_dazhi'].filter(k => (g.relations?.[k]||0) !== 30);
			const remaining = ['classmate_lin','classmate_xyu','classmate_dazhi'].filter(k => (g.relations?.[k]||0) === 30);
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

	// 🏀 打篮球（体育馆，和阿星）
	'RelaxGym': [
		'show scene scene-gym with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'play sound env-gym',     // 体育馆哨声
		'system 傍晚的体育馆，光线从高窗斜照进来。球鞋摩擦地板的声音回荡着。',
		'play sound env-crowd',   // 远处人群声
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
		'buddy 阿星 说真的，刚才那一下，你眼睛里有光。好久没见你这么有干劲了。',
		'system 打完一局，你俩瘫在场边，汗流浃背。窗外的晚霞把整个体育馆染成橙色。',
		'show character buddy_sports happy',
		'buddy 阿星 看，不管考多少分，能投进一个球，今天就没白过。志愿也一样——投出去，才知道进不进。',
		'jump RelaxGymEnd'
	],
	'RelaxGymTalk': [
		function () { GK.feedback({ rel: { buddy: +5 }, attrs: { patience: +3 } }); },
		'play sound click',
		'system 你俩坐在场边，喝着汽水。球场空了，只有风穿过窗户的声音。',
		'play sound env-leaves',
		'buddy 阿星 其实我也慌。不是怕考不好，是怕……选错了，以后后悔。',
		'buddy 阿星 但刚才打球的时候我突然想通了——后悔又怎样？至少是我自己选的。比让爸妈替我选，然后怪他们一辈子强。',
		'system 阿星的话糙，但你听进去了。有些道理，非得出了汗才想得通。',
		'jump RelaxGymEnd'
	],
	'RelaxGymEnd': [
		function () { GK.sfx('reveal'); },
		'system （和阿星的关系提升了。运动让人清醒，也让人坦诚。）',
		'jump CampusMap',
	],

	// 🌌 看星空（屋上，和学姐·温）
	'RelaxStargaze': [
		'show scene scene-stargaze with fadeIn',
		'play music bgm-vision',
		function () { GK.clearCharacters(); },
		'play sound env-rooftop',  // 屋上风声
		'system 夜风带着白天的余温。屋上的围栏凉凉的，头顶是漫天星斗。',
		'play sound env-insect',   // 夜间虫鸣
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
		function () { GK.sfx('reveal'); },
		'system （和学姐的关系提升了。星空让人安静，也让人看清方向。）',
		'jump CampusMap',
	],

	// 🌊 河川敷散步（和阿星）
	'RelaxRiver': [
		'show scene scene-river with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'play sound env-river',    // 河水声
		'system 河水在夕阳下闪着光。你和阿星沿着堤岸走，谁都没说话。',
		'play sound env-semi',     // 蝉鸣
		'show character buddy normal with fadeIn',
		'buddy 阿星 ……你知道吗，小时候我跟我爸来这钓鱼。那时候觉得，长大后什么都能搞定。',
		'buddy 阿星 现在长大了，发现搞不定的更多。比如……填志愿。',
		{ Choice: {
			Dialog: 'buddy 阿星 你呢？你害怕吗？',
			'Honest': { Text: '😔 老实说，怕', Do: 'jump RelaxRiverHonest' },
			'Brave':  { Text: '💪 还行，有方向了', Do: 'jump RelaxRiverBrave' },
		}}
	],
	'RelaxRiverHonest': [
		function () { GK.feedback({ rel: { buddy: +10 }, attrs: { courage: +3 } }); },
		'show character buddy_sports happy',
		'buddy 阿星 哈！我就知道。其实我也怕。但说出来之后，好像没那么怕了。',
		'buddy 阿星 两个人一起怕，比一个人怕强。咱俩互相盯着，谁填错了另一个骂他。',
		'system 夕阳沉下去一半。河水还在流。你笑了——有些恐惧，说出来就轻了一半。',
		'jump RelaxRiverEnd'
	],
	'RelaxRiverBrave': [
		function () { GK.feedback({ rel: { buddy: +6 }, attrs: { courage: +5 } }); },
		'show character buddy_sports happy',
		'buddy 阿星 ……你真的想清楚了？行，那我得加把劲了。不能就我一个人慌。',
		'buddy 阿星 说真的，你这种状态挺好的。有方向的人，走路都不一样。',
		'system 阿星的话让你更确定了自己的选择。河水带走了一些犹豫。',
		'jump RelaxRiverEnd'
	],
	'RelaxRiverEnd': [
		function () { GK.sfx('reveal'); },
		'system （和阿星的关系提升了。散步让人放松，也让人看清自己的内心。）',
		'jump CampusMap',
	],

	// ══════ 家人互动（家·查分后解锁）══════
	'HomeEnter': [
		'show scene scene-home with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'system 你回到家。客厅的灯亮着，桌上摆着水果和一堆打印的「热门专业推荐」。',
		'system 家人在等你。他们有不同的想法，也有不同的爱。',
		{ Choice: {
			Dialog: 'system 选择和家人聊：',
			'Mom':   { Text: '👩 妈妈', Do: 'jump HomeMom' },
			'Dad':   { Text: '👨 爸爸', Do: 'jump HomeDad' },
			'Aunt':  { Text: '👱‍♀️ 小姨', Do: 'jump HomeAunt' },
			'Leave': { Text: '🚪 先回学校', Do: 'jump HomeLeave' },
		}}
	],
	'HomeMom': [
		'show character fam_mom normal with fadeIn',
		function () { GK.voice('fam_mom/intro'); },
		'fam_mom 妈 妈不求，妈只怕你将来怪妈没管你。',
		'fam_mom 妈 这几张是妈帮你打印的，你看看……计算机、金融、师范，都说热门。',
		{ Choice: {
			Dialog: 'fam_mom 妈 ……',
			'Good':  { Text: '❤️ 耐心解释自己的想法', Do: 'jump HomeMomGood' },
			'Bad':   { Text: '😤 不耐烦', Do: 'jump HomeMomBad' },
		}}
	],
	'HomeMomGood': [ function () { GK.showNpcInteract('fam_mom', 'good'); }, 'jump HomeAfter' ],
	'HomeMomBad':  [ function () { GK.showNpcInteract('fam_mom', 'bad'); }, 'jump HomeAfter' ],
	'HomeDad': [
		'show character fam_dad normal with fadeIn',
		function () { GK.voice('fam_dad/intro'); },
		'fam_dad 爸 我吃过的盐比你走过的路多。听爸的，报个计算机，饿不死。',
		'fam_dad 爸 看看，你这个分，老老实实报个稳的。别整那些没用的。',
		{ Choice: {
			Dialog: 'fam_dad 爸 ……',
			'Good':  { Text: '📋 用数据理性回应', Do: 'jump HomeDadGood' },
			'Bad':   { Text: '😠 正面硬刚', Do: 'jump HomeDadBad' },
		}}
	],
	'HomeDadGood': [ function () { GK.showNpcInteract('fam_dad', 'good'); }, 'jump HomeAfter' ],
	'HomeDadBad':  [ function () { GK.showNpcInteract('fam_dad', 'bad'); }, 'jump HomeAfter' ],
	'HomeAunt': [
		'show character fam_aunt normal with fadeIn',
		function () { GK.voice('fam_aunt/intro'); },
		'fam_aunt 小姨 别像我当年一样，别人说什么就报什么，毕业了才发现全是错的。',
		'fam_aunt 小姨 我跟你说句实话——当年你妈让我报会计，说稳定。我报了。然后我痛苦了十年。',
		{ Choice: {
			Dialog: 'fam_aunt 小姨 ……',
			'Good':  { Text: '👂 认真听她的经验', Do: 'jump HomeAuntGood' },
			'Bad':   { Text: '📱 敷衍', Do: 'jump HomeAuntBad' },
		}}
	],
	'HomeAuntGood': [ function () { GK.showNpcInteract('fam_aunt', 'good'); }, 'jump HomeAfter' ],
	'HomeAuntBad':  [ function () { GK.showNpcInteract('fam_aunt', 'bad'); }, 'jump HomeAfter' ],
	'HomeAfter': [
		'hide character fam_mom with fadeOut',
		'hide character fam_dad with fadeOut',
		'hide character fam_aunt with fadeOut',
		function () {
			const g = GK.get();
			const remaining = ['fam_mom','fam_dad','fam_aunt'].filter(k => (g.relations?.[k]||0) === (k==='fam_mom'?40:k==='fam_dad'?35:30));
			if (remaining.length === 0) {
				GK.markCleared('home');
				return 'system 你和每位家人都聊过了。\n（家探索完成）';
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

	// ══════ 老师互动（办公室·查分后解锁）══════
	'OfficeEnter': [
		'show scene scene-office with fadeIn',
		'play music bgm-chat',
		function () { GK.clearCharacters(); },
		'system 教师办公室。走廊尽头，有人在等你。',
		'system 注意：不是所有老师的建议都为你好。学会辨别真心和利益。',
		{ Choice: {
			Dialog: 'system 选择和老师聊：',
			'Lee':   { Text: '🍎 李老师（班主任）', Do: 'jump OfficeLee' },
			'Wang':  { Text: '💰 王主任（招生办）', Do: 'jump OfficeWang' },
			'Leave': { Text: '🚪 离开', Do: 'jump OfficeLeave' },
		}}
	],
	'OfficeLee': [
		'show character tch_lee normal with fadeIn',
		function () { GK.voice('tch_lee/intro'); },
		'tch_lee 李老师 我看了你的分数。不差。但老师更想问你——你想好了吗？',
		'tch_lee 李老师 老师的职责不是告诉你报什么，是帮你想清楚你想要什么。',
		{ Choice: {
			Dialog: 'tch_lee 李老师 ……',
			'Good':  { Text: '💬 坦诚说出自己的纠结', Do: 'jump OfficeLeeGood' },
			'Bad':   { Text: '🤷 您说我报什么好', Do: 'jump OfficeLeeBad' },
		}}
	],
	'OfficeLeeGood': [ function () { GK.showNpcInteract('tch_lee', 'good'); }, 'jump OfficeAfter' ],
	'OfficeLeeBad':  [ function () { GK.showNpcInteract('tch_lee', 'bad'); }, 'jump OfficeAfter' ],
	'OfficeWang': [
		'show character tch_wang normal with fadeIn',
		function () { GK.voice('tch_wang/intro'); },
		'tch_wang 王主任 同学！你这个分数，正好我们有个合作院校，还有内部名额。机会难得啊！',
		'tch_wang 王主任 这个学校跟我们有合作关系，你有内部名额优势。错过可就没了。',
		{ Choice: {
			Dialog: 'tch_wang 王主任 ……',
			'Good':  { Text: '🔍 表示要回去查查再说', Do: 'jump OfficeWangGood' },
			'Bad':   { Text: '😍 太好了！那就报这个！', Do: 'jump OfficeWangBad' },
		}}
	],
	'OfficeWangGood': [ function () { GK.showNpcInteract('tch_wang', 'good'); }, 'jump OfficeAfter' ],
	'OfficeWangBad':  [ function () { GK.showNpcInteract('tch_wang', 'bad'); }, 'jump OfficeAfter' ],
	'OfficeAfter': [
		'hide character tch_lee with fadeOut',
		'hide character tch_wang with fadeOut',
		function () {
			const g = GK.get();
			const remaining = ['tch_lee','tch_wang'].filter(k => (g.relations?.[k]||0) === (k==='tch_lee'?30:20));
			if (remaining.length === 0) {
				GK.markCleared('office');
				return 'system 你和每位老师都聊过了。\n（办公室探索完成）';
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
