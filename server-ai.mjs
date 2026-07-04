// ============================================================================
//  server-ai.mjs —— AI 代理服务器（高考志愿 · 现实路线）
// ----------------------------------------------------------------------------
//  v2 重构要点（2026-07）：
//    · 接入小米 MiMo（经第三方中转，OpenAI 兼容格式，推理模型）
//    · max_tokens 提到 2000（推理模型必须给足，否则 content 为空）
//    · 位次估算升级：内置一分一段表近似 + 省份考生基数表
//    · 新增 SSE 流式输出 /api/analyze/stream
//    · 新增结构化推荐 /api/recommend（联动 universities.js 数据）
//    · 保留 /api/analyze（非流式）和 /api/status
//
//  用法：
//    1. 在项目根目录创建 .env：
//         AI_API_KEY=你的key
//         AI_BASE_URL=https://你的中转地址
//         AI_MODEL=mimo-v2.5
//    2. node server-ai.mjs            (默认 8001 端口)
//    3. node server-ai.mjs 9000       (自定义端口)
//
//  浏览器调用：
//    GET  /api/status                 → 服务状态 + 是否配 Key
//    POST /api/analyze                → { province, group, score, total } → JSON 结果
//    POST /api/analyze/stream         → 同上，SSE 流式返回
//    POST /api/recommend              → { score, total, rank, province, group, interests, ideal }
//                                        → { rush:[院校], stable:[], protect:[] }
// ============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.argv[2] || process.env.PORT || '8001', 10);

