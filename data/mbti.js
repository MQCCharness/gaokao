/**
 * MBTI 16 型人格 + 对应职业/专业倾向
 * 字段说明：
 *   type        : 四字母代码
 *   cn          : 中文名
 *   nick        : 昵称（galgame 化的人设标签）
 *   tagline     : 一句话 slogan
 *   strengths   : 性格优势
 *   careers     : 推荐职业方向
 *   majors      : 推荐本科专业（与 majors.js 中 id 关联）
 *   color       : 主题色（hex）
 *   emoji       : 表情标识
 *   quote       : galgame 风格台词
 */
const MBTI_TYPES = [
  {
    type:'INTJ', cn:'建筑师', nick:'孤独的战略家', tagline:'我看见的，是十年后的世界。',
    strengths:['长期规划','战略思维','独立专注','逻辑严密'],
    careers:['科研工作者','战略咨询','系统架构师','投资分析师','大学教授'],
    majors:['cs','ai','math','physics','finance'],
    color:'#5B7FB8', emoji:'♟️',
    quote:'别人在追潮，我在画地图。你愿意和我一起，走到终点吗？'
  },
  {
    type:'INTP', cn:'逻辑学家', nick:'拆解世界的怀疑者', tagline:'一切答案，都藏在提问里。',
    strengths:['抽象思维','理论建构','求真','创造'],
    careers:['理论物理','数据科学家','哲学家','软件研发','数学家'],
    majors:['cs','math','physics','ai','philosophy'],
    color:'#6C8AC0', emoji:'🔭',
    quote:'比起答案，我更喜欢问题本身。你的分数，也只是一个待解的题。'
  },
  {
    type:'ENTJ', cn:'指挥官', nick:'天生的统帅', tagline:'目标既定，万山无阻。',
    strengths:['领导力','决断','效率','战略'],
    careers:['创业者','企业管理','投行','律师','项目经理'],
    majors:['finance','mgmt','law','economics','cs'],
    color:'#3D6A9E', emoji:'⚔️',
    quote:'志愿表只是一张地图，真正的疆域，是你接下来的人生。'
  },
  {
    type:'ENTP', cn:'辩论家', nick:'永不疲倦的破壁人', tagline:'我质疑，所以我存在。',
    strengths:['创新','辩论','应变','洞察'],
    careers:['创业者','律师','产品经理','记者','战略顾问'],
    majors:['law','economics','mgmt','cs','media'],
    color:'#4A7DB5', emoji:'⚡',
    quote:'别说"只能这样"，我们一起把"不可能"撕开看看。'
  },
  {
    type:'INFJ', cn:'提倡者', nick:'温柔的理想主义者', tagline:'我想看见每个人的光。',
    strengths:['共情','洞察','理想','坚持'],
    careers:['心理咨询师','作家','教师','公益','医生'],
    majors:['psychology','literature','education','medicine','sociology'],
    color:'#9C6FB0', emoji:'🌙',
    quote:'你的紧张我都知道。深呼吸，分数不会定义你。'
  },
  {
    type:'INFP', cn:'调停者', nick:'追梦的诗人', tagline:'世界很大，我想温柔地活着。',
    strengths:['共情','创造','真诚','理想'],
    careers:['作家','艺术家','心理咨询','编辑','设计师'],
    majors:['literature','art','psychology','design','music'],
    color:'#B07AAC', emoji:'🌸',
    quote:'就算分数不完美，你的人生，依然可以是诗。'
  },
  {
    type:'ENFJ', cn:'主人公', nick:'温暖的组织者', tagline:'你的梦想，我也想守护。',
    strengths:['共情','领导','沟通','激励'],
    careers:['教师','HR','主播','公益领袖','医生'],
    majors:['education','psychology','media','medicine','sociology'],
    color:'#8A6FB0', emoji:'✨',
    quote:'走，我们一起把志愿表填成你想要的样子！'
  },
  {
    type:'ENFP', cn:'竞选者', nick:'快乐的探索者', tagline:'人生那么好玩，我全都要！',
    strengths:['热情','创造','社交','灵活'],
    careers:['主播','策划','创意','记者','演员'],
    majors:['media','art','design','literature','psychology'],
    color:'#C06FA0', emoji:'🎈',
    quote:'填报志愿也可以很有趣！来，跟我走一条快乐路线～'
  },
  {
    type:'ISTJ', cn:'物流师', nick:'可靠的执行者', tagline:'稳妥，是我对你的承诺。',
    strengths:['严谨','负责','细致','稳定'],
    careers:['会计','公务员','工程师','医生','审计'],
    majors:['accounting','civil','medicine','math','finance'],
    color:'#5B8A6F', emoji:'🛡️',
    quote:'查分这种事，交给我就好。我不会出错。'
  },
  {
    type:'ISFJ', cn:'守卫者', nick:'温柔的守护者', tagline:'你安心查分，剩下的我兜底。',
    strengths:['细致','负责','共情','可靠'],
    careers:['护士','教师','医生','社工','会计'],
    majors:['medicine','education','psychology','accounting','nursing'],
    color:'#6FA68A', emoji:'🌷',
    quote:'紧张吗？没关系，我在你身边，一步一步来。'
  },
  {
    type:'ESTJ', cn:'总经理', nick:'硬核的实干派', tagline:'计划之外的事，不存在。',
    strengths:['执行','管理','务实','果断'],
    careers:['公务员','管理','军官','金融','工程师'],
    majors:['mgmt','accounting','finance','civil','law'],
    color:'#3D8A7E', emoji:'📌',
    quote:'别犹豫，按表填，一步到位。'
  },
  {
    type:'ESFJ', cn:'执政官', nick:'贴心的管家', tagline:'我把一切都为你安排好。',
    strengths:['热情','负责','组织','关怀'],
    careers:['教师','医护','HR','活动策划','客服'],
    majors:['education','nursing','medicine','sociology','accounting'],
    color:'#6FA6A6', emoji:'🫖',
    quote:'你的志愿表，我会像照顾家人一样帮你打理。'
  },
  {
    type:'ISTP', cn:'鉴赏家', nick:'冷静的手艺人', tagline:'我只想把事情，做到极致。',
    strengths:['动手','分析','冷静','灵活'],
    careers:['工程师','机械','飞行员','外科医生','程序员'],
    majors:['mechanical','cs','civil','medicine','ee'],
    color:'#5B8A8A', emoji:'🔧',
    quote:'分数而已，拆开看看就好，别紧张。'
  },
  {
    type:'ISFP', cn:'探险家', nick:'安静的艺术家', tagline:'美，是我对抗世界的方式。',
    strengths:['审美','共情','灵活','真诚'],
    careers:['设计师','画家','音乐家','摄影师','舞者'],
    majors:['art','design','music','media','literature'],
    color:'#A06F8A', emoji:'🎨',
    quote:'填志愿也可以很美。来，我陪你慢慢选。'
  },
  {
    type:'ESTP', cn:'企业家', nick:'行动派冒险家', tagline:'想那么多干嘛，先干！',
    strengths:['行动','应变','社交','冒险'],
    careers:['销售','创业','体育','警察','交易员'],
    majors:['finance','mgmt','media','law','economics'],
    color:'#8A6F5B', emoji:'🔥',
    quote:'查分怕啥！点开就是，我陪你冲！'
  },
  {
    type:'ESFP', cn:'表演者', nick:'舞台中央的星星', tagline:'人生是场派对，我负责嗨！',
    strengths:['表演','社交','热情','活在当下'],
    careers:['演员','主播','活动策划','导游','化妆师'],
    majors:['music','art','media','design','literature'],
    color:'#C09A6F', emoji:'🌟',
    quote:'别愁眉苦脸啦！查完分，我们去庆祝！'
  },
];
window.MBTI_TYPES = MBTI_TYPES;
