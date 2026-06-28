/**
 * 职业生涯 / 人生理想 数据
 * - CAREER_VISIONS: 12 种人生理想方向（galgame 化命名）
 * - INTEREST_TAGS : 兴趣标签（用于和专业匹配）
 */
const CAREER_VISIONS = [
  { id:'scholar',    name:'学术攀登者', emoji:'📚', color:'#5B7FB8', desc:'在象牙塔里钻研真理，论文即浪漫。',
    mbti:['INTJ','INTP','INFJ'], majors:['math','physics','philosophy','cs','psychology'] },
  { id:'builder',    name:'城市建造师', emoji:'🏗️', color:'#8A6F5B', desc:'亲手把钢筋水泥变成城市天际线。',
    mbti:['ISTJ','ESTJ','ISTP'], majors:['civil','mechanical','ee','architecture'] },
  { id:'healer',     name:'生命守护者', emoji:'⚕️', color:'#6FA68A', desc:'用医术和温柔，对抗疾病与绝望。',
    mbti:['ISFJ','INFJ','ISTJ'], majors:['medicine','nursing','psychology'] },
  { id:'creator',    name:'创意精灵', emoji:'🎨', color:'#A06F8A', desc:'让美和想象力，渗透进每个人日常。',
    mbti:['INFP','ISFP','ENFP'], majors:['art','design','music','literature','media'] },
  { id:'leader',     name:'组织指挥官', emoji:'🎯', color:'#3D6A9E', desc:'带领团队攻坚克难，把目标变成现实。',
    mbti:['ENTJ','ESTJ','ENFJ'], majors:['mgmt','finance','law','economics'] },
  { id:'explorer',   name:'世界探索者', emoji:'🧭', color:'#3D8A7E', desc:'读万卷书，行万里路，永远在路上。',
    mbti:['ENFP','ENTP','ISFP'], majors:['media','sociology','literature','geography'] },
  { id:'coder',      name:'数字造梦师', emoji:'💻', color:'#5B8A8A', desc:'用代码构建虚拟世界，用算法改变现实。',
    mbti:['INTJ','INTP','ISTP'], majors:['cs','ai','ee','math'] },
  { id:'educator',   name:'灵魂园丁', emoji:'🌱', color:'#6FA6A6', desc:'把知识的种子，种进每一颗心。',
    mbti:['ENFJ','ISFJ','INFJ'], majors:['education','psychology','literature'] },
  { id:'dealmaker',  name:'市场博弈者', emoji:'💹', color:'#C09A6F', desc:'在资本的浪潮里冲浪，谈笑间风生水起。',
    mbti:['ENTJ','ESTP','INTJ'], majors:['finance','economics','accounting','law'] },
  { id:'advocate',   name:'正义之声', emoji:'⚖️', color:'#4A7DB5', desc:'为弱者发声，为秩序守住底线。',
    mbti:['ENTJ','ENTP','INFJ'], majors:['law','sociology','media'] },
  { id:'storyteller',name:'故事讲述者', emoji:'📖', color:'#B07AAC', desc:'用文字和影像，记录这个时代的故事。',
    mbti:['INFP','ENFP','INFJ'], majors:['literature','media','art','music'] },
  { id:'handson',    name:'动手实干家', emoji:'🔧', color:'#5B8A6F', desc:'不空谈，只把东西做出来、修好、跑起来。',
    mbti:['ISTP','ESTP','ESTJ'], majors:['mechanical','ee','civil','cs'] },
];

const INTEREST_TAGS = [
  { id:'logic',      name:'逻辑推理', emoji:'🧩' },
  { id:'create',     name:'创造想象', emoji:'💡' },
  { id:'empathy',    name:'共情关怀', emoji:'💗' },
  { id:'leader',     name:'领导组织', emoji:'🚩' },
  { id:'hands',      name:'动手实操', emoji:'🛠️' },
  { id:'aesthetic',  name:'审美艺术', emoji:'🎨' },
  { id:'social',     name:'社交表达', emoji:'🗣️' },
  { id:'detail',     name:'细致严谨', emoji:'🔬' },
  { id:'debate',     name:'思辨辩论', emoji:'⚔️' },
];
window.CAREER_VISIONS = CAREER_VISIONS;
window.INTEREST_TAGS = INTEREST_TAGS;
