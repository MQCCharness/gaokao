// ============================================================================
//  fetch-keri.mjs —— 用 Keri 装扮系统（lunalucid/Keri-Dressup-RenPy-Template）
//  的分层 PNG，合成出 4 主角 + 6 导师 × 多表情的真实二次元角色立绘。
//  素材经 jsdelivr CDN 下载，sharp 合成。全部为免费可用的原创角色组件。
//  用法: node lib/fetch-keri.mjs
//  输出: assets/characters/<id>/<id>_<expr>.png
// ============================================================================
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAW = 'https://cdn.jsdelivr.net/gh/lunalucid/Keri-Dressup-RenPy-Template@master/game/Create_Character';
const CACHE = '_keri_cache';

function fetch(url, dest){
	return new Promise((res,rej)=>{
		const f = fs.createWriteStream(dest);
		https.get(url, {timeout:25000}, r=>{
			if(r.statusCode!==200){f.close();try{fs.unlinkSync(dest);}catch(e){}return rej(new Error(r.statusCode));}
			r.pipe(f); f.on('finish',()=>{f.close();res(dest);});
		}).on('timeout',function(){this.destroy();f.close();try{fs.unlinkSync(dest);}catch(e){}rej('timeout');}).on('error',e=>{f.close();try{fs.unlinkSync(dest);}catch(_){}rej(e);});
	});
}
async function ensure(file){
	const p = path.join(CACHE, file);
	fs.mkdirSync(path.dirname(p), {recursive:true});
	if(fs.existsSync(p)) return p;
	const url = `${RAW}/${file}`;
	for(let i=0;i<4;i++){ try{ await fetch(url,p); return p; }catch(e){ if(i===3)throw e; await new Promise(r=>setTimeout(r,1000*(i+1))); } }
}

// 计算一张图层 PNG 的 alpha 边界框（在原图坐标系）
async function bboxOf(filePath){
	const {data,info} = await sharp(filePath).raw().toBuffer({resolveWithObject:true});
	const W=info.width,H=info.height;
	let minX=W,minY=H,maxX=0,maxY=0,found=false;
	for(let y=0;y<H;y++){ for(let x=0;x<W;x++){
		const a=data[(y*W+x)*4+3];
		if(a>30){found=true; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;}
	}}
	return found?{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1}:null;
}

// 合成：layers 从下到上叠加，自动裁剪到角色边界（去除多余透明边距）
// eyeLayer/mouthLayer：眼睛/嘴巴图层文件（用于记录 bbox 到 manifest）
async function compose(outPath, layers, eyeLayer, mouthLayer){
	const imgs = [];
	for(const f of layers){ try{ imgs.push(await ensure(f)); }catch(e){ console.warn('  skip',f); } }
	if(imgs.length<3) throw new Error('too few layers: '+layers.join(','));
	const meta = await sharp(imgs[0]).metadata();
	const W = meta.width, H = meta.height;
	const base = {create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}};
	const buf = await sharp(base).composite(imgs.map(i=>({input:i}))).png().toBuffer();

	// 记录眼睛/嘴巴图层在【原图】坐标系的 bbox
	let eyeBox=null, mouthBox=null;
	if(eyeLayer){ try{ const p=await ensure(eyeLayer); eyeBox=await bboxOf(p); }catch(e){} }
	if(mouthLayer){ try{ const p=await ensure(mouthLayer); mouthBox=await bboxOf(p); }catch(e){} }

	// 裁掉完全透明的边距（trim）—— 跳采样加速（每3像素取1）
	let minX=W,minY=H,maxX=0,maxY=0,found=false;
	const {data,info} = await sharp(buf).raw().toBuffer({resolveWithObject:true});
	for(let y=0;y<H;y+=3){ for(let x=0;x<W;x+=3){
		const a = data[(y*W+x)*4+3];
		if(a>10){ found=true; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
	}}
	fs.mkdirSync(path.dirname(outPath), {recursive:true});
	if(found) await sharp(buf).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1}).png().toFile(outPath);
	else await sharp(buf).png().toFile(outPath);

	// bbox 转换到裁剪后坐标系
	const shift = (b)=> b? {x:b.x-minX, y:b.y-minY, w:b.w, h:b.h} : null;
	return { eye: shift(eyeBox), mouth: shift(mouthBox) };
}

