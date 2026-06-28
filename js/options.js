/**
 * =======================================
 * Engine Settings
 *
 * Do not modify the ones marked with a *
 * Unless you know what you are doing
 * =======================================
 **/

'use strict';
/* global monogatari */

monogatari.settings({

	// 游戏名（用于本地存档命名空间，发布后请勿修改）
	'Name': '高考志愿 · 命运执笔人',

	// 语义化版本号
	'Version': '1.0.0',

	// 初始标签 *
	'Label': 'Start',

	// 自动存档槽位数
	'Slots': 10,

	// 多语言开关
	'MultiLanguage': false,

	'LanguageSelectionScreen': false,

	// 主菜单背景音乐（houkago_stella · title 主题曲）
	'MainScreenMusic': 'main-menu',

	'SaveLabel': '存档',
	'AutoSaveLabel': '自动存档',

	// 主菜单开关 *
	'ShowMainScreen': true,

	// 资源预加载（关掉：BGM/背景较多，全量预加载首屏很慢；改为按需加载每关资源）
	'Preload': false,

	// 自动存档间隔（分钟），0=关闭
	'AutoSave': 0,

	// Service Worker（离线缓存）
	'ServiceWorkers': false,

	// 背景图宽高比
	'AspectRatio': '16:9',
	'ForceAspectRatio': 'None',

	// 打字机动画
	// 打字机动画（true=有打字效果，Ctrl快进时可跳过；false=立即显示）
	'TypeAnimation': true,
	'InstantText': false,   // false=不立即显示，保留打字效果（Ctrl可快进）
	'NVLTypeAnimation': true,
	'NarratorTypeAnimation': true,
	'CenteredTypeAnimation': true,

	// 屏幕方向（横屏推荐）
	'Orientation': 'landscape',

	// 跳过功能（毫秒间隔），0=关闭引擎自带快进（我们用 Ctrl 键自定义快进更灵活）
	'Skip': 0,

	'AssetsPath': {
		'root': 'assets',
		'characters': 'characters',
		'icons': 'icons',
		'images': 'images',
		'music': 'music',
		'scenes': 'scenes',
		'sounds': 'sounds',
		'ui': 'ui',
		'videos': 'videos',
		'voices': 'voices',
		'gallery': 'gallery'
	},

	// 启动画面标签（暂关闭自定义片头快闪——见 main.js 的 IntroFlash；
	// 用主菜单「开始」自然进入 Start，避免与引擎 start-label 机制冲突）
	'SplashScreenLabel': '',

	// 存储引擎
	'Storage': {
		'Adapter': 'LocalStorage',
		'Store': 'GaokaoAgentData',
		'Endpoint': ''
	},

	// 是否允许回滚
	'AllowRollback': true,

	// 实验性特性
	'ExperimentalFeatures': false,

	// 存档截图
	'Screenshots': true
});

// 初始偏好设置
monogatari.preferences ({

	'Language': '简体中文',

	'Volume': {
		'Music': 0.7,
		'Voice': 1,
		'Sound': 0.8,
		'Video': 1
	},

	'Resolution': '1280x720',

	'TextSpeed': 25,

	'AutoPlaySpeed': 3
});