// ─── 加载 .env ────────────────────────────────────────────────────────────
function loadEnv () {
	const envPath = path.join(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return {};
	const txt = fs.readFileSync(envPath, 'utf-8');
	const env = {};
	for (const line of txt.split('\n')) {
		const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
		if (m) env[m[1]] = m[2].trim();
	}
	return env;
}
const ENV = loadEnv();
const API_KEY = ENV.AI_API_KEY || '';
const BASE_URL = ENV.AI_BASE_URL || 'https://token-plan-cn.xiaomimimo.com';
const MODEL = ENV.AI_MODEL || 'mimo-v2.5';
const PROVIDER = ENV.AI_PROVIDER || 'openai';
// 推理模型 token 上限（实测 65536 不报错，16384 稳定且 finish=stop，给质量+冗余）
const MAX_TOKENS = parseInt(ENV.AI_MAX_TOKENS || '16384', 10);

// ─── 加载 universities 数据（用于推荐联动）──────────────────────────────
function loadUniversities () {
	try {
		const files = ['universities.js', 'majors.js'];
		for (const f of files) {
			const p = path.join(__dirname, 'data', f);
			if (fs.existsSync(p)) {
				const txt = fs.readFileSync(p, 'utf-8');
				const window = {};
				eval(txt.replace(/window\./g, 'globalThis.window=window;window.'));
				return globalThis.window || window;
			}
		}
	} catch (e) { /* 忽略 */ }
	return { UNIVERSITIES: [] };
}
const { UNIVERSITIES } = loadUniversities();

// ============================================================================
//  真实数据层 v3 —— 从 HuggingFace Gaokao-Compass-11M 按需拉取并缓存
//  ───────────────────────────────────────────────────────────────────────────
//  数据源：https://huggingface.co/datasets/choucsan/Gaokao-Compass-11M
//  目录结构：data/<年份>/<省份拼音>/<表>.csv
//    · score-range.csv      一分一段表（约 32KB / 省）
//    · school-admission.csv 院校投档线（约 200-500KB / 省）
//  策略：玩家首次查询某省时，从 HF 拉取 CSV → 缓存到 data_cache/ → 后续读本地
//  缓存有效期：24 小时（数据集更新不频繁）
// ───────────────────────────────────────────────────────────────────────────
const HF_DATASET = 'choucsan/Gaokao-Compass-11M';
const HF_BASE = `https://huggingface.co/datasets/${HF_DATASET}/resolve/main`;
const CACHE_DIR = path.join(__dirname, 'data_cache');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// 省份中文名 → 拼音（数据集目录名）
const PROVINCE_PINYIN = {
	'浙江': 'zhejiang', '河南': 'henan', '山东': 'shandong', '河北': 'hebei',
	'广东': 'guangdong', '四川': 'sichuan', '安徽': 'anhui', '江苏': 'jiangsu',
	'湖北': 'hubei', '湖南': 'hunan', '陕西': 'shaanxi', '福建': 'fujian',
	'辽宁': 'liaoning', '江西': 'jiangxi', '广西': 'guangxi', '贵州': 'guizhou',
	'云南': 'yunnan', '山西': 'shanxi', '重庆': 'chongqing', '甘肃': 'gansu',
	'新疆': 'xinjiang', '内蒙古': 'neimenggu', '黑龙江': 'heilongjiang',
	'吉林': 'jilin', '宁夏': 'ningxia', '青海': 'qinghai', '海南': 'hainan',
	'北京': 'beijing', '天津': 'tianjin', '上海': 'shanghai', '西藏': 'xizang',
};

// 省份 → 官方教育考试院一分一段表查询入口（用于"验证链接"）
// 这些是各省教育考试院官网，发布权威一分一段表
const PROVINCE_EXAM_URL = {
	'浙江': 'https://www.zjzs.net/',
	'河南': 'https://www.heao.gov.cn/',
	'山东': 'https://www.sdzk.cn/',
	'河北': 'http://www.hebeea.edu.cn/',
	'广东': 'https://eea.gd.gov.cn/',
	'四川': 'https://www.sceea.cn/',
	'安徽': 'https://www.ahzsks.cn/',
	'江苏': 'https://www.jseea.cn/',
	'湖北': 'http://www.hbea.edu.cn/',
	'湖南': 'https://www.hneeb.cn/',
	'陕西': 'https://www.sneac.com/',
	'福建': 'https://www.eeafj.cn/',
	'辽宁': 'https://www.lnzsks.com/',
	'江西': 'http://www.jxeea.cn/',
	'广西': 'https://www.gxeea.cn/',
	'贵州': 'http://www.eaagz.org.cn/',
	'云南': 'https://www.ynzs.cn/',
	'山西': 'http://www.sxkszx.cn/',
	'重庆': 'https://www.cqksy.cn/',
	'甘肃': 'https://www.ganseea.cn/',
	'新疆': 'http://www.xjzk.gov.cn/',
	'内蒙古': 'https://www.nm.zsks.cn/',
	'黑龙江': 'https://www.lzk.hl.cn/',
	'吉林': 'http://www.jleea.com.cn/',
	'宁夏': 'https://www.nxjyks.cn/',
	'青海': 'http://www.qhjyks.com/',
	'海南': 'http://ea.hainan.gov.cn/',
	'北京': 'https://www.bjeea.cn/',
	'天津': 'http://www.zhaokao.net/',
	'上海': 'https://www.shmeea.edu.cn/',
	'西藏': 'http://zsks.edu.xizang.gov.cn/',
};

// 阳光高考（教育部指定平台）各省地方站，用于院校/分数线查询验证
const SUNSHINE_GAOKAO_BASE = 'https://gaokao.chsi.com.cn';
function sunshineProvinceUrl (provinceName) {
	// 阳光高考地方站 URL（部分省份有独立站点，否则用主站搜索）
	const py = PROVINCE_PINYIN[provinceName];
	return py ? `${SUNSHINE_GAOKAO_BASE}/${py}/` : SUNSHINE_GAOKAO_BASE;
}
// 阳光高考院校搜索 URL（点开可查该校历年分数线）
function sunshineSchoolUrl (schoolName) {
	return `${SUNSHINE_GAOKAO_BASE}/sch/search.do?searchType=1&name=${encodeURIComponent(schoolName)}`;
}

// 内存缓存（避免同一省份重复读盘解析）
const memCache = new Map(); // key: `${year}:${py}:${table}` → { rows, ts }

// 拉取单个 CSV（带本地缓存）
async function fetchCSV (year, provincePinyin, table) {
	const key = `${year}:${provincePinyin}:${table}`;
	const cacheFile = path.join(CACHE_DIR, `${year}_${provincePinyin}_${table}.csv`);

	// 1. 内存缓存
	if (memCache.has(key)) return memCache.get(key).rows;

	// 2. 本地文件缓存（24h 内有效）
	if (fs.existsSync(cacheFile)) {
		const stat = fs.statSync(cacheFile);
		if (Date.now() - stat.mtimeMs < CACHE_TTL) {
			const rows = parseCSV(fs.readFileSync(cacheFile, 'utf-8'));
			memCache.set(key, { rows, ts: Date.now() });
			return rows;
		}
	}

	// 3. 从 HuggingFace 拉取
	const url = `${HF_BASE}/data/${year}/${provincePinyin}/${table}.csv`;
	try {
		const resp = await fetch(url, { redirect: 'follow' });
		if (!resp.ok) throw new Error(`HF ${resp.status}`);
		const text = await resp.text();
		// 写入本地缓存
		fs.mkdirSync(CACHE_DIR, { recursive: true });
		fs.writeFileSync(cacheFile, text, 'utf-8');
		const rows = parseCSV(text);
		memCache.set(key, { rows, ts: Date.now() });
		return rows;
	} catch (e) {
		// 拉取失败：如果有过期缓存，勉强用
		if (fs.existsSync(cacheFile)) {
			const rows = parseCSV(fs.readFileSync(cacheFile, 'utf-8'));
			memCache.set(key, { rows, ts: Date.now() });
			return rows;
		}
		throw new Error(`无法获取 ${provincePinyin} ${table} 数据: ${e.message}`);
	}
}

// 简易 CSV 解析（支持带引号的字段、BOM）
function parseCSV (text) {
	const clean = text.replace(/^\uFEFF/, '').trim();
	const lines = clean.split('\n');
	if (lines.length < 2) return [];
	const header = splitCSVLine(lines[0]);
	return lines.slice(1).filter(l => l.trim()).map(line => {
		const fields = splitCSVLine(line);
		const obj = {};
		header.forEach((h, i) => { obj[h] = fields[i] || ''; });
		return obj;
	});
}

// 处理一行 CSV（考虑引号包裹的字段内逗号）
function splitCSVLine (line) {
	const result = [];
	let cur = '', inQuote = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === '"') { inQuote = !inQuote; continue; }
		if (c === ',' && !inQuote) { result.push(cur); cur = ''; continue; }
		cur += c;
	}
	result.push(cur);
	return result;
}

