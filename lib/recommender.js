/**
 * 志愿推荐引擎（纯前端规则推理 · demo 版）
 * 输入：{ province, group, score, total, mbtiType, interests[], visionId }
 * 输出：[ { university, major, matchScore, reason, stability } ... ] 排序后的志愿表
 *
 * 评分维度：
 *   1. 分数适配（冲/稳/保）—— 基于 referScore 与考生分
 *   2. 选科适配 —— group 与 major.groups 是否匹配
 *   3. MBTI 适配 —— major.tags 是否含该 MBTI 型
 *   4. 兴趣适配 —— interests 与 major.tags/INTEREST_TAGS 关键词重合
 *   5. 人生理想 —— visionId 推荐专业是否命中
 */

const RECOMMENDER = (() => {

  // 兴趣标签 -> 关键词映射（用于和专业 tags 对齐）
  const INTEREST_KEYWORDS = {
    logic:'逻辑', create:'创造', empathy:'共情', leader:'领导',
    hands:'动手', aesthetic:'审美', social:'社交', detail:'细致', debate:'辩论',
  };

  function norm(score, total){ return score / (total||750) * 750; }

  // 冲/稳/保 判定（基于考生分与该校参考分）
  function stabilityOf(studentNorm, uniNorm) {
    const diff = studentNorm - uniNorm;
    if (diff < -15) return { tag:'冲', en:'reach',   color:'#E07A7A', weight:0.6 };
    if (diff <  15) return { tag:'稳', en:'match',   color:'#7EC8A3', weight:1.0 };
    return                 { tag:'保', en:'safety',  color:'#6FA6DC', weight:0.85 };
  }

  // 选科组适配（0~1）
  function groupFit(major, group) {
    if (!group) return 0.5;
    if (!major.groups || major.groups.length===0) return 0.5;
    if (major.groups.includes(group)) return 1;
    if (major.groups.includes('文理皆可')) return 0.8;
    // 兜底：物理组≈理科/综合组；历史组≈文科/综合组
    const phyLike = (g)=> g==='物理组'||g==='理科'||g==='综合组';
    const hisLike = (g)=> g==='历史组'||g==='文科'||g==='综合组';
    if (group==='物理组' && major.groups.some(phyLike)) return 0.6;
    if (group==='历史组' && major.groups.some(hisLike)) return 0.6;
    return 0.2;
  }

  // MBTI 适配（0~1）
  function mbtiFit(major, mbtiType) {
    if (!mbtiType) return 0.5;
    if (major.tags.includes(mbtiType)) return 1;
    // 同 temperament（NT/NF/SP/SJ）部分加分
    const temper = (t)=>{
      if (['INTJ','INTP','ENTJ','ENTP'].includes(t)) return 'NT';
      if (['INFJ','INFP','ENFJ','ENFP'].includes(t)) return 'NF';
      if (['ISTP','ISFP','ESTP','ESFP'].includes(t)) return 'SP';
      return 'SJ';
    };
    const sameTemper = major.tags.some(tag => temper(tag)===temper(mbtiType) && tag.length===4);
    return sameTemper ? 0.7 : 0.3;
  }

  // 兴趣适配（0~1）
  function interestFit(major, interests) {
    if (!interests || interests.length===0) return 0.5;
    const kws = interests.map(i => INTEREST_KEYWORDS[i]).filter(Boolean);
    if (kws.length===0) return 0.5;
    const hit = kws.filter(k => major.tags.includes(k)).length;
    return 0.3 + 0.7 * (hit / kws.length);
  }

  // 人生理想适配
  function visionFit(major, visionId) {
    if (!visionId) return 0.5;
    const v = CAREER_VISIONS.find(c => c.id===visionId);
    if (!v) return 0.5;
    return v.majors.includes(major.id) ? 1 : 0.3;
  }

  // 是否该校王牌专业
  function isStrong(uni, majorId){ return (uni.strongMajors||[]).includes(majorId); }

  function recommend(input) {
    const { province, group, score, total, mbtiType, interests=[], visionId, mentorObj } = input;
    const sNorm = norm(score, total);

    // —— 导师 buff 解析 ——
    // 不同导师加权不同维度，让"出战导师"真实影响结果
    const buff = mentorObj?.passive?.key;
    const buffW = mentorObj?.passive?.weight || 0;
    // 默认权重；受 buff 增益
    const W = {
      score:    0.45,
      major:    0.55,  // 选科/mbti/兴趣/理想合成
      reach:    0,     // 额外：冲档偏好
      match:    0,     // 额外：稳档偏好
      luck:     0,     // 玄学微调
    };
    if (buff === 'score')     W.score += buffW;
    if (buff === 'mbti')      /* 加在 major 内部 */;
    if (buff === 'vision')    /* 加在 major 内部 */;
    if (buff === 'reach')     W.reach = buffW;
    if (buff === 'stability') W.match = buffW;
    if (buff === 'luck')      W.luck = buffW;

    // —— 决定每条志愿稀有度（用于开宝箱视觉）——
    function rarityOf(matchScore, stab, uni) {
      const s = matchScore + (stab.en==='reach'?6:0) + (uni.tier==='985'?8:uni.tier==='211'?5:0);
      if (s >= 95) return 'SSR';
      if (s >= 85) return 'SR';
      return 'R';
    }

    const results = [];
    for (const uni of UNIVERSITIES) {
      const uNorm = norm(uni.referScore, 750);
      const stab = stabilityOf(sNorm, uNorm);
      if (stab.en==='reach' && (sNorm - uNorm) < -40) continue;
      if (stab.en==='safety' && (sNorm - uNorm) > 120) continue;

      const majorScores = MAJORS.map(m => {
        let gf = groupFit(m, group);
        let mf = mbtiFit(m, mbtiType);
        let iff = interestFit(m, interests);
        let vf = visionFit(m, visionId);
        // 导师内部 buff
        if (buff === 'mbti')   mf = Math.min(1, mf + buffW);
        if (buff === 'vision') vf = Math.min(1, vf + buffW*0.8);
        const strong = isStrong(uni, m.id) ? 1 : 0.6;
        const ms = gf*0.30 + mf*0.20 + iff*0.20 + vf*0.15 + strong*0.15;
        return { major:m, score:ms, detail:{ gf, mf, iff, vf, strong } };
      }).sort((a,b)=>b.score-a.score);

      const best = majorScores[0];
      if (!best) continue;

      let totalScore = stab.weight * W.score + best.score * W.major;
      // 导师档位偏好
      if (W.reach && stab.en==='reach') totalScore += W.reach * 0.4;
      if (W.match && stab.en==='match') totalScore += W.match * 0.4;
      // 玄学随机微调
      if (W.luck) totalScore += (Math.random()-0.5) * W.luck * 0.3;

      if (best.detail.gf < 0.4) continue;

      const matchScore = Math.max(20, Math.min(99, Math.round(totalScore*100)));
      const rarity = rarityOf(matchScore, stab, uni);

      results.push({
        university: uni,
        major: best.major,
        matchScore,
        rarity,
        stability: stab,
        detail: best.detail,
        reason: buildReason(uni, best.major, stab, best.detail, { mbtiType, interests, visionId, group }),
      });
    }

    results.sort((a,b) => b.matchScore - a.matchScore);

    // 分桶：保证 冲/稳/保 结构（受导师 reach/stability buff 影响配额）
    const bucket = { reach:[], match:[], safety:[] };
    results.forEach(r => bucket[r.stability.en].push(r));
    const reachN = W.reach ? 3 : 2;
    const safetyN = 3;
    const picked = [
      ...bucket.match.slice(0,5),
      ...bucket.reach.slice(0,reachN),
      ...bucket.safety.slice(0,safetyN),
    ].sort((a,b)=>b.matchScore-a.matchScore);

    return picked.slice(0, 10);
  }

  function buildReason(uni, major, stab, d, ctx) {
    const parts = [];
    parts.push(`${stab.tag}：你的分数相对该校参考线${stab.en==='reach'?'略低，值得一搏':stab.en==='match'?'相仿，录取较稳':'有富余，保底很稳'}。`);
    if (d.gf >= 0.9) parts.push(`${major.name}的选科要求与你的${ctx.group||'选科'}高度契合。`);
    if (d.mf >= 0.9 && ctx.mbtiType) parts.push(`专业气质与你的${ctx.mbtiType}人格非常合拍。`);
    if (d.iff > 0.6) parts.push(`贴合你选择的兴趣方向。`);
    if (d.vf >= 0.9 && ctx.visionId) parts.push(`指向你向往的人生方向。`);
    if (d.strong >= 0.9) parts.push(`且是${uni.name}的王牌专业。`);
    return parts.join(' ');
  }

  return { recommend };
})();
window.RECOMMENDER = RECOMMENDER;
