/**
 * 成就系统（Achievements）
 * 触发条件由 game.js 在各事件回调中检查。
 * rarity: 'common' | 'rare' | 'epic' | 'legendary'
 */

const ACHIEVEMENTS = [
  // —— 流程类 ——
  { id:'first_step',    name:'初出茅庐', desc:'完成基本信息采集',         emoji:'🚪', rarity:'common',    check:s=>!!s.provinceObj },
  { id:'truth_seeker',  name:'直面真相', desc:'自己手动查分',             emoji:'⚔️', rarity:'common',    check:s=>s.scoreVia==='manual' },
  { id:'brave_heart',   name:'勇者之心', desc:'让 AI 帮你查分（承认害怕）', emoji:'🫀', rarity:'rare',      check:s=>s.scoreVia==='auto' },
  { id:'self_know',     name:'认识自我', desc:'完成 MBTI 人格测试',       emoji:'🪞', rarity:'common',    check:s=>!!s.mbtiType && s.mbtiSkipped!==true },
  { id:'dreamer',       name:'心怀远方', desc:'选定一个人生理想',         emoji:'✨', rarity:'common',    check:s=>!!s.visionId },
  { id:'strategist',    name:'运筹帷幄', desc:'生成第一份志愿表',         emoji:'📜', rarity:'common',    check:s=>s.results && s.results.length>0 },

  // —— 分数类 ——
  { id:'scholar_god',   name:'学神降临', desc:'查分获得 S 级（学神级）',  emoji:'🏆', rarity:'legendary', check:s=>s.tier==='S' },
  { id:'dark_horse',    name:'黑马逆袭', desc:'查分获得 A 级（学霸级）',  emoji:'🌟', rarity:'epic',      check:s=>s.tier==='A' },
  { id:'unsung_hero',   name:'静水流深', desc:'查分获得 B 级（优秀）',    emoji:'👍', rarity:'rare',      check:s=>s.tier==='B' },

  // —— 导师类 ——
  { id:'summoner',      name:'召唤师',   desc:'召唤一位导师',             emoji:'🎴', rarity:'common',    check:s=>!!s.mentorId },
  { id:'ssr_pulled',    name:'欧皇附体', desc:'抽到 SSR 导师',            emoji:'🌈', rarity:'legendary', check:s=>s.mentorRarity==='SSR' },
  { id:'bond_max',      name:'羁绊共鸣', desc:'选择与自身 MBTI 匹配的导师', emoji:'💞', rarity:'epic',     check:s=>s.mentorId && s.mbtiType && (MENTORS.find(m=>m.id===s.mentorId)||{}).archetypes?.includes(s.mbtiType) },

  // —— NPC 同学互动 ——
  { id:'classmate_helper', name:'守望相助', desc:'与一位同学建立信任（关系≥70）', emoji:'🤝', rarity:'epic',
    check:s => s.relations && ['classmate_lin','classmate_xyu','classmate_dazhi'].some(k => (s.relations[k]||0) >= 70) },
  { id:'classmate_beacon', name:'灯塔',     desc:'与全部 3 位同学都建立信任',     emoji:'🌟', rarity:'legendary',
    check:s => s.relations && ['classmate_lin','classmate_xyu','classmate_dazhi'].every(k => (s.relations[k]||0) >= 70) },

  // —— 隐藏 / 趣味 ——
  { id:'all_round',     name:'面面俱到', desc:'选满 5 个以上兴趣标签',    emoji:'🎨', rarity:'rare',      check:s=>s.interests && s.interests.length>=5 },
  { id:'completionist', name:'圆满',     desc:'解锁全部其他成就',         emoji:'👑', rarity:'legendary', check:null /* 在 game.js 特殊处理 */ },
];
window.ACHIEVEMENTS = ACHIEVEMENTS;