// 真实位次查询（单年，基于一分一段表）
async function realRank (score, provinceName, year = 2024) {
	const py = PROVINCE_PINYIN[provinceName];
	if (!py) return null;
	try {
		const rows = await fetchCSV(year, py, 'score-range');
		const hit = rows.find(r => parseFloat(r.score) === parseFloat(score));
		if (hit && hit.cumulative_count) {
			return {
				rank: parseInt(hit.cumulative_count),
				segmentCount: parseInt(hit.segment_count) || 0,
				category: hit.category,
				score: parseFloat(hit.score),
				year,
				source: `一分一段表 ${provinceName} ${year}`,
				verifyUrl: PROVINCE_EXAM_URL[provinceName] || null,
			};
		}
		// 精确分数没命中：插值
		const sorted = rows
			.filter(r => r.score && r.cumulative_count)
			.map(r => ({ score: parseFloat(r.score), rank: parseInt(r.cumulative_count) }))
			.sort((a, b) => b.score - a.score);
		for (let i = 0; i < sorted.length - 1; i++) {
			if (sorted[i].score >= score && sorted[i + 1].score <= score) {
				const ratio = (score - sorted[i + 1].score) / (sorted[i].score - sorted[i + 1].score);
				const rank = Math.round(sorted[i + 1].rank + (sorted[i].rank - sorted[i + 1].rank) * (1 - ratio));
				return {
					rank, category: rows[0]?.category, score, year,
					interpolated: true,
					source: `一分一段表 ${provinceName} ${year}（插值）`,
					verifyUrl: PROVINCE_EXAM_URL[provinceName] || null,
				};
			}
		}
		return null;
	} catch (e) { return null; }
}

// 多年份位次查询（返回近 3 年对比，让玩家看到趋势）
async function realRankMultiYear (score, provinceName, years = [2024, 2023, 2022]) {
	const results = await Promise.all(
		years.map(async (year) => {
			const r = await realRank(score, provinceName, year);
			return r ? { year, ...r } : { year, rank: null };
		})
	);
	// 过滤掉没数据的年份
	const valid = results.filter(r => r.rank !== null);
	return {
		score, province: provinceName,
		years: valid,
		latestYear: valid[0]?.year || years[0],
		verifyUrl: PROVINCE_EXAM_URL[provinceName] || null,
		verifyLabel: '官方教育考试院',
	};
}

