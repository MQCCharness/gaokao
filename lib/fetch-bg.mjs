// 从 houkago_stella (MIT) 下载场景背景图 + BGM + 环境音 SE
// 画风与角色立绘完全统一（同一个项目），二次元 galgame 风格。
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'https://cdn.jsdelivr.net/gh/usakan2077/houkago_stella@master/assets';
const OUT_BG = 'assets/scenes';
const OUT_BGM = 'assets/music';
const OUT_SE = 'assets/sounds';

// 场景背景：stella key → 我们用的文件名（保留原 key 便于追溯）
// 选取逻辑：每关选最贴合剧情的氛围背景（昼夜/室内外）
const BGS = [
	['school_exterior_night.webp', 'scene-start.webp'],      // 开场：学校外观夜
	['school_gate.webp',           'scene-enroll.webp'],      // 入营：校门·樱（春昼）
	['rooftop.webp',                'scene-summon.webp'],      // 召唤：屋上·青空
	['classroom_night.webp',        'scene-score.webp'],       // 查分：教室夜·暗
	['library.webp',                'scene-mbti.webp'],        // MBTI：图书室
	['rooftop_night.webp',          'scene-vision.webp'],      // 理想：屋上·星空
	['protagonist_room_night.webp', 'scene-wish.webp'],        // 志愿：房间夜
	['cafeteria.webp',              'scene-chat.webp'],        // 聊天：食堂
	['rooftop_dawn.webp',           'scene-end.webp'],         // 结局：屋上·朝日
];

// BGM：每关一首贴合氛围的背景音乐
const BGMS = [
	['opening_piano.mp3',           'scene-start.mp3'],
	['daily_life.mp3',              'scene-enroll.mp3'],
	['mystery_shadow.mp3',          'scene-summon.mp3'],
	['predawn_tension.mp3',         'scene-score.mp3'],
	['library_quiet.mp3',           'scene-mbti.mp3'],
	['night_melody.mp3',            'scene-vision.mp3'],
	['spring_breeze.mp3',           'scene-wish.mp3'],
	['sunday_afternoon.mp3',        'scene-chat.mp3'],
	['epilogue_sunset_for_each.mp3','scene-end.mp3'],
	['title.mp3',                   'main-menu.mp3'],
];

// 环境音 SE（可选，用于增强沉浸感）
const SES = [
	['city_morning.mp3',     'env-city.mp3'],
	['classroom_noise.mp3',  'env-classroom.mp3'],
	['chime_soft.mp3',       'env-chime.mp3'],
	['evening_wind.mp3',     'env-wind.mp3'],
];

function fetch(url, dest){
  return new Promise((res,rej)=>{
    const f = fs.createWriteStream(dest);
    https.get(url, {timeout:60000}, r=>{
      if(r.statusCode!==200){f.close();try{fs.unlinkSync(dest);}catch(e){}return rej(new Error(r.statusCode));}
      r.pipe(f); f.on('finish',()=>{f.close();res(dest);});
    }).on('timeout',function(){this.destroy();f.close();try{fs.unlinkSync(dest);}catch(e){}rej('timeout');}).on('error',e=>{f.close();try{fs.unlinkSync(dest);}catch(_){}rej(e);});
  });
}

async function dlList(items, srcDir, outDir, label){
	fs.mkdirSync(outDir, {recursive:true});
	let ok=0, fail=0;
	for(const [src, dst] of items){
		const dest = path.join(outDir, dst);
		if(fs.existsSync(dest) && fs.statSync(dest).size > 1000){ console.log(`  ✓ ${dst} (已有)`); ok++; continue; }
		const url = `${RAW}/${srcDir}/${src}`;
		for(let i=0;i<3;i++){
			try{ await fetch(url, dest); console.log(`  ✓ ${dst}`); ok++; break; }
			catch(e){ if(i===2){ console.warn(`  ✗ ${src} → ${e.message||e}`); fail++; } else await new Promise(r=>setTimeout(r,1000)); }
		}
	}
	console.log(`${label}: ${ok} 成功, ${fail} 失败`);
}

console.log('=== 下载场景背景 (WebP, 二次元 galgame) ===');
await dlList(BGS, 'images/bg', OUT_BG, '背景');

console.log('\n=== 下载 BGM (背景音乐) ===');
await dlList(BGMS, 'audio/bgm', OUT_BGM, 'BGM');

console.log('\n=== 下载环境音 SE ===');
await dlList(SES, 'audio/se', OUT_SE, 'SE');

console.log('\n完成。来源：houkago_stella (MIT, usakan2077)');
