// ============================================================================
//  scenes-gen.mjs —— 场景背景生成（原创 SVG，渐变星空/教室/战场氛围）
// ============================================================================
import fs from 'node:fs';
const OUT = 'assets/scenes';
fs.mkdirSync(OUT, {recursive:true});
const W=1280,H=720;
function wrap(inner){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`; }

// 通用：夜空 + 星 + 光晕
function night(bg1, bg2, glow, stars=60){
  let s = `<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="${glow}"/><stop offset="100%" stop-color="${bg2}"/></radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#g)"/>`;
  // 星星
  let seed=12345; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff;};
  for(let i=0;i<stars;i++){ const x=Math.round(rnd()*W), y=Math.round(rnd()*H*0.7), r=(rnd()*1.6+0.4).toFixed(1), o=(rnd()*0.6+0.3).toFixed(2); s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`; }
  return s;
}

// scene-start：紫蓝晨曦（开场，温柔）
fs.writeFileSync(`${OUT}/scene-start.svg`, wrap(
  night('#1a1238','#0a0818','rgba(176,111,172,0.35)') +
  // 远处建筑剪影（城市天际线）
  `<g fill="rgba(20,12,40,0.85)">
    <rect x="0" y="520" width="90" height="200"/>
    <rect x="80" y="470" width="70" height="250"/>
    <rect x="140" y="500" width="60" height="220"/>
    <rect x="190" y="440" width="110" height="280"/>
    <rect x="290" y="490" width="80" height="230"/>
    <rect x="360" y="460" width="90" height="260"/>
    <rect x="450" y="500" width="70" height="220"/>
    <rect x="510" y="430" width="130" height="290"/>
    <rect x="630" y="480" width="90" height="240"/>
    <rect x="710" y="460" width="100" height="260"/>
    <rect x="800" y="500" width="80" height="220"/>
    <rect x="870" y="440" width="120" height="280"/>
    <rect x="980" y="490" width="70" height="230"/>
    <rect x="1040" y="470" width="90" height="250"/>
    <rect x="1120" y="500" width="80" height="220"/>
    <rect x="1190" y="450" width="90" height="270"/>
  </g>`
  // 楼里点点灯光
  + `<g fill="rgba(255,220,120,0.7)">
    <rect x="100" y="500" width="6" height="8"/><rect x="220" y="470" width="6" height="8"/>
    <rect x="540" y="460" width="6" height="8"/><rect x="660" y="500" width="6" height="8"/>
    <rect x="740" y="480" width="6" height="8"/><rect x="900" y="470" width="6" height="8"/>
    <rect x="1060" y="490" width="6" height="8"/><rect x="1210" y="480" width="6" height="8"/>
  </g>`
));

// scene-enroll：青蓝登记厅（入营，仪式感）
fs.writeFileSync(`${OUT}/scene-enroll.svg`, wrap(
  night('#0f1a2e','#050a14','rgba(91,127,184,0.3)',40) +
  // 大门/立柱
  `<g fill="rgba(30,45,70,0.9)" stroke="rgba(120,160,220,0.4)" stroke-width="2">
    <rect x="160" y="180" width="50" height="440"/>
    <rect x="1070" y="180" width="50" height="440"/>
    <path d="M140,200 L1140,200 L1100,150 L180,150 Z"/>
  </g>`
  + `<rect x="500" y="300" width="280" height="320" rx="8" fill="rgba(20,35,60,0.85)" stroke="rgba(120,160,220,0.5)" stroke-width="2"/>`
  + `<text x="640" y="470" text-anchor="middle" font-size="40" fill="rgba(180,210,255,0.8)" font-family="serif" letter-spacing="10">入营</text>`
));

// scene-summon：紫红召唤阵（抽卡，神秘）
fs.writeFileSync(`${OUT}/scene-summon.svg`, wrap(
  night('#2a0f2e','#0a0510','rgba(224,90,120,0.4)',50) +
  // 召唤阵（同心圆 + 符文）
  `<g transform="translate(640 560)" fill="none" stroke="rgba(255,180,200,0.5)" stroke-width="2">
    <ellipse cx="0" cy="0" rx="380" ry="100"/>
    <ellipse cx="0" cy="0" rx="280" ry="70"/>
    <ellipse cx="0" cy="0" rx="180" ry="45"/>
  </g>`
  + `<g transform="translate(640 560)" fill="rgba(255,200,220,0.6)" font-family="serif" font-size="22">
    <text x="-360" y="6" text-anchor="middle">✦</text><text x="360" y="6" text-anchor="middle">✦</text>
    <text x="0" y="-50" text-anchor="middle">召唤</text>
  </g>`
));

// scene-score：冷蓝战场（查分，紧张）
fs.writeFileSync(`${OUT}/scene-score.svg`, wrap(
  night('#06121e','#02060c','rgba(70,130,180,0.3)',30) +
  // 数据流网格
  `<g stroke="rgba(80,160,220,0.15)" stroke-width="1">
    ${Array.from({length:12},(_,i)=>`<line x1="${i*110}" y1="0" x2="${i*110-200}" y2="${H}"/>`).join('')}
    ${Array.from({length:8},(_,i)=>`<line x1="0" y1="${i*100}" x2="${W}" y2="${i*100}"/>`).join('')}
  </g>`
  + `<g fill="rgba(100,200,255,0.6)" font-family="monospace" font-size="13">
    <text x="120" y="160">> connecting...</text>
    <text x="120" y="185">> score.db sync OK</text>
    <text x="120" y="210">> decrypt: ████████ 100%</text>
    <text x="120" y="235">> ready.</text>
  </g>`
));

// scene-mbti：青绿镜厅（人格测试，内省）
fs.writeFileSync(`${OUT}/scene-mbti.svg`, wrap(
  night('#0a2a2a','#02100f','rgba(60,180,160,0.3)',45) +
  // 镜面椭圆
  `<ellipse cx="640" cy="500" rx="320" ry="120" fill="rgba(80,200,180,0.12)" stroke="rgba(120,230,210,0.4)" stroke-width="2"/>`
  + `<ellipse cx="640" cy="500" rx="200" ry="75" fill="rgba(120,230,210,0.1)" stroke="rgba(120,230,210,0.3)" stroke-width="1"/>`
));

// scene-vision：金紫星空（理想，梦想）
fs.writeFileSync(`${OUT}/scene-vision.svg`, wrap(
  night('#2a1f0a','#100a02','rgba(255,200,80,0.3)',70) +
  // 流星
  `<g stroke="rgba(255,230,150,0.6)" stroke-width="2" fill="none">
    <path d="M200,120 L320,180"/><path d="M900,80 L1020,150"/><path d="M600,200 L700,260"/>
  </g>`
  + `<g fill="rgba(255,220,120,0.7)"><circle cx="318" cy="178" r="3"/><circle cx="1018" cy="148" r="3"/><circle cx="698" cy="258" r="3"/></g>`
));

// scene-wish：深空（志愿揭晓，庄重）
fs.writeFileSync(`${OUT}/scene-wish.svg`, wrap(
  night('#05050f','#000000','rgba(150,130,255,0.35)',90) +
  // 光柱
  `<defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(200,180,255,0)"/><stop offset="50%" stop-color="rgba(200,180,255,0.25)"/><stop offset="100%" stop-color="rgba(200,180,255,0)"/></linearGradient></defs>
  <rect x="560" y="0" width="160" height="${H}" fill="url(#beam)"/>`
));

// scene-chat：暖灯小屋（聊天，治愈）
fs.writeFileSync(`${OUT}/scene-chat.svg`, wrap(
  night('#1a1020','#0a0510','rgba(220,150,100,0.3)',20) +
  // 窗户 + 月
  `<circle cx="1000" cy="140" r="55" fill="rgba(255,240,200,0.85)"/>`
  + `<circle cx="1020" cy="130" r="50" fill="rgba(20,15,30,0.6)"/>`
  + `<rect x="150" y="120" width="240" height="180" rx="6" fill="rgba(40,30,50,0.7)" stroke="rgba(200,170,140,0.4)" stroke-width="3"/>`
  + `<line x1="270" y1="120" x2="270" y2="300" stroke="rgba(200,170,140,0.4)" stroke-width="3"/><line x1="150" y1="210" x2="390" y2="210" stroke="rgba(200,170,140,0.4)" stroke-width="3"/>`
));

// scene-end：粉金晨光（结局，希望）
fs.writeFileSync(`${OUT}/scene-end.svg`, wrap(
  night('#3a1f2a','#1a0a14','rgba(255,180,160,0.4)',40) +
  // 太阳升起
  `<defs><radialGradient id="sun" cx="50%" cy="100%"><stop offset="0%" stop-color="rgba(255,220,180,0.9)"/><stop offset="100%" stop-color="rgba(255,180,160,0)"/></radialGradient></defs>
  <ellipse cx="640" cy="720" rx="500" ry="300" fill="url(#sun)"/>`
  + `<circle cx="640" cy="640" r="80" fill="rgba(255,230,200,0.8)"/>`
));

console.log('✓ 场景背景已生成:', fs.readdirSync(OUT).length, '个');
