// 生成 16 型人格小人图标 SVG（零版权，原创设计）
// 4 大类别 × 4 色：分析师(紫) / 外交官(绿) / 哨兵(蓝) / 探险者(黄)
// 每型一个小人，用颜色+头部装饰区分
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'assets/images/mbti';
fs.mkdirSync(OUT, {recursive:true});

// 16 型 → (类别色, 昵称, emoji装饰)
const TYPES = {
	// 分析师（紫色系）— 理性、策略
	'INTJ': { group:'analyst', color:'#7B68EE', nick:'建筑师', emoji:'♟', trait:'皇冠(战略家)' },
	'INTP': { group:'analyst', color:'#6A5ACD', nick:'逻辑学家', emoji:'🔬', trait:'眼镜(思考者)' },
	'ENTJ': { group:'analyst', color:'#836FFF', nick:'指挥官', emoji:'📢', trait:'徽章(领导者)' },
	'ENTP': { group:'analyst', color:'#9370DB', nick:'辩论家', emoji:'💭', trait:'灯泡(创意者)' },
	// 外交官（绿色系）— 情感、理想
	'INFJ': { group:'diplomat', color:'#2E8B57', nick:'提倡者', emoji:'🌟', trait:'星光(理想者)' },
	'INFP': { group:'diplomat', color:'#3CB371', nick:'调停者', emoji:'🌸', trait:'花瓣(梦想家)' },
	'ENFJ': { group:'diplomat', color:'#228B22', nick:'主人公', emoji:'🎭', trait:'心形(感染力)' },
	'ENFP': { group:'diplomat', color:'#66CDAA', nick:'竞选者', emoji:'🎈', trait:'气球(热情)' },
	// 哨兵（蓝色系）— 务实、秩序
	'ISTJ': { group:'sentinel', color:'#4682B4', nick:'物流师', emoji:'📋', trait:'盾牌(守护者)' },
	'ISFJ': { group:'sentinel', color:'#5F9EA0', nick:'守卫者', emoji:'🛡', trait:'盾牌(守护者)' },
	'ESTJ': { group:'sentinel', color:'#4169E1', nick:'总经理', emoji:'⚖', trait:'天平(管理者)' },
	'ESFJ': { group:'sentinel', color:'#6495ED', nick:'执政官', emoji:'🎁', trait:'礼盒(关怀者)' },
	// 探险者（黄色系）— 感知、自由
	'ISTP': { group:'explorer', color:'#DAA520', nick:'鉴赏家', emoji:'🔧', trait:'扳手(手艺人)' },
	'ISFP': { group:'explorer', color:'#B8860B', nick:'探险家', emoji:'🎨', trait:'画笔(艺术家)' },
	'ESTP': { group:'explorer', color:'#CD853F', nick:'企业家', emoji:'⚡', trait:'闪电(行动派)' },
	'ESFP': { group:'explorer', color:'#D4A017', nick:'表演者', emoji:'🎤', trait:'话筒(表演者)' },
};

function genSVG(type) {
	const t = TYPES[type];
	if (!t) return '';
	const c = t.color;
	// 生成一个小人 SVG（圆头 + 身体 + 装饰）
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <!-- 背景圆（类别色渐变）-->
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0.05"/>
    </radialGradient>
  </defs>
  <rect width="200" height="240" fill="url(#bg)" rx="16"/>

  <!-- 身体（简化 T 恤）-->
  <path d="M 60 160 Q 60 130 100 130 Q 140 130 140 160 L 140 220 L 60 220 Z" fill="${c}" opacity="0.8" rx="8"/>
  <!-- 脖子 -->
  <rect x="88" y="108" width="24" height="28" fill="#F5DEB3" rx="4"/>

  <!-- 头部（肤色圆）-->
  <circle cx="100" cy="80" r="42" fill="#F5DEB3"/>
  <!-- 头发（顶部弧形，类别色）-->
  <path d="M 58 80 Q 58 35 100 35 Q 142 35 142 80 Q 142 55 100 50 Q 58 55 58 80 Z" fill="${c}" opacity="0.9"/>

  <!-- 眼睛 -->
  <circle cx="85" cy="78" r="4" fill="#333"/>
  <circle cx="115" cy="78" r="4" fill="#333"/>
  <!-- 微笑 -->
  <path d="M 88 95 Q 100 103 112 95" stroke="#666" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- 装饰：类别 emoji（大号，右上角）-->
  <text x="155" y="50" font-size="28" text-anchor="middle">${t.emoji}</text>

  <!-- 类型标签 -->
  <rect x="50" y="225" width="100" height="0" fill="none"/>
  <text x="100" y="235" font-size="14" font-weight="bold" fill="${c}" text-anchor="middle" font-family="sans-serif">${type}</text>
</svg>`;
}

let n = 0;
for (const [type, info] of Object.entries(TYPES)) {
	const svg = genSVG(type);
	const file = path.join(OUT, `${type}.svg`);
	fs.writeFileSync(file, svg);
	n++;
}
console.log(`✓ 生成 ${n} 个 MBTI 小人图标 SVG → ${OUT}/`);
