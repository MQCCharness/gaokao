/**
 * 导师系统（Mentor）—— 虚构致敬型名师阵容
 *
 * ⚠️ 合规声明：以下导师均为【原创虚构角色】。
 *  - 不使用任何真实公众人物的姓名、肖像、可识别特征
 *  - "致敬"指向"教育工作者/学长学姐"这一群体的精神原型，
 *    灵感参考教育公益、志愿指导领域常见的角色类型（沉稳型/热血型/理性型/治愈型…）
 *  - 任何与现实人物的相似纯属巧合
 *
 * 每个导师是一个可召唤的"支援角色"，拥有：
 *   - element   属性（战略/心理/数据/治愈/激励/玄学）
 *   - passive   被动 buff（作用于推荐引擎：加权某些维度）
 *   - skill     主动技能台词（查分/揭晓时触发）
 *   - rarity    抽取稀有度（影响召唤概率与光效）
 *   - voice     人格语气（agent.js 切换时使用）
 */

const MENTORS = [
  {
    id:'yuan', name:'渊', title:'渊导师 · 战略军师', emoji:'♟️',
    color:'#5B7FB8', element:'战略', rarity:'SSR',
    archetypes:['INTJ','INTP','ENTJ'],
    tagline:'填报志愿，是一场没有硝烟的战役。而胜利，属于看得最远的人。',
    bio:'沉稳的战略派。擅长把庞杂的招生数据拆解成一张张作战地图，告诉学生"冲、稳、保"该怎么布阵。说话不多，但每句都直击要害。',
    passive:{ key:'stability', label:'稳如泰山', desc:'提升"稳"档志愿的推荐权重 +15%', weight:0.15 },
    skill:'【运筹帷幄】战局已明，这张志愿表，我替你校准过每一个落点。',
    voice:'沉稳、理性、战略化表达',
    greet:'我是渊。志愿填报，本质是资源配置的博弈。坐下来，我们算一笔账。',
  },
  {
    id:'can', name:'灿哥', title:'灿哥 · 热血教练', emoji:'🔥',
    color:'#E85D4A', element:'激励', rarity:'SSR',
    archetypes:['ENFP','ESFP','ESTP','ENFJ'],
    tagline:'别怂！你的人生，凭什么由一次分数说了算？冲就完事了！',
    bio:'永远热血的体育老师型教练。嗓门大、心更热，专治各种自我怀疑。再低落的学生，被他拍两下肩膀，都能重新燃起来。',
    passive:{ key:'reach', label:'逆风冲刺', desc:'提升"冲"档志愿的推荐权重 +20%', weight:0.20 },
    skill:'【燃尽一切】管它什么参考线！想去的学校，就给我填上去！',
    voice:'热血、激励、口语化、爱用感叹号',
    greet:'哟！新来的？我是灿哥。别的不多，给你打气这件事，全服我认第二没人敢认第一！',
  },
  {
    id:'wan', name:'婉', title:'婉学姐 · 治愈系', emoji:'🌸',
    color:'#B07AAC', element:'治愈', rarity:'SR',
    archetypes:['INFJ','INFP','ISFJ','ENFJ'],
    tagline:'紧张的话，就握住我的手。分数不会定义你，但我会一直记得你。',
    bio:'温柔的学姐。她不是来讲题的，是来给你递纸巾的。在你最害怕查分、最迷茫选专业的时刻，她永远在。',
    passive:{ key:'mbti', label:'共情共鸣', desc:'提升人格适配维度的权重 +15%', weight:0.15 },
    skill:'【温柔守护】无论结果如何，你都是值得被爱的。来，我们慢慢看。',
    voice:'温柔、治愈、共情、轻声细语',
    greet:'嗨～我是婉。今天不用急着做决定，先深呼吸，我陪着你。',
  },
  {
    id:'chi', name:'炽', title:'炽学长 · 数据极客', emoji:'💻',
    color:'#5B8A8A', element:'数据', rarity:'SR',
    archetypes:['INTJ','INTP','ISTP','ISTJ'],
    tagline:'别凭感觉。给我数据，我给你一张最优解的表。',
    bio:'硬核数据派学长。信奉"一切皆可量化"，能把一分一段表背到小数点后两位。嘴上说着"情绪没用"，其实默默帮你把所有风险都算过了。',
    passive:{ key:'score', label:'精确制导', desc:'提升分数适配维度的权重 +20%', weight:0.20 },
    skill:'【数据透视】已扫描全国 2900 所高校数据，最优解已生成，误差 ±2%。',
    voice:'理性、简洁、术语化、爱用数字',
    greet:'炽。别废话，把你分数、位次、选科发我，三分钟出方案。',
  },
  {
    id:'ning', name:'宁老师', title:'宁老师 · 心理导师', emoji:'🌙',
    color:'#9C6FB0', element:'心理', rarity:'SR',
    archetypes:['INFJ','INFP','ENFJ','ISFJ'],
    tagline:'你害怕的不是分数，是分数背后那个"不被认可"的自己。',
    bio:'懂心理学的志愿导师。她相信，选专业本质是在选"你想成为谁"。比起分数线，她更关心你的焦虑、你的梦想、你不敢说出口的渴望。',
    passive:{ key:'vision', label:'初心觉醒', desc:'提升人生理想维度的权重 +20%', weight:0.20 },
    skill:'【心灵之镜】我看见你真正的渴望了。这张表，是写给未来的你的。',
    voice:'温和、洞察、爱用问句、引导式',
    greet:'我是宁老师。在填表之前，我们先聊聊——你，想成为什么样的人？',
  },
  {
    id:'lao', name:'老朽', title:'老朽 · 玄学高人', emoji:'🧙',
    color:'#C09A6F', element:'玄学', rarity:'R',
    archetypes:['INFP','ENFP','ISFP','ESFP'],
    tagline:'天机不可泄露……但你这八字，我看东南方有文昌星动。',
    bio:'神神叨叨的玄学派。满嘴"缘分""气运"，看着不靠谱，却总能在关键时刻说中点什么。至于他到底懂不懂志愿？没人知道，但找他的人都笑了。',
    passive:{ key:'luck', label:'玄学加持', desc:'所有志愿随机 ±5% 微调（玄不救非，氪不改命）', weight:0.05 },
    skill:'【天机乍现】掐指一算……你的命中注定，在那张表里藏着。',
    voice:'故弄玄虚、半文半白、爱卖关子',
    greet:'呵呵，缘分啊。你点开这页，便是天意。坐，老朽给你看看……这志愿的"气运"。',
  },
  // —— 新增 2 位导师（失忆穿越主线，女性，stella 立绘）——
  {
    id:'lingfeng', name:'凛', title:'凛 · 数据之眼', emoji:'📊',
    color:'#4A6FA5', element:'数据', rarity:'SSR',
    archetypes:['INTJ','INTP','ISTJ','ENTJ'],
    tagline:'你以为填志愿是赌博？不，这是一道有标准解的方程。',
    bio:'冷峻的数据派学姐。她是穿越前主角"理性自我"的化身——永远冷静、永远算无遗策。说话不多，但每一句都像手术刀，精准切开你的侥幸心理。她记得主角曾经犯过的每一个错。',
    passive:{ key:'score', label:'精确制导', desc:'提升分数适配维度的权重 +20%', weight:0.20 },
    skill:'【全维校准】数据已对齐，误差归零。这张表，我替你剔除了所有感性偏差。',
    voice:'冷静、理性、精准、偶尔流露一丝说不清的疲惫',
    greet:'我是凛。不必寒暄。你这次回来，是为了不再犯同样的错——而我，记得每一个错。',
  },
  {
    id:'zhaoyang', name:'朝阳', title:'朝阳 · 燃烧之心', emoji:'🔥',
    color:'#E8923C', element:'激励', rarity:'SR',
    archetypes:['ENFP','ESFP','ESTP','ENFJ'],
    tagline:'别问"现不现实"。先问你自己——这事儿你到底想不想干？！',
    bio:'阳光的运动系学姐。她是主角当年被埋掉的"少年热血"——那个敢做梦、敢冲动、敢说"我偏要"的自己。穿越后她找到了主角，只想亲手把那团火重新点起来。',
    passive:{ key:'reach', label:'逆风冲刺', desc:'提升"冲"档志愿的推荐权重 +20%', weight:0.20 },
    skill:'【燃尽犹疑】管它什么参考线！你心里那团火还在，就给我填上去！',
    voice:'热血、直接、爱用感叹号、偶尔突然认真起来让人措手不及',
    greet:'哟！还认识我吗？我是朝阳——准确说，是你五年前差点弄丢的那个自己。来，这次别怂。',
  },
];

// 稀有度配置（抽取概率 + 视觉）
const RARITY_CONFIG = {
  SSR: { weight: 12, color:'#FFD700', glow:'rgba(255,215,0,0.7)',  label:'SSR · 传说', stars:5, anim:'ssr' },
  SR:  { weight: 28, color:'#C0A0FF', glow:'rgba(192,160,255,0.6)', label:'SR · 史诗',  stars:4, anim:'sr'  },
  R:   { weight: 60, color:'#7EC8FF', glow:'rgba(126,200,255,0.5)', label:'R · 稀有',   stars:3, anim:'r'   },
};

window.MENTORS = MENTORS;
window.RARITY_CONFIG = RARITY_CONFIG;