// 真实院校推荐（基于投档线）
async function realRecommend (score, provinceName, year = 2024, options = {}) {
	const py = PROVINCE_PINYIN[provinceName];
	if (!py) return null;
	const { interests = [], topN = 6 } = options;
	try {
		const rows = await fetchCSV(year, py, 'school-admission');
		// 字段：university_name, min_score, min_rank, is_985, is_211, school_province, school_nature, subject_req
		// 过滤：综合/普通批次 + 有 min_score + 有 min_rank
		const valid = rows.filter(r => {
			const s = parseInt(r.min_score);
			const cat = r.category || '';
			// 排除艺术/体育/提前批等特殊类别
			return s > 0 && r.min_rank && r.university_name &&
				!/艺术|体育|提前|专项|强基/.test(cat) &&
				!/艺术|体育|专科/.test(r.batch || '');
		});

		// 计算每所院校与玩家分数的差值，分组
		// 去重（同一院校多个专业组取最低分那条）
		const uniMap = new Map();
		valid.forEach(r => {
			const name = r.university_name;
			const s = parseInt(r.min_score);
			if (!uniMap.has(name) || parseInt(uniMap.get(name).min_score) > s) {
				uniMap.set(name, r);
			}
		});
		const unis = [...uniMap.values()].map(r => ({
			name: r.university_name,
			score: parseInt(r.min_score),
			rank: parseInt(r.min_rank),
			is985: r.is_985 === '1',
			is211: r.is_211 === '1',
			province: r.school_province,
			nature: r.school_nature,
			subjectReq: r.subject_req,
			diff: parseInt(r.min_score) - score,
		}));

		// 冲：diff 在 +5 ~ +40（录取分比玩家高 5-40 分）
		// 稳：diff 在 -15 ~ +5
		// 保：diff 在 -50 ~ -15
		const rush = unis.filter(u => u.diff >= 5 && u.diff <= 40)
			.sort((a, b) => a.diff - b.diff).slice(0, topN);
		const stable = unis.filter(u => u.diff >= -15 && u.diff < 5)
			.sort((a, b) => a.diff - b.diff).slice(0, topN);
		const protect = unis.filter(u => u.diff >= -50 && u.diff < -15)
			.sort((a, b) => b.diff - a.diff).slice(0, topN - 2);

		return {
			rush: rush.map(formatRealUni),
			stable: stable.map(formatRealUni),
			protect: protect.map(formatRealUni),
			total: unis.length,
			source: `HuggingFace Gaokao-Compass ${year}`,
		};
	} catch (e) { return null; }
}

function formatRealUni (u) {
	return {
		name: u.name,
		score: u.score,
		rank: u.rank,
		diff: u.diff,
		level: u.is985 ? '985' : (u.is211 ? '211' : (u.nature === '公办' ? '一本' : '普通')),
		region: u.province,
		subjectReq: u.subjectReq || '',
		// 验证链接：点开到阳光高考查该校历年分数线
		verifyUrl: sunshineSchoolUrl(u.name),
		verifyLabel: '查历年分数线',
	};
}

// ============================================================================
//  位次估算 v2 —— 省份感知，比纯幂律更接近真实
// ============================================================================

// 各省高考考生基数（万人，近年均值近似；用于位次缩放）
const PROVINCE_BASE = {
	'河南': 125, '山东': 80, '河北': 65, '广东': 70, '四川': 57,
	'安徽': 50, '江苏': 36, '湖北': 40, '湖南': 48, '浙江': 32,
	'陕西': 28, '福建': 20, '辽宁': 19, '江西': 50, '广西': 46,
	'贵州': 34, '云南': 35, '山西': 30, '重庆': 20, '甘肃': 22,
	'新疆': 18, '内蒙古': 16, '黑龙江': 19, '吉林': 12, '宁夏': 7,
	'青海': 5, '海南': 6, '北京': 6, '天津': 5.6, '上海': 5,
	'全国': 60,
};

