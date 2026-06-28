/**
 * 本科专业（学科门类 · 抽象化样本）
 * id      : 唯一标识
 * name    : 专业名
 * category: 学科门类
 * tags    : MBTI 倾向 / 兴趣标签（用于匹配）
 * desc    : 一句话介绍
 * groups  : 适配新高考选科组（'物理组'/'历史组'/'综合组'/'文理皆可'）
 */
const MAJORS = [
  // 工学
  { id:'cs',         name:'计算机科学与技术', category:'工学', tags:['逻辑','INTJ','INTP','ISTP','ENTJ'], groups:['物理组','综合组','理科'],  desc:'算法、系统、软件的根基学科。' },
  { id:'ai',         name:'人工智能',         category:'工学', tags:['逻辑','创造','INTJ','INTP','ENTP'],   groups:['物理组','综合组','理科'],  desc:'让机器学会思考的前沿方向。' },
  { id:'ee',         name:'电子信息工程',     category:'工学', tags:['逻辑','动手','ISTP','INTJ','ESTJ'],   groups:['物理组','综合组','理科'],  desc:'硬件、信号、通信的交叉学科。' },
  { id:'mechanical', name:'机械工程',         category:'工学', tags:['动手','ISTP','ESTJ','ESTP'],          groups:['物理组','综合组','理科'],  desc:'从图纸到实物的造物之路。' },
  { id:'civil',      name:'土木工程',         category:'工学', tags:['务实','ISTJ','ESTJ','ISTP'],          groups:['物理组','综合组','理科'],  desc:'建造城市与基础设施的基石。' },
  // 理学
  { id:'math',       name:'数学与应用数学',   category:'理学', tags:['逻辑','INTP','INTJ','ISTJ'],          groups:['物理组','综合组','理科'],  desc:'一切自然科学的语言。' },
  { id:'physics',    name:'物理学',           category:'理学', tags:['逻辑','INTP','INTJ'],                 groups:['物理组','综合组','理科'],  desc:'探究宇宙最根本的规律。' },
  // 经济管理
  { id:'finance',    name:'金融学',           category:'经济学', tags:['逻辑','ENTJ','INTJ','ESTJ','ESTP'], groups:['物理组','历史组','综合组','文理皆可'], desc:'资本、市场与风险的博弈。' },
  { id:'economics',  name:'经济学',           category:'经济学', tags:['逻辑','ENTP','ENTJ','INTP'],         groups:['物理组','历史组','综合组','文理皆可'], desc:'理解社会运转的底层逻辑。' },
  { id:'accounting', name:'会计学',           category:'管理学', tags:['细致','ISTJ','ISFJ','ESTJ'],         groups:['物理组','历史组','综合组','文理皆可'], desc:'把每一分钱都安排得明明白白。' },
  { id:'mgmt',       name:'工商管理',         category:'管理学', tags:['领导','ENTJ','ESTJ','ENTP','ENFP'], groups:['物理组','历史组','综合组','文理皆可'], desc:'组织、决策与人的艺术。' },
  // 法学
  { id:'law',        name:'法学',             category:'法学', tags:['逻辑','辩论','ENTJ','ENTP','INTJ'],   groups:['物理组','历史组','综合组','文理皆可'], desc:'维护秩序与正义的利器。' },
  // 文学 / 艺术
  { id:'literature', name:'汉语言文学',       category:'文学', tags:['创造','共情','INFP','INFJ','ENFP'],   groups:['历史组','综合组','文科'],  desc:'用文字丈量世界。' },
  { id:'media',      name:'新闻传播学',       category:'文学', tags:['社交','创造','ENFP','ENTP','ENFJ'],   groups:['历史组','综合组','文理皆可'], desc:'让真相与故事抵达更多人。' },
  { id:'art',        name:'美术学',           category:'艺术学', tags:['审美','创造','ISFP','INFP','ENFP'], groups:['物理组','历史组','综合组','文理皆可'], desc:'把感受变成可见的形状。' },
  { id:'design',     name:'视觉传达设计',     category:'艺术学', tags:['审美','创造','ISFP','ENFP','INFP'], groups:['物理组','历史组','综合组','文理皆可'], desc:'用美感解决问题。' },
  { id:'music',      name:'音乐学',           category:'艺术学', tags:['审美','创造','ISFP','ESFP','INFP'], groups:['物理组','历史组','综合组','文理皆可'], desc:'让情绪变成声音。' },
  // 教育学
  { id:'education',  name:'教育学',           category:'教育学', tags:['共情','领导','ENFJ','ISFJ','INFJ'], groups:['历史组','综合组','文理皆可'], desc:'点亮下一代的光。' },
  // 医学
  { id:'medicine',   name:'临床医学',         category:'医学', tags:['细致','共情','ISTJ','ISFJ','INTJ'],  groups:['物理组','综合组','理科'],  desc:'治病救人，责任与荣耀。' },
  { id:'nursing',    name:'护理学',           category:'医学', tags:['细致','共情','ISFJ','ESFJ','INFJ'],   groups:['物理组','历史组','综合组','文理皆可'], desc:'最贴近患者的温柔守护。' },
  // 心理学 / 社会学 / 哲学
  { id:'psychology', name:'心理学',           category:'理学', tags:['共情','逻辑','INFJ','INFP','INTP'],  groups:['物理组','历史组','综合组','文理皆可'], desc:'读懂人心，也读懂自己。' },
  { id:'sociology',  name:'社会学',           category:'法学', tags:['共情','逻辑','INFJ','ENFJ','ENTP'],   groups:['历史组','综合组','文理皆可'], desc:'理解群体如何生活与改变。' },
  { id:'philosophy', name:'哲学',             category:'哲学', tags:['逻辑','创造','INTP','INFJ','INFP'],   groups:['历史组','综合组','文科'],  desc:'追问存在与意义的学问。' },
];
window.MAJORS = MAJORS;
