// ============================================================================
//  map-gen.mjs —— 校园俯视图地图底图 SVG（失忆穿越主线枢纽）
//  节点交互在 DOM 层（GK.showCampusMap），本图只画底图：建筑俯视轮廓 + 小径
// ============================================================================
import fs from 'node:fs';

const OUT = 'assets/scenes/scene-map.svg';
const W = 1280, H = 720;
fs.mkdirSync('assets/scenes', { recursive: true });

function wrap (inner) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`;
}

// 5 个建筑位置（百分比转像素，与 bridge.js MAP_NODES 一致）
const NODES = [
	{ x: 0.18, y: 0.28, color: '#5B7FB8', name: 'classroom' }, // 教室
	{ x: 0.78, y: 0.24, color: '#3D8A9E', name: 'library' },   // 图书室
	{ x: 0.82, y: 0.72, color: '#B07AAC', name: 'rooftop' },   // 屋上
	{ x: 0.20, y: 0.74, color: '#C09A6F', name: 'cafeteria' }, // 食堂
	{ x: 0.50, y: 0.16, color: '#FFD700', name: 'summon' },    // 召唤台
];
const CX = W * 0.5, CY = H * 0.5; // 中心：玩家位置

let s = `<defs>
	<radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
		<stop offset="0%" stop-color="rgba(30,35,70,0.9)"/>
		<stop offset="100%" stop-color="rgba(8,10,25,0.98)"/>
	</radialGradient>
	<linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0%" stop-color="rgba(40,55,80,0.4)"/>
		<stop offset="100%" stop-color="rgba(20,30,50,0.6)"/>
	</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#mapBg)"/>`;

// 草地纹理（底层）
s += `<rect width="${W}" height="${H}" fill="url(#grass)" opacity="0.5"/>`;

// 小径（中心 → 各节点，虚线）
NODES.forEach(n => {
	const nx = n.x * W, ny = n.y * H;
	s += `<line x1="${CX}" y1="${CY}" x2="${nx}" y2="${ny}" stroke="rgba(127,90,240,0.25)" stroke-width="3" stroke-dasharray="8 8"/>`;
});

// 中心广场（玩家位置）
s += `<circle cx="${CX}" cy="${CY}" r="50" fill="rgba(127,90,240,0.15)" stroke="rgba(127,90,240,0.5)" stroke-width="2"/>`;
s += `<circle cx="${CX}" cy="${CY}" r="28" fill="rgba(127,90,240,0.25)" stroke="rgba(127,90,240,0.7)" stroke-width="1.5"/>`;

// 建筑俯视轮廓（每个节点一个圆角矩形 + 屋顶色块）
NODES.forEach(n => {
	const nx = n.x * W, ny = n.y * H;
	const bw = 110, bh = 80;
	// 建筑阴影
	s += `<rect x="${nx - bw/2 + 4}" y="${ny - bh/2 + 4}" width="${bw}" height="${bh}" rx="8" fill="rgba(0,0,0,0.4)"/>`;
	// 建筑主体
	s += `<rect x="${nx - bw/2}" y="${ny - bh/2}" width="${bw}" height="${bh}" rx="8" fill="rgba(30,35,60,0.85)" stroke="${n.color}" stroke-width="2.5" opacity="0.7"/>`;
	// 屋顶色块（小三角/方块表示建筑类型）
	s += `<rect x="${nx - bw/2 + 8}" y="${ny - bh/2 + 8}" width="${bw - 16}" height="14" rx="3" fill="${n.color}" opacity="0.5"/>`;
	// 内部窗户网格（装饰）
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 2; j++) {
			s += `<rect x="${nx - bw/2 + 14 + i * 28}" y="${ny - 8 + j * 22}" width="16" height="14" rx="2" fill="rgba(255,255,200,0.15)"/>`;
		}
	}
});

// 装饰：树木（随机散布的圆）
let seed = 7777;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
for (let i = 0; i < 24; i++) {
	const x = rnd() * W, y = rnd() * H;
	// 避开中心广场和节点
	const distC = Math.hypot(x - CX, y - CY);
	let nearNode = false;
	for (const n of NODES) { if (Math.hypot(x - n.x * W, y - n.y * H) < 80) { nearNode = true; break; } }
	if (distC < 80 || nearNode) continue;
	const r = 8 + rnd() * 10;
	s += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(44,90,70,0.4)"/>`;
	s += `<circle cx="${x - 2}" cy="${y - 2}" r="${r * 0.7}" fill="rgba(60,120,90,0.35)"/>`;
}

// 顶部标题区暗化（让 header 文字清晰）
s += `<rect width="${W}" height="80" fill="rgba(0,0,0,0.4)"/>`;

fs.writeFileSync(OUT, wrap(s));
console.log('✓ 校园地图底图已生成:', OUT, '(' + Math.round(s.length / 1024) + 'KB)');