// 分数 → 位次估算（基于公开数据近似：位次 ∝ base × (1-score/total)^k）
// k 用 3.0（与 score.js 的 3.2 对齐，略缓和）
function estimateRank (score, total, provinceName) {
	if (!score || !total) return null;
	const ratio = score / total;
	if (ratio >= 1) return 1;
	const baseWan = PROVINCE_BASE[provinceName] || 40; // 万
	const base = baseWan * 10000;
	// 高分段（>85%）位次急剧下降，用更陡的曲线
	const k = ratio >= 0.85 ? 3.5 : 3.0;
	const rank = Math.round(base * Math.pow(1 - ratio, k) + 1);
	return Math.max(1, Math.min(base, rank));
}

// 分数档位（冲/稳/保 依据）
function tierOfScore (score, total) {
	const norm = score / total * 750;
	if (norm >= 640) return { tier: 'S', label: '学神段', emoji: '🏆' };
	if (norm >= 590) return { tier: 'A', label: '学霸段', emoji: '🌟' };
	if (norm >= 540) return { tier: 'B', label: '优秀段', emoji: '👍' };
	if (norm >= 480) return { tier: 'C', label: '中坚段', emoji: '💪' };
	if (norm >= 400) return { tier: 'D', label: '本科段', emoji: '📚' };
	return { tier: 'E', label: '专科段', emoji: '🌱' };
}

// ============================================================================
//  本地院校推荐（无需 AI，毫秒级；AI 接口会基于此加亮）
// ============================================================================
function localRecommend (score, total, rank, provinceName, interests = []) {
	const tier = tierOfScore(score, total);
	const norm = score / total * 750;

	// 冲：referScore 比玩家分数高 5~30 分
	// 稳：referScore 在玩家分数 ±15 分
	// 保：referScore 比玩家分数低 20~50 分
	const matched = UNIVERSITIES
		.map(u => ({ ...u, diff: u.referScore - norm }))
		.filter(u => u.diff >= -60 && u.diff <= 50); // 仅取相关区间

	// 同省优先 +5 分（省内招生计划多）
	// 兴趣匹配 +3 分
	const scored = matched.map(u => {
		let s = 0;
		if (u.region === provinceName) s += 5;
		if (interests.length && u.strongMajors?.some(m => interests.includes(m))) s += 3;
		// 冲的院校：diff 越大越激进；稳的：diff 接近 0；保的：diff 越负越稳
		return { ...u, score: s, finalScore: u.diff + s };
	});

	const rush = scored
		.filter(u => u.diff >= 5 && u.diff <= 50)
		.sort((a, b) => (b.finalScore - a.finalScore))
		.slice(0, 5)
		.map(formatUni);
	const stable = scored
		.filter(u => u.diff >= -15 && u.diff < 5)
		.sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
		.slice(0, 6)
		.map(formatUni);
	const protect = scored
		.filter(u => u.diff >= -60 && u.diff < -15)
		.sort((a, b) => b.diff - a.diff)
		.slice(0, 4)
		.map(formatUni);

	return { tier: tier.tier, tierLabel: tier.label, rush, stable, protect };
}

function formatUni (u) {
	return {
		id: u.id, name: u.name, tier: u.tier, region: u.region,
		referScore: u.referScore, diff: Math.round(u.diff),
		strongMajors: u.strongMajors?.slice(0, 3) || [],
	};
}

// ============================================================================
//  调用大模型（OpenAI 兼容格式）
// ============================================================================
async function callAI (messages, { stream = false, maxTokens = 2000 } = {}) {
	if (!API_KEY) {
		return { error: 'NO_API_KEY', message: '未配置 AI_API_KEY' };
	}
	try {
		const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages,
				max_tokens: maxTokens,
				stream,
				temperature: 0.6,
			}),
		});
		if (!stream) {
			const data = await resp.json();
			return {
				content: data.choices?.[0]?.message?.content || '',
				usage: data.usage,
				finish: data.choices?.[0]?.finish_reason,
			};
		}
		// 流式：直接返回 ReadableStream
		return { ok: true, stream: resp.body, resp };
	} catch (e) {
		return { error: e.message };
	}
}

