/**
 * 游戏内核（GAME）
 * - 玩家等级 / 经验值（XP）
 * - 成就解锁系统（带回调通知 UI）
 * - 抽卡（导师召唤）按稀有度概率
 * - 学生角色卡状态
 *
 * 不依赖 DOM 直接操作，通过回调通知 UI 层（achievement-view 等）。
 */

const GAME = (() => {

  const player = {
    level: 1,
    xp: 0,
    title: '迷茫的高考生',
    unlocked: new Set(),       // 已解锁成就 id
    mentorsPulled: [],         // 抽卡历史
  };

  // —— 等级表 ——
  const LEVEL_TITLES = [
    { lv:1,  title:'迷茫的高考生',    xpNeed:0    },
    { lv:2,  title:'初醒的探索者',    xpNeed:50   },
    { lv:3,  title:'执笔的战士',      xpNeed:150  },
    { lv:4,  title:'破局者',          xpNeed:300  },
    { lv:5,  title:'命运执笔人',      xpNeed:500  },
    { lv:6,  title:'星辰之子',        xpNeed:800  },
    { lv:7,  title:'志愿之神',        xpNeed:1200 },
  ];

  function levelInfo() {
    let cur = LEVEL_TITLES[0];
    let next = null;
    for (let i=0;i<LEVEL_TITLES.length;i++){
      if (player.xp >= LEVEL_TITLES[i].xpNeed){
        cur = LEVEL_TITLES[i];
        next = LEVEL_TITLES[i+1] || null;
      }
    }
    player.level = cur.lv;
    player.title = cur.title;
    return { cur, next, progress: next ? (player.xp-cur.xpNeed)/(next.xpNeed-cur.xpNeed) : 1 };
  }

  function addXp(n) {
    const before = player.level;
    player.xp += n;
    levelInfo();
    if (player.level > before && typeof onLevelUp === 'function') onLevelUp(player.level, player.title);
  }

  // —— 成就 ——
  let onAchievement = null;  // UI 回调
  let onLevelUp = null;
  function bindUI(handlers){ onAchievement = handlers.onAchievement; onLevelUp = handlers.onLevelUp; }

  function checkAchievements(state) {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (a.id === 'completionist') continue;
      if (player.unlocked.has(a.id)) continue;
      if (a.check && a.check(state)) {
        player.unlocked.add(a.id);
        newly.push(a);
        addXp(ACHIEVEMENT_XP[a.rarity] || 30);
      }
    }
    // 圆满：除自身外全解锁
    const others = ACHIEVEMENTS.filter(a=>a.id!=='completionist');
    if (!player.unlocked.has('completionist') && others.every(a=>player.unlocked.has(a.id))) {
      const comp = ACHIEVEMENTS.find(a=>a.id==='completionist');
      player.unlocked.add('completionist');
      newly.push(comp);
      addXp(ACHIEVEMENT_XP.legendary);
    }
    newly.forEach((a,i) => {
      setTimeout(() => { if (onAchievement) onAchievement(a); }, i*700);
    });
    return newly;
  }

  const ACHIEVEMENT_XP = { common:30, rare:60, epic:120, legendary:250 };

  function isUnlocked(id){ return player.unlocked.has(id); }
  function unlockedList(){ return ACHIEVEMENTS.filter(a=>player.unlocked.has(a.id)); }
  function progress(){ return { total:ACHIEVEMENTS.length, got:player.unlocked.size }; }

  // —— 抽卡（导师召唤）——
  function pullMentor() {
    // 按 rarity weight 加权随机
    const pool = [];
    MENTORS.forEach(m => {
      const w = RARITY_CONFIG[m.rarity].weight;
      for (let i=0;i<w;i++) pool.push(m);
    });
    const got = pool[Math.floor(Math.random()*pool.length)];
    player.mentorsPulled.push({ id:got.id, rarity:got.rarity, t:Date.now() });
    return got;
  }

  // —— 重置 ——
  function reset(){
    player.level = 1;
    player.xp = 0;
    player.title = '迷茫的高考生';
    player.unlocked = new Set();
    player.mentorsPulled = [];
  }

  return {
    player, levelInfo, addXp,
    checkAchievements, isUnlocked, unlockedList, progress,
    pullMentor, bindUI, reset,
    LEVEL_TITLES,
  };
})();
window.GAME = GAME;
