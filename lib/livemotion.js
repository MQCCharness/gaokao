/**
 * ============================================================================
 *  Livemotion —— 让立绘"活起来"
 *  - 呼吸/待机：CSS 给立绘加轻微上下浮动（@keyframes lm-breathe）
 *  - 配音 blip：检测 text-box 的 who（当前说话角色），新对话播放短促合成音
 *
 *  注：程序合成的「眨眼层 / 嘴型层」实测与真实立绘不够贴合，已停用。
 *      立绘本身已足够，只保留 CSS 呼吸 + 对话 blip。
 * ============================================================================
 */
'use strict';
(function () {
	let observer = null;
	let lastText = '';

	// —— 说话状态：检测 text-box 的 who，播 galgame 风格 blip ——
	// ★ 语音锁定：GK.voice 播放真人配音时，临时阻止 text-box 点击推进（避免撕裂感）
	// 玩家仍可按 Ctrl 强制跳过（解锁）
	function updateTalking() {
		try {
			const whoEl = document.querySelector('[data-ui="who"]');
			const tbEl = document.querySelector('.text-box__inner, text-box');
			const who = whoEl ? (whoEl.getAttribute('data-character') || whoEl.innerText || '').trim() : '';
			const text = tbEl ? tbEl.innerText : '';
			// 新对话 → 播放提示音（仅当有说话角色立绘时，避免系统旁白噪音）
			if (text && text !== lastText) {
				lastText = text;
				// 如果 GK.voice 正在播放真人配音，跳过 blip（避免重叠）
				const voicePlaying = window.GK && GK._voicePlaying;
				if (voicePlaying) return;
				const hasCharSprite = who && document.querySelector(`img[data-character="${who}"]`);
				if (hasCharSprite && window.SFX) { try { SFX.play('voice'); } catch (e) {} }
			}
		} catch (e) {}
	}

	// —— 给一张立绘 img 装上呼吸动画 ——
	function attach(img) {
		if (!img.getAttribute('data-character')) return;
		img.classList.add('lm-breathing'); // CSS @keyframes lm-breathe
	}

	const attachedSet = new WeakSet(); // 已 attach 过的 img，避免重复处理触发 observer 循环
	let pendingScan = false;

	function scanAll() {
		document.querySelectorAll('img[data-character]').forEach(img => {
			if (attachedSet.has(img)) return;
			attachedSet.add(img);
			attach(img);
		});
	}

	function start() {
		// 监听 DOM：立绘出现时加呼吸 class。
		// 关键：attach 写 DOM（加 class）会触发 observer，用「去抖 + 已处理集合」双重防护，
		// 避免 observer → attach → DOM 写 → observer 死循环。
		observer = new MutationObserver(() => {
			if (pendingScan) return;
			pendingScan = true;
			requestAnimationFrame(() => {
				pendingScan = false;
				scanAll();
				updateTalking();
			});
		});
		observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-sprite'] });

		// 说话检测（高频轮询，播 galgame blip 音效）
		setInterval(updateTalking, 400);
	}

	// 等 Monogatari 初始化后启动
	if (document.readyState === 'complete') start();
	else window.addEventListener('load', start);

	window.Livemotion = { start, scanAll };
})();
