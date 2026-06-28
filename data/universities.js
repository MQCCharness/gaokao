/**
 * 高校样本（按 tier 分层）
 * tier:
 *   - '985'/'211'/'double-first' : 重点
 *   - 'public'                   : 公办本科
 *   - 'private'                  : 民办本科
 *   - 'vocational'               : 高职专科
 * referScore: 参考录取分（旧高考/综合组口径，满分 750；用于演示排序）
 * regions   : 招生区域偏好（空表示全国）
 * strongMajors: 王牌专业 id
 */
const UNIVERSITIES = [
  // —— 顶尖 ——
  { id:'pku',   name:'北京大学',     tier:'985', region:'北京', referScore:695, strongMajors:['literature','philosophy','math','physics','economics','law','medicine'] },
  { id:'thu',   name:'清华大学',     tier:'985', region:'北京', referScore:693, strongMajors:['cs','ai','ee','civil','math','physics','mgmt'] },
  { id:'fudan', name:'复旦大学',     tier:'985', region:'上海', referScore:688, strongMajors:['economics','literature','philosophy','medicine','media'] },
  { id:'sjtu',  name:'上海交通大学', tier:'985', region:'上海', referScore:690, strongMajors:['cs','ai','ee','mechanical','medicine','finance'] },
  { id:'zju',   name:'浙江大学',     tier:'985', region:'浙江', referScore:685, strongMajors:['cs','ai','ee','civil','psychology','design'] },
  { id:'nju',   name:'南京大学',     tier:'985', region:'江苏', referScore:682, strongMajors:['cs','math','physics','literature','astronomy','philosophy'] },
  { id:'ustc',  name:'中国科学技术大学', tier:'985', region:'安徽', referScore:683, strongMajors:['physics','math','cs','ai'] },
  { id:'whu',   name:'武汉大学',     tier:'985', region:'湖北', referScore:672, strongMajors:['law','media','literature','cs','surveying','biology'] },
  { id:'hust',  name:'华中科技大学', tier:'985', region:'湖北', referScore:670, strongMajors:['cs','ee','mechanical','medicine','civil'] },
  { id:'scu',   name:'四川大学',     tier:'985', region:'四川', referScore:660, strongMajors:['medicine','literature','math','dental','materials'] },
  { id:'sysu',  name:'中山大学',     tier:'985', region:'广东', referScore:668, strongMajors:['medicine','economics','literature','philosophy','biology'] },
  { id:'xjtu',  name:'西安交通大学', tier:'985', region:'陕西', referScore:665, strongMajors:['ee','mechanical','mgmt','civil','cs'] },
  { id:'hit',   name:'哈尔滨工业大学', tier:'985', region:'黑龙江', referScore:662, strongMajors:['mechanical','ee','cs','civil','aerospace'] },
  { id:'tongji',name:'同济大学',     tier:'985', region:'上海', referScore:668, strongMajors:['civil','cs','ee','medicine','design'] },
  // —— 211 ——
  { id:'buaa',  name:'北京航空航天大学', tier:'211', region:'北京', referScore:670, strongMajors:['cs','ai','ee','mechanical','aerospace'] },
  { id:'bit',   name:'北京理工大学', tier:'211', region:'北京', referScore:665, strongMajors:['cs','ee','mechanical','chemistry'] },
  { id:'ccnu',  name:'华东师范大学', tier:'211', region:'上海', referScore:655, strongMajors:['education','psychology','literature','geography'] },
  { id:'swjtu', name:'西南交通大学', tier:'211', region:'四川', referScore:615, strongMajors:['civil','mechanical','ee','transport'] },
  { id:'scnu',  name:'华南师范大学', tier:'211', region:'广东', referScore:600, strongMajors:['education','psychology','literature'] },
  { id:'scmu',  name:'南方医科大学', tier:'211', region:'广东', referScore:610, strongMajors:['medicine','nursing'] },
  { id:'cul',   name:'中国政法大学', tier:'211', region:'北京', referScore:645, strongMajors:['law','sociology'] },
  { id:'cufe',  name:'中央财经大学', tier:'211', region:'北京', referScore:648, strongMajors:['finance','accounting','economics'] },
  { id:'suibe', name:'上海财经大学', tier:'211', region:'上海', referScore:645, strongMajors:['finance','accounting','economics'] },
  { id:'xmu',   name:'厦门大学',     tier:'211', region:'福建', referScore:640, strongMajors:['finance','accounting','economics','media'] },
  { id:'dlnu',  name:'大连海事大学', tier:'211', region:'辽宁', referScore:580, strongMajors:['transport','law','cs'] },
  // —— 双一流/重点省属 ——
  { id:'snnu',  name:'陕西师范大学', tier:'double-first', region:'陕西', referScore:580, strongMajors:['education','literature','psychology'] },
  { id:'hunnu', name:'湖南师范大学', tier:'double-first', region:'湖南', referScore:570, strongMajors:['education','literature','medicine'] },
  { id:'xjtu2', name:'西北大学',     tier:'double-first', region:'陕西', referScore:565, strongMajors:['archaeology','geology','economics'] },
  { id:'scmu2', name:'广州大学',     tier:'public', region:'广东', referScore:540, strongMajors:['civil','cs','education'] },
  { id:'shnu',  name:'上海师范大学', tier:'public', region:'上海', referScore:535, strongMajors:['education','literature','art'] },
  // —— 普通公办本科 ——
  { id:'qhnu',  name:'青海师范大学', tier:'public', region:'青海', referScore:440, strongMajors:['education','literature','math'] },
  { id:'nxu',   name:'宁夏大学',     tier:'211', region:'宁夏', referScore:480, strongMajors:['cs','agriculture','literature'] },
  { id:'xju',   name:'新疆大学',     tier:'211', region:'新疆', referScore:485, strongMajors:['cs','chemistry','literature'] },
  { id:'shutle',name:'上海工程技术大学', tier:'public', region:'上海', referScore:500, strongMajors:['mechanical','cs','design'] },
  { id:'cdsm',  name:'成都信息工程大学', tier:'public', region:'四川', referScore:520, strongMajors:['cs','ee','meteorology'] },
  // —— 民办 ——
  { id:'wkjx',  name:'武昌首义学院', tier:'private', region:'湖北', referScore:430, strongMajors:['cs','accounting','design'] },
  { id:'sdju',  name:'上海建桥学院', tier:'private', region:'上海', referScore:420, strongMajors:['cs','design','media'] },
  // —— 高职专科 ——
  { id:'shpc',  name:'深圳职业技术大学', tier:'vocational', region:'广东', referScore:410, strongMajors:['cs','ee','design','nursing'] },
  { id:'bjpc',  name:'北京电子科技职业学院', tier:'vocational', region:'北京', referScore:400, strongMajors:['cs','ee','accounting'] },
  { id:'gzpc',  name:'广州番禺职业技术学院', tier:'vocational', region:'广东', referScore:380, strongMajors:['design','cs','nursing'] },
];
window.UNIVERSITIES = UNIVERSITIES;
