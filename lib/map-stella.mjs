// 把 houkago_stella 立绘映射到我们的角色目录
// + 为每张生成闭眼帧 + 输出 manifest（供 livemotion 用）
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'assets/characters';
const STELLA = (char) => path.join(SRC, '_stella_'+char);

// 映射：我们的角色 -> (stella角色, 表情映射)
// stella表情: normal,happy,sad,angry,surprised,shy,thinking,excited,crying,blank,serious,no_light_eyes
const MAP = {
  // 4 主角（尽量用不同的人；guide 复用 kotoha 泳装变体，与 senior 紫发制服区分）
  senior: { src:'kotoha', expr:{ normal:'normal', happy:'happy', sad:'sad' } },         // 学姐·温 → 紫发 kotoha 制服
  rival:  { src:'sakura', expr:{ normal:'normal', happy:'happy', angry:'angry' } },     // 学霸·凛 → 黑发 sakura
  buddy:  { src:'mahiru', expr:{ normal:'normal', happy:'happy', surprised:'surprised' } }, // 死党·阿星 → 棕发 mahiru
  guide:  { src:'kotoha_swimsuit', expr:{ normal:'normal', happy:'normal', sad:'normal' } }, // 导师·沈 → kotoha 泳装(造型区分)
  // 系统
  system: { src:'sakura_sports', expr:{ normal:'normal' } },
  // 6 导师 → 用各变体区分造型（避免与主角同造型同时出现）
  mentor_yuan: { src:'sakura_apron', expr:{ normal:'normal' } },
  mentor_can:  { src:'sakura_swimsuit', expr:{ normal:'normal' } },
  mentor_wan:  { src:'mahiru_private', expr:{ normal:'normal' } },
  mentor_chi:  { src:'sakura_sports', expr:{ normal:'normal' } },
  mentor_ning: { src:'mahiru_no_camera', expr:{ normal:'normal' } },
  mentor_lao:  { src:'mahiru_sports', expr:{ normal:'normal' } },
  // 凛/朝阳（女性，stella 立绘）—— 仅在导师画廊出现，与主角不同屏
  mentor_lingfeng: { src:'kotoha', expr:{ normal:'thinking', happy:'thinking', thinking:'thinking' } },  // 紫发冷峻
  mentor_zhaoyang: { src:'mahiru', expr:{ normal:'happy', happy:'happy', excited:'happy' } },            // 棕发阳光
  // 3 位 NPC 同学（走廊互动，stella 换装变体）
  classmate_lin:  { src:'kotoha_swimsuit', expr:{ normal:'normal' } },   // 林：高分，冷静
  classmate_xyu:  { src:'sakura_apron',    expr:{ normal:'normal' } },   // 小雨：同分，焦虑
  classmate_dazhi:{ src:'mahiru_no_camera',expr:{ normal:'normal' } },   // 大志：低分，丧
  // 家人 NPC（stella 换装变体）
  fam_mom:  { src:'sakura_apron',    expr:{ normal:'normal' } },   // 妈妈：围裙造型
  fam_dad:  { src:'kotoha_swimsuit', expr:{ normal:'thinking' } }, // 爸爸：冷峻思考
  fam_aunt: { src:'sakura',          expr:{ normal:'happy' } },    // 小姨：开朗
  // 老师 NPC
  tch_lee:  { src:'mahiru_private',  expr:{ normal:'normal' } },   // 李老师：私服温和
  tch_wang: { src:'kotoha',          expr:{ normal:'thinking' } }, // 王主任：精明
};

async function bboxOf(filePath){
  const {data,info}=await sharp(filePath).raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height;
  let minX=W,minY=H,maxX=0,maxY=0,found=false;
  for(let y=0;y<H;y+=3){ for(let x=0;x<W;x+=3){
    const a=data[(y*W+x)*4+3];
    if(a>30){found=true;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  }}
  return found?{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}:null;
}

// 探测眼睛区域：脸部上半（图片高度 18%-40%）里最深的横条
async function findEyes(filePath){
  const {data,info}=await sharp(filePath).raw().toBuffer({resolveWithObject:true});
  const W=info.width,H=info.height;
  let bestY=-1,bestScore=0;
  for(let y=Math.floor(H*0.15);y<H*0.42;y++){
    let dark=0;
    for(let x=Math.floor(W*0.15);x<W*0.85;x+=2){
      const i=(y*W+x)*4,a=data[i+3];if(a<50)continue;
      const r=data[i],g=data[i+1],b=data[i+2],lum=(r+g+b)/3;
      if(lum<110)dark++;
    }
    if(dark>bestScore){bestScore=dark;bestY=y;}
  }
  if(bestY<0)return null;
  return {x:Math.floor(W*0.18), y:bestY-Math.floor(H*0.04), w:Math.floor(W*0.64), h:Math.floor(H*0.09)};
}

async function genClosedEyes(spritePath, eyeBox, outPath){
  if(!eyeBox)return;
  const meta=await sharp(spritePath).metadata();
  const W=meta.width,H=meta.height,e=eyeBox;
  const halfW=e.w/2,eyeY=e.y+e.h*0.5,sw=Math.max(3,e.h*0.2);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><clipPath id="le"><rect x="${e.x}" y="${e.y}" width="${halfW}" height="${e.h}"/></clipPath>
    <clipPath id="re"><rect x="${e.x+halfW}" y="${e.y}" width="${halfW}" height="${e.h}"/></clipPath></defs>
    <g clip-path="url(#le)"><path d="M${e.x+5} ${eyeY} Q${e.x+halfW/2} ${eyeY+e.h*0.5} ${e.x+halfW-5} ${eyeY}" stroke="#2a1a0e" stroke-width="${sw}" fill="none" stroke-linecap="round"/></g>
    <g clip-path="url(#re)"><path d="M${e.x+halfW+5} ${eyeY} Q${e.x+halfW+halfW/2} ${eyeY+e.h*0.5} ${e.x+e.w-5} ${eyeY}" stroke="#2a1a0e" stroke-width="${sw}" fill="none" stroke-linecap="round"/></g></svg>`;
  await sharp(spritePath).composite([{input:Buffer.from(svg),top:0,left:0}]).png().toFile(outPath);
}

const manifest={};
let n=0;
for(const [id, cfg] of Object.entries(MAP)){
  manifest[id]={};
  const destDir=path.join(SRC,id);
  fs.mkdirSync(destDir,{recursive:true});
  for(const [ourExpr, stellaExpr] of Object.entries(cfg.expr)){
    const srcFile=path.join(STELLA(cfg.src), stellaExpr+'.png');
    if(!fs.existsSync(srcFile)){console.warn('缺失',srcFile);continue;}
    const destFile=path.join(destDir, `${id}_${ourExpr}.png`);
    fs.copyFileSync(srcFile,destFile);
    // 闭眼帧
    const eye=await findEyes(destFile);
    let blink=null;
    if(eye){blink=`${id}_${ourExpr}_blink.png`;await genClosedEyes(destFile,eye,path.join(destDir,blink));}
    const mouthBox=await (async()=>{try{return await bboxOf(STELLA(cfg.src)+'/../'+stellaExpr+'.png');}catch(e){return null;}})();
    manifest[id][ourExpr]={eye, mouth:null, blink};
    console.log('✓',id+'_'+ourExpr,'<-',cfg.src+'/'+stellaExpr, blink?'(眨眼)':'');
    n++;
  }
}
fs.writeFileSync(path.join(SRC,'_manifest.json'),JSON.stringify(manifest,null,1));
console.log(`\n映射 ${n} 张立绘，manifest 已更新`);
