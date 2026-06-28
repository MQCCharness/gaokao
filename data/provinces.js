/**
 * 全国 34 省级行政区高考规则数据
 * rule:
 *   - 'old'        : 旧高考 文/理
 *   - 'new-3-3'    : 新高考 3+3（6 选 3）
 *   - 'new-3-1-2'  : 新高考 3+1+2（物理/历史 + 4 选 2）
 * total: 满分（旧 750，新 750）
 * batches: 批次名称
 * 注：数据为通用化抽象，用于交互演示；真实填报以各省考试院当年文件为准。
 */
const PROVINCES = [
  // —— 新高考 3+1+2（物理/历史组）——
  { code: 'hebei',     name: '河北', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'liaoning',  name: '辽宁', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'jiangsu',   name: '江苏', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'fujian',    name: '福建', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'hubei',     name: '湖北', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'hunan',     name: '湖南', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'guangdong', name: '广东', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'chongqing', name: '重庆', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'heilongjiang', name: '黑龙江', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'], groups: ['物理组','历史组'] },
  { code: 'gansu',     name: '甘肃', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'jilin',     name: '吉林', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'anhui',     name: '安徽', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'jiangxi',   name: '江西', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'henan',     name: '河南', rule: 'new-3-1-2', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['物理组','历史组'] },
  { code: 'guangxi',   name: '广西', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  { code: 'guizhou',   name: '贵州', rule: 'new-3-1-2', total: 750, batches: ['本科批','专科批'],     groups: ['物理组','历史组'] },
  // —— 新高考 3+3 ——
  { code: 'shanghai',  name: '上海', rule: 'new-3-3', total: 660, batches: ['本科批','专科批'], groups: ['综合组'] },
  { code: 'zhejiang',  name: '浙江', rule: 'new-3-3', total: 750, batches: ['普通类一段','普通类二段'], groups: ['综合组'] },
  { code: 'beijing',   name: '北京', rule: 'new-3-3', total: 750, batches: ['本科批','专科批'], groups: ['综合组'] },
  { code: 'tianjin',   name: '天津', rule: 'new-3-3', total: 750, batches: ['本科批A','本科批B'], groups: ['综合组'] },
  { code: 'shandong',  name: '山东', rule: 'new-3-3', total: 750, batches: ['常规批一段','常规批二段'], groups: ['综合组'] },
  { code: 'hainan',    name: '海南', rule: 'new-3-3', total: 900, batches: ['本科批','专科批'], groups: ['综合组'] },
  // —— 旧高考 文/理 ——
  { code: 'neimenggu', name: '内蒙古', rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'shanxi',    name: '山西',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'ningxia',   name: '宁夏',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'qinghai',   name: '青海',   rule: 'old', total: 750, batches: ['本科一段','本科二段','专科批'], groups: ['文科','理科'] },
  { code: 'xinjiang',  name: '新疆',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'xizang',    name: '西藏',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'yunnan',    name: '云南',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'shaanxi',   name: '陕西',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  { code: 'sichuan',   name: '四川',   rule: 'old', total: 750, batches: ['本科一批','本科二批','专科批'], groups: ['文科','理科'] },
  // 特殊
  { code: 'taiwan',    name: '台湾',   rule: 'other', total: 0,   batches: ['繁星','个人申请','分发'], groups: ['不分文理'] },
  { code: 'xianggang', name: '香港',   rule: 'other', total: 0,   batches: ['JUPAS'], groups: ['综合'] },
  { code: 'aomen',     name: '澳门',   rule: 'other', total: 0,   batches: ['联招'], groups: ['综合'] },
];
window.PROVINCES = PROVINCES;