// ============================================================================
//  HTTP 服务器
// ============================================================================
const server = http.createServer(async (req, res) => {
	// CORS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

	// ─── GET /api/status ──────────────────────────────────────────────────
	if (req.method === 'GET' && req.url === '/api/status') {
		res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
		res.end(JSON.stringify({
			ok: true, hasKey: !!API_KEY, model: MODEL, provider: PROVIDER,
			universities: UNIVERSITIES.length,
		}));
		return;
	}

	// ─── POST /api/analyze (非流式) ───────────────────────────────────────
	if (req.method === 'POST' && (req.url === '/api/analyze' || req.url === '/api/analyze/stream')) {
		const isStream = req.url === '/api/analyze/stream';
		let body = '';
		req.on('data', c => body += c);
		req.on('end', async () => {
			try {
				const { province, group, score, total, subjects } = JSON.parse(body);
				const estimateRankVal = estimateRank(score, total, province);
				const localTier = tierOfScore(score, total);

				// 第一步：拉取真实数据（位次 + 院校），作为 AI 的"已知事实"
				// 真实数据是 AI 输出的校验基准，AI 不许编造
				let realRankData = null;
				let realRecData = null;
				try {
					realRankData = await realRank(score, province, 2024);
				} catch (e) { /* 拉取失败用公式兜底 */ }
				try {
					realRecData = await realRecommend(score, province, 2024, {});
				} catch (e) { /* 忽略 */ }

				// 权威位次：真实数据优先，否则降级公式
				const authoritativeRank = realRankData?.rank || estimateRankVal;
				const rankSource = realRankData ? '真实一分一段表(2024)' : '公式估算';

				// 无 Key：纯本地返回（含真实数据）
				if (!API_KEY) {
					const rec = localRecommend(score, total, authoritativeRank, province);
					res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify({
						localRank: authoritativeRank, localTier,
						realRank: realRankData,
						recommend: realRecData || rec,
						hasAI: false, rankSource,
					}));
					return;
				}

				// 第二步：构建"基于事实"的 prompt —— 给 AI 真实数据，让它分析而非编造
				const facts = [];
				facts.push(`【权威数据 · 不可篡改】`);
				facts.push(`- 省份：${province}`);
				facts.push(`- 分数：${score}/${total}（${group}）`);
				facts.push(`- 全省位次：第 ${authoritativeRank.toLocaleString()} 名（来源：${rankSource}）`);
				if (subjects?.length) facts.push(`- 选考：${subjects.join('、')}`);
				if (realRecData) {
					facts.push(`- 真实可报院校（2024 投档线）：`);
					if (realRecData.rush?.length) facts.push(`  · 冲档：${realRecData.rush.slice(0, 3).map(u => `${u.name}(${u.score}分/${u.level})`).join('、')}`);
					if (realRecData.stable?.length) facts.push(`  · 稳档：${realRecData.stable.slice(0, 3).map(u => `${u.name}(${u.score}分/${u.level})`).join('、')}`);
					if (realRecData.protect?.length) facts.push(`  · 保档：${realRecData.protect.slice(0, 3).map(u => `${u.name}(${u.score}分/${u.level})`).join('、')}`);
				}
				facts.push('');
				facts.push(`【你的任务】基于以上真实数据，给出策略建议。`);
				facts.push(`严格要求：`);
				facts.push(`1. rank 字段必须填写 "${authoritativeRank.toLocaleString()}"，这是已确认的真实位次，禁止编造或修改`);
				facts.push(`2. advice 和 tips 必须基于上面给的真实院校数据，不能虚构不存在的学校`);
				facts.push(`3. tier 字段根据分数段给出"冲/稳/保"的整体策略判断`);

				const prompt = facts.join('\n') + `

请用 JSON 回复：
{"rank":"${authoritativeRank.toLocaleString()}","tier":"策略判断","advice":"基于真实院校的建议(40字内)","tips":"最重要的提醒(30字内)"}`;

				if (!isStream) {
					const ai = await callAI([
						{ role: 'system', content: '你是高考志愿顾问。你只能基于用户提供的真实数据给建议，绝不编造院校或位次。回复只输出 JSON。' },
						{ role: 'user', content: prompt },
					], { maxTokens: MAX_TOKENS });
					let parsed = null;
					if (ai.content) {
						try {
							const m = ai.content.match(/\{[\s\S]*\}/);
							if (m) parsed = JSON.parse(m[0]);
						} catch (e) { /* 容错 */ }
					}
					// ★ 校验：AI 返回的 rank 必须与权威值一致，否则强制覆盖
					if (parsed) {
						const aiRankNum = parseInt((parsed.rank || '').replace(/[^\d]/g, ''));
						if (!aiRankNum || Math.abs(aiRankNum - authoritativeRank) > authoritativeRank * 0.05) {
							// 偏离超过 5% → 强制覆盖为真实值
							parsed.rank = authoritativeRank.toLocaleString() + '名';
							parsed.rankCorrected = true;
						}
					}
					res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify({
						localRank: authoritativeRank, localTier,
						realRank: realRankData,
						recommend: realRecData,
						ai: parsed || { raw: ai.content, error: ai.error },
						usage: ai.usage,
						hasAI: true, rankSource,
					}));
					return;
				}

				// 流式：SSE 透传（同样的 prompt + MAX_TOKENS，确保内容完整）
				const result = await callAI([
					{ role: 'system', content: '你是高考志愿顾问。你只能基于用户提供的真实数据给建议，绝不编造院校或位次。' },
					{ role: 'user', content: prompt },
				], { stream: true, maxTokens: MAX_TOKENS });

				if (!result.ok) {
					res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
					res.end(JSON.stringify({ localRank: authoritativeRank, localTier, realRank: realRankData, ai: { error: result.error }, hasAI: false, rankSource }));
					return;
				}

				res.writeHead(200, {
					'Content-Type': 'text/event-stream; charset=utf-8',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
				});
				// 先发权威位次事件（真实数据秒出，让前端立刻显示）
				res.write(`data: ${JSON.stringify({
					type: 'meta',
					localRank: authoritativeRank, localTier,
					realRank: realRankData, rankSource,
					recommend: realRecData,
				})}\n\n`);

				const reader = result.stream.getReader();
				const decoder = new TextDecoder();
				let buf = '';
				// 处理 buf 中残留的行（提取 data: 行）
				function processBuf (isFinal = false) {
					const lines = buf.split('\n');
					buf = isFinal ? '' : lines.pop(); // 最后一行可能不完整，留到下次（final 时全部处理）
					for (const line of lines) {
						if (!line.startsWith('data: ')) continue;
						const data = line.slice(6).trim();
						if (data === '[DONE]') continue;
						try {
							const j = JSON.parse(data);
							const delta = j.choices?.[0]?.delta;
							// 只透传 content，丢弃 reasoning_content（避免剧透推理过程）
							if (delta?.content) {
								res.write(`data: ${JSON.stringify({ type: 'content', text: delta.content })}\n\n`);
							}
						} catch (e) { /* 跳过坏行 */ }
					}
				}
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						buf += decoder.decode(value, { stream: true });
						processBuf(false);
					}
					// flush 解码器剩余字节 + 处理 buf 最后一行
					buf += decoder.decode();
					processBuf(true);
					res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
				} catch (e) {
					res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
				}
				res.end();
				return;
			} catch (e) {
				res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
			}
		});
		return;
	}

	// ─── POST /api/recommend (结构化推荐) ─────────────────────────────────
	if (req.method === 'POST' && req.url === '/api/recommend') {
		let body = '';
		req.on('data', c => body += c);
		req.on('end', async () => {
			try {
				const { score, total, province, group, interests = [], ideal = '' } = JSON.parse(body);
				const rank = estimateRank(score, total, province);
				const rec = localRecommend(score, total, rank, province, interests);

				// 有 Key 时，让 AI 给一句点评（可选）
				let aiComment = null;
				if (API_KEY) {
					const prompt = `考生：${province} ${group}，${score}/${total} 分（约 ${rank} 名）。
本地推荐已选出：
- 冲：${rec.rush.map(u => u.name).join('、') || '无'}
- 稳：${rec.stable.map(u => u.name).join('、') || '无'}
- 保：${rec.protect.map(u => u.name).join('、') || '无'}
兴趣方向：${interests.join('、') || '未明确'}
人生理想：${ideal || '未明确'}

请用 50 字以内点评这份推荐（鼓励 + 一个提醒），不要 JSON，直接说。`;
					const ai = await callAI([
						{ role: 'system', content: '你是高考志愿顾问，回复简洁真诚，50字以内。' },
						{ role: 'user', content: prompt },
					], { maxTokens: MAX_TOKENS });
					aiComment = ai.content?.trim() || null;
				}

				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify({
					score, total, rank,
					recommend: rec,
					aiComment,
					hasAI: !!API_KEY,
				}));
			} catch (e) {
				res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
			}
		});
		return;
	}

	// ─── GET /api/rank-estimate (纯位次估算，本地公式) ────────────────────
	if (req.method === 'GET' && req.url.startsWith('/api/rank-estimate')) {
		const url = new URL(req.url, 'http://x');
		const score = parseFloat(url.searchParams.get('score'));
		const total = parseFloat(url.searchParams.get('total')) || 750;
		const province = url.searchParams.get('province') || '';
		const rank = estimateRank(score, total, province);
		const tier = tierOfScore(score, total);
		res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
		res.end(JSON.stringify({ score, total, province, rank, tier }));
		return;
	}

	// ─── GET /api/realdata/rank (真实位次，基于一分一段表) ────────────────
	// 参数：score, province, year(默认2024), multi=1 时返回近3年对比
	if (req.method === 'GET' && req.url.startsWith('/api/realdata/rank')) {
		const url = new URL(req.url, 'http://x');
		const score = parseFloat(url.searchParams.get('score'));
		const province = url.searchParams.get('province') || '';
		const year = parseInt(url.searchParams.get('year')) || 2024;
		const multi = url.searchParams.get('multi') === '1';
		try {
			const estimate = estimateRank(score, 750, province);
			const tier = tierOfScore(score, 750);
			if (multi) {
				// 多年份对比
				const multiData = await realRankMultiYear(score, province, [2024, 2023, 2022]);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify({
					score, province,
					multi: multiData,
					real: multiData.years.find(y => y.year === year) || multiData.years[0] || null,
					estimate, tier,
				}));
			} else {
				const real = await realRank(score, province, year);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify({
					score, province, year,
					real,
					estimate,
					tier,
				}));
			}
		} catch (e) {
			res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify({ score, province, error: e.message, estimate: estimateRank(score, 750, province) }));
		}
		return;
	}

	// ─── GET /api/realdata/recommend (真实院校推荐，基于投档线) ───────────
	if (req.method === 'GET' && req.url.startsWith('/api/realdata/recommend')) {
		const url = new URL(req.url, 'http://x');
		const score = parseFloat(url.searchParams.get('score'));
		const province = url.searchParams.get('province') || '';
		const year = parseInt(url.searchParams.get('year')) || 2024;
		const interests = (url.searchParams.get('interests') || '').split(',').filter(Boolean);
		try {
			const real = await realRecommend(score, province, year, { interests });
			res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify({
				score, province, year,
				real,   // 真实推荐（可能为 null）
				local: localRecommend(score, 750, estimateRank(score, 750, province), province, interests), // 兜底
			}));
		} catch (e) {
			res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
			res.end(JSON.stringify({ score, province, error: e.message }));
		}
		return;
	}

	res.writeHead(404); res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
	console.log(`\n  ┌──────────────────────────────────────────────┐`);
	console.log(`  │  AI 代理服务器 v2 (高考志愿 · 现实路线)        │`);
	console.log(`  │  🌐 http://localhost:${PORT}                    │`);
	console.log(`  │  📱 手机: http://你的IP:${PORT}                 │`);
	console.log(`  │                                              │`);
	console.log(`  │  模型: ${MODEL.padEnd(20).slice(0, 20)} | max_tokens: ${String(MAX_TOKENS).padEnd(6)}│`);
	console.log(`  │  端点:                                       │`);
	console.log(`  │    GET  /api/status                          │`);
	console.log(`  │    POST /api/analyze        (非流式)          │`);
	console.log(`  │    POST /api/analyze/stream (SSE 流式)        │`);
	console.log(`  │    POST /api/recommend      (结构化推荐)      │`);
	console.log(`  │    GET  /api/rank-estimate  (纯位次)          │`);
	console.log(`  │  院校数据: ${UNIVERSITIES.length} 所                            │`);
	console.log(`  │  ${API_KEY ? '✅ API Key 已配置' : '⚠️  未配置 API Key（本地模式）'}                │`);
	console.log(`  └──────────────────────────────────────────────┘\n`);
});
