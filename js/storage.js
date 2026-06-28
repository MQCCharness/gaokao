/* global monogatari */

// 持久化存储变量（含高考志愿 Agent 的游戏状态树 gk）
monogatari.storage ({
	player: {
		name: ''
	},
	// gk 子树：被 lib/bridge.js 的 GK.* 函数读写
	gk: {
		name: '',
		province: '',
		group: '',
		stage: '',
		score: 0,
		total: 750,
		tier: '',
		rank: 0,
		subjects: [],
		mood: '',
		moodEmoji: '',
		moodColor: '',
		moodLine: '',
		autoMode: false,
		mbtiAnswers: {},
		mbtiIdx: 0,
		mbtiType: '',
		interests: [],
		visionId: '',
		vision: '',
		mentor: '',
		mentorName: '',
		mentorRarity: '',
		wishlist: [],
		// 地图任务系统（失忆穿越主线）
		cleared: {},      // {score:false, mbti:false, ...} 各任务节点完成状态
		shards: [],       // 记忆碎片数组，每个任务完成得一块

		// 角色关系值（正/负反馈引导；越高越信任，支线/主线门控）
		// 主角团：温(学姐)/凛(学霸)/阿星(死党)/沈(导师)；每位 0-100，初始 50（中立）
		// NPC同学：林/小雨/大志；初始 30（同学关系没那么熟，需互动提升）
		relations: { senior: 50, rival: 50, buddy: 50, guide: 50, classmate_lin: 30, classmate_xyu: 30, classmate_dazhi: 30 },

		// NPC 同学分数（查分后生成，用于对比）
		npcScores: {},

		// 玩家属性（由对话选择增减；门控某些节点）
		// - patience 耐心：纠正毛躁/不深入思考；查分/MBTI 等长任务需要
		// - insight  洞察：解谜/深思得分；理想/志愿揭晓需要
		// - courage  勇气：敢面对真相；查分/结局需要
		// - diligence 务实：认真收集信息；志愿表质量需要
		attrs: { patience: 10, insight: 10, courage: 10, diligence: 10 },

		// 解谜系统：每关一个小谜题，记录是否解出
		puzzles: {},      // {score:false, mbti:false, vision:false, interest:false, mentor:false}

		// 提醒标记：关键节点已提醒过存档（避免反复弹窗）
		saveWarned: {},   // {scoreGate:true, ...}
	},
});
