// install-sprites.mjs — 把下载的 CC0 VN 立绘接入 assets/characters/
// 来源（全部 CC0 / Public Domain）：
//   主角团：OpenGameArt "Visual Novel Character Sprite"（韩系二次元全身立绘，4 角色 × 多表情）
//     https://opengameart.org/content/visual-novel-character-sprite
//   导师团：OpenGameArt "VN Characters (by cabbit KusSv)"（6 角色 × 多表情 + CG）
//     https://opengameart.org/content/vn-characters
//
// 用法：node lib/install-sprites.mjs
// 会把 assets/_downloads/unpacked 下的素材按映射复制+重命名到 assets/characters/<id>/
// 不修改原始下载包；重复运行幂等（覆盖目标文件）。

import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DL = path.join(ROOT, 'assets', '_downloads', 'unpacked');
const SPRITE = path.join(DL, 'sprite');              // cha 1..4
const CABBIT = path.join(DL, 'chars', 'VN Characters (by cabbit KusSv)');
const OUT = path.join(ROOT, 'assets', 'characters');

// 主角团映射：sprite 包 cha N → 游戏槽位，并指定该槽位需要哪些表情键
// 表情键映射到游戏 Images 字段：normal/happy/sad/angry/surprised
// 每个 src 是相对 'unpacked/sprite/cha N/image/' 的文件名
const PROTAGONISTS = [
  {
    slot: 'senior', name: '学姐·温', srcDir: 'cha 1', prefix: 'pl1',
    expressions: {
      normal:  'pl1 serious.png',
      happy:   'pl1 happy.png',
      sad:     'pl1 sad.png',
      // 额外表情（script 若后续扩展可直接用）
      angry:   'pl1 angry.png',
      surprised: 'pl1 surprise.png',
    },
  },
  {
    slot: 'rival', name: '学霸·凛', srcDir: 'cha 2', prefix: 'pl2',
    expressions: {
      normal:  'pl2 shy.png',
      happy:   'pl2 happy.png',
      angry:   'pl2 angry.png',
      sad:     'pl2 sad.png',
      surprised: 'pl2 surprise.png',
    },
  },
  {
    slot: 'buddy', name: '死党·阿星', srcDir: 'cha 3', prefix: 'pl3',
    expressions: {
      normal:  'pl3 doubt.png',
      happy:   'pl3 happy.png',
      surprised: 'pl3 surprise.png',
      sad:     'pl3 sad.png',
      shy:     'pl3 shy.png',
    },
  },
  {
    slot: 'guide', name: '导师·沈', srcDir: 'cha 4', prefix: 'pl4',
    expressions: {
      normal:  'pl4 normal.png',
      happy:   'pl4 happy.png',
      sad:     'pl4 sad.png',
      angry:   'pl4 angry.png',
      surprised: 'pl4 surprise.png',
    },
  },
];

// 导师团映射：cabbit 包 6 角色 → 6 导师
// 每位导师目前只需要 normal（抽卡卡面用），但尽量带上 happy/sad 等便于扩展
const MENTORS = [
  { slot: 'mentor_yuan', name: '渊·战略军师',   char: 'VN_Anna',     expressions: { normal: 'VN_Anna--Duty_Smile.png',     happy: 'VN_Anna--Broad_Smile.png',  sad: 'VN_Anna--Unhappy.png' } },
  { slot: 'mentor_can',  name: '灿哥·热血教练', char: 'VN_Dasha',    expressions: { normal: 'VN_Dasha--Broad_Smile.png',   happy: 'VN_Dasha--Broad_Smile.png', sad: 'VN_Dasha--Unhappy.png' } },
  { slot: 'mentor_wan',  name: '婉学姐·治愈系', char: 'VN_Student',  expressions: { normal: 'VN_Student--Duty_Smile.png',  happy: 'VN_Student--Wide_Smile.png', sad: 'VN_Student--Unhappy.png' } },
  { slot: 'mentor_chi',  name: '炽学长·数据极客', char: 'VN_Visiter_A', expressions: { normal: 'VN_Visiter_A--Broad_Smile.png', happy: 'VN_Visiter_A--Broad_Smile.png' } },
  { slot: 'mentor_ning', name: '宁老师·心理导师', char: 'VN_Visiter_B', expressions: { normal: 'VN_Visiter_B--Duty_Smile.png',  happy: 'VN_Visiter_B--Wide_Smile.png' } },
  { slot: 'mentor_lao',  name: '老朽·玄学高人', char: 'VN_Visiter_C', expressions: { normal: 'VN_Visiter_C.png' } },
];

async function installProtagonist(p) {
  const imgDir = path.join(SPRITE, p.srcDir, 'image');
  const outDir = path.join(OUT, p.slot);
  await mkdir(outDir, { recursive: true });
  const installed = [];
  for (const [key, file] of Object.entries(p.expressions)) {
    const src = path.join(imgDir, file);
    const dst = path.join(outDir, `${p.slot}_${key}.png`);
    if (!existsSync(src)) { console.warn(`  [skip] 缺源: ${file} (${p.slot}/${key})`); continue; }
    await copyFile(src, dst);
    installed.push(`${key}←${file}`);
  }
  console.log(`✓ ${p.slot} (${p.name}): ${installed.join(', ')}`);
}

async function installMentor(m) {
  const outDir = path.join(OUT, m.slot);
  await mkdir(outDir, { recursive: true });
  const installed = [];
  for (const [key, file] of Object.entries(m.expressions)) {
    const src = path.join(CABBIT, file);
    const dst = path.join(outDir, `${m.slot}_${key}.png`);
    if (!existsSync(src)) { console.warn(`  [skip] 缺源: ${file} (${m.slot}/${key})`); continue; }
    await copyFile(src, dst);
    installed.push(`${key}←${file}`);
  }
  console.log(`✓ ${m.slot} (${m.name}): ${installed.join(', ')}`);
}

console.log('=== 接入主角团（CC0 / sprite 包）===');
for (const p of PROTAGONISTS) await installProtagonist(p);
console.log('\n=== 接入导师团（CC0 / cabbit 包）===');
for (const m of MENTORS) await installMentor(m);
console.log('\n完成。接下来需要更新 js/script.js 的 Images 字段以匹配新表情键。');
