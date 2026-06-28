/**
 * 分数查分 + 情绪反应模块
 * - generateFakeScore: 根据省份/选科生成一个"演示用"分数（含位次估算）
 * - reactToScore    : 分数高/中/低的 galgame 化夸奖/鼓励台词
 * - autoCheckSequence: 给"不敢查分"的同学自动查分（带悬念动画文案）
 */

const SCORE_CHECKER = (() => {
  // 按 total 归一化到 750 口径再分级
  function tierOf(score, total) {
    const norm = score / total * 750;
    if (norm >= 650) return 'S';   // 学神
    if (norm >= 600) return 'A';   // 学霸
    if (norm >= 550) return 'B';   // 优秀
    if (norm >= 500) return 'C';   // 良好
    if (norm >= 400) return 'D';   // 本科线附近
    return 'E';                    // 专科
  }

  // 演示用：根据省份满分随机一个分数 + 估算位次
  function generateFakeScore(province, group) {
    const total = province.total || 750;
    // 让分数分布更真实：集中在 400~650 之间
    const base = 380 + Math.random() * 300;
    const score = Math.min(total, Math.round(base / 750 * total));
    const tier = tierOf(score, total);

    // 位次估算（仅演示，反向递减）
    const rank = Math.max(1, Math.round(
      3_000_000 * Math.pow(1 - (score/total), 3.2)
    ));

    // 单科分数（演示）
    const lang  = Math.round(90 + Math.random()*40);
    const math  = Math.round(80 + Math.random()*50);
    const eng   = Math.round(85 + Math.random()*45);
    let subjects = [
      { name:'语文', score: lang },
      { name:'数学', score: math },
      { name:'外语', score: eng },
    ];
    if (province.rule === 'new-3-3') {
      const pick = ['物理','化学','生物','政治','历史','地理'];
      const three = pick.sort(()=>Math.random()-0.5).slice(0,3);
      three.forEach(s => subjects.push({ name:s, score: Math.round(60 + Math.random()*40) }));
    } else if (province.rule === 'new-3-1-2') {
      const lead = group === '历史组' ? '历史' : '物理';
      subjects.push({ name:lead, score: Math.round(65 + Math.random()*35) });
      const pick = ['化学','生物','政治','地理'];
      const two = pick.sort(()=>Math.random()-0.5).slice(0,2);
      two.forEach(s => subjects.push({ name:s, score: Math.round(60 + Math.random()*40) }));
    } else if (province.rule === 'old') {
      const lead = group === '文科' ? '文综' : '理综';
      subjects.push({ name:lead, score: Math.round(180 + Math.random()*80) });
    }
    return { score, total, tier, rank, subjects, group };
  }

  // galgame 化反应台词
  const REACTIONS = {
    S: { mood:'ecstatic', emoji:'🏆', color:'#FFD700',
      lines:[
        '天……天哪！！你考了全省前列！这分数，连我都要跪下喊大佬了！',
        '这不是分数，这是你的勋章。恭喜你，今天的 C 位非你莫属！',
        '我宣布——本届"别人家的孩子"冠军，就是你了！',
      ]},
    A: { mood:'happy', emoji:'🌟', color:'#FFB347',
      lines:[
        '太棒了！这个分数，重点大学已经在向你招手了！',
        '稳！这分数漂亮得像你的未来一样亮眼。',
        '恭喜你！多年的努力，终于开花结果啦。',
      ]},
    B: { mood:'good', emoji:'👍', color:'#7EC8A3',
      lines:[
        '不错不错！这分数，好学校有的是机会，稳住别慌！',
        '踏踏实实的分数，意味着踏踏实实的未来。干得漂亮！',
        '别小看这个分数——很多逆袭故事，都是从这里开始的。',
      ]},
    C: { mood:'ok', emoji:'🙂', color:'#6FA6DC',
      lines:[
        '还行！这个分数选择面挺广的，咱们一起挑个最适合你的。',
        '不差！分数只是起点，志愿填得好，照样逆风翻盘。',
        '别灰心，志愿填报才是第二轮高考，你还有大招没放呢。',
      ]},
    D: { mood:'encourage', emoji:'💪', color:'#C09A6F',
      lines:[
        '别紧张——分数不能定义你。专科、本科，条条大路通罗马。',
        '我知道你可能有点失落，但请相信：人生的剧本，才刚翻到第二章。',
        '来，深呼吸。我们一起把这手牌，打出最好的结局。',
      ]},
    E: { mood:'warm', emoji:'🫂', color:'#B07AAC',
      lines:[
        '没关系，真的没关系。高考只是人生的一个小站，不是终点。',
        '你愿意面对这个分数，就已经很勇敢了。我陪着你，一步一步来。',
        '世界上成功的路有千万条，而你的故事，才刚刚开始。',
      ]},
  };

  function reactToScore(tier) {
    const r = REACTIONS[tier] || REACTIONS.C;
    const line = r.lines[Math.floor(Math.random()*r.lines.length)];
    return { ...r, line };
  }

  // 自动查分悬念序列（文案数组，按时间播放）
  const AUTO_SEQUENCE = [
    '好，把手机/屏幕放下，深呼吸三次……',
    '我现在帮你打开系统，你不用看，我盯着。',
    '连接中……正在和各省考试院同步……',
    '身份核验通过，找到了你的成绩。',
    '别紧张，无论多少分，你都值得被温柔对待。',
    '正在解密分数……3……',
    '2……',
    '1……',
    '好了。我帮你看了。',
    '现在，让我们一起面对它。',
  ];

  return { tierOf, generateFakeScore, reactToScore, AUTO_SEQUENCE };
})();
window.SCORE_CHECKER = SCORE_CHECKER;
