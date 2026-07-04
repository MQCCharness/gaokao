'use strict';
/* global Monogatari, monogatari, GK, SFX */

/**
 * =============================================================================
 *  高考志愿 · 命运执笔人 —— Monogatari 入口
 *  - 片头快闪（名校剪影）作为「Start 标签首个语句」由函数触发，播放一次；
 *    不使用 SplashScreenLabel（避免与引擎 start-label 解析机制冲突）。
 *  - 首次用户交互后解锁 Web Audio。
 * =============================================================================
 **/

const { $_ready } = Monogatari;

// 播放片头快闪（只播一次，用 localStorage 记录）。
// 返回 Promise —— 在引擎 init 之后、剧本推进之前播放，独立于剧本语句流，
// 避免函数语句 return 字符串导致剧本卡死。
function playIntroOverlay () {
	return new Promise((resolve) => {
		try {
			if (localStorage.getItem('gk_intro_played')) { resolve(); return; }
			localStorage.setItem('gk_intro_played', '1');
		} catch (e) {}
		try { GK.sfx('whoosh'); } catch (e) {}
		const overlay = document.createElement('div');
		overlay.className = 'gk-intro-overlay';
		overlay.innerHTML = `
			<div class="gk-intro-overlay__bg"></div>
			<div class="gk-intro-flash">${GK.landmarkFlashHtml().replace('gk-intro', 'gk-intro-grid')}</div>
			<div class="gk-intro-overlay__title">
				<div class="gk-intro-overlay__title-main">高考志愿</div>
				<div class="gk-intro-overlay__title-sub">· 命运执笔人 ·</div>
			</div>
			<button class="gk-intro-overlay__skip">跳过 ▶</button>`;
		document.body.appendChild(overlay);
		const cleanup = () => {
			if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
			resolve();
		};
		overlay.querySelector('.gk-intro-overlay__skip').addEventListener('click', cleanup, { once: true });
		setTimeout(cleanup, 5200);
	});
}

