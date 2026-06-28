/**
 * 片头快闪数据 —— 名校标志性建筑「原创 SVG 剪影」
 *
 * ⚠️ 合规声明：
 *   以下建筑剪影均为【原创矢量绘制】，参照公共可见的建筑外轮廓二次创作，
 *   不含任何高校官方校徽、商标、受著作权保护的图形元素。
 *   建筑剪影属公共景观的原创演绎，规避商标/著作权风险。
 *   辨识度来自标志性建筑的造型特征，而非受保护的官方标识。
 *
 * 每项：name 校名 / landmark 标志建筑名 / svg 原创剪影路径 / c1 主色 / c2 副色 / est 建校年
 * SVG viewBox 统一 0 0 100 100，便于缩放对齐
 */
const INTRO_LANDMARKS = [
  {
    name:'北京大学', landmark:'博雅塔', region:'北京', tier:'985', est:'1898',
    c1:'#94070A', c2:'#D4AF37',
    // 博雅塔：八角密檐式砖塔轮廓
    svg:`<g fill="currentColor">
      <path d="M50 12 L54 18 L54 22 L56 26 L56 30 L58 34 L58 78 L42 78 L42 34 L44 30 L44 26 L46 22 L46 18 Z"/>
      <rect x="46" y="78" width="8" height="6"/>
      <rect x="44" y="84" width="12" height="6"/>
      <path d="M48 20 L52 20 L52 24 L48 24 Z" opacity=".4"/>
    </g>
    <g stroke="currentColor" stroke-width="1.5" fill="none" opacity=".7">
      <line x1="44" y1="34" x2="56" y2="34"/>
      <line x1="43" y1="44" x2="57" y2="44"/>
      <line x1="42" y1="54" x2="58" y2="54"/>
      <line x1="42" y1="64" x2="58" y2="64"/>
    </g>`,
  },
  {
    name:'清华大学', landmark:'二校门', region:'北京', tier:'985', est:'1911',
    c1:'#660874', c2:'#D4AF37',
    // 二校门：汉白玉石牌坊式大门
    svg:`<g fill="currentColor">
      <rect x="20" y="30" width="60" height="6"/>
      <path d="M22 36 L22 76 L30 76 L30 44 L42 44 L42 76 L50 76 L50 40 L50 76 L58 76 L58 44 L70 44 L70 76 L78 76 L78 36 Z"/>
      <path d="M18 28 Q50 14 82 28 L82 32 L18 32 Z"/>
      <rect x="46" y="48" width="8" height="28" opacity=".5"/>
    </g>`,
  },
  {
    name:'复旦大学', landmark:'光华楼', region:'上海', tier:'985', est:'1905',
    c1:'#0A4C92', c2:'#C0C0C0',
    // 光华楼：双子塔
    svg:`<g fill="currentColor">
      <rect x="30" y="20" width="16" height="62"/>
      <rect x="54" y="20" width="16" height="62"/>
      <path d="M28 20 L34 14 L42 14 L48 20 Z"/>
      <path d="M52 20 L58 14 L66 14 L72 20 Z"/>
      <rect x="20" y="78" width="60" height="6"/>
    </g>
    <g stroke="#fff" stroke-width=".6" opacity=".5">
      <line x1="33" y1="30" x2="43" y2="30"/><line x1="33" y1="40" x2="43" y2="40"/>
      <line x1="33" y1="50" x2="43" y2="50"/><line x1="33" y1="60" x2="43" y2="60"/>
      <line x1="57" y1="30" x2="67" y2="30"/><line x1="57" y1="40" x2="67" y2="40"/>
      <line x1="57" y1="50" x2="67" y2="50"/><line x1="57" y1="60" x2="67" y2="60"/>
    </g>`,
  },
  {
    name:'上海交通大学', landmark:'老校门', region:'上海', tier:'985', est:'1896',
    c1:'#0B3D2E', c2:'#D4AF37',
    svg:`<g fill="currentColor">
      <path d="M30 30 L30 76 L42 76 L42 50 L58 50 L58 76 L70 76 L70 30 L62 30 L62 24 L38 24 L38 30 Z"/>
      <path d="M26 28 L50 16 L74 28 L74 32 L26 32 Z"/>
      <rect x="20" y="78" width="60" height="4"/>
      <rect x="46" y="56" width="8" height="20" opacity=".5"/>
    </g>`,
  },
  {
    name:'浙江大学', landmark:'求是鹰钟楼', region:'浙江', tier:'985', est:'1897',
    c1:'#0A6E3D', c2:'#D4AF37',
    // 钟楼
    svg:`<g fill="currentColor">
      <rect x="40" y="40" width="20" height="40"/>
      <path d="M36 40 L50 18 L64 40 Z"/>
      <circle cx="50" cy="32" r="6" fill="#06030f"/>
      <rect x="46" y="80" width="8" height="4"/>
      <rect x="32" y="84" width="36" height="4"/>
    </g>
    <g stroke="currentColor" stroke-width="1" opacity=".8">
      <line x1="50" y1="46" x2="50" y2="50"/>
      <line x1="50" y1="30" x2="53" y2="32"/>
    </g>`,
  },
  {
    name:'南京大学', landmark:'北大楼', region:'江苏', tier:'985', est:'1902',
    c1:'#6E0A6A', c2:'#C0C0C0',
    // 北大楼（红砖塔楼）
    svg:`<g fill="currentColor">
      <rect x="32" y="42" width="36" height="38"/>
      <rect x="42" y="20" width="16" height="22"/>
      <path d="M40 20 L50 10 L60 20 Z"/>
      <rect x="28" y="80" width="44" height="4"/>
      <rect x="47" y="50" width="6" height="30" fill="#06030f"/>
    </g>
    <g fill="#06030f">
      <rect x="36" y="48" width="3" height="4"/><rect x="44" y="48" width="3" height="4"/>
      <rect x="58" y="48" width="3" height="4"/><rect x="62" y="48" width="3" height="4"/>
    </g>`,
  },
  {
    name:'中国科大', landmark:'理化大楼', region:'安徽', tier:'985', est:'1958',
    c1:'#1A3A8C', c2:'#00CED1',
    // 现代几何科研楼
    svg:`<g fill="currentColor">
      <path d="M22 78 L22 36 L78 36 L78 78 Z"/>
      <path d="M22 36 L50 18 L78 36 Z" opacity=".7"/>
      <rect x="44" y="50" width="12" height="28" fill="#06030f"/>
    </g>
    <g stroke="#00CED1" stroke-width="1" fill="none" opacity=".6">
      <line x1="30" y1="46" x2="40" y2="46"/><line x1="30" y1="54" x2="40" y2="54"/>
      <line x1="60" y1="46" x2="70" y2="46"/><line x1="60" y1="54" x2="70" y2="54"/>
      <line x1="30" y1="62" x2="40" y2="62"/><line x1="60" y1="62" x2="70" y2="62"/>
    </g>`,
  },
  {
    name:'武汉大学', landmark:'老图书馆', region:'湖北', tier:'985', est:'1893',
    c1:'#6A0A0A', c2:'#FFB6C1',
    // 珞珈山老图 + 樱花
    svg:`<g fill="currentColor">
      <path d="M20 40 L50 22 L80 40 L80 44 L20 44 Z"/>
      <rect x="28" y="44" width="44" height="34"/>
      <rect x="44" y="50" width="12" height="28" fill="#06030f"/>
      <rect x="24" y="78" width="52" height="4"/>
    </g>
    <g fill="#FFB6C1">
      <circle cx="18" cy="30" r="2"/><circle cx="14" cy="36" r="2"/>
      <circle cx="82" cy="30" r="2"/><circle cx="86" cy="36" r="2"/>
      <circle cx="22" cy="24" r="1.5"/><circle cx="78" cy="24" r="1.5"/>
    </g>`,
  },
  {
    name:'华中科大', landmark:'南大门', region:'湖北', tier:'985', est:'1952',
    c1:'#0A4A4A', c2:'#C0C0C0',
    svg:`<g fill="currentColor">
      <rect x="24" y="40" width="52" height="38"/>
      <path d="M20 40 L50 20 L80 40 Z"/>
      <rect x="44" y="52" width="12" height="26" fill="#06030f"/>
      <rect x="20" y="78" width="60" height="4"/>
    </g>`,
  },
  {
    name:'四川大学', landmark:'行政楼', region:'四川', tier:'985', est:'1896',
    c1:'#7A5A0A', c2:'#D4AF37',
    svg:`<g fill="currentColor">
      <rect x="26" y="48" width="48" height="30"/>
      <path d="M26 48 L50 30 L74 48 Z"/>
      <rect x="42" y="56" width="16" height="22" fill="#06030f"/>
      <rect x="22" y="78" width="56" height="4"/>
    </g>`,
  },
  {
    name:'中山大学', landmark:'怀士堂', region:'广东', tier:'985', est:'1924',
    c1:'#0A3A6A', c2:'#D4AF37',
    // 怀士堂（红楼）
    svg:`<g fill="currentColor">
      <rect x="28" y="38" width="44" height="40"/>
      <path d="M24 38 L50 20 L76 38 Z"/>
      <rect x="44" y="50" width="12" height="28" fill="#06030f"/>
      <rect x="24" y="78" width="52" height="4"/>
    </g>
    <g fill="#06030f">
      <rect x="34" y="46" width="4" height="5"/><rect x="62" y="46" width="4" height="5"/>
    </g>`,
  },
  {
    name:'西安交大', landmark:'腾飞塔', region:'陕西', tier:'985', est:'1896',
    c1:'#5A0A6A', c2:'#C0C0C0',
    // 腾飞塔
    svg:`<g fill="currentColor">
      <path d="M46 16 L54 16 L56 24 L58 30 L58 76 L42 76 L42 30 L44 24 Z"/>
      <rect x="40" y="76" width="20" height="6"/>
      <rect x="36" y="82" width="28" height="4"/>
    </g>
    <g stroke="currentColor" stroke-width="1" opacity=".6">
      <line x1="44" y1="36" x2="56" y2="36"/>
      <line x1="44" y1="48" x2="56" y2="48"/>
      <line x1="44" y1="60" x2="56" y2="60"/>
    </g>`,
  },
  {
    name:'哈工大', landmark:'主楼', region:'黑龙江', tier:'985', est:'1920',
    c1:'#0A2A5A', c2:'#C0C0C0',
    // 苏式主楼
    svg:`<g fill="currentColor">
      <rect x="24" y="44" width="52" height="34"/>
      <path d="M24 44 L50 24 L76 44 Z"/>
      <rect x="38" y="52" width="24" height="26" fill="#06030f"/>
      <rect x="20" y="78" width="60" height="4"/>
      <rect x="48" y="14" width="4" height="10"/>
    </g>`,
  },
  {
    name:'同济大学', landmark:'大礼堂', region:'上海', tier:'985', est:'1907',
    c1:'#0A5A5A', c2:'#D4AF37',
    // 拱形大礼堂
    svg:`<g fill="currentColor">
      <path d="M18 50 Q50 22 82 50 L82 78 L18 78 Z"/>
      <rect x="14" y="78" width="72" height="4"/>
    </g>
    <g stroke="#06030f" stroke-width="1.2" opacity=".5">
      <path d="M30 50 Q50 30 70 50" fill="none"/>
      <line x1="50" y1="30" x2="50" y2="78"/>
    </g>`,
  },
  {
    name:'北航', landmark:'主楼', region:'北京', tier:'211', est:'1952',
    c1:'#1A2A8C', c2:'#00CED1',
    // 现代主楼 + 飞机意象
    svg:`<g fill="currentColor">
      <rect x="26" y="42" width="48" height="36"/>
      <path d="M26 42 L50 26 L74 42 Z"/>
      <rect x="44" y="52" width="12" height="26" fill="#06030f"/>
      <rect x="22" y="78" width="56" height="4"/>
    </g>
    <g fill="#00CED1" opacity=".8">
      <path d="M40 20 L60 20 L56 24 L44 24 Z"/>
      <path d="M48 16 L52 16 L52 28 L48 28 Z" opacity=".6"/>
    </g>`,
  },
  {
    name:'北理工', landmark:'中心教学楼', region:'北京', tier:'211', est:'1940',
    c1:'#5A1A0A', c2:'#D4AF37',
    svg:`<g fill="currentColor">
      <rect x="30" y="46" width="40" height="32"/>
      <path d="M28 46 L50 28 L72 46 Z"/>
      <rect x="44" y="54" width="12" height="24" fill="#06030f"/>
      <rect x="26" y="78" width="48" height="4"/>
      <rect x="48" y="16" width="4" height="12"/>
    </g>`,
  },
];
window.INTRO_LANDMARKS = INTRO_LANDMARKS;