// 生成闭眼帧：在眼睛 bbox 处盖一条"闭眼弧线"（深色细椭圆 + 肤色覆盖眼睛中部）
async function genClosedEyes(spritePath, eyeBox, outPath){
	if(!eyeBox) return null;
	const meta = await sharp(spritePath).metadata();
	const W=meta.width,H=meta.height;
	// 构造一个覆盖眼睛区域的 SVG：上半保留，把眼睛区域用"闭眼线"盖掉
	// 闭眼 = 一条向下弯的深色弧线（眼睛闭合的样子）
	const ex=eyeBox.x, ey=eyeBox.y, ew=eyeBox.w, eh=eyeBox.h;
	// 左右眼：把眼睛 bbox 横向分两半
	const halfW = ew/2;
	const eyeY = ey + eh*0.5;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
		<!-- 用透明背景，只在眼睛区域画闭眼线 -->
		<defs>
			<clipPath id="leye"><rect x="${ex}" y="${ey}" width="${halfW}" height="${eh}"/></clipPath>
			<clipPath id="reye"><rect x="${ex+halfW}" y="${ey}" width="${halfW}" height="${eh}"/></clipPath>
		</defs>
		<!-- 左眼闭眼弧线 -->
		<g clip-path="url(#leye)">
			<path d="M${ex+4} ${eyeY} Q${ex+halfW/2} ${eyeY+eh*0.4} ${ex+halfW-4} ${eyeY}" stroke="#3a2a1a" stroke-width="${Math.max(3,eh*0.18)}" fill="none" stroke-linecap="round"/>
		</g>
		<!-- 右眼闭眼弧线 -->
		<g clip-path="url(#reye)">
			<path d="M${ex+halfW+4} ${eyeY} Q${ex+halfW+halfW/2} ${eyeY+eh*0.4} ${ex+ew-4} ${eyeY}" stroke="#3a2a1a" stroke-width="${Math.max(3,eh*0.18)}" fill="none" stroke-linecap="round"/>
		</g>
	</svg>`;
	const overlayBuf = Buffer.from(svg);
	await sharp(spritePath).composite([{input:overlayBuf, top:0, left:0}]).png().toFile(outPath);
	return outPath;
}

// 角色配方：固定 base+outfit+发色+眼色，表情通过 eyes/mouth/eyebrows 切换
// base1=浅肤色。发色编号：1=金,2=棕,3=黑,4=粉,5=紫,6=蓝,7=绿,8=红,9=银,10=橙,11=青,12=栗,13=白,14=薄荷,15=玫红
// 发型：hair1=长直, hair2=短, hair3=马尾, hair4=卷, hair5=双马尾
// 眼睛：eyes1/2/3 三种眼型 × 10色；mouth1-5 五种嘴型；eyebrows1-5
// 表情配方：normal/happy/sad/angry/surprised 由 (eyes, mouth, eyebrows) 组合
const CAST = {
	// 学姐·温 —— 紫色长发温柔（hair1_5 紫, base1, top2_3 紫裙）
	// 注：eyes 只有 1/2/3 三种眼型；表情差异主要靠嘴(mouth1-5)和眉(eyebrows1-5)
	senior: { base:'Base/base1.png', bottom:'Bottoms/bottom1_3.png', top:'Tops/top2_3.png',
		hair:'Hair/hair1_5.png', eyeColor:5,
		expr:{ normal:{e:1,m:1,b:1}, happy:{e:1,m:3,b:1}, sad:{e:1,m:4,b:3} } },
	// 学霸·凛 —— 蓝色短发理性（hair2_6 蓝, top3_2 蓝制服）
	rival: { base:'Base/base1.png', bottom:'Bottoms/bottom1_2.png', top:'Tops/top3_2.png',
		hair:'Hair/hair2_6.png', eyeColor:6,
		expr:{ normal:{e:1,m:1,b:1}, angry:{e:2,m:5,b:5}, happy:{e:1,m:3,b:1} } },
	// 死党·阿星 —— 橙色刺猬感短发（hair2_10 橙, top1_5 橙卫衣）
	buddy: { base:'Base/base2.png', bottom:'Bottoms/bottom1_5.png', top:'Tops/top1_5.png',
		hair:'Hair/hair4_10.png', eyeColor:10,
		expr:{ normal:{e:2,m:1,b:2}, happy:{e:1,m:3,b:2}, surprised:{e:3,m:5,b:4} } },
	// 导师·沈 —— 黑色短发专业（hair2_3 黑, top3_1 灰西装）
	guide: { base:'Base/base3.png', bottom:'Bottoms/bottom1_1.png', top:'Tops/top3_1.png',
		hair:'Hair/hair2_3.png', eyeColor:3,
		expr:{ normal:{e:1,m:1,b:1}, happy:{e:1,m:3,b:1}, sad:{e:1,m:4,b:3} } },
	// 6 位导师（元/灿/婉/驰/宁/老）—— 不同发色+服装
	mentor_yuan: { base:'Base/base1.png', bottom:'Bottoms/bottom1_1.png', top:'Tops/top3_4.png', hair:'Hair/hair3_1.png', eyeColor:1, expr:{ normal:{e:1,m:1,b:1} } },
	mentor_can:  { base:'Base/base1.png', bottom:'Bottoms/bottom1_4.png', top:'Tops/top2_5.png', hair:'Hair/hair5_8.png', eyeColor:8, expr:{ normal:{e:2,m:1,b:2} } },
	mentor_wan:  { base:'Base/base1.png', bottom:'Bottoms/bottom1_6.png', top:'Tops/top1_6.png', hair:'Hair/hair1_5.png', eyeColor:5, expr:{ normal:{e:3,m:1,b:1} } },
	mentor_chi:  { base:'Base/base2.png', bottom:'Bottoms/bottom1_2.png', top:'Tops/top1_3.png', hair:'Hair/hair4_7.png', eyeColor:7, expr:{ normal:{e:1,m:2,b:1} } },
	mentor_ning: { base:'Base/base1.png', bottom:'Bottoms/bottom1_3.png', top:'Tops/top2_6.png', hair:'Hair/hair2_6.png', eyeColor:6, expr:{ normal:{e:2,m:1,b:1} } },
	mentor_lao:  { base:'Base/base4.png', bottom:'Bottoms/bottom1_1.png', top:'Tops/top3_3.png', hair:'Hair/hair2_9.png', eyeColor:9, expr:{ normal:{e:1,m:1,b:1} } },
	// 注：凛/朝阳 改用 stella 立绘（女性，见 map-stella.mjs），不再用 Keri 合成
	// 系统（用一个中性形象）
	system: { base:'Base/base1.png', bottom:'Bottoms/bottom1_2.png', top:'Tops/top3_2.png', hair:'Hair/hair3_9.png', eyeColor:9, expr:{ normal:{e:1,m:1,b:1} } },
};

const COUNT = { senior:3, rival:3, buddy:3, guide:3, system:1 };

(async()=>{
	fs.mkdirSync(CACHE,{recursive:true});
	const manifest = {};   // { characterId: { expression: {eye:{x,y,w,h}, mouth:{...}, blink:'file.png'} } }
	let n=0;
	for(const [id,c] of Object.entries(CAST)){
		const exprs = COUNT[id] ? Object.keys(c.expr).slice(0,COUNT[id]) : Object.keys(c.expr);
		manifest[id] = {};
		for(const ex of exprs){
			const x = c.expr[ex];
			const eyeFile = `Eyes/eyes${x.e}_${c.eyeColor}.png`;
			const mouthFile = `Mouth/mouth${x.m}_1.png`;
			const layers = [ c.base, c.bottom, c.top, eyeFile, `Eyebrows/eyebrows${x.b}_1.png`, mouthFile, c.hair ];
			const out = path.join('assets/characters', id, `${id}_${ex}.png`);
			try{
				const boxes = await compose(out, layers, eyeFile, mouthFile);
				// 生成闭眼帧（基于这张立绘）
				let blinkFile = null;
				if(boxes.eye){
					blinkFile = `${id}_${ex}_blink.png`;
					await genClosedEyes(out, boxes.eye, path.join('assets/characters', id, blinkFile));
				}
				manifest[id][ex] = { eye: boxes.eye, mouth: boxes.mouth, blink: blinkFile };
				console.log('✓', id+'_'+ex, blinkFile?`(眨眼帧 ${blinkFile})`:'');
				n++;
			}
			catch(e){ console.error('✗', id+'_'+ex, e.message); }
		}
	}
	// 输出 manifest（前端用它定位眨眼遮罩 / 嘴型切换）
	fs.writeFileSync('assets/characters/_manifest.json', JSON.stringify(manifest,null,1));
	console.log(`\n生成 ${n} 张角色立绘 + 眨眼帧，manifest 已写入 assets/characters/_manifest.json`);
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
