/**
 * GK Loader —— 游戏启动预加载器
 * ----------------------------------------------------------------------------
 * 在 monogatari 引擎渲染前，先显示美观的加载界面，分阶段预加载关键资源，
 * 加载完成后淡入游戏主菜单。
 *
 * 工作原理：
 * 1. 在 <head> 最前面运行（defer），document.body 一就绪就插入加载层
 * 2. 用 fetch() + cache:bypass 拉取资源清单里的文件（让浏览器缓存生效）
 * 3. 每个文件完成更新进度条，全部完成后淡出
 * 4. 用 CSS 隐藏 <visual-novel> 直到加载完成
 *
 * 资源清单：lib/preload-manifest.json（由 _loader_gen/scan.mjs 生成）
 */
(function () {
	'use strict';

	// ─── 加载清单（内嵌，避免额外请求）───
	// 只列关键资源：场景图 + BGM + 核心立绘
	const PRELOAD = {"scenes":["assets/scenes/campus-map.svg","assets/scenes/scene-bedroom.webp","assets/scenes/scene-chat.webp","assets/scenes/scene-corridor.webp","assets/scenes/scene-end.webp","assets/scenes/scene-enroll.webp","assets/scenes/scene-gym.webp","assets/scenes/scene-home.webp","assets/scenes/scene-lightning.webp","assets/scenes/scene-map.svg","assets/scenes/scene-mbti.webp","assets/scenes/scene-office.webp","assets/scenes/scene-rain-office.webp","assets/scenes/scene-rent-room.webp","assets/scenes/scene-river.webp","assets/scenes/scene-score.webp","assets/scenes/scene-stargaze.webp","assets/scenes/scene-start.webp","assets/scenes/scene-subway.webp","assets/scenes/scene-summon.webp","assets/scenes/scene-vision.webp","assets/scenes/scene-wish.webp","assets/montage/photo_1.png","assets/montage/photo_2.png","assets/montage/photo_3.png","assets/montage/photo_4.png","assets/montage/photo_5.png","assets/montage/photo_6.png","assets/visions/vision_altman.png","assets/visions/vision_feifei.png","assets/visions/vision_huang.png","assets/visions/vision_leijun.png","assets/visions/vision_luoyh.png","assets/visions/vision_musk.png","assets/visions/vision_zhouhy.png","assets/visions/vision_zuck.png"],"music":["assets/music/main-menu.mp3","assets/music/scene-chat.mp3","assets/music/scene-end.mp3","assets/music/scene-enroll.mp3","assets/music/scene-mbti.mp3","assets/music/scene-score.mp3","assets/music/scene-start.mp3","assets/music/scene-summon.mp3","assets/music/scene-vision.mp3","assets/music/scene-wish.mp3"],"characters":["assets/characters/senior/senior_happy.png","assets/characters/senior/senior_normal.png","assets/characters/senior/senior_sad.png","assets/characters/rival/rival_angry.png","assets/characters/rival/rival_happy.png","assets/characters/rival/rival_normal.png","assets/characters/buddy/buddy_happy.png","assets/characters/buddy/buddy_normal.png","assets/characters/buddy/buddy_surprised.png","assets/characters/buddy_sports/buddy_sports_happy.png","assets/characters/buddy_sports/buddy_sports_normal.png","assets/characters/guide/guide_happy.png","assets/characters/guide/guide_normal.png","assets/characters/guide/guide_sad.png","assets/characters/fam_mom/fam_mom_normal.png","assets/characters/fam_dad/fam_dad_angry.png","assets/characters/fam_dad/fam_dad_normal.png","assets/characters/fam_aunt/fam_aunt_normal.png","assets/characters/tch_lee/tch_lee_angry.png","assets/characters/tch_lee/tch_lee_happy.png","assets/characters/tch_lee/tch_lee_normal.png","assets/characters/tch_lee/tch_lee_sad.png","assets/characters/tch_wang/tch_wang_angry.png","assets/characters/tch_wang/tch_wang_normal.png","assets/characters/classmate_lin/classmate_lin_normal.png","assets/characters/classmate_xyu/classmate_xyu_normal.png","assets/characters/classmate_dazhi/classmate_dazhi_angry.png","assets/characters/classmate_dazhi/classmate_dazhi_normal.png"],"voices":[]};

	// ─── DOM 注入 ───
	function injectLoader() {
		if (document.getElementById('gk-loader')) return;
		const css = `
#gk-loader {
	position: fixed; inset: 0; z-index: 99999;
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	background: linear-gradient(135deg, #0a0e27 0%, #1a1040 40%, #2d1b4e 70%, #0a0e27 100%);
	color: #fff; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
	transition: opacity 0.8s ease;
	overflow: hidden;
}
#gk-loader.gk-loader--done { opacity: 0; pointer-events: none; }

/* 背景星空粒子 */
#gk-loader::before {
	content: ''; position: absolute; inset: 0;
	background-image:
		radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.8), transparent),
		radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.6), transparent),
		radial-gradient(1.5px 1.5px at 80% 20%, rgba(255,220,150,0.7), transparent),
		radial-gradient(1px 1px at 30% 80%, rgba(180,200,255,0.5), transparent),
		radial-gradient(2px 2px at 90% 60%, rgba(255,255,255,0.7), transparent),
		radial-gradient(1px 1px at 45% 45%, rgba(255,200,200,0.4), transparent),
		radial-gradient(1.5px 1.5px at 10% 60%, rgba(200,220,255,0.6), transparent);
	background-size: 100% 100%;
	animation: gk-loader-twinkle 4s ease-in-out infinite;
}
@keyframes gk-loader-twinkle {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 1; }
}

/* 流光带 */
#gk-loader::after {
	content: ''; position: absolute;
	width: 200%; height: 200%;
	background: conic-gradient(from 0deg at 50% 50%,
		transparent 0deg, rgba(127,90,240,0.08) 60deg,
		transparent 120deg, rgba(255,200,100,0.06) 180deg,
		transparent 240deg, rgba(44,182,125,0.06) 300deg, transparent 360deg);
	animation: gk-loader-spin 20s linear infinite;
	top: -50%; left: -50%;
}
@keyframes gk-loader-spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.gk-loader__inner {
	position: relative; z-index: 2;
	display: flex; flex-direction: column; align-items: center;
	gap: 28px; padding: 0 24px;
}

/* 游戏标题 */
.gk-loader__title {
	font-size: 2.2em; font-weight: 300; letter-spacing: 8px;
	text-align: center;
	background: linear-gradient(90deg, #ffd98a, #ff9ecd, #9ecdff, #ffd98a);
	background-size: 300% 100%;
	-webkit-background-clip: text; background-clip: text;
	-webkit-text-fill-color: transparent;
	animation: gk-loader-shimmer 3s linear infinite;
	text-shadow: 0 0 40px rgba(255,200,150,0.3);
}
@keyframes gk-loader-shimmer {
	from { background-position: 0% 50%; }
	to { background-position: 300% 50%; }
}
.gk-loader__subtitle {
	font-size: 0.9em; color: #9ab; letter-spacing: 4px;
	font-weight: 300;
}

/* 进度条容器 */
.gk-loader__bar-wrap {
	width: min(420px, 80vw);
	position: relative;
}
.gk-loader__bar {
	width: 100%; height: 6px;
	background: rgba(255,255,255,0.1);
	border-radius: 3px; overflow: hidden;
	position: relative;
	box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
}
.gk-loader__bar-fill {
	height: 100%; width: 0%;
	background: linear-gradient(90deg, #7f5af0 0%, #ff9ecd 50%, #ffd98a 100%);
	border-radius: 3px;
	transition: width 0.4s cubic-bezier(.2,.7,.3,1);
	box-shadow: 0 0 12px rgba(255,200,150,0.6), 0 0 24px rgba(127,90,240,0.4);
	position: relative;
}
/* 进度条上的流光 */
.gk-loader__bar-fill::after {
	content: ''; position: absolute; inset: 0;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
	background-size: 50% 100%;
	animation: gk-loader-flow 1.5s linear infinite;
}
@keyframes gk-loader-flow {
	from { background-position: -50% 0; }
	to { background-position: 150% 0; }
}

/* 进度数字 */
.gk-loader__pct {
	text-align: center; margin-top: 12px;
	font-size: 0.85em; color: #c8d0e8;
	font-variant-numeric: tabular-nums;
	letter-spacing: 2px;
}
.gk-loader__pct b {
	font-size: 1.4em; font-weight: 700;
	color: #ffd98a;
}
.gk-loader__status {
	font-size: 0.78em; color: #789;
	margin-top: 4px; min-height: 1.2em;
	letter-spacing: 1px;
}

/* 装饰：转圈的笔尖图标 */
.gk-loader__icon {
	width: 56px; height: 56px;
	border: 2px solid rgba(255,217,138,0.3);
	border-top-color: #ffd98a;
	border-radius: 50%;
	animation: gk-loader-rotate 1.2s linear infinite;
	margin-bottom: 8px;
}
@keyframes gk-loader-rotate {
	to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
	.gk-loader__title { font-size: 1.6em; letter-spacing: 4px; }
	.gk-loader__bar-wrap { width: 85vw; }
}
`;
		const style = document.createElement('style');
		style.id = 'gk-loader-style';
		style.textContent = css;
		document.head.appendChild(style);

		const loader = document.createElement('div');
		loader.id = 'gk-loader';
		loader.innerHTML = `
			<div class="gk-loader__inner">
				<div class="gk-loader__icon"></div>
				<div>
					<div class="gk-loader__title">高考志愿 · 命运执笔人</div>
					<div class="gk-loader__subtitle">FATE OF GAOKAO</div>
				</div>
				<div class="gk-loader__bar-wrap">
					<div class="gk-loader__bar"><div class="gk-loader__bar-fill" id="gk-loader-fill"></div></div>
					<div class="gk-loader__pct"><b id="gk-loader-num">0</b>%</div>
					<div class="gk-loader__status" id="gk-loader-status">正在准备命运之卷…</div>
				</div>
			</div>
		`;
		document.body.appendChild(loader);

		// 隐藏 visual-novel（防止引擎先渲染出白屏）
		const vn = document.querySelector('visual-novel');
		if (vn) vn.style.visibility = 'hidden';
	}

	// ─── 资源加载 ───
	const STATUS_TEXTS = [
		'正在准备命运之卷…',
		'加载校园场景…',
		'唤醒角色立绘…',
		'调谐背景音乐…',
		'即将启程…',
	];

	async function loadOne(url) {
		try {
			const resp = await fetch(url, { cache: 'force-cache' });
			// 触发浏览器缓存（不读 body 也行，但读一下确保完整下载）
			if (resp.ok) await resp.blob();
			return true;
		} catch (e) {
			return false;
		}
	}

	async function preloadAll(onProgress) {
		const all = [
			...PRELOAD.scenes,
			...PRELOAD.characters,
			...PRELOAD.music,
		];
		// 打乱顺序避免单一类型阻塞太久（视觉上进度更均匀）
		const shuffled = all.slice().sort(() => Math.random() - 0.5);

		let done = 0;
		const total = shuffled.length;

		// 并发 6 个
		const CONCURRENCY = 6;
		const queue = shuffled.slice();

		async function worker() {
			while (queue.length) {
				const url = queue.shift();
				await loadOne(url);
				done++;
				const pct = Math.round((done / total) * 100);
				const statusIdx = Math.min(Math.floor(pct / 20), STATUS_TEXTS.length - 1);
				onProgress(pct, STATUS_TEXTS[statusIdx]);
			}
		}

		await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
	}

	// ─── 启动 ───
	function start() {
		injectLoader();
		const fill = document.getElementById('gk-loader-fill');
		const num = document.getElementById('gk-loader-num');
		const status = document.getElementById('gk-loader-status');

		// 给一个初始的"假进度"，让进度条不是死的 0%
		let displayPct = 0;
		let targetPct = 0;
		const startTime = Date.now();

		const tick = setInterval(() => {
			if (displayPct < targetPct) {
				displayPct = Math.min(targetPct, displayPct + Math.ceil((targetPct - displayPct) / 4));
				if (fill) fill.style.width = displayPct + '%';
				if (num) num.textContent = displayPct;
			}
		}, 100);

		preloadAll((pct, txt) => {
			targetPct = pct;
			if (status) status.textContent = txt;
		}).then(() => {
			// 保证 loader 至少展示 2.5 秒（避免一闪而过）
			const elapsed = Date.now() - startTime;
			const wait = Math.max(0, 2500 - elapsed);
			setTimeout(() => {
				targetPct = 100;
				if (status) status.textContent = '准备就绪！';
				setTimeout(() => {
					clearInterval(tick);
					if (fill) fill.style.width = '100%';
					if (num) num.textContent = '100';
					// 显示游戏
					const vn = document.querySelector('visual-novel');
					if (vn) vn.style.visibility = '';
					// 淡出 loader
					const loader = document.getElementById('gk-loader');
					if (loader) {
						loader.classList.add('gk-loader--done');
						setTimeout(() => loader.remove(), 900);
					}
				}, 600);
			}, wait);
		});
	}

	// DOM 就绪后启动
	if (document.body) start();
	else document.addEventListener('DOMContentLoaded', start);
})();