$_ready(() => {
	// ★ 真实素材加载进度条：监听所有资源（img/audio/script/css）的加载，
	// 实时更新 loading-screen 的进度条 + 当前正在加载的文件名。
	// 这样用户能判断「是真卡死」还是「只是慢」。
	let _initDone = false;
	let _lastProgressTime = Date.now();
	let _lastProgress = 0;

	const updateProgressBar = (loaded, total, currentFile) => {
		const ls = document.querySelector('loading-screen, [data-component="loading-screen"]');
		if (!ls || ls.hasAttribute('data-hidden')) return;
		const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
		const bar = ls.querySelector('[data-content="progress"]');
		if (bar) bar.value = pct;
		const msg = ls.querySelector('[data-content="message"]');
		if (msg) msg.textContent = `加载素材中 ${pct}% (${loaded}/${total})${currentFile ? ' · ' + currentFile : ''}`;
		// 进度有变化就记录时间
		if (pct !== _lastProgress) { _lastProgress = pct; _lastProgressTime = Date.now(); }
	};

	// 收集所有需要加载的资源 URL（从 DOM 里的 script/link + 引擎 assets 声明）
	const allResources = [];
	document.querySelectorAll('script[src]').forEach(s => allResources.push(s.src));
	document.querySelectorAll('link[rel="stylesheet"][href]').forEach(l => allResources.push(l.href));
	// 角色立绘 + 背景图 + BGM（从 monogatari assets 声明里收集，引擎 init 后才有）
	let totalAssets = allResources.length;
	let loadedAssets = 0;
	let currentLoading = '';

	const markLoaded = (url) => {
		loadedAssets++;
		currentLoading = url.replace(/.*\//, '').slice(0, 30);
		updateProgressBar(loadedAssets, totalAssets, currentLoading);
	};

	// 用 PerformanceObserver 监听所有资源加载完成
	try {
		const po = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.decodedBodySize !== undefined || entry.transferSize !== undefined) {
					loadedAssets++;
					currentLoading = entry.name.replace(/.*\//, '').slice(0, 30);
				}
			}
			if (totalAssets > 0) updateProgressBar(Math.min(loadedAssets, totalAssets), totalAssets, currentLoading);
		});
		po.observe({ entryTypes: ['resource'] });
	} catch (e) {}

	// 引擎 init 后，收集 assets 声明里的资源并预加载（更新 totalAssets）
	const collectGameAssets = () => {
		try {
			const extra = [];
			// 角色立绘
			const chars = monogatari.characters ? monogatari.characters() : {};
			Object.values(chars).forEach(c => {
				if (c.sprites) Object.values(c.sprites).forEach(s => extra.push('assets/characters/' + c.Directory + '/' + s));
			});
			// 第一关背景 + BGM（其余按需加载，不进首屏进度）
			extra.push('assets/scenes/scene-start.webp');
			extra.push('assets/music/scene-start.mp3');
			extra.push('assets/music/main-menu.mp3');
			totalAssets += extra.length;
			updateProgressBar(loadedAssets, totalAssets, currentLoading);
			// 预加载这些（更新进度）
			extra.forEach(url => {
				if (url.endsWith('.mp3')) {
					const a = new Image(); // mp3 用 fetch 更准，但 Image 也能触发 resource entry
					fetch(url, { method: 'GET' }).then(() => markLoaded(url)).catch(() => markLoaded(url));
				} else {
					const img = new Image();
					img.onload = () => markLoaded(url);
					img.onerror = () => markLoaded(url);
					img.src = url;
				}
			});
		} catch (e) {}
	};

	// ★ 卡死检测：如果进度 15 秒没变化，认为卡死，强制进主菜单
	const stuckTimer = setInterval(() => {
		if (_initDone) { clearInterval(stuckTimer); return; }
		if (Date.now() - _lastProgressTime > 15000) {
			console.warn('[GK] 素材加载 15 秒无进展，判定卡死，强制进入主菜单（已加载 ' + _lastProgress + '%）');
			clearInterval(stuckTimer);
			forceHideLoading();
		}
	}, 2000);

	const forceHideLoading = () => {
		if (_initDone) return;
		const ls = document.querySelector('loading-screen, [data-component="loading-screen"]');
		if (ls && !ls.hasAttribute('data-hidden')) {
			ls.setAttribute('data-hidden', '');
			const ms = document.querySelector('main-screen, [data-component="main-screen"]');
			if (ms) ms.removeAttribute('data-hidden');
		}
	};

	monogatari.init('#monogatari').then(() => {
		_initDone = true;
		clearInterval(stuckTimer);
		collectGameAssets(); // 收集游戏资源加入进度统计
		// 首次交互解锁音频
		const unlock = () => { try { SFX.unlock(); } catch (e) {} };
		document.addEventListener('click', unlock, { once: true });
		document.addEventListener('keydown', unlock, { once: true });

		// ★★★ 彻底修复音频重叠：全局只允许一个 BGM 同时播放 ★★★
		// 引擎的 play music 切换曲目时，旧 Audio 可能没被正确停止 → 重叠。
		// 方案：用单例 BGM 播放器接管所有背景音乐，新曲播放前先停旧曲。
		window.__bgmPlayer = null; // 单例 Audio 元素
		window.__playBgm = function (src) {
			try {
				// 停掉旧的
				if (window.__bgmPlayer) {
					window.__bgmPlayer.pause();
					window.__bgmPlayer.currentTime = 0;
				}
				// 停掉引擎的 ambientPlayer（主菜单 BGM）
				if (window.monogatari && monogatari.ambientPlayer) {
					monogatari.ambientPlayer.pause();
				}
				// 新建单例播放器
				const a = new Audio(src);
				a.loop = true;
				a.volume = 0.5;
				a.play().catch(() => {}); // 无手势时静默失败
				window.__bgmPlayer = a;
			} catch (e) {}
		};
		window.__stopBgm = function () {
			try {
				if (window.__bgmPlayer) { window.__bgmPlayer.pause(); window.__bgmPlayer = null; }
				if (window.monogatari && monogatari.ambientPlayer) { monogatari.ambientPlayer.pause(); }
			} catch (e) {}
		};

		// ★ 修复音频重叠：监听主菜单是否隐藏（用户点「开始」进入游戏），
		// 一旦进入游戏就停止主菜单的 ambientPlayer BGM。
		// （引擎的主菜单 BGM 和游戏内 music 是两套独立 Audio，stop music 不影响 ambientPlayer）
		const stopAmbientOnGameStart = () => {
			try {
				const ms = document.querySelector('main-screen, [data-component="main-screen"]');
				// 主菜单隐藏 = 进入游戏
				if (ms && ms.hasAttribute('data-hidden')) {
					if (window.monogatari && monogatari.ambientPlayer) {
						monogatari.ambientPlayer.pause();
						monogatari.ambientPlayer.currentTime = 0;
					}
					if (gameStartObserver) gameStartObserver.disconnect();
				}
			} catch (e) {}
		};
		const gameStartObserver = new MutationObserver(stopAmbientOnGameStart);
		const ms = document.querySelector('main-screen, [data-component="main-screen"]');
		if (ms) gameStartObserver.observe(ms, { attributes: true, attributeFilter: ['data-hidden'] });
		// 兜底：也监听 game-screen 显示
		const gs = document.querySelector('game-screen, [data-component="game-screen"]');
		if (gs) gameStartObserver.observe(gs, { attributes: true, attributeFilter: ['data-hidden'] });

		// ★ SLG 标准操作：Ctrl 快进 + 滚轮翻历史 + 快捷键
		// 1) Ctrl 按住 = 快进（自动推进对话，每 120ms 一句；松开停止）
		let _ctrlHeld = false;
		let _skipTimer = null;
		const startSkip = () => {
			if (_skipTimer) return;
			_skipTimer = setInterval(() => {
				// 只在有 text-box 时推进（游戏内），不干扰主菜单/输入框
				const tb = document.querySelector('text-box');
				const hasInput = document.querySelector('text-input:not([data-hidden]) input');
				const hasChoice = (() => { const cc = document.querySelector('choice-container'); return cc && !cc.hasAttribute('data-hidden') && cc.querySelectorAll('button').length > 0; })();
				if (!tb || hasInput || hasChoice) { stopSkip(); return; } // 遇到 Choice/输入框自动停快进
				tb.click();
			}, 120);
		};
		const stopSkip = () => { if (_skipTimer) { clearInterval(_skipTimer); _skipTimer = null; } };
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Control' && !_ctrlHeld) { _ctrlHeld = true; startSkip(); }
		});
		document.addEventListener('keyup', (e) => {
			if (e.key === 'Control') { _ctrlHeld = false; stopSkip(); }
		});
		// 失焦时也停（避免 Alt+Tab 后还在快进）
		window.addEventListener('blur', () => { _ctrlHeld = false; stopSkip(); });

		// 2) 鼠标滚轮 = 回滚/前进对话历史（滚轮上=回滚，滚轮下=前进）
		//    Monogatari 引擎内置 back/forward action，滚轮触发它
		let _wheelLock = false;
		document.addEventListener('wheel', (e) => {
			// 只在游戏内（有 text-box 且无输入框/Choice）响应滚轮
			const tb = document.querySelector('text-box');
			const hasInput = document.querySelector('text-input:not([data-hidden]) input');
			if (!tb || hasInput) return;
			// 在 dialog-log / choice / 设置面板上滚动不拦截
			const target = e.target;
			if (target && target.closest('dialog-log, choice-container, settings-screen, load-screen, save-screen, .gk-map, .gk-gallery, .gk-status-overlay, .gk-shard')) return;
			if (_wheelLock) return;
			_wheelLock = true;
			setTimeout(() => { _wheelLock = false; }, 250); // 防抖
			if (e.deltaY < 0) {
				// 滚轮上 = 回滚（引擎 back action）
				try { monogatari.run('back'); } catch (err) {}
				e.preventDefault();
			} else if (e.deltaY > 0) {
				// 滚轮下 = 前进（推进对话）
				tb.click();
				e.preventDefault();
			}
		}, { passive: false });

		// 3) 快捷键：Space=推进，←=回滚，Ctrl=快进（上面已加）
		document.addEventListener('keydown', (e) => {
			if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
			const tb = document.querySelector('text-box');
			if (!tb) return;
			if (e.code === 'ArrowLeft' && !e.ctrlKey) {
				try { monogatari.run('back'); } catch (err) {}
				e.preventDefault();
			} else if (e.code === 'Space' && !e.ctrlKey) {
				const hasChoice = (() => { const cc = document.querySelector('choice-container'); return cc && !cc.hasAttribute('data-hidden') && cc.querySelectorAll('button').length > 0; })();
				if (!hasChoice) { tb.click(); e.preventDefault(); }
			}
		});

		// 引擎 init 完成后立即播放一次片头快闪覆盖层
		playIntroOverlay();

		// 语音开关浮动按钮（右下角，状态读 localStorage）
		const voiceBtn = document.createElement('button');
		voiceBtn.className = 'gk-voice-toggle' + (GK.voiceEnabled() ? '' : ' gk-voice-toggle--off');
		voiceBtn.innerHTML = GK.voiceEnabled() ? '🔊' : '🔇';
		voiceBtn.title = GK.voiceEnabled() ? '语音：开（点击关闭）' : '语音：关（点击开启）';
		voiceBtn.addEventListener('click', () => {
			GK.setVoiceEnabled(!GK.voiceEnabled());
		});
		document.body.appendChild(voiceBtn);
	}).catch((e) => {
		console.error('[GK] init 失败:', e);
		forceHideLoading();
	});
});
