// ============================================================================
//  portrait-gen.mjs —— 原创二次元角色立绘生成器（SVG）
//  用法: node portrait-gen.mjs
//  输出: assets/characters/<id>/<id>_<expr>.svg
//  风格: 二次元半身立绘（头部+肩部），参数化：肤色/发色/发型/瞳色/表情/服装色
//  纯原创矢量，零版权风险。可无限缩放。
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';

const OUT_ROOT = 'assets/characters';

// —— 几何辅助 ——
function rgba(hex, a=1){ const h=hex.replace('#',''); const n=parseInt(h,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgba(${r},${g},${b},${a})`; }
function shade(hex, k){ // k -1..1
  const h=hex.replace('#',''); const n=parseInt(h,16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.round(r+(k>0?(255-r):r)*k); g=Math.round(g+(k>0?(255-g):g)*k); b=Math.round(b+(k>0?(255-b):b)*k);
  return `rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
}

// —— 头发绘制（按发型参数）——
function hair(def){
  const color = def.hair, style = def.hairStyle; // style: long|short|twin|spiky|bob|pony
  const dark = shade(color,-0.4), mid = shade(color,-0.18), light = shade(color,0.35);
  const g = [];
  // 后发（长发的背后部分）—— 加渐变层次
  if (style==='long'||style==='pony') {
    g.push(`<path d="M148,92 Q66,150 58,290 Q52,410 86,505 L124,505 L120,180 Z" fill="${dark}"/>`);
    g.push(`<path d="M302,92 Q384,150 392,290 Q398,410 364,505 L326,505 L330,180 Z" fill="${dark}"/>`);
    g.push(`<path d="M150,95 Q80,155 74,295 Q70,400 100,495 L116,495 L114,185 Z" fill="${mid}" opacity="0.85"/>`);
    g.push(`<path d="M300,95 Q370,155 376,295 Q380,400 350,495 L334,495 L336,185 Z" fill="${mid}" opacity="0.85"/>`);
  }
  if (style==='pony') {
    g.push(`<path d="M330,140 Q400,200 390,360 Q380,470 340,490 L320,490 Q350,380 340,300 Q335,220 310,170 Z" fill="${dark}"/>`);
    g.push(`<rect x="318" y="135" width="22" height="14" rx="6" fill="#d96"/>`); // 发圈
  }
  // 前发（刘海）—— 主色 + 暗部
  const bangs = {
    long:  `M150,80 Q120,95 112,140 Q120,180 150,175 Q155,150 160,160 Q165,120 175,95 Z
            M175,95 Q190,80 200,82 Q210,84 215,120 Q210,160 200,165 Q190,150 185,110 Z
            M215,120 Q230,90 250,82 Q270,80 285,95 Q300,120 295,150 Q285,170 270,168 Q255,150 245,110 Z
            M285,95 Q300,85 320,90 Q345,100 345,140 Q340,175 315,178 Q300,165 295,120 Z`,
    short: `M150,85 Q120,100 115,135 Q118,165 145,168 Q150,145 158,150 Q160,115 170,95 Z
            M170,95 Q200,85 230,88 Q260,90 285,95 Q310,100 345,110 Q345,150 320,160 Q300,150 290,120 Q270,140 250,135 Q225,120 200,118 Q180,120 170,95 Z`,
    twin:  `M150,80 Q115,95 108,140 Q112,180 145,182 Q150,155 158,162 Q162,120 175,98 Z
            M175,98 Q205,85 250,85 Q290,85 318,98 Q345,115 345,150 Q342,180 320,182 Q305,170 300,140 Q280,160 255,155 Q225,145 200,145 Q180,150 175,98 Z`,
    spiky: `M150,82 L138,120 L150,110 L160,150 L168,108 L185,150 L195,100 L210,150 L222,95 L240,150 L250,100 L268,150 L278,100 L295,150 L305,108 L322,150 L335,95 Q345,120 345,145 Q335,165 310,168 L180,168 Q150,165 150,82 Z`,
    bob:   `M155,82 Q120,95 112,140 Q110,180 130,200 L150,210 Q150,180 158,180 Q162,120 175,95 Z
            M175,95 Q210,85 250,85 Q290,85 320,95 Q345,110 345,150 L345,210 Q330,200 320,180 Q300,200 280,185 Q250,200 220,185 Q190,200 175,95 Z`,
  };
  const bang = bangs[style]||bangs.short;
  g.push(`<path d="${bang}" fill="${color}"/>`);
  // 刘海暗部（下层投影增加体积感）
  g.push(`<path d="${bang}" fill="${dark}" opacity="0.28"/>`);
  // 鬓发
  g.push(`<path d="M118,150 Q112,205 122,245 Q130,255 140,250 Q132,212 130,160 Z" fill="${color}"/>`);
  g.push(`<path d="M118,150 Q112,205 122,245 Q130,255 140,250 Q132,212 130,160 Z" fill="${dark}" opacity="0.25"/>`);
  g.push(`<path d="M342,150 Q348,205 338,245 Q330,255 320,250 Q328,212 330,160 Z" fill="${color}"/>`);
  g.push(`<path d="M342,150 Q348,205 338,245 Q330,255 320,250 Q328,212 330,160 Z" fill="${dark}" opacity="0.25"/>`);
  // 高光（带状，增加光泽层次）
  g.push(`<path d="M158,98 Q178,90 200,94 Q188,106 172,110 Q162,108 158,98 Z" fill="${rgba(light,0.7)}"/>`);
  g.push(`<path d="M250,92 Q278,88 300,96 Q292,104 278,106 Q260,104 250,92 Z" fill="${rgba(light,0.55)}"/>`);
  g.push(`<path d="M210,96 Q225,92 240,95 Q235,103 225,104 Q215,103 210,96 Z" fill="${rgba(light,0.45)}"/>`);
  return g.join('');
}

// —— 眼睛（按表情）——
// expr: normal|happy|angry|sad|surprised|wink
function eyes(def, expr){
  const iris = def.iris;
  const dark = shade(iris,-0.4);
  const lx=178, rx=272, y=255; // 左右眼中心
  const out = [];
  const drawEye = (cx, mirror) => {
    let eyeWhite, irisShape, lid, brow;
    const m = mirror ? -1 : 1;
    switch(expr){
      case 'happy':
        eyeWhite = `<path d="M${cx-22},${y} Q${cx},${y-14} ${cx+22},${y}" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        break;
      case 'wink':
        if(!mirror){ eyeWhite = `<path d="M${cx-22},${y} Q${cx},${y-14} ${cx+22},${y}" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
        else {
          eyeWhite = `<ellipse cx="${cx}" cy="${y}" rx="18" ry="22" fill="#fff"/>`;
          irisShape = `<ellipse cx="${cx+3*m}" cy="${y+3}" rx="10" ry="16" fill="${iris}"/><ellipse cx="${cx+3*m}" cy="${y+3}" rx="10" ry="16" fill="none" stroke="${dark}" stroke-width="2"/><circle cx="${cx+6*m}" cy="${y-3}" r="4" fill="#222"/><circle cx="${cx+8*m}" cy="${y-6}" r="2" fill="#fff"/>`;
        }
        break;
      case 'angry':
        eyeWhite = `<ellipse cx="${cx}" cy="${y+4}" rx="18" ry="16" fill="#fff"/>`;
        irisShape = `<ellipse cx="${cx+3*m}" cy="${y+6}" rx="10" ry="14" fill="${iris}"/><circle cx="${cx+6*m}" cy="${y+5}" r="4" fill="#222"/><circle cx="${cx+8*m}" cy="${y+2}" r="2" fill="#fff"/>`;
        lid = `<path d="M${cx-22},${y-12} L${cx+22},${y-2}" stroke="#333" stroke-width="5" stroke-linecap="round" fill="none"/>`;
        break;
      case 'sad':
        eyeWhite = `<ellipse cx="${cx}" cy="${y+4}" rx="18" ry="18" fill="#fff"/>`;
        irisShape = `<ellipse cx="${cx+3*m}" cy="${y+8}" rx="10" ry="14" fill="${iris}"/><circle cx="${cx+5*m}" cy="${y+8}" r="4" fill="#222"/><circle cx="${cx+7*m}" cy="${y+5}" r="2" fill="#fff"/>`;
        lid = `<path d="M${cx-22},${y-14} Q${cx},${y-6} ${cx+22},${y-10}" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        break;
      case 'surprised':
        eyeWhite = `<ellipse cx="${cx}" cy="${y}" rx="22" ry="26" fill="#fff"/>`;
        irisShape = `<ellipse cx="${cx+3*m}" cy="${y}" rx="12" ry="18" fill="${iris}"/><ellipse cx="${cx+3*m}" cy="${y}" rx="12" ry="18" fill="none" stroke="${dark}" stroke-width="2"/><circle cx="${cx+5*m}" cy="${y}" r="5" fill="#222"/><circle cx="${cx+8*m}" cy="${y-4}" r="3" fill="#fff"/>`;
        break;
      default: // normal
        eyeWhite = `<ellipse cx="${cx}" cy="${y}" rx="18" ry="22" fill="#fff"/>`;
        irisShape = `<ellipse cx="${cx+3*m}" cy="${y+3}" rx="11" ry="17" fill="${iris}"/><ellipse cx="${cx+3*m}" cy="${y+3}" rx="11" ry="17" fill="none" stroke="${dark}" stroke-width="2"/><circle cx="${cx+6*m}" cy="${y+2}" r="5" fill="#222"/><circle cx="${cx+9*m}" cy="${y-3}" r="3" fill="#fff"/>`;
        lid = `<path d="M${cx-22},${y-18} Q${cx},${y-22} ${cx+22},${y-18}" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
    return [eyeWhite, irisShape, lid].filter(Boolean).join('');
  };
  out.push(drawEye(lx, false));
  out.push(drawEye(rx, true));
  return out.join('');
}

// —— 眉毛（按表情）——
function brows(expr, def){
  const lx=178, rx=272, y=222;
  switch(expr){
    case 'angry': return `<path d="M${lx-20},${y+8} L${lx+20},${y-2}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round"/><path d="M${rx-20},${y-2} L${rx+20},${y+8}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round"/>`;
    case 'sad':   return `<path d="M${lx-20},${y-4} Q${lx},${y+4} ${lx+20},${y+2}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M${rx-20},${y+2} Q${rx},${y+4} ${rx+20},${y-4}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    case 'surprised': return `<path d="M${lx-18},${y-6} Q${lx},${y-10} ${lx+18},${y-6}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M${rx-18},${y-6} Q${rx},${y-10} ${rx+18},${y-6}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    default: return `<path d="M${lx-20},${y} Q${lx},${y-6} ${lx+20},${y-2}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M${rx-20},${y-2} Q${rx},${y-6} ${rx+20},${y}" stroke="${shade(def.hair,-0.5)}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  }
}

// —— 嘴巴（按表情）——
function mouth(expr){
  const x=225, y=310;
  switch(expr){
    case 'happy': return `<path d="M${x-18},${y} Q${x},${y+14} ${x+18},${y}" stroke="#b44" stroke-width="3.5" fill="${rgba('#c44',0.5)}" stroke-linecap="round"/>`;
    case 'angry': return `<path d="M${x-16},${y+6} L${x+16},${y+6}" stroke="#a44" stroke-width="4" stroke-linecap="round"/>`;
    case 'sad':   return `<path d="M${x-16},${y+8} Q${x},${y} ${x+16},${y+8}" stroke="#a66" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case 'surprised': return `<ellipse cx="${x}" cy="${y+4}" rx="8" ry="11" fill="#933"/>`;
    case 'wink': return `<path d="M${x-16},${y+2} Q${x},${y+12} ${x+16},${y+2}" stroke="#b44" stroke-width="3.5" fill="${rgba('#c44',0.4)}" stroke-linecap="round"/>`;
    default: return `<path d="M${x-14},${y+3} Q${x},${y+8} ${x+14},${y+3}" stroke="#b44" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
}

// —— 腮红 ——
function blush(expr){
  if(expr==='happy'||expr==='wink'||expr==='sad')
    return `<ellipse cx="160" cy="290" rx="20" ry="10" fill="${rgba('#f99',0.35)}"/><ellipse cx="290" cy="290" rx="20" ry="10" fill="${rgba('#f99',0.35)}"/>`;
  return '';
}

// —— 服装 / 身体（半身：肩+胸）——
function body(def){
  const {outfit} = def;
  const c = outfit.color, dark = shade(c,-0.3), light = shade(c,0.2);
  const skin = def.skin, skinShade = shade(skin,-0.12), skinLight = shade(skin,0.08);
  // 脖子：梯形渐变，自然衔接下巴
  const neck = `<defs><linearGradient id="neckG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skinLight}"/>
      <stop offset="100%" stop-color="${skinShade}"/>
    </linearGradient></defs>
    <path d="M198,355 Q196,395 190,425 Q188,432 195,435 L255,435 Q262,432 260,425 Q254,395 252,355 Z" fill="url(#neckG)"/>
    <path d="M198,355 Q196,395 190,425 Q188,432 195,435" fill="none" stroke="${shade(skin,-0.18)}" stroke-width="1.5" opacity="0.5"/>`;
  const collars = {
    uniform: `<path d="M90,470 L120,420 Q150,400 225,400 Q300,400 330,420 L360,470 L360,560 L90,560 Z" fill="${c}"/>
              <path d="M90,470 L120,420 Q150,400 225,400 Q210,430 210,470 L90,470 Z" fill="${dark}" opacity="0.35"/>
              <path d="M225,400 L215,440 L235,440 Z" fill="#fff"/>
              <rect x="222" y="430" width="6" height="40" fill="${shade('#c00',0)}"/>`,
    hoodie: `<path d="M80,480 L110,430 Q150,410 225,410 Q300,410 340,430 L370,480 L370,560 L80,560 Z" fill="${c}"/>
             <path d="M150,415 Q225,395 300,415 Q280,460 225,465 Q170,460 150,415 Z" fill="${shade(c,-0.15)}"/>
             <path d="M205,415 L205,470 M245,415 L245,470" stroke="${dark}" stroke-width="3"/>
             <path d="M120,460 Q150,500 150,560 L80,560 L80,480 Z" fill="${dark}" opacity="0.3"/>`,
    suit:   `<path d="M90,470 L120,415 Q150,400 225,400 Q300,400 330,415 L360,470 L360,560 L90,560 Z" fill="${shade(c,-0.1)}"/>
              <path d="M90,470 L120,415 Q150,400 225,400 Q210,430 210,470 L90,470 Z" fill="${dark}" opacity="0.35"/>
              <path d="M205,400 L225,440 L245,400 L240,560 L210,560 Z" fill="#fff"/>
              <path d="M205,400 L225,440 L245,400" fill="none" stroke="${dark}" stroke-width="2"/>
              <rect x="222" y="455" width="6" height="30" fill="#c00"/>`,
    dress:  `<path d="M95,475 Q140,430 225,420 Q310,430 355,475 L360,560 L90,560 Z" fill="${c}"/>
              <path d="M180,430 Q225,420 270,430 Q260,455 225,458 Q190,455 180,430 Z" fill="${light}"/>
              <path d="M120,455 Q140,500 140,560 L90,560 L95,475 Z" fill="${dark}" opacity="0.3"/>`,
    kimono: `<path d="M85,475 L115,420 Q150,395 225,395 Q300,395 335,420 L365,475 L365,560 L85,560 Z" fill="${c}"/>
              <path d="M205,395 L250,395 L265,560 L190,560 Z" fill="${shade(c,-0.2)}"/>
              <rect x="190" y="450" width="75" height="14" fill="${shade('#d4a017',0)}"/>`,
  };
  return neck + (collars[outfit.type]||collars.uniform);
}

// —— 主立绘生成（半身，透明背景）——
function portrait(def, expr){
  const W=450, H=560;
  const skin = def.skin, skinLight = shade(skin,0.06), skinShade = shade(skin,-0.1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- 身体/服装 -->
  ${body(def)}
  <!-- 头部底（渐变，统一肤色，避免左右色差） -->
  <defs><radialGradient id="faceG${expr}" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${skinLight}"/>
      <stop offset="70%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skinShade}"/>
    </radialGradient></defs>
  <ellipse cx="225" cy="242" rx="104" ry="118" fill="url(#faceG${expr})"/>
  <!-- 耳朵 -->
  <ellipse cx="124" cy="266" rx="13" ry="19" fill="${shade(skin,-0.05)}"/>
  <ellipse cx="326" cy="266" rx="13" ry="19" fill="${shade(skin,-0.05)}"/>
  <!-- 头发 -->
  ${hair(def)}
  <!-- 五官 -->
  ${brows(expr, def)}
  ${eyes(def, expr)}
  <!-- 鼻子 -->
  <path d="M225,278 Q222,290 228,294" stroke="${shade(skin,-0.22)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  ${mouth(expr)}
  ${blush(expr)}
  </svg>`;
}

// —— 导师肖像（带属性色调光晕，方形）——
function mentorPortrait(m){
  const def = m._portrait;
  const W=400, H=400;
  const inner = portrait(def, 'normal').replace(/viewBox="0 0 450 560"/,'viewBox="80 60 320 420"').replace(/width="450" height="560"/,`width="${W}" height="${H}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${rgba(m.color,0.55)}"/>
      <stop offset="60%" stop-color="${rgba(m.color,0.12)}"/>
      <stop offset="100%" stop-color="#0a0a14"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g opacity="0.95">${inner.replace(/<svg[^>]*>/,'').replace(/<\/svg>/,'')}</g>
    <text x="200" y="385" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#fff" font-weight="bold">${m.name}</text>
    <text x="200" y="370" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${m.color}">${m.element}属性</text>
  </svg>`;
}

// ===================== 角色定义 =====================
const CAST = {
  senior: { // 学姐·温 —— 温柔治愈，紫色长发
    hair:'#b06fac', hairStyle:'long', iris:'#9b5fb0', skin:'#ffe3d0',
    outfit:{type:'dress', color:'#e8c8e0'},
  },
  rival: { // 学霸·凛 —— 毒舌理性，蓝色短发
    hair:'#3b5bdb', hairStyle:'bob', iris:'#4a90d9', skin:'#ffe8d8',
    outfit:{type:'uniform', color:'#5b7fb8'},
  },
  buddy: { // 死党·阿星 —— 中二打气，橙色刺猬头
    hair:'#e8772e', hairStyle:'spiky', iris:'#d97a3b', skin:'#ffdcc0',
    outfit:{type:'hoodie', color:'#c09a6f'},
  },
  guide: { // 导师·沈 —— 沉稳专业，青色西装
    hair:'#3d5a6c', hairStyle:'short', iris:'#3d8a9e', skin:'#ffe0cc',
    outfit:{type:'suit', color:'#2d4a5c'},
  },
};

// 表情清单（每位主角出 3 张）
const EXPRS = {
  senior: ['normal','happy','sad'],
  rival:  ['normal','angry','happy'],
  buddy:  ['normal','happy','surprised'],
  guide:  ['normal','happy','sad'],
};

// 导师肖像定义（从 mentors.js 的属性推演出立绘）
// mentors.js 是 window-global 风格，用 eval 读取
globalThis.window = globalThis;
import { readFileSync } from 'node:fs';
eval(readFileSync('data/mentors.js','utf8'));
const MENTORS = window.MENTORS;
// 给每位导师附上立绘参数
const MENTOR_PORTRAITS = {
  yuan: { hair:'#d4a017', hairStyle:'short', iris:'#c89028', skin:'#ffd9b3', outfit:{type:'suit', color:'#8b6914'} },
  can:  { hair:'#e85d75', hairStyle:'twin', iris:'#e85d75', skin:'#ffe0e0', outfit:{type:'dress', color:'#d4456b'} },
  wan:  { hair:'#6c5ce7', hairStyle:'long', iris:'#6c5ce7', skin:'#ffe3d0', outfit:{type:'uniform', color:'#5448c0'} },
  chi:  { hair:'#2ecc71', hairStyle:'spiky', iris:'#2ecc71', skin:'#ffdcc0', outfit:{type:'hoodie', color:'#27ae60'} },
  ning: { hair:'#74b9ff', hairStyle:'bob', iris:'#0984e3', skin:'#ffe8d8', outfit:{type:'dress', color:'#5a9fd4'} },
  lao:  { hair:'#bdc3c7', hairStyle:'short', iris:'#7f8c8d', skin:'#f0dcc0', outfit:{type:'kimono', color:'#7f8c8d'} },
};

// ===================== 输出 =====================
let count = 0;
// 主角立绘
for (const [id, def] of Object.entries(CAST)) {
  const dir = path.join(OUT_ROOT, id);
  fs.mkdirSync(dir, {recursive:true});
  for (const expr of EXPRS[id]) {
    const svg = portrait(def, expr);
    fs.writeFileSync(path.join(dir, `${id}_${expr}.svg`), svg);
    count++;
  }
}
// 导师肖像
const mentorDir = path.join(OUT_ROOT, 'mentors');
fs.mkdirSync(mentorDir, {recursive:true});
for (const m of MENTORS) {
  const pd = MENTOR_PORTRAITS[m.id] || MENTOR_PORTRAITS.yuan;
  m._portrait = pd;
  fs.writeFileSync(path.join(mentorDir, `${m.id}.svg`), mentorPortrait(m));
  count++;
}
console.log(`✓ 生成 ${count} 张立绘 → ${OUT_ROOT}/`);
