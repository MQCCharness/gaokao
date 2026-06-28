// 从 houkago_stella (MIT) 下载 3 角色 × 多表情的完整立绘
// 每个角色独立的人，不同脸型/身材/发型 —— 解决"都长一样"
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'https://cdn.jsdelivr.net/gh/usakan2077/houkago_stella@master/assets/images/chars';
const OUT = 'assets/characters';

function fetch(url, dest){
  return new Promise((res,rej)=>{
    const f = fs.createWriteStream(dest);
    https.get(url, {timeout:25000}, r=>{
      if(r.statusCode!==200){f.close();try{fs.unlinkSync(dest);}catch(e){}return rej(new Error(r.statusCode));}
      r.pipe(f); f.on('finish',()=>{f.close();res(dest);});
    }).on('timeout',function(){this.destroy();f.close();try{fs.unlinkSync(dest);}catch(e){}rej('timeout');}).on('error',e=>{f.close();try{fs.unlinkSync(dest);}catch(_){}rej(e);});
  });
}

async function dl(charDir, expr, destDir){
  fs.mkdirSync(destDir, {recursive:true});
  const dest = path.join(destDir, expr+'.png');
  if(fs.existsSync(dest)) return;
  const url = `${RAW}/${charDir}/${expr}.png`;
  for(let i=0;i<4;i++){ try{ await fetch(url,dest); return; }catch(e){ if(i===3)throw e; await new Promise(r=>setTimeout(r,800)); } }
}

// 角色映射：stella 的 3 角色 + 变体 → 我们的主角/导师
// 真正不同的人只有 3 个（kotoha/mahiru/sakura），变体是换装
// 4 主角：senior=kotoha, rival=sakura, buddy=mahiru, guide=sakura_apron(成熟造型)
// 6 导师：用各变体区分造型
const CHARS = {
  kotoha:           ['normal','happy','sad','angry','surprised','shy','thinking'],
  kotoha_swimsuit:  ['normal','surprised','thinking'],
  mahiru:           ['normal','happy','sad','angry','surprised','shy','thinking'],
  mahiru_sports:    ['happy','normal'],
  mahiru_private:   ['happy','normal','sad','surprised','thinking'],
  mahiru_no_camera: ['crying','happy','normal','sad','surprised','thinking'],
  sakura:           ['normal','happy','sad','angry','surprised','shy','thinking'],
  sakura_apron:     ['blank','excited','happy','normal'],
  sakura_sports:    ['crying','excited','happy','normal','serious','shy','surprised','thinking'],
  sakura_swimsuit:  ['blank','excited','happy','normal','surprised','thinking'],
};

let n=0;
for(const [char, exprs] of Object.entries(CHARS)){
  for(const ex of exprs){
    try{ await dl(char, ex, path.join(OUT, '_stella_'+char)); console.log('✓', char+'/'+ex); n++; }
    catch(e){ console.warn('✗', char+'/'+ex, e.message); }
  }
}
console.log(`下载 ${n} 张立绘（houkago_stella, MIT）`);